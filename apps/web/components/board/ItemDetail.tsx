"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useBoard } from "./Store";
import MaterialArt from "./MaterialArt";
import { Empty, ItemCard } from "./Cards";
import { demoId, formatTime, itemStatus, priceLabel } from "../../lib/reclaim";
export default function ItemDetail({ id }: { id: string }) {
  const { state, now, run } = useBoard();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pickup, setPickup] = useState("");
  const item = state.items.find((i) => i.id === id);
  const event = state.events.find((e) => e.id === item?.eventId);
  if (!item || !event)
    return (
      <Empty
        title="This batch isn’t here."
        text="It may have been removed from this browser’s demo."
        href="/board"
        label="Back to the board"
      />
    );
  const seller = state.people.find((p) => p.id === event.ownerId)!;
  const own = event.ownerId === demoId;
  const status = itemStatus(item, event, now);
  const active = state.deals.find(
    (d) =>
      d.itemId === id &&
      d.buyerId === demoId &&
      ["Pending", "Accepted"].includes(d.status),
  );
  function request(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      run({
        type: "request",
        itemId: id,
        pickupAt: Date.parse(pickup + "+05:30"),
        note,
      })
    )
      router.push("/board/deals?side=buying");
  }
  return (
    <>
      <Link className="board-back" href="/board">
        ← All materials
      </Link>
      <div className="item-detail">
        <div>
          <MaterialArt art={item.art} name={item.name} image={item.image} />
          <p className="art-caption">
            {item.image === "demo"
              ? "Demo illustration · inspect the batch at pickup"
              : "Organiser photo"}
          </p>
        </div>
        <div className="item-detail-copy">
          <p className="board-eyebrow">
            {item.category} / {item.purpose} / {status}
          </p>
          <h1>{item.name}</h1>
          <p className="detail-price">
            {priceLabel(item.price)} <span>for the whole batch</span>
          </p>
          <p>{item.description}</p>
          <dl className="detail-facts">
            <div>
              <dt>Quantity</dt>
              <dd>
                {item.quantity} {item.unit}
                {item.unit === "kg" && " (estimated)"}
              </dd>
            </div>
            <div>
              <dt>Condition</dt>
              <dd>{item.condition}</dd>
            </div>
            <div>
              <dt>Event</dt>
              <dd>{event.name}</dd>
            </div>
            <div>
              <dt>Locality</dt>
              <dd>{event.area}</dd>
            </div>
            <div>
              <dt>Available from</dt>
              <dd>{formatTime(event.availableFrom)} IST</dd>
            </div>
            <div>
              <dt>Clear by</dt>
              <dd>{formatTime(event.clearBy)} IST</dd>
            </div>
          </dl>
          <div className="detail-note">
            <h3>Before you collect</h3>
            <p>{event.pickupNote}</p>
            <p>{event.deliveryNote}</p>
            <p>{item.hazards}</p>
          </div>
          <div className="seller-line">
            <span className="board-avatar">{seller.name[0]}</span>
            <div>
              <strong>{seller.name}</strong>
              <p>
                {
                  state.deals.filter(
                    (d) =>
                      d.status === "Done" &&
                      state.events.find(
                        (e) =>
                          e.id ===
                          state.items.find((i) => i.id === d.itemId)?.eventId,
                      )?.ownerId === seller.id,
                  ).length
                }{" "}
                confirmed handovers
              </p>
            </div>
          </div>
          {own ? (
            <Link className="board-button" href="/board/listings">
              Manage your listing
            </Link>
          ) : active ? (
            <Link className="board-button" href={`/board/deals/${active.id}`}>
              View your {active.status.toLowerCase()} request ↗
            </Link>
          ) : status !== "Available" || event.availableFrom > now ? (
            <p className="detail-note">
              {status === "Available"
                ? "This pickup window hasn’t started yet."
                : `This batch is ${status.toLowerCase()}.`}
            </p>
          ) : (
            <form className="board-form request-form" onSubmit={request}>
              <label>
                Preferred pickup (IST)
                <input
                  type="datetime-local"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
              </label>
              <label>
                Note to the organiser
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                  placeholder="Transport, intended use or a pickup question"
                  rows={2}
                />
              </label>
              <button className="board-button" type="submit">
                {item.price ? "Buy" : "Get this"} <span>↗</span>
              </button>
              <p className="form-hint">
                A request comes first. Contact is shared after acceptance.
                Payment, if any, is arranged directly.
              </p>
            </form>
          )}
        </div>
      </div>
      <div className="board-section-head">
        <h2>From the same event.</h2>
      </div>
      <div className="board-grid">
        {state.items
          .filter(
            (i) =>
              i.id !== id &&
              i.eventId === event.id &&
              itemStatus(i, event, now) === "Available",
          )
          .slice(0, 4)
          .map((i) => (
            <ItemCard item={i} key={i.id} />
          ))}
      </div>
    </>
  );
}
