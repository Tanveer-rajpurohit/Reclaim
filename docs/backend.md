# Reclaim backend implementation contract

Updated 10 October 2026. Read with [idea.md](./idea.md) and [feature.md](./feature.md). This is the product contract for the implemented backend. See [backend-setup.md](./backend-setup.md) for configuration, [backend-aws.md](./backend-aws.md) for S3, SMTP/SES and photo analysis, and [backend-progress.md](./backend-progress.md) for verification evidence.

## Start by reviewing the entire UI

Before writing backend code, run the application and review every screen at desktop and mobile widths. Read the shared domain models in `packages/domain/src/index.ts`, existing component props, `apps/web/types/*/type.ts`, `apps/web/lib/reclaim.ts`, `apps/web/lib/records.ts` and the workflow tests. The standalone API, migrations and integration tests live under `apps/backend`. Check the interactions as well as the screenshots. Treat the product rules below as authoritative if an older screenshot or proposal differs.

| Screen                     | Route                                           | Verify before integration                                                            |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| Home                       | `/`                                             | Content, navigation, loader and section components                                   |
| Authentication             | `/login`, `/register`                           | Verified email, short-lived access cookies, rotating refresh sessions and revocation |
| Discover and saved         | `/dashboard`, `/dashboard/saved`                | Search, filters, sort, save/unsave, mobile categories                                |
| Product                    | `/dashboard/items/[id]`                         | Cover/gallery, seller profile, pickup proposal, request, unavailable states          |
| Publishing                 | `/dashboard/listings/new`                       | Collection details, materials, review, validation, cover plus four additional photos |
| Own listings               | `/dashboard/listings`                           | Request review, edits, withdrawal, reservation and removal after completion          |
| Handovers                  | `/dashboard/deals`, `/dashboard/deals/[id]`     | Buying/selling views, accept, decline, cancellation, completion and private contact  |
| Account and public profile | `/dashboard/profile`, `/dashboard/people/[id]`  | Profile edits, interests, privacy and completed-handover history                     |
| Activity and impact        | `/dashboard/notifications`, `/dashboard/impact` | Read states, participant records, count accuracy and labelled weight                 |

The old `/board` route has been removed. Use `/dashboard` routes. Existing `board-*` CSS class names and the `BoardProvider` symbol are internal naming. The integrated UI no longer reads or writes the legacy `reclaim-board-v1` browser store.

## Product rules

One authenticated identity can both offer and collect materials. Roles belong to each handover, not separate buyer/seller accounts. A seller may list usable leftovers from any event or cleanup, recent or old, at any time.

The **event or cleanup date is informational only**. It helps a buyer judge recency. It must never restrict publication, requests, acceptance or completion. There is no clear-by date, collection window, listing expiry, countdown or extension command.

The buyer chooses a **future proposed pickup time** and may add a note. This is separate from the event date and has no event-based maximum. Passing that proposed time does not automatically cancel or complete a request. The participants handle missed collection explicitly. Payments and delivery arrangements happen directly between the participants; Reclaim does not process money or verify payment.

## Request to completion

1. The buyer opens an Available item, checks the quantity, condition, hazards and seller profile, and submits a whole-batch request with a pickup proposal. Validate the signed-in identity, mobile number, item availability, finite future pickup time and note length. Block requests for the buyer's own items and duplicate active requests.
2. Create a Pending deal. Keep the item Available so multiple buyers can request it. Notify the seller with the buyer's name, proposal, note and authenticated review link. The seller can open the buyer's public profile and past completed handovers before responding.
3. The seller accepts or declines. Acceptance reserves the item and declines competing Pending requests atomically. Notify the selected buyer and affected competing buyers. After commit, send acceptance email to the selected buyer and a confirmation email to the seller if their emails are verified. A decline includes a reason and does not reserve stock.
4. In Accepted, only the two participants can see private contact details. Show the proposed pickup time and collection instructions. They arrange collection directly. Either participant may cancel before Done; cancellation releases a reservation back to Available and sends the other participant a notice. No handover count changes.
5. After collection, the seller selects **Mark handover complete**. Only the seller can move an Accepted deal to Done. Buyer acknowledgement is optional and cannot finalize it. Set the item to Done in the same transaction; remove it from discovery and active own listings.
6. Both users retain the same permanent handover record. The seller gains one offered handover and the buyer gains one collected handover. Send each participant an in-app completion notice and queue a completion email. Duplicate taps, retries or refreshes must not add another record, count or notice.

Done is final. Withdrawal is allowed for Available or Reserved items and closes affected open requests; completed stock cannot be withdrawn. Public profiles show name, locality, preferences and actual completed-history counts. Do not fabricate stars or a numerical trust rating. An older event date never closes a request.

## Storage and boundaries

The implementation uses PostgreSQL, private photo storage with local/S3 adapters, transactional email with file/SMTP/SES adapters, and Bedrock photo suggestions. Transport/provider code stays outside the domain rules. The integrated UI uses authenticated server reads and mutations; seeded identities, browser marketplace storage and demo actor-switch controls have been removed. Photo analysis never publishes, reserves, requests or completes an item; the seller reviews and publishes through the existing validated flow.

| Entity        | Required data and constraints                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| User          | ID, display name, verified email, private phone, locality, collection preference, interests                                                 |
| Event/cleanup | ID, owner ID, name, locality, event date, public pickup instructions, optional delivery note                                                |
| Item          | Event ID, material details, whole-batch quantity/unit, price, hazards, cover/gallery object keys, state, created timestamp                  |
| Deal          | Item ID, buyer ID, status, proposed pickup timestamp, note, reason, optional buyer acknowledgement, accepted/completed timestamps, revision |
| Notification  | Recipient, action type, deal/item ID, title/detail, created/read timestamps, deduplication key                                              |
| Outbox job    | Recipient, template, transition ID, delivery status, attempt count, retry time, provider message ID                                         |
| Saved item    | Unique user/item pair                                                                                                                       |

Store pickup instants in UTC and display them in IST. Represent the event date as a calendar date; the current frontend `eventAt` timestamp represents that date in IST. Adapt that boundary explicitly so a timezone conversion does not shift the calendar day. Do not restore the removed `availableFrom` or `clearBy` rules.

Item states: Available, Reserved, Done, Withdrawn. Deal states: Pending, Accepted, Done, Declined, Cancelled. No Expired state in the new contract. Migrate legacy browser event dates from `availableFrom`; legacy Expired requests are restored to Pending in the preview. A production migration needs a deliberate audit rather than copying browser data into real accounts.

Lock the item and affected deal rows for acceptance, cancellation, withdrawal and completion. Enforce at most one Accepted whole-batch deal per item, and at most one active request per buyer/item. Persist the transition, notifications and outbox entries in one transaction. Use idempotency keys for mutations and unique transition/recipient/type keys for side effects. Derive counts from Done records or update aggregates transactionally exactly once. Never increment totals on a client click.

## API surface mapped to the UI

| Operation             | Proposed endpoint                                                                                   | Authorization                                       |
| --------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Browse/detail         | `GET /api/items`, `GET /api/items/:id`                                                              | Public safe fields only                             |
| Publish/edit/withdraw | `POST /api/events`, `PATCH /api/items/:id`, `POST /api/items/:id/withdraw`                          | Owner; publish all reviewed items atomically        |
| Request               | `POST /api/items/:id/requests`                                                                      | Signed-in buyer, not owner                          |
| Review handovers      | `GET /api/deals?side=buying                                                                         | selling`, `GET /api/deals/:id`                      | Participant only |
| Accept/decline        | `POST /api/deals/:id/accept`, `POST /api/deals/:id/decline`                                         | Seller only, Pending only                           |
| Cancel                | `POST /api/deals/:id/cancel`                                                                        | Participant, before Done                            |
| Acknowledge/complete  | `POST /api/deals/:id/acknowledge`, `POST /api/deals/:id/complete`                                   | Buyer acknowledgement; seller completion            |
| Profile/history       | `GET /api/users/:id`, `PATCH /api/me`, `GET /api/me/handovers`                                      | Public safe profile; authenticated own edit/history |
| Saved/activity        | `PUT/DELETE /api/me/saved/:itemId`, `GET /api/me/notifications`, `PATCH /api/me/notifications/read` | Current user only                                   |
| Upload/impact         | `POST /api/uploads`, `GET /api/me/impact`                                                           | Owner upload; participant-specific totals           |

Derive the actor from the server session, never a submitted actor ID. Return typed field errors, authorization errors and state conflicts; preserve drafts when a mutation fails. Protect session mutations against CSRF. Validate gallery content, sizes and ownership on the server; browser resizing is not a security boundary. Use private upload permissions and public-safe derivatives, not browser data URLs as database images.

## Email and notification delivery

The backend persists in-app notifications and email outbox jobs transactionally. The outbox worker sends acceptance, decline/cancellation where configured, and completion messages with material name, relevant pickup details and an authenticated application link. Do not expose private contact details in public URLs or email subject lines. Send handover messages only to verified addresses; account verification messages establish that verification. Retry transient delivery failures with bounded backoff and record permanent failures for operators. An email outage must not roll back a completed product action or make the UI report that acceptance failed.

## Integration acceptance checks

- Test two authenticated users on separate sessions: request, seller profile review, accept, contact access, pickup and seller completion. Both histories and both completion notices must match.
- Race two accepts and repeat completion with the same idempotency key. Exactly one reservation and completion must result.
- Confirm that an event from a year ago remains requestable and pickup can be proposed months later. Event age must never gate a mutation.
- Test decline, buyer cancellation, seller cancellation, withdrawal, unauthorized actions, stale requests and refresh after each action.
- Verify private contacts never appear in discovery or public profile responses. Keep contact access participant-only under the current UI's 30-day post-completion policy.
- Check cover selection, photo removal, dropdown keyboard controls, field errors, mobile layouts, loading, empty states and unread indicators after replacing the local store.
- Count only Done records; do not add pieces or bundles to kilograms. Label supported weight as estimated. Do not claim verified recycling or avoided emissions.
- Run build, lint, type checks and domain/integration tests before marking backend integration complete.
