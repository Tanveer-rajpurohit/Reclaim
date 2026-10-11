"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Controls";
import Icon from "@/components/ui/Icon";

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
        <Icon name="logout" />
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
