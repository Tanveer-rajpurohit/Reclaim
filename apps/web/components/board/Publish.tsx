"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories, type Category, type ItemDraft } from "../../lib/reclaim";
import { useBoard } from "./Store";
import MaterialArt from "./MaterialArt";
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
async function resizePhoto(file: File): Promise<string> {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10_000_000
  )
    throw new Error("Use a JPG, PNG or WebP photo smaller than 10 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Photo resizing is unavailable. Try another browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    bitmap.close();
  }
}
export default function Publish() {
  const { state, run } = useBoard();
  const router = useRouter();
  const [items, setItems] = useState<ItemDraft[]>([{ ...blank }]);
  const [eventName, setEventName] = useState("");
  const [area, setArea] = useState("");
  const [start, setStart] = useState(() => inputTime(Date.now()));
  const [end, setEnd] = useState(() => inputTime(Date.now() + 86_400_000));
  const [pickupNote, setPickupNote] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [safe, setSafe] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  function update(index: number, changes: Partial<ItemDraft>) {
    setItems((old) =>
      old.map((i, n) => (n === index ? { ...i, ...changes } : i)),
    );
  }
  async function photo(file: File | undefined, index: number) {
    if (!file) return;
    setBusy(true);
    try {
      const image = await resizePhoto(file);
      update(index, { image });
      setMessage(
        "Photo added and resized locally. Fill in the item details below; photo reading is not connected in this demo.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Could not read that photo.",
      );
    } finally {
      setBusy(false);
    }
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
    setEventName("Campus Fest Cleanup");
    setArea("Rohini");
    setPickupNote(
      "Meet at the public collection desk. Bring transport for your batch.",
    );
    setMessage(
      "Sample suggestions loaded. These are demo items, not an AI reading of your photo. Review every field before publishing.",
    );
  }
  function publish(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      run({
        type: "publish",
        items,
        safe,
        event: {
          name: eventName,
          area,
          availableFrom: Date.parse(start + "+05:30"),
          clearBy: Date.parse(end + "+05:30"),
          pickupNote,
          deliveryNote,
        },
      })
    )
      router.push("/board/listings?published=1");
  }
  return (
    <>
      <Link href="/board/listings" className="board-back">
        ← Your listings
      </Link>
      <div className="page-title">
        <p className="board-eyebrow">MAKE THE BATCH EASY TO COLLECT</p>
        <h1>From the pile to the board.</h1>
        <p>
          Add a photo and describe the materials, or try the sample pile.
          Nothing is listed until you review and publish.
        </p>
      </div>
      <div className="publish-start">
        <div>
          <h2>A photo is a good starting point.</h2>
          <p>Avoid photographing people, phone numbers or private addresses.</p>
        </div>
        <button
          className="board-button secondary"
          onClick={sample}
          disabled={busy}
        >
          Try a sample pile ↗
        </button>
      </div>
      {message && (
        <p className="publish-message" role="status">
          {message}
        </p>
      )}
      <form className="board-form publish-form" onSubmit={publish}>
        <section className="form-panel">
          <h2>01 / Event &amp; collection</h2>
          <div className="form-columns">
            <label>
              Event name
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                minLength={3}
                maxLength={80}
                required
                placeholder="e.g. Neighbourhood Art Fair"
              />
            </label>
            <label>
              Locality
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                minLength={2}
                maxLength={60}
                required
                placeholder="e.g. Rohini"
              />
            </label>
            <label>
              Available from (IST)
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                required
              />
            </label>
            <label>
              Clear by (IST)
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                required
              />
            </label>
            <label>
              Public pickup instructions
              <textarea
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Public meeting point and transport requirements"
              />
            </label>
            <label>
              Delivery note (optional)
              <textarea
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Pickup only, or delivery you can arrange directly"
              />
            </label>
          </div>
        </section>
        <section className="form-panel">
          <div className="page-title-row">
            <h2>02 / Review the items</h2>
            <button
              className="board-button secondary"
              type="button"
              disabled={items.length >= 20 || busy}
              onClick={() => setItems([...items, { ...blank }])}
            >
              Add another item +
            </button>
          </div>
          <div className="draft-list">
            {items.map((item, index) => (
              <article className="draft-item" key={index}>
                <div className="draft-photo">
                  {item.image ? (
                    <MaterialArt
                      art={item.art}
                      name={item.name || "Item photo"}
                      image={item.image}
                    />
                  ) : (
                    <div className="photo-placeholder">
                      <span>0{index + 1}</span>
                      <p>Add a clear photo</p>
                    </div>
                  )}
                  <label className="photo-upload">
                    {item.image ? "Replace photo" : "Add from photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy}
                      onChange={(e) => void photo(e.target.files?.[0], index)}
                    />
                  </label>
                  <p className="form-hint">
                    {item.image === "demo"
                      ? "Sample illustration"
                      : "Resized locally. Metadata removed."}
                  </p>
                </div>
                <div className="draft-fields">
                  <div className="form-columns">
                    <label>
                      Item name
                      <input
                        value={item.name}
                        onChange={(e) =>
                          update(index, { name: e.target.value })
                        }
                        required
                        minLength={3}
                        maxLength={80}
                      />
                    </label>
                    <label>
                      Category
                      <select
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
                      </select>
                    </label>
                    <label>
                      Next use
                      <select
                        value={item.purpose}
                        onChange={(e) =>
                          update(index, {
                            purpose: e.target.value as ItemDraft["purpose"],
                          })
                        }
                      >
                        <option>Reuse</option>
                        <option>Recycle</option>
                      </select>
                    </label>
                    <label>
                      Condition
                      <select
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
                      </select>
                    </label>
                    <label>
                      Quantity
                      <input
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
                    <label>
                      Unit
                      <select
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
                      </select>
                    </label>
                    <label>
                      Price for whole batch (₹)
                      <input
                        type="number"
                        min={0}
                        max={1_000_000}
                        value={item.price}
                        onChange={(e) =>
                          update(index, { price: Number(e.target.value) })
                        }
                        required
                      />
                      <span className="form-hint">
                        0 means free. Payment happens outside Reclaim.
                      </span>
                    </label>
                    <label>
                      Hazards / handling
                      <input
                        value={item.hazards}
                        onChange={(e) =>
                          update(index, { hazards: e.target.value })
                        }
                        maxLength={300}
                        placeholder="Nails, glass, heavy items…"
                      />
                    </label>
                  </div>
                  <label>
                    Description
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        update(index, { description: e.target.value })
                      }
                      maxLength={600}
                      rows={2}
                      placeholder="Size, damage and what is included"
                    />
                  </label>
                  <button
                    className="text-button"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      setItems(items.filter((_, n) => n !== index))
                    }
                  >
                    Remove this item
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <div className="publish-bar">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={safe}
              onChange={(e) => setSafe(e.target.checked)}
              required
            />
            I reviewed every item. This batch has no chemicals, hazardous
            batteries, illegal goods or unsafe waste.
          </label>
          <button
            className="board-button"
            type="submit"
            disabled={busy || items.length === 0}
          >
            {busy
              ? "Preparing photo…"
              : `Publish ${items.length} ${items.length === 1 ? "item" : "items"}`}{" "}
            ↗
          </button>
        </div>
      </form>
    </>
  );
}
