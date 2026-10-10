"use client";
import { useState, type FormEvent } from "react";
import { Button, Input, Select, Checkbox } from "@/components/ui/Controls";
import { categories } from "@/lib/reclaim";
import type { Person } from "@/types/profile/type";
import { useBoard } from "@/components/marketplace/Store";

export default function ProfileForm({ person }: { person: Person }) {
  const { run, pending } = useBoard();
  const [profile, setProfile] = useState<Person>(person);
  const [saved, setSaved] = useState(false);
  function update(changes: Partial<Person>) {
    setProfile((old) => ({ ...old, ...changes }));
    setSaved(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(await run({ type: "profile", profile }));
  }
  return (
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
            Your name and area help people arrange a handover.
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
            Area or neighbourhood
            <Input
              autoComplete="address-level2"
              placeholder="For example, Rohini, Delhi"
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
          Choose materials you want to hear about when new batches are listed.
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
  );
}
