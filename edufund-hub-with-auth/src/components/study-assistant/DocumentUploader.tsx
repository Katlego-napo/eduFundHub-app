"use client";

import { useState } from "react";
import { UploadCloud, FileText } from "lucide-react";
import type { StudyDocument } from "@/lib/types/studyDocument";

export default function DocumentUploader({
  onUploaded,
}: {
  onUploaded: (doc: StudyDocument) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ai/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      onUploaded(data.document as StudyDocument);
      setFile(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-foreground">
        Upload a document to get started
      </h2>
      <p className="mt-1 text-sm text-muted">
        Upload your notes, a past paper, or a textbook chapter (PDF, max 10MB) and
        ask questions or generate a practice quiz from it.
      </p>

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-8 text-sm text-muted transition-colors hover:border-secondary">
        <UploadCloud size={18} />
        {file ? file.name : "Click to select a PDF"}
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
      >
        <FileText size={16} />
        {loading ? "Processing document..." : "Upload & Analyze"}
      </button>
    </div>
  );
}
