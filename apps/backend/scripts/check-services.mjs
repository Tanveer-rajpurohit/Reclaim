import process from "node:process";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createClient } from "redis";
import nodemailer from "nodemailer";
import sharp from "sharp";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "../src/config/env.ts";
import { smtpConfig } from "../src/modules/mail/smtp.ts";
import { analysisConfig } from "../src/modules/analysis/config.ts";
import { suggestDrafts } from "../src/modules/analysis/drafts.ts";
import { awsError } from "../src/shared/aws-errors.ts";
import { AppError } from "../src/shared/errors.ts";

// Never print provider bodies, connection strings, credentials or recipient addresses.
async function check(name, action) {
  try {
    const detail = await action();
    console.log(`${name}: OK${detail ? ` (${detail})` : ""}`);
  } catch (error) {
    process.exitCode = 1;
    const code = error?.code || error?.name || "UnknownError";
    console.error(
      `${name}: FAILED [${/^[\w.-]{1,80}$/.test(code) ? code : "UnknownError"}]${error instanceof AppError ? ` ${error.message}` : ""}`,
    );
  }
}

const cfg = config();
const image = await sharp(
  Buffer.from(
    '<svg width="640" height="480"><rect width="640" height="480" fill="#eee"/><rect x="70" y="90" width="500" height="60" fill="#ad8150"/><rect x="70" y="190" width="500" height="60" fill="#b48959"/><rect x="70" y="290" width="500" height="60" fill="#ad8150"/></svg>',
  ),
)
  .jpeg()
  .toBuffer();
await Promise.all([
  check("Database", async () => {
    const db = new pg.Client({
      connectionString: cfg.databaseUrl,
      connectionTimeoutMillis: 5000,
    });
    try {
      await db.connect();
      await db.query("SELECT 1");
    } finally {
      await db.end();
    }
  }),
  check("Redis", async () => {
    const client = createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:63790",
      socket: { connectTimeout: 5000, reconnectStrategy: false },
    });
    client.on("error", () => {});
    try {
      await client.connect();
      await client.ping();
    } finally {
      if (client.isOpen) client.destroy();
    }
  }),
  check("Mail", async () => {
    if (cfg.mail !== "smtp") return `${cfg.mail} provider; SMTP not checked`;
    const transport = nodemailer.createTransport(smtpConfig().options);
    try {
      await transport.verify();
      return "SMTP login verified; no email sent";
    } finally {
      transport.close();
    }
  }),
  check("S3 upload/read/delete", async () => {
    if (cfg.storage !== "s3") return "local storage selected; S3 not checked";
    const client = new S3Client({
      region: cfg.region,
      maxAttempts: 1,
      requestHandler: { connectionTimeout: 5000, requestTimeout: 15_000 },
    });
    const key = `derivatives/diagnostic-${randomUUID()}.jpg`;
    let uploaded = false;
    let failure;
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: image,
          ContentType: "image/jpeg",
          ServerSideEncryption: "AES256",
        }),
      );
      uploaded = true;
      const object = await client.send(
        new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
      );
      if (
        !object.Body ||
        !Buffer.from(await object.Body.transformToByteArray()).equals(image)
      )
        throw new Error("PhotoReadMismatch");
    } catch (error) {
      failure = error;
    } finally {
      try {
        if (uploaded)
          await client.send(
            new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }),
          );
      } catch (error) {
        if (failure) awsError("S3", error);
        else failure = error;
      } finally {
        client.destroy();
      }
    }
    if (failure) throw awsError("S3", failure);
  }),
  check("Bedrock photo analysis", async () => {
    if (!process.argv.includes("--analyze"))
      return "not requested; add --analyze for one live model call";
    const result = await suggestDrafts(
      analysisConfig(),
      image,
      `/api/photos/${randomUUID()}`,
    );
    return `${result.items.length} editable item(s) returned`;
  }),
]);
