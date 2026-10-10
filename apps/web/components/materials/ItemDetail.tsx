"use client";
import { Button, Input, Textarea } from "@/components/ui/Controls";
import Link from "next/link";
import type { MaterialDetailProps } from "@/types/materials/type";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginHref } from "@/lib/api/auth";
import { useBoard } from "@/components/marketplace/Store";
import PhotoGallery from "@/components/materials/PhotoGallery";
import { Empty, ItemCard } from "@/components/materials/Cards";
import { formatEventDate, itemStatus, priceLabel } from "@/lib/reclaim";
export default function ItemDetail({ id }: MaterialDetailProps) {
  const { currentUserId, state, run, pending } = useBoard();
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pickup, setPickup] = useState("");
  const [pickupError, setPickupError] = useState("");
  const item = state.items.find((i) => i.id === id);
  const event = state.events.find((e) => e.id === item?.eventId);
  if (!item || !event)
    return (
      <Empty
        title="This batch isn’t here."
        text="It may be unavailable or no longer listed."
        href="/dashboard"
        label="Back to the board"
      />
    );
  const seller = state.people.find((p) => p.id === event.ownerId)!;
  const own = event.ownerId === currentUserId;
  const status = itemStatus(item);
  const active = state.deals.find(
    (d) =>
      d.itemId === id &&
      d.buyerId === currentUserId &&
      ["Pending", "Accepted"].includes(d.status),
  );
  async function request(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pickupAt = Date.parse(pickup + "+05:30");
    if (!Number.isFinite(pickupAt) || pickupAt < Date.now()) {
      setPickupError("Choose a future pickup time to propose to the seller.");
      return;
    }
    setPickupError("");
    if (
      await run({
        type: "request",
        itemId: id,
        pickupAt,
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
              <dt>Event or cleanup date</dt>
              <dd>{formatEventDate(event.eventAt)}</dd>
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
              <Link
                href={`/dashboard/people/${seller.id}`}
                className="text-blue hover:underline"
              >
                {seller.name}
              </Link>
              <p>{seller.offeredCount || 0} completed handovers</p>
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
          ) : status !== "Available" ? (
            <p className="detail-note rounded-xl bg-[var(--surface-soft)] p-5 text-sm leading-relaxed [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-normal [&_p+p]:mt-2">
              {`This batch is ${status.toLowerCase()}.`}
            </p>
          ) : !currentUserId ? (
            <div className="grid gap-4 border-t border-line pt-6">
              <p className="text-sm leading-7 text-muted">
                Sign in to propose a pickup. Contact details are shared after
                the seller accepts your request.
              </p>
              <Link
                href={loginHref(`/dashboard/items/${id}`)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue px-4 py-2 text-sm text-[var(--surface)] hover:bg-[var(--blue-hover)]"
              >
                Sign in to request this batch
              </Link>
            </div>
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
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setPickupError("");
                  }}
                  aria-invalid={Boolean(pickupError)}
                  aria-describedby="pickup-help"
                  required
                />
              </label>
              <p
                id="pickup-help"
                role={pickupError ? "alert" : undefined}
                className={`text-sm leading-6 ${pickupError ? "text-[var(--danger)]" : "text-muted"}`}
              >
                {pickupError ||
                  "Propose a pickup time. The seller reviews it before accepting. The event date does not set a deadline."}
              </p>
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
              <Button variant="primary" type="submit" disabled={pending}>
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
              itemStatus(i) === "Available",
          )
          .slice(0, 4)
          .map((i) => (
            <ItemCard item={i} key={i.id} />
          ))}
      </div>
    </>
  );
}
