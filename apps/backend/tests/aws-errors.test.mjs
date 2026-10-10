import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { awsError } from "../src/shared/aws-errors.ts";

test("AWS failures return actionable codes without leaking provider secrets", () => {
  const log = mock.method(console, "error", () => {});
  try {
    const cases = [
      ["S3", "AccessDenied", 403, "S3_ACCESS_DENIED"],
      ["S3", "InvalidAccessKeyId", 403, "S3_CREDENTIALS"],
      ["S3", "NoSuchBucket", 404, "S3_BUCKET_MISSING"],
      ["S3", "PermanentRedirect", 301, "S3_REGION"],
      ["Bedrock", "ExpiredTokenException", 403, "BEDROCK_CREDENTIALS"],
      ["Bedrock", "ValidationException", 400, "BEDROCK_MODEL_CONFIG"],
      ["Bedrock", "AccessDeniedException", 403, "BEDROCK_ACCESS_DENIED"],
      ["Bedrock", "ThrottlingException", 429, "BEDROCK_BUSY"],
    ];
    for (const [service, name, status, expected] of cases) {
      const result = awsError(service, {
        name,
        message: "secret provider body",
        $metadata: { httpStatusCode: status, requestId: "request-123" },
      });
      assert.equal(result.code, expected);
      assert.equal(result.status, status === 429 ? 429 : 503);
      assert.ok(!result.message.includes("secret provider body"));
    }
    assert.ok(!JSON.stringify(log.mock.calls).includes("secret provider body"));
    assert.match(JSON.stringify(log.mock.calls), /request-123/);
  } finally {
    log.mock.restore();
  }
});
