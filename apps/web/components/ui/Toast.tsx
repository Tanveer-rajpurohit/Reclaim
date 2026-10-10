"use client";

import { useEffect, useEffectEvent } from "react";
import Icon from "./Icon";

export default function Toast({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: "success" | "error";
  onDismiss: () => void;
}) {
  const dismiss = useEffectEvent(onDismiss);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => dismiss(), 10000);
    return () => clearTimeout(timer);
  }, [message]);
  if (!message) return null;
  return (
    <div
      className={`pointer-events-none fixed left-5 right-5 top-5 z-50 flex items-start gap-3 rounded-xl border bg-[var(--surface)] p-4 shadow-[0_8px_32px_var(--menu-shadow)] sm:bottom-6 sm:left-auto sm:right-6 sm:top-auto sm:w-96 ${tone === "error" ? "border-[var(--danger-line)] text-[var(--danger)]" : "border-[var(--field-line)] text-ink"}`}
      role={tone === "error" ? "alert" : "status"}
      aria-atomic="true"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {tone === "error" ? "Something needs attention" : "All set"}
        </p>
        <p className="mt-1 text-sm leading-6">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="pointer-events-auto grid size-9 shrink-0 place-items-center rounded-md hover:bg-[var(--blue-faint)] focus-visible:outline-2 focus-visible:outline-blue"
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
