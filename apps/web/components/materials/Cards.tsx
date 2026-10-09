"use client";
import { Button } from "@/components/ui/Controls";
import Link from "next/link";
import type { ItemCardProps, EmptyStateProps } from "@/types/materials/type";
import MaterialArt from "@/components/materials/MaterialArt";
import { useBoard } from "@/components/marketplace/Store";
import { itemStatus, priceLabel } from "@/lib/reclaim";
export function ItemCard({ item }: ItemCardProps) {
  const { state, run } = useBoard();
  const event = state.events.find((e) => e.id === item.eventId)!;
  const saved = state.saved.includes(item.id);
  return (
    <article className="board-item min-w-0">
      <div className="board-item-visual group relative isolate overflow-hidden rounded-xl">
        <Link
          href={`/dashboard/items/${item.id}`}
          aria-label={`View ${item.name}`}
        >
          <MaterialArt art={item.art} name={item.name} image={item.image} />
        </Link>
        <Button
          className={`save-item absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-[var(--surface)] text-muted hover:bg-[var(--blue-faint)] hover:text-blue aria-pressed:bg-[var(--blue-faint)] aria-pressed:text-blue ${saved ? "is-saved" : ""}`}
          aria-label={`${saved ? "Unsave" : "Save"} ${item.name}`}
          aria-pressed={saved}
          onClick={() => run({ type: "save", itemId: item.id })}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 3h10v14l-5-3-5 3V3Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill={saved ? "currentColor" : "none"}
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        <span className="item-price absolute bottom-3 left-3 rounded-md bg-[var(--surface)] px-2.5 py-1 text-sm text-ink">
          {priceLabel(item.price)}
        </span>
      </div>
      <div className="board-item-copy py-4 [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-normal lg:[&_h3]:text-xl [&_p]:text-sm [&_p]:text-muted">
        <div className="item-meta flex justify-between gap-2 text-[11px] text-muted [&_span:last-child]:hidden md:[&_span:last-child]:inline">
          <span>
            {item.category} / {item.purpose}
          </span>
          <span>{itemStatus(item)}</span>
        </div>
        <h3>
          <Link href={`/dashboard/items/${item.id}`}>{item.name}</Link>
        </h3>
        <p>
          {item.quantity} {item.unit} · {item.condition.toLowerCase()} condition
        </p>
        <div className="item-location mt-4 grid gap-1 border-t border-line pt-3 text-xs text-muted lg:flex lg:justify-between">
          <span>{event.area}</span>
          <span>Pickup by agreement</span>
        </div>
      </div>
    </article>
  );
}
export function Empty({ title, text, href, label }: EmptyStateProps) {
  return (
    <div className="board-empty my-6 rounded-xl border border-line px-6 py-16 text-center [&_h2]:text-3xl [&_h2]:font-normal [&_p]:mx-auto [&_p]:mb-6 [&_p]:mt-4 [&_p]:max-w-lg [&_p]:text-muted">
      <h2>{title}</h2>
      <p>{text}</p>
      {href && (
        <Link
          className="board-button inline-flex min-h-11 items-center justify-center gap-6 rounded-lg bg-blue px-4 py-3 text-sm font-normal text-[var(--surface)] hover:bg-[var(--blue-hover)] disabled:bg-[var(--blue-faint)] disabled:text-muted"
          href={href}
        >
          {label}
        </Link>
      )}
    </div>
  );
}
