"use client";
import { useQuery } from "@tanstack/react-query";
import { getPublicProfile } from "@/lib/api/people";

export function usePublicProfile(id: string) {
  return useQuery({
    queryKey: ["people", id],
    queryFn: ({ signal }) => getPublicProfile(id, signal),
  });
}
