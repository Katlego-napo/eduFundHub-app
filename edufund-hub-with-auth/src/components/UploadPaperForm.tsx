"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUBJECTS, GRADE_LEVELS } from "@/lib/types/pastPaper";
import { UploadCloud } from "lucide-react";

export default function UploadPaperForm() {
  const router = useRouter();
  const supabase = createClient();

  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [grade, setGrade] = useState<string>(GRADE_LEVELS[0]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [memoFile, setMemoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function uploadFile(file: File, prefix: string) {
    const ext = file.name.split(".").pop();
    const path = `${prefix}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("past-papers")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("past-papers").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!paperFile) {
      setError("Please select the past paper PDF.");
      return;
    }
    if (paperFile.type !== "application/pdf") {
      setError("Past paper must be a PDF file.");
      return;
    }
    if (memoFile && memoFile.type !== "application/pdf") {
      setError("Memorandum must be a PDF file.");
      return;
    }

    setLoading(true);
    try {
      const paperUrl = await uploadFile(paperFile, "papers");
      const memoUrl = memoFile ? await uploadFile(memoFile, "memos") : null;

      const { error: insertError } = await supabase.from("past_papers").insert({
        subject,
        grade,
        year,
        paper_url: paperUrl,
        memo_url: memoUrl,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setPaperFile(null);
      setMemoFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-foreground">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Grade / Level</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2000"
            max="2030"
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">
          Past Paper (PDF) <span className="text-red-500">*</span>
        </label>
        <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-6 text-sm text-muted transition-colors hover:border-secondary">
          <UploadCloud size={18} />
          {paperFile ? paperFile.name : "Click to select PDF"}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPaperFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">
          Memorandum (PDF, optional)
        </label>
        <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-6 text-sm text-muted transition-colors hover:border-secondary">
          <UploadCloud size={18} />
          {memoFile ? memoFile.name : "Click to select PDF"}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setMemoFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-secondary/10 px-3 py-2 text-sm text-foreground">
          Paper uploaded successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Upload Paper"}
      </button>
    </form>
  );
}
