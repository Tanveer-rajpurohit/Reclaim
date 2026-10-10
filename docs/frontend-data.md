# Frontend data and access

`lib/api/fetch.ts` is the only browser HTTP transport. It sends same-origin cookies, supports abort signals and multipart uploads, and exposes structured API errors. Feature services in `lib/api` map authentication, marketplace commands, photos and public profiles to the existing backend contracts.

`components/providers/QueryProvider.tsx` creates a QueryClient per mounted application. TanStack Query owns server snapshots and public profiles. Hooks in `hooks` handle reads and mutations. The marketplace query refreshes every 30 seconds while active and on focus; requests are cancellable. Successful commands refresh the marketplace and invalidate public profile history. Mutations are never automatically retried. Command retries preserve idempotency keys, while item/deal updates retain revision headers.

Zustand stores in `stores` hold discovery filters and transient error/login prompts. Remote records, phone numbers, auth tokens and sessions are not persisted in Zustand or localStorage. Authentication changes cancel outstanding queries, clear cached records and reset client state so another account cannot inherit private data.

Guests can open `/dashboard`, `/dashboard/items/[id]` and `/dashboard/people/[id]` without authentication. The home navigation opens the marketplace directly. The dashboard shows Sign in for guests; account navigation uses the shared AccountGate. Saving a material opens a dismissible keyboard-accessible login dialog. An available item shows a login link before requesting pickup. Login links carry a local dashboard return path, checked before navigation. Backend authentication and authorization remain the boundary for every write and private route.

Email verification, photo suggestions, listing publication, request/acceptance, private contacts and completion retain the existing backend workflow. The event date is informational and does not constrain the buyer's proposed pickup time.

Verify repository lint, types and build, plus the desktop/mobile browser suite. Browser coverage exercises public discovery, guest save prompts, public detail access, protected profile access, editable AI suggestions and the complete two-account handover flow.

Verification passed: repository lint, type checks and production build, formatting checks and eight desktop/mobile browser scenarios. Coverage includes empty stock, unmatched searches and clearing filters, empty saved items, service failures and retry, profile updates surviving reload, backend handover counters, logout, public browsing and complete seller/buyer handovers. The missing-item and own-stock cases are additionally rerun independently on both layouts. The existing 10 domain tests passed during the data-layer migration.

## Profile and empty states

The profile summary reads `offeredCount` and `collectedCount` from the backend. Active listings are counted separately with the existing domain helper; completed or withdrawn stock is excluded. AccountSummary, ProfileForm and SignOutButton are separate components. The sign-out action appears in the page header, clears the query cache through the auth hook and returns to public discovery. Public profiles do not show phone numbers.

Discovery distinguishes an empty marketplace, an account that only owns available stock, an empty saved list and a filtered search with no results. Each state provides a relevant action. An initial API failure shows a retry screen instead of presenting a false empty marketplace.

For manual testing, open `/dashboard` while signed out, search for an unmatched term and clear it. Sign in, edit `/dashboard/profile`, save and reload to check persistence. Publish a batch and check active listings; complete a buyer/seller handover to check both backend totals. Sign out from the profile header and confirm that profile access is gated while discovery and public item pages still open. Test the same steps at mobile width.
