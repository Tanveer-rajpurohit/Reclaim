"use client";
import { useBoard } from "@/components/marketplace/Store";
import { Empty } from "@/components/materials/Cards";
import { activeListingsFor } from "@/lib/records";
import ProfileForm from "./ProfileForm";
import AccountSummary from "./AccountSummary";
import SignOutButton from "./SignOutButton";

export function Profile() {
  const { currentUserId, state, email, verified, pending } = useBoard();
  const person = state.people.find((entry) => entry.id === currentUserId);
  if (!person)
    return (
      <Empty
        title="Your profile is unavailable."
        text="Your account details could not be loaded. Try opening your profile again."
        href="/dashboard"
        label="Back to Discover"
      />
    );
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-6 pb-10 pt-12">
        <div>
          <p className="mb-4 font-mono text-xs tracking-wide text-muted">
            YOUR ACCOUNT
          </p>
          <h1 className="text-4xl font-normal tracking-tight lg:text-5xl">
            Your profile.
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-muted">
            Your details, preferences and handover record. One account for
            buying and selling.
          </p>
        </div>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <ProfileForm key={person.id} person={person} />
        <AccountSummary
          person={person}
          email={email}
          verified={verified}
          active={activeListingsFor(state, person.id).length}
        />
      </div>
      <div className="mt-10 flex justify-start border-t border-line pt-6 sm:justify-end">
        <SignOutButton disabled={pending} />
      </div>
    </>
  );
}
