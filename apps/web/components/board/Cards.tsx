"use client";
import Link from "next/link";
import MaterialArt from "./MaterialArt";
import { useBoard } from "./Store";
import { itemStatus, priceLabel, type Item } from "../../lib/reclaim";
export function ItemCard({ item }: { item: Item }) {
  const { state, now, run } = useBoard();
  const event = state.events.find((e) => e.id === item.eventId)!;
  const hours = Math.max(0, Math.ceil((event.clearBy - now) / 3_600_000));
  const saved = state.saved.includes(item.id);
  return (
    <article className="board-item">
      <div className="board-item-visual">
        <Link href={`/board/items/${item.id}`} aria-label={`View ${item.name}`}>
          <MaterialArt art={item.art} name={item.name} image={item.image} />
        </Link>
        <button
          className={`save-item ${saved ? "is-saved" : ""}`}
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
        </button>
        <span className="item-price">{priceLabel(item.price)}</span>
      </div>
      <div className="board-item-copy">
        <div className="item-meta">
          <span>
            {item.category} / {item.purpose}
          </span>
          <span>{itemStatus(item, event, now)}</span>
        </div>
        <h3>
          <Link href={`/board/items/${item.id}`}>{item.name}</Link>
        </h3>
        <p>
          {item.quantity} {item.unit} · {item.condition.toLowerCase()} condition
        </p>
        <div className="item-location">
          <span>{event.area}</span>
          <span>{hours > 0 ? `${hours}h to clear` : "Window closed"}</span>
        </div>
      </div>
    </article>
  );
}
export function Empty({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="board-empty">
      <h2>{title}</h2>
      <p>{text}</p>
      {href && (
        <Link className="board-button" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
