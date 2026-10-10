import type { Deal } from "../handovers/type";
import type { Item } from "../materials/type";
import type { Event } from "../listings/type";
import type { Person } from "../profile/type";
export interface PublicProfileData {
  person: Person;
  history: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    role: string;
    completedAt: number;
  }[];
}
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
