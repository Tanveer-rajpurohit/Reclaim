# Reclaim: Features (full list, detailed in plain text)

> Companion to [idea.md](./idea.md). Source proposal: [Reclaim-Focused-Proposal.pdf](./Reclaim-Focused-Proposal.pdf)
> Event: Environmental Hacks, Oct 8 to 11, 2026. Track 03 Waste and Energy.
> Last updated: Oct 9, 2026 (product flow and consistency review)

## 0. How to read this file

- This file lists **what the product does**. It does not say how it is built. APIs, databases, hosting and speed or security numbers come later, in their own pass, after the tech is decided.
- Raw data shapes (JSON only) are in [idea.md section 4](./idea.md).
- **Priority:** **P0** must ship, the demo breaks without it. **P1** should ship, makes the demo strong. **P2** could ship, first to be cut.
- `[assumption]` marks a number we chose. Measure it and change it if wrong.

### Words used in this file

| Word | Meaning |
|---|---|
| **Seller** | A signed-in person who lists items after an event. |
| **Buyer** | A signed-in person who clicks Buy on an item. Either a **reuse buyer** (club, NGO, maker space, student) or a **bulk buyer** (kabadiwala, small recycler). |
| **Event** | One pile at one place and time, listed together (for example "DTU Fest Cleanup, behind the main stage"). One photo or a few photos make one event. |
| **Item** | One kind of thing in an event, with a quantity (for example "Plywood sheet x 4"). Items are what buyers buy. |
| **Deal** | The agreement between one buyer and one seller about one item, from the first Buy click until Done. |
| **Guest** | Someone who is not signed in. |

Every person can be both a seller and a buyer. There is one kind of account.
For free items the button says **Get this**. For priced items it says **Buy**. Both start the same deal flow.

### Feature list at a glance

| # | Feature | Priority | Planned day |
|---|---|---|---|
| F1 | Browse without an account | P0 | Fri |
| F2 | Accounts and profile | P0 | Fri |
| F3 | Add items from a photo | P0 | Sat |
| F4 | Add an item manually | P0 | Fri |
| F5 | Review and edit before publishing | P0 | Sat |
| F6 | Event and pickup details | P0 | Sat |
| F7 | Item photos and item page | P0 (extras P1) | Fri and Sat |
| F8 | Search, filter and sort | P0 | Fri |
| F9 | Buy an item (creates a pending deal) | P0 | Sat |
| F10 | Seller accepts or declines | P0 | Sat |
| F11 | Connection after acceptance | P0 | Sat |
| F12 | Finish the deal (both mark Done) | P0 | Sat |
| F13 | Item and deal states | P0 | Sat |
| F14 | Seller dashboard (my items) | P0 | Sat |
| F15 | Buyer's deals (my deals) | P0 | Sat |
| F16 | Time features | P0 window rules, P1 display and extension, P2 reuse-first | Sat |
| F17 | Notifications inside the app | P1 | Sat |
| F18 | Impact counter | P0 | Sat |
| F19 | Successful buy record | P0 | Sat |
| F20 | Buyer interests and alerts | P1 | Sat |
| F21 | Trust and safety | P0 | Sat |
| F22 | Demo data and demo accounts | P0 | Thu to Sun |
| F23 | Hindi item names | P2 | if time |

---

## F1. Browse without an account (P0)

**Purpose:** a judge or a first-time visitor sees real listings in seconds, with no sign-up wall.

**Who:** Guest, and everyone else.

**What the user sees and does**
- The home page shows the impact numbers, a search box, filters and a list of available items.
- A guest can open any item page and the impact page.
- On an item page the guest sees the **Buy** button. Tapping it asks them to sign in, then returns them to the same item.

**Rules**
- A guest never sees phone numbers or any contact detail.
- A guest sees only items that are open for buying (available, started, not expired).

**Empty and error states**
- No items at all: a friendly message with "Add the first items from a photo".
- No results for a search: shows which filters are on and a "Clear filters" button.

**Done when:** a person with no account can find an item and read everything about it on a phone.

---

## F2. Accounts and profile (P0)

**Purpose:** the minimum identity needed to run deals between two real people.

**What the user sees and does**
- **Sign up** with name, email and password. The user confirms their email, then can sign in.
- **Sign in** and **sign out**. Staying signed in for a week is fine `[assumption]`.
- **Forgot password** (P1).
- **Profile** with: display name (required), phone number, area or locality, and buyer type: none, reuse buyer or bulk buyer.
- Edit the profile any time (P1).
- After signing in the user returns to the page they were on.

**Rules**
- The **phone number is needed before the first Buy or the first Publish**, not at sign-up. This keeps sign-up short.
- Phone numbers are Indian mobile numbers, 10 digits, with or without +91. Anything else shows a clear message.
- Phone numbers are shown only to the other participant after acceptance, subject to the post-completion visibility rule in F11. Never on lists, item pages, search or to strangers.
- Display name is shown to others (2 to 40 characters). Email is never shown to others.
- Deleting an account (P2) removes personal details and withdraws the person's items.

**Done when:** a new person can sign up, add a phone and be ready to buy or sell in under 2 minutes.

---

## F3. Add items from a photo (P0)

**Purpose:** the hero feature. One photo of a pile becomes a list of items, ready to review.

**Who:** Seller.

**What the user sees and does**
1. On a phone, the main button on the home page and the seller dashboard is **Add from photo**. A smaller link says **Add manually**.
2. The camera opens (or the gallery, if the user prefers). The screen says "Please avoid photographing people."
3. The app **shrinks the photo** on the phone before sending it, so it uploads fast on a weak network. Location data in the photo is removed by this step.
4. The screen shows **real progress steps**: uploading, reading the photo, building your list. It is never a blank spinner.
5. The app shows **one card per item it found** (see F5), each with its own cropped picture.

**What the app works out for each item**
- Name (for example "Plywood sheet").
- Category (wood, cardboard and paper, plastic, metal, glass, electronics, banners and cloth, furniture, decor and props, plants and pots, other).
- Reuse or recycle. Reuse if it can do its original job again (usable boards, pots, props). Recycle if it is only worth its material (crushed boxes, flattened bottles, broken pieces).
- Suggested quantity and unit (pieces, bundles or kg). A photo cannot reliably determine weight; kg needs the seller's input. Counts and condition also need review.
- Condition (good, fair, poor).
- Hazard notes (glass, nails, battery, chemical, sharp, heavy).
- A review hint and where the item sits in the photo (used for the crop). A model's confidence value is not a measured probability that the suggestion is correct.
- Optional: a Hindi name (see F23).

**Rules**
- A photo can produce up to **20** items. The app lists each kind of item once, with a count, not one card per object.
- Nothing is published until the seller taps Publish (F5).
- If the photo is too dark, blurry or shows no usable items, the app says so in plain words, gives a tip and offers **Retake**.
- If reading the photo fails for **any** reason (slow, unavailable, unreadable result), the seller sees a short message and one tap to **Fill in manually**. The photo is kept.
- Reading must not run twice for the same photo (P1). A refresh restores the list without reading again (P1).
- Add up to 2 more photos to the same event; new items are added to the list (P1).
- Items with no usable position in the photo use a smaller copy of the whole photo as their picture.
- Daily limits apply per seller and in total, to control cost (see F21). Over the limit, the app says "Manual mode only for now" and opens the manual form.

**Time goal:** camera to published in under 60 seconds for a typical pile `[assumption]`.

**Done when:** on a real phone, one photo of a mixed pile gives a believable list that a seller can fix and publish.

---

## F4. Add an item manually (P0)

**Purpose:** the safety net when the photo reader fails, and the choice for people who prefer typing.

**What the user sees and does**
- A form with the same fields as one review card (F5), plus the event details (F6).
- At least **one photo** per item (taken or chosen). It is shrunk the same way as in F3.
- Inline messages next to every field that needs fixing. The Publish button explains what is missing.

**Rules**
- The manual form and the review card are the same form, so behaviour never differs.
- Fields are the same as in F5.

**Done when:** a seller can publish an item with no photo reader involved.

---

## F5. Review and edit before publishing (P0)

**Purpose:** the seller stays in control. The app suggests, the seller decides.

**What the user sees and does**
- One card per item. Each card has: cropped picture, name, category, **Reuse or Recycle** toggle, **quantity stepper** with unit, condition, price (**Free** by default, or an amount in rupees), hazard notes.
- A **"Check this"** mark on items with a low confidence hint (below 0.6 `[assumption]`). This threshold needs testing and does not mean 60% measured accuracy. These cards come first; all suggestions still need review.
- **Delete** a wrong card. **Add an item** for something the app missed (a blank card).
- A bottom bar: **"Publish 6 items"** with the live count.
- Before publishing the seller ticks a box confirming no prohibited items (F21).

**Rules**
- Everything the app filled in can be edited.
- All items in the event are published together. If publishing fails, nothing is published.
- After publishing, the seller sees a short summary: "6 items are live" with buttons **View my items** and **Add another event**.
- After publishing, a seller can still edit an item while it is Available (F14).

**Done when:** a seller can correct three wrong things on three cards in under 30 seconds and publish.

---

## F6. Event and pickup details (P0)

**Purpose:** buyers need to know where, when and until when.

**Fields**
- **Event name** (3 to 80 characters), for example "DTU Fest Cleanup".
- **Area** (2 to 60 characters), for example "Shahbad Daulatpur".
- **Available from** (default: now).
- **Clear by**: when the pile must be gone. Must be at least 30 minutes after "available from".
- **Pickup note** (up to 300 characters): public instructions for finding the collection point. Private phone numbers and home addresses belong only in an accepted deal.
- **Delivery note** (optional): for example "can deliver inside campus for Rs 100". Delivery is arranged between the two people. The app does not track it.

**Rules**
- These details apply to **every item in the event**.
- A seller starting a new event can copy event name and area from an earlier event (P1).
- A seller can **extend clear-by** later (F14, P1).
- All times are shown in India Standard Time.

**Done when:** an item page always answers "where, from when, until when".

---

## F7. Item photos and the item page (P0, extras P1)

**Purpose:** buyers trust a listing they can see properly.

**What the user sees on the item page**
- Main picture (the crop, or the whole photo copy).
- **Extra photos** (P1): the seller can add up to 4 close-ups (damage, size reference, labels). A swipeable gallery with thumbnails and a full-screen view. The seller can delete extras (P1).
- **Show in original photo** (P1): the whole pile photo with a box around this item.
- Name, quantity, unit, condition, Reuse or Recycle, price or Free, hazard notes.
- Event name, area, pickup note, delivery note.
- Time left until clear-by (F16).
- Seller name and **seller's successful handovers** (F19).
- A **Buy** button that always reflects the situation (see F9 for each state).
- More items from the same event (P1).
- Link preview with the item picture when shared in a chat (P2).

**Rules**
- Every picture has a text description made from the item name and category.
- Pictures keep their space on the page while loading, so the page does not jump.
- The seller can replace the main picture (P2).

**Done when:** a buyer can tell what the item is, how much, where, until when and what to do next, without asking.

---

## F8. Search, filter and sort (P0)

**Purpose:** find the right item fast.

**What the user sees and does**
- A search box that matches item name, event name and area. Results update as the user types.
- Filters, combined together: **category** (several allowed), **Reuse or Recycle**, **Free or Paid**, **area**.
- Sort: **Newest** (default) or **Ending soon**.
- 12 items per page with a "Load more" button.
- Item cards show: picture, name, quantity and unit, Reuse or Recycle tag, price or Free, area, time left, state.
- A toggle **Show reserved** lists reserved items greyed out (P1). Off by default.
- Filters and search stay in the page address so a filtered view can be shared (P1).
- A page for one event lists all its items (P1).

**Rules**
- By default only items that can be bought now are shown.
- Items that have not opened yet show as "Opens Sat 4 PM" and cannot be bought yet (F16).

**Done when:** a buyer filters to "Reuse, Free, Wood" and sees only matching items.

---

## F9. Buy an item: creates a pending deal (P0)

**Purpose:** the start of every deal. This is the Buy click you described.

**Who:** Buyer.

**What the user sees and does**
1. On the item page the buyer taps **Buy** (or **Get this** for free items).
2. A short sheet asks for:
   - **Pickup time**, inside the window between available-from and clear-by, at least 30 minutes from now `[assumption]`.
   - **Phone number** (pre-filled from the profile; asked if missing).
   - **Note** to the seller (optional, up to 300 characters).
   - **Quantity** (P1; by default the whole line).
3. The sheet says clearly: **"The seller must accept first. Payment, if any, is cash at handover."**
4. After sending, the buyer sees a confirmation and the deal appears in **My deals** as **Pending** (F15).
5. The request appears in the seller dashboard (P0). In-app alerts are added with F17 (P1).

**What the Buy button shows in each situation**
- Item available, no deal from you: **Buy** or **Get this**.
- You already have a pending deal: **Buy sent, waiting for seller** (tap to see or cancel).
- Your deal is accepted: **Deal accepted, see details**.
- Item reserved for someone else: **Reserved** (disabled).
- Item done: **Done** (disabled).
- Item expired: **Expired** (disabled).
- It is your own item: no Buy button; shows "Manage this item".
- Not signed in: **Sign in to buy**.

**Rules**
- **Many buyers can send a Buy for the same item.** The item stays visible as Available until the seller accepts one.
- A buyer can have **only one active deal per item** (pending or accepted).
- A seller cannot buy their own item.
- A buyer can **cancel a pending deal** any time. The seller is told.
- A pending deal ends when clear-by passes, the item is withdrawn, or another acceptance leaves insufficient stock. Whole-line buys close all competing requests; partial buys follow F10's remaining-stock rule. The buyer sees why in My deals.
- Daily limit on Buy clicks per person to prevent spam (F21).
- **Partial quantity (P1):** the buyer can ask for fewer than the full quantity (for example 4 of 10). Each deal records its requested and accepted quantity. Acceptance reserves that quantity, completion moves it to handed-over stock, and cancellation releases only that deal's reservation. Remaining stock stays Available while the pickup window is open. Define quantity precision for kg before implementing it.
- **Buy several items from one event in one go (P2).**

**Done when:** a buyer taps Buy, sends the sheet and sees a Pending deal; the seller sees the new request.

---

## F10. Seller accepts or declines (P0)

**Purpose:** the seller decides who gets the item.

**Who:** Seller.

**What the user sees and does**
- On the item (and in the seller dashboard) the seller sees the list of **pending buys**: buyer's name, buyer type (reuse or bulk), **buyer's successful buys** (F19), chosen pickup time, note.
- Two actions per buy: **Accept** or **Decline**.
- **Decline** offers short reasons (already promised, not suitable time, other) and an optional message.
- If the seller does nothing for 24 hours, the seller gets a reminder and the buyer sees "Waiting for seller" `[assumption]`.

**What happens on Accept**
- The deal becomes **Accepted**.
- For a whole-line buy (P0), the item becomes **Reserved**. With partial buys (P1), it remains Available if unreserved stock remains within the pickup window.
- For a whole-line buy (P0), every other pending buy on that item is **declined** automatically. Buyers see the reason in My deals; alerts are P1.
- The connection step begins (F11).
- With partial quantity (P1): reserve only the accepted quantity. Keep pending requests that fit the remaining stock; decline requests that no longer fit, with a reason. Several accepted deals are allowed only when each reserves a different portion of the stock.

**Rules**
- P0 accepts one buyer for the whole item line. P1 can accept several buyers for separate quantities, never the same stock twice.
- If simultaneous accepts compete for the same stock, only one succeeds. The other sees the updated quantity or "Already reserved". Repeating a successful accept never reserves stock again.
- A seller cannot accept after the item has expired.

**Done when:** for a whole-line buy, accepting one of three pending requests leaves one Accepted and two Declined. With partial buys, accepted quantities never exceed stock, even under simultaneous actions.

---

## F11. Connection after acceptance (P0)

**Purpose:** the two people can reach each other, nothing more. There is no chat.

**What both sides see once the deal is Accepted**
- The **other person's name and phone number**.
- A **WhatsApp link** that opens a chat with a ready-made message such as: "Hi, about the Plywood sheet from DTU Fest Cleanup, pickup at 10:30 AM Saturday."
- The agreed **pickup time**, the event's **pickup note** and the **delivery note**.
- **Safety tips:** meet at the venue or campus, in daylight, bring a friend for large pickups.
- The deal step bar (F12).

**Rules**
- Phone numbers are visible **only** after Accepted and **only** to the two people in the deal.
- If the deal is cancelled, declined or expires, the numbers disappear from the screen.
- After a deal is Done, the number stays visible for 30 days then hides (P2) `[assumption]`.

**Done when:** after Accept, both people see each other's phone and can open the chat in one tap.

---

## F12. Finish the deal: both mark Done (P0)

**Purpose:** a deal only counts when both sides say it really happened.

**What the user sees and does**
- Each deal has a **step bar**: **Pending**, **Accepted**, **Done**. It shows where the deal is.
- During Accepted, each side has two buttons: **Mark as done** and **This did not happen**.
- After one side taps Mark as done, their screen says **"Waiting for the other side"**. The other side sees **"Aman says this is done. Confirm?"** with **Confirm done** and **This did not happen**.
- When **both** have confirmed, the deal becomes **Done**.

**What happens when a deal becomes Done**
- The deal status is Done and shows the time it finished.
- The item becomes **Done** and leaves the buyable list once its full quantity has been handed over. With partial buys (P1), only the completed deal's quantity leaves remaining stock.
- The **impact counter** goes up (F18).
- The buyer gets **+1 successful buy** and the seller gets **+1 successful handover** (F19).
- Both sides get a notification.
- Nothing can be undone after Done.

**What happens when a deal does not finish**
- **Silent side:** the deal stays Accepted, showing whose confirmation is missing. A reminder at 24 hours is P1. Automatic completion after 48 hours remains a team decision, including its label and effect on totals; it is not part of the baseline Done rule.
- **This did not happen** (by either side, any time before Done): the deal becomes **Cancelled**, its reservation is released, the other side sees the updated state, and **no counts change**. Released stock returns to Available if the window is open; otherwise it appears Expired until extended.
- **Cancel an accepted deal:** same result as above, with a short reason.
- Either side can tap "This did not happen" after the other's individual confirmation, provided the deal has not yet reached Done.

**Rules**
- Money is never handled by the app. If the item had a price, payment is cash at handover and is not tracked.
- Done is final. It cannot be reopened.
- A deal can move to Done only from Accepted.

**Done when:** two phones can take a deal from Buy to Done, and the counter and the buyer's record each go up exactly once.

---

## F13. Item and deal states (P0)

**Purpose:** one clear set of states so the screens never disagree.

### Item states

| State | Meaning | What buyers see |
|---|---|---|
| Available | Open for buying | Buy button |
| Reserved | A deal is accepted | Reserved (disabled), shown greyed if "Show reserved" is on |
| Done | A deal finished | Done (disabled), counted in impact |
| Withdrawn | The seller removed it | Hidden from browse, pending buyers told |
| Expired | Clear-by passed for unreserved stock (worked out from time, not stored) | Hidden from browse; accepted deals stay accessible, seller can extend remaining stock |

### Deal states

| State | Meaning |
|---|---|
| Pending | Buyer clicked Buy, waiting for the seller |
| Accepted | Seller accepted, both connected, handover to happen |
| Done | Both confirmed the handover |
| Declined | Seller said no, or accepted someone else |
| Cancelled | Either side cancelled an accepted deal, or "This did not happen" |
| Expired | Item reached clear-by with the deal still pending |

### Allowed moves

| From | Action | To | Who |
|---|---|---|---|
| Item Available | Seller accepts a buy | Item Reserved, deal Accepted | Seller |
| Item Reserved | Both mark done | Item Done, deal Done | Both |
| Item Reserved | Either says "did not happen", or cancels | Deal Cancelled; item Available if window is open, otherwise Expired | Either side |
| Item Available or Reserved | Seller withdraws | Item Withdrawn, open deals Cancelled or Declined | Seller |
| Item Available | Time passes clear-by | Shown as Expired | Automatic |
| Item Expired | Seller extends clear-by | Available | Seller |
| Deal Pending | Buyer cancels | Deal Cancelled, item unchanged | Buyer |

**Rules**
- Only the right person can make each move. A wrong person gets a plain "You cannot do this".
- Done and Withdrawn are final.
- An accepted deal keeps going after clear-by. It must still end in Done or Cancelled.
- The table describes whole-line buys (P0). Partial buys (P1) additionally track unreserved, reserved and handed-over quantities. Available means unreserved stock remains within the window; Reserved means all remaining stock is reserved; Done means the full original quantity was handed over. Accepted deals remain accessible when unreserved stock expires.
- Withdrawal cancels accepted deals and declines pending requests. Once Withdrawn, an item cannot become Available through cancellation, and cancelled deals cannot receive further confirmations.
- Acceptance, cancellation, withdrawal and completion must stay consistent when people act at the same time. Repeating an action never changes stock or totals twice.

---

## F14. Seller dashboard: my items (P0)

**Purpose:** one place for a seller to run everything.

**What the user sees and does**
- **My events**: each event with counts (available, reserved, done) and the next clear-by time.
- Inside an event: every item with its state, a badge for **pending buys**, and quick actions.
- Per item: **Accept or Decline** pending buys (F10), **Mark done** for reserved items (F12), **Cancel the deal**, **Withdraw**, **Edit** (name, quantity, unit, condition, price, notes) while Available (P1).
- **Withdraw all available items** and **Confirm my handovers for all reserved items** for an event (P1). The batch action records only the seller's confirmations; each buyer still confirms their own handover.
- **Extend clear-by** for the whole event (P1). Expired items return to Available.
- **Copy event details** when adding a new event (P1).
- A line: **"You handed over N listings"** from Done deals (P1), using F18's counting rule.
- A short history of each item (when it was reserved, done, cancelled) (P1).

**Rules**
- A seller only sees and manages their own events and items.
- Pending buys count is always up to date.

**Done when:** a seller can run the whole day from this one screen on a phone.

---

## F15. Buyer's deals: my deals (P0)

**Purpose:** the buyer's version of the dashboard.

**What the user sees and does**
- Tabs: **Pending**, **Accepted**, **Done**, **Closed** (declined, cancelled, expired).
- Each deal shows item picture, name, seller, pickup time, step bar and the next action.
- Actions by state:
  - Pending: **Cancel**.
  - Accepted: **Open contact and chat link**, **Mark as done**, **This did not happen**.
  - Done: shows date and thanks.
  - Closed: shows the reason (for example "Seller accepted another buyer").
- The buyer's **successful buys count** is shown at the top (F19).
- Empty states with a link to browse.

**Done when:** a buyer always knows which deals need their action.

---

## F16. Time features (P0 window rules, P1 display and extension, P2 reuse-first)

**Purpose:** events end and halls must be cleared, so time is part of the product.

**What the user sees and does**
- **Time left** on cards and item pages: "5h 20m left", "2 days left", "Expired". It refreshes every minute.
- **Ending soon** tag when under 24 hours remain. Sort **Ending soon** puts these first (F8).
- **Pickup time must fit the window (P0)**: the buy sheet only allows times between available-from and clear-by. Validate again when the seller accepts; a pickup time already in the past needs a new request.
- **Upcoming items**: if available-from is in the future the item shows "Opens Sat 4 PM" and cannot be bought yet.
- **Auto-expire (P0)**: after clear-by, unreserved stock appears **Expired** and leaves browse. The seller's **Extend** option is P1. Existing accepted deals continue until Done or Cancelled.
- **Pickup reminder** two hours before an accepted pickup, for both sides (P2).
- **Reuse-first window (P2):**
  - The seller picks 0, 12, 24 or 48 hours when listing (default 24).
  - While the window is open, items marked **Reuse** can be bought only by people whose buyer type is not **bulk**.
  - Bulk buyers see the item with "Opens to you in 14h".
  - The effective window is never more than half of the time left until clear-by, so urgent piles are never blocked.

**Rules**
- All times are shown in India Standard Time.
- Pending deals end when the item hits clear-by (F9). Accepted deals do not end at clear-by (F13).

**Done when:** a buyer can tell at a glance what is urgent and cannot choose a pickup time that makes no sense.

---

## F17. Notifications inside the app (P1)

**Purpose:** each person learns about the next step without checking every screen.

**What the user sees and does**
- A **bell** with an unread count, and a list of notifications. Tap one to open the related deal or item.
- **Mark one as read** and **Mark all read**.
- The list refreshes by itself every 30 seconds while the app is open `[assumption]`.

**Events**
- To the seller: new Buy on my item, buyer cancelled, other side marked done and needs my confirm, deal completed, reminder to answer a pending buy.
- To the buyer: seller accepted, seller declined, seller cancelled or withdrew, other side marked done and needs my confirm, deal completed, an item matching my interests was listed (F20).
- To both (P2): pickup reminder.

**Rules**
- Notifications are **inside the app only** for now. Email and SMS are decided later.
- Notifications older than 30 days disappear.

---

## F18. Impact counter (P0)

**Purpose:** show real impact in numbers a judge can understand in three seconds.

**What the user sees**
- On the home page: **Listings handed over**, **Deals done**, **Material handed over (estimated kg)**. These record transfers; they do not establish avoided disposal or completed recycling.
- An **Impact page** with the same totals and a list of recent Done deals (event, category, quantity, no personal details) (P1).
- A seller sees "You handed over N listings" in the dashboard (P1).
- Numbers count up once when the page opens, for at most 0.6 seconds, and not at all for people who prefer reduced motion (P1).

**Rules**
- **Only Done deals confirmed by both sides count.** Pending requests, reservations and a single confirmation do not count. Any future timed-completion policy needs a decision on how its totals are reported.
- The numbers go up **exactly once per deal**, even if a button is tapped twice.
- Count each fully handed-over listing once and each completed deal once. For partial buys, count a listing only when its full original quantity has been handed over. Show pieces, bundles and kg separately if quantities are displayed.
- Weight uses seller-provided kg, or a documented weight per piece times the confirmed quantity. A bundle needs a seller-provided weight or piece count; never assume every bundle contains 10 pieces. If weight cannot be supported, omit it from estimated kg and show how many completed deals have weight data.
- Typical weights start as placeholders and should be checked by weighing a few real items:

| Category | kg per piece (placeholder) |
|---|---|
| wood | 2.0 |
| cardboard and paper | 0.5 |
| plastic | 0.05 |
| metal | 1.5 |
| glass | 0.4 |
| electronics | 1.0 |
| banners and cloth | 1.0 |
| furniture | 8.0 |
| decor and props | 1.0 |
| plants and pots | 0.8 |
| other | 1.0 |

- Wording: "handed over". Neither recycling nor avoided disposal is established by a transfer alone.
- The placeholder weights above are for testing until checked against real items. Demo totals stay labelled and separate from real handovers.
- No CO2 figure for now. Later only with a source we can cite.

**Done when:** after both sides complete a deal, the deal count increases once, the listing count follows the full-quantity rule, and supported weight is added once. Repeated taps or refreshes do not add anything again.

---

## F19. Successful buy record (P0)

**Purpose:** a count kept now so a trust score, badges or leaderboard can be added later.

**What the user sees**
- **Successful buys** on the buyer's profile and at the top of **My deals**.
- **Successful handovers** for sellers (small extra), on their profile and on their item pages.
- On the seller's list of pending buys, each buyer's successful buys count is shown as a simple trust hint (F10).

**Rules**
- The count goes up by **one** when one of the person's deals becomes **Done**.
- It never goes up for Pending, Accepted, Declined, Cancelled or Expired deals.
- It does not go down in this version.
- It is only a number. There is **no score, rank, badge or rating yet**. These come later.
- One deal counts once for the buyer and once for the seller.
- This records completed deals, not a verified trust score. Partial deals each count once regardless of quantity; demo records never increase a real user's record.

**Done when:** after a deal reaches Done, the buyer's count is exactly one higher.

---

## F20. Buyer interests and alerts (P1)

**Purpose:** helps kabadiwalas, clubs and makers find what they want, early.

**What the user sees and does**
- A preferences screen: **materials** (several), **Reuse or Recycle**, **areas** (several), and buyer type (reuse buyer or bulk buyer).
- When a new event is published, buyers whose interests match get **one alert per event**, not one per item, such as "3 items matching your interests at DTU Fest Cleanup".
- Edit or remove preferences any time.

**Rules**
- Alerts are inside the app (F17).
- A seller's own events never alert themselves.

---

## F21. Trust and safety (P0)

**Purpose:** keep people safe and the marketplace clean, with a small set of rules.

**What the user sees and does**
- **Prohibited items notice** at publishing: a tick box confirming "I am not listing food, medical waste, chemicals, batteries in bulk or other hazardous material", with a link to the full list.
- **Hazard notes** (glass, nails, battery, chemical, sharp, heavy) are shown on the card and the item page, for example "Contains glass. Wear gloves." (P1).
- **Meeting tips** on the deal screen (F11) (P1).
- **Report an item** with a reason and a note (P2). Stored for later; there is no moderation screen yet.

**Rules**
- **Contact privacy:** phone numbers and emails never appear on public lists, search or item pages. Deal participants see phone numbers only under F11's acceptance and post-completion rules; emails remain private.
- **Limits per person** to stop misuse and control cost: photo readings (10 per hour, 30 per day), Buy clicks (20 per day), uploads (60 per hour) `[assumption]`. Hitting a limit shows a plain message and when to try again.
- **Total daily limit on photo readings** across everyone (300 per day `[assumption]`). After that, only manual adding.
- **Plain text only:** names, notes and messages show as plain text with length limits.
- **Only the right person** can do each action. Nobody can change another person's items or deals.
- Text that appears inside a photo (for example a sign saying "ignore your instructions") must never change what the app does. The photo reader only produces the list of items.

---

## F22. Demo data and demo accounts (P0)

**Purpose:** judges open the live app and the video needs a believable story.

**What exists**
- **25 to 40 realistic items** across **6 to 8 events**, using real photos from the test set, with a mix of Available, Reserved and Done items and some done deals so the counters are not zero.
- **Demo logins** in the README: one seller and two buyers (one reuse buyer, one bulk buyer).
- A **reset** that restores the starting demo state before recording (P1).
- Demo records are marked so they can be removed in one go (P1).
- Demo listings and deals are labelled from the first seed (P0). Their totals remain separate from real handovers, including in the video. Demo logins are public examples, never AWS credentials or a real user's login.
- A **quick self-check page** that tells the team if every part of the app is working before recording and before submitting (P1).

**Rules**
- Browsing needs no account (F1), so a judge sees data even without signing in.

---

## F23. Hindi item names (P2)

**Purpose:** helps kabadiwalas and buyers who read Hindi more easily.

- The photo reader also suggests a Hindi name for each item.
- If present, the Hindi name shows as a smaller second line on cards and item pages.
- The rest of the app stays in English for this version. A full Hindi interface is not planned.

---

## Not in this version

| Not building | Why |
|---|---|
| Maps and distance sorting | The PDF excludes it. A list is enough. |
| Chat inside the app | After acceptance, contact moves to phone or WhatsApp. |
| Online payments | Cash at handover. The app never handles money. |
| Delivery tracking | Delivery is a free-text arrangement. |
| Event hosting or registration | Not the problem we solve. |
| Email or SMS messages | Decided later with the tech. Alerts are in-app for now. |
| Trust score, ranks, badges, ratings | Only the successful-buy counts are kept now (F19). |
| Moderation screen | Reports are only stored (F21, P2). |
| Proof of recycling | A Done deal records a handover, not what happens next. |
| Full Hindi interface | Only item names (F23). |
| CO2 figures | Only with a source we can cite. |

## Open feature decisions

1. **Done rule:** both confirm in the baseline. The proposed 48-hour automatic completion needs a team decision on its label and whether it affects confirmed-handover totals. Either-side completion is another option, with weaker confirmation.
2. **Partial buys** (4 of 10): P1 now. Should it move to P0 for the seller story?
3. **Reuse-first window:** keep as P2 or drop from the plan entirely?
4. **Number of extra photos:** 4 per item is the plan.
5. **Daily limits** in F21 are placeholders until we see real use.
