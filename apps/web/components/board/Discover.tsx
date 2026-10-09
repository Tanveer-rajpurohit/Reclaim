"use client";
import Link from "next/link";
import { useState } from "react";
import {
  categories,
  demoId,
  itemStatus,
  type Art,
  type Category,
} from "../../lib/reclaim";
import { useBoard } from "./Store";
import { Empty, ItemCard } from "./Cards";
import MaterialArt from "./MaterialArt";

const categoryArt: { label: Category; art: Art }[] = [
  { label: "Wood", art: "boards" },
  { label: "Paper", art: "boxes" },
  { label: "Plants", art: "pots" },
  { label: "Cloth", art: "cloth" },
  { label: "Decor", art: "stand" },
  { label: "Metal", art: "metal" },
];
export default function Discover({
  savedOnly = false,
}: {
  savedOnly?: boolean;
}) {
  const { state, now } = useBoard();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Category[]>([]);
  const [purpose, setPurpose] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState("newest");
  const [limit, setLimit] = useState(12);
  function clear() {
    setQuery("");
    setSelected([]);
    setPurpose("");
    setPrice("");
    setArea("");
    setLimit(12);
  }
  const items = state.items
    .filter((i) => {
      const e = state.events.find((e) => e.id === i.eventId)!;
      return (
        (savedOnly
          ? state.saved.includes(i.id)
          : itemStatus(i, e, now) === "Available" &&
            e.availableFrom <= now &&
            e.ownerId !== demoId) &&
        (!selected.length || selected.includes(i.category)) &&
        (!purpose || i.purpose === purpose) &&
        (!price || (price === "free" ? i.price === 0 : i.price > 0)) &&
        (!area || e.area === area) &&
        `${i.name} ${e.name} ${e.area}`
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "newest"
        ? b.createdAt - a.createdAt
        : state.events.find((e) => e.id === a.eventId)!.clearBy -
          state.events.find((e) => e.id === b.eventId)!.clearBy,
    );
  return (
    <>
      <div className="board-heading">
        <div>
          <p className="board-eyebrow">
            {savedOnly ? "SET ASIDE FOR LATER" : "THE MATERIAL BOARD"}
          </p>
          <h1>
            {savedOnly ? (
              <>
                Your saved finds.
                <br />
                <span>Ready when you are.</span>
              </>
            ) : (
              <>
                Good materials.
                <br />
                <span>A second beginning.</span>
              </>
            )}
          </h1>
        </div>
        <div className="board-heading-note">
          <span className="small-mark">↗</span>
          <p>
            Left after an event.
            <br />
            Useful for your next one.
          </p>
          <Link href="/board/listings/new">Have a batch to offer?</Link>
        </div>
      </div>
      {!savedOnly && (
        <div className="category-rail" aria-label="Material categories">
          {categoryArt.map((c) => (
            <button
              key={c.label}
              aria-pressed={selected.includes(c.label)}
              onClick={() => {
                setSelected(
                  selected.includes(c.label)
                    ? selected.filter((s) => s !== c.label)
                    : [...selected, c.label],
                );
                setLimit(12);
              }}
            >
              <MaterialArt art={c.art} name={c.label} />
              <span>{c.label === "Paper" ? "Paper & packaging" : c.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="board-section-head">
        <h2>
          {savedOnly ? "Keep the good finds close." : "On the board."}{" "}
          <span>
            {savedOnly
              ? "Your own collection."
              : "Find a batch with a next use."}
          </span>
        </h2>
        <span>
          {items.length} {items.length === 1 ? "batch" : "batches"}
        </span>
      </div>
      <div className="board-filters">
        <label className="board-search">
          <span className="sr-only">
            Search materials, events or localities
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="8"
              cy="8"
              r="5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path d="m12 12 5 5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          <input
            placeholder="Search materials, events or localities"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(12);
            }}
          />
        </label>
        <select
          aria-label="Filter category"
          value=""
          onChange={(e) => {
            const c = e.target.value as Category;
            if (c && !selected.includes(c)) setSelected([...selected, c]);
          }}
        >
          <option value="">
            Categories {selected.length ? `(${selected.length})` : ""}
          </option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Filter purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        >
          <option value="">Reuse + recycle</option>
          <option>Reuse</option>
          <option>Recycle</option>
        </select>
        <select
          aria-label="Filter price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        >
          <option value="">Any price</option>
          <option value="free">Free</option>
          <option value="paid">Priced</option>
        </select>
        <select
          aria-label="Filter locality"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">All localities</option>
          {[...new Set(state.events.map((e) => e.area))].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select
          aria-label="Sort materials"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="ending">Ending soon</option>
        </select>
      </div>
      {(query || selected.length || purpose || price || area) && (
        <div className="active-filters">
          {selected.map((c) => (
            <button
              key={c}
              onClick={() => setSelected(selected.filter((s) => s !== c))}
            >
              {c} ×
            </button>
          ))}
          <button onClick={clear}>Clear filters</button>
        </div>
      )}
      {items.length ? (
        <div className="board-grid">
          {items.slice(0, limit).map((i) => (
            <ItemCard item={i} key={i.id} />
          ))}
        </div>
      ) : (
        <Empty
          title={
            savedOnly
              ? "Nothing saved here yet."
              : "No batches match this search."
          }
          text={
            savedOnly
              ? "Save materials from the board to keep them here."
              : "Try a different locality or clear your filters."
          }
          href={savedOnly ? "/board" : undefined}
          label="Explore materials"
        />
      )}
      {items.length > limit && (
        <div className="load-more">
          <button
            className="board-button secondary"
            onClick={() => setLimit(limit + 12)}
          >
            Show more materials
          </button>
        </div>
      )}
      {!savedOnly && (
        <div className="board-bottom-note">
          <p>Clearing an event space?</p>
          <h2>Someone could use what’s left.</h2>
          <Link className="board-button" href="/board/listings/new">
            List your materials ↗
          </Link>
        </div>
      )}
    </>
  );
}
