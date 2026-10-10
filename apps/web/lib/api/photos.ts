import type { PhotoAnalysisResult } from "@repo/domain";
import { apiFetch } from "./fetch";

export async function uploadPhoto(
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10_000_000
  )
    throw new Error("Use a JPG, PNG or WebP photo smaller than 10 MB.");
  const form = new FormData();
  form.set("photo", file);
  return (
    await apiFetch<{ url: string }>("/api/uploads", {
      method: "POST",
      body: form,
      signal,
    })
  ).url;
}

export function analyzePhoto(photoUrl: string, signal?: AbortSignal) {
  return apiFetch<PhotoAnalysisResult>("/api/analysis", {
    method: "POST",
    signal,
    body: JSON.stringify({ photoId: photoUrl.split("/").at(-1) }),
  });
}
