"use client";
import { create } from "zustand";

interface MarketplaceUI {
  error: string;
  loginPath: string | null;
  setError: (error: string) => void;
  clearError: () => void;
  requestLogin: (path: string) => void;
  dismissLogin: () => void;
  reset: () => void;
}

export const useMarketplaceUI = create<MarketplaceUI>()((set) => ({
  error: "",
  loginPath: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: "" }),
  requestLogin: (loginPath) => set({ loginPath }),
  dismissLogin: () => set({ loginPath: null }),
  reset: () => set({ error: "", loginPath: null }),
}));
