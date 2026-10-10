import { Button, Input, Select, Textarea } from "@/components/ui/Controls";
import { categories } from "@/lib/reclaim";
import type { Category, ItemDraft } from "@/types/materials/type";
import type { MaterialsStepProps } from "@/types/listings/type";
import PhotoGallery from "@/components/materials/PhotoGallery";
import PhotoAnalysis from "./PhotoAnalysis";
export default function MaterialsStep({
  items,
  busy,
  update,
  onAdd,
  onRemove,
  onBusyChange,
  onSuggest,
}: MaterialsStepProps) {
  return (
    <>
      <PhotoAnalysis
        busy={busy}
        onBusyChange={onBusyChange}
        onSuggest={onSuggest}
      />
      <section className="form-panel rounded-xl border border-line bg-[var(--surface)] p-5 lg:p-8 [&_h2]:mb-6 [&_h2]:text-2xl [&_h2]:font-normal">
        <div className="page-title-row flex flex-wrap items-start justify-between gap-6 lg:items-center [&>div>p:last-child]:mt-4 [&>div>p:last-child]:max-w-2xl [&>div>p:last-child]:leading-relaxed [&>div>p:last-child]:text-muted">
          <div>
            <h2>Item details</h2>
            <p>
              Add one type of item per form. For example, list 4 chairs together
              and a table separately.
            </p>
          </div>
          <Button
            variant="secondary"
            type="button"
            disabled={items.length >= 20 || busy}
            onClick={onAdd}
          >
            Add another item +
          </Button>
        </div>
        <div className="draft-list mt-8">
          {items.map((item, index) => (
            <article
              className="draft-item grid min-w-0 gap-6 border-t border-line py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10"
              key={index}
            >
              <div className="draft-photo min-w-0">
                <PhotoGallery
                  image={item.image}
                  images={item.images}
                  art={item.art}
                  name={item.name}
                  onBusyChange={onBusyChange}
                  disabled={busy}
                  onChange={(image, images) => update(index, { image, images })}
                />
              </div>
              <div className="draft-fields grid min-w-0 gap-6 [&>button]:justify-self-start [&>button]:rounded-lg [&>button]:border [&>button]:border-[var(--danger-line)] [&>button]:bg-[var(--danger-soft)] [&>button]:px-4 [&>button]:py-3 [&>button]:text-[var(--danger)]">
                <div className="form-columns grid min-w-0 gap-6 md:grid-cols-2 md:gap-x-8">
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    Item name
                    <Input
                      placeholder="e.g. Wooden chairs or Cardboard boxes"
                      disabled={busy}
                      value={item.name}
                      onChange={(e) => update(index, { name: e.target.value })}
                      required
                      minLength={3}
                      maxLength={80}
                    />
                  </label>
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    Category
                    <Select
                      disabled={busy}
                      aria-label="Material category"
                      value={item.category}
                      onChange={(e) =>
                        update(index, {
                          category: e.target.value as Category,
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </label>
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    How can it be used?
                    <Select
                      disabled={busy}
                      value={item.purpose}
                      onChange={(e) =>
                        update(index, {
                          purpose: e.target.value as ItemDraft["purpose"],
                        })
                      }
                    >
                      <option value="Reuse">Use it again</option>
                      <option value="Recycle">Recycle the material</option>
                    </Select>
                  </label>
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    Condition
                    <Select
                      disabled={busy}
                      value={item.condition}
                      onChange={(e) =>
                        update(index, {
                          condition: e.target.value as ItemDraft["condition"],
                        })
                      }
                    >
                      <option>Good</option>
                      <option>Fair</option>
                      <option>Poor</option>
                    </Select>
                  </label>
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    How many or how much?
                    <Input
                      disabled={busy}
                      type="number"
                      min={item.unit === "kg" ? 0.01 : 1}
                      step={item.unit === "kg" ? 0.01 : 1}
                      value={item.quantity}
                      onChange={(e) =>
                        update(index, { quantity: Number(e.target.value) })
                      }
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    Count or weight
                    <Select
                      disabled={busy}
                      value={item.unit}
                      onChange={(e) =>
                        update(index, {
                          unit: e.target.value as ItemDraft["unit"],
                        })
                      }
                    >
                      <option>pieces</option>
                      <option>bundles</option>
                      <option>kg</option>
                    </Select>
                  </label>
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    Total price for this item (₹)
                    <Input
                      disabled={busy}
                      type="number"
                      min={0}
                      max={1_000_000}
                      value={item.price}
                      onChange={(e) =>
                        update(index, { price: Number(e.target.value) })
                      }
                      required
                    />
                    <span className="form-hint text-sm leading-relaxed text-muted">
                      Price for the full quantity above. Enter 0 to give it
                      away. Arrange payment directly with the buyer.
                    </span>
                  </label>
                  <label className="grid gap-2 text-sm leading-relaxed text-ink">
                    Safety notes (optional)
                    <Input
                      disabled={busy}
                      value={item.hazards}
                      onChange={(e) =>
                        update(index, { hazards: e.target.value })
                      }
                      maxLength={600}
                      placeholder="e.g. Sharp nails, broken glass, or too heavy for one person"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm leading-relaxed text-ink">
                  Item details (optional)
                  <Textarea
                    disabled={busy}
                    value={item.description}
                    onChange={(e) =>
                      update(index, { description: e.target.value })
                    }
                    maxLength={600}
                    rows={2}
                    placeholder="e.g. 4 wooden chairs, used once. One has a loose leg."
                  />
                </label>
                <Button
                  className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(index)}
                >
                  Remove item
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
