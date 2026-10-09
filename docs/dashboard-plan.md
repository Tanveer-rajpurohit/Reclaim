# Reclaim material board

## Direction

An image-led marketplace for event leftovers. Use Apple Store's clear product hierarchy, Cosmos's visual browsing and Are.na's quiet collection structure as references, without reproducing their layouts. Keep Reclaim's fonts, loader blue and illustrated plywood boards. No analytics chart wall, role selector or separate buyer account.

## Routes and milestones

| Part                   | Pages                                                                 | Working flow                                                                                                             |
| ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Domain and demo data   | Shared typed state                                                    | Events, items, people, requests, notifications; one account buys and sells                                               |
| Marketplace            | `/dashboard`, `/dashboard/items/[id]`, `/dashboard/saved`             | Search, category/purpose/price/locality filters, newest/ending-soon sort, pagination, save, item details, pickup request |
| Listings               | `/dashboard/listings`, `/dashboard/listings/new`                      | Manual or sample-photo draft, review, atomic publication, available-item edits, withdrawal, deadline extension           |
| Handovers              | `/dashboard/deals`, `/dashboard/deals/[id]`                           | Buying/selling views, pending/accepted/done/closed, accept/decline/cancel, contact after acceptance, dual confirmation   |
| Account                | `/dashboard/profile`, `/dashboard/notifications`, `/dashboard/impact` | Edit identity/locality/phone/interests, read notifications, confirmed-transfer totals, sign out                          |
| Entry and verification | Homepage, login/register                                              | Explicit local-demo entry; native state tests, browser flows, lint/type/build                                            |

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

## Implemented structure and verification

The app uses `/dashboard`. Existing `/board` paths redirect to the corresponding dashboard route and preserve query strings. Public login and registration retain their own routes.

Page components live in `components/discover`, `materials`, `listings`, `handovers`, `profile`, `notifications` and `impact`. Marketplace state and the application shell live in `components/marketplace`. Reusable fields, dropdowns, icons and motion live in `components/ui`. Domain and component types live in `types/<page>/type.ts`; the state module re-exports domain types for existing callers.

Publishing has three steps: collection details, materials and final review. Back navigation keeps the draft. Cover photos and up to four additional photos can be reviewed, reordered and removed before publication. Photo preparation blocks publication and concurrent gallery edits.

Discovery uses one filter panel instead of a dropdown row. Categories, next use, batch price, locality and sorting are applied together. Dropdowns support arrow keys, Enter, Escape and typing to find an option. Fields highlight their existing border on focus. Buttons use an inset keyboard indicator.

All six category choices appear in a three-column mobile grid. Search and filter controls are 44px high. Hover scaling and page movement respect reduced-motion preferences. The dashboard uses a plain scrollbar; the landing page keeps its original scroll treatment.

Validation completed: pnpm lint, pnpm check-types, pnpm build and eight native state tests. Browser checks confirmed wizard publication, multi-photo uploads, profile dropdown selection, filter combinations, contact after acceptance, old-route query preservation and mobile overflow.

The changes are divided into twelve local commits covering styles, domain types, shared controls, artwork and galleries, material detail, the application shell, discovery, listing management, publishing, handovers, account pages and legacy-route cleanup. No push is included.
