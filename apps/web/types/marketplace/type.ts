import type { State, Command } from "@repo/domain";
export type { State, Command } from "@repo/domain";
export interface MarketplaceStore {
  state: State;
  ready: boolean;
  now: number;
  error: string;
  clearError: () => void;
  run: (command: Command, actor?: string) => boolean;
  reset: () => void;
}
