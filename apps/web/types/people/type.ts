import type { Deal } from "../handovers/type";
import type { Item } from "../materials/type";
import type { Event } from "../listings/type";
export interface PublicProfileProps {
  id: string;
}
export interface PublicProfilePageProps {
  params: Promise<{ id: string }>;
}
export interface CompletedHandover {
  deal: Deal;
  item: Item;
  event: Event;
  role: "offered" | "collected";
}
