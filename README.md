# Reclaim

A marketplace for reusable materials and sorted recyclables left after events. Organisers publish whole batches, buyers request them, and sellers complete handovers after collection. Payments and delivery arrangements happen directly between participants.

The app uses Next.js, React, TypeScript and Tailwind in a pnpm/Turborepo workspace. The normal backend uses Prisma ORM for PostgreSQL persistence, verified email/password accounts, revocable sessions, photo storage, transactional handovers, notifications and an email outbox. AI photo suggestions are not implemented.

## Run locally

Use Node 24+, pnpm 12.6.0 and Docker Desktop (running). Install dependencies, copy each app's `.env.example` to `.env` (`apps/backend` and `apps/web`), then run these in separate terminals as needed:

```sh
pnpm install
pnpm --filter backend db:local
pnpm --filter backend db:migrate
pnpm --filter backend db:generate
pnpm dev
pnpm --filter backend mail:work --watch
```

`pnpm dev` starts the frontend on port 3001 and the backend on port 3002. Open `http://localhost:3001/register`. Local verification and reset emails appear in `.local/mail/`. Complete verification, sign in and add your locality/mobile number in Profile. Use separate browser sessions to test both sides of a handover.

See [backend setup](docs/backend-setup.md) for the full startup sequence, configuration, tests, Docker PostgreSQL and S3/SES production operation.

## Repository

- `apps/web/app`: Next.js pages; `/api` requests proxy to the backend.
- `apps/web/components`: landing page and marketplace screens.
- `apps/backend/src`: independent Node HTTP server, authentication, PostgreSQL services, photo storage and Prisma database access.
- `apps/backend/prisma`: database schema and versioned SQL migrations.
- `apps/backend/scripts`: database tools, email worker and browser-test service setup.
- `apps/backend/tests`: API, transport and PostgreSQL integration tests.
- `packages/domain`: shared marketplace models and validation helpers used by both apps.
- `apps/web/lib`: frontend helpers and workflow rules/tests.
- `apps/web/e2e`: desktop/mobile browser integration tests.
- `packages`: shared TypeScript, ESLint and Tailwind configuration.
- `docs`: product plan, feature scope and backend contract.

## Checks

```sh
pnpm test
pnpm --filter web test:e2e
pnpm check-types
pnpm lint
pnpm build
```

Browser tests require Chromium; install it with `pnpm --filter web exec playwright install chromium`.
