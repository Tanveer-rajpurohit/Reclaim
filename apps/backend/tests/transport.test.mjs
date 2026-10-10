import test from "node:test";
import assert from "node:assert/strict";
import { createApiServer } from "../src/http/server.ts";

async function serve(t, handler) {
  const server = createApiServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

test("HTTP adapter preserves query, mutation headers, JSON and separate cookies", async (t) => {
  const origin = await serve(t, async (request, path) => {
    assert.deepEqual(path, ["items", "example"]);
    assert.equal(new URL(request.url).searchParams.get("side"), "buying");
    assert.equal(request.method, "PATCH");
    assert.equal(request.headers.get("origin"), "http://localhost:3001");
    assert.equal(request.headers.get("cookie"), "reclaim_session=token");
    assert.equal(request.headers.get("idempotency-key"), "test-key");
    assert.equal(request.headers.get("if-match"), "3");
    assert.deepEqual(await request.json(), { name: "Boards" });
    const headers = new Headers();
    headers.append("Set-Cookie", "first=1; HttpOnly; Path=/");
    headers.append("Set-Cookie", "second=2; HttpOnly; Path=/");
    return Response.json({ ok: true }, { status: 201, headers });
  });
  const response = await fetch(`${origin}/api/items/example?side=buying`, {
    method: "PATCH",
    headers: {
      origin: "http://localhost:3001",
      cookie: "reclaim_session=token",
      "content-type": "application/json",
      "idempotency-key": "test-key",
      "if-match": "3",
    },
    body: JSON.stringify({ name: "Boards" }),
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.deepEqual(await response.json(), { ok: true });
});

test("HTTP adapter streams multipart uploads and binary photo responses", async (t) => {
  const bytes = new Uint8Array([255, 216, 1, 2, 3, 255, 217]);
  const origin = await serve(t, async (request) => {
    const photo = (await request.formData()).get("photo");
    assert.equal(photo.name, "photo.jpg");
    assert.deepEqual(new Uint8Array(await photo.arrayBuffer()), bytes);
    return new Response(bytes, { headers: { "Content-Type": "image/jpeg" } });
  });
  const form = new FormData();
  form.set("photo", new File([bytes], "photo.jpg", { type: "image/jpeg" }));
  const response = await fetch(`${origin}/api/uploads`, {
    method: "POST",
    body: form,
  });
  assert.equal(response.headers.get("content-type"), "image/jpeg");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
});

test("HTTP adapter rejects paths outside the API without calling application code", async (t) => {
  const origin = await serve(t, () => {
    throw new Error("Unexpected API call");
  });
  const response = await fetch(`${origin}/dashboard`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
});
