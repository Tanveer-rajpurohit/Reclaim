"use client";
import Link from "next/link";
import { useBoard } from "@/components/marketplace/Store";
import { Empty, ItemCard } from "@/components/materials/Cards";
import { formatTime, itemStatus } from "@/lib/reclaim";
import { activeListingsFor } from "@/lib/records";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Person } from "@/types/profile/type";
import Icon from "@/components/ui/Icon";
import type { PublicProfileProps } from "@/types/people/type";
export default function PublicProfile({ id }: PublicProfileProps) {
  const { currentUserId, state } = useBoard();
  const [data, setData] = useState<{
    person: Person;
    history: {
      id: string;
      name: string;
      quantity: number;
      unit: string;
      role: string;
      completedAt: number;
    }[];
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<NonNullable<typeof data>>(`/api/users/${id}`)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Profile not found.",
          );
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <Empty
        title="Profile unavailable."
        text={error}
        href="/dashboard"
        label="Discover materials"
      />
    );
  if (!data)
    return (
      <p role="status" className="py-12 text-muted">
        Loading profile…
      </p>
    );
  const person = data.person;
  if (!person)
    return (
      <Empty
        title="Profile not found."
        text="This profile could not be found."
        href="/dashboard"
        label="Discover materials"
      />
    );
  const history = data.history;
  const offered = history.filter((record) => record.role === "offered").length;
  const active = activeListingsFor(state, id).filter((item) => {
    return itemStatus(item) === "Available";
  });
  return (
    <>
      <Link
        href="/dashboard/deals"
        className="my-8 inline-flex min-h-10 items-center text-sm text-muted hover:text-blue"
      >
        ← Your handovers
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-8">
        <div className="flex items-center gap-5">
          <span
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-full bg-[var(--blue-faint)] text-2xl text-blue"
          >
            {person.name.trim().slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="mb-2 font-mono text-xs text-muted">PUBLIC PROFILE</p>
            <h1 className="text-3xl tracking-tight sm:text-4xl">
              {person.name}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {person.area} ·{" "}
              {person.buyerType === "bulk"
                ? "Collects sorted material in bulk"
                : person.buyerType === "reuse"
                  ? "Collects materials for reuse"
                  : "Offers and collects materials"}
            </p>
          </div>
        </div>
        {id === currentUserId && (
          <Link
            className="inline-flex min-h-11 items-center gap-3 text-sm text-blue"
            href="/dashboard/profile"
          >
            Edit your profile <Icon name="arrow" />
          </Link>
        )}
      </header>
      <section aria-labelledby="track-record" className="py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="track-record" className="text-2xl tracking-tight">
              The handover record.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              Completed pickups recorded by the seller.
            </p>
          </div>
          <p className="text-sm text-muted">
            <span className="mr-2 text-3xl text-blue">{history.length}</span>
            completed handovers
          </p>
        </div>
        <dl className="mb-8 flex flex-wrap gap-8 border-y border-line py-5 text-sm">
          <div className="flex gap-3">
            <dt className="text-muted">Offered</dt>
            <dd>{offered}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-muted">Collected</dt>
            <dd>{history.length - offered}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-muted">Available listings</dt>
            <dd>{active.length}</dd>
          </div>
        </dl>
        {history.length ? (
          <div className="grid gap-4">
            {history.map((record) => (
              <article
                key={record.id}
                className="flex flex-wrap items-start justify-between gap-5 rounded-xl border border-line p-5"
              >
                <div>
                  <p className="mb-2 font-mono text-xs text-muted">
                    {record.role === "offered" ? "OFFERED" : "COLLECTED"}
                  </p>
                  <h3 className="text-xl tracking-tight">{record.name}</h3>
                  <p className="mt-2 text-sm text-muted">
                    {record.quantity} {record.unit} · Completed by seller
                  </p>
                </div>
                <time
                  dateTime={new Date(record.completedAt).toISOString()}
                  className="text-xs leading-6 text-muted"
                >
                  {formatTime(record.completedAt)} IST
                </time>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--surface-soft)] p-6">
            <h3 className="text-lg">No completed handovers yet.</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              The record appears after a seller marks a pickup complete.
            </p>
          </div>
        )}
      </section>
      {active.length > 0 && (
        <section className="border-t border-line py-10">
          <h2 className="mb-8 text-2xl tracking-tight">
            Materials from {person.name}.
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-6">
            {active.slice(0, 4).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
