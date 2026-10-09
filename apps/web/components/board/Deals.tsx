"use client";
import Link from "next/link";
import { useState } from "react";
import {
  demoId,
  effectiveDeal,
  formatTime,
  priceLabel,
} from "../../lib/reclaim";
import { useBoard } from "./Store";
import MaterialArt from "./MaterialArt";
import { Empty } from "./Cards";
export default function Deals({
  initialSide = "buying",
}: {
  initialSide?: string;
}) {
  const { state, now } = useBoard();
  const [side, setSide] = useState(
    initialSide === "selling" ? "selling" : "buying",
  );
  const [filter, setFilter] = useState("All");
  const deals = state.deals.filter((d) => {
    const item = state.items.find((i) => i.id === d.itemId)!;
    const event = state.events.find((e) => e.id === item.eventId)!;
    const status = effectiveDeal(d, event, now);
    return (
      (side === "buying" ? d.buyerId === demoId : event.ownerId === demoId) &&
      (filter === "All" || filter === "Closed"
        ? filter === "All" ||
          ["Declined", "Cancelled", "Expired"].includes(status)
        : status === filter)
    );
  });
  return (
    <>
      <div className="page-title">
        <p className="board-eyebrow">FROM REQUEST TO COLLECTION</p>
        <h1>Your handovers.</h1>
        <p>
          Materials you’re collecting and batches you’re offering, together in
          one account.
        </p>
      </div>
      <div className="board-tabs" role="tablist" aria-label="Buying or selling">
        {["buying", "selling"].map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={side === s}
            onClick={() => {
              setSide(s);
              setFilter("All");
            }}
          >
            {s === "buying" ? "You’re collecting" : "You’re offering"}
          </button>
        ))}
      </div>
      <div className="deal-filters" role="group" aria-label="Handover status">
        {["All", "Pending", "Accepted", "Done", "Closed"].map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="deal-list">
        {deals.map((d) => {
          const item = state.items.find((i) => i.id === d.itemId)!;
          const event = state.events.find((e) => e.id === item.eventId)!;
          const other = state.people.find(
            (p) => p.id === (side === "buying" ? event.ownerId : d.buyerId),
          )!;
          const status = effectiveDeal(d, event, now);
          return (
            <Link className="deal-row" key={d.id} href={`/board/deals/${d.id}`}>
              <MaterialArt art={item.art} name={item.name} image={item.image} />
              <div>
                <span className={`state-label state-${status.toLowerCase()}`}>
                  {status}
                </span>
                <h2>{item.name}</h2>
                <p>
                  {other.name} · {event.area}
                </p>
                <span className="deal-pickup">
                  Pickup {formatTime(d.pickupAt)} IST
                </span>
              </div>
              <div className="deal-row-end">
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
          href={side === "buying" ? "/board" : "/board/listings"}
          label={side === "buying" ? "Explore the board" : "Your listings"}
        />
      )}
    </>
  );
}
