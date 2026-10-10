import Link from "next/link";
import type { Person } from "@/types/profile/type";
import Icon from "@/components/ui/Icon";

export default function AccountSummary({
  person,
  email,
  verified,
  active,
}: {
  person: Person;
  email: string | null;
  verified: boolean;
  active: number;
}) {
  return (
    <aside className="order-first grid min-w-0 gap-6 lg:order-last lg:sticky lg:top-8">
      <section
        className="rounded-2xl border border-line bg-[var(--surface)] p-6"
        aria-labelledby="account-summary-title"
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--blue-faint)] text-xl text-blue"
          >
            {person.name.trim().slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2
              id="account-summary-title"
              className="break-words text-2xl tracking-tight"
            >
              {person.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {person.area || "Add your locality"}
            </p>
          </div>
        </div>
        <div className="mt-6 border-t border-line pt-5">
          <p className="break-all text-sm leading-6">{email}</p>
          <p className="mt-2 text-xs text-muted">
            {verified ? "Email verified" : "Email verification required"}
          </p>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-sm">
          {[
            { label: "Active listings", value: active },
            { label: "Handovers offered", value: person.offeredCount || 0 },
            { label: "Batches collected", value: person.collectedCount || 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4"
            >
              <dt className="text-muted">{label}</dt>
              <dd className="text-xl tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <Link
          className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm text-blue hover:underline"
          href="/dashboard/impact"
        >
          Your handover record <Icon name="arrow" />
        </Link>
      </section>
      <section className="rounded-2xl bg-[var(--blue-faint)] p-6">
        <h3 className="text-lg tracking-tight">Contact after acceptance.</h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          Your mobile number stays off public profiles. Both participants can
          see each other’s number after a pickup request is accepted.
        </p>
        <Link
          href={`/dashboard/people/${person.id}`}
          className="mt-4 inline-flex min-h-11 items-center gap-3 text-sm text-blue hover:underline"
        >
          View your public profile <Icon name="arrow" />
        </Link>
      </section>
    </aside>
  );
}
