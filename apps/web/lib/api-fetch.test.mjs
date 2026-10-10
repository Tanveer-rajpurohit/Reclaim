import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { apiFetch, APIError } from "./api/fetch.ts";

const expired = () =>
  Response.json(
    { error: { code: "ACCESS_EXPIRED", message: "Expired access" } },
    { status: 401 },
  );

test("three concurrent expired requests share one refresh and replay their bodies and keys", async () => {
  let refreshes = 0;
  const attempts = new Map();
  const transport = mock.method(globalThis, "fetch", async (input, options) => {
    const request = new Request(input, options);
    const path = new URL(request.url).pathname;
    if (path === "/api/auth/refresh") {
      refreshes++;
      await setTimeout(20);
      return Response.json({ ok: true });
    }
    const count = (attempts.get(path) || 0) + 1;
    attempts.set(path, count);
    assert.equal(request.headers.get("idempotency-key"), path);
    assert.deepEqual(await request.json(), { path });
    if (count === 1) {
      if (path.endsWith("late")) await setTimeout(60);
      return expired();
    }
    return Response.json({ ok: true });
  });
  try {
    const results = await Promise.all(
      ["one", "two", "late"].map((name) => {
        const path = `/api/me/${name}`;
        return apiFetch(path, {
          method: "POST",
          headers: { "Idempotency-Key": path },
          body: JSON.stringify({ path }),
        });
      }),
    );
    assert.equal(refreshes, 1);
    assert.deepEqual(results, [{ ok: true }, { ok: true }, { ok: true }]);
    assert.deepEqual([...attempts.values()], [2, 2, 2]);
  } finally {
    transport.mock.restore();
  }
});

test("a failed shared refresh rejects all protected requests without repeated refresh calls", async () => {
  let refreshes = 0;
  let originals = 0;
  const transport = mock.method(globalThis, "fetch", async (input, options) => {
    if (
      new URL(new Request(input, options).url).pathname === "/api/auth/refresh"
    ) {
      refreshes++;
      await setTimeout(20);
      return Response.json(
        { error: { code: "SESSION_EXPIRED", message: "Sign in again" } },
        { status: 401 },
      );
    }
    originals++;
    return expired();
  });
  try {
    const results = await Promise.allSettled(
      [1, 2, 3].map((value) => apiFetch(`/api/me?value=${value}`)),
    );
    assert.equal(refreshes, 1);
    assert.equal(originals, 3);
    for (const result of results) {
      assert.equal(result.status, "rejected");
      assert.ok(result.reason instanceof APIError);
      assert.equal(result.reason.code, "SESSION_EXPIRED");
    }
  } finally {
    transport.mock.restore();
  }
});

test("an original request is retried only once and invalid login never refreshes", async () => {
  let refreshes = 0;
  let originals = 0;
  const transport = mock.method(globalThis, "fetch", async (input, options) => {
    if (
      new URL(new Request(input, options).url).pathname === "/api/auth/refresh"
    ) {
      refreshes++;
      return Response.json({ ok: true });
    }
    originals++;
    return expired();
  });
  try {
    await assert.rejects(apiFetch("/api/me"), { code: "ACCESS_EXPIRED" });
    assert.equal(originals, 2);
    assert.equal(refreshes, 1);
    await assert.rejects(
      apiFetch("/api/auth/login", { method: "POST", body: "{}" }),
      { status: 401 },
    );
    assert.equal(refreshes, 1);
  } finally {
    transport.mock.restore();
  }
});

test("cancelling one waiter does not cancel refresh for another request", async () => {
  let refreshes = 0;
  let renewed = false;
  const transport = mock.method(globalThis, "fetch", async (input, options) => {
    if (
      new URL(new Request(input, options).url).pathname === "/api/auth/refresh"
    ) {
      refreshes++;
      await setTimeout(40);
      renewed = true;
      return Response.json({ ok: true });
    }
    return renewed ? Response.json({ ok: true }) : expired();
  });
  try {
    const controller = new AbortController();
    const cancelled = apiFetch("/api/me", { signal: controller.signal });
    const healthy = apiFetch("/api/me/saved");
    const rejected = assert.rejects(cancelled, { name: "AbortError" });
    await setTimeout(10);
    controller.abort();
    await rejected;
    assert.deepEqual(await healthy, { ok: true });
    assert.equal(refreshes, 1);
  } finally {
    transport.mock.restore();
  }
});

test("public browsing recovers anonymously when the refresh session expires", async () => {
  let refreshed = false;
  const transport = mock.method(globalThis, "fetch", async (input, options) => {
    if (
      new URL(new Request(input, options).url).pathname === "/api/auth/refresh"
    ) {
      refreshed = true;
      return Response.json(
        { error: { code: "SESSION_EXPIRED", message: "Sign in again" } },
        { status: 401 },
      );
    }
    return refreshed ? Response.json({ currentUserId: null }) : expired();
  });
  try {
    assert.deepEqual(await apiFetch("/api/board"), { currentUserId: null });
  } finally {
    transport.mock.restore();
  }
});

test("multipart upload bodies survive an access refresh", async () => {
  let attempts = 0;
  const transport = mock.method(globalThis, "fetch", async (input, options) => {
    const request = new Request(input, options);
    if (new URL(request.url).pathname === "/api/auth/refresh")
      return Response.json({ ok: true });
    const data = await request.formData();
    const photo = data.get("photo");
    assert.equal(await photo.text(), "photo-bytes");
    attempts++;
    return attempts === 1
      ? expired()
      : Response.json({ url: "/api/photos/test" });
  });
  try {
    const data = new FormData();
    data.set(
      "photo",
      new File(["photo-bytes"], "photo.jpg", { type: "image/jpeg" }),
    );
    assert.deepEqual(
      await apiFetch("/api/uploads", { method: "POST", body: data }),
      { url: "/api/photos/test" },
    );
    assert.equal(attempts, 2);
  } finally {
    transport.mock.restore();
  }
});
