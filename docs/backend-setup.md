# Running the Reclaim backend

The marketplace backend is an independent Node app under `apps/backend`; the Next.js frontend lives under `apps/web`. Shared models live in `packages/domain`. Photo analysis suggests editable drafts through Bedrock. PostgreSQL is authoritative; browsers contain no seeded accounts or marketplace records. See [backend-aws.md](./backend-aws.md) for the configured S3 bucket, SMTP/SES switch and AI settings.

## Local development

Use Node 24 or later, the pinned pnpm version and Docker Desktop with the engine running. Development/test scripts include `--experimental-strip-types` so they also execute on Node 22.14; Node 24 remains the declared deployment version. On Windows with PowerShell script execution disabled, use `pnpm.cmd` instead of `pnpm`.

From the repository root:

```sh
pnpm install
```

Copy `apps/backend/.env.example` to `apps/backend/.env` and `apps/web/.env.example` to `apps/web/.env`. Database, storage and mail configuration belong to the backend; the frontend only needs `BACKEND_URL` (default `http://127.0.0.1:3002`). The example selects S3 and SMTP: fill the required credentials first, or use `STORAGE_PROVIDER=local` and `MAIL_PROVIDER=file` for offline development. The example database credentials are only for the loopback development database. Start the Docker database in the background:

```sh
pnpm --filter backend db:local
```

Then apply migrations and start the application:

```sh
pnpm --filter backend db:migrate
pnpm --filter backend db:generate
pnpm dev
```

The API starts the mail worker automatically. For a separately supervised worker, set `MAIL_WORKER_ENABLED=false` on the API process and run:

```sh
pnpm --filter backend mail:work --watch
```

`pnpm dev` starts both apps: frontend on 3001 and backend on 3002, with mail outbox processing enabled by default. You can also start them individually with `pnpm --filter web dev` and `pnpm --filter backend dev`. Open `http://localhost:3001/register`; registration signs you in immediately. Add a locality and mobile number in Profile. Email verification is optional: choose Verify email in Profile when ready. With SMTP, the worker sends a styled verification email through Gmail; with `MAIL_PROVIDER=file`, messages are JSON files under `.local/mail/` containing recipient, subject, text and HTML. Enter the six-digit code within ten minutes, or choose Verify later and keep using your account. Use a separate browser profile or private window for the other participant. Every account can both offer and collect materials, including before email verification.

`db:local` runs `docker compose up -d --wait postgres redis`. PostgreSQL 18 listens only on `127.0.0.1:54330`; the development database is `reclaim`. Redis listens on `127.0.0.1:63790` and holds ten-minute email OTPs. Set `REDIS_URL=redis://127.0.0.1:63790` locally. Both services persist data in their Docker volumes. `pnpm --filter backend db:stop` stops both services without deleting their data. The previous embedded database, if present in `.local/postgres`, is left intact and is no longer used by the default setup.

The Prisma schema is [`apps/backend/prisma/schema.prisma`](../apps/backend/prisma/schema.prisma). The PostgreSQL adapter and singleton Prisma Client are in `apps/backend/src/db/client.ts`. Prisma owns versioned SQL migrations in `apps/backend/prisma/migrations/`, including CHECK constraints and partial unique indexes that protect stock and whole-batch handovers. Normal CRUD uses Prisma models; complex discovery reads and row/advisory locks use parameterized SQL through Prisma Client.

```sh
# Create and apply a schema change during development.
pnpm --filter backend db:dev --name descriptive_change
# Regenerate the typed client after schema changes.
pnpm --filter backend db:generate
# Browse and edit local database records.
pnpm --filter backend db:studio
```

Review generated migrations before applying them, retaining the SQL-only CHECK constraints and partial unique indexes. Never edit an applied migration. `db:migrate` runs `prisma migrate deploy` and is also the deployment command. Client generation runs automatically for backend development, build, type checks and tests; generated files are ignored by Git.

For an existing database managed by the previous SQL runner, back it up, set `DATABASE_URL` to that database, and run `pnpm --filter backend db:baseline` once before `db:migrate`. The baseline command validates both legacy migration checksums before marking them applied in Prisma. It transfers migration metadata to `_prisma_migrations` and removes only the obsolete `schema_migrations` table; application records remain intact. The new Docker database does not need this command. To move old local records into Docker, restore a database backup into Docker before baselining; changing the connection URL alone does not copy records.

## Verification

```sh
pnpm test
pnpm --filter web test:e2e
pnpm check-types
pnpm lint
pnpm build
```

Domain and API integration tests create isolated databases inside Docker PostgreSQL and apply the real Prisma migrations. Each run removes only its own randomly named test database. They verify real transactions, uniqueness constraints, authorization and email behavior, plus legacy migration adoption without losing records. Browser tests use the same isolation mechanism and start a frontend on port 3101 and an HTTP backend on an automatically allocated port. Failure traces remain under `apps/web/test-results/`.

`TEST_DATABASE_URL` optionally points to a PostgreSQL server that permits creating databases, as in CI. Its database is the administrative connection only: every run creates a separate `reclaim_test_<uuid>` database. With this variable set, tests do not start Docker themselves. Without it, the test helper starts the Compose service and uses the default local credentials. Development records are never used for test assertions or cleared.

Install the browser once with `pnpm --filter web exec playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an existing compatible Chromium executable. Test artifacts and development service data are ignored by Git.

## HTTP contract

The backend serves `/api`; Next.js proxies that path using `BACKEND_URL`, so browser requests and session cookies remain on the frontend origin. See [backend.md](./backend.md) for the product and endpoint contract. The dashboard loads `/api/board`, which returns only public listing/profile fields plus the current account's records. Private pickup contacts are scoped to individual participant deals. Public discovery and profile responses never return email addresses or private mobile numbers.

Additional routes are `/api/auth/register`, `/login`, `/logout`, `/session`, `/verify`, `/resend`, `/forgot` and `/reset` under `/api/auth`; item gallery updates use `PATCH /api/items/:id/photos`; photo derivatives use `GET /api/photos/:id`.

Authenticated marketplace mutations require an `Idempotency-Key` header containing 16–128 URL-safe characters. Generate a UUID per logical action and retain it for a retry. Reusing a key with a different operation or body returns a conflict. Item and deal mutations accept an optional positive integer `If-Match` revision; stale revisions return 409. The frontend supplies both automatically.

Browser mutations require an `Origin` exactly matching `APP_URL`, including its port, and use `HttpOnly`, `SameSite=Lax` access/refresh cookies (`Secure` in production). Errors return `{ error: { code, message, fields? } }` with 400, 401, 403, 404, 409, 413, 415, 422, 429 or 503 as appropriate. Access tokens last fifteen minutes; rotating refresh tokens have a fixed fourteen-day lifetime. Logout or password reset revokes sessions. Passwords use salted scrypt; session and reset tokens are stored as hashes. Email verification uses a salted six-digit OTP hash in Redis with a ten-minute TTL; `/api/auth/verify` accepts `{ email, code }`. Only password reset uses a URL-fragment token.

Uploads use multipart `photo` files and a 10 MB source limit. The server decodes JPG/PNG/WebP, limits pixel count, removes metadata, rotates/resizes and stores a JPEG derivative. Publication and gallery edits require uploads owned by the current user. The database stores object keys, never browser data URLs. Unpublished derivatives are visible only to the uploader.

## Production configuration

Run PostgreSQL, a private authenticated Redis service, a private S3 bucket, the Node backend, the Next.js frontend and a continuously running mail worker. The API includes its own worker unless `MAIL_WORKER_ENABLED=false`; use that setting when separately supervising `mail:work --watch`. Set production `REDIS_URL`, preferably using `rediss://` for TLS, and keep Redis on a private network. Apply migrations once before starting the new application version. No AWS resources are provisioned automatically.

Set the following in your deployment's secret/environment manager:

| Variable           | Value                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `production`                                                                                                            |
| `APP_URL`          | Exact public HTTPS origin                                                                                               |
| `DATABASE_URL`     | PostgreSQL connection URL with verified TLS, normally `sslmode=verify-full` and the provider's trusted CA configuration |
| `STORAGE_PROVIDER` | `s3`                                                                                                                    |
| `BUCKET_NAME`      | `s3-bucket-tanveer-2026`; `S3_BUCKET` is an equivalent alias. Conflicting aliases are rejected.                         |
| `AWS_REGION`       | Region containing the bucket and SES identity                                                                           |
| `MAIL_PROVIDER`    | `smtp` for Gmail now; `ses` for SES later                                                                               |
| `SES_FROM`         | Verified SES sender address                                                                                             |

Production refuses local file photo/email providers and a non-HTTPS origin. Use an IAM workload role rather than embedding AWS access keys. The application needs `s3:PutObject`, `s3:GetObject` and `s3:DeleteObject` only under `arn:aws:s3:::YOUR_BUCKET/derivatives/*`. With SES selected, also grant `ses:SendEmail` for your sender identity and resolve sandbox/recipient restrictions before public registration. With SMTP selected, supply the SMTP credentials described in [backend-aws.md](./backend-aws.md). Block public bucket access. Only sanitized derivatives are served through the application.

Set the frontend's `BACKEND_URL` to the backend's private origin before building with `pnpm build`; Next.js embeds rewrite destinations at build time. Start `pnpm --filter backend start` and `pnpm --filter web start` as separate services, and run `pnpm --filter backend mail:work --watch` as a separately supervised process. Deploy the backend with its workspace dependencies, including `packages/domain`; include the `prisma/` directory, `prisma.config.ts` and migration CLI scripts in the release for `db:migrate`. The build generates Prisma Client and compiles it into `dist/generated/`. `BACKEND_PORT` defaults to 3002 and `BACKEND_HOST` defaults to `127.0.0.1`; use `0.0.0.0` for a container/private service network. The API never waits for email delivery to complete a handover. Configure process restart, database backups, HTTPS termination, request-size limits and monitoring in the hosting environment.

Notifications and email jobs commit in the same transaction as marketplace transitions. Notifications and jobs are deduplicated. Workers claim jobs with leases and `FOR UPDATE SKIP LOCKED`; transient failures retry with bounded backoff, and five failed attempts leave a visible `failed` job. SES delivery is at least once: a crash after provider acceptance but before recording its message ID can produce a duplicate email. Product records and counts remain exactly once. Inspect `outbox.status`, `attempts`, `last_error` and `provider_message_id` for operations; deliberately reset a failed job to `pending` after fixing its cause.

Contact access lasts through acceptance and 30 days after seller completion. Completion records remain permanent. Impact totals derive from Done deals; only listings whose unit is kg contribute to estimated kilograms. There is no payment processing or automatic listing expiry. `POST /api/analysis` accepts an owned upload ID and returns suggested drafts; see [backend-aws.md](./backend-aws.md).
