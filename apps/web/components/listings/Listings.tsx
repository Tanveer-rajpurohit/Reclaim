"use client";
import { Button } from "@/components/ui/Controls";
import Link from "next/link";
import EditItem from "./EditItem";
import { activeListingsFor } from "@/lib/records";
import { useState } from "react";
import { useBoard } from "@/components/marketplace/Store";
import MaterialArt from "@/components/materials/MaterialArt";
import { Empty } from "@/components/materials/Cards";
import {
  demoId,
  effectiveDeal,
  formatEventDate,
  itemStatus,
  priceLabel,
} from "@/lib/reclaim";
export default function Listings() {
  const { state, run } = useBoard();
  const activeItems = activeListingsFor(state, demoId);
  const [edit, setEdit] = useState("");
  return (
    <>
      <div className="page-title pb-8 pt-12 [&_h1]:text-4xl [&_h1]:font-normal [&_h1]:tracking-tight lg:[&_h1]:text-[44px] [&>p:last-child]:mt-4 [&>p:last-child]:max-w-2xl [&>p:last-child]:leading-relaxed [&>p:last-child]:text-muted page-title-row flex flex-wrap items-start justify-between gap-6 lg:items-center [&>div>p:last-child]:mt-4 [&>div>p:last-child]:max-w-2xl [&>div>p:last-child]:leading-relaxed [&>div>p:last-child]:text-muted">
        <div>
          <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
            WHAT YOU’RE OFFERING
          </p>
          <h1>Your listings.</h1>
          <p>
            Review incoming requests, arrange pickup and mark each handover
            complete.
          </p>
        </div>
        <Link
          className="board-button inline-flex min-h-11 items-center justify-center gap-6 rounded-lg bg-blue px-4 py-3 text-sm font-normal text-[var(--surface)] hover:bg-[var(--blue-hover)] disabled:bg-[var(--blue-faint)] disabled:text-muted"
          href="/dashboard/listings/new"
        >
          List materials +
        </Link>
      </div>
      {state.events
        .filter(
          (e) =>
            e.ownerId === demoId &&
            activeItems.some((item) => item.eventId === e.id),
        )
        .map((event) => (
          <section
            className="listing-event mb-12 border-t border-line"
            key={event.id}
          >
            <div className="event-heading flex flex-col items-start justify-between gap-3 py-6 lg:flex-row lg:items-center lg:gap-6 [&_h2]:text-2xl [&_h2]:font-normal [&_p]:mt-2 [&_p]:text-sm [&_p]:text-muted">
              <div>
                <h2>{event.name}</h2>
                <p>
                  {event.area} · Event or cleanup date{" "}
                  {formatEventDate(event.eventAt)}
                </p>
              </div>
            </div>
            {activeItems
              .filter((i) => i.eventId === event.id)
              .map((item) => {
                const pending = state.deals.filter(
                  (d) => d.itemId === item.id && effectiveDeal(d) === "Pending",
                );
                const status = itemStatus(item);
                return (
                  <div
                    className="listing-row grid grid-cols-[96px_minmax(0,1fr)] items-start gap-5 border-t border-line py-6 lg:grid-cols-[160px_minmax(0,1fr)_auto] lg:items-center lg:gap-8"
                    key={item.id}
                  >
                    <Link
                      className="listing-thumb block overflow-hidden rounded-lg"
                      href={`/dashboard/items/${item.id}`}
                    >
                      <MaterialArt
                        art={item.art}
                        name={item.name}
                        image={item.image}
                      />
                    </Link>
                    <div className="listing-info min-w-0 [&_h3]:my-2 [&_h3]:text-xl [&_h3]:font-normal lg:[&_h3]:text-2xl [&>p]:text-sm [&>p]:text-muted">
                      <span
                        className={`state-label text-[11px] uppercase tracking-wide text-muted state-${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                      <h3>
                        <Link href={`/dashboard/items/${item.id}`}>
                          {item.name}
                        </Link>
                      </h3>
                      <p>
                        {item.quantity} {item.unit} · {priceLabel(item.price)}
                      </p>
                      {pending.length > 0 && (
                        <Link
                          className="request-link mt-3 inline-block py-1 text-sm text-blue"
                          href="/dashboard/deals?side=selling"
                        >
                          {pending.length} pickup{" "}
                          {pending.length === 1 ? "request" : "requests"} ↗
                        </Link>
                      )}
                      {edit === item.id && (
                        <EditItem item={item} close={() => setEdit("")} />
                      )}
                    </div>
                    <div className="row-actions col-start-2 flex flex-wrap items-center gap-4 lg:col-start-auto lg:gap-5">
                      {status === "Available" && (
                        <Button
                          className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
                          onClick={() =>
                            setEdit(edit === item.id ? "" : item.id)
                          }
                        >
                          Edit
                        </Button>
                      )}
                      {!["Done", "Withdrawn"].includes(status) && (
                        <Button
                          className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
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
                        </Button>
                      )}
                      <Link
                        href={`/dashboard/items/${item.id}`}
                        className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
                      >
                        View ↗
                      </Link>
                    </div>
                  </div>
                );
              })}
          </section>
        ))}
      {!activeItems.length && (
        <Empty
          title="No active listings right now."
          text="List a few materials from an event and arrange their next handover."
          href="/dashboard/listings/new"
          label="List materials"
        />
      )}
    </>
  );
}
