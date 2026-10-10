"use client";
import { Button, Input } from "@/components/ui/Controls";
import { useRef, useState } from "react";
import type { PhotoGalleryProps } from "@/types/materials/type";
import { usePhotoUpload } from "@/hooks/usePhotos";
import MaterialArt from "@/components/materials/MaterialArt";

export default function PhotoGallery({
  image,
  images = [],
  art,
  name,
  onChange,
  onBusyChange,
  disabled = false,
}: PhotoGalleryProps) {
  const [active, setActive] = useState(0);
  const photoUpload = usePhotoUpload();
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
      const resized = await Promise.all(
        chosen.map((file) => photoUpload.mutateAsync({ file })),
      );
      const next = [...all, ...resized];
      if (next[0] && (await onChange(next[0], next.slice(1))) !== false)
        setActive(0);
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
  async function cover() {
    const photo = all[selected];
    if (!photo || !onChange) return;
    if (
      (await onChange(
        photo,
        all.filter((_, index) => index !== selected),
      )) !== false
    )
      setActive(0);
  }
  async function remove() {
    if (!onChange) return;
    const next = all.filter((_, i) => i !== selected);
    if ((await onChange(next[0] || "", next.slice(1))) !== false) setActive(0);
  }
  return (
    <div className="photo-gallery min-w-0">
      <div className="gallery-cover isolate overflow-hidden rounded-xl bg-[var(--surface-soft)] [&_.material-art]:aspect-[4/3]">
        {all[selected] ? (
          <MaterialArt
            art={art}
            name={name || "Material photo"}
            image={all[selected]}
          />
        ) : (
          <div className="photo-placeholder grid aspect-[4/3] place-content-center gap-2 bg-[var(--blue-faint)] px-4 text-center text-muted [&_span]:text-xs [&_p]:text-sm">
            <p>Add a clear cover photo</p>
            <span>JPG, PNG or WebP · up to 10 MB each</span>
          </div>
        )}
      </div>
      {all.length > 0 && (
        <div
          className="gallery-thumbnails mt-4 flex flex-wrap gap-3 [&_button]:w-20 [&_button]:overflow-hidden [&_button]:rounded-lg [&_button]:border [&_button]:border-[var(--field-line)] [&_button]:bg-[var(--surface)] [&_button]:p-1 [&_button]:text-muted [&_[aria-pressed=true]]:border-2 [&_[aria-pressed=true]]:border-blue [&_[aria-pressed=true]]:p-[3px] [&_[aria-pressed=true]]:text-blue [&_.material-art]:rounded [&_span]:block [&_span]:py-1 [&_span]:text-xs"
          aria-label="Product photos"
        >
          {all.map((photo, index) => (
            <Button
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
            </Button>
          ))}
        </div>
      )}
      {onChange && (
        <>
          <div className="gallery-actions mb-3 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || disabled || all.length >= 5}
              onClick={() => picker.current?.click()}
            >
              {busy
                ? "Preparing photos…"
                : all.length
                  ? "Add photos +"
                  : "Add cover photo +"}
            </Button>
            {selected > 0 && (
              <Button
                type="button"
                className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
                disabled={busy || disabled}
                onClick={cover}
              >
                Make cover
              </Button>
            )}
            {all.length > 1 && (
              <Button
                type="button"
                className="text-button inline-flex min-h-10 items-center gap-2 rounded px-1 py-2 text-sm text-blue hover:underline hover:underline-offset-4"
                disabled={busy || disabled}
                onClick={remove}
              >
                Remove photo
              </Button>
            )}
          </div>
          <Input
            hidden
            type="file"
            ref={picker}
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy || disabled}
            aria-label="Upload product photos"
            onChange={(e) => void upload(e.target.files)}
          />
          <p className="form-hint text-sm leading-relaxed text-muted">
            One cover + up to 4 extra photos. Uploaded photos are checked and
            resized.
          </p>
        </>
      )}
      {error && (
        <p
          className="gallery-error mt-3 text-sm leading-relaxed text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
