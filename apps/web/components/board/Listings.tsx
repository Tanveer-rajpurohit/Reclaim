"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useBoard } from "./Store";
import MaterialArt from "./MaterialArt";
import { Empty } from "./Cards";
import {
  demoId,
  effectiveDeal,
  formatTime,
  itemStatus,
  priceLabel,
  type Item,
} from "../../lib/reclaim";
function EditItem({ item, close }: { item: Item; close: () => void }) {
  const { run } = useBoard();
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (run({ type: "edit", itemId: item.id, name, price })) close();
  }
  return (
    <form className="board-form listing-edit" onSubmit={submit}>
      <label>
        Item name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          maxLength={80}
        />
      </label>
      <label>
        Price (₹)
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          required
          min={0}
          max={1_000_000}
        />
      </label>
      <div className="row-actions">
        <button className="board-button" type="submit">
          Save changes
        </button>
        <button
          className="board-button secondary"
          type="button"
          onClick={close}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
export default function Listings() {
  const { state, now, run } = useBoard();
  const [edit, setEdit] = useState("");
  return (
    <>
      <div className="page-title page-title-row">
        <div>
          <p className="board-eyebrow">WHAT YOU’RE OFFERING</p>
          <h1>Your listings.</h1>
          <p>
            Keep the pickup clear. Choose a request. Give the batch a next use.
          </p>
        </div>
        <Link className="board-button" href="/board/listings/new">
          List materials +
        </Link>
      </div>
      {state.events
        .filter((e) => e.ownerId === demoId)
        .map((event) => (
          <section className="listing-event" key={event.id}>
            <div className="event-heading">
              <div>
                <h2>{event.name}</h2>
                <p>
                  {event.area} · Clear by {formatTime(event.clearBy)} IST
                </p>
              </div>
              <button
                className="text-button"
                onClick={() =>
                  run({
                    type: "extend",
                    eventId: event.id,
                    clearBy: Math.max(now, event.clearBy) + 86_400_000,
                  })
                }
              >
                Extend window by 1 day ↗
              </button>
            </div>
            {state.items
              .filter((i) => i.eventId === event.id)
              .map((item) => {
                const pending = state.deals.filter(
                  (d) =>
                    d.itemId === item.id &&
                    effectiveDeal(d, event, now) === "Pending",
                );
                const status = itemStatus(item, event, now);
                return (
                  <div className="listing-row" key={item.id}>
                    <Link
                      className="listing-thumb"
                      href={`/board/items/${item.id}`}
                    >
                      <MaterialArt
                        art={item.art}
                        name={item.name}
                        image={item.image}
                      />
                    </Link>
                    <div className="listing-info">
                      <span
                        className={`state-label state-${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                      <h3>
                        <Link href={`/board/items/${item.id}`}>
                          {item.name}
                        </Link>
                      </h3>
                      <p>
                        {item.quantity} {item.unit} · {priceLabel(item.price)}
                      </p>
                      {pending.length > 0 && (
                        <Link
                          className="request-link"
                          href="/board/deals?side=selling"
                        >
                          {pending.length} pickup{" "}
                          {pending.length === 1 ? "request" : "requests"} ↗
                        </Link>
                      )}
                      {edit === item.id && (
                        <EditItem item={item} close={() => setEdit("")} />
                      )}
                    </div>
                    <div className="row-actions">
                      {status === "Available" && (
                        <button
                          className="text-button"
                          onClick={() =>
                            setEdit(edit === item.id ? "" : item.id)
                          }
                        >
                          Edit
                        </button>
                      )}
                      {!["Done", "Withdrawn"].includes(status) && (
                        <button
                          className="text-button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Withdraw this listing and close its open requests?",
                              )
                            )
                              run({ type: "withdraw", itemId: item.id });
                          }}
                        >
                          Withdraw
                        </button>
                      )}
                      <Link
                        href={`/board/items/${item.id}`}
                        className="text-button"
                      >
                        View ↗
                      </Link>
                    </div>
                  </div>
                );
              })}
          </section>
        ))}
      {!state.events.some((e) => e.ownerId === demoId) && (
        <Empty
          title="Your first batch belongs here."
          text="List a few materials from an event and arrange their next handover."
          href="/board/listings/new"
          label="List materials"
        />
      )}
    </>
  );
}
