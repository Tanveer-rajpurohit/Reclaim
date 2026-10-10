# Frontend data and access

`lib/api/fetch.ts` is the only browser HTTP transport. It sends same-origin cookies, supports abort signals and multipart uploads, and exposes structured API errors. Feature services in `lib/api` map authentication, marketplace commands, photos and public profiles to the existing backend contracts.

`components/providers/QueryProvider.tsx` creates a QueryClient per mounted application. TanStack Query owns server snapshots and public profiles. Hooks in `hooks` handle reads and mutations. The marketplace query refreshes every 30 seconds while active and on focus; requests are cancellable. Successful commands refresh the marketplace and invalidate public profile history. Mutations are never automatically retried. Command retries preserve idempotency keys, while item/deal updates retain revision headers.

Zustand stores in `stores` hold discovery filters and transient error/login prompts. Remote records, phone numbers, auth tokens and sessions are not persisted in Zustand or localStorage. Authentication changes cancel outstanding queries, clear cached records and reset client state so another account cannot inherit private data.

Guests can open `/dashboard`, `/dashboard/items/[id]` and `/dashboard/people/[id]` without authentication. The home navigation opens the marketplace directly. The dashboard shows Sign in for guests; account navigation uses the shared AccountGate. Saving a material opens a dismissible keyboard-accessible login dialog. An available item shows a login link before requesting pickup. Login links carry a local dashboard return path, checked before navigation. Backend authentication and authorization remain the boundary for every write and private route.

Email verification, photo suggestions, listing publication, request/acceptance, private contacts and completion retain the existing backend workflow. The event date is informational and does not constrain the buyer's proposed pickup time.

Verify repository lint, types and build, plus the desktop/mobile browser suite. Browser coverage exercises public discovery, guest save prompts, public detail access, protected profile access, editable AI suggestions and the complete two-account handover flow.

Verification passed: repository lint, type checks and production build, formatting checks, 10 domain tests and all six desktop/mobile browser scenarios. The final guest scenarios were rerun independently after using a unique listing ID to isolate fixtures between browser projects; they also verify logout clears account access and login returns to the requested item.
