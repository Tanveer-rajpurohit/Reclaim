import test from "node:test";
import assert from "node:assert/strict";
import { participantHistory, activeListingsFor } from "./records.ts";
import {
  applyCommand,
  seedState,
  itemStatus,
  effectiveDeal,
} from "./reclaim.ts";

const now = 1_800_000_000_000;
test("seller completion creates the same record for both people and removes active stock", () => {
  const accepted = applyCommand(
    seedState(now),
    "you",
    { type: "accept", dealId: "incoming" },
    now,
  );
  const completed = applyCommand(
    accepted,
    "you",
    { type: "confirm", dealId: "incoming" },
    now,
  );
  const seller = participantHistory(completed, "you");
  const buyer = participantHistory(completed, "club");
  assert.equal(completed.deals[0].status, "Done");
  assert.equal(completed.deals[0].buyerConfirmed, false);
  assert.equal(seller[0].deal.id, buyer[0].deal.id);
  assert.equal(seller[0].role, "offered");
  assert.equal(buyer[0].role, "collected");
  assert.deepEqual(
    completed.notices
      .filter((n) => n.title === "Handover complete")
      .map((n) => n.personId)
      .sort(),
    ["club", "you"],
  );
  assert.equal(
    activeListingsFor(completed, "you").some(
      (item) => item.id === "your-boards",
    ),
    false,
  );
  assert.throws(
    () =>
      applyCommand(
        completed,
        "you",
        { type: "confirm", dealId: "incoming" },
        now,
      ),
    /already closed/,
  );
});
test("gallery updates enforce ownership, image count and available stock", () => {
  const s = seedState(now);
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        { type: "photos", itemId: "item-1", image: "demo", images: [] },
        now,
      ),
    /organiser/,
  );
  const changed = applyCommand(
    s,
    "you",
    { type: "photos", itemId: "your-pots", image: "demo", images: ["demo"] },
    now,
  );
  assert.equal(
    changed.items.find((i) => i.id === "your-pots").images.length,
    1,
  );
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        {
          type: "photos",
          itemId: "your-pots",
          image: "demo",
          images: Array(5).fill("demo"),
        },
        now,
      ),
    /four/,
  );
  const reserved = applyCommand(
    s,
    "you",
    { type: "accept", dealId: "incoming" },
    now,
  );
  assert.throws(
    () =>
      applyCommand(
        reserved,
        "you",
        { type: "photos", itemId: "your-boards", image: "demo", images: [] },
        now,
      ),
    /available/,
  );
});
test("publication saves all reviewed items and rejects invalid gallery formats", () => {
  const s = seedState(now);
  const event = {
    ...s.events[0],
    availableFrom: now,
    clearBy: now + 86_400_000,
  };
  const changed = applyCommand(
    s,
    "you",
    { type: "publish", event, items: [s.items[0], s.items[1]], safe: true },
    now,
  );
  assert.equal(changed.items.length, s.items.length + 2);
  assert.equal(changed.events[0].ownerId, "you");
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        {
          type: "publish",
          event,
          items: [{ ...s.items[0], images: ["javascript:bad"] }],
          safe: true,
        },
        now,
      ),
    /photo/,
  );
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        { type: "profile", profile: { ...s.people[0], phone: "123" } },
        now,
      ),
    /mobile/,
  );
});
test("one identity can buy foreign stock but cannot request its own", () => {
  let s = seedState(now);
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        {
          type: "request",
          itemId: "your-boards",
          pickupAt: now + 3_600_000,
          note: "",
        },
        now,
      ),
    /own item/,
  );
  s = applyCommand(
    s,
    "you",
    { type: "request", itemId: "item-1", pickupAt: now + 3_600_000, note: "" },
    now,
  );
  assert.equal(s.deals[0].buyerId, "you");
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        {
          type: "request",
          itemId: "item-1",
          pickupAt: now + 3_600_000,
          note: "",
        },
        now,
      ),
    /active request/,
  );
});
test("acceptance reserves once and closes competing whole-batch requests", () => {
  const s = applyCommand(
    seedState(now),
    "you",
    { type: "accept", dealId: "incoming" },
    now,
  );
  assert.equal(s.items.find((i) => i.id === "your-boards").state, "Reserved");
  assert.equal(s.deals.find((d) => d.id === "competing").status, "Declined");
  assert.throws(
    () => applyCommand(s, "you", { type: "accept", dealId: "incoming" }, now),
    /pending request/,
  );
  assert.throws(
    () =>
      applyCommand(
        seedState(now),
        "collector",
        { type: "accept", dealId: "incoming" },
        now,
      ),
    /not part/,
  );
});
test("only the seller finalizes an accepted handover and completion is final", () => {
  let s = applyCommand(
    seedState(now),
    "you",
    { type: "accept", dealId: "incoming" },
    now,
  );
  s = applyCommand(s, "club", { type: "confirm", dealId: "incoming" }, now);
  assert.equal(s.deals[0].status, "Accepted");
  s = applyCommand(s, "you", { type: "confirm", dealId: "incoming" }, now);
  assert.equal(s.deals[0].status, "Done");
  assert.equal(s.items.find((i) => i.id === "your-boards").state, "Done");
  assert.throws(
    () => applyCommand(s, "club", { type: "confirm", dealId: "incoming" }, now),
    /already closed/,
  );
  assert.throws(
    () =>
      applyCommand(s, "you", { type: "withdraw", itemId: "your-boards" }, now),
    /cannot be withdrawn/,
  );
});
test("event dates never expire listings or requests and cancellation releases stock", () => {
  let s = applyCommand(
    seedState(now),
    "you",
    { type: "accept", dealId: "incoming" },
    now + 90 * 86_400_000,
  );
  s = applyCommand(
    s,
    "club",
    { type: "cancel", dealId: "incoming" },
    now + 91 * 86_400_000,
  );
  assert.equal(
    itemStatus(s.items.find((i) => i.id === "your-boards")),
    "Available",
  );
  assert.equal(effectiveDeal(seedState(now).deals[0]), "Pending");
});
test("pickup can be months after an old event without a collection deadline", () => {
  const s = seedState(now);
  s.events[0].eventAt = now - 365 * 86_400_000;
  const next = applyCommand(
    s,
    "you",
    {
      type: "request",
      itemId: "item-1",
      pickupAt: now + 180 * 86_400_000,
      note: "",
    },
    now,
  );
  assert.equal(next.deals[0].status, "Pending");
  assert.equal(next.deals[0].pickupAt, now + 180 * 86_400_000);
  assert.equal(next.notices[0].personId, "club");
});
test("withdrawal hides stock and prevents stale confirmations", () => {
  let s = applyCommand(
    seedState(now),
    "you",
    { type: "accept", dealId: "incoming" },
    now,
  );
  s = applyCommand(s, "you", { type: "withdraw", itemId: "your-boards" }, now);
  assert.equal(s.deals[0].status, "Cancelled");
  assert.throws(
    () => applyCommand(s, "club", { type: "confirm", dealId: "incoming" }, now),
    /closed/,
  );
});
test("publication is atomic and rejects invalid event dates", () => {
  const s = seedState(now);
  const event = { ...s.events[0], eventAt: Number.NaN };
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        { type: "publish", event, items: [s.items[0]], safe: true },
        now,
      ),
    /event date/,
  );
  assert.equal(s.items.length, 14);
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        { type: "request", itemId: "item-1", pickupAt: now - 1000, note: "" },
        now,
      ),
    /pickup time/,
  );
});
