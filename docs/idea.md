# Reclaim: Idea and Build Plan

> Event: Environmental Hacks (Event 02, Bharat Builds Tour), Oct 8 to 11, 2026
> Track: 03 Waste and Energy
> Companion file: [feature.md](./feature.md) (full list of features, detailed in plain text)
> Source proposal: [Reclaim-Focused-Proposal.pdf](./Reclaim-Focused-Proposal.pdf)
> Last updated: Oct 9, 2026 (product flow and consistency review)

**Status of technology:** backend choices are proposed in [backend.md](./backend.md); integration is not implemented yet. The team leans towards PostgreSQL for data, S3 for photos and some hosting, but this file and `feature.md` describe **what the product does**, not how it is built. Tech gets its own pass later (section 9 lists what that pass must satisfy).

**Confidence tags**

| Tag | Meaning |
|---|---|
| `[verified]` | Read directly from the official WeMakeDevs pages. |
| `[assumption]` | Our own estimate. Measure it before relying on it. |
| `[verify]` | From a web search summary. Check the primary source before using it in the video or blog. |

---

## 1. The idea in one paragraph

After a college fest, a cleanup drive or another event, organisers may have reusable boards, plant pots, cardboard or sorted bottles left over. Reclaim is a web marketplace where they can offer those materials for free or at an asking price. A photo suggests listings for the seller to review, and manual listing is always available. A buyer taps **Get this** for a free item or **Buy** for a priced one. Both create a pending request. The seller accepts, the two arrange pickup or optional delivery directly, and the seller marks the handover complete. Buyer acknowledgement is optional. Completed deals contribute to the handover totals and each person's successful-deal record. Payments happen between the two people, outside the app.

Why this fits the event:

- The judging page says: *"A small problem solved well beats a big one solved vaguely."* `[verified]`
- The PDF scope is already small. We keep it small and make two moments strong: **photo in, listings out** and **a deal that is easy to follow from Buy to Done**.
- The build day is at DTU Delhi. Fest leftovers are the local problem the judges can see. `[verified: venue]`

### The problem in numbers (pitch only, verify first)

- Delhi produces roughly 13,500 tonnes of municipal solid waste per day. `[verify]`
- India has an estimated 1.5 to 4 million informal waste workers and kabadiwalas, who handle a large share of recycling. `[verify]`
- None of these was checked against a primary source. Before the video, open the original page (MCD, CPCB or Down To Earth) and show the source on screen.

---

## 2. What the PDF already commits to (kept)

| PDF feature | Status in our plan |
|---|---|
| List materials with photos, category, quantity, condition, event, location, date, free or priced | Kept. Now pre-filled from a photo. |
| Separate reusable items from recycling material | Kept. Every item is marked **Reuse** or **Recycle**. |
| Search, categories, filters, list view, no map | Kept. No map. |
| Request an item with pickup time and contact, organiser accepts and reserves | Kept, and renamed: the buyer clicks **Buy**, which creates a **pending deal** (section 3.1). |
| Three states: Available, Reserved, Collected | Kept. "Collected" is renamed **Done**, completed by the seller after pickup. |
| Payments off-app, cash at handover | Kept. The app never handles money. |
| Collection records a transfer, not proof of recycling | Kept. Public totals say "handed over". Recycling and avoided disposal are not verified. |
| Skip event hosting, group chat, maps, online payments, delivery tracking | Kept. Still out of scope. |

---

## 3. What we add

### 3.1 The deal flow (request, acceptance, pickup, completion)

One account can buy and sell. Free and priced materials use the same whole-batch request flow; Reclaim does not process payment.

```text
Buyer proposes pickup time and sends request
  → Pending: seller reviews buyer name, profile and completed handovers
  → Accepted: seller reserves batch; contact shared; acceptance notices/email
  → Pickup: participants arrange collection directly
  → Done: seller marks complete; item leaves active listings
  → Both retain record, counts increase once, completion notices/email
```

The seller can decline a request. Accepting one request declines competing requests for the same batch. Either participant can cancel before Done; cancelled reservations return to Available. Buyer acknowledgement alone does not complete a handover. Done is final and cannot be counted twice.

The event date is context only. A seller can list materials from a recent or older event at any time. The buyer's future pickup proposal has no event-based upper limit. There is no automatic expiry or completion. Public profiles show names, locality and past completed handovers, never private phone numbers. See [backend.md](./backend.md) for delivery and persistence requirements.

---

### 3.2 Snap-to-List
The seller takes one photo. The app suggests item types and draft details. The seller corrects counts, adds missed items, removes wrong suggestions and taps Publish. Full description in `feature.md`, feature F3.

How it should feel: **under 60 seconds from camera to published** `[assumption, test on real phones]`.

Accuracy policy:
- The app **suggests**, the seller **decides**. Nothing goes live until the seller taps Publish.
- Counts are shown as a stepper the seller can fix in one tap.
- Items the app is unsure about get a "Check this" mark.
- If photo reading fails for any reason, the manual form opens at once with the photo kept.
- Before kickoff, test on **30 real photos** from campus and write down how often it is right (sheet in section 8). If cropped item pictures are poor, use the whole photo as the item picture.

### 3.3 Extra detail photos
Each item has a main picture (cropped from the big photo) plus up to 4 extra photos the seller adds (close-ups, damage, size reference). The item page also has **Show in original photo**, which marks where the item sits in the pile.

### 3.4 Impact counter

**In plain words:** a few numbers on the home page that go up every time a deal reaches **Done**.

```text
Listings handed over: 31     Deals done: 31     Material handed over: ~620 kg (estimated)
```

- **Only seller-completed Done deals count.** Pending requests and reservations do not establish a handover. Demo records have separate, labelled totals.
- Count each fully handed-over listing once and each completed deal once. Pieces, bundles and kg are separate quantities, not one combined item count.
- Weight is an estimate, always labelled. Use seller-provided kg or a documented weight per piece. An unspecified bundle size cannot produce a reliable kg estimate; see F18.
- CO2 is not included. Numbers are easy to get wrong and judges can challenge them. Later, only with a citable source.

### 3.5 Successful buy record (for a future score)
Every buyer has a count of **successful buys**. It goes up by one when one of their deals becomes Done. Nothing else happens with it now. It is stored so a trust score, badges or a leaderboard can be added later. Sellers get the same kind of count (**successful handovers**) as a small extra.

### 3.6 Event date and pickup proposal

The seller records when the event or cleanup happened so a buyer can judge recency. This date is never a listing deadline or availability gate. Sellers can offer leftovers at any time.

The buyer proposes a future pickup date/time. The seller reviews it before accepting, and the participants arrange collection directly. There is no clear-by field, collection window, ending-soon sorting, extension or automatic expiry. Event dates and pickup times are independent.

---

### 3.7 Two kinds of buyer
- **Reuse seekers:** student clubs, drama societies, maker spaces, NGOs.
- **Bulk buyers:** kabadiwalas and small recyclers.

A buyer can save the materials and area they care about and gets an in-app alert when a match is listed. This answers the track sub-theme "Informal recyclers". `[verified: tag on the track page]` Alerts are inside the app only for now. Email and SMS are decided later with the tech.

---

## 4. Raw data shapes (JSON only, no tech)

These are the raw pieces of information the product needs. They are not a database design. Names can change.

```json
{
  "user": {
    "id": "u_01",
    "displayName": "Aman Verma",
    "phone": "+919876543210",
    "locality": "Rohini",
    "buyerType": "reuse",
    "successfulBuys": 3,
    "successfulHandovers": 1
  },
  "lot": {
    "id": "lot_01",
    "sellerId": "u_01",
    "eventName": "DTU Fest Cleanup",
    "locality": "Shahbad Daulatpur",
    "eventAt": "2026-10-09T00:00:00+05:30",
    "pickupNote": "Behind the main stage, ask for Aman",
    "deliveryNote": "Can deliver inside campus",
    "photos": ["lot_01_main.jpg"],
    "sceneSummary": "Wooden boards, cardboard and plastic bottles near a stage"
  },
  "item": {
    "id": "it_01",
    "lotId": "lot_01",
    "sellerId": "u_01",
    "name": "Plywood sheet",
    "nameHindi": "प्लाईवुड शीट",
    "category": "wood",
    "disposition": "reuse",
    "quantity": 4,
    "unit": "pieces",
    "condition": "good",
    "priceInr": 0,
    "hazardNotes": ["nails"],
    "mainPhoto": "it_01_crop.jpg",
    "extraPhotos": [],
    "boxInPhoto": [120, 250, 400, 600],
    "aiConfidence": 0.82,
    "status": "available"
  },
  "deal": {
    "id": "d_01",
    "itemId": "it_01",
    "buyerId": "u_07",
    "sellerId": "u_01",
    "status": "pending",
    "pickupAt": "2026-10-10T10:30:00Z",
    "buyerMessage": "Need it for our stage set",
    "buyerPhone": "+919811122233",
    "buyerConfirmedDone": false,
    "sellerConfirmedDone": false,
    "createdAt": "2026-10-10T09:10:00Z",
    "acceptedAt": null,
    "doneAt": null
  },
  "stats": {
    "itemsRescued": 148,
    "dealsDone": 31,
    "estimatedKg": 620
  }
}
```

Allowed values:
- `item.status`: `available`, `reserved`, `done`, `withdrawn`.
- `deal.status`: `pending`, `accepted`, `done`, `declined`, `cancelled`.
- `item.category`: `wood`, `cardboard_paper`, `plastic`, `metal`, `glass`, `electronics`, `textile_flex`, `furniture`, `decor_props`, `plants_pots`, `other`.
- `item.disposition`: `reuse`, `recycle`. `item.condition`: `good`, `fair`, `poor`.
- `item.unit`: `pieces`, `bundles`, `kg`. `user.buyerType`: `none`, `reuse`, `bulk`.
- `priceInr` of `0` means free. Times are stored in UTC and shown in India Standard Time.
- `boxInPhoto` is `[left, top, right, bottom]` on a 0 to 1000 scale. `[verify the order when testing the photo reader]`
- These examples describe whole-line deals. Before adding partial buys (P1), extend the deal with requested and accepted quantity and the item with remaining-stock accounting. The sample `itemsRescued` field must be renamed or given an explicit unit before implementation; the public metric counts fully handed-over listings, not mixed pieces, bundles and kg.

---

## 5. Hackathon rules and judging map

### 5.1 Rules we must not break `[verified from /aws/env/rules]`

| Rule | How we comply |
|---|---|
| New work only after the clock starts. A repo history that does not match the event dates disqualifies the team. | **Create the hackathon repo after kickoff on Oct 8.** Before that: docs, designs, account set-up, tests of tools in their own playgrounds. No project code is committed earlier. |
| The project must use AWS and the demo video must show it. To win prizes it must use an AWS open-source tool or be deployed on AWS. | Decide the tech with this in mind (section 9). |
| Submission is a public repo, a YouTube video under 3 minutes (public or unlisted, test signed out) and a short writeup on problem, build and where AWS fits. | P0 tasks on Oct 11. Video target 2:45. |
| Judges score only what is submitted. No live demo. | The video is the product. Rehearse it. |
| Student status verified on an AWS Builder Center profile. | Do it **now**. It gates entry and the Amazon fast-track. |
| List AI coding tools used. | One line in the README and the blog. |
| Anything not written by us needs a credit and a compatible licence. | Keep a `CREDITS.md`. |

**Ask the organisers before the clock starts** (they say they prefer questions to disqualifications), at `contact@wemakedevs.org`:

> Hello, our team is entering Environmental Hacks. We have planned our idea and made UI mockups (no code) before kickoff. We will create our repository and write all code only after the hackathon opens. Please confirm that pre-made design mockups and planning documents are acceptable. Thank you.

### 5.2 Judging criteria mapped to features `[verified criteria]`

| Criterion | What judges want | Our answer | Features |
|---|---|---|---|
| Idea and Impact | Real problem, what changes for people | Event leftovers at colleges. Impact counter from Done deals. Real quotes from an organiser and a scrap collector | F3, F9 to F12, F18 |
| Built on AWS | AWS central and visible in video | Decided in the tech pass (section 9) | n/a |
| Design and usability | A stranger knows what to do | Mobile first, camera first, a deal you can follow | F3, F5, F9 to F15 |
| Execution | "One feature that runs beats five that almost do." | P0 only first. Seeded demo data. Feature freeze Saturday night | Priority table in feature.md |
| Demo video | 3 minutes, what it does, who it is for, where AWS fits | Script in section 11 | n/a |

---

## 6. Design brief for UI work you can start now

Use these screens as a brief for mobile and desktop mockups. The rules allow learning, planning and practice before kickoff; they do not separately confirm the status of finished UI assets.

### 6.1 Screens (mobile first, then desktop)

| # | Screen | Must show |
|---|---|---|
| S1 | Home and browse | Impact strip, search, filter chips, item cards, "Ending soon" tag, status |
| S2 | Item detail | Gallery, "Show in original photo", event date for context, seller, **Buy** button that reflects the state (Buy, Buy sent, Reserved, Done) |
| S3a | Add from photo: capture | Big camera button, "or add manually" link |
| S3b | Add from photo: reading | Real steps (uploading, reading the photo, building the list), never a blank spinner |
| S3c | Add from photo: review | One card per found item, editable, "Check this" mark, delete, add item, bar with "Publish 6 items" |
| S4 | Buy sheet | Buyer-proposed future pickup time, private phone, note, a clear line saying "Seller must accept first" |
| S5 | Seller dashboard (my items) | Events, items with status, pending buys per item, accept or decline |
| S6 | Deal screen (both sides) | Step bar: Pending, Accepted, Done. Contact and WhatsApp link after accepted. Mark done button and "Waiting for the other side" |
| S7 | My deals (buyer) | Pending, accepted, done, declined. Successful buys count |
| S8 | Buyer preferences | Materials, area, buyer type |
| S9 | Impact page | Totals and recent done deals |
| S10 | Sign in, sign up, empty states, error states | Every list needs an empty state |

### 6.2 Visual direction (avoids the banned AI-slop patterns)

- **Feel:** practical, warm, trustworthy. Kraft-paper neutrals, strong ink text, one green accent. Not a startup template.
- **Colour:** warm off-white background, near-black text, deep green for Reuse, amber for Recycle, red only for urgency and errors. Light theme first. Check each pair for 4.5:1 contrast.
- **Type:** two families at most. For example a characterful grotesk for headings (Schibsted Grotesk) and a mono for numbers (IBM Plex Mono) with tabular figures for the counter. Not default Inter everywhere, not Space Grotesk plus serif.
- **Spacing:** 4 and 8 point scale only.
- **Motion:** only where it explains: the counter ticking up, review cards appearing one by one, the step bar advancing. 150 to 250 ms. No scroll fade-ins, cursor effects or opacity-fade buttons.
- **No:** purple gradients, gradient text, pill above the headline, three-icon feature row, glass cards, emoji headings, left-border accent cards.
- **Touch:** targets at least 44 px. The seller is standing at a venue with one hand free.
- **Real photos** of real piles in mockups, not stock art.

---

## 7. Pre-start plan (now to kickoff)

You are busy 9 AM to 4 PM and free in the evenings. The PDF says keep Oct 8 and 9 light because of exams. This is the original preparation checklist. On Oct 9, move unfinished tasks into the build schedule. Learning, planning and practice are allowed before kickoff; confirm any unclear boundary for finished project assets with the organisers.

| When | Task | Done when |
|---|---|---|
| Today and tomorrow | **Verify student status** on AWS Builder Center, register for the tour (everyone) | Profile shows verified |
| Today | **Create an AWS account**, secure it, set a budget alert | Can sign in, alert exists |
| Tonight and tomorrow | **Photo test set:** 30 photos of piles on campus (6 scenes x 5 angles: wood, cardboard, plastic bottles, mixed, banners, plants and pots). Write the expected item list for each. | 30 photos plus an expected-items sheet |
| Tomorrow | **Try the photo reader** in the chosen tool's own playground against the test set, using the sheet in section 8 | Result table and a decision on crops |
| Tonight and tomorrow | **UI design:** screens S1 to S10 | Clickable mobile mockup |
| Tomorrow | **Talk to 2 or 3 people:** a fest organiser and a kabadiwala. 10 minutes each. Ask what they do with leftovers, how they find buyers, what makes them trust a listing. Write 3 real quotes. | Quotes saved in `docs/` |
| Tomorrow | Email the organisers (section 5.1) | Email sent |
| Tomorrow | Agree team roles and one chat channel, decide who owns the main branch and deploys | Written in this file |
| Tomorrow | **Choose the tech** using the checklist in section 9 | Decision written in `docs/` |

---

## 8. Photo reader test sheet

One row per test photo. Fill before kickoff, again after it is wired into the app.

| Photo | Scene | Expected items (type and count) | Found | Types found | Count within 1 | Pictures good | Wrong or invented | Notes |
|---|---|---|---|---|---|---|---|---|
| 01 | Wood pile | | | | | | | |

Targets `[assumption]`: at least 80% of item types found, counts within 1 when 5 or fewer, cropped pictures that visibly contain the item at least 70% of the time. If pictures fall short, use the whole photo as the item picture.

---

## 9. Technology pass (later): what it must satisfy

Not decided. Leaning: PostgreSQL, S3, some hosting. The tech choice must still meet these product needs and hackathon rules:

1. **AWS must be real and visible.** Use at least one AWS open-source tool or deploy on AWS, and show it in the video. S3 alone is weak evidence for "Built on AWS". Hosting or the photo-reading AI on AWS makes it stronger.
2. **Photo reading:** needs a vision AI that returns a list of items with name, category, quantity, condition, and where each sits in the photo. Choose one that can run on AWS.
3. **Photos:** store originals and small cropped versions. Re-save in the browser before upload so phone photos are small and location data is removed.
4. **Deal safety:** two buyers must never reserve the same quantity, and a Done deal must be counted exactly once. Acceptance and completion must remain correct under simultaneous requests and retries. Partial buys need per-deal quantities and remaining-stock rules before implementation.
5. **Search:** at hackathon scale (a few hundred to about 2,000 items) simple filtering is enough.
6. **Notifications:** in-app first. Email and SMS only if cheap and not blocked by sandbox limits.
7. **Hosting:** the server needs to reach the database, storage and AI service securely without keys in the code.
8. **Cost:** stay within the free AWS credits. Set alerts and a daily cap on photo-reading calls.
9. **Day 1 proof:** on Oct 8, before any feature work, deploy a small test that uploads a photo, reads it and saves a row. If this is slow, we still have time to change.

---

## 10. Build plan Oct 8 to 11

**Capacity assumption `[assumption]`:** weekdays are 4 PM onwards and light, about 3 hours each per person. Saturday and Sunday are fuller. The **submission hour is not published yet** (schedule page says hours are being finalised `[verified]`), so we plan to be **submission-ready on Saturday night** and treat Sunday as a safety day.

| Day | Theme | Features | Exit check |
|---|---|---|---|
| **Thu Oct 8** (light) | Foundation | Repo after kickoff, hosting live, database and photo storage working, photo reader proven (section 9 item 9), demo data, look and feel from mockups | A live URL can upload a photo and show what was read |
| **Fri Oct 9** (light) | Read side and accounts | F1, F2, F4, F7 (main photo), F8, demo accounts | A stranger can browse and open an item on the live URL |
| **Sat Oct 10** (big day, optional DTU day) | The magic and the deal | F3, F5, F6, F9 to F15, F16 event context and pickup proposals, F18, F19, F21, then F7 extras, F17 delivery, F20 | **Feature freeze 11 PM.** Photo to Done works on two real phones |
| **Sun Oct 11** (safety) | Polish and ship | Bug fixes, F22 reset, video, README, blog. **Submit early with buffer.** | Submission sent, link opens signed out |

### Lanes (adjust to team size)

| Lane | Owns |
|---|---|
| Lead (infrastructure and server) | Hosting, database, storage, deals logic |
| Frontend and UI | Screens, camera and crop, accessibility |
| AI and data | Photo reading, prompt, test photos, demo data, accuracy numbers |
| Demo, QA, content | Test script, video, README, blog, credits, submission |

### Cut list (drop in this order if behind)
1. Additional interest alerts beyond the basic request flow (P2)
2. Hindi names (P2)
3. CO2 (P2)
4. Buy a whole event lot at once (P2)
5. Buyer alerts (F20)
6. Partial quantity buy (P1)
7. Extra detail photos beyond the main one
8. Cropped pictures (use the whole photo)

**Never cut:** sign in, manual add, browse and detail, Buy to Pending to Accepted to Done, photo reading, hosted app, the demo video.

---

## 11. Demo video (target 2:45, hard limit 3:00)

| Time | Show | Say (short) |
|---|---|---|
| 0:00 to 0:20 | Real photo of leftovers at the venue, then the Delhi waste figure with its source on screen | "After every fest, usable boards and sorted cardboard end up in the bin. Nobody who wants them knows they exist." |
| 0:20 to 1:00 | Phone: Add from photo, shoot a pile, review cards appear, fix one, Publish | "A photo gives us draft listings. The seller checks them before publishing." |
| 1:00 to 1:25 | Second phone: buyer filters Reuse and Free, sees "5h left", taps Buy | "Time matters here: the hall is cleared by 6 PM." |
| 1:25 to 2:00 | Seller accepts, both see contact, both tap Mark done, the step bar reaches Done, counter ticks up | "Handover happens between people. Reclaim connects them and counts only finished deals." |
| 2:00 to 2:30 | **AWS on screen, 30 seconds:** the AWS parts of the final stack at work (decided in the tech pass) | "Built on AWS: ..." |
| 2:30 to 2:45 | Handover totals, labelled demo records if used, and a real quote if collected | Explain which records are real handovers and which are demo data. |

Say "handed over". A confirmed transfer does not prove recycling or avoided disposal. Label simulated exchanges and their totals as demo data.

---

## 12. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Photo reader miscounts or merges items | Medium | Human review step, stepper for counts, "Check this" mark, 30-photo test, whole-photo fallback |
| Photo reader unavailable or slow on the day | Critical | Manual add always works in 2 taps with the photo kept |
| Tech set-up eats the weekend | High | Day 1 proof (section 9 item 9) and a written tech decision before kickoff |
| Deal confusion (who must do what next) | High | One step bar everywhere, one clear next action per side, plain messages (feature F12) |
| One side never confirms Done | Medium | Show whose confirmation is missing. Reminders are P1; timed completion remains a team decision. |
| Judges open the app and see nothing | High | 25 to 40 realistic demo items, browsing without an account, demo logins in the README |
| Deadline hour unknown | High | Submission-ready by Saturday night |
| Exams eat Thu and Fri | Medium | Only set-up and read-side work on those days |
| Wrong environment numbers in the video | High | Verify each against a primary source and show it on screen |
| Rule dispute over pre-start work | Critical | Email in section 5.1. Repo only after kickoff. No code before. |

---

## 13. Open decisions for the team

1. **Done rule is settled:** the seller completes after pickup; buyer acknowledgement is optional. No timed completion or event-based expiry.
2. **Partial buys:** can a buyer take 4 of 10 boards? Current plan: P0 buys the whole line, P1 allows choosing a quantity.
3. **Team size and lanes** (section 10).
4. Who attends the optional DTU day?
5. Show Hindi names (P2) in the demo?
6. Name: keep "Reclaim"?
7. Seed data location: DTU recommended.

---

## 14. Facts that still need checking

| Topic | Finding | Status |
|---|---|---|
| Event dates, tracks, prizes, judging, FAQ | Oct 8 to 11. Track 03 sub-themes: Segregation, Recycling, E-waste, Informal recyclers, Rooftop solar, EV nudges, Public transport. Judging: Idea and Impact, Built on AWS, Design and usability, Execution, Demo video | `[verified]` wemakedevs.org/aws/env |
| Rules | Same-day clock, no old projects, AWS in video, public repo plus video under 3 minutes plus writeup, student verification, 10 Amazon fast-track slots across all tracks | `[verified]` wemakedevs.org/aws/env/rules |
| Schedule | Thu kickoff, Fri build, Sat Delhi day 8 AM to 8 PM at DTU, Sun last day to submit, deadline hour still to come | `[verified]` wemakedevs.org/aws/env/schedule |
| Delhi waste and informal sector figures | About 13,500 tonnes per day, 1.5 to 4 million informal workers | `[verify]` |

Before any number appears in the video, blog or a slide, copy the number and its URL into `docs/sources.md`.
