import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { converse } from "../src/modules/analysis/bedrock.ts";
import { suggestDrafts } from "../src/modules/analysis/drafts.ts";
import { analysisConfig } from "../src/modules/analysis/config.ts";

const cfg = { apiKey: "test-only", region: "ap-south-1", maxTokens: 4096, temperature: 0.1, visionModel: "apac.amazon.nova-lite-v1:0", textModel: "zai.glm-5" };
const photo = "/api/photos/12345678-1234-4234-8234-123456789012";
const observations = { items: [{ index: 0, name: "Plywood boards", description: "Visible boards", category: "Wood", purpose: "Reuse", quantity: 4, condition: "Fair", hazards: "Check for splinters" }], warnings: ["Count needs review"] };

test("photo drafts keep observed fields and use GLM only for listing copy", async () => {
  const calls = [];
  const result = await suggestDrafts(cfg, Buffer.from("jpeg"), photo, undefined, async (_cfg, input) => {
    calls.push(input);
    return JSON.stringify(calls.length === 1 ? observations : { items: [{ index: 0, name: "Four plywood boards", description: "Boards from the photographed batch." }] });
  });
  assert.equal(calls[0].model, cfg.visionModel);
  assert.ok(calls[0].image);
  assert.equal(calls[1].model, cfg.textModel);
  assert.equal(calls[1].image, undefined);
  assert.equal(result.items[0].quantity, 4);
  assert.equal(result.items[0].price, 0);
  assert.equal(result.items[0].image, photo);
  assert.ok(result.warnings.length);
});

test("invalid model responses and changed indices never produce drafts", async () => {
  await assert.rejects(suggestDrafts(cfg, Buffer.from("jpeg"), photo, undefined, async () => "not JSON"), { code: "INVALID_ANALYSIS" });
  let calls = 0;
  await assert.rejects(suggestDrafts(cfg, Buffer.from("jpeg"), photo, undefined, async () => JSON.stringify(++calls === 1 ? observations : { items: [{ index: 1, name: "Invented item", description: "" }] })), { code: "INVALID_ANALYSIS" });
});

test("Converse uses bounded authenticated requests and rejects truncated responses", async () => {
  const transport = async (url, options) => {
    assert.match(url, /ap-south-1.*apac.amazon.nova-lite-v1%3A0\/converse$/);
    assert.equal(options.headers.Authorization, "Bearer test-only");
    assert.equal(options.redirect, "error");
    const body = JSON.parse(options.body);
    assert.equal(body.messages[0].content[1].image.source.bytes, Buffer.from("jpeg").toString("base64"));
    return Response.json({ stopReason: "max_tokens", output: { message: { content: [{ text: "partial" }] } } });
  };
  await assert.rejects(converse(cfg, { model: cfg.visionModel, system: "Test", text: "Test", image: Buffer.from("jpeg") }, transport), { code: "INVALID_ANALYSIS" });
  await assert.rejects(converse(cfg, { model: cfg.textModel, system: "Test", text: "Test" }, async () => new Response("secret provider error", { status: 403 })), (error) => error.code === "BEDROCK_UNAVAILABLE" && !error.message.includes("secret provider error"));
});

test("credit confirmation prevents any inference configuration from activating", () => {
  const oldEnabled = process.env.BEDROCK_AGENT_ENABLED;
  const oldConfirmed = process.env.BEDROCK_CREDITS_CONFIRMED;
  try {
    process.env.BEDROCK_AGENT_ENABLED = "true";
    process.env.BEDROCK_CREDITS_CONFIRMED = "false";
    assert.throws(analysisConfig, { code: "CREDITS_UNCONFIRMED" });
  } finally {
    if (oldEnabled === undefined) delete process.env.BEDROCK_AGENT_ENABLED;
    else process.env.BEDROCK_AGENT_ENABLED = oldEnabled;
    if (oldConfirmed === undefined) delete process.env.BEDROCK_CREDITS_CONFIRMED;
    else process.env.BEDROCK_CREDITS_CONFIRMED = oldConfirmed;
  }
});
