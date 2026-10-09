import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCommand,
  seedState,
  itemStatus,
  effectiveDeal,
} from "./reclaim.ts";

const now = 1_800_000_000_000;
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
test("completion needs both confirmations and is final", () => {
  let s = applyCommand(
    seedState(now),
    "you",
    { type: "accept", dealId: "incoming" },
    now,
  );
  s = applyCommand(s, "you", { type: "confirm", dealId: "incoming" }, now);
  assert.equal(s.deals[0].status, "Accepted");
  s = applyCommand(s, "club", { type: "confirm", dealId: "incoming" }, now);
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
test("cancellation releases stock but expiry does not reopen pending requests", () => {
  let s = applyCommand(
    seedState(now),
    "you",
    { type: "accept", dealId: "incoming" },
    now,
  );
  s = applyCommand(
    s,
    "club",
    { type: "cancel", dealId: "incoming" },
    now + 2 * 86_400_000,
  );
  const item = s.items.find((i) => i.id === "your-boards");
  assert.equal(
    itemStatus(
      item,
      s.events.find((e) => e.id === item.eventId),
      now + 2 * 86_400_000,
    ),
    "Expired",
  );
  const fresh = seedState(now);
  assert.equal(
    effectiveDeal(fresh.deals[0], fresh.events[1], now + 2 * 86_400_000),
    "Expired",
  );
  assert.throws(
    () =>
      applyCommand(
        fresh,
        "you",
        { type: "accept", dealId: "incoming" },
        now + 2 * 86_400_000,
      ),
    /closed/,
  );
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
test("publication is atomic and rejects invalid windows and missing photos", () => {
  const s = seedState(now);
  const event = { ...s.events[0], availableFrom: now, clearBy: now + 1000 };
  assert.throws(
    () =>
      applyCommand(
        s,
        "you",
        { type: "publish", event, items: [s.items[0]], safe: true },
        now,
      ),
    /30 minutes/,
  );
  assert.equal(s.items.length, 26);
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
