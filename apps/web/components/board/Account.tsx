"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { categories, demoId, formatTime, type Person } from "../../lib/reclaim";
import { useBoard } from "./Store";
import { Empty } from "./Cards";
export function Profile() {
  const { state, run, reset } = useBoard();
  const person = state.people.find((p) => p.id === demoId)!;
  const [profile, setProfile] = useState<Person>(person);
  const [saved, setSaved] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(run({ type: "profile", profile }));
  }
  return (
    <>
      <div className="page-title">
        <p className="board-eyebrow">ONE ACCOUNT, BOTH SIDES</p>
        <h1>Your profile.</h1>
        <p>
          Offer materials and collect them with the same identity. Contact is
          shared only after a request is accepted.
        </p>
      </div>
      <div className="profile-layout">
        <form className="board-form form-panel" onSubmit={submit}>
          <h2>The essentials</h2>
          <label>
            Display name
            <input
              value={profile.name}
              onChange={(e) => {
                setProfile({ ...profile, name: e.target.value });
                setSaved(false);
              }}
              required
              minLength={2}
              maxLength={40}
            />
          </label>
          <label>
            Indian mobile number
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => {
                setProfile({ ...profile, phone: e.target.value });
                setSaved(false);
              }}
              placeholder="10 digits, optionally +91"
              maxLength={16}
            />
            <span className="form-hint">
              Required before your first request or publication. Never shown on
              the public board.
            </span>
          </label>
          <label>
            Locality
            <input
              value={profile.area}
              onChange={(e) => {
                setProfile({ ...profile, area: e.target.value });
                setSaved(false);
              }}
              required
              minLength={2}
              maxLength={60}
            />
          </label>
          <label>
            What you usually collect
            <select
              value={profile.buyerType}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  buyerType: e.target.value as Person["buyerType"],
                })
              }
            >
              <option value="none">No preference yet</option>
              <option value="reuse">Materials for reuse</option>
              <option value="bulk">Sorted material in bulk</option>
            </select>
            <span className="form-hint">
              This preference does not limit what you can buy or sell.
            </span>
          </label>
          <fieldset className="interests-field">
            <legend>Materials you’re interested in</legend>
            <div>
              {categories.map((c) => (
                <label className="checkbox-label" key={c}>
                  <input
                    type="checkbox"
                    checked={profile.interests.includes(c)}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        interests: e.target.checked
                          ? [...profile.interests, c]
                          : profile.interests.filter((i) => i !== c),
                      })
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="board-button" type="submit">
            Save profile
          </button>
          {saved && (
            <p className="saved-feedback" role="status">
              Profile saved on this browser.
            </p>
          )}
        </form>
        <aside className="profile-aside">
          <div className="profile-identity">
            <span className="profile-avatar">{person.name.slice(0, 1)}</span>
            <h2>{person.name}</h2>
            <p>{person.area}</p>
            <Link href="/board/impact">Your handover record ↗</Link>
          </div>
          <div className="profile-demo">
            <h3>About this preview</h3>
            <p>
              This is a local demo account with sample listings and illustrative
              contact details. Changes are stored in this browser. Live
              accounts, photo inference and shared data are not connected.
            </p>
            <button
              className="text-button"
              onClick={() => {
                if (
                  window.confirm(
                    "Reset demo listings, requests, saved items and your profile on this browser?",
                  )
                ) {
                  reset();
                  setProfile(state.people.find((p) => p.id === demoId)!);
                  setSaved(false);
                }
              }}
            >
              Reset demo data
            </button>
            <Link className="text-button" href="/">
              Leave preview ↗
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
export function Notifications() {
  const { state, run } = useBoard();
  const notices = state.notices.filter((n) => n.personId === demoId);
  return (
    <>
      <div className="page-title page-title-row">
        <div>
          <p className="board-eyebrow">REQUESTS &amp; UPDATES</p>
          <h1>Your activity.</h1>
          <p>Pickup requests, decisions and completed handovers.</p>
        </div>
        <button className="text-button" onClick={() => run({ type: "read" })}>
          Mark all as read
        </button>
      </div>
      <div className="notification-list">
        {notices.map((n) => (
          <article
            className={`activity-row ${n.read ? "read" : ""}`}
            key={n.id}
          >
            <span className="activity-indicator" />
            <div>
              <h2>
                <Link
                  href={n.href}
                  onClick={() => run({ type: "read", noticeId: n.id })}
                >
                  {n.title}
                </Link>
              </h2>
              <p>{n.detail}</p>
              <time dateTime={new Date(n.at).toISOString()}>
                {formatTime(n.at)} IST
              </time>
            </div>
            {!n.read && (
              <button
                className="text-button"
                onClick={() => run({ type: "read", noticeId: n.id })}
              >
                Mark read
              </button>
            )}
          </article>
        ))}
      </div>
      {!notices.length && (
        <Empty
          title="You’re up to date."
          text="New requests and handover updates will appear here."
        />
      )}
    </>
  );
}
export function Impact() {
  const { state } = useBoard();
  const done = state.deals.filter(
    (d) =>
      d.status === "Done" &&
      (d.buyerId === demoId ||
        state.events.find(
          (e) => e.id === state.items.find((i) => i.id === d.itemId)?.eventId,
        )?.ownerId === demoId),
  );
  const transferred = state.items.filter((i) =>
    done.some((d) => d.itemId === i.id),
  );
  const kg = transferred
    .filter((i) => i.unit === "kg")
    .reduce((sum, i) => sum + i.quantity, 0);
  const given = done.filter((d) => d.buyerId !== demoId).length;
  return (
    <>
      <div className="page-title">
        <p className="board-eyebrow">CONFIRMED BY BOTH PEOPLE</p>
        <h1>A record of what changed hands.</h1>
        <p>
          Count the handovers that happened. Keep estimates separate from
          measured outcomes.
        </p>
      </div>
      <div className="impact-summary">
        <div>
          <span>{transferred.length}</span>
          <p>Listings handed over</p>
        </div>
        <div>
          <span>{given}</span>
          <p>Your successful handovers</p>
        </div>
        <div>
          <span>{done.length - given}</span>
          <p>Your successful collections</p>
        </div>
        <div>
          <span>
            {kg.toLocaleString("en-IN")} <small>kg</small>
          </span>
          <p>Estimated weight, kg listings only</p>
        </div>
      </div>
      <div className="impact-explanation">
        <h2>A transfer is the outcome we can record.</h2>
        <p>
          Only deals confirmed by both people count. Pieces and bundles are
          never converted into kilograms. These are local demo records, not
          proof of recycling or avoided emissions.
        </p>
      </div>
      {done.length ? (
        <div className="transfer-list">
          {done.map((d) => {
            const i = state.items.find((i) => i.id === d.itemId)!;
            return (
              <Link href={`/board/deals/${d.id}`} key={d.id}>
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
          title="The first confirmed handover belongs here."
          text="Complete a collection and have both participants confirm it. The record updates from those confirmations."
          href="/board/deals?side=selling"
          label="Review your handovers"
        />
      )}
    </>
  );
}
