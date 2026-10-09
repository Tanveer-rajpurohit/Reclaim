import type { Category } from "../materials/type";
export interface DiscoverProps {
  savedOnly?: boolean;
}
export interface MaterialFilters {
  categories: Category[];
  purpose: "" | "Reuse" | "Recycle";
  price: "" | "free" | "paid";
  area: string;
  sort: "newest" | "oldest";
}
export interface FilterPanelProps {
  value: MaterialFilters;
  localities: string[];
  onApply: (filters: MaterialFilters) => void;
}
