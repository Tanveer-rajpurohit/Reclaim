import { createHash, randomInt, randomBytes } from "node:crypto";
import { createClient } from "redis";
import { AppError } from "../../shared/errors.ts";

let client: ReturnType<typeof createClient> | undefined;
let connecting: Promise<void> | undefined;
export async function otpStore() {
  if (!client) {
    const url =
      process.env.REDIS_URL ||
      (process.env.NODE_ENV !== "production" ? "redis://127.0.0.1:63790" : "");
    if (!url)
      throw new AppError(
        503,
        "OTP_UNAVAILABLE",
        "Email verification is temporarily unavailable.",
      );
    client = createClient({
      url,
      socket: { connectTimeout: 3000, reconnectStrategy: false },
      disableOfflineQueue: true,
    });
    client.on("error", () =>
      console.error("The email verification Redis connection failed."),
    );
  }
  try {
    if (!client.isReady) {
      connecting ??= client
        .connect()
        .then(() => undefined)
        .finally(() => {
          connecting = undefined;
        });
      await connecting;
    }
    return client;
  } catch {
    throw new AppError(
      503,
      "OTP_UNAVAILABLE",
      "Email verification is temporarily unavailable. Please try again.",
    );
  }
}
export const otpKey = (userId: string) =>
  `${process.env.REDIS_PREFIX || "reclaim"}:email-otp:${userId}`;
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function issueOtp(userId: string) {
  const redis = await otpStore();
  const code = randomInt(0, 1000000).toString().padStart(6, "0");
  const salt = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 600000;
  await redis
    .multi()
    .del(otpKey(userId))
    .hSet(otpKey(userId), {
      hash: hash(`${salt}:${code}`),
      salt,
      attempts: "0",
    })
    .expire(otpKey(userId), 600)
    .exec();
  return { code, expiresAt: String(expiresAt) };
}
export async function checkOtp(userId: string, code: string) {
  const redis = await otpStore();
  const key = otpKey(userId);
  const salt = await redis.hGet(key, "salt");
  const expected = hash(`${salt}:${code}`);
  const result = await redis.eval(
    `
    if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
    local attempts = redis.call('HINCRBY', KEYS[1], 'attempts', 1)
    if attempts > 5 then redis.call('DEL', KEYS[1]); return -1 end
    if redis.call('HGET', KEYS[1], 'hash') == ARGV[1] then return 1 end
    if attempts == 5 then redis.call('DEL', KEYS[1]); return -1 end
    return 0
  `,
    { keys: [key], arguments: [expected] },
  );
  if (result !== 1)
    throw new AppError(
      400,
      "INVALID_OTP",
      result === -1
        ? "Too many incorrect codes. Request a new code."
        : "That code is incorrect or expired. Check your email or request a new code.",
    );
  return expected;
}
export async function clearOtp(userId: string, expected: string) {
  const redis = await otpStore();
  await redis.eval(
    `if redis.call('HGET', KEYS[1], 'hash') == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`,
    { keys: [otpKey(userId)], arguments: [expected] },
  );
}
export async function disconnectOtp() {
  if (client?.isOpen) await client.quit();
  client = undefined;
}
