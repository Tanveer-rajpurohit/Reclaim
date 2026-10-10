"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Controls";
import Icon from "@/components/ui/Icon";
import { loginHref } from "@/lib/api/auth";
import { useMarketplaceUI } from "@/stores/marketplace";

export default function LoginPrompt() {
  const path = useMarketplaceUI((state) => state.loginPath);
  const dismiss = useMarketplaceUI((state) => state.dismissLogin);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (path && node && !node.open) node.showModal();
    if (!path && node?.open) node.close();
  }, [path]);
  return (
    <dialog
      ref={dialog}
      onCancel={dismiss}
      onClose={dismiss}
      aria-labelledby="login-prompt-title"
      className="m-auto w-[calc(100%-2.5rem)] max-w-md rounded-2xl border border-line bg-[var(--surface)] p-6 text-ink shadow-xl backdrop:bg-ink/40 lg:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="login-prompt-title" className="text-2xl tracking-tight">
          A quick sign in.
        </h2>
        <Button
          aria-label="Close sign in prompt"
          onClick={dismiss}
          className="grid size-10 shrink-0 place-items-center"
        >
          <Icon name="close" size={20} />
        </Button>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">
        Browse freely. Sign in to save materials, request a pickup or offer your
        own batch.
      </p>
      <Link
        href={loginHref(path || "/dashboard")}
        onClick={dismiss}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue px-4 py-2 text-sm text-[var(--surface)] hover:bg-[var(--blue-hover)]"
      >
        Sign in to continue
      </Link>
      <Button
        onClick={dismiss}
        className="mt-3 min-h-11 w-full text-sm text-blue"
      >
        Keep browsing
      </Button>
    </dialog>
  );
}
