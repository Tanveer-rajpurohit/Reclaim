"use client";
import Link from "next/link";
import { participantHistory } from "@/lib/records";
import { formatTime } from "@/lib/reclaim";
import { useBoard } from "@/components/marketplace/Store";
import { Empty } from "@/components/materials/Cards";
export function Impact() {
  const { currentUserId, state } = useBoard();
  const history = participantHistory(state, currentUserId || "");
  const done = history.map((record) => record.deal);
  const transferred = history.map((record) => record.item);
  const kg = transferred
    .filter((item) => item.unit === "kg")
    .reduce((sum, item) => sum + item.quantity, 0);
  const given = history.filter((record) => record.role === "offered").length;
  return (
    <>
      <div className="page-title pb-8 pt-12 [&_h1]:text-4xl [&_h1]:font-normal [&_h1]:tracking-tight lg:[&_h1]:text-[44px] [&>p:last-child]:mt-4 [&>p:last-child]:max-w-2xl [&>p:last-child]:leading-relaxed [&>p:last-child]:text-muted">
        <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
          COMPLETED HANDOVERS
        </p>
        <h1>A record of what changed hands.</h1>
        <p>
          Count the handovers that happened. Keep estimates separate from
          measured outcomes.
        </p>
      </div>
      <div className="impact-summary grid grid-cols-2 gap-6 border-y border-line py-8 lg:grid-cols-4 lg:gap-8 [&_span]:text-5xl [&_span]:font-light [&_span]:tracking-tight [&_span]:text-blue [&_small]:text-xl [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted">
        <div>
          <span>{transferred.length}</span>
          <p>Listings handed over</p>
        </div>
        <div>
          <span>{given}</span>
          <p>Your completed handovers</p>
        </div>
        <div>
          <span>{done.length - given}</span>
          <p>Your completed collections</p>
        </div>
        <div>
          <span>
            {kg.toLocaleString("en-IN")} <small>kg</small>
          </span>
          <p>Estimated weight, kg listings only</p>
        </div>
      </div>
      <div className="impact-explanation max-w-3xl py-10 [&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:font-normal [&_p]:leading-7 [&_p]:text-muted">
        <h2>A transfer is the outcome we can record.</h2>
        <p>
          Only handovers marked complete by the seller count. Pieces and bundles
          are never converted into kilograms. These records describe material
          transfers; recycling and avoided emissions are not verified.
        </p>
      </div>
      {done.length ? (
        <div className="transfer-list [&_a]:flex [&_a]:flex-wrap [&_a]:justify-between [&_a]:gap-6 [&_a]:border-t [&_a]:border-line [&_a]:py-6 [&_a]:text-sm [&_strong]:font-normal [&_time]:text-xs [&_time]:text-muted">
          {done.map((d) => {
            const i = state.items.find((i) => i.id === d.itemId)!;
            return (
              <Link href={`/dashboard/deals/${d.id}`} key={d.id}>
                <strong>{i.name}</strong>
                <span>
                  {i.quantity} {i.unit}
                  {i.unit === "kg" ? " (estimated)" : ""}
                </span>
                <time>{formatTime(d.updatedAt)} IST</time>
                <span>View ↗</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty
          title="The first completed handover belongs here."
          text="The seller marks the handover complete after pickup. Both participants keep the same record."
          href="/dashboard/deals?side=selling"
          label="Review your handovers"
        />
      )}
    </>
  );
}
