import type { PublicProfileData } from "@/types/people/type";
import { apiFetch } from "./fetch";

export function getPublicProfile(id: string, signal?: AbortSignal) {
  return apiFetch<PublicProfileData>(`/api/users/${encodeURIComponent(id)}`, {
    signal,
  });
}
