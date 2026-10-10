"use client";
import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { APIError, sessionExpiredEvent } from "@/lib/api/fetch";
import { emptySnapshot } from "@/lib/api/marketplace";
import { useMarketplaceUI } from "@/stores/marketplace";

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000,
            gcTime: 300000,
            retry: (count, error) =>
              count < 1 && !(error instanceof APIError && error.status < 500),
          },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    const expire = () => {
      void client.cancelQueries().then(() => {
        client.setQueryData(["marketplace"], emptySnapshot);
        client.removeQueries({ queryKey: ["people"] });
        useMarketplaceUI.getState().reset();
        const path = window.location.pathname;
        if (
          path.startsWith("/dashboard/") &&
          !path.startsWith("/dashboard/items/") &&
          !path.startsWith("/dashboard/people/")
        )
          useMarketplaceUI.getState().requestLogin(path);
      });
    };
    window.addEventListener(sessionExpiredEvent, expire);
    return () => window.removeEventListener(sessionExpiredEvent, expire);
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
