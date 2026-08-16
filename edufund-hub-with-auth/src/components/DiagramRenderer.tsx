"use client";

import { useMemo } from "react";
import { sanitizeSvg } from "@/lib/svgSanitize";
import type { QuizDiagram } from "@/lib/types/quiz";

/**
 * Renders a quiz diagram safely. The SVG is re-sanitized client-side
 * even though it was already sanitized server-side/at import time —
 * defence in depth, since the content round-trips through the database
 * as a JSON string and we want to be certain before calling
 * dangerouslySetInnerHTML.
 *
 * Rendered inside a constrained container:
 * - max-width: 100% (never overflows the question card)
 * - overflow: hidden (clips any SVG that tries to paint outside its viewBox)
 * - pointer-events: none (prevents any click/hover handlers that survived
 *   sanitization from doing anything)
 * - user-select: none (prevents students from selecting SVG text and
 *   confusing it with the question/options)
 */
export default function DiagramRenderer({ diagram }: { diagram: QuizDiagram }) {
  const sanitized = useMemo(() => {
    const result = sanitizeSvg(diagram.content);
    return result.ok ? result.svg : null;
  }, [diagram.content]);

  if (!sanitized) return null;

  return (
    <div
      className="my-3 overflow-hidden rounded-lg border border-border bg-surface p-3"
      style={{ pointerEvents: "none", userSelect: "none" }}
      aria-label="Question diagram"
      role="img"
    >
      <div
        className="max-w-full [&>svg]:h-auto [&>svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    </div>
  );
}