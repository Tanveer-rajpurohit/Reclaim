# Reclaim testing guide

Use this guide to test the current UI with real image files and sample listing details. The sample prices, quantities and pickup arrangements below are fictional. Keep these listings in your local test environment. The photos come from different photographers and do not show the same physical batch; they are useful for testing cover selection and galleries.

## 1. Start the app

From the repository root in PowerShell:

```powershell
pnpm.cmd --filter backend db:local
pnpm.cmd --filter backend db:migrate
pnpm.cmd dev
```

Open [Reclaim](http://localhost:3001). Use a normal browser window for the seller and a private window or separate browser profile for the buyer. Use email addresses you control if you want to test verification emails.

Registration signs you in immediately. Email verification is optional. A mobile number is optional too. Verify from Profile when you want to test the OTP email or receive handover emails. In-app notifications work even without verification.

## 2. Download the test photos

Open a JPG link below, then save the image to your computer. Upload the saved file through Reclaim's photo picker; pasting an external image URL into a listing is not supported.

Use JPG, PNG or WebP smaller than 10,000,000 bytes. The resized links below avoid large originals. In particular, the original stacked-pallet and fabric-macro photos exceed the upload size limit. If an image host temporarily blocks a direct download, open its source page and choose the 1,280px version instead.

Each row has a cover and a different gallery image. The source pages contain the photographer and licence details. Keep that attribution with any shared demo that uses these photos; use your own photos for real listings.

| Test item       | Cover image                                                                                                                                                                                 | Additional gallery image                                                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wooden pallet   | [Cover JPG](https://upload.wikimedia.org/wikipedia/commons/e/e8/Wooden_pallet.jpg), [source](https://commons.wikimedia.org/wiki/File:Wooden_pallet.jpg)                                     | [Stacked pallets, 1,280px JPG](https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3c/Wooden-pallets_stacked_4.jpg/1280px-Wooden-pallets_stacked_4.jpg), [source](https://commons.wikimedia.org/wiki/File:Wooden-pallets_stacked_4.jpg)                                                 |
| Cardboard boxes | [Cover JPG](https://upload.wikimedia.org/wikipedia/commons/f/f2/Cardboard_boxes_%286956651267%29.jpg), [source](<https://commons.wikimedia.org/wiki/File:Cardboard_boxes_(6956651267).jpg>) | [Boxes in bins, 1,280px JPG](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Cardboard_boxes_in_bins_%2842045477572%29.jpg/1280px-Cardboard_boxes_in_bins_%2842045477572%29.jpg), [source](<https://commons.wikimedia.org/wiki/File:Cardboard_boxes_in_bins_(42045477572).jpg>) |
| Terracotta pot  | [Cover JPG](https://upload.wikimedia.org/wikipedia/commons/4/48/Flowerpot_1.jpg), [source](https://commons.wikimedia.org/wiki/File:Flowerpot_1.jpg)                                         | [Clay pots JPG](https://upload.wikimedia.org/wikipedia/commons/9/90/Clay_pots.jpg), [source](https://commons.wikimedia.org/wiki/File:Clay_pots.jpg)                                                                                                                                       |
| Cotton fabric   | [Cover JPG](https://upload.wikimedia.org/wikipedia/commons/9/9a/Cotton_fabric.jpg), [source](https://commons.wikimedia.org/wiki/File:Cotton_fabric.jpg)                                     | [Fabric detail, 1,280px JPG](https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Macro_image_of_Cotton_Fabric.jpg/1280px-Macro_image_of_Cotton_Fabric.jpg), [source](https://commons.wikimedia.org/wiki/File:Macro_image_of_Cotton_Fabric.jpg)                                       |
| Plastic chair   | [Cover JPG](https://upload.wikimedia.org/wikipedia/commons/b/ba/Plastic_chair.jpg), [source](https://commons.wikimedia.org/wiki/File:Plastic_chair.jpg)                                     | [Stacked chairs source/download page](https://commons.wikimedia.org/wiki/File:Hanoi_Vietnam_The-omnipresent-plastic-chairs-01.jpg), choose the 1,280px JPG                                                                                                                                |

Photo credits, in cover/gallery order:

| Item            | Cover credit                                                            | Gallery credit                                                                     |
| --------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Wooden pallet   | alisdair, CC BY 2.0                                                     | W.carter, CC0                                                                      |
| Cardboard boxes | Ivan Bandura, CC BY 2.0                                                 | jacme31, CC BY-SA 2.0                                                              |
| Terracotta pot  | Lombroso, public domain                                                 | troy mckaskle, CC BY-SA 2.0                                                        |
| Cotton fabric   | Мария Павлуша; file description also credits Ivan Pavlushkin, CC BY 4.0 | Suyash Dwivedi, CC BY-SA 4.0                                                       |
| Plastic chair   | gausanchennai, CC BY-SA 4.0                                             | CEphoto, Uwe Aranas; follow the licence and credit instructions on the source page |

## 3. Create a group of items

Open [Sell or give away](http://localhost:3001/dashboard/listings/new).

Use these values in **Pickup details**:

| Field                        | Sample value                                                               |
| ---------------------------- | -------------------------------------------------------------------------- |
| Name for this group of items | Community event leftovers                                                  |
| Pickup area                  | Rohini, Delhi                                                              |
| Event or cleanup date (IST)  | 10 October 2026                                                            |
| How to pick up (optional)    | Meet at the community hall main gate. Bring transport for the whole batch. |
| Delivery note (optional)     | Pickup preferred. Discuss nearby delivery after acceptance.                |

The event date only tells buyers when the cleanup happened. It does not set a deadline for listing, requesting or collecting an item. Repeat once with an old date such as 2 January 2020; publication and future pickup requests should still work.

Select **Continue to add items**. Add one or more of the following fixtures manually. Prices are for the whole listing, not per piece. A price of 0 means free.

| Item name                  | Category  | Purpose | Quantity | Unit    | Condition | Total price |
| -------------------------- | --------- | ------- | -------- | ------- | --------- | ----------- |
| Wooden pallet for reuse    | Wood      | Reuse   | 1        | pieces  | Fair      | ₹150        |
| Cardboard for recycling    | Paper     | Recycle | 12.5     | kg      | Fair      | ₹0          |
| Terracotta garden pot      | Plants    | Reuse   | 1        | pieces  | Good      | ₹80         |
| Cotton fabric for projects | Cloth     | Reuse   | 2        | bundles | Fair      | ₹0          |
| Plastic event chair        | Furniture | Reuse   | 1        | pieces  | Fair      | ₹200        |

Descriptions and safety notes to paste into the item forms:

| Item           | Description                                                                                                              | Hazards / things to check                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Wooden pallet  | Used wooden pallet from a local event. Suitable for a small reuse project after inspection. Collect the whole item.      | Check for protruding nails, splinters and loose boards. |
| Cardboard      | Sorted cardboard from an event cleanup. Sample weight entered manually for the recycling test.                           | Keep dry. Check for staples and contaminated pieces.    |
| Terracotta pot | Empty terracotta pot available after a garden display cleanup. Inspect before taking it home.                            | Check the rim and base for cracks or sharp chips.       |
| Cotton fabric  | Fabric left after an event display. Useful for craft projects or another backdrop. Sample bundle count entered manually. | Check for stains, tears and attached pins.              |
| Plastic chair  | Used plastic chair available after a community event. Inspect its legs and seat before reuse.                            | Check for cracks and unstable legs.                     |

Upload the cover and gallery file for each item. Switch the cover, remove one gallery photo, and add it back. The selected cover should appear in Review and on the published item card. A listing supports one cover plus up to four additional photos; the same uploaded photo cannot be used twice in one gallery. A group supports up to 20 items.

Select **Review listing**, inspect the details, tick the safety confirmation, and publish. Confirm each item appears in discovery and in the seller's listings.

## 4. Test photo-to-item suggestions

1. Start another listing and complete Pickup details.
2. Add one item manually first, so you can check that AI does not overwrite it.
3. In **Add items from a photo**, choose the pallet, chair or pot cover photo.
4. Select **Find items in photo**.
5. Check that new editable items appear below and your manual item stays unchanged.
6. Check that names, descriptions, hazards and warnings are in English. The model may group objects differently between photos; do not require an exact item count.
7. Review the category, visible quantity and condition. Enter your own price. AI does not measure weight or dimensions, determine a market price or guarantee safety.
8. Change a suggested name and price, then continue through Review and publish.

The fabric close-up is useful for an unclear-photo test: it may produce an uncertain suggestion or no suitable items. A clear empty-wall photo should also fail gracefully rather than inventing a listing.

If Bedrock fails after the upload succeeds, an error should appear and your existing items should remain unchanged. Select **Keep photo and enter details**. A manual item should appear with the uploaded photo already attached. Fill in its name and other details, then publish normally. If the upload itself fails, choose or upload a photo again; there is no successfully stored photo to keep.

The app uses only the serverless `moonshotai.kimi-k2.5` model through Amazon Bedrock. There is no credit-confirmation field to set. AWS credentials, region, model access and the feature switch still need to be valid. Automated tests simulate model responses; the manual step above checks your real AWS account. See [AWS setup and diagnostics](./backend-aws.md).

## 5. Test request, acceptance and collection

Use the seller and buyer in separate browser sessions.

1. As the buyer, browse discovery without signing in. Item details and public seller profiles should open. Requesting or saving should ask for sign-in.
2. Sign in as the buyer, open an available item, choose a future pickup time in IST, add a short note and send the request. Choose tomorrow or another future date relative to the day you test.
3. Confirm the request appears in Buying and the seller receives an in-app notice. Private contact details should still be hidden.
4. As the seller, open the request, review the buyer's public profile, verification status and completed handover history, then accept.
5. Open the handover in both sessions. Each participant should see the other person's email as a working contact link. Any saved mobile number should also appear. An account without a mobile number must still be able to publish, request, accept and finish.
6. Confirm the accepted item is reserved and cannot receive another accepted request. A separate third account must not see either participant's private email or phone.
7. Arrange pickup directly. Buyer acknowledgement is optional. The seller selects **Mark handover complete** after collection.
8. Confirm the item leaves available discovery and active seller listings. Both accounts retain the completed handover record, receive an in-app completion notice, and gain exactly one relevant handover count.
9. Refresh and repeat the completion action if it is available. Counts must not increase again.

Verify both email addresses before testing handover email delivery. Unverified users still receive in-app notices and can complete the same marketplace flow. For verification, the OTP expires after ten minutes; a resend replaces the old code. Verification email contains a selectable code, not a clipboard button.

## 6. Other checks

- Decline a pending request with a reason. It must not reserve the item or reveal contact details.
- Cancel an accepted request before collection. The item should become available again, contact access should close, and completion counts should remain unchanged.
- After completion, private contact is available only to the participants for 30 days. The completed record remains after contact access expires.
- Search by item name and area; test category, free/paid and reuse/recycle filters. Clear filters to recover an empty search.
- Open Profile, edit your area, leave mobile blank, save, and sign out using the bottom action. Check verified/unverified labels on public profiles.
- Enter a wrong OTP, use an expired code, and try the old code after a resend. Each should show an understandable error.
- Repeat the main flow on a narrow mobile screen. Check dropdowns, image previews, cover switching, visible toasts and the absence of sideways scrolling.
- Use a JPG/PNG/WebP larger than the file limit and a non-image file. Upload should fail without losing entered item details.
- An expired access token should refresh once and replay concurrent API requests. If refresh fails, private account data should clear and sign-in should be requested.

## 7. Automated checks and service diagnostics

From the repository root:

```powershell
pnpm.cmd lint
pnpm.cmd check-types
pnpm.cmd test
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
pnpm.cmd --filter web test:e2e
pnpm.cmd build
```

The Chrome path above is optional when Playwright's Chromium is already installed. Browser tests use an isolated database, test mail files and simulated AI responses. Run browser tests and the production build sequentially.

For your real configured services, the existing diagnostic command is:

```powershell
pnpm.cmd --filter backend check:services
```

It checks PostgreSQL and Redis, verifies SMTP login without sending mail, and uploads, reads and deletes a temporary S3 diagnostic object when S3 is selected. It does not call Kimi unless you add `--analyze`:

```powershell
pnpm.cmd --filter backend check:services --analyze
```

That second command makes one live Bedrock inference request using a small generated test image. SMTP login success does not prove inbox delivery. A real verification request and a real uploaded photo are still needed to test mail placement and image recognition.

## Review record

Reviewed the pulled changes through `badf37d` on 11 October 2026: clearer listing copy, preserved uploads after analysis failure, AWS error handling, contact fallback, diagnostics and Redis CI configuration. Application code was left unchanged during this review.

Verification results for this checkout:

| Check            | Result                              |
| ---------------- | ----------------------------------- |
| Lint             | Passed                              |
| Type checks      | Passed                              |
| Unit/API tests   | 41 passed: 25 backend, 16 frontend  |
| Browser tests    | 12 passed across desktop and mobile |
| Production build | Passed for frontend and backend     |

No blocking issue was found in the reviewed changes. The browser tests exercised photo suggestions, preserved manual entries after a simulated AI failure, the keep-photo fallback, optional verification, email contact without phone numbers, completion, empty/error states and token refresh. Live S3, Bedrock and Gmail delivery were not invoked during this review; those are separate from the simulated automated tests.
