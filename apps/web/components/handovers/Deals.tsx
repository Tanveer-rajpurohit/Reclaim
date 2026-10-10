"use client";
import { Button } from "@/components/ui/Controls";
import Link from "next/link";
import { useState } from "react";
import { effectiveDeal, formatTime, priceLabel } from "@/lib/reclaim";
import { useBoard } from "@/components/marketplace/Store";
import MaterialArt from "@/components/materials/MaterialArt";
import { Empty } from "@/components/materials/Cards";
export default function Deals({
  initialSide = "buying",
}: {
  initialSide?: string;
}) {
  const { currentUserId, state } = useBoard();
  const [side, setSide] = useState(
    initialSide === "selling" ? "selling" : "buying",
  );
  const [filter, setFilter] = useState("All");
  const deals = state.deals.filter((d) => {
    const item = state.items.find((i) => i.id === d.itemId)!;
    const event = state.events.find((e) => e.id === item.eventId)!;
    const status = effectiveDeal(d);
    return (
      (side === "buying"
        ? d.buyerId === currentUserId
        : event.ownerId === currentUserId) &&
      (filter === "All" || filter === "Closed"
        ? filter === "All" || ["Declined", "Cancelled"].includes(status)
        : status === filter)
    );
  });
  return (
    <>
      <div className="page-title pb-8 pt-12 [&_h1]:text-4xl [&_h1]:font-normal [&_h1]:tracking-tight lg:[&_h1]:text-[44px] [&>p:last-child]:mt-4 [&>p:last-child]:max-w-2xl [&>p:last-child]:leading-relaxed [&>p:last-child]:text-muted">
        <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
          FROM REQUEST TO COLLECTION
        </p>
        <h1>Your handovers.</h1>
        <p>
          Materials you’re collecting and batches you’re offering, together in
          one account.
        </p>
      </div>
      <div
        className="board-tabs mb-8 flex gap-6 overflow-x-auto border-b border-line [&_button]:whitespace-nowrap [&_button]:py-3 [&_button]:text-sm [&_button]:text-muted [&_[aria-selected=true]]:border-b-2 [&_[aria-selected=true]]:border-blue [&_[aria-selected=true]]:text-blue"
        role="tablist"
        aria-label="Buying or selling"
      >
        {["buying", "selling"].map((s) => (
          <Button
            key={s}
            role="tab"
            aria-selected={side === s}
            onClick={() => {
              setSide(s);
              setFilter("All");
            }}
          >
            {s === "buying" ? "You’re collecting" : "You’re offering"}
          </Button>
        ))}
      </div>
      <div
        className="deal-filters mb-6 flex flex-wrap gap-3 [&_button]:rounded-lg [&_button]:bg-[var(--surface-soft)] [&_button]:px-4 [&_button]:py-2 [&_button]:text-sm [&_button]:text-muted [&_[aria-pressed=true]]:bg-[var(--blue-faint)] [&_[aria-pressed=true]]:text-blue"
        role="group"
        aria-label="Handover status"
      >
        {["All", "Pending", "Accepted", "Done", "Closed"].map((f) => (
          <Button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>
      <div className="deal-list border-t border-line">
        {deals.map((d) => {
          const item = state.items.find((i) => i.id === d.itemId)!;
          const event = state.events.find((e) => e.id === item.eventId)!;
          const other = state.people.find(
            (p) => p.id === (side === "buying" ? event.ownerId : d.buyerId),
          )!;
          const status = effectiveDeal(d);
          return (
            <Link
              className="deal-row grid grid-cols-[88px_minmax(0,1fr)] items-center gap-5 border-b border-line py-6 lg:grid-cols-[140px_minmax(0,1fr)_auto] lg:gap-8 [&>.material-art]:rounded-lg [&_h2]:my-2 [&_h2]:text-2xl [&_h2]:font-normal [&_p]:text-sm [&_p]:text-muted"
              key={d.id}
              href={`/dashboard/deals/${d.id}`}
            >
              <MaterialArt art={item.art} name={item.name} image={item.image} />
              <div>
                <span
                  className={`state-label text-[11px] uppercase tracking-wide text-muted state-${status.toLowerCase()}`}
                >
                  {status}
                </span>
                <h2>{item.name}</h2>
                <p>
                  {other.name} · {event.area}
                </p>
                <span className="deal-pickup mt-2 block text-xs text-muted">
                  Pickup {formatTime(d.pickupAt)} IST
                </span>
              </div>
              <div className="deal-row-end col-start-2 flex justify-between gap-4 text-sm lg:col-start-auto lg:grid lg:gap-5 lg:text-right [&_span:last-child]:text-xs [&_span:last-child]:text-blue">
                <span>{priceLabel(item.price)}</span>
                <span>
                  {status === "Pending"
                    ? side === "selling"
                      ? "Review request ↗"
                      : "Waiting for organiser"
                    : status === "Accepted"
                      ? "Arrange handover ↗"
                      : "View record ↗"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      {!deals.length && (
        <Empty
          title={
            filter === "All"
              ? "Your next handover starts with a batch."
              : `No ${filter.toLowerCase()} handovers here.`
          }
          text={
            side === "buying"
              ? "Explore the board and request materials for your next project."
              : "Requests for your listings will appear here."
          }
          href={side === "buying" ? "/dashboard" : "/dashboard/listings"}
          label={side === "buying" ? "Explore the board" : "Your listings"}
        />
      )}
    </>
  );
}
