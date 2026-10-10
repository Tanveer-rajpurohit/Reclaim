import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { converse } from "../src/modules/analysis/bedrock.ts";
import { suggestDrafts } from "../src/modules/analysis/drafts.ts";
import { analysisConfig } from "../src/modules/analysis/config.ts";

const cfg = {
  apiKey: "test-only",
  region: "ap-south-1",
  maxTokens: 4096,
  temperature: 0.1,
  model: "moonshotai.kimi-k2.5",
};
const photo = "/api/photos/12345678-1234-4234-8234-123456789012";
const observations = {
  items: [
    {
      index: 0,
      name: "Plywood boards",
      description: "Visible boards",
      category: "Wood",
      purpose: "Reuse",
      quantity: 4,
      condition: "Fair",
      hazards: "Check for splinters",
    },
  ],
  warnings: ["Count needs review"],
};

test("Kimi produces reviewed drafts in exactly one image request", async () => {
  const calls = [];
  const result = await suggestDrafts(
    cfg,
    Buffer.from("jpeg"),
    photo,
    undefined,
    async (_cfg, input) => {
      calls.push(input);
      return JSON.stringify(observations);
    },
  );
  assert.equal(calls[0].model, cfg.model);
  assert.ok(calls[0].image);
  assert.equal(calls.length, 1);
  assert.equal(result.items[0].quantity, 4);
  assert.equal(result.items[0].price, 0);
  assert.equal(result.items[0].image, photo);
  assert.ok(result.warnings.length);
});

test("invalid responses and duplicate material indices never produce drafts", async () => {
  await assert.rejects(
    suggestDrafts(
      cfg,
      Buffer.from("jpeg"),
      photo,
      undefined,
      async () => "not JSON",
    ),
    { code: "INVALID_ANALYSIS" },
  );
  await assert.rejects(
    suggestDrafts(cfg, Buffer.from("jpeg"), photo, undefined, async () =>
      JSON.stringify({
        ...observations,
        items: [observations.items[0], observations.items[0]],
      }),
    ),
    { code: "INVALID_ANALYSIS" },
  );
  await assert.rejects(
    suggestDrafts(cfg, Buffer.from("jpeg"), photo, undefined, async () =>
      JSON.stringify({ items: [], warnings: [] }),
    ),
    { code: "NO_MATERIALS" },
  );
});

test("Converse uses bounded authenticated requests and rejects truncated responses", async () => {
  const transport = async (url, options) => {
    assert.equal(
      url,
      "https://bedrock-runtime.ap-south-1.amazonaws.com/model/moonshotai.kimi-k2.5/converse",
    );
    assert.equal(options.headers.Authorization, "Bearer test-only");
    assert.equal(options.redirect, "error");
    const body = JSON.parse(options.body);
    assert.equal(
      body.messages[0].content[1].image.source.bytes,
      Buffer.from("jpeg").toString("base64"),
    );
    return Response.json({
      stopReason: "max_tokens",
      output: { message: { content: [{ text: "partial" }] } },
    });
  };
  await assert.rejects(
    converse(
      cfg,
      {
        model: cfg.model,
        system: "Test",
        text: "Test",
        image: Buffer.from("jpeg"),
      },
      transport,
    ),
    { code: "INVALID_ANALYSIS" },
  );
  await assert.rejects(
    converse(
      cfg,
      { model: cfg.model, system: "Test", text: "Test" },
      async () => new Response("secret provider error", { status: 403 }),
    ),
    (error) =>
      error.code === "BEDROCK_UNAVAILABLE" &&
      !error.message.includes("secret provider error"),
  );
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
    if (oldConfirmed === undefined)
      delete process.env.BEDROCK_CREDITS_CONFIRMED;
    else process.env.BEDROCK_CREDITS_CONFIRMED = oldConfirmed;
  }
});
