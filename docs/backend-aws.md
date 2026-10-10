# AWS storage, photo suggestions and mail

## Current configuration

The ignored `apps/backend/.env` selects S3 in `ap-south-1`, bucket `s3-bucket-tanveer-2026`, and Gmail SMTP. It contains empty credential placeholders; exposed credentials from chat were not copied into it. Rotate those credentials and add their replacements locally. `.env.example` is safe to commit and contains no credentials.

```dotenv
STORAGE_PROVIDER=s3
AWS_REGION=ap-south-1
BUCKET_NAME=s3-bucket-tanveer-2026
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-address@gmail.com
SMTP_PASSWORD=
SMTP_FROM_EMAIL=your-address@gmail.com
BEDROCK_AGENT_ENABLED=true
BEDROCK_CREDITS_CONFIRMED=false
AWS_BEDROCK_API_KEY=
AWS_BEDROCK_MODEL_ID=moonshotai.kimi-k2.5
AGENT_MAX_TOKENS=4096
AGENT_TEMPERATURE=0.1
```

Use an IAM workload role for S3 in production; local development can use rotated AWS keys or the SDK credential chain. Temporary credentials also require `AWS_SESSION_TOKEN`. `S3_BUCKET` aliases `BUCKET_NAME`; if both are set they must match. AWS credentials and the Bedrock API key serve different authentication paths. Bedrock uses a server-only bearer key; `AWS_BEARER_TOKEN_BEDROCK` is the standard alias and takes precedence over `AWS_BEDROCK_API_KEY`.

## Images in S3

All new user uploads go to the configured private bucket, with no fallback to local storage on an S3 error. The API validates JPG/PNG/WebP bytes, limits source size to 10 MB and decoded pixels to 25 million, strips metadata, corrects orientation, resizes to at most 1440 pixels and saves a JPEG derivative under `derivatives/<uuid>.jpg`. Raw originals are not retained. Cover and gallery photos use this same pipeline. PostgreSQL stores upload ownership, byte count and object keys; image bytes stay in S3.

S3 objects use AES256 server-side encryption. Keep Block Public Access enabled. The application role needs `s3:PutObject`, `s3:GetObject` and `s3:DeleteObject` on `arn:aws:s3:::s3-bucket-tanveer-2026/derivatives/*`. The existing bucket must belong to your account and be in Mumbai; the application does not create it or change its policy. Browser uploads/read requests go through authenticated application endpoints, so no public bucket or direct-browser S3 CORS policy is required. Existing local files are not automatically migrated to S3.

## Photo to editable listings

1. In Collection → Materials, choose a cleanup photo and select Identify materials. The photo uses the normal upload endpoint and is stored in S3.
2. The browser sends `POST /api/analysis` with `{ "photoId": "<upload UUID>" }`. The backend requires a verified identity, trusted Origin, a valid UUID and ownership of the upload. A publicly visible photo owned by someone else cannot be analyzed through this endpoint.
3. `moonshotai.kimi-k2.5` reads the photo and returns material names, descriptions, categories, visible counts, condition and hazards in one serverless Converse call through Mumbai. No second text model or cross-region inference profile is used. S3 storage remains in Mumbai. Whole photos are analyzed; automatic image cropping is not implemented.
4. The backend validates model JSON, rejects malformed/truncated output or duplicate indices, and returns at most 20 `ItemDraft` entries plus review notes. Prices start at zero, units are pieces, and weight/dimensions are not inferred. Every draft initially uses the source photo as its cover; the seller can replace it and add separate gallery photos.
5. Suggested drafts append to manual entries; an untouched initial blank entry is replaced. Existing edits are retained. The 20-item collection limit is enforced. The seller reviews details, sets prices and quantities, confirms safety and publishes through the existing publication endpoint. Analysis never changes marketplace state or bypasses publication validation.

The endpoint limits each user to 10 analyses/hour and the application to 100/hour. Each analysis makes one serverless Kimi K2.5 Converse call, with 4096 output tokens maximum and a 40-second timeout. The frontend proxy timeout is 90 seconds. Provider calls are not automatically retried. Disabled features, credit setup, denied access, throttling, invalid output and timeouts leave manual entry available. API responses never expose provider error bodies or credentials.

No Bedrock AgentCore, provisioned throughput, custom-model hosting, vector database or separately deployed model endpoint is needed. `BEDROCK_AGENT_ENABLED` is the application feature switch, not an AWS managed-agent resource. Only `moonshotai.kimi-k2.5` is allowed by the adapter. Marketplace model IDs are rejected.

[AWS lists Moonshot AI among providers not sold through Marketplace](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html). [Kimi K2.5 supports images, text output, Converse and in-region Mumbai inference](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-moonshot-ai-kimi-k2-5.html). This avoids Marketplace model subscriptions and hosted endpoints, but does not make token inference free.

Your hackathon/institution credits must list Amazon Bedrock as an eligible service, have remaining balance and be unexpired. The application cannot prove this from an API key. Check AWS Billing → Credits and the grant terms, then set `BEDROCK_CREDITS_CONFIRMED=true`. It remains false in the prepared env, so no live inference occurs before that check. [AWS credit rules](https://aws.amazon.com/awscredits/) apply; AWS Activate coverage is a separate credit program and is not proof that a hackathon grant covers a model. Use AWS Budgets/usage alerts for account-level spend monitoring; the request limits are not a billing cap.

Bedrock authorization requires `bedrock:InvokeModel` for `arn:aws:bedrock:ap-south-1::foundation-model/moonshotai.kimi-k2.5`. The bearer key must have permission in `ap-south-1`; an expired or unauthorized key produces an actionable API error. Enable model access in the account if necessary. No cloud resources or live model calls were made during implementation.

## Switch mail providers through env

`MAIL_PROVIDER=smtp` uses Nodemailer. `MAIL_PROVIDER=nodemailer` is also accepted as an alias. Gmail uses port 587 with mandatory STARTTLS, or port 465 with TLS from connection start. TLS verification remains enabled, TLS 1.2 is the minimum, and connections have bounded timeouts. Use a freshly generated Google app password with two-step verification enabled. The SMTP password placeholder is intentionally empty. Gmail delivery limits still apply; verification email requires the email worker to be running.

To switch later, set `MAIL_PROVIDER=ses`, `AWS_REGION=ap-south-1` and `SES_FROM` to your verified SES sender. No code change is needed. SES sandbox restrictions and sender/domain verification must be completed before sending to arbitrary recipients. The AWS role needs `ses:SendEmail`. `MAIL_PROVIDER=file` writes messages under `.local/mail` for offline development and tests.

All three providers share the existing transactional outbox. Registration/reset messages and handover notifications use the same templates. Workers lease jobs, retry with bounded backoff and stop after five failed attempts. Private contacts remain visible only to the two handover participants after acceptance; emails link to the authenticated handover. A provider change does not change request, reservation, completion, contact or history rules. Delivery is at least once: a crash after provider acceptance may cause duplicate email, while handover records/counts remain deduplicated.

Run the worker in a separate terminal:

```powershell
pnpm.cmd --filter backend mail:work --watch
```

## Backend folders

```text
apps/backend/src/
  config/env.ts
  db/client.ts
  db/readiness.ts
  http/router.ts
  http/server.ts
  http/request.ts
  middleware/csrf.ts
  middleware/request-body.ts
  modules/auth/service.ts
  modules/marketplace/service.ts
  modules/photos/service.ts
  modules/mail/service.ts
  modules/mail/smtp.ts
  modules/analysis/config.ts
  modules/analysis/bedrock.ts
  modules/analysis/drafts.ts
  modules/analysis/service.ts
  shared/errors.ts
  shared/validation.ts
  generated/prisma/
  index.ts
```

HTTP middleware handles origin checks and bounded JSON parsing. Services own domain behavior; Prisma and cloud adapters are separate boundaries. Shared `ItemDraft` and `PhotoAnalysisResult` live in `packages/domain`. Listing UI and page props live under `apps/web/components/listings` and `apps/web/types/listings/type.ts`. Tests and mail/browser scripts import the new module paths directly; no old flat-file forwarding wrappers remain.

## Database startup and migrations

Start Docker Desktop before these commands. From the repository root:

```powershell
pnpm.cmd --filter backend db:local
pnpm.cmd --filter backend db:migrate
pnpm.cmd --filter backend db:generate
pnpm.cmd dev
```

`db:local` creates/starts the Compose PostgreSQL service and its `reclaim` database on port 54330. `db:migrate` applies the versioned Prisma migrations. A missing Docker engine caused the attached setup failure; the Prisma client generation itself succeeded. Node 22's unknown `.ts` extension error is handled by the explicit type-stripping flags; use Node 24 for the declared production runtime.

Before deploying, review the complete seller/buyer UI once at desktop and mobile widths: registration/verification, profile phone setup, manual and photo-assisted publication, buyer request, seller acceptance, private contact, seller completion and both histories. Confirm that the event date remains informational and never limits pickup. Then run lint, types, builds, API integration tests and browser tests. Configure rotated secrets, verify S3 upload/read and Gmail delivery with your own account, and confirm Bedrock credit eligibility before activating inference. Mock-provider tests do not certify live AWS billing or Google delivery.

## Startup schema validation

The current schema also includes `20261010000300_refresh_sessions`. Apply it before starting the updated backend; it adds hashed refresh credentials and their absolute expiry without deleting existing sessions. New logins issue 15-minute access and 14-day refresh cookies. `POST /api/auth/refresh` rotates them atomically; logout and password reset revoke them. See [frontend-data.md](./frontend-data.md#access-expiry-and-shared-refresh) for concurrency, retry and browser behavior.

The attached repeated `PrismaClientKnownRequestError` log came from two unapplied migrations in the development database. Both were applied with `pnpm.cmd --filter backend db:migrate`. The API now checks the database migration history against the migration directories before opening its listener. A missing database/schema or pending migration stops startup with the exact migration command, rather than serving a stream of failed requests. Deployment must include `prisma/migrations`, as already required by the migration CLI. Request logs include error codes without database URLs, credentials or raw SQL.

The hydration warning in the attached log shows an extra `cz-shortcut-listen` attribute injected into the body. The application does not set that attribute. Use a browser profile without the injecting extension to verify hydration; broad warning suppression is not added to the application.
