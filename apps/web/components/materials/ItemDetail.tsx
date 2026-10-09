"use client";
import { Button, Input, Textarea } from "@/components/ui/Controls";
import Link from "next/link";
import type { MaterialDetailProps } from "@/types/materials/type";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useBoard } from "@/components/marketplace/Store";
import PhotoGallery from "@/components/materials/PhotoGallery";
import { Empty, ItemCard } from "@/components/materials/Cards";
import { demoId, formatTime, itemStatus, priceLabel } from "@/lib/reclaim";
export default function ItemDetail({ id }: MaterialDetailProps) {
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
        href="/dashboard"
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
      router.push("/dashboard/deals?side=buying");
  }
  return (
    <>
      <Link
        className="board-back my-8 inline-flex min-h-10 items-center text-sm text-muted"
        href="/dashboard"
      >
        ← All materials
      </Link>
      <div className="item-detail grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <PhotoGallery
            image={item.image}
            images={item.images}
            art={item.art}
            name={item.name}
            onChange={
              own && status === "Available"
                ? (image, images) =>
                    run({ type: "photos", itemId: id, image, images })
                : undefined
            }
          />
          <p className="art-caption mt-4 text-xs leading-relaxed text-muted">
            {item.image === "demo"
              ? "Demo illustration · inspect the batch at pickup"
              : "Organiser photo"}
          </p>
        </div>
        <div className="item-detail-copy min-w-0 [&_h1]:mb-4 [&_h1]:text-4xl [&_h1]:font-normal [&_h1]:tracking-tight lg:[&_h1]:text-[44px] [&>p]:leading-relaxed">
          <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
            {item.category} / {item.purpose} / {status}
          </p>
          <h1>{item.name}</h1>
          <p className="detail-price mb-6 text-2xl [&_span]:ml-3 [&_span]:text-sm [&_span]:text-muted">
            {priceLabel(item.price)} <span>for the whole batch</span>
          </p>
          <p>{item.description}</p>
          <dl className="detail-facts my-6 [&>div]:flex [&>div]:justify-between [&>div]:gap-6 [&>div]:border-b [&>div]:border-line [&>div]:py-3 [&>div]:text-sm [&_dt]:text-muted [&_dd]:text-right">
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
          <div className="detail-note rounded-xl bg-[var(--surface-soft)] p-5 text-sm leading-relaxed [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-normal [&_p+p]:mt-2">
            <h3>Before you collect</h3>
            <p>{event.pickupNote}</p>
            <p>{event.deliveryNote}</p>
            <p>{item.hazards}</p>
          </div>
          <div className="seller-line my-6 flex items-center gap-3 text-sm [&_strong]:font-normal [&_p]:text-xs [&_p]:text-muted">
            <span className="board-avatar grid size-9 shrink-0 place-items-center rounded-full bg-[var(--blue-faint)] text-sm text-blue">
              {seller.name[0]}
            </span>
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
            <Link
              className="board-button inline-flex min-h-11 items-center justify-center gap-6 rounded-lg bg-blue px-4 py-3 text-sm font-normal text-[var(--surface)] hover:bg-[var(--blue-hover)] disabled:bg-[var(--blue-faint)] disabled:text-muted"
              href="/dashboard/listings"
            >
              Manage your listing
            </Link>
          ) : active ? (
            <Link
              className="board-button inline-flex min-h-11 items-center justify-center gap-6 rounded-lg bg-blue px-4 py-3 text-sm font-normal text-[var(--surface)] hover:bg-[var(--blue-hover)] disabled:bg-[var(--blue-faint)] disabled:text-muted"
              href={`/dashboard/deals/${active.id}`}
            >
              View your {active.status.toLowerCase()} request ↗
            </Link>
          ) : status !== "Available" || event.availableFrom > now ? (
            <p className="detail-note rounded-xl bg-[var(--surface-soft)] p-5 text-sm leading-relaxed [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-normal [&_p+p]:mt-2">
              {status === "Available"
                ? "This pickup window hasn’t started yet."
                : `This batch is ${status.toLowerCase()}.`}
            </p>
          ) : (
            <form
              className="board-form grid gap-6 request-form border-t border-line pt-6"
              onSubmit={request}
            >
              <label className="grid gap-2 text-sm leading-relaxed text-ink">
                Preferred pickup (IST)
                <Input
                  type="datetime-local"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm leading-relaxed text-ink">
                Note to the organiser
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                  placeholder="Transport, intended use or a pickup question"
                  rows={2}
                />
              </label>
              <Button variant="primary" type="submit">
                {item.price ? "Buy" : "Get this"} <span>↗</span>
              </Button>
              <p className="form-hint text-sm leading-relaxed text-muted">
                A request comes first. Contact is shared after acceptance.
                Payment, if any, is arranged directly.
              </p>
            </form>
          )}
        </div>
      </div>
      <div className="board-section-head my-6 flex items-start justify-between gap-6 [&_h2]:text-2xl [&_h2]:font-normal [&_h2_span]:text-muted lg:[&_h2]:text-[28px] [&_h2_span]:block lg:[&_h2_span]:inline [&_span:last-child]:text-muted">
        <h2>From the same event.</h2>
      </div>
      <div className="board-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
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
