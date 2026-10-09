"use client";
import { Button } from "@/components/ui/Controls";
import Link from "next/link";
import type { HandoverDetailProps } from "@/types/handovers/type";
import { useBoard } from "@/components/marketplace/Store";
import MaterialArt from "@/components/materials/MaterialArt";
import { Empty } from "@/components/materials/Cards";
import { demoId, effectiveDeal, formatTime, priceLabel } from "@/lib/reclaim";
export default function DealDetail({ id }: HandoverDetailProps) {
  const { state, now, run } = useBoard();
  const deal = state.deals.find((d) => d.id === id);
  const item = state.items.find((i) => i.id === deal?.itemId);
  const event = state.events.find((e) => e.id === item?.eventId);
  if (
    !deal ||
    !item ||
    !event ||
    (deal.buyerId !== demoId && event.ownerId !== demoId)
  )
    return (
      <Empty
        title="Handover not found."
        text="Only the two participants can view this record."
        href="/dashboard/deals"
        label="Your handovers"
      />
    );
  const seller = event.ownerId === demoId;
  const otherId = seller ? deal.buyerId : event.ownerId;
  const other = state.people.find((p) => p.id === otherId)!;
  const status = effectiveDeal(deal, event, now);
  const ownConfirmed = seller ? deal.sellerConfirmed : deal.buyerConfirmed;
  const otherConfirmed = seller ? deal.buyerConfirmed : deal.sellerConfirmed;
  const contactVisible =
    status === "Accepted" ||
    (status === "Done" && now - deal.updatedAt < 30 * 86_400_000);
  return (
    <>
      <Link
        className="board-back my-8 inline-flex min-h-10 items-center text-sm text-muted"
        href={`/dashboard/deals?side=${seller ? "selling" : "buying"}`}
      >
        ← Your handovers
      </Link>
      <div className="page-title pb-8 pt-12 [&_h1]:text-4xl [&_h1]:font-normal [&_h1]:tracking-tight lg:[&_h1]:text-[44px] [&>p:last-child]:mt-4 [&>p:last-child]:max-w-2xl [&>p:last-child]:leading-relaxed [&>p:last-child]:text-muted">
        <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
          {seller ? "YOU’RE OFFERING" : "YOU’RE COLLECTING"} /{" "}
          {status.toUpperCase()}
        </p>
        <h1>{item.name}</h1>
        <p>
          {seller ? "Requested by" : "Offered by"} {other.name}. {item.quantity}{" "}
          {item.unit} · {priceLabel(item.price)}.
        </p>
      </div>
      <div className="handover-layout grid items-start gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        <div>
          <div className="handover-summary mb-6 grid grid-cols-[96px_minmax(0,1fr)] items-center gap-5 lg:grid-cols-[140px_minmax(0,1fr)] lg:gap-6 [&>.material-art]:rounded-lg [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-normal [&_p]:mt-1 [&_p]:text-sm [&_p]:text-muted [&_a]:mt-3 [&_a]:inline-block [&_a]:text-sm [&_a]:text-blue">
            <MaterialArt art={item.art} name={item.name} image={item.image} />
            <div>
              <h2>{event.name}</h2>
              <p>{event.area}</p>
              <p>Pickup {formatTime(deal.pickupAt)} IST</p>
              <Link href={`/dashboard/items/${item.id}`}>View batch ↗</Link>
            </div>
          </div>
          <section className="handover-panel mb-6 rounded-xl border border-line p-5 lg:p-7 [&_h2]:mb-5 [&_h2]:text-2xl [&_h2]:font-normal [&>p]:mb-3 [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-muted">
            <h2>The pickup</h2>
            <p>{event.pickupNote}</p>
            <p>{event.deliveryNote}</p>
            {deal.note && (
              <div className="request-note my-6 rounded-lg bg-[var(--blue-faint)] p-5 text-sm leading-relaxed [&_span]:mb-2 [&_span]:block [&_span]:text-xs [&_span]:text-muted">
                <span>Buyer’s note</span>
                <p>{deal.note}</p>
              </div>
            )}
            <p className="form-hint text-sm leading-relaxed text-muted">
              Meet at the venue in daylight. Bring a friend for heavy pickups.
              Agree on any payment directly; Reclaim doesn’t collect it.
            </p>
          </section>
          <section className="handover-panel mb-6 rounded-xl border border-line p-5 lg:p-7 [&_h2]:mb-5 [&_h2]:text-2xl [&_h2]:font-normal [&>p]:mb-3 [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-muted">
            <h2>
              {contactVisible
                ? "Your pickup contact"
                : "Contact after acceptance"}
            </h2>
            {contactVisible ? (
              <>
                <p>{other.name}</p>
                <p className="contact-phone text-2xl! text-blue!">
                  +91 {other.phone.replace(/^\+91/, "")}
                </p>
                <p className="form-hint text-sm leading-relaxed text-muted">
                  Illustrative demo number. No calls or messages are sent.
                </p>
              </>
            ) : (
              <p>
                Contact is private until the organiser accepts. It is hidden
                again if the handover closes without collection.
              </p>
            )}
          </section>
        </div>
        <div>
          <section className="handover-panel mb-6 rounded-xl border border-line p-5 lg:p-7 [&_h2]:mb-5 [&_h2]:text-2xl [&_h2]:font-normal [&>p]:mb-3 [&>p]:text-sm [&>p]:leading-relaxed [&>p]:text-muted progress-panel">
            <h2>Handover progress</h2>
            <ol className="handover-steps my-7 list-none p-0 [&_li]:relative [&_li]:flex [&_li]:gap-4 [&_li]:pb-7 [&_li:last-child]:pb-0 [&_li>span]:mt-1.5 [&_li>span]:size-2.5 [&_li>span]:shrink-0 [&_li>span]:rounded-full [&_li>span]:border [&_li>span]:border-[var(--field-line)] [&_.complete>span]:border-blue [&_.complete>span]:bg-blue [&_strong]:text-sm [&_strong]:font-normal [&_p]:mt-2 [&_p]:text-xs [&_p]:leading-relaxed [&_p]:text-muted">
              <li className="complete">
                <span />{" "}
                <div>
                  <strong>Request sent</strong>
                  <p>{formatTime(deal.createdAt)} IST</p>
                </div>
              </li>
              <li
                className={
                  ["Accepted", "Done"].includes(status) ? "complete" : ""
                }
              >
                <span />
                <div>
                  <strong>Organiser accepts</strong>
                  <p>
                    {["Accepted", "Done"].includes(status)
                      ? "Batch reserved. Pickup can be arranged."
                      : "Waiting for a response."}
                  </p>
                </div>
              </li>
              <li className={status === "Done" ? "complete" : ""}>
                <span />
                <div>
                  <strong>Both confirm collection</strong>
                  <p>
                    {status === "Done"
                      ? `Completed ${formatTime(deal.updatedAt)} IST`
                      : status === "Accepted"
                        ? `${deal.sellerConfirmed ? "Organiser confirmed" : "Organiser pending"} · ${deal.buyerConfirmed ? "Buyer confirmed" : "Buyer pending"}`
                        : "Only a confirmed handover counts."}
                  </p>
                </div>
              </li>
            </ol>
            {deal.reason && (
              <p className="closed-reason rounded-lg bg-[var(--surface-soft)] p-4">
                {deal.reason}
              </p>
            )}
            <div className="handover-actions grid gap-3">
              {status === "Pending" && seller && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => run({ type: "accept", dealId: id })}
                  >
                    Accept pickup request
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      run({
                        type: "decline",
                        dealId: id,
                        reason: "The proposed pickup is not suitable.",
                      })
                    }
                  >
                    Decline request
                  </Button>
                </>
              )}
              {status === "Pending" && !seller && (
                <Button
                  variant="secondary"
                  onClick={() => run({ type: "cancel", dealId: id })}
                >
                  Cancel request
                </Button>
              )}
              {status === "Accepted" && (
                <>
                  <Button
                    variant="primary"
                    disabled={ownConfirmed}
                    onClick={() => run({ type: "confirm", dealId: id })}
                  >
                    {ownConfirmed
                      ? "Waiting for the other confirmation"
                      : "Confirm I handed over / collected"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => run({ type: "cancel", dealId: id })}
                  >
                    This did not happen
                  </Button>
                </>
              )}
              {status === "Done" && (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--field-line)] px-4 py-3 text-sm text-blue hover:bg-[var(--blue-faint)]"
                  href="/dashboard/impact"
                >
                  View handover record ↗
                </Link>
              )}
            </div>
          </section>
          {((status === "Pending" && !seller) ||
            (status === "Accepted" && !otherConfirmed)) && (
            <div className="simulation-panel px-1 py-2 text-sm leading-relaxed text-muted [&_button]:mt-3">
              <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
                DEMO WALKTHROUGH
              </p>
              <p>
                Try the other participant’s step on this browser. This does not
                represent a live response.
              </p>
              <Button
                className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
                onClick={() =>
                  run(
                    {
                      type: status === "Pending" ? "accept" : "confirm",
                      dealId: id,
                    },
                    otherId,
                  )
                }
              >
                {status === "Pending"
                  ? "Simulate organiser acceptance"
                  : "Simulate other confirmation"}{" "}
                ↗
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
