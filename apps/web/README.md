# Reclaim web

Next.js frontend for the Reclaim marketplace. Start with the [root setup guide](../../README.md). Server data uses TanStack Query; local client state uses Zustand. Shared marketplace types come from `@repo/domain`.

## Development

Use Node.js 24+ and pnpm 12.6.0. Install workspace dependencies from the repository root, copy this app's `.env.example` to `.env` if it does not exist, and start the backend with its database migrations applied.

```powershell
pnpm.cmd dev
```

To start only the frontend:

```powershell
pnpm.cmd --filter web dev
```

Open `http://localhost:3001`. Visitors can browse items without signing in. Publishing, saving and requesting items require an account; email verification is optional.

## API proxy

`BACKEND_URL=http://127.0.0.1:3002` is the internal backend origin. Next.js forwards `/api/*` requests to it, keeping browser API calls on the frontend origin. Set it before building because the rewrite destination is embedded in the build. Rebuild after changing it.

Do not add AWS, SMTP or database credentials to this app. They belong in the backend environment and must never use a `NEXT_PUBLIC_` prefix.

## Build and checks

Run from the repository root:

```powershell
pnpm.cmd --filter web lint
pnpm.cmd --filter web check-types
pnpm.cmd --filter web test
pnpm.cmd --filter web build
pnpm.cmd --filter web start
```

The production server also uses port 3001. Keep the configured backend reachable.

Browser tests require Docker PostgreSQL and Chromium:

```powershell
pnpm.cmd --filter web exec playwright install chromium
pnpm.cmd --filter web test:e2e
```

See [operations](../../docs/backend-setup.md) for test service configuration and [manual testing](../../docs/test.md) for the seller/buyer walkthrough.

## Source layout

- `app/`: pages and layouts.
- `components/`: product screens and reusable UI.
- `lib/api/`: typed API services and request handling.
- `hooks/`: query and mutation hooks.
- `e2e/`: browser integration tests.

Payments and transport are arranged between participants. The frontend does not process payments.
