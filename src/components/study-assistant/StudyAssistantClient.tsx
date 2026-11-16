"use client";

import { useState } from "react";
import DocumentUploader from "@/components/study-assistant/DocumentUploader";
import DocumentChat from "@/components/study-assistant/DocumentChat";
import QuizGenerator from "@/components/study-assistant/QuizGenerator";
import type { StudyDocument } from "@/lib/types/studyDocument";
import { FileText, X, Trash2 } from "lucide-react";

export default function StudyAssistantClient({
  initialDocuments,
}: {
  initialDocuments: StudyDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [activeDoc, setActiveDoc] = useState<StudyDocument | null>(
    initialDocuments[0] ?? null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleUploaded(doc: StudyDocument) {
    setDocuments((prev) => [doc, ...prev]);
    setActiveDoc(doc);
  }

  async function handleDelete(doc: StudyDocument) {
    const confirmed = window.confirm(
      `Delete "${doc.file_name}"? This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingId(doc.id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/ai/documents/${doc.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error ?? "Couldn't delete this document.");
        return;
      }

      setDocuments((prev) => {
        const next = prev.filter((d) => d.id !== doc.id);
        setActiveDoc((current) => (current?.id === doc.id ? next[0] ?? null : current));
        return next;
      });
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {documents.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeDoc?.id === doc.id
                  ? "bg-primary text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10"
              }`}
            >
              <button
                onClick={() => setActiveDoc(doc)}
                className="flex items-center gap-1.5"
              >
                <FileText size={13} />
                {doc.file_name}
              </button>
              <button
                onClick={() => handleDelete(doc)}
                disabled={deletingId === doc.id}
                aria-label={`Delete ${doc.file_name}`}
                className={`rounded-full p-0.5 transition-colors ${
                  activeDoc?.id === doc.id
                    ? "hover:bg-white/20"
                    : "hover:bg-foreground/10"
                } disabled:opacity-50`}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {!activeDoc ? (
        <DocumentUploader onUploaded={handleUploaded} />
      ) : (
        <div>
          <div className="mb-6">
            <DocumentUploader onUploaded={handleUploaded} />
          </div>

          {documents.length === 1 && (
            <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText size={15} className="text-primary" />
                {activeDoc.file_name}
              </div>
              <button
                onClick={() => handleDelete(activeDoc)}
                disabled={deletingId === activeDoc.id}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deletingId === activeDoc.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DocumentChat documentId={activeDoc.id} />
            <QuizGenerator documentId={activeDoc.id} />
          </div>
        </div>
      )}
    </div>
  );
}