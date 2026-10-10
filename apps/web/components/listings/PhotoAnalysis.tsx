"use client";
import { useEffect, useRef, useState } from "react";
import type { PhotoAnalysisResult } from "@repo/domain";
import type { PhotoAnalysisProps } from "@/types/listings/type";
import { Button } from "@/components/ui/Controls";
import { uploadPhoto } from "@/lib/photos";
import { api } from "@/lib/api";

export default function PhotoAnalysis({
  busy,
  onBusyChange,
  onSuggest,
}: PhotoAnalysisProps) {
  const picker = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState("");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(() => () => controller.current?.abort(), []);
  async function analyze() {
    if (!file || busy) return;
    const current = new AbortController();
    controller.current = current;
    onBusyChange(true);
    setAnalyzing(true);
    setMessage("");
    setWarnings([]);
    try {
      const photoUrl = uploaded || (await uploadPhoto(file, current.signal));
      setUploaded(photoUrl);
      const result = await api<PhotoAnalysisResult>("/api/analysis", {
        method: "POST",
        signal: current.signal,
        body: JSON.stringify({ photoId: photoUrl.split("/").at(-1) }),
      });
      if (current.signal.aborted) return;
      onSuggest(result.items);
      setWarnings(result.warnings);
      setMessage(
        `${result.items.length} suggested ${result.items.length === 1 ? "item is" : "items are"} ready to review below.`,
      );
    } catch (error) {
      if (!current.signal.aborted)
        setMessage(
          error instanceof Error
            ? error.message
            : "Photo suggestions could not finish. You can add materials manually.",
        );
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
            Start with a cleanup photo
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Get suggested items from one photo, then edit each listing. You can
            also describe materials yourself below.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            ref={picker}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Choose a cleanup photo"
            disabled={busy}
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setUploaded("");
              setMessage("");
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
            onClick={analyze}
          >
            {analyzing ? "Identifying materials…" : "Identify materials"}
          </Button>
        </div>
      </div>
      {file && (
        <p className="mt-4 break-words text-sm text-muted">{file.name}</p>
      )}
      {message && (
        <p role="status" className="mt-4 text-sm leading-6 text-blue">
          {message}
        </p>
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
