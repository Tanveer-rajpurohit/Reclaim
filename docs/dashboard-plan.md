# Reclaim material board

## Direction

An image-led marketplace for event leftovers. Use Apple Store's clear product hierarchy, Cosmos's visual browsing and Are.na's quiet collection structure as references, without reproducing their layouts. Keep Reclaim's fonts, loader blue and illustrated plywood boards. No analytics chart wall, role selector or separate buyer account.

## Routes and milestones

| Part                   | Pages                                                     | Working flow                                                                                                             |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Domain and demo data   | Shared typed state                                        | Events, items, people, requests, notifications; one account buys and sells                                               |
| Marketplace            | `/board`, `/board/items/[id]`, `/board/saved`             | Search, category/purpose/price/locality filters, newest/ending-soon sort, pagination, save, item details, pickup request |
| Listings               | `/board/listings`, `/board/listings/new`                  | Manual or sample-photo draft, review, atomic publication, available-item edits, withdrawal, deadline extension           |
| Handovers              | `/board/deals`, `/board/deals/[id]`                       | Buying/selling views, pending/accepted/done/closed, accept/decline/cancel, contact after acceptance, dual confirmation   |
| Account                | `/board/profile`, `/board/notifications`, `/board/impact` | Edit identity/locality/phone/interests, read notifications, confirmed-transfer totals, sign out                          |
| Entry and verification | Homepage, login/register                                  | Explicit local-demo entry; native state tests, browser flows, lint/type/build                                            |

Commit each verified milestone separately. Do not push.

## Domain rules

- Whole-line requests for P0. One active request per buyer per item; owners cannot request their own stock.
- Seller acceptance reserves the item and declines competing requests. Repeating actions cannot double-count a transfer.
- Both participants must confirm before Done. Cancellation releases stock if the window remains open. Accepted deals remain accessible after clear-by; pending requests expire.
- Withdrawal closes open deals. Done and withdrawn listings cannot be reopened. Extending an expired listing opens it for new requests, not old expired requests.
- Contact is never public; it is only displayed to participants after acceptance. Demo contact is illustrative and has no outbound chat action.
- Phone is required before publication or a request. Use Indian mobile validation. Pickup must fall within the event window, at least 30 minutes long. Show IST.
- Impact is computed from Done deals, not hard-coded claims. Report transferred listings/deals, units and explicitly estimated kilograms; no verified recycling or emissions claim.

## Demo boundary

This milestone is a local browser demo, persisted on this browser only. It is not production authentication or a multi-user backend. Seed accounts and data are labelled. The demo account can offer and request from the same identity. A clearly labelled simulation action lets a judge exercise the other participant's response without pretending it arrived from a server.

Photo uploads are resized locally and allow manual review. The sample-pile action supplies labelled demo suggestions; uploaded photos are not represented as AI-parsed. Authentication and real inference stay unconnected until the backend is chosen.

## Quality checks

Native Node tests cover ownership, competing reservations, duplicate requests, expiry, cancellation, final states and dual-confirmation counters. Browser checks cover discovery, no-results, item request, seller acceptance, contact gating, confirmation, publication, profile persistence, notifications and mobile overflow. Run pnpm lint, check-types and build before completion.
