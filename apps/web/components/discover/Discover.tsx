"use client";
import { Button, Input } from "@/components/ui/Controls";
import Link from "next/link";
import FilterPanel from "./FilterPanel";
import type { DiscoverProps, MaterialFilters } from "@/types/discover/type";
import { useState } from "react";
import { itemStatus, type Art, type Category } from "@/lib/reclaim";
import { useBoard } from "@/components/marketplace/Store";
import { Empty, ItemCard } from "@/components/materials/Cards";
import MaterialArt from "@/components/materials/MaterialArt";

const categoryArt: { label: Category; art: Art }[] = [
  { label: "Wood", art: "boards" },
  { label: "Paper", art: "boxes" },
  { label: "Plants", art: "pots" },
  { label: "Cloth", art: "cloth" },
  { label: "Decor", art: "stand" },
  { label: "Metal", art: "metal" },
];
export default function Discover({ savedOnly = false }: DiscoverProps) {
  const { currentUserId, state } = useBoard();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Category[]>([]);
  const [purpose, setPurpose] = useState<MaterialFilters["purpose"]>("");
  const [price, setPrice] = useState<MaterialFilters["price"]>("");
  const [area, setArea] = useState("");
  const [sort, setSort] = useState<MaterialFilters["sort"]>("newest");
  const [limit, setLimit] = useState(12);
  function clear() {
    setQuery("");
    setSelected([]);
    setPurpose("");
    setPrice("");
    setArea("");
    setSort("newest");
    setLimit(12);
  }
  const items = state.items
    .filter((i) => {
      const e = state.events.find((e) => e.id === i.eventId)!;
      return (
        (savedOnly
          ? state.saved.includes(i.id)
          : itemStatus(i) === "Available" && e.ownerId !== currentUserId) &&
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
      sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
    );
  return (
    <>
      <div className="board-heading flex items-center justify-between gap-12 pb-8 pt-12 lg:pt-16 [&_h1]:text-4xl [&_h1]:font-normal [&_h1]:leading-[1.08] [&_h1]:tracking-tight lg:[&_h1]:text-6xl [&_h1_span]:text-muted">
        <div>
          <p className="board-eyebrow mb-4 font-mono text-[11px] tracking-wide text-muted">
            {savedOnly ? "SET ASIDE FOR LATER" : "DISCOVER MATERIALS"}
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
        <div className="board-heading-note hidden min-w-56 text-sm lg:block [&_p]:my-3 [&_p]:text-muted [&_a]:text-blue">
          <span className="small-mark text-2xl text-blue">↗</span>
          <p>
            Left after an event.
            <br />
            Useful for your next one.
          </p>
          <Link href="/dashboard/listings/new">Have a batch to offer?</Link>
        </div>
      </div>
      {!savedOnly && (
        <div
          className="category-rail grid grid-cols-3 gap-x-3 gap-y-4 pb-6 pt-2 sm:grid-cols-6 lg:gap-6 lg:pb-12 [&_button]:min-w-0 [&_button]:rounded-lg [&_button]:px-1 [&_button]:pb-2 [&_button]:text-center [&_button]:text-sm [&_button]:text-muted [&_button[aria-pressed=true]]:bg-[var(--blue-faint)] [&_button[aria-pressed=true]]:text-blue [&_.material-art]:h-20 [&_.material-art]:bg-transparent lg:[&_.material-art]:h-32"
          aria-label="Material categories"
        >
          {categoryArt.map((c) => (
            <Button
              key={c.label}
              className="group"
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
              <span>{c.label}</span>
            </Button>
          ))}
        </div>
      )}
      <div className="board-section-head my-6 flex items-start justify-between gap-6 [&_h2]:text-2xl [&_h2]:font-normal [&_h2_span]:text-muted lg:[&_h2]:text-[28px] [&_h2_span]:block lg:[&_h2_span]:inline [&_span:last-child]:text-muted">
        <h2>
          {savedOnly ? "Keep the good finds close." : "Available now."}{" "}
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
      <div className="board-filters mb-6 flex items-stretch gap-3">
        <label className="board-search flex flex-1 min-h-11 min-w-0 items-center gap-3 rounded-lg border border-[var(--field-line)] px-4 text-muted focus-within:border-blue lg:flex-1">
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
          <Input
            unstyled
            placeholder="Search materials, events or localities"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(12);
            }}
          />
        </label>
        <FilterPanel
          value={{ categories: selected, purpose, price, area, sort }}
          localities={[...new Set(state.events.map((event) => event.area))]}
          onApply={(filters) => {
            setSelected(filters.categories);
            setPurpose(filters.purpose);
            setPrice(filters.price);
            setArea(filters.area);
            setSort(filters.sort);
            setLimit(12);
          }}
        />
      </div>
      {(query ||
        selected.length ||
        purpose ||
        price ||
        area ||
        sort !== "newest") && (
        <div className="active-filters mb-6 flex flex-wrap gap-3 [&_button]:min-h-10 [&_button]:rounded-lg [&_button]:bg-[var(--blue-faint)] [&_button]:px-3 [&_button]:text-sm [&_button]:text-blue">
          {selected.map((c) => (
            <Button
              key={c}
              aria-label={`Remove ${c} filter`}
              onClick={() => setSelected(selected.filter((s) => s !== c))}
            >
              {c} ×
            </Button>
          ))}
          {purpose && (
            <Button
              aria-label="Remove next use filter"
              onClick={() => setPurpose("")}
            >
              {purpose} ×
            </Button>
          )}
          {price && (
            <Button
              aria-label="Remove price filter"
              onClick={() => setPrice("")}
            >
              {price === "free" ? "Free" : "Priced"} ×
            </Button>
          )}
          {area && (
            <Button
              aria-label="Remove locality filter"
              onClick={() => setArea("")}
            >
              {area} ×
            </Button>
          )}
          {sort === "oldest" && (
            <Button
              aria-label="Reset sort to newest first"
              onClick={() => setSort("newest")}
            >
              Ending soon ×
            </Button>
          )}
          <Button onClick={clear}>Clear filters</Button>
        </div>
      )}
      {items.length ? (
        <div className="board-grid grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10">
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
          href={savedOnly ? "/dashboard" : undefined}
          label="Explore materials"
        />
      )}
      {items.length > limit && (
        <div className="load-more my-10 text-center">
          <Button variant="secondary" onClick={() => setLimit(limit + 12)}>
            Show more materials
          </Button>
        </div>
      )}
      {!savedOnly && (
        <div className="board-bottom-note mt-16 rounded-2xl bg-[var(--blue-faint)] p-6 lg:p-12 [&_p]:mb-3 [&_p]:text-muted [&_h2]:mb-6 [&_h2]:text-3xl [&_h2]:font-normal lg:[&_h2]:text-4xl">
          <p>Clearing an event space?</p>
          <h2>Someone could use what’s left.</h2>
          <Link
            className="board-button inline-flex min-h-11 items-center justify-center gap-6 rounded-lg bg-blue px-4 py-3 text-sm font-normal text-[var(--surface)] hover:bg-[var(--blue-hover)] disabled:bg-[var(--blue-faint)] disabled:text-muted"
            href="/dashboard/listings/new"
          >
            List your materials ↗
          </Link>
        </div>
      )}
    </>
  );
}
