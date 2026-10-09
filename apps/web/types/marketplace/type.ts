import type { Person } from "../profile/type";
export interface LegacyDashboardRouteProps {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}
import type { Event, EventDraft } from "../listings/type";
import type { Item, ItemDraft } from "../materials/type";
import type { Deal } from "../handovers/type";
import type { Notice } from "../notifications/type";
export interface State {
  version: 1;
  people: Person[];
  events: Event[];
  items: Item[];
  deals: Deal[];
  notices: Notice[];
  saved: string[];
}
export type Command =
  | { type: "request"; itemId: string; pickupAt: number; note: string }
  | {
      type: "accept" | "decline" | "cancel" | "confirm";
      dealId: string;
      reason?: string;
    }
  | { type: "withdraw"; itemId: string }
  | { type: "extend"; eventId: string; clearBy: number }
  | { type: "edit"; itemId: string; name: string; price: number }
  | { type: "photos"; itemId: string; image: string; images: string[] }
  | { type: "publish"; event: EventDraft; items: ItemDraft[]; safe: boolean }
  | { type: "profile"; profile: Omit<Person, "id"> }
  | { type: "save"; itemId: string }
  | { type: "read"; noticeId?: string };
export interface MarketplaceStore {
  state: State;
  ready: boolean;
  now: number;
  error: string;
  clearError: () => void;
  run: (command: Command, actor?: string) => boolean;
  reset: () => void;
}
