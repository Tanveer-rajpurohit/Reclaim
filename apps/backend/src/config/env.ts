import { resolve } from "node:path";

export function config() {
  const production = process.env.NODE_ENV === "production";
  const appUrl = process.env.APP_URL || "http://localhost:3001";
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    throw new Error("DATABASE_URL is required. See .env.example.");
  const storage = process.env.STORAGE_PROVIDER || "local";
  const mail = process.env.MAIL_PROVIDER || "file";
  const bucket = process.env.S3_BUCKET || process.env.BUCKET_NAME;
  if (
    process.env.S3_BUCKET &&
    process.env.BUCKET_NAME &&
    process.env.S3_BUCKET !== process.env.BUCKET_NAME
  )
    throw new Error("S3_BUCKET and BUCKET_NAME must name the same bucket.");
  if (!["local", "s3"].includes(storage) || !["file", "ses"].includes(mail))
    throw new Error("Invalid storage or mail provider.");
  if (
    production &&
    (!appUrl.startsWith("https://") || storage !== "s3" || mail !== "ses")
  )
    throw new Error(
      "Production requires HTTPS APP_URL, S3 storage and SES mail.",
    );
  if (storage === "s3" && (!bucket || !process.env.AWS_REGION))
    throw new Error(
      "BUCKET_NAME (or S3_BUCKET) and AWS_REGION are required for S3 storage.",
    );
  if (mail === "ses" && (!process.env.SES_FROM || !process.env.AWS_REGION))
    throw new Error("SES_FROM and AWS_REGION are required for SES mail.");
  return {
    production,
    appUrl: new URL(appUrl).origin,
    databaseUrl,
    storage,
    mail,
    localDir: resolve(process.env.LOCAL_DATA_DIR || "../../.local"),
    region: process.env.AWS_REGION,
    bucket,
    from: process.env.SES_FROM,
  };
}
