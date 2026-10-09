import MaterialArt from "@/components/materials/MaterialArt";
import { formatEventDate, priceLabel } from "@/lib/reclaim";
import type { PublishReviewProps } from "@/types/listings/type";
export default function PublishReview({
  collection,
  items,
}: PublishReviewProps) {
  return (
    <section aria-labelledby="review-title" className="grid gap-8">
      <div className="border-b border-line pb-8">
        <h2 id="review-title" className="text-3xl tracking-tight">
          Ready for the next person.
        </h2>
        <p className="mt-3 text-muted">
          Check the details someone needs before requesting your batch.
        </p>
      </div>
      <dl className="grid gap-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-muted">Event</dt>
          <dd className="mt-2 text-lg">{collection.eventName}</dd>
        </div>
        <div>
          <dt className="text-muted">Collect from</dt>
          <dd className="mt-2 text-lg">{collection.area}</dd>
        </div>
        <div>
          <dt className="text-muted">Event or cleanup date (IST)</dt>
          <dd className="mt-2">
            {formatEventDate(Date.parse(collection.eventDate + "T00:00:00+05:30"))}
          </dd>
        </div>
        {collection.pickupNote && (
          <div className="sm:col-span-2">
            <dt className="text-muted">Pickup instructions</dt>
            <dd className="mt-2 leading-7">{collection.pickupNote}</dd>
          </div>
        )}
        {collection.deliveryNote && (
          <div>
            <dt className="text-muted">Delivery</dt>
            <dd className="mt-2 leading-7">{collection.deliveryNote}</dd>
          </div>
        )}
      </dl>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={index}
            className="overflow-hidden rounded-xl border border-line"
          >
            <MaterialArt art={item.art} name={item.name} image={item.image} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl tracking-tight">{item.name}</h3>
                <span className="shrink-0 text-blue">
                  {priceLabel(item.price)}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted">
                {item.quantity} {item.unit} · {item.condition} condition
              </p>
              <p className="mt-2 text-sm text-muted">
                {item.category} / {item.purpose}
              </p>
              {item.hazards && (
                <p className="mt-4 border-t border-line pt-4 text-sm">
                  {item.hazards}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
