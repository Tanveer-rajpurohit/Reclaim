"use client";
import { Button } from "@/components/ui/Controls";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import BrandMark from "@/components/ui/BrandMark";
import PageMotion from "@/components/ui/PageMotion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useBoard } from "@/components/marketplace/Store";
import AccountGate from "./AccountGate";
import LoginPrompt from "./LoginPrompt";
import { loginHref } from "@/lib/api/auth";

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { currentUserId, ready, state, error, clearError } = useBoard();
  const count = state.notices.filter(
    (n) => n.personId === currentUserId && !n.read,
  ).length;
  const links = [
    ["/dashboard", "Discover"],
    ["/dashboard/listings", "Your listings"],
    ["/dashboard/deals", "Handovers"],
    ["/dashboard/saved", "Saved"],
  ] as const;
  return (
    <div className="board-app min-h-dvh bg-[var(--surface)] font-sans text-base leading-relaxed text-ink [&_p]:break-words [&_dd]:break-words [&_a]:break-words">
      <a className="skip-link" href="#board-content">
        Skip to content
      </a>
      <header className="board-header flex min-h-20 flex-wrap items-center gap-4 border-b border-line bg-[var(--surface)] px-5 py-4 lg:flex-nowrap lg:gap-10 lg:px-[4vw] lg:py-5 [&_nav]:order-3 [&_nav]:flex [&_nav]:w-full [&_nav]:justify-between [&_nav]:gap-4 [&_nav]:text-sm lg:[&_nav]:order-none lg:[&_nav]:mr-auto lg:[&_nav]:w-auto lg:[&_nav]:gap-7 [&_nav_a]:py-2 [&_nav_a]:text-muted [&_nav_a[aria-current=page]]:text-ink">
        <Link
          href="/dashboard"
          className="board-brand flex items-center gap-2 text-2xl tracking-tight text-blue"
          aria-label="Reclaim material board"
        >
          <BrandMark />
          reclaim
        </Link>
        <nav aria-label="Board navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                path === href ||
                (href !== "/dashboard" && path.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="board-header-actions ml-auto flex items-center gap-3 lg:ml-0 lg:gap-5">
          <Link
            className="board-add inline-flex min-h-11 items-center gap-4 rounded-lg bg-blue px-4 py-2 text-sm text-[var(--surface)] transition-transform duration-200 hover:bg-[var(--blue-hover)] motion-safe:hover:scale-[1.02] motion-reduce:transition-none"
            href="/dashboard/listings/new"
          >
            <span className="sr-only sm:not-sr-only">List materials</span>
            <Icon name="plus" size={18} />
          </Link>
          {currentUserId ? (
            <>
              <Link
                className="board-notices relative grid size-10 place-items-center"
                href="/dashboard/notifications"
                aria-label={`Activity, ${count} unread`}
              >
                <Icon name="bell" size={20} />
                {count > 0 && (
                  <span className="notice-dot absolute right-1 top-1 size-1.5 rounded-full bg-blue" />
                )}
              </Link>
              <Link
                className="board-avatar grid size-9 shrink-0 place-items-center rounded-full bg-[var(--blue-faint)] text-sm text-blue"
                href="/dashboard/profile"
                aria-label="Your profile"
              >
                <Icon name="user" size={18} />
              </Link>
            </>
          ) : (
            <Link
              href={loginHref(path)}
              className="inline-flex min-h-11 items-center px-2 text-sm text-blue hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      <main
        id="board-content"
        className="board-content mx-auto max-w-[1600px] px-5 pb-12 lg:px-[4vw] lg:pb-16"
      >
        {error && (
          <div
            className="board-alert mt-6 flex items-center justify-between gap-6 rounded-lg bg-[var(--blue-faint)] p-4 text-sm text-blue [&_button]:size-10 [&_button]:text-2xl"
            role="alert"
          >
            <p>{error}</p>
            <Button onClick={clearError} aria-label="Dismiss message">
              ×
            </Button>
          </div>
        )}
        {ready ? (
          <AccountGate path={path} signedIn={Boolean(currentUserId)}>
            <PageMotion key={path}>{children}</PageMotion>
          </AccountGate>
        ) : (
          <div className="board-loading py-16 text-muted" role="status">
            Opening the material board…
          </div>
        )}
      </main>
      <LoginPrompt />
      {path === "/dashboard" && (
        <footer className="board-footer grid grid-cols-2 gap-8 border-t border-line bg-[var(--surface)] px-5 py-12 lg:grid-cols-[2fr_1fr_1fr] lg:gap-12 lg:px-[4vw] [&_div:first-child]:col-span-full lg:[&_div:first-child]:col-span-1 [&_h2]:mb-4 [&_h2]:text-base [&_h2]:font-normal [&_p]:mt-4 [&_p]:text-sm [&_p]:text-muted [&_div>a:not(.board-brand)]:block [&_div>a:not(.board-brand)]:py-2 [&_div>a:not(.board-brand)]:text-sm [&_div>a:not(.board-brand)]:text-muted">
          <div>
            <Link
              className="board-brand flex items-center gap-2 text-2xl tracking-tight text-blue"
              href="/"
            >
              <BrandMark /> reclaim
            </Link>
            <p>A next use for event leftovers.</p>
          </div>
          <div>
            <h2>Discover materials</h2>
            <Link href="/dashboard/listings/new">Offer a batch</Link>
            <Link href="/dashboard/saved">Saved materials</Link>
            <Link href="/dashboard/deals">Your handovers</Link>
          </div>
          <div>
            <h2>Your account</h2>
            <Link href="/dashboard/profile">Profile & interests</Link>
            <Link href="/dashboard/notifications">Activity</Link>
            <Link href="/dashboard/impact">Handover record</Link>
          </div>
        </footer>
      )}
    </div>
  );
}
