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
}

export type ItemDraft = Omit<Item, "id" | "eventId" | "state" | "createdAt">;
export interface MaterialArtProps {
  art: Art;
  name: string;
  image?: string;
}
export interface PhotoGalleryProps extends MaterialArtProps {
  image: string;
  images?: string[];
  disabled?: boolean;
  onChange?: (image: string, images: string[]) => boolean | void;
  onBusyChange?: (busy: boolean) => void;
}
export interface ItemCardProps {
  item: Item;
}
export interface MaterialDetailProps {
  id: string;
}
export interface EmptyStateProps {
  title: string;
  text: string;
  href?: string;
  label?: string;
}
