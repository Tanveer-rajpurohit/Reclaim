"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { MarketplaceStore } from "@/types/marketplace/type";
import { useMarketplace } from "@/hooks/useMarketplace";

const Context = createContext<MarketplaceStore | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const value = useMarketplace();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useBoard() {
  const value = useContext(Context);
  if (!value) throw new Error("BoardProvider is required.");
  return value;
}
