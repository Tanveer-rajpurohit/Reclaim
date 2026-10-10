"use client";
import { Button, Input, Select, Checkbox } from "@/components/ui/Controls";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { categories } from "@/lib/reclaim";
import type { Person } from "@/types/profile/type";
import { useBoard } from "@/components/marketplace/Store";
export function Profile() {
  const router = useRouter();
  const auth = useAuth();
  const { currentUserId, state, run, pending, email } = useBoard();
  const person = state.people.find((p) => p.id === currentUserId)!;
  const [profile, setProfile] = useState<Person>(person);
  const [saved, setSaved] = useState(false);
  const [accountError, setAccountError] = useState("");
  function update(changes: Partial<Person>) {
    setProfile((old) => ({ ...old, ...changes }));
    setSaved(false);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(await run({ type: "profile", profile }));
  }
  const offered = state.items.filter(
    (i) =>
      state.events.find((e) => e.id === i.eventId)?.ownerId === currentUserId,
  ).length;
  const collected = state.deals.filter(
    (d) => d.buyerId === currentUserId && d.status === "Done",
  ).length;
  return (
    <>
      <div className="pb-10 pt-12">
        <p className="mb-4 font-mono text-xs tracking-wide text-muted">
          YOUR ACCOUNT
        </p>
        <h1 className="text-4xl font-normal tracking-tight lg:text-5xl">
          A little about you.
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-muted">
          One profile for offering materials and finding your next batch.
        </p>
      </div>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
        <form onSubmit={submit} className="grid gap-10">
          <section
            aria-labelledby="profile-details"
            className="border-t border-line pt-8"
          >
            <div className="mb-8">
              <h2 id="profile-details" className="text-2xl tracking-tight">
                The essentials
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Your name and locality help people arrange a handover.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Display name
                <Input
                  autoComplete="name"
                  value={profile.name}
                  onChange={(e) => update({ name: e.target.value })}
                  required
                  minLength={2}
                  maxLength={40}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Locality
                <Input
                  autoComplete="address-level2"
                  value={profile.area}
                  onChange={(e) => update({ area: e.target.value })}
                  required
                  minLength={2}
                  maxLength={60}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Mobile number
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={profile.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="10 digits, optionally +91"
                  maxLength={16}
                />
                <span className="text-xs leading-6 text-muted">
                  Shared only with the other person after acceptance.
                </span>
              </label>
              <label className="grid content-start gap-2 text-sm">
                What you usually collect
                <Select
                  value={profile.buyerType}
                  onChange={(e) =>
                    update({ buyerType: e.target.value as Person["buyerType"] })
                  }
                >
                  <option value="none">No preference yet</option>
                  <option value="reuse">Materials for reuse</option>
                  <option value="bulk">Sorted material in bulk</option>
                </Select>
                <span className="text-xs leading-6 text-muted">
                  You can still buy and sell any category.
                </span>
              </label>
            </div>
          </section>
          <fieldset className="border-t border-line pt-8">
            <legend className="float-left mb-2 w-full text-2xl tracking-tight">
              Keep an eye out for
            </legend>
            <p className="clear-both mb-6 text-sm leading-7 text-muted">
              Choose materials you want to hear about when new batches are
              listed.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((category) => (
                <label
                  key={category}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors ${profile.interests.includes(category) ? "border-[var(--field-line)] bg-[var(--blue-faint)] text-blue" : "border-line hover:bg-[var(--surface-soft)]"}`}
                >
                  <Checkbox
                    checked={profile.interests.includes(category)}
                    onChange={(e) =>
                      update({
                        interests: e.target.checked
                          ? [...profile.interests, category]
                          : profile.interests.filter((c) => c !== category),
                      })
                    }
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-5 border-t border-line pt-6">
            <Button
              type="submit"
              disabled={pending}
              className="min-h-12 rounded-lg bg-blue px-6 py-3 text-sm text-[var(--surface)] hover:bg-[var(--blue-hover)]"
            >
              Save changes
            </Button>
            {saved && (
              <p role="status" className="text-sm text-blue">
                Your profile is saved.
              </p>
            )}
          </div>
        </form>
        <aside className="grid gap-8 lg:sticky lg:top-8">
          <section className="rounded-2xl bg-[var(--blue-faint)] p-6">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-xl text-blue"
              >
                {person.name.trim().slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="break-words text-2xl tracking-tight">
                  {person.name}
                </h2>
                <p className="mt-1 text-sm text-muted">{person.area}</p>
              </div>
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-[var(--field-line)] pt-6">
              <div>
                <dd className="text-3xl text-blue">{offered}</dd>
                <dt className="mt-2 text-xs text-muted">Materials listed</dt>
              </div>
              <div>
                <dd className="text-3xl text-blue">{collected}</dd>
                <dt className="mt-2 text-xs text-muted">Batches collected</dt>
              </div>
            </dl>
            <Link
              className="mt-6 inline-flex min-h-11 items-center gap-4 text-sm text-blue hover:underline"
              href="/dashboard/impact"
            >
              Your handover record ↗
            </Link>
          </section>
          <div>
            <h3 className="text-lg">Your number stays private.</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              It never appears on the material board. A mobile number is needed
              before you publish or request a batch.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <p className="text-sm text-muted">Signed in as {email}</p>
            <Button
              className="mt-4 min-h-11 text-sm text-blue"
              disabled={auth.isPending}
              onClick={async () => {
                try {
                  await auth.mutateAsync({ action: "logout" });
                  router.push("/dashboard");
                  router.refresh();
                } catch (cause) {
                  setAccountError(
                    cause instanceof Error ? cause.message : "Sign out failed.",
                  );
                }
              }}
            >
              Sign out
            </Button>
            {accountError && (
              <p role="alert" className="text-sm text-muted">
                {accountError}
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
