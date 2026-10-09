"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Checkbox, Select } from "@/components/ui/Controls";
import { categories } from "@/lib/reclaim";
import type { FilterPanelProps, MaterialFilters } from "@/types/discover/type";
import Icon from "@/components/ui/Icon";
import PageMotion from "@/components/ui/PageMotion";
const empty: MaterialFilters = {
  categories: [],
  purpose: "",
  price: "",
  area: "",
  sort: "newest",
};
export default function FilterPanel({
  value,
  localities,
  onApply,
}: FilterPanelProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  const count =
    value.categories.length +
    Number(Boolean(value.purpose)) +
    Number(Boolean(value.price)) +
    Number(Boolean(value.area)) +
    Number(value.sort !== "newest");
  function close() {
    dialog.current?.close();
    setOpen(false);
  }
  function show() {
    setDraft(value);
    setOpen(true);
    dialog.current?.showModal();
  }
  return (
    <>
      <Button
        variant="secondary"
        aria-label={count ? `Filters, ${count} active` : "Filters"}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        onClick={show}
        className="shrink-0 gap-2! px-3! py-2.5! sm:gap-3! sm:px-4!"
      >
        <Icon name="filters" />
        <span className="sr-only sm:not-sr-only">Filters</span>
        {count > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-[var(--blue-faint)] text-xs">
            {count}
          </span>
        )}
      </Button>
      <dialog
        ref={dialog}
        id={id}
        aria-labelledby={id + "-title"}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full max-w-md border-0 bg-[var(--surface)] p-0 text-ink backdrop:bg-ink/25 open:flex open:flex-col"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 id={id + "-title"} className="text-2xl tracking-tight">
              Find your next batch.
            </h2>
            <p className="mt-2 text-sm text-muted">
              A few details to narrow the board.
            </p>
          </div>
          <Button
            className="ml-3 grid size-11 shrink-0 place-items-center rounded-lg text-2xl hover:bg-[var(--blue-faint)]"
            aria-label="Close filters"
            onClick={close}
          >
            ×
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {open && (
            <PageMotion>
              <fieldset className="mb-8">
                <legend className="mb-4 text-base">Material category</legend>
                <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
                    >
                      <Checkbox
                        checked={draft.categories.includes(category)}
                        onChange={(event) =>
                          setDraft((old) => ({
                            ...old,
                            categories: event.target.checked
                              ? [...old.categories, category]
                              : old.categories.filter(
                                  (item) => item !== category,
                                ),
                          }))
                        }
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mb-8 border-t border-line pt-6">
                <legend className="float-left mb-4 w-full text-base">
                  Next use
                </legend>
                <div className="clear-both flex flex-wrap gap-2">
                  {(["", "Reuse", "Recycle"] as const).map((purpose) => (
                    <Button
                      key={purpose}
                      onClick={() => setDraft((old) => ({ ...old, purpose }))}
                      aria-pressed={draft.purpose === purpose}
                      className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${draft.purpose === purpose ? "border-[var(--field-line)] bg-[var(--blue-faint)] text-blue" : "border-line hover:bg-[var(--surface-soft)]"}`}
                    >
                      {purpose || "Any use"}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mb-8 border-t border-line pt-6">
                <legend className="float-left mb-4 w-full text-base">
                  Batch price
                </legend>
                <div className="clear-both flex flex-wrap gap-2">
                  {(["", "free", "paid"] as const).map((price) => (
                    <Button
                      key={price}
                      onClick={() => setDraft((old) => ({ ...old, price }))}
                      aria-pressed={draft.price === price}
                      className={`min-h-11 rounded-lg border px-4 py-2 text-sm ${draft.price === price ? "border-[var(--field-line)] bg-[var(--blue-faint)] text-blue" : "border-line hover:bg-[var(--surface-soft)]"}`}
                    >
                      {price === "free"
                        ? "Free"
                        : price === "paid"
                          ? "Priced"
                          : "Any price"}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <label className="mb-8 grid gap-3 border-t border-line pt-6 text-base">
                Pickup locality
                <Select
                  value={draft.area}
                  onChange={(event) =>
                    setDraft((old) => ({ ...old, area: event.target.value }))
                  }
                >
                  <option value="">All localities</option>
                  {localities.map((area) => (
                    <option key={area}>{area}</option>
                  ))}
                </Select>
              </label>
              <fieldset className="border-t border-line pt-6">
                <legend className="float-left mb-4 w-full text-base">
                  Show first
                </legend>
                <div className="clear-both grid gap-2">
                  {(["newest", "ending"] as const).map((sort) => (
                    <label
                      key={sort}
                      className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
                    >
                      <input
                        type="radio"
                        name={id + "sort"}
                        value={sort}
                        checked={draft.sort === sort}
                        onChange={() => setDraft((old) => ({ ...old, sort }))}
                        className="size-4 accent-blue outline-none focus-visible:outline-none"
                      />
                      {sort === "newest"
                        ? "Recently listed"
                        : "Pickup ending soon"}
                    </label>
                  ))}
                </div>
              </fieldset>
            </PageMotion>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4 border-t border-line px-6 py-5">
          <Button
            className="min-h-12 px-2 text-sm text-muted hover:text-blue"
            onClick={() => setDraft(empty)}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            className="min-h-12 flex-1"
            onClick={() => {
              onApply(draft);
              close();
            }}
          >
            Apply filters ↗
          </Button>
        </div>
      </dialog>
    </>
  );
}
