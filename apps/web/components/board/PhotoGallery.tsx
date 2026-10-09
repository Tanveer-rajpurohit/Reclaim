"use client";
import { useRef, useState } from "react";
import type { Art } from "../../lib/reclaim";
import { resizePhoto } from "../../lib/photos";
import MaterialArt from "./MaterialArt";

export default function PhotoGallery({
  image,
  images = [],
  art,
  name,
  onChange,
  onBusyChange,
}: {
  image: string;
  images?: string[];
  art: Art;
  name: string;
  onChange?: (image: string, images: string[]) => boolean | void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const all = image ? [image, ...images] : [];
  const selected = Math.min(active, Math.max(0, all.length - 1));
  async function upload(files: FileList | null) {
    if (!files || !onChange) return;
    const chosen = Array.from(files);
    if (chosen.length + all.length > 5) {
      setError("Use one cover photo and up to four extra photos.");
      return;
    }
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const resized = await Promise.all(chosen.map(resizePhoto));
      const next = [...all, ...resized];
      if (next.reduce((sum, photo) => sum + photo.length, 0) > 3_500_000)
        throw new Error(
          "This gallery is too large for the local preview. Use fewer photos.",
        );
      if (next[0] && onChange(next[0], next.slice(1)) !== false) setActive(0);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The photo could not be added.",
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      if (picker.current) picker.current.value = "";
    }
  }
  function cover() {
    const photo = all[selected];
    if (!photo || !onChange) return;
    if (
      onChange(
        photo,
        all.filter((_, index) => index !== selected),
      ) !== false
    )
      setActive(0);
  }
  function remove() {
    if (!onChange) return;
    const next = all.filter((_, i) => i !== selected);
    if (onChange(next[0] || "", next.slice(1)) !== false) setActive(0);
  }
  return (
    <div className="photo-gallery">
      <div className="gallery-cover">
        {all[selected] ? (
          <MaterialArt
            art={art}
            name={name || "Material photo"}
            image={all[selected]}
          />
        ) : (
          <div className="photo-placeholder">
            <p>Add a clear cover photo</p>
            <span>JPG, PNG or WebP · up to 10 MB each</span>
          </div>
        )}
      </div>
      {all.length > 0 && (
        <div className="gallery-thumbnails" aria-label="Product photos">
          {all.map((photo, index) => (
            <button
              type="button"
              key={index}
              aria-label={`View photo ${index + 1}${index === 0 ? ", cover" : ""}`}
              aria-pressed={selected === index}
              onClick={() => setActive(index)}
            >
              <MaterialArt
                art={art}
                name={`Photo ${index + 1}`}
                image={photo}
              />
              <span>{index === 0 ? "Cover" : `Photo ${index + 1}`}</span>
            </button>
          ))}
        </div>
      )}
      {onChange && (
        <>
          <div className="gallery-actions">
            <button
              type="button"
              className="board-button secondary"
              disabled={busy || all.length >= 5}
              onClick={() => picker.current?.click()}
            >
              {busy
                ? "Preparing photos…"
                : all.length
                  ? "Add photos +"
                  : "Add cover photo +"}
            </button>
            {selected > 0 && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={cover}
              >
                Make cover
              </button>
            )}
            {all.length > 0 && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={remove}
              >
                Remove photo
              </button>
            )}
          </div>
          <input
            hidden
            type="file"
            ref={picker}
            accept="image/jpeg,image/png,image/webp"
            multiple
            aria-label="Upload product photos"
            onChange={(e) => void upload(e.target.files)}
          />
          <p className="form-hint">
            One cover + up to 4 extra photos. Photos are resized locally.
          </p>
        </>
      )}
      {error && (
        <p className="gallery-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
