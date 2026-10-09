"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useBoard } from "./Store";
import { demoId } from "../../lib/reclaim";

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { ready, state, error, clearError } = useBoard();
  const count = state.notices.filter(
    (n) => n.personId === demoId && !n.read,
  ).length;
  const links = [
    ["/board", "Discover"],
    ["/board/listings", "Your listings"],
    ["/board/deals", "Handovers"],
    ["/board/saved", "Saved"],
  ] as const;
  return (
    <div className="board-app">
      <a className="skip-link" href="#board-content">
        Skip to content
      </a>
      <header className="board-header">
        <Link
          href="/board"
          className="board-brand"
          aria-label="Reclaim material board"
        >
          <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
            <path
              d="M4 2h8l4 6 4-6h8l2 2v8l-6 4 6 4v8l-2 2h-8l-4-6-4 6H4l-2-2v-8l6-4-6-4V4l2-2Z M16 10l-5 6 5 6 5-6-5-6Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
          reclaim
        </Link>
        <nav aria-label="Board navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                path === href || (href !== "/board" && path.startsWith(href))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="board-header-actions">
          <Link className="board-add" href="/board/listings/new">
            List materials <span aria-hidden="true">+</span>
          </Link>
          <Link
            className="board-notices"
            href="/board/notifications"
            aria-label={`Activity, ${count} unread`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {count > 0 && <span className="notice-dot" />}
          </Link>
          <Link
            className="board-avatar"
            href="/board/profile"
            aria-label="Your profile"
          >
            {state.people[0]?.name.slice(0, 1) || "A"}
          </Link>
        </div>
      </header>
      <div className="board-demo-strip">
        <span>LOCAL DEMO</span>
        <p>Sample materials. Your changes stay in this browser.</p>
        <Link href="/board/impact">Handover record ↗</Link>
      </div>
      <main id="board-content" className="board-content">
        {error && (
          <div className="board-alert" role="alert">
            <p>{error}</p>
            <button onClick={clearError} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}
        {ready ? (
          children
        ) : (
          <div className="board-loading" role="status">
            Opening the material board…
          </div>
        )}
      </main>
      <footer className="board-footer">
        <Link href="/">Reclaim</Link>
        <span>One account. Offer a batch or find your next one.</span>
        <Link href="/board/profile">Your account ↗</Link>
      </footer>
    </div>
  );
}
