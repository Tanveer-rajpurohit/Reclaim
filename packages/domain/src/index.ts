export type Category =
  | "Wood"
  | "Paper"
  | "Decor"
  | "Plants"
  | "Cloth"
  | "Furniture"
  | "Metal"
  | "Plastic"
  | "Glass"
  | "Electronics"
  | "Other";
export type Art =
  | "boards"
  | "boxes"
  | "pots"
  | "cloth"
  | "stand"
  | "metal"
  | "chair"
  | "pallet"
  | "bottles"
  | "cables"
  | "books"
  | "crates";
export interface Item {
  id: string;
  eventId: string;
  name: string;
  description: string;
  category: Category;
  purpose: "Reuse" | "Recycle";
  quantity: number;
  unit: "pieces" | "bundles" | "kg";
  condition: "Good" | "Fair" | "Poor";
  price: number;
  hazards: string;
  art: Art;
  image: string;
  images?: string[];
  state: "Available" | "Reserved" | "Done" | "Withdrawn";
  createdAt: number;
  revision?: number;
}

export type ItemDraft = Omit<Item, "id" | "eventId" | "state" | "createdAt">;

export interface Person {
  id: string;
  name: string;
  phone: string;
  area: string;
  buyerType: "none" | "reuse" | "bulk";
  interests: Category[];
  offeredCount?: number;
  collectedCount?: number;
}

export interface Event {
  id: string;
  ownerId: string;
  name: string;
  area: string;
  eventAt: number;
  pickupNote: string;
  deliveryNote: string;
}

export type EventDraft = Omit<Event, "id" | "ownerId">;

export type DealStatus =
  "Pending" | "Accepted" | "Done" | "Declined" | "Cancelled";
export interface Deal {
  id: string;
  itemId: string;
  buyerId: string;
  status: DealStatus;
  pickupAt: number;
  note: string;
  createdAt: number;
  updatedAt: number;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  reason: string;
  revision?: number;
  acceptedAt?: number;
  completedAt?: number;
}

export interface Notice {
  id: string;
  personId: string;
  title: string;
  detail: string;
  href: string;
  read: boolean;
  at: number;
}

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
  | { type: "edit"; itemId: string; name: string; price: number }
  | { type: "photos"; itemId: string; image: string; images: string[] }
  | { type: "publish"; event: EventDraft; items: ItemDraft[]; safe: boolean }
  | { type: "profile"; profile: Omit<Person, "id"> }
  | { type: "save"; itemId: string }
  | { type: "read"; noticeId?: string };

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
export function phoneValid(phone: string) {
  return /^(?:\+91)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""));
}
