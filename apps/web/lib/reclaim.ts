import type { Category, Art, Item } from "../types/materials/type";
import type { Person } from "../types/profile/type";
import type { Event } from "../types/listings/type";
import type { Deal, DealStatus } from "../types/handovers/type";
import type { State, Command } from "../types/marketplace/type";
export type { Category, Art, Item, ItemDraft } from "../types/materials/type";
export type { Person } from "../types/profile/type";
export type { Event, EventDraft } from "../types/listings/type";
export type { Deal, DealStatus } from "../types/handovers/type";
export type { Notice } from "../types/notifications/type";
export type { State, Command } from "../types/marketplace/type";
export const categories = [
  "Wood",
  "Paper",
  "Decor",
  "Plants",
  "Cloth",
  "Furniture",
  "Metal",
  "Plastic",
  "Glass",
  "Electronics",
  "Other",
] as const;
export const demoId = "you";
export function phoneValid(phone: string) {
  return /^(?:\+91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""));
}
export function itemStatus(item: Item, event: Event, now = Date.now()) {
  return item.state === "Available" && event.clearBy <= now
    ? "Expired"
    : item.state;
}
export function effectiveDeal(
  deal: Deal,
  event: Event,
  now = Date.now(),
): DealStatus {
  return deal.status === "Pending" && event.clearBy <= now
    ? "Expired"
    : deal.status;
}
export function formatTime(at: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}
export function priceLabel(price: number) {
  return price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`;
}
function requireRule(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function notice(
  state: State,
  personId: string,
  title: string,
  detail: string,
  href: string,
  now: number,
) {
  state.notices.unshift({
    id: crypto.randomUUID(),
    personId,
    title,
    detail,
    href,
    read: false,
    at: now,
  });
}
export function applyCommand(
  source: State,
  actor: string,
  command: Command,
  now = Date.now(),
): State {
  const state = structuredClone(source);
  const person = state.people.find((p) => p.id === actor);
  requireRule(Boolean(person), "Choose the local demo account first.");
  for (const deal of state.deals) {
    const item = state.items.find((i) => i.id === deal.itemId);
    const event = state.events.find((e) => e.id === item?.eventId);
    if (event && effectiveDeal(deal, event, now) === "Expired") {
      deal.status = "Expired";
      deal.reason = "The pickup window ended.";
    }
  }
  if (command.type === "profile") {
    const p = command.profile;
    requireRule(
      p.name.trim().length >= 2 && p.name.trim().length <= 40,
      "Use a name between 2 and 40 characters.",
    );
    requireRule(
      p.area.trim().length >= 2 && p.area.length <= 60,
      "Add your locality (2–60 characters).",
    );
    requireRule(
      p.phone === "" || phoneValid(p.phone),
      "Use a 10-digit Indian mobile number, optionally prefixed with +91.",
    );
    state.people = state.people.map((p) =>
      p.id === actor
        ? { ...command.profile, name: command.profile.name.trim(), id: actor }
        : p,
    );
    return state;
  }
  if (command.type === "read") {
    state.notices.forEach((n) => {
      if (
        n.personId === actor &&
        (!command.noticeId || n.id === command.noticeId)
      )
        n.read = true;
    });
    return state;
  }
  if (command.type === "save") {
    requireRule(
      state.items.some((i) => i.id === command.itemId),
      "This item is no longer here.",
    );
    state.saved = state.saved.includes(command.itemId)
      ? state.saved.filter((id) => id !== command.itemId)
      : [...state.saved, command.itemId];
    return state;
  }
  if (command.type === "publish") {
    requireRule(
      phoneValid(person!.phone),
      "Add a valid phone number in Profile before publishing.",
    );
    const e = command.event;
    requireRule(
      e.name.trim().length >= 3 &&
        e.name.length <= 80 &&
        e.area.trim().length >= 2 &&
        e.area.length <= 60,
      "Add an event name and locality.",
    );
    requireRule(
      Number.isFinite(e.availableFrom) &&
        Number.isFinite(e.clearBy) &&
        e.clearBy > now &&
        e.clearBy - e.availableFrom >= 30 * 60_000,
      "Pickup needs a future clear-by time, at least 30 minutes after availability.",
    );
    requireRule(
      e.pickupNote.length <= 300 &&
        e.deliveryNote.length <= 300 &&
        !/\d{10}/.test(e.pickupNote),
      "Keep pickup notes under 300 characters and leave phone numbers in Profile.",
    );
    requireRule(
      command.safe && command.items.length > 0 && command.items.length <= 20,
      "Review at least one item and confirm the safety check (maximum 20 items).",
    );
    const eventId = crypto.randomUUID();
    for (const i of command.items) {
      requireRule(
        i.name.trim().length >= 3 &&
          i.name.length <= 80 &&
          i.description.length <= 600 &&
          Number.isFinite(i.quantity) &&
          i.quantity > 0 &&
          (i.unit === "kg" || Number.isInteger(i.quantity)) &&
          Number.isFinite(i.price) &&
          i.price >= 0 &&
          i.price <= 1_000_000,
        "Each item needs a name, positive quantity and a valid price.",
      );
      requireRule(
        [i.image, ...(i.images || [])].every(
          (image) =>
            image === "demo" ||
            (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
              image,
            ) &&
              image.length < 1_500_000),
        ) && (i.images?.length || 0) <= 4,
        "Add a photo, or use the labelled sample illustration.",
      );
      state.items.unshift({
        ...i,
        id: crypto.randomUUID(),
        eventId,
        state: "Available",
        createdAt: now,
      });
    }
    state.events.unshift({ ...e, id: eventId, ownerId: actor });
    notice(
      state,
      actor,
      "Your batch is on the board",
      `${command.items.length} reviewed items are available.`,
      "/dashboard/listings",
      now,
    );
    for (const target of state.people.filter(
      (p) =>
        p.id !== actor &&
        p.interests.some((c) => command.items.some((i) => i.category === c)),
    ))
      notice(
        state,
        target.id,
        "A new batch matches your interests",
        e.name,
        "/dashboard",
        now,
      );
    return state;
  }
  if (command.type === "extend") {
    const e = state.events.find((e) => e.id === command.eventId);
    requireRule(
      Boolean(e) && e!.ownerId === actor,
      "Only the organiser can extend this window.",
    );
    requireRule(
      command.clearBy > now &&
        command.clearBy > e!.clearBy &&
        Number.isFinite(command.clearBy),
      "Choose a later, future clear-by time.",
    );
    e!.clearBy = command.clearBy;
    return state;
  }
  if (
    command.type === "request" ||
    command.type === "withdraw" ||
    command.type === "photos" ||
    command.type === "edit"
  ) {
    const item = state.items.find((i) => i.id === command.itemId);
    const event = state.events.find((e) => e.id === item?.eventId);
    requireRule(Boolean(item && event), "This listing was not found.");
    if (command.type === "request") {
      requireRule(
        event!.ownerId !== actor,
        "You cannot request your own item.",
      );
      requireRule(
        phoneValid(person!.phone),
        "Add a valid phone number in Profile before requesting.",
      );
      requireRule(
        itemStatus(item!, event!, now) === "Available" &&
          event!.availableFrom <= now,
        "This batch is not available for requests.",
      );
      requireRule(
        !state.deals.some(
          (d) =>
            d.itemId === item!.id &&
            d.buyerId === actor &&
            ["Pending", "Accepted"].includes(d.status),
        ),
        "You already have an active request for this batch.",
      );
      requireRule(
        Number.isFinite(command.pickupAt) &&
          command.pickupAt >= Math.max(now, event!.availableFrom) &&
          command.pickupAt <= event!.clearBy,
        "Choose a pickup time within the listing window.",
      );
      requireRule(
        command.note.length <= 300,
        "Keep your note under 300 characters.",
      );
      const id = crypto.randomUUID();
      state.deals.unshift({
        id,
        itemId: item!.id,
        buyerId: actor,
        status: "Pending",
        pickupAt: command.pickupAt,
        note: command.note,
        createdAt: now,
        updatedAt: now,
        buyerConfirmed: false,
        sellerConfirmed: false,
        reason: "",
      });
      notice(
        state,
        event!.ownerId,
        "A new pickup request",
        `${person!.name} requested ${item!.name}.`,
        `/dashboard/deals/${id}`,
        now,
      );
      return state;
    }
    requireRule(
      event!.ownerId === actor,
      "Only the organiser can manage this item.",
    );
    if (command.type === "photos") {
      requireRule(
        itemStatus(item!, event!, now) === "Available",
        "Only available listings can change photos.",
      );
      requireRule(
        command.images.length <= 4 &&
          [command.image, ...command.images].every(
            (image) =>
              image === "demo" ||
              (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
                image,
              ) &&
                image.length < 1_500_000),
          ),
        "Use a cover and up to four JPG, PNG or WebP photos.",
      );
      item!.image = command.image;
      item!.images = command.images;
      return state;
    }
    if (command.type === "edit") {
      requireRule(
        itemStatus(item!, event!, now) === "Available",
        "Only available items can be edited.",
      );
      requireRule(
        command.name.trim().length >= 3 &&
          command.name.length <= 80 &&
          Number.isFinite(command.price) &&
          command.price >= 0 &&
          command.price <= 1_000_000,
        "Use a valid item name and price.",
      );
      item!.name = command.name.trim();
      item!.price = command.price;
      return state;
    }
    requireRule(
      item!.state !== "Done" && item!.state !== "Withdrawn",
      "This item cannot be withdrawn.",
    );
    item!.state = "Withdrawn";
    state.deals
      .filter(
        (d) =>
          d.itemId === item!.id && ["Pending", "Accepted"].includes(d.status),
      )
      .forEach((d) => {
        d.status = d.status === "Pending" ? "Declined" : "Cancelled";
        d.reason = "The organiser withdrew the listing.";
        d.updatedAt = now;
        notice(
          state,
          d.buyerId,
          "Listing withdrawn",
          item!.name,
          `/dashboard/deals/${d.id}`,
          now,
        );
      });
    return state;
  }
  const deal = state.deals.find((d) => d.id === command.dealId);
  const item = state.items.find((i) => i.id === deal?.itemId);
  const event = state.events.find((e) => e.id === item?.eventId);
  requireRule(Boolean(deal && item && event), "This handover was not found.");
  const seller = event!.ownerId === actor;
  requireRule(
    seller || deal!.buyerId === actor,
    "You are not part of this handover.",
  );
  requireRule(
    ["Pending", "Accepted"].includes(deal!.status),
    "This handover is already closed.",
  );
  if (command.type === "accept" || command.type === "decline") {
    requireRule(
      seller && deal!.status === "Pending",
      "Only the organiser can respond to a pending request.",
    );
    if (command.type === "accept") {
      requireRule(
        itemStatus(item!, event!, now) === "Available",
        "This batch is no longer available.",
      );
      item!.state = "Reserved";
      deal!.status = "Accepted";
      for (const other of state.deals.filter(
        (d) =>
          d.id !== deal!.id && d.itemId === item!.id && d.status === "Pending",
      )) {
        other.status = "Declined";
        other.reason = "Another request was accepted for this batch.";
        other.updatedAt = now;
        notice(
          state,
          other.buyerId,
          "Another request was accepted",
          item!.name,
          `/dashboard/deals/${other.id}`,
          now,
        );
      }
    } else {
      deal!.status = "Declined";
      deal!.reason = command.reason || "The organiser declined the request.";
    }
  } else if (command.type === "cancel") {
    requireRule(
      deal!.status === "Accepted" || !seller,
      "Only the buyer can cancel a pending request.",
    );
    if (deal!.status === "Accepted") item!.state = "Available";
    deal!.status = "Cancelled";
    deal!.reason = command.reason || "The handover did not happen.";
  } else {
    requireRule(
      deal!.status === "Accepted",
      "The request must be accepted before confirmation.",
    );
    if (seller) deal!.sellerConfirmed = true;
    else deal!.buyerConfirmed = true;
    if (deal!.sellerConfirmed && deal!.buyerConfirmed) {
      deal!.status = "Done";
      item!.state = "Done";
    }
  }
  deal!.updatedAt = now;
  notice(
    state,
    seller ? deal!.buyerId : event!.ownerId,
    deal!.status === "Done"
      ? "Handover complete"
      : `Handover ${deal!.status.toLowerCase()}`,
    item!.name,
    `/dashboard/deals/${deal!.id}`,
    now,
  );
  return state;
}

export function seedState(now = Date.now()): State {
  const people: Person[] = [
    {
      id: "you",
      name: "Aman Singh",
      phone: "9000000001",
      area: "Rohini",
      buyerType: "reuse",
      interests: ["Wood", "Decor"],
    },
    {
      id: "club",
      name: "DTU Culture Club",
      phone: "9000000002",
      area: "Shahbad Daulatpur",
      buyerType: "reuse",
      interests: ["Wood"],
    },
    {
      id: "collector",
      name: "Neighbourhood Collector",
      phone: "9000000003",
      area: "Rohini",
      buyerType: "bulk",
      interests: ["Paper"],
    },
  ];
  const events: Event[] = [
    {
      id: "fest",
      ownerId: "club",
      name: "DTU Fest Cleanup",
      area: "Shahbad Daulatpur",
      availableFrom: now - 3_600_000,
      clearBy: now + 86_400_000 * 2,
      pickupNote:
        "Meet at the campus collection point behind the main stage. Bring transport for the whole batch.",
      deliveryNote: "Pickup only.",
    },
    {
      id: "your-event",
      ownerId: "you",
      name: "Neighbourhood Art Fair",
      area: "Rohini",
      availableFrom: now - 3_600_000,
      clearBy: now + 86_400_000,
      pickupNote:
        "Collect from the public event gate during the pickup window.",
      deliveryNote: "Local delivery can be discussed after acceptance.",
    },
    {
      id: "market",
      ownerId: "collector",
      name: "Weekend Community Market",
      area: "Pitampura",
      availableFrom: now - 3_600_000,
      clearBy: now + 86_400_000 * 3,
      pickupNote:
        "Meet at the market collection desk. Ask the organiser before arrival.",
      deliveryNote: "Pickup only.",
    },
  ];
  const samples: {
    name: string;
    category: Category;
    art: Art;
    quantity: number;
    unit: Item["unit"];
    price: number;
    description: string;
  }[] = [
    {
      name: "Plywood boards",
      category: "Wood",
      art: "boards",
      quantity: 4,
      unit: "pieces",
      price: 0,
      description:
        "Four reusable panels from a stage setup. Approximately 120 × 60 cm. Check edges before use; small screw holes remain.",
    },
    {
      name: "Sorted cardboard",
      category: "Paper",
      art: "boxes",
      quantity: 12,
      unit: "kg",
      price: 180,
      description:
        "Dry, flattened packaging separated from general waste. Weight is an organiser estimate; confirm at collection.",
    },
    {
      name: "Terracotta pots",
      category: "Plants",
      art: "pots",
      quantity: 6,
      unit: "pieces",
      price: 240,
      description:
        "Empty event planters, approximately 20 cm tall. A few marks from outdoor use. No plants included.",
    },
    {
      name: "Cotton backdrop",
      category: "Cloth",
      art: "cloth",
      quantity: 2,
      unit: "pieces",
      price: 0,
      description:
        "Plain cloth backdrops, approximately 2 × 3 m. Folded and ready to collect. Wash before reuse.",
    },
    {
      name: "Display stands",
      category: "Decor",
      art: "stand",
      quantity: 3,
      unit: "pieces",
      price: 450,
      description:
        "Freestanding plywood display pieces from the event. Good for another exhibition; inspect assembly points.",
    },
    {
      name: "Metal frame sections",
      category: "Metal",
      art: "metal",
      quantity: 5,
      unit: "pieces",
      price: 300,
      description:
        "Loose frame sections from temporary displays. No structural guarantee. Wear gloves and bring suitable transport.",
    },
  ];
  samples.push(
    {
      name: "Folding event chairs",
      category: "Furniture",
      art: "chair",
      quantity: 8,
      unit: "pieces",
      price: 640,
      description:
        "Eight folding chairs from the event seating area. Check hinges and feet before reuse. Whole batch only.",
    },
    {
      name: "Timber pallet",
      category: "Wood",
      art: "pallet",
      quantity: 2,
      unit: "pieces",
      price: 0,
      description:
        "Two clean pallets used for transporting displays. Some nail heads remain. Suitable for a craft project after inspection.",
    },
    {
      name: "Glass display bottles",
      category: "Glass",
      art: "bottles",
      quantity: 12,
      unit: "pieces",
      price: 120,
      description:
        "Empty glass bottles used as table decorations. Rinsed, with no caps. Pack carefully for collection.",
    },
    {
      name: "Extension cable bundle",
      category: "Electronics",
      art: "cables",
      quantity: 3,
      unit: "pieces",
      price: 360,
      description:
        "Three extension cables from the lighting desk. Unverified electrical condition. Have them checked before use.",
    },
    {
      name: "Art workshop books",
      category: "Paper",
      art: "books",
      quantity: 18,
      unit: "pieces",
      price: 0,
      description:
        "Illustrated workshop books and unused sketch pads. Dry and packed together. Collect the complete set.",
    },
    {
      name: "Wooden display crates",
      category: "Decor",
      art: "crates",
      quantity: 4,
      unit: "pieces",
      price: 200,
      description:
        "Four lightweight wooden crates used at market stalls. Approximately 40 × 30 cm. Check joints before loading.",
    },
  );
  const items: Item[] = Array.from({ length: samples.length }, (_, i) => {
    const s = samples[i % samples.length]!;
    return {
      ...s,
      id: `item-${i + 1}`,
      eventId: i < 6 ? "fest" : "market",
      name: s.name,
      purpose: s.category === "Paper" ? "Recycle" : "Reuse",
      condition: i % 3 === 0 ? "Fair" : "Good",
      hazards:
        s.category === "Wood"
          ? "Check for nails and splinters."
          : s.category === "Metal"
            ? "Sharp edges; gloves recommended."
            : "None reported. Inspect before collection.",
      image: "demo",
      state: "Available",
      createdAt: now - i * 600_000,
    };
  });
  items.push(
    {
      ...items[0]!,
      id: "your-boards",
      eventId: "your-event",
      name: "Stage panels",
      quantity: 3,
    },
    {
      ...items[2]!,
      id: "your-pots",
      eventId: "your-event",
      name: "Event planters",
      quantity: 8,
    },
  );
  const incoming: Deal = {
    id: "incoming",
    itemId: "your-boards",
    buyerId: "club",
    status: "Pending",
    pickupAt: now + 3_600_000 * 4,
    note: "Our student theatre group can collect the full batch this afternoon.",
    createdAt: now - 600_000,
    updatedAt: now - 600_000,
    buyerConfirmed: false,
    sellerConfirmed: false,
    reason: "",
  };
  return {
    version: 1,
    people,
    events,
    items,
    deals: [
      incoming,
      {
        ...incoming,
        id: "competing",
        buyerId: "collector",
        note: "Can collect the full batch with a small van.",
      },
    ],
    notices: [
      {
        id: "welcome",
        personId: "you",
        title: "Two requests for your stage panels",
        detail: "Review pickup times and choose one person for the batch.",
        href: "/dashboard/listings",
        read: false,
        at: now,
      },
    ],
    saved: [],
  };
}
