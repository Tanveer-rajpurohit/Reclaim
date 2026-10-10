# Frontend data and access

`lib/api/fetch.ts` is the only browser HTTP transport. It sends same-origin cookies, supports abort signals and multipart uploads, and exposes structured API errors. Feature services in `lib/api` map authentication, marketplace commands, photos and public profiles to the existing backend contracts.

`components/providers/QueryProvider.tsx` creates a QueryClient per mounted application. TanStack Query owns server snapshots and public profiles. Hooks in `hooks` handle reads and mutations. The marketplace query refreshes every 30 seconds while active and on focus; requests are cancellable. Successful commands refresh the marketplace and invalidate public profile history. Mutations are never automatically retried. Command retries preserve idempotency keys, while item/deal updates retain revision headers.

Zustand stores in `stores` hold discovery filters and transient error/login prompts. Remote records, phone numbers, auth tokens and sessions are not persisted in Zustand or localStorage. Authentication changes cancel outstanding queries, clear cached records and reset client state so another account cannot inherit private data.

Guests can open `/dashboard`, `/dashboard/items/[id]` and `/dashboard/people/[id]` without authentication. The home navigation opens the marketplace directly. The dashboard shows Sign in for guests; account navigation uses the shared AccountGate. Saving a material opens a dismissible keyboard-accessible login dialog. An available item shows a login link before requesting pickup. Login links carry a local dashboard return path, checked before navigation. Backend authentication and authorization remain the boundary for every write and private route.

Email verification now uses six-digit email OTPs with a ten-minute Redis expiry. Registration opens the verification page, which shows pending/verified status, accepts mobile one-time-code autofill, and offers resends with a sixty-second cooldown. Login and account actions use dismissible success/error toasts. Login retains eye-icon password visibility. Photo suggestions, listing publication, request/acceptance, private contacts and completion retain the existing backend workflow. The event date is informational and does not constrain the buyer's proposed pickup time.

Public person records include `verified`, derived only from `users.verified_at`; seller details, public profiles and private handover participants show email verification status without exposing email addresses. Profile emails remain private. Name avatars still derive from the saved name through the shared `NameAvatar` component.

Verify repository lint, types and build, plus the desktop/mobile browser suite. Browser coverage exercises public discovery, guest save prompts, public detail access, protected profile access, editable AI suggestions and the complete two-account handover flow.

Verification passed: repository lint, type checks and production build, formatting checks and eight desktop/mobile browser scenarios. Coverage includes empty stock, unmatched searches and clearing filters, empty saved items, service failures and retry, profile updates surviving reload, backend handover counters, logout, public browsing and complete seller/buyer handovers. The missing-item and own-stock cases are additionally rerun independently on both layouts. The existing 10 domain tests passed during the data-layer migration.

## Profile and empty states

The profile summary reads `offeredCount` and `collectedCount` from the backend. Active listings are counted separately with the existing domain helper; completed or withdrawn stock is excluded. AccountSummary, ProfileForm and SignOutButton are separate components. The sign-out action appears at the bottom of the profile after the form and summary, clears the query cache through the auth hook and returns to public discovery. Public profiles do not show phone numbers.

Discovery distinguishes an empty marketplace, an account that only owns available stock, an empty saved list and a filtered search with no results. Each state provides a relevant action. An initial API failure shows a retry screen instead of presenting a false empty marketplace.

For manual testing, open `/dashboard` while signed out, search for an unmatched term and clear it. Sign in, edit `/dashboard/profile`, save and reload to check persistence. Publish a batch and check active listings; complete a buyer/seller handover to check both backend totals. Sign out from the bottom of the profile and confirm that profile access is gated while discovery and public item pages still open. Test the same steps at mobile width.

## Access expiry and shared refresh

Login sets `reclaim_session` for 15 minutes and `reclaim_refresh` for an absolute 14-day session. Both are HttpOnly, SameSite=Lax, host-only cookies, with Secure enabled in production. PostgreSQL stores only SHA-256 token hashes. `POST /api/auth/refresh` rotates both values under a row lock without extending the absolute expiry; a consumed refresh value cannot be reused. Logout revokes the session by either credential, and password reset revokes all sessions for the account.

`lib/api/fetch.ts` handles ACCESS_EXPIRED/UNAUTHENTICATED responses. Concurrent calls in the same application instance await one shared refresh promise. After cookies are updated, each original request retries once with the same body and headers. A generation counter prevents a late failure from starting a second refresh. Cancelling one caller does not cancel the shared refresh for other callers. Invalid login credentials and other authorization failures do not refresh. A failed refresh has no retry loop; an expired session clears cookies and private cached state and offers sign-in. Public reads can continue anonymously. Separate browser tabs have separate refresh coordination; cookie rotation is single-use on the server.

Existing pre-migration sessions remain valid until their stored expiry; they have no refresh credential and require a new login afterward. New logins use the two-cookie flow. Apply migrations before deploying the changed backend: `pnpm.cmd --filter backend db:migrate`.

Refresh verification includes six transport tests (three concurrent failures, late failure, failed refresh, bounded retries, abort isolation and multipart replay), real PostgreSQL rotation/revocation coverage, and desktop/mobile browser tests that remove the access cookie and confirm one refresh. Browser tests also invalidate the refresh cookie and verify that private profile fields disappear and sign-in is offered.

The refresh update passes 20 backend tests, 16 frontend tests, repository lint/types/build and desktop/mobile browser coverage. The development migration is applied. To manually exercise renewal, sign out and sign in once, then remove only `reclaim_session` in browser cookie tools and reload the profile. Expect one `/api/auth/refresh` request and the original read retried successfully. Sign out is below the complete profile content.
