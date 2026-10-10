"use client";
import { useMutation } from "@tanstack/react-query";
import { analyzePhoto, uploadPhoto } from "@/lib/api/photos";

export function usePhotoAnalysis() {
  return useMutation({
    mutationFn: ({
      photoUrl,
      signal,
    }: {
      photoUrl: string;
      signal?: AbortSignal;
    }) => analyzePhoto(photoUrl, signal),
  });
}

export function usePhotoUpload() {
  return useMutation({
    mutationFn: ({ file, signal }: { file: File; signal?: AbortSignal }) =>
      uploadPhoto(file, signal),
  });
}
