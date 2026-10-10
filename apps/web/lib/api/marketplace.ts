import type { Command, MarketplaceSnapshot } from "@/types/marketplace/type";
import { apiFetch } from "./fetch";

export const emptySnapshot: MarketplaceSnapshot = {
  state: {
    version: 1,
    people: [],
    events: [],
    items: [],
    deals: [],
    notices: [],
    saved: [],
  },
  currentUserId: null,
  contacts: {},
  email: null,
  verified: false,
};

export function getMarketplace(signal?: AbortSignal) {
  return apiFetch<MarketplaceSnapshot>("/api/board", { signal });
}

export function commandRequest(
  command: Command,
  snapshot: MarketplaceSnapshot,
) {
  let path: string;
  let method = "POST";
  let body: unknown = {};
  let revision: number | undefined;
  const { state, currentUserId } = snapshot;
  if (command.type === "publish") {
    path = "/api/events";
    const { eventAt, ...event } = command.event;
    body = {
      event: {
        ...event,
        eventDate: new Date(eventAt + 330 * 60000).toISOString().slice(0, 10),
      },
      items: command.items,
      safe: command.safe,
    };
  } else if (command.type === "profile") {
    path = "/api/me";
    method = "PATCH";
    const { name, phone, area, buyerType, interests } = command.profile;
    body = { name, phone, area, buyerType, interests };
  } else if (command.type === "read") {
    path = "/api/me/notifications/read";
    method = "PATCH";
    body = command.noticeId ? { noticeId: command.noticeId } : {};
  } else if (command.type === "save") {
    path = `/api/me/saved/${command.itemId}`;
    method = state.saved.includes(command.itemId) ? "DELETE" : "PUT";
  } else if ("itemId" in command) {
    path = `/api/items/${command.itemId}`;
    revision = state.items.find((item) => item.id === command.itemId)?.revision;
    if (command.type === "request") {
      path += "/requests";
      body = { pickupAt: command.pickupAt, note: command.note };
      revision = undefined;
    } else if (command.type === "withdraw") path += "/withdraw";
    else if (command.type === "edit") {
      method = "PATCH";
      body = { name: command.name, price: command.price };
    } else {
      path += "/photos";
      method = "PATCH";
      body = { image: command.image, images: command.images };
    }
  } else {
    const deal = state.deals.find((entry) => entry.id === command.dealId);
    revision = deal?.revision;
    const item = state.items.find((entry) => entry.id === deal?.itemId);
    const seller =
      state.events.find((event) => event.id === item?.eventId)?.ownerId ===
      currentUserId;
    const action =
      command.type === "confirm"
        ? seller
          ? "complete"
          : "acknowledge"
        : command.type;
    path = `/api/deals/${command.dealId}/${action}`;
    body = { reason: command.reason || "" };
  }
  return { path, method, body, revision };
}

export function executeCommand(
  request: ReturnType<typeof commandRequest>,
  key: string,
) {
  return apiFetch<unknown>(request.path, {
    method: request.method,
    body: ["PUT", "DELETE"].includes(request.method)
      ? undefined
      : JSON.stringify(request.body),
    headers: {
      "Idempotency-Key": key,
      ...(request.revision ? { "If-Match": String(request.revision) } : {}),
    },
  });
}
