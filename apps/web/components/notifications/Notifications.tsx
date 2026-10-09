"use client";
import { Button } from "@/components/ui/Controls";
import Link from "next/link";
import { demoId, formatTime } from "@/lib/reclaim";
import { useBoard } from "@/components/marketplace/Store";
import { Empty } from "@/components/materials/Cards";
export function Notifications() {
  const { state, run } = useBoard();
  const notices = state.notices.filter((n) => n.personId === demoId);
  return (
    <>
      <div className="page-title pb-8 pt-12 [&_h1]:text-4xl [&_h1]:font-normal [&_h1]:tracking-tight lg:[&_h1]:text-[44px] [&>p:last-child]:mt-4 [&>p:last-child]:max-w-2xl [&>p:last-child]:leading-relaxed [&>p:last-child]:text-muted page-title-row flex flex-wrap items-start justify-between gap-6 lg:items-center [&>div>p:last-child]:mt-4 [&>div>p:last-child]:max-w-2xl [&>div>p:last-child]:leading-relaxed [&>div>p:last-child]:text-muted">
        <div>
          <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
            REQUESTS &amp; UPDATES
          </p>
          <h1>Your activity.</h1>
          <p>Pickup requests, decisions and completed handovers.</p>
        </div>
        <Button
          className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
          onClick={() => run({ type: "read" })}
        >
          Mark all as read
        </Button>
      </div>
      <div className="notification-list border-t border-line">
        {notices.map((n) => (
          <article
            className={`activity-row flex flex-wrap items-start gap-4 border-b border-line py-7 [&>div]:min-w-0 [&>div]:flex-1 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-normal [&_p]:text-sm [&_p]:text-muted [&_time]:mt-3 [&_time]:block [&_time]:text-xs [&_time]:text-muted ${n.read ? "read" : ""}`}
            key={n.id}
          >
            <span
              className={`activity-indicator mt-2 size-1.5 shrink-0 rounded-full ${n.read ? "bg-[var(--field-line)]" : "bg-blue"}`}
            />
            <div>
              <h2>
                <Link
                  href={n.href}
                  onClick={() => run({ type: "read", noticeId: n.id })}
                >
                  {n.title}
                </Link>
              </h2>
              <p>{n.detail}</p>
              <time dateTime={new Date(n.at).toISOString()}>
                {formatTime(n.at)} IST
              </time>
            </div>
            {!n.read && (
              <Button
                className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
                onClick={() => run({ type: "read", noticeId: n.id })}
              >
                Mark read
              </Button>
            )}
          </article>
        ))}
      </div>
      {!notices.length && (
        <Empty
          title="You’re up to date."
          text="New requests and handover updates will appear here."
        />
      )}
    </>
  );
}
