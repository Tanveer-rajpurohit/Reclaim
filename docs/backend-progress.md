# Backend implementation checklist

Scope: implement the normal backend and connect the current UI. Photo-to-draft analysis and switchable SMTP/SES delivery have now been added; see [backend-aws.md](./backend-aws.md).

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
- [x] Durable email outbox, worker retries and file/SMTP/SES delivery adapters.
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

## S3, SMTP and photo-analysis verification

- Backend source is organized into config, database, HTTP, middleware, shared validation and domain modules. Import paths, scripts and tests were updated together.
- S3 defaults now select the Mumbai bucket `s3-bucket-tanveer-2026` through `BUCKET_NAME`; conflicting `S3_BUCKET` aliases fail validation. No local fallback is used with S3 selected.
- `MAIL_PROVIDER=smtp` uses Gmail through Nodemailer; `ses` and `file` remain selectable without code changes. STARTTLS configuration and outbox delivery were exercised with a mocked SMTP transport.
- The owned-upload photo-analysis API uses one Kimi K2.5 serverless call (`moonshotai.kimi-k2.5`) for image understanding and listing text in Mumbai. Nova/GLM and the second inference call have been removed. Provider response validation, malformed/truncated output, upload ownership and credit gating are covered by tests. No live model calls were made.
- Final verification passed: 19 backend tests with real PostgreSQL migrations, 10 domain tests, 6 desktop/mobile Playwright tests using installed Chrome, repository lint/type checks and production builds. Browser coverage includes photo suggestions, preservation of manual edits, provider-error fallback and the complete seller/buyer handover flow. Startup now checks for missing migrations before serving requests; both development migrations have been applied.
- The initial database test attempt failed during Docker image/setup initialization. After PostgreSQL became healthy, the complete suite passed. Browser tests initially lacked Playwright's downloaded Chromium; rerunning with the installed Chrome executable passed. Node 22 type-stripping flags resolve the attached `.ts` execution failure.

## Live service checks

[Setup and operations](./backend-setup.md) cover local startup and production configuration. Local PostgreSQL, file photo storage and file email delivery were exercised. S3, SMTP, SES and Bedrock adapters are implemented; live cloud storage, model inference, external email delivery and production deployment require account configuration and have not been verified with live credentials. Email delivery is at least once; product records and notices are deduplicated transactionally. The photo-analysis endpoint and UI are implemented and tested with mocked model responses. Credit confirmation remains disabled in the prepared env.
