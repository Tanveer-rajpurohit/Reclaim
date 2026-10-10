import { Input, Textarea } from "@/components/ui/Controls";
import type { CollectionStepProps } from "@/types/listings/type";
export default function CollectionStep({
  collection,
  onChange,
}: CollectionStepProps) {
  return (
    <section className="form-panel rounded-xl border border-line bg-[var(--surface)] p-5 lg:p-8 [&_h2]:mb-6 [&_h2]:text-2xl [&_h2]:font-normal">
      <h2>Pickup details</h2>
      <div className="form-columns grid min-w-0 gap-6 md:grid-cols-2 md:gap-x-8">
        <label className="grid gap-2 text-sm leading-relaxed text-ink">
          Name for this group of items
          <Input
            value={collection.eventName}
            onChange={(e) => onChange("eventName", e.target.value)}
            minLength={3}
            maxLength={80}
            required
            placeholder="e.g. College fest leftovers or Office clear-out"
          />
        </label>
        <label className="grid gap-2 text-sm leading-relaxed text-ink">
          Pickup area
          <Input
            value={collection.area}
            onChange={(e) => onChange("area", e.target.value)}
            minLength={2}
            maxLength={60}
            required
            placeholder="For example, Rohini, Delhi"
          />
        </label>
        <label className="grid gap-2 text-sm leading-relaxed text-ink">
          Event or cleanup date (IST)
          <Input
            type="date"
            value={collection.eventDate}
            onChange={(e) => onChange("eventDate", e.target.value)}
            required
          />
          <span className="text-xs text-muted">
            When were these items used or cleared out? This is not the pickup
            date.
          </span>
        </label>
        <label className="grid gap-2 text-sm leading-relaxed text-ink">
          How to pick up (optional)
          <Textarea
            value={collection.pickupNote}
            onChange={(e) => onChange("pickupNote", e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="e.g. Meet at the main gate. Bring a car for large items."
          />
        </label>
        <label className="grid gap-2 text-sm leading-relaxed text-ink">
          Delivery note (optional)
          <Textarea
            value={collection.deliveryNote}
            onChange={(e) => onChange("deliveryNote", e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="e.g. Pickup only, or I can deliver nearby."
          />
        </label>
      </div>
    </section>
  );
}
