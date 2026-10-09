"use client";
import Link from "next/link";
import { useBoard } from "./Store";
import MaterialArt from "./MaterialArt";
import { Empty } from "./Cards";
import {
  demoId,
  effectiveDeal,
  formatTime,
  priceLabel,
} from "../../lib/reclaim";
export default function DealDetail({ id }: { id: string }) {
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
        href="/board/deals"
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
        className="board-back"
        href={`/board/deals?side=${seller ? "selling" : "buying"}`}
      >
        ← Your handovers
      </Link>
      <div className="page-title">
        <p className="board-eyebrow">
          {seller ? "YOU’RE OFFERING" : "YOU’RE COLLECTING"} /{" "}
          {status.toUpperCase()}
        </p>
        <h1>{item.name}</h1>
        <p>
          {seller ? "Requested by" : "Offered by"} {other.name}. {item.quantity}{" "}
          {item.unit} · {priceLabel(item.price)}.
        </p>
      </div>
      <div className="handover-layout">
        <div>
          <div className="handover-summary">
            <MaterialArt art={item.art} name={item.name} image={item.image} />
            <div>
              <h2>{event.name}</h2>
              <p>{event.area}</p>
              <p>Pickup {formatTime(deal.pickupAt)} IST</p>
              <Link href={`/board/items/${item.id}`}>View batch ↗</Link>
            </div>
          </div>
          <section className="handover-panel">
            <h2>The pickup</h2>
            <p>{event.pickupNote}</p>
            <p>{event.deliveryNote}</p>
            {deal.note && (
              <div className="request-note">
                <span>Buyer’s note</span>
                <p>{deal.note}</p>
              </div>
            )}
            <p className="form-hint">
              Meet at the venue in daylight. Bring a friend for heavy pickups.
              Agree on any payment directly; Reclaim doesn’t collect it.
            </p>
          </section>
          <section className="handover-panel">
            <h2>
              {contactVisible
                ? "Your pickup contact"
                : "Contact after acceptance"}
            </h2>
            {contactVisible ? (
              <>
                <p>{other.name}</p>
                <p className="contact-phone">
                  +91 {other.phone.replace(/^\+91/, "")}
                </p>
                <p className="form-hint">
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
          <section className="handover-panel progress-panel">
            <h2>Handover progress</h2>
            <ol className="handover-steps">
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
            {deal.reason && <p className="closed-reason">{deal.reason}</p>}
            <div className="handover-actions">
              {status === "Pending" && seller && (
                <>
                  <button
                    className="board-button"
                    onClick={() => run({ type: "accept", dealId: id })}
                  >
                    Accept pickup request
                  </button>
                  <button
                    className="board-button secondary"
                    onClick={() =>
                      run({
                        type: "decline",
                        dealId: id,
                        reason: "The proposed pickup is not suitable.",
                      })
                    }
                  >
                    Decline request
                  </button>
                </>
              )}
              {status === "Pending" && !seller && (
                <button
                  className="board-button secondary"
                  onClick={() => run({ type: "cancel", dealId: id })}
                >
                  Cancel request
                </button>
              )}
              {status === "Accepted" && (
                <>
                  <button
                    className="board-button"
                    disabled={ownConfirmed}
                    onClick={() => run({ type: "confirm", dealId: id })}
                  >
                    {ownConfirmed
                      ? "Waiting for the other confirmation"
                      : "Confirm I handed over / collected"}
                  </button>
                  <button
                    className="board-button secondary"
                    onClick={() => run({ type: "cancel", dealId: id })}
                  >
                    This did not happen
                  </button>
                </>
              )}
              {status === "Done" && (
                <Link className="board-button secondary" href="/board/impact">
                  View handover record ↗
                </Link>
              )}
            </div>
          </section>
          {((status === "Pending" && !seller) ||
            (status === "Accepted" && !otherConfirmed)) && (
            <div className="simulation-panel">
              <p className="board-eyebrow">DEMO WALKTHROUGH</p>
              <p>
                Try the other participant’s step on this browser. This does not
                represent a live response.
              </p>
              <button
                className="text-button"
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
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
