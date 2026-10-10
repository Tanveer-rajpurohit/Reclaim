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
  assert.match(calls[0].system, /in English/);
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
      error.code === "BEDROCK_ACCESS_DENIED" &&
      !error.message.includes("secret provider error"),
  );
});

test("configured serverless Kimi works directly and rejects other model IDs", () => {
  const previous = { ...process.env };
  try {
    Object.assign(process.env, {
      BEDROCK_AGENT_ENABLED: "true",
      AWS_BEDROCK_API_KEY: "test-only",
      AWS_REGION: "ap-south-1",
      AWS_BEDROCK_MODEL_ID: "moonshotai.kimi-k2.5",
    });
    assert.equal(analysisConfig().model, "moonshotai.kimi-k2.5");
    process.env.AWS_BEDROCK_MODEL_ID =
      "arn:aws:bedrock:ap-south-1:123456789012:marketplace/model";
    assert.throws(analysisConfig, { code: "ANALYSIS_CONFIG" });
    process.env.BEDROCK_AGENT_ENABLED = "false";
    assert.throws(analysisConfig, { code: "ANALYSIS_DISABLED" });
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
