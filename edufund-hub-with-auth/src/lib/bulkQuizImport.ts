export type NormalizedQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  diagram?: { type: "svg"; content: string } | null;
};

export type NormalizedQuiz = {
  title: string;
  topic: string | null;
  questions: NormalizedQuizQuestion[];
};

export type ParsedBulkItem =
  | { ok: true; index: number; quiz: NormalizedQuiz }
  | { ok: false; index: number; label: string; error: string };

export type ParseBulkResult =
  | { ok: true; items: ParsedBulkItem[] }
  | { ok: false; error: string };

/**
 * LaTeX content (e.g. from Gemini) very often arrives with single
 * backslashes ("\sin", "\frac") rather than the double backslashes
 * valid JSON requires ("\\sin"). This normalizes either case to always
 * be properly double-escaped before parsing:
 *
 * 1. Temporarily protects any backslash pair that's already correct
 *    ("\\\\") so it isn't touched.
 * 2. Doubles every remaining single backslash (assumed to be raw LaTeX).
 * 3. Restores the protected pairs.
 *
 * This is more reliable than trying to guess character-by-character
 * whether a backslash is "already escaped", since LaTeX commands
 * overlap heavily with JSON's own escape letters (\b, \f, \n, \r, \t
 * are all valid LaTeX command starts too — \boxed, \frac, \neq,
 * \rightarrow, \tan).
 */
function normalizeLatexBackslashes(raw: string): string {
  const PLACEHOLDER = "\u0000EFH_DOUBLE_BACKSLASH\u0000";
  let s = raw.split("\\\\").join(PLACEHOLDER);
  s = s.split("\\").join("\\\\");
  s = s.split(PLACEHOLDER).join("\\\\");
  return s;
}

function letterToIndex(letter: string, optionCount: number): number | null {
  const trimmed = letter.trim().toUpperCase();
  const index = trimmed.charCodeAt(0) - "A".charCodeAt(0);
  if (trimmed.length === 1 && index >= 0 && index < optionCount) return index;
  return null;
}

async function normalizeQuestion(
  raw: unknown,
  qIndex: number
): Promise<{ ok: true; question: NormalizedQuizQuestion } | { ok: false; error: string }> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: `Question ${qIndex + 1}: not a valid object.` };
  }
  const q = raw as Record<string, unknown>;

  const questionText = q.question;
  if (typeof questionText !== "string" || !questionText.trim()) {
    return { ok: false, error: `Question ${qIndex + 1}: missing question text.` };
  }

  const options = q.options;
  if (
    !Array.isArray(options) ||
    options.length !== 4 ||
    !options.every((o) => typeof o === "string" && o.trim())
  ) {
    return {
      ok: false,
      error: `Question ${qIndex + 1}: needs exactly 4 non-empty options.`,
    };
  }

  let correctIndex: number | null = null;
  if (typeof q.correct_index === "number") {
    correctIndex = q.correct_index;
  } else if (typeof q.correctIndex === "number") {
    correctIndex = q.correctIndex;
  } else if (typeof q.correctAnswer === "string") {
    correctIndex = letterToIndex(q.correctAnswer, options.length);
    // Bonus fallback: if it wasn't a recognizable letter, see if it
    // matches one of the option strings exactly instead.
    if (correctIndex === null) {
      const matchIndex = options.findIndex(
        (o) => o.trim().toLowerCase() === (q.correctAnswer as string).trim().toLowerCase()
      );
      if (matchIndex !== -1) correctIndex = matchIndex;
    }
  } else if (typeof q.answer === "string") {
    correctIndex = letterToIndex(q.answer, options.length);
  }

  if (
    correctIndex === null ||
    correctIndex === undefined ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return {
      ok: false,
      error: `Question ${qIndex + 1}: couldn't determine the correct answer (expected correct_index, correctIndex, or a letter A-D in correctAnswer).`,
    };
  }

  const explanation = typeof q.explanation === "string" ? q.explanation : "";

  // Optional diagram field — questions without it continue to work exactly
  // as before. If present, it must be a valid, sanitized SVG.
  let diagram: { type: "svg"; content: string } | null = null;
  if (q.diagram !== undefined && q.diagram !== null) {
    const raw = q.diagram as Record<string, unknown>;
    // Accept both { type: "svg", content: "..." } and a bare SVG string.
    const svgContent =
      typeof raw.content === "string"
        ? raw.content
        : typeof q.diagram === "string"
        ? (q.diagram as string)
        : null;

    if (!svgContent) {
      return {
        ok: false,
        error: `Question ${qIndex + 1}: diagram must have a "content" field containing SVG markup.`,
      };
    }

    const { sanitizeSvg } = await import("@/lib/svgSanitize");
    const result = sanitizeSvg(svgContent);
    if (!result.ok) {
      return {
        ok: false,
        error: `Question ${qIndex + 1}: invalid diagram — ${result.error}`,
      };
    }
    diagram = { type: "svg", content: result.svg };
  }

  return {
    ok: true,
    question: { question: questionText, options, correctIndex, explanation, diagram },
  };
}

async function normalizeQuizItem(raw: unknown, index: number): Promise<ParsedBulkItem> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, index, label: `Item ${index + 1}`, error: "Not a valid object." };
  }
  const item = raw as Record<string, unknown>;

  const title =
    (typeof item.quiz_title === "string" && item.quiz_title.trim()) ||
    (typeof item.title === "string" && item.title.trim()) ||
    null;
  const label = title || `Item ${index + 1}`;

  if (!title) {
    return { ok: false, index, label, error: "Missing quiz_title (or title)." };
  }

  const questionsRaw = item.questions;
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    return { ok: false, index, label, error: "Missing or empty questions array." };
  }

  const questions: NormalizedQuizQuestion[] = [];
  for (let i = 0; i < questionsRaw.length; i++) {
    const result = await normalizeQuestion(questionsRaw[i], i);
    if (!result.ok) {
      return { ok: false, index, label, error: result.error };
    }
    questions.push(result.question);
  }

  return { ok: true, index, quiz: { title, topic: typeof item.topic === "string" && item.topic.trim() ? item.topic.trim() : null, questions } };
}

export async function parseBulkQuizJson(raw: string): Promise<ParseBulkResult> {
  const normalized = normalizeLatexBackslashes(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown parse error";
    return {
      ok: false,
      error: `Couldn't parse this as JSON: ${message}. Double-check for missing commas, brackets, or quotes.`,
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      error: "Expected a JSON array of quizzes, e.g. [ { \"quiz_title\": ..., \"questions\": [...] } ].",
    };
  }

  if (parsed.length === 0) {
    return { ok: false, error: "The pasted array is empty — nothing to import." };
  }

  const items = await Promise.all(parsed.map((raw, index) => normalizeQuizItem(raw, index)));
  return { ok: true, items };
}