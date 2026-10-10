"use client";

import { Blobatar } from "@blobatar/react";
import type { NameAvatarProps } from "@/types/ui/type";

export default function NameAvatar({
  name,
  size = 36,
  className = "",
}: NameAvatarProps) {
  const displayName = name.trim() || "Reclaim user";
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${displayName} avatar`}
    >
      <Blobatar name={displayName} size={size} />
    </span>
  );
}
