"use client";
import { create } from "zustand";
import type { MaterialFilters } from "@/types/discover/type";

interface DiscoverState extends MaterialFilters {
  query: string;
  limit: number;
  update: (
    changes: Partial<MaterialFilters & { query: string; limit: number }>,
  ) => void;
  reset: () => void;
}

const defaults: MaterialFilters & { query: string; limit: number } = {
  categories: [],
  purpose: "",
  price: "",
  area: "",
  sort: "newest",
  query: "",
  limit: 12,
};

export const useDiscoverStore = create<DiscoverState>()((set) => ({
  ...defaults,
  update: (changes) => set({ limit: 12, ...changes }),
  reset: () => set(defaults),
}));
