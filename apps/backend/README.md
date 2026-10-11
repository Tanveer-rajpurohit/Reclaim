# Reclaim backend

Independent Node.js/TypeScript HTTP API, using shared marketplace types from `@repo/domain`. It handles accounts, sessions, verification, listings, uploads, AI suggestions, handovers, notifications and email delivery.

## Development

Use Node.js 24+, pnpm 12.6.0 and Docker Desktop. Run commands from the repository root:

```powershell
pnpm.cmd install --frozen-lockfile
Copy-Item apps/backend/.env.example apps/backend/.env
pnpm.cmd --filter backend db:local
pnpm.cmd --filter backend db:migrate
pnpm.cmd --filter backend dev
```

Copy the example only if `.env` does not exist. Fill in the selected providers before starting. The example selects S3, SMTP and Bedrock. To develop without cloud services, use:

```dotenv
STORAGE_PROVIDER=local
MAIL_PROVIDER=file
BEDROCK_AGENT_ENABLED=false
```

The API listens on `127.0.0.1:3002`. Root `pnpm.cmd dev` starts both apps. Prisma generation runs automatically before development, builds, type checks and tests. Local file emails appear in `.local/mail/`.

## Database and Redis

`db:local` starts PostgreSQL and Redis using the root Compose file. PostgreSQL creates the `reclaim` database with the example credentials on loopback port 54330. Redis uses loopback port 63790. Named Docker volumes retain their data.

```powershell
pnpm.cmd --filter backend db:migrate
pnpm.cmd --filter backend db:generate
pnpm.cmd --filter backend db:dev --name descriptive_change
pnpm.cmd --filter backend db:studio
pnpm.cmd --filter backend db:stop
```

Use `db:migrate` to apply committed migrations. Use `db:dev` only when creating a schema change. Review the generated SQL, including constraints and partial indexes. Never edit a migration already applied to a shared database. Startup checks that the required schema is present.

The schema is in [prisma/schema.prisma](prisma/schema.prisma); migrations are in `prisma/migrations/`. Redis stores hashed verification codes with a ten-minute expiry.

## Environment

| Setting                                 | Purpose                                                 |
| --------------------------------------- | ------------------------------------------------------- |
| `APP_URL`                               | Public frontend origin for email links and CSRF checks  |
| `BACKEND_HOST`, `BACKEND_PORT`          | API listener; use `0.0.0.0` inside a deployed container |
| `DATABASE_URL`                          | PostgreSQL connection                                   |
| `REDIS_URL`, `REDIS_PREFIX`             | Verification store and key namespace                    |
| `STORAGE_PROVIDER`                      | `s3` or development-only `local`                        |
| `BUCKET_NAME`, `AWS_REGION`             | S3 bucket and AWS region                                |
| `MAIL_PROVIDER`                         | `smtp`, `ses` or development-only `file`                |
| `SMTP_*`                                | SMTP login and sender; port 587 uses STARTTLS           |
| `SES_FROM`                              | Verified sender when using SES                          |
| `MAIL_WORKER_ENABLED`                   | Run the outbox processor inside the API by default      |
| `AWS_BEDROCK_API_KEY`                   | Bedrock bearer key, preferred over the standard alias   |
| `BEDROCK_AGENT_ENABLED`                 | Enable photo suggestions                                |
| `AWS_BEDROCK_MODEL_ID`                  | Supported model: `moonshotai.kimi-k2.5`                 |
| `AGENT_MAX_TOKENS`, `AGENT_TEMPERATURE` | AI response limits                                      |
| `LOCAL_DATA_DIR`                        | Directory for development file storage and email        |

S3 and SES use the AWS SDK credential chain. Use a workload IAM role in production; local development can use credentials in the private environment file. Bedrock uses its separately configured bearer key. Suggestions are editable before publishing; AI does not publish items or accept requests.

## Email worker

The API processes the transactional outbox by default. For a separate worker, set `MAIL_WORKER_ENABLED=false` on the API and run:

```powershell
pnpm.cmd --filter backend mail:work --watch
```

Without `--watch`, the worker processes one batch and exits. Handover notification emails require verified recipient addresses; in-app records remain available to participants.

## Build and deploy

```powershell
pnpm.cmd --filter backend db:migrate
pnpm.cmd --filter backend build
pnpm.cmd --filter backend start
```

Set production environment values before deployment. Production requires HTTPS `APP_URL`, S3 storage and SMTP or SES. Keep PostgreSQL and Redis private, configure database TLS and backups, and store secrets outside Git. Apply migrations before starting the new API. The web app must be built with the correct backend origin.

## Checks

```powershell
pnpm.cmd --filter backend lint
pnpm.cmd --filter backend check-types
pnpm.cmd --filter backend test
pnpm.cmd --filter backend build
```

Database integration tests use an isolated test database; configure `TEST_DATABASE_URL` as described in [operations](../../docs/backend-setup.md).

The optional `pnpm.cmd --filter backend check:services` checks SMTP authentication and temporary S3 upload/read/delete operations without sending email. Add `--analyze` only when you intend to make a paid live Bedrock inference request.

See the [backend contract](../../docs/backend.md) for authentication, acceptance, contact sharing and handover completion rules.
