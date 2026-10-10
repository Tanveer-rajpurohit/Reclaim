"use client";
import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import type { Command, MarketplaceStore } from "@/types/marketplace/type";
import {
  commandRequest,
  emptySnapshot,
  executeCommand,
  getMarketplace,
} from "@/lib/api/marketplace";
import { APIError } from "@/lib/api/fetch";
import { useMarketplaceUI } from "@/stores/marketplace";

export const marketplaceKey = ["marketplace"] as const;

export function useMarketplace(): MarketplaceStore {
  const client = useQueryClient();
  const path = usePathname();
  const ui = useMarketplaceUI();
  const busy = useRef(false);
  const keys = useRef(new Map<string, string>());
  const query = useQuery({
    queryKey: marketplaceKey,
    queryFn: ({ signal }) => getMarketplace(signal),
    refetchInterval: 30000,
  });
  const mutation = useMutation({
    mutationFn: ({
      request,
      key,
    }: {
      request: ReturnType<typeof commandRequest>;
      key: string;
    }) => executeCommand(request, key),
  });
  async function refresh() {
    await client.invalidateQueries({
      queryKey: marketplaceKey,
      refetchType: "none",
    });
    await client.fetchQuery({
      queryKey: marketplaceKey,
      queryFn: ({ signal }) => getMarketplace(signal),
    });
  }
  async function run(command: Command) {
    if (busy.current) return false;
    const snapshot = client.getQueryData<typeof emptySnapshot>(marketplaceKey);
    if (!snapshot?.currentUserId) {
      ui.requestLogin(path);
      return false;
    }
    busy.current = true;
    ui.clearError();
    const request = commandRequest(command, snapshot);
    const fingerprint = JSON.stringify({
      userId: snapshot.currentUserId,
      ...request,
    });
    const key = keys.current.get(fingerprint) || crypto.randomUUID();
    keys.current.set(fingerprint, key);
    try {
      await client.cancelQueries({ queryKey: marketplaceKey });
      await mutation.mutateAsync({ request, key });
      keys.current.delete(fingerprint);
      await client.invalidateQueries({
        queryKey: ["people"],
        refetchType: "none",
      });
      try {
        await refresh();
      } catch {
        ui.setError(
          "Your change was saved. Refresh the page to load the latest details.",
        );
      }
      return true;
    } catch (cause) {
      if (cause instanceof APIError && cause.status === 401) {
        client.removeQueries({ queryKey: marketplaceKey });
        client.removeQueries({ queryKey: ["people"] });
        ui.requestLogin(path);
      } else
        ui.setError(
          cause instanceof Error
            ? cause.message
            : "Your change could not be saved.",
        );
      try {
        await refresh();
      } catch (error) {
        ui.setError(
          error instanceof Error
            ? error.message
            : "Could not reload the latest details.",
        );
      }
      return false;
    } finally {
      busy.current = false;
    }
  }
  return {
    ...(query.data || emptySnapshot),
    ready: !query.isPending,
    loadFailed: query.isError && !query.data,
    now: query.dataUpdatedAt,
    error: ui.error || query.error?.message || "",
    clearError: ui.clearError,
    pending: mutation.isPending,
    run,
    refresh,
  };
}
