"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Controls";

export default function SignOutButton({ disabled }: { disabled: boolean }) {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  async function signOut() {
    setError("");
    try {
      await auth.mutateAsync({ action: "logout" });
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign out failed. Please try again.",
      );
    }
  }
  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      <Button
        variant="secondary"
        disabled={disabled || auth.isPending}
        onClick={signOut}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 4H5v16h4M13 8l4 4-4 4M9 12h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {auth.isPending ? "Signing out…" : "Sign out"}
      </Button>
      {error && (
        <p
          role="alert"
          className="max-w-xs text-sm leading-6 text-[var(--danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
