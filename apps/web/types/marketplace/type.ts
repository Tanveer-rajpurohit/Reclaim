import type { State, Command } from "@repo/domain";
export type { State, Command } from "@repo/domain";
export interface MarketplaceStore {
  state: State;
  ready: boolean;
  now: number;
  error: string;
  clearError: () => void;
  currentUserId: string | null;
  contacts: Record<string, { name: string; phone: string }>;
  email: string | null;
  pending: boolean;
  run: (command: Command) => Promise<boolean>;
  refresh: () => Promise<void>;
}
