"use client";
import { Button, Checkbox } from "@/components/ui/Controls";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBoard } from "@/components/marketplace/Store";
import type { ItemDraft } from "@/types/materials/type";
import type { CollectionFields, PublishPhase } from "@/types/listings/type";
import CollectionStep from "./CollectionStep";
import MaterialsStep from "./MaterialsStep";
import PublishReview from "./PublishReview";
import PageMotion from "@/components/ui/PageMotion";
export function inputTime(at: number) {
  return new Date(at + 330 * 60_000).toISOString().slice(0, 16);
}
const blank: ItemDraft = {
  name: "",
  description: "",
  category: "Wood",
  purpose: "Reuse",
  quantity: 1,
  unit: "pieces",
  condition: "Good",
  price: 0,
  hazards: "",
  art: "boards",
  image: "",
};

export default function Publish() {
  const { state, run } = useBoard();
  const router = useRouter();
  const [phase, setPhase] = useState<PublishPhase>(0);
  const title = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) {
      title.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    mounted.current = true;
  }, [phase]);
  const [items, setItems] = useState<ItemDraft[]>([{ ...blank }]);
  const [collection, setCollection] = useState<CollectionFields>(() => ({
    eventName: "",
    area: "",
    eventDate: inputTime(Date.now()).slice(0, 10),
    pickupNote: "",
    deliveryNote: "",
  }));
  const [safe, setSafe] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function update(index: number, changes: Partial<ItemDraft>) {
    setItems((old) =>
      old.map((item, n) => (n === index ? { ...item, ...changes } : item)),
    );
    setSafe(false);
  }
  function sample() {
    setItems(
      state.items
        .filter((i) => ["item-1", "item-2", "item-3"].includes(i.id))
        .map((i) => ({
          name: i.name,
          description: i.description,
          category: i.category,
          purpose: i.purpose,
          quantity: i.quantity,
          unit: i.unit,
          condition: i.condition,
          price: i.price,
          hazards: i.hazards,
          art: i.art,
          image: "demo",
        })),
    );
    setCollection((old) => ({
      ...old,
      eventName: "Campus Fest Cleanup",
      area: "Rohini",
      pickupNote:
        "Meet at the public collection desk. Bring transport for your batch.",
    }));
    setSafe(false);
    setMessage(
      "Sample materials added. Check the collection details and review each item.",
    );
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const eventAt = Date.parse(collection.eventDate + "T00:00:00+05:30");
    if (phase === 0) {
      if (!Number.isFinite(eventAt)) {
        setMessage("Add the date of the event or cleanup.");
        return;
      }
      setPhase(1);
    } else if (phase === 1) {
      if (!items.length) {
        setMessage("Add at least one material before reviewing.");
        return;
      }
      if (items.some((item) => !item.image)) {
        setMessage(
          "Add a cover photo for each material, or use the sample pile.",
        );
        return;
      }
      setPhase(2);
    } else if (
      run({
        type: "publish",
        items,
        safe,
        event: {
          name: collection.eventName,
          area: collection.area,
          eventAt,
          pickupNote: collection.pickupNote,
          deliveryNote: collection.deliveryNote,
        },
      })
    ) {
      router.push("/dashboard/listings?published=1");
    }
  }
  const titles = [
    "Set the collection.",
    "Describe the materials.",
    "One last look.",
  ];
  return (
    <>
      <Link
        href="/dashboard/listings"
        className="my-8 inline-flex min-h-10 items-center text-sm text-muted hover:text-blue"
      >
        ← Your listings
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-6 pb-8">
        <div>
          <p className="mb-4 font-mono text-xs tracking-wide text-muted">
            LIST A BATCH / 0{phase + 1}
          </p>
          <h1
            ref={title}
            tabIndex={-1}
            className="outline-none text-4xl font-normal tracking-tight lg:text-5xl"
          >
            {titles[phase]}
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-muted">
            Tell people where the materials came from and how to collect them.
          </p>
        </div>
        {phase < 2 && (
          <Button
            className="min-h-11 rounded-lg border border-[var(--field-line)] px-4 py-3 text-sm text-blue hover:bg-[var(--blue-faint)]"
            onClick={sample}
            disabled={busy}
          >
            Try a sample pile ↗
          </Button>
        )}
      </div>
      <ol
        aria-label="Listing progress"
        className="mb-10 grid grid-cols-3 border-b border-line"
      >
        {["Collection", "Materials", "Review"].map((label, index) => (
          <li
            key={label}
            aria-current={index === phase ? "step" : undefined}
            className={`border-b-2 py-2 text-sm ${index === phase ? "border-blue text-blue" : "border-transparent text-muted"}`}
          >
            <Button
              disabled={index > phase || busy}
              onClick={() => setPhase(index as PublishPhase)}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--blue-faint)] disabled:hover:bg-transparent sm:gap-4"
            >
              <span className="font-mono text-xs">0{index + 1}</span>
              <span>{label}</span>
            </Button>
          </li>
        ))}
      </ol>
      {message && (
        <p role="status" className="mb-6 text-sm leading-7 text-blue">
          {message}
        </p>
      )}
      <form onSubmit={submit} className="pb-8">
        <PageMotion key={phase}>
          {phase === 0 && (
            <CollectionStep
              collection={collection}
              onChange={(field, value) => {
                setCollection((old) => ({ ...old, [field]: value }));
                setSafe(false);
              }}
            />
          )}
          {phase === 1 && (
            <MaterialsStep
              items={items}
              busy={busy}
              update={update}
              onBusyChange={setBusy}
              onAdd={() => setItems((old) => [...old, { ...blank }])}
              onRemove={(index) => {
                setItems((old) => old.filter((_, n) => n !== index));
                setSafe(false);
              }}
            />
          )}
          {phase === 2 && (
            <PublishReview collection={collection} items={items} />
          )}
        </PageMotion>
        {phase === 2 && (
          <label className="mt-8 flex cursor-pointer items-start gap-4 rounded-xl bg-[var(--blue-faint)] p-5 text-sm leading-7">
            <Checkbox
              checked={safe}
              onChange={(e) => setSafe(e.target.checked)}
              required
              className="mt-1"
            />
            <span>
              I reviewed every item. This batch has no chemicals, hazardous
              batteries, illegal goods or unsafe waste.
            </span>
          </label>
        )}
        <div className="mt-8 flex items-center justify-between gap-6 border-t border-line pt-6">
          <div>
            {phase > 0 && (
              <Button
                className="min-h-11 rounded-lg border border-[var(--field-line)] px-5 py-3 text-sm hover:bg-[var(--blue-faint)]"
                disabled={busy}
                onClick={() => {
                  setPhase((old) => (old - 1) as PublishPhase);
                  setMessage("");
                }}
              >
                ← Back
              </Button>
            )}
          </div>
          <Button
            type="submit"
            disabled={busy || (phase > 0 && !items.length)}
            className="inline-flex min-h-12 items-center gap-6 rounded-lg bg-blue px-6 py-3 text-sm text-[var(--surface)] hover:bg-[var(--blue-hover)] disabled:cursor-not-allowed disabled:bg-[var(--blue-faint)] disabled:text-muted"
          >
            {busy
              ? "Preparing photo…"
              : phase === 0
                ? "Continue to materials"
                : phase === 1
                  ? "Review listing"
                  : `Publish ${items.length} ${items.length === 1 ? "item" : "items"}`}{" "}
            <span aria-hidden="true">↗</span>
          </Button>
        </div>
      </form>
    </>
  );
}
