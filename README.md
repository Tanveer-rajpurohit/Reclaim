# Reclaim

Reclaim helps reusable materials and sorted recyclables left after events and cleanups reach people who need them. Sellers offer batches for free or for a price. Buyers request collection, sellers accept, and both keep a record when the seller completes the handover. Payments and transport are arranged directly between participants.

Anyone can explore the board and item details. Sign in to publish, save items or send requests. Email verification is optional and available from Profile. After acceptance, participants can see each other's email and any provided phone number. Event dates provide context; they do not limit collection.

## Stack

| Part                  | Technology                                                    |
| --------------------- | ------------------------------------------------------------- |
| Frontend              | Next.js, React, TypeScript, Tailwind CSS                      |
| Client data and state | TanStack Query and Zustand                                    |
| Backend               | Node.js and TypeScript                                        |
| Database              | PostgreSQL with Prisma migrations                             |
| Verification codes    | Redis, with ten-minute expiry                                 |
| Photos                | Amazon S3, or local storage for development                   |
| Photo suggestions     | Kimi K2.5 through Amazon Bedrock; editable before publication |
| Email                 | Transactional outbox with SMTP, SES or local file delivery    |

## Local setup

Use Node.js 24+, pnpm 12.6.0 and Docker Desktop with Docker Compose. Run commands from the repository root. These examples use PowerShell on Windows; elsewhere use `pnpm` and your shell's copy command.

```powershell
pnpm.cmd install --frozen-lockfile
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Copy examples only when those `.env` files do not already exist. Keep credentials out of Git. The backend example selects S3, SMTP and Bedrock: fill in your own bucket, AWS credentials, Bedrock key and SMTP credentials. For development without cloud services, change these values:

```dotenv
STORAGE_PROVIDER=local
MAIL_PROVIDER=file
BEDROCK_AGENT_ENABLED=false
```

Start PostgreSQL and Redis, apply committed migrations and start both apps:

```powershell
pnpm.cmd --filter backend db:local
pnpm.cmd --filter backend db:migrate
pnpm.cmd dev
```

Open [Reclaim](http://localhost:3001). The backend listens at `http://127.0.0.1:3002`. Prisma generation runs automatically before backend development and builds. The API processes the email outbox by default. With file delivery, messages appear in `.local/mail/`. Use separate browser sessions to test seller and buyer accounts.

## Database commands

| Command from the root                                        | Purpose                             |
| ------------------------------------------------------------ | ----------------------------------- |
| `pnpm.cmd --filter backend db:local`                         | Start PostgreSQL and Redis          |
| `pnpm.cmd --filter backend db:migrate`                       | Apply committed migrations          |
| `pnpm.cmd --filter backend db:generate`                      | Generate the Prisma client manually |
| `pnpm.cmd --filter backend db:dev --name descriptive_change` | Create a development migration      |
| `pnpm.cmd --filter backend db:studio`                        | Open Prisma Studio                  |
| `pnpm.cmd --filter backend db:stop`                          | Stop services and retain their data |

Compose creates the `reclaim` database automatically. PostgreSQL uses loopback port 54330 and Redis uses 63790. Docker volumes preserve their data. Review generated SQL; never edit a migration already applied to a shared database.

## Build and run

```powershell
pnpm.cmd build
```

Start each app in a separate terminal:

```powershell
pnpm.cmd --filter backend start
```

```powershell
pnpm.cmd --filter web start
```

Set the web app's `BACKEND_URL` before building; Next.js embeds the proxy destination in the build. Apply migrations before starting a deployed backend. Production requires HTTPS `APP_URL`, S3 and SMTP or SES. Keep databases private, configure backups and use workload IAM roles where possible. These commands do not provision AWS infrastructure.

## Checks

```powershell
pnpm.cmd lint
pnpm.cmd check-types
pnpm.cmd test
pnpm.cmd build
```

Browser tests require Chromium and Docker PostgreSQL:

```powershell
pnpm.cmd --filter web exec playwright install chromium
pnpm.cmd --filter web test:e2e
```

The optional `pnpm.cmd --filter backend check:services` checks SMTP authentication and S3 with a temporary upload, read and deletion. It does not send email. Adding `--analyze` makes a live Bedrock request and can incur inference charges.

## Guides

- [Frontend](apps/web/README.md): API proxy, development and browser checks.
- [Backend](apps/backend/README.md): database, storage, email, AI and deployment.
- [Backend contract](docs/backend.md): authentication and handover rules.
- [Operations](docs/backend-setup.md): detailed configuration and checks.
- [Manual testing](docs/test.md): sample photos and walkthrough.

Keep contributions focused, reuse domain types and include migrations when database behavior changes. Never commit credentials, private environment files or local data.
