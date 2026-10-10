"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authenticate, type AuthRequest } from "@/lib/api/auth";
import { useMarketplaceUI } from "@/stores/marketplace";
import { useDiscoverStore } from "@/stores/discover";

export function useAuth() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authenticate,
    onSuccess: async (_data, request: AuthRequest) => {
      if (
        ["register", "login", "logout", "verify", "reset"].includes(
          request.action,
        )
      ) {
        await client.cancelQueries();
        client.clear();
        useMarketplaceUI.getState().reset();
        useDiscoverStore.getState().reset();
      }
    },
  });
}
