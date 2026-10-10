"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Controls";

export default function MarketplaceLoadError({
  refresh,
}: {
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function retry() {
    setBusy(true);
    setError("");
    try {
      await refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Please try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="my-10 rounded-xl border border-line px-6 py-12 text-center"
      aria-labelledby="marketplace-load-error"
    >
      <h1 id="marketplace-load-error" className="text-2xl tracking-tight">
        Materials could not be loaded.
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted">
        The marketplace is temporarily unavailable. Retry to load the latest
        materials and account details.
      </p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={retry}
        className="mt-6"
      >
        {busy ? "Retrying…" : "Retry loading"}
      </Button>
      {error && (
        <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </section>
  );
}
