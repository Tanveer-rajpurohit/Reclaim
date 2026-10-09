import type { Item, ItemDraft } from "../materials/type";
export interface EditItemProps {
  item: Item;
  close: () => void;
}
export interface PublishReviewProps {
  collection: CollectionFields;
  items: ItemDraft[];
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
export interface CollectionFields {
  eventName: string;
  area: string;
  eventDate: string;
  pickupNote: string;
  deliveryNote: string;
}
export interface CollectionStepProps {
  collection: CollectionFields;
  onChange: (field: keyof CollectionFields, value: string) => void;
}
export interface MaterialsStepProps {
  items: ItemDraft[];
  busy: boolean;
  update: (index: number, changes: Partial<ItemDraft>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onBusyChange: (busy: boolean) => void;
}
export type PublishPhase = 0 | 1 | 2;
