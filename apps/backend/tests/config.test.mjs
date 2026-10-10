import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { config } from "../src/config/env.ts";

test("S3 accepts BUCKET_NAME and rejects conflicting aliases", () => {
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.STORAGE_PROVIDER = "s3";
    process.env.MAIL_PROVIDER = "file";
    process.env.AWS_REGION = "ap-south-1";
    process.env.BUCKET_NAME = "s3-bucket-tanveer-2026";
    delete process.env.S3_BUCKET;
    assert.equal(config().bucket, "s3-bucket-tanveer-2026");
    process.env.S3_BUCKET = "another-bucket";
    assert.throws(config, /same bucket/);
    delete process.env.S3_BUCKET;
    delete process.env.AWS_REGION;
    assert.throws(config, /AWS_REGION/);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
