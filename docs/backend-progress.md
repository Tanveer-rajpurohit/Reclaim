# Backend implementation checklist

Scope: implement the normal backend and connect the current UI. AI analysis is excluded.

- [x] Review existing routes and interactions at desktop and mobile widths.
- [x] PostgreSQL schema, migrations, constraints and local development services.
- [x] Registration, email verification, login, logout, password reset and revocable sessions.
- [x] Server validation, session-derived authorization, CSRF protection and rate limits.
- [x] Atomic publication, editing, gallery changes and withdrawal.
- [x] Whole-batch requests, atomic acceptance and competing-request closure.
- [x] Cancellation, buyer acknowledgement and seller-only final completion.
- [x] Mutation idempotency, concurrency tests and transactional side effects.
- [x] Private photo uploads, server image validation and safe derivatives.
- [x] Public profiles, private contacts, saved items, activity and handover history.
- [x] Durable email outbox, worker retries and local/SES delivery adapters.
- [x] Replace demo identity/storage and remove actor simulation/reset controls.
- [x] Validate both users' histories, notices, private contacts and impact totals.
- [x] Run domain/integration/browser tests, type checks, lint and production build.
- [x] Document configuration, local startup and production operation.

## Verification evidence (10 October 2026)

- Reviewed all 14 original UI routes at desktop/mobile sizes before integration; screenshots are local ignored artifacts under `.local/review`.
- [Schema and migrations](../apps/backend/prisma/migrations/) implement normalized records, foreign keys, checks and active-request/reservation/completion uniqueness. The local Docker PostgreSQL database uses UTF-8 and has both Prisma migrations applied. The schema is in `apps/backend/prisma/schema.prisma`.
- [Backend integration tests](../apps/backend/tests/backend.test.mjs) use isolated real PostgreSQL, real password/session handling, HTTP requests and the file email worker. All **17 domain/API tests passed**: 10 domain cases and 7 broader API scenarios.
- These scenarios cover two competing accepts, stale revisions, idempotency fingerprints and completion retries, contact privacy/expiry, both histories/notices, cancellation by either participant, atomic multi-item publication, malformed/foreign photo references, actual image decoding, token revocation, CSRF, unread persistence and transient/permanent email failures.
- [Browser tests](../apps/web/e2e/marketplace.spec.ts) passed **4/4** across desktop Chromium and a mobile viewport. Separate verified seller/buyer sessions publish an old event, upload/reorder/remove photos, use the category dropdown by keyboard, save/request/review profiles, accept, acknowledge and complete. Both accounts' notices and impact are checked after refresh; public browsing and protected empty states also pass.
- Root `pnpm check-types`, `pnpm lint` and `pnpm build` passed after the final code changes. Frozen offline dependency installation passed. The running app's `/api/health` and anonymous `/api/board` returned successfully against the local database.
- [CI workflow](../.github/workflows/ci.yml) runs the tests, browser checks, types, lint and build. This workflow has been added but has not been run on GitHub.

## App separation verification (10 October 2026)

- Backend services, migrations, database tools and mail worker now live in the independent `apps/backend` workspace. Next.js forwards `/api/*` to `BACKEND_URL`.
- Shared marketplace models and validation helpers live in `packages/domain`; backend runtime code has no dependency on frontend files or Next.js.
- All **20 unit/API/transport tests** and **4 desktop/mobile browser tests** passed after separation. Browser tests exercise the HTTP backend through the frontend proxy, including sessions and photo uploads.
- Root type checks, lint, production builds and a frozen offline installation passed. The compiled backend also started in its own process against an isolated database, applied both bundled SQL migrations and served health/public board responses successfully.

## Prisma and Docker verification (10 October 2026)

- Prisma Client 7.10 and the PostgreSQL adapter now handle backend database access. The schema lives in `apps/backend/prisma/schema.prisma`; Prisma Migrate owns both SQL migrations and `_prisma_migrations` history.
- Docker Compose runs PostgreSQL 18 on loopback port 54330 with a persistent volume. The old embedded database files are preserved, and the embedded-postgres dependency and launchers were removed.
- All **21 domain/API/transport/migration tests** and **4 desktop/mobile browser tests** passed against isolated Docker databases. The migration regression rejects altered legacy checksums, adopts existing records, confirms no schema drift and verifies database stock/quantity constraints through Prisma Client.
- Root type checks, lint and production builds passed. Both migrations applied successfully to the development Docker database, and Prisma reported no schema difference. The running backend and frontend proxy returned healthy responses and the anonymous board loaded successfully.
- CI now provisions a PostgreSQL service and generates Prisma Client before tests. Live GitHub CI execution remains a separate check after pushing.

## Deployment boundary

[Setup and operations](./backend-setup.md) cover local startup and production configuration. Local PostgreSQL, file photo storage and file email delivery were exercised. S3 and SES adapters are implemented, but AWS resources, real email delivery and a production deployment have not been provisioned or verified with live credentials. Email delivery is at least once; product records and notices are deduplicated transactionally. AI endpoints and analysis remain outside scope.
