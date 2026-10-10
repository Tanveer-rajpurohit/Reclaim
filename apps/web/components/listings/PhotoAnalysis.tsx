"use client";
import { useEffect, useRef, useState } from "react";
import type { PhotoAnalysisProps } from "@/types/listings/type";
import { Button } from "@/components/ui/Controls";
import { usePhotoAnalysis, usePhotoUpload } from "@/hooks/usePhotos";

export default function PhotoAnalysis({
  busy,
  onBusyChange,
  onSuggest,
}: PhotoAnalysisProps) {
  const picker = useRef<HTMLInputElement>(null);
  const analysis = usePhotoAnalysis();
  const upload = usePhotoUpload();
  const controller = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState("");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(() => () => controller.current?.abort(), []);
  async function analyze(manual = false) {
    if (!file || busy) return;
    const current = new AbortController();
    controller.current = current;
    onBusyChange(true);
    setAnalyzing(true);
    setMessage("");
    setFailed(false);
    setWarnings([]);
    try {
      const photoUrl =
        uploaded ||
        (await upload.mutateAsync({ file, signal: current.signal }));
      setUploaded(photoUrl);
      if (manual) {
        onSuggest([
          {
            name: "",
            description: "",
            category: "Wood",
            purpose: "Reuse",
            quantity: 1,
            unit: "pieces",
            condition: "Fair",
            price: 0,
            hazards: "",
            art: "boards",
            image: photoUrl,
            images: [],
          },
        ]);
        setMessage(
          "Your photo is added below. Enter the item name and check the details.",
        );
        return;
      }
      const result = await analysis.mutateAsync({
        photoUrl,
        signal: current.signal,
      });
      if (current.signal.aborted) return;
      onSuggest(result.items);
      setWarnings(result.warnings);
      setMessage(
        `${result.items.length} suggested ${result.items.length === 1 ? "item is" : "items are"} ready to review below.`,
      );
    } catch (error) {
      if (!current.signal.aborted) {
        setFailed(true);
        setMessage(
          error instanceof Error
            ? error.message
            : "We couldn't read this photo. Try again or enter the item details below.",
        );
      }
    } finally {
      controller.current = null;
      setAnalyzing(false);
      onBusyChange(false);
    }
  }
  return (
    <section
      aria-labelledby="photo-analysis-title"
      aria-busy={analyzing}
      className="mb-8 rounded-xl border border-line bg-[var(--surface)] p-5 lg:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <h2 id="photo-analysis-title" className="text-xl tracking-tight">
            Add items from a photo
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Choose a photo, then select Find items in photo. We will fill in
            item names and details for you to check. Or fill in the form below
            yourself. JPG, PNG or WebP, up to 10 MB.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            ref={picker}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Choose a photo to find items"
            disabled={busy}
            onChange={(event) => {
              const selected = event.target.files?.[0] || null;
              setFile(selected);
              setPreview(selected ? URL.createObjectURL(selected) : "");
              setUploaded("");
              setMessage("");
              setFailed(false);
              setWarnings([]);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => picker.current?.click()}
          >
            {file ? "Change photo" : "Choose photo"}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy || !file}
            onClick={() => void analyze()}
          >
            {analyzing ? "Reading your photo…" : "Find items in photo"}
          </Button>
        </div>
      </div>
      {file && (
        <div className="mt-5 flex items-center gap-4">
          {preview && (
            // A local file preview cannot be fetched by the Next.js image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Selected photo"
              className="h-24 w-32 rounded-lg object-contain bg-[var(--surface-soft)]"
            />
          )}
          <p className="min-w-0 break-words text-sm text-muted">{file.name}</p>
        </div>
      )}
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={`mt-4 text-sm leading-6 ${failed ? "text-[var(--danger)]" : "text-blue"}`}
        >
          {message}
        </p>
      )}
      {failed && uploaded && (
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          disabled={busy}
          onClick={() => void analyze(true)}
        >
          Keep photo and enter details
        </Button>
      )}
      {warnings.length > 0 && (
        <ul
          aria-label="Things to review"
          className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"
        >
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
