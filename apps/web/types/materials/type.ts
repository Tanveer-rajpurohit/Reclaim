import type { Art, Item } from "@repo/domain";
export type { Category, Art, Item, ItemDraft } from "@repo/domain";
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
