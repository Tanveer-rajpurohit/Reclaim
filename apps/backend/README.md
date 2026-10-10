# Reclaim backend

Independent Node 24+ HTTP API on `127.0.0.1:3002`. Authentication, PostgreSQL, uploads, migrations and email delivery live here. Shared marketplace models come from `@repo/domain`.

Start Docker Desktop. Copy `.env.example` to `.env`. From the repository root:

```sh
pnpm --filter backend db:local
pnpm --filter backend db:migrate
pnpm --filter backend db:generate
pnpm --filter backend dev
pnpm --filter backend mail:work --watch
```

PostgreSQL runs in Docker on `127.0.0.1:54330` with a persistent named volume. `db:stop` stops it without deleting data. Run the worker in a separate terminal. Root `pnpm dev` starts both application servers. Use `pnpm --filter backend build` and `pnpm --filter backend start` for the compiled API, and `pnpm --filter backend test` for API and transport checks.

The schema is in [`prisma/schema.prisma`](prisma/schema.prisma), with SQL constraints and migrations in `prisma/migrations/`. Use `db:dev --name descriptive_change` to create a migration and `db:studio` to inspect records.

`APP_URL` is the public frontend origin used for email links and CSRF checks. `BACKEND_HOST` and `BACKEND_PORT` control the API listener. Set `BACKEND_HOST=0.0.0.0` when deploying behind a container or private service network. Browsers access `/api` through the frontend proxy. See [setup and operations](../../docs/backend-setup.md) for deployment requirements.
