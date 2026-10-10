import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { config } from "../../config/env.ts";
import { prisma, query, transaction, type DB } from "../../db/client.ts";
import { AppError, rule } from "../../shared/errors.ts";
import { email, password, parse } from "../../shared/validation.ts";

const derive = (value: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      value,
      salt,
      64,
      { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export const cookieName = "reclaim_session";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const randomToken = () => randomBytes(32).toString("base64url");
export interface Identity {
  id: string;
  email: string;
  verified: boolean;
  name: string;
}

export async function hashPassword(value: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(value, salt);
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
async function passwordMatches(value: string, stored: string) {
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = await derive(value, salt);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const dummyHash = hashPassword(randomToken());

export function sessionCookie(token: string, clear = false) {
  return `${cookieName}=${clear ? "" : token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 60 * 60 * 24 * 14}${config().production ? "; Secure" : ""}`;
}
export async function identity(request: Request): Promise<Identity | null> {
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const result = await prisma().session.findFirst({
    where: { token_hash: digest(token), expires_at: { gt: new Date() } },
    include: { user: true },
  });
  const row = result?.user;
  return row
    ? {
        id: row.id,
        email: row.email,
        name: row.name,
        verified: Boolean(row.verified_at),
      }
    : null;
}
export function requireIdentity(
  actor: Identity | null,
  verified = true,
): Identity {
  if (!actor)
    throw new AppError(401, "UNAUTHENTICATED", "Sign in to continue.");
  if (verified && !actor.verified)
    throw new AppError(
      403,
      "EMAIL_UNVERIFIED",
      "Verify your email before continuing.",
    );
  return actor;
}
export async function rateLimit(key: string, max: number, seconds: number) {
  const result = await query(
    prisma(),
    `INSERT INTO rate_limits(key,hits,reset_at) VALUES($1,1,now()+$2*interval '1 second')
    ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN rate_limits.reset_at<=now() THEN 1 ELSE rate_limits.hits+1 END,
    reset_at=CASE WHEN rate_limits.reset_at<=now() THEN now()+$2*interval '1 second' ELSE rate_limits.reset_at END RETURNING hits`,
    [digest(key), seconds],
  );
  if (result.rows[0]!.hits > max)
    throw new AppError(
      429,
      "RATE_LIMITED",
      "Too many attempts. Please try again later.",
    );
}
async function newSession(db: DB, userId: string) {
  const token = randomToken();
  await db.session.create({
    data: {
      token_hash: digest(token),
      user_id: userId,
      expires_at: new Date(Date.now() + 14 * 86400000),
    },
  });
  return token;
}
async function authMail(db: DB, userId: string, purpose: "verify" | "reset") {
  const token = randomToken();
  await db.authToken.deleteMany({ where: { user_id: userId, purpose } });
  await db.authToken.create({
    data: {
      token_hash: digest(token),
      user_id: userId,
      purpose,
      expires_at: new Date(
        Date.now() + (purpose === "verify" ? 24 : 1) * 3600000,
      ),
    },
  });
  await db.outbox.create({
    data: {
      id: randomUUID(),
      recipient_id: userId,
      template: purpose,
      payload: { token },
      dedupe_key: `auth:${purpose}:${digest(token)}`,
    },
  });
}
const registerSchema = z
  .object({ email, password, name: z.string().trim().min(2).max(40) })
  .strict();
const loginSchema = z
  .object({ email, password: z.string().min(1).max(128) })
  .strict();
export async function register(value: unknown) {
  const input = parse(registerSchema, value);
  await rateLimit(`register:${input.email}`, 5, 3600);
  await rateLimit("register:global", 100, 3600);
  const hash = await hashPassword(input.password);
  return transaction(async (db) => {
    const userId = randomUUID();
    const result = await db.user.createMany({
      data: [
        {
          id: userId,
          email: input.email,
          password_hash: hash,
          name: input.name,
        },
      ],
      skipDuplicates: true,
    });
    if (!result.count)
      return {
        message:
          "Check your email to verify your account, or sign in if you already registered.",
      };
    await authMail(db, userId, "verify");
    return {
      message: "Check your email to verify your account, then sign in.",
    };
  });
}
export async function login(value: unknown) {
  const input = parse(loginSchema, value);
  await rateLimit(`login:${input.email}`, 15, 900);
  await rateLimit("login:global", 500, 900);
  const result = await prisma().user.findUnique({
    where: { email: input.email },
  });
  const user = result;
  const matches = await passwordMatches(
    input.password,
    user?.password_hash || (await dummyHash),
  );
  if (!user || !matches)
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  if (!user.verified_at)
    throw new AppError(
      403,
      "EMAIL_UNVERIFIED",
      "Verify your email before signing in. You can request a new link below.",
    );
  return transaction(async (db) => {
    const locked = await query(
      db,
      "SELECT password_hash FROM users WHERE id=$1 FOR UPDATE",
      [user.id],
    );
    rule(
      locked.rows[0]!.password_hash === user.password_hash,
      "Your password changed. Sign in again.",
    );
    return { token: await newSession(db, user.id) };
  });
}
export async function logout(request: Request) {
  const token = (request.headers.get("cookie") || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  if (token)
    await prisma().session.deleteMany({ where: { token_hash: digest(token) } });
}
export async function sendAuthLink(
  value: unknown,
  purpose: "verify" | "reset",
) {
  const input = parse(z.object({ email }).strict(), value);
  await rateLimit(`${purpose}:${input.email}`, 3, 900);
  await rateLimit(`${purpose}:global`, 100, 900);
  await transaction(async (db) => {
    const found = await query(
      db,
      "SELECT id,verified_at FROM users WHERE email=$1 FOR UPDATE",
      [input.email],
    );
    const user = found.rows[0];
    if (user && (purpose === "reset" || !user.verified_at))
      await authMail(db, user.id, purpose);
  });
  return {
    message:
      "If that address is eligible, an email with the next step is on its way.",
  };
}
const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export async function consumeAuthToken(
  value: unknown,
  purpose: "verify" | "reset",
) {
  await rateLimit(`auth:consume:${purpose}`, 120, 900);
  const input = parse(
    z
      .object({
        token: tokenSchema,
        ...(purpose === "reset" ? { password } : {}),
      })
      .strict(),
    value,
  );
  const newPassword =
    "password" in input && typeof input.password === "string"
      ? await hashPassword(input.password)
      : undefined;
  return transaction(async (db) => {
    const result = await db.authToken.findFirst({
      where: {
        token_hash: digest(input.token),
        purpose,
        expires_at: { gt: new Date() },
      },
    });
    const userId = result?.user_id;
    if (!userId)
      throw new AppError(
        400,
        "INVALID_TOKEN",
        "This link is invalid or expired. Request a new one.",
      );
    await query(db, "SELECT id FROM users WHERE id=$1 FOR UPDATE", [userId]);
    const consumed = await db.authToken.deleteMany({
      where: {
        token_hash: digest(input.token),
        purpose,
        expires_at: { gt: new Date() },
      },
    });
    rule(consumed.count, "This link has already been used.");
    if (purpose === "verify")
      await db.user.updateMany({
        where: { id: userId, verified_at: null },
        data: { verified_at: new Date() },
      });
    else {
      await db.user.update({
        where: { id: userId },
        data: { password_hash: newPassword! },
      });
      await db.session.deleteMany({ where: { user_id: userId } });
      await db.authToken.deleteMany({
        where: { user_id: userId, purpose: "reset" },
      });
    }
    return {
      message:
        purpose === "verify"
          ? "Email verified. You can now sign in."
          : "Password updated. Sign in with your new password.",
    };
  });
}
