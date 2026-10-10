import type { State, Command } from "@repo/domain";
export type { State, Command } from "@repo/domain";
export interface PickupContact {
  name: string;
  phone: string;
  email: string;
}
export interface MarketplaceSnapshot {
  state: State;
  currentUserId: string | null;
  contacts: Record<string, PickupContact>;
  email: string | null;
  verified: boolean;
}
export interface MarketplaceStore {
  state: State;
  ready: boolean;
  loadFailed: boolean;
  now: number;
  error: string;
  clearError: () => void;
  currentUserId: string | null;
  contacts: Record<string, PickupContact>;
  email: string | null;
  pending: boolean;
  verified: boolean;
  run: (command: Command) => Promise<boolean>;
  refresh: () => Promise<void>;
}
