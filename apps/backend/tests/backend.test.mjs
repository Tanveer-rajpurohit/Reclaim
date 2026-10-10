import test, { before, after, mock } from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { createTestDatabase } from "../scripts/test-database.mjs";
import sharp from "sharp";

const root = resolve("../../.local/tests", randomUUID());
process.env.APP_URL = "http://localhost:3109";
process.env.LOCAL_DATA_DIR = root;
process.env.STORAGE_PROVIDER = "local";
process.env.MAIL_PROVIDER = "file";
process.env.REDIS_PREFIX = `reclaim-test:${randomUUID()}`;
let database;
let db, handle, processOutbox, disconnect;
let seller, buyer, competitor, stranger;

before(
  async () => {
    await mkdir(root, { recursive: true });
    database = await createTestDatabase();
    process.env.DATABASE_URL = database.url;
    const storage = await import("../src/db/client.ts");
    disconnect = storage.disconnect;
    db = () => ({
      query: (sql, values) => storage.query(storage.prisma(), sql, values),
    });
    ({ handle } = await import("../src/http/router.ts"));
    ({ processOutbox } = await import("../src/modules/mail/service.ts"));
    seller = await account("seller");
    buyer = await account("buyer");
    competitor = await account("competitor");
    stranger = await account("stranger");
  },
  { timeout: 120000 },
);
after(async () => {
  const { disconnectOtp } = await import("../src/modules/auth/otp.ts");
  await disconnectOtp();
  if (disconnect) await disconnect();
  if (database) await database.stop();
});
async function request(
  path,
  { user, method = "GET", body, key = randomUUID(), headers = {} } = {},
) {
  const req = new Request(`${process.env.APP_URL}/api/${path}`, {
    method,
    headers: {
      origin: process.env.APP_URL,
      ...(user ? { cookie: user.cookie } : {}),
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      "idempotency-key": key,
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await handle(req, path.split("/"));
  const data = await response.json();
  return {
    status: response.status,
    data,
    cookie:
      response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ") || undefined,
  };
}
test("email OTP expires after ten minutes, rejects wrong codes and is single-use under concurrency", async () => {
  const { otpStore, otpKey } = await import("../src/modules/auth/otp.ts");
  const redis = await otpStore();
  const email = `otp-${randomUUID()}@example.com`;
  const password = "long-test-password-123";
  assert.equal(
    (
      await request("auth/register", {
        method: "POST",
        body: { email, password, name: "OTP Account" },
      })
    ).status,
    201,
  );
  const found = await db().query(
    "SELECT u.id,o.payload FROM users u JOIN outbox o ON o.recipient_id=u.id WHERE u.email=$1 AND o.template='verify' ORDER BY o.created_at DESC LIMIT 1",
    [email],
  );
  const { id, payload } = found.rows[0];
  assert.match(payload.code, /^\d{6}$/);
  const ttl = await redis.ttl(otpKey(id));
  assert.ok(ttl > 590 && ttl <= 600);
  assert.equal(
    (await request("auth/login", { method: "POST", body: { email, password } }))
      .data.error.code,
    "EMAIL_UNVERIFIED",
  );
  assert.equal((await request(`users/${id}`)).data.person.verified, false);
  const wrong = payload.code === "000000" ? "111111" : "000000";
  assert.equal(
    (
      await request("auth/verify", {
        method: "POST",
        body: { email, code: wrong },
      })
    ).data.error.code,
    "INVALID_OTP",
  );
  const results = await Promise.all(
    [1, 2].map(() =>
      request("auth/verify", {
        method: "POST",
        body: { email, code: payload.code },
      }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
  assert.equal(await redis.exists(otpKey(id)), 0);
  assert.equal((await request(`users/${id}`)).data.person.verified, true);
  assert.equal(
    (await request("auth/login", { method: "POST", body: { email, password } }))
      .status,
    200,
  );
});

test("OTP attempt limits, expiry and resend invalidate previous verification codes", async () => {
  const { otpStore, otpKey } = await import("../src/modules/auth/otp.ts");
  const redis = await otpStore();
  const email = `otp-expiry-${randomUUID()}@example.com`;
  await request("auth/register", {
    method: "POST",
    body: { email, password: "long-test-password-123", name: "OTP Retry" },
  });
  const found = await db().query(
    "SELECT u.id,o.payload FROM users u JOIN outbox o ON o.recipient_id=u.id WHERE u.email=$1 AND o.template='verify' ORDER BY o.created_at DESC LIMIT 1",
    [email],
  );
  const { id, payload } = found.rows[0];
  const wrong = payload.code === "000000" ? "111111" : "000000";
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await request("auth/verify", {
          method: "POST",
          body: { email, code: wrong },
        })
      ).status,
      400,
    );
  assert.equal(await redis.exists(otpKey(id)), 0);
  assert.equal(
    (
      await request("auth/verify", {
        method: "POST",
        body: { email, code: payload.code },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("auth/resend", { method: "POST", body: { email } })).status,
    200,
  );
  const newest = await db().query(
    "SELECT payload FROM outbox WHERE recipient_id=$1 AND template='verify' AND status='pending'",
    [id],
  );
  assert.equal(newest.rows.length, 1);
  const newCode = newest.rows[0].payload.code;
  if (newCode !== payload.code)
    assert.equal(
      (
        await request("auth/verify", {
          method: "POST",
          body: { email, code: payload.code },
        })
      ).status,
      400,
    );
  await redis.pExpire(otpKey(id), 1);
  await setTimeout(10);
  assert.equal(
    (
      await request("auth/verify", {
        method: "POST",
        body: { email, code: newCode },
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("auth/resend", { method: "POST", body: { email } })).status,
    429,
  );
});

async function account(label) {
  const email = `${label}-${randomUUID()}@example.com`;
  const password = "long-test-password-123";
  const registered = await request("auth/register", {
    method: "POST",
    body: { email, password, name: label },
  });
  assert.equal(registered.status, 201);
  let delivered = 0;
  for (let attempt = 0; attempt < 20 && delivered === 0; attempt++) {
    delivered = await processOutbox();
    if (delivered === 0) await setTimeout(100);
  }
  assert.ok(delivered > 0, "Registration must enqueue a ready email job");
  const files = await readdir(join(root, "mail"));
  const messages = await Promise.all(
    files.map(async (file) =>
      JSON.parse(await readFile(join(root, "mail", file), "utf8")),
    ),
  );
  const message = messages.find(
    (m) => m.to === email && m.subject === "Verify your Reclaim email",
  );
  assert.ok(message, "Registration must produce a verification email");
  const code = message.text.match(/code is (\d{6})/)[1];
  assert.equal(
    (await request("auth/verify", { method: "POST", body: { email, code } }))
      .status,
    200,
  );
  const logged = await request("auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(logged.status, 200);
  assert.match(logged.cookie, /reclaim_session=/);
  const user = { cookie: logged.cookie, email, password };
  const me = await request("auth/session", { user });
  user.id = me.data.user.id;
  assert.equal(
    (
      await request("me", {
        user,
        method: "PATCH",
        body: {
          name: label,
          phone: "9876543210",
          area: "Rohini",
          buyerType: "reuse",
          interests: ["Wood"],
        },
      })
    ).status,
    200,
  );
  return user;
}
async function photo(user = seller) {
  const bytes = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#99aa66" },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.set("photo", new File([bytes], "photo.png", { type: "image/png" }));
  const response = await handle(
    new Request(`${process.env.APP_URL}/api/uploads`, {
      method: "POST",
      headers: { origin: process.env.APP_URL, cookie: user.cookie },
      body: form,
    }),
    ["uploads"],
  );
  assert.equal(response.status, 201, await response.clone().text());
  return (await response.json()).url;
}
test("photo analysis requires identity and upload ownership and returns editable drafts", async () => {
  const previous = { ...process.env };
  let calls = 0;
  const inference = mock.method(globalThis, "fetch", async () => {
    calls++;
    const response = {
      items: [
        {
          index: 0,
          name: "Wooden boards",
          description: "Visible wooden boards",
          category: "Wood",
          purpose: "Reuse",
          quantity: 2,
          condition: "Fair",
          hazards: "Inspect before collection",
        },
      ],
      warnings: ["Review the count"],
    };
    return Response.json({
      stopReason: "end_turn",
      output: { message: { content: [{ text: JSON.stringify(response) }] } },
    });
  });
  try {
    Object.assign(process.env, {
      BEDROCK_AGENT_ENABLED: "true",
      BEDROCK_CREDITS_CONFIRMED: "true",
      AWS_BEDROCK_API_KEY: "test-only",
      AWS_REGION: "ap-south-1",
      AWS_BEDROCK_MODEL_ID: "moonshotai.kimi-k2.5",
    });
    delete process.env.AWS_BEARER_TOKEN_BEDROCK;
    const image = await photo(seller);
    const body = { photoId: image.split("/").at(-1) };
    assert.equal(
      (await request("analysis", { method: "POST", body })).status,
      401,
    );
    assert.equal(
      (await request("analysis", { user: buyer, method: "POST", body })).status,
      404,
    );
    assert.equal(calls, 0);
    const result = await request("analysis", {
      user: seller,
      method: "POST",
      body,
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.items[0].image, image);
    assert.equal(result.data.items[0].price, 0);
    assert.equal(result.data.items[0].quantity, 2);
    assert.equal(calls, 1);
  } finally {
    inference.mock.restore();
    for (const key of Object.keys(process.env))
      if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
async function publication({
  quantity = 3,
  unit = "pieces",
  images,
  owner = seller,
} = {}) {
  const image = images?.[0] || (await photo(owner));
  const result = await request("events", {
    user: owner,
    method: "POST",
    body: {
      safe: true,
      event: {
        name: "Old campus cleanup",
        area: "Rohini",
        eventDate: "2020-01-02",
        pickupNote: "Public campus gate.",
        deliveryNote: "Pickup only.",
      },
      items: [
        {
          name: "Stage boards",
          description: "Reusable material.",
          category: "Wood",
          purpose: "Reuse",
          quantity,
          unit,
          condition: "Good",
          price: 0,
          hazards: "Check for nails.",
          art: "boards",
          image,
          images: images?.slice(1) || [],
        },
      ],
    },
  });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  return result.data.itemIds[0];
}
async function pickup(itemId, user = buyer) {
  const result = await request(`items/${itemId}/requests`, {
    user,
    method: "POST",
    body: {
      pickupAt: Date.now() + 180 * 86400000,
      note: "Collect the whole batch.",
    },
  });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  return result.data.dealId;
}

test("sessions, verification, CSRF, validation, password reset and revocation", async () => {
  assert.equal((await request("me")).status, 401);
  assert.equal(
    (
      await request("me", {
        user: buyer,
        method: "PATCH",
        body: {},
        headers: { origin: "https://attacker.example" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("me", {
        user: buyer,
        method: "PATCH",
        body: {
          name: "Bad",
          phone: "123",
          area: "Rohini",
          buyerType: "reuse",
          interests: [],
        },
      })
    ).status,
    422,
  );
  const session = await request("auth/login", {
    method: "POST",
    body: { email: buyer.email, password: "wrong-password" },
  });
  assert.equal(session.status, 401);
  const temporary = await account("reset-account");
  assert.equal(
    (
      await request("auth/forgot", {
        method: "POST",
        body: { email: temporary.email },
      })
    ).status,
    200,
  );
  await processOutbox();
  const messages = await Promise.all(
    (await readdir(join(root, "mail"))).map(async (f) =>
      JSON.parse(await readFile(join(root, "mail", f), "utf8")),
    ),
  );
  const token = messages
    .find(
      (m) =>
        m.to === temporary.email && m.subject === "Reset your Reclaim password",
    )
    .text.match(/#token=([A-Za-z0-9_-]+)/)[1];
  assert.equal(
    (
      await request("auth/reset", {
        method: "POST",
        body: { token, password: "new-long-password-456" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("auth/session", { user: temporary })).status,
    401,
  );
  assert.equal(
    (
      await request("auth/reset", {
        method: "POST",
        body: { token, password: "new-long-password-456" },
      })
    ).status,
    400,
  );
  const signed = await request("auth/login", {
    method: "POST",
    body: { email: temporary.email, password: "new-long-password-456" },
  });
  assert.equal(signed.status, 200);
  const renewed = { ...temporary, cookie: signed.cookie };
  await request("auth/logout", { user: renewed, method: "POST", body: {} });
  assert.equal((await request("auth/session", { user: renewed })).status, 401);
});

test("access expiry refresh rotation concurrent replay expiry and logout revocation", async () => {
  const accountUser = await account("refresh-user");
  assert.match(accountUser.cookie, /reclaim_refresh=/);
  await db().query(
    "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1",
    [accountUser.id],
  );
  assert.equal(
    (await request("me", { user: accountUser })).data.error.code,
    "ACCESS_EXPIRED",
  );
  assert.equal((await request("board", { user: accountUser })).status, 401);
  assert.equal(
    (
      await request("auth/refresh", {
        user: accountUser,
        method: "POST",
        body: {},
        headers: { origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  const rotated = await Promise.all(
    [1, 2, 3].map(() =>
      request("auth/refresh", { user: accountUser, method: "POST", body: {} }),
    ),
  );
  assert.deepEqual(
    rotated.map((entry) => entry.status).sort(),
    [200, 401, 401],
  );
  const success = rotated.find((entry) => entry.status === 200);
  assert.ok(success.cookie);
  assert.notEqual(success.cookie, accountUser.cookie);
  const activeUser = { ...accountUser, cookie: success.cookie };
  assert.equal((await request("me", { user: activeUser })).status, 200);
  assert.equal(
    (
      await request("auth/refresh", {
        user: accountUser,
        method: "POST",
        body: {},
      })
    ).status,
    401,
  );
  const before = await db().query(
    "SELECT refresh_expires_at FROM sessions WHERE user_id=$1",
    [accountUser.id],
  );
  const next = await request("auth/refresh", {
    user: activeUser,
    method: "POST",
    body: {},
  });
  assert.equal(next.status, 200);
  const after = await db().query(
    "SELECT refresh_expires_at FROM sessions WHERE user_id=$1",
    [accountUser.id],
  );
  assert.equal(
    before.rows[0].refresh_expires_at.getTime(),
    after.rows[0].refresh_expires_at.getTime(),
  );
  const current = { ...accountUser, cookie: next.cookie };
  const refreshOnly = {
    ...current,
    cookie: current.cookie
      .split("; ")
      .find((entry) => entry.startsWith("reclaim_refresh=")),
  };
  assert.equal((await request("board", { user: refreshOnly })).status, 401);
  await request("auth/logout", { user: refreshOnly, method: "POST", body: {} });
  assert.equal(
    (await request("auth/refresh", { user: current, method: "POST", body: {} }))
      .status,
    401,
  );
  assert.equal((await request("me", { user: current })).status, 401);
  const expiredUser = await account("expired-refresh");
  await db().query(
    "UPDATE sessions SET refresh_expires_at=now()-interval '1 second' WHERE user_id=$1",
    [expiredUser.id],
  );
  const rejected = await request("auth/refresh", {
    user: expiredUser,
    method: "POST",
    body: {},
  });
  assert.equal(rejected.status, 401);
  assert.equal(rejected.cookie, "reclaim_session=; reclaim_refresh=");
});

test("uploads verify actual image bytes, ownership, private drafts and cover ordering", async () => {
  const cover = await photo();
  const extra = await photo();
  assert.equal(
    (
      await handle(
        new Request(`${process.env.APP_URL}${cover}`),
        cover.slice(5).split("/"),
      )
    ).status,
    404,
  );
  const itemId = await publication({ images: [cover, extra] });
  const malformed = await request(`items/${itemId}/photos`, {
    user: seller,
    method: "PATCH",
    body: { image: `/api/photos/${"-".repeat(36)}`, images: [] },
  });
  assert.equal(malformed.status, 422);
  assert.equal(malformed.data.error.code, "VALIDATION");
  const foreign = await photo(buyer);
  assert.equal(
    (
      await request(`items/${itemId}/photos`, {
        user: seller,
        method: "PATCH",
        body: { image: foreign, images: [] },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`items/${itemId}/photos`, {
        user: seller,
        method: "PATCH",
        body: { image: extra, images: [cover] },
      })
    ).status,
    200,
  );
  const item = await request(`items/${itemId}`);
  assert.equal(item.data.item.image, extra);
  assert.deepEqual(item.data.item.images, [cover]);
  const loaded = await handle(
    new Request(`${process.env.APP_URL}${extra}`),
    extra.slice(5).split("/"),
  );
  assert.equal(loaded.status, 200);
  assert.equal(loaded.headers.get("content-type"), "image/jpeg");
  const form = new FormData();
  form.set(
    "photo",
    new File(["<svg>not a photo</svg>"], "fake.png", { type: "image/png" }),
  );
  const invalid = await handle(
    new Request(`${process.env.APP_URL}/api/uploads`, {
      method: "POST",
      headers: { origin: process.env.APP_URL, cookie: seller.cookie },
      body: form,
    }),
    ["uploads"],
  );
  assert.equal(invalid.status, 422);
});

test("atomic publication, calendar dates, matching alerts, saved items and field errors", async () => {
  const itemId = await publication();
  const item = await request(`items/${itemId}`);
  assert.equal(
    item.data.event.eventAt,
    Date.parse("2020-01-02T00:00:00+05:30"),
  );
  assert.equal(
    (await request(`me/saved/${itemId}`, { user: buyer, method: "PUT" }))
      .status,
    200,
  );
  assert.ok(
    (await request("me/saved", { user: buyer })).data.items.some(
      (i) => i.id === itemId,
    ),
  );
  assert.equal(
    (await request(`me/saved/${itemId}`, { user: buyer, method: "DELETE" }))
      .status,
    200,
  );
  assert.ok(
    !(await request("me/saved", { user: buyer })).data.items.some(
      (i) => i.id === itemId,
    ),
  );
  assert.ok(
    (
      await request("me/notifications", { user: buyer })
    ).data.notifications.some((n) =>
      n.title.includes("matches your interests"),
    ),
  );
  const before = Number(
    (await db().query("SELECT count(*) FROM events")).rows[0].count,
  );
  const result = await request("events", {
    user: seller,
    method: "POST",
    body: {
      safe: true,
      event: {
        name: "Invalid listing",
        area: "Rohini",
        eventDate: "2026-02-30",
        pickupNote: "",
        deliveryNote: "",
      },
      items: [],
    },
  });
  assert.equal(result.status, 422);
  assert.ok(result.data.error.fields);
  assert.equal(
    Number((await db().query("SELECT count(*) FROM events")).rows[0].count),
    before,
  );
  assert.equal(
    (
      await request(`items/${itemId}`, {
        user: buyer,
        method: "PATCH",
        body: { name: "Unauthorized edit", price: 10 },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`items/${itemId}/requests`, {
        user: seller,
        method: "POST",
        body: { pickupAt: Date.now() + 3600000, note: "" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`items/${itemId}/requests`, {
        user: buyer,
        method: "POST",
        body: { pickupAt: Date.now() - 1000, note: "" },
      })
    ).status,
    422,
  );
  const draft = Object.fromEntries(
    Object.entries(item.data.item).filter(
      ([key]) =>
        !["id", "eventId", "state", "createdAt", "revision"].includes(key),
    ),
  );
  const ownPhoto = await photo();
  const foreignPhoto = await photo(buyer);
  const input = {
    safe: true,
    event: {
      name: "Atomic publication",
      area: "Rohini",
      eventDate: "2019-12-31",
      pickupNote: "Gate collection.",
      deliveryNote: "",
    },
    items: [
      { ...draft, image: ownPhoto, images: [] },
      { ...draft, name: "Second material", image: foreignPhoto, images: [] },
    ],
  };
  const eventCount = Number(
    (await db().query("SELECT count(*) FROM events")).rows[0].count,
  );
  const itemCount = Number(
    (await db().query("SELECT count(*) FROM items")).rows[0].count,
  );
  assert.equal(
    (await request("events", { user: seller, method: "POST", body: input }))
      .status,
    403,
  );
  assert.equal(
    Number((await db().query("SELECT count(*) FROM events")).rows[0].count),
    eventCount,
  );
  assert.equal(
    Number((await db().query("SELECT count(*) FROM items")).rows[0].count),
    itemCount,
  );
  input.items[1].image = ownPhoto;
  const batch = await request("events", {
    user: seller,
    method: "POST",
    body: input,
  });
  assert.equal(batch.status, 201);
  assert.equal(batch.data.itemIds.length, 2);
});

test("competing acceptance races, idempotent completion, privacy and both permanent histories", async () => {
  const itemId = await publication({ unit: "kg", quantity: 12.5 });
  const first = await pickup(itemId);
  const second = await pickup(itemId, competitor);
  assert.equal(
    (
      await request(`items/${itemId}/requests`, {
        user: buyer,
        method: "POST",
        body: { pickupAt: Date.now() + 3600000, note: "" },
      })
    ).status,
    409,
  );
  assert.equal(
    (await request(`deals/${first}`, { user: buyer })).data.contact,
    null,
  );
  assert.equal(
    (await request(`deals/${first}`, { user: stranger })).status,
    404,
  );
  const results = await Promise.all(
    [first, second].map((d) =>
      request(`deals/${d}/accept`, { user: seller, method: "POST", body: {} }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const selected = results[0].status === 200 ? first : second;
  const selectedBuyer = selected === first ? buyer : competitor;
  assert.equal(
    (await request(`deals/${selected}`, { user: selectedBuyer })).data.contact
      .phone,
    "9876543210",
  );
  const publicData = JSON.stringify((await request("board")).data);
  assert.ok(!publicData.includes("9876543210"));
  assert.ok(!publicData.includes(seller.email));
  assert.equal(
    (
      await request(`deals/${selected}/complete`, {
        user: selectedBuyer,
        method: "POST",
        body: {},
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(`deals/${selected}/acknowledge`, {
        user: selectedBuyer,
        method: "POST",
        body: {},
      })
    ).data.status,
    "Accepted",
  );
  const key = randomUUID();
  const completed = await request(`deals/${selected}/complete`, {
    user: seller,
    method: "POST",
    key,
    body: {},
  });
  assert.equal(completed.status, 200);
  const retry = await request(`deals/${selected}/complete`, {
    user: seller,
    method: "POST",
    key,
    body: {},
  });
  assert.deepEqual(retry.data, completed.data);
  assert.equal(
    (
      await request(`deals/${selected}/complete`, {
        user: seller,
        method: "POST",
        body: {},
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`deals/${selected}/cancel`, {
        user: seller,
        method: "POST",
        body: {},
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`items/${itemId}/withdraw`, {
        user: seller,
        method: "POST",
        body: {},
      })
    ).status,
    409,
  );
  const notices = await db().query(
    "SELECT * FROM notifications WHERE kind='complete' AND href=$1",
    [`/dashboard/deals/${selected}`],
  );
  assert.equal(notices.rowCount, 2);
  const emails = await db().query(
    "SELECT * FROM outbox WHERE dedupe_key LIKE $1",
    [`${selected}:complete:%`],
  );
  assert.equal(emails.rowCount, 2);
  for (const user of [seller, selectedBuyer])
    assert.ok(
      (await request("me/handovers", { user })).data.records.some(
        (r) => r.deal.id === selected,
      ),
    );
  assert.equal(
    (await request("me/impact", { user: selectedBuyer })).data.estimatedKg,
    12.5,
  );
  const profile = await request(`users/${seller.id}`);
  assert.ok(profile.data.history.some((r) => r.id === selected));
  assert.equal(profile.data.person.phone, "");
  assert.ok(!JSON.stringify(profile.data).includes("Collect the whole batch."));
  assert.ok(!(await request("items")).data.items.some((i) => i.id === itemId));
  await db().query(
    "UPDATE deals SET completed_at=now()-interval '31 days' WHERE id=$1",
    [selected],
  );
  assert.equal(
    (await request(`deals/${selected}`, { user: selectedBuyer })).data.contact,
    null,
  );
});

test("decline, both cancellation roles, withdrawal, stale revisions and persistent unread state", async () => {
  for (const role of ["seller", "buyer"]) {
    const itemId = await publication();
    const dealId = await pickup(itemId);
    await request(`deals/${dealId}/accept`, {
      user: seller,
      method: "POST",
      body: {},
    });
    assert.equal(
      (
        await request(`deals/${dealId}/cancel`, {
          user: role === "seller" ? seller : buyer,
          method: "POST",
          body: { reason: "Plans changed." },
        })
      ).status,
      200,
    );
    assert.equal(
      (await request(`items/${itemId}`)).data.item.state,
      "Available",
    );
    const next = await pickup(itemId);
    assert.equal(
      (
        await request(`deals/${next}/decline`, {
          user: seller,
          method: "POST",
          body: { reason: "Cannot arrange pickup." },
        })
      ).data.status,
      "Declined",
    );
  }
  const itemId = await publication();
  const dealId = await pickup(itemId);
  const before = (await request(`items/${itemId}`)).data.item.revision;
  await request(`items/${itemId}`, {
    user: seller,
    method: "PATCH",
    body: { name: "Renamed batch", price: 12 },
    headers: { "if-match": String(before) },
  });
  assert.equal(
    (
      await request(`items/${itemId}`, {
        user: seller,
        method: "PATCH",
        body: { name: "Stale edit", price: 14 },
        headers: { "if-match": String(before) },
      })
    ).status,
    409,
  );
  await request(`deals/${dealId}/accept`, {
    user: seller,
    method: "POST",
    body: {},
  });
  await request(`items/${itemId}/withdraw`, {
    user: seller,
    method: "POST",
    body: {},
  });
  assert.equal(
    (await request(`deals/${dealId}`, { user: buyer })).data.deal.status,
    "Cancelled",
  );
  assert.equal(
    (
      await request(`deals/${dealId}/complete`, {
        user: seller,
        method: "POST",
        body: {},
      })
    ).status,
    409,
  );
  await request("me/notifications/read", {
    user: buyer,
    method: "PATCH",
    body: {},
  });
  assert.ok(
    (
      await request("me/notifications", { user: buyer })
    ).data.notifications.every((n) => n.read),
  );
});

test("idempotency binds keys to actor and exact operation; missing keys and actor injection fail", async () => {
  const itemId = await publication();
  const key = randomUUID();
  const first = await request(`items/${itemId}`, {
    user: seller,
    method: "PATCH",
    key,
    body: { name: "New board name", price: 10 },
  });
  assert.equal(first.status, 200);
  assert.equal(
    (
      await request(`items/${itemId}`, {
        user: seller,
        method: "PATCH",
        key,
        body: { name: "Different name", price: 10 },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`items/${itemId}`, {
        user: seller,
        method: "PATCH",
        key: "",
        body: { name: "Another name", price: 10 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`items/${itemId}/requests`, {
        user: buyer,
        method: "POST",
        body: { pickupAt: Date.now() + 3600000, note: "", actor: seller.id },
      })
    ).status,
    422,
  );
});

test("outbox failures retry independently and permanent failures remain visible", async () => {
  const itemId = await publication();
  const dealId = await pickup(itemId);
  await request(`deals/${dealId}/accept`, {
    user: seller,
    method: "POST",
    body: {},
  });
  await request(`deals/${dealId}/complete`, {
    user: seller,
    method: "POST",
    body: {},
  });
  await processOutbox(100, async () => {
    throw new Error("Network unavailable");
  });
  assert.equal(
    (await request(`deals/${dealId}`, { user: seller })).data.deal.status,
    "Done",
  );
  assert.equal(
    (await request("me/impact", { user: seller })).data.estimatedKg,
    12.5,
  );
  const pending = await db().query(
    "SELECT * FROM outbox WHERE dedupe_key LIKE $1",
    [`${dealId}:complete:%`],
  );
  assert.ok(
    pending.rows.every((r) => r.status === "pending" && r.attempts === 1),
  );
  await db().query(
    "UPDATE outbox SET attempts=4,available_at=now() WHERE dedupe_key LIKE $1",
    [`${dealId}:complete:%`],
  );
  await processOutbox(100, async () => {
    throw new Error("Network unavailable");
  });
  const failed = await db().query(
    "SELECT * FROM outbox WHERE dedupe_key LIKE $1",
    [`${dealId}:complete:%`],
  );
  assert.ok(
    failed.rows.every((r) => r.status === "failed" && r.attempts === 5),
  );
});
