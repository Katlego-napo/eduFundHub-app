"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function DocumentChat({ documentId }: { documentId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, question }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setError("Couldn't reach the AI assistant. Please try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <Sparkles size={15} className="text-secondary" />
          Ask about this document
        </h3>
      </div>

      <div className="flex-1 space-y-3 px-5 py-4" style={{ minHeight: "240px", maxHeight: "420px", overflowY: "auto" }}>
        {messages.length === 0 ? (
          <p className="text-sm text-muted">
            Ask anything about the document — e.g. &ldquo;Summarize section 2&rdquo; or
            &ldquo;Explain question 4&rdquo;.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-primary text-white"
                  : "bg-foreground/5 text-foreground"
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        {loading && (
          <div className="max-w-[85%] rounded-xl bg-foreground/5 px-4 py-2.5 text-sm text-muted">
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-5 pb-2 text-sm text-red-600">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this document..."
          className="flex-1 rounded-full bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-secondary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
