# Reclaim web

Next.js frontend. The separate [backend app](../backend/README.md) serves the marketplace API. Start at the [repository README](../../README.md) and [backend setup guide](../../docs/backend-setup.md).

Development and production frontend servers listen on port 3001. Copy `.env.example` to `.env` to configure `BACKEND_URL`; Next.js forwards `/api/*` to that origin, preserving same-origin sessions and CSRF checks. Set `BACKEND_URL` before building because rewrite destinations are embedded in the build.
