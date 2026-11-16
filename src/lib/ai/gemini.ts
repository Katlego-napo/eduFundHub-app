import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash-lite";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Caps how much document text we send per request, to control token cost.
 * Roughly 4 characters per token, so this keeps requests well within
 * Flash-Lite's context window while bounding spend per call.
 */
const MAX_CONTEXT_CHARS = 60_000;

function truncateContext(text: string): string {
  if (text.length <= MAX_CONTEXT_CHARS) return text;
  return text.slice(0, MAX_CONTEXT_CHARS) + "\n\n[Document truncated for length]";
}

/**
 * The Gemini API occasionally returns a 503 "model is currently experiencing
 * high demand" error. This is a transient overload on Google's side, not a
 * problem with the request — retrying after a short delay almost always
 * succeeds. This wraps any Gemini call with up to 2 retries (3 attempts
 * total) using exponential backoff (1s, then 2s), and only retries on
 * 503/UNAVAILABLE — other errors (bad request, auth, etc.) fail immediately
 * since retrying wouldn't help.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      const isOverloaded = message.includes("503") || message.includes("UNAVAILABLE");

      if (!isOverloaded || attempt === maxRetries) {
        throw err;
      }

      const delayMs = 1000 * Math.pow(2, attempt); // 1s, then 2s
      console.error(
        `Gemini call overloaded (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Unreachable, but keeps TypeScript happy.
  throw lastErr;
}

export async function askQuestionAboutDocument(
  documentText: string,
  question: string
): Promise<string> {
  const ai = getClient();
  const context = truncateContext(documentText);

  const prompt = `You are a helpful study assistant for a South African student.
Answer the student's question using ONLY the information in the document below.
If the answer isn't in the document, say so clearly rather than guessing.
Keep your answer clear, concise, and exam-relevant.

DOCUMENT:
"""
${context}
"""

STUDENT QUESTION: ${question}`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    })
  );

  return response.text ?? "I couldn't generate a response. Please try again.";
}

/**
 * Fallback text extraction for PDFs that have no real text layer — e.g.
 * scanned documents or photographed pages, where pdfjs-dist's text
 * extraction comes back empty. Sends the raw PDF directly to Gemini, which
 * can read text from image/scanned content the way a human would.
 *
 * Only call this when local extraction has already failed — it costs an
 * actual API request, unlike the free local text-layer extraction.
 */
export async function extractTextFromPdfViaOcr(buffer: Buffer): Promise<string> {
  const ai = getClient();
  const base64Pdf = buffer.toString("base64");

  const prompt = `Transcribe ALL readable text from this PDF document, including
text that appears on scanned or photographed pages. Preserve the original
structure and order (headings, questions, paragraphs) as plain text.
Do not summarize, comment, or add any text of your own.
Output ONLY the transcribed content, nothing else.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { mimeType: "application/pdf", data: base64Pdf } },
        prompt,
      ],
    })
  );

  return (response.text ?? "").trim();
}

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

/**
 * Pulls the JSON array out of a model response, even if the model ignored
 * instructions and wrapped it in markdown fences, a preamble ("Sure, here's
 * your quiz:"), or trailing commentary. Lighter/faster models in particular
 * (e.g. flash-lite) are prone to adding stray text despite "ONLY JSON"
 * instructions, which breaks a naive JSON.parse on the raw response.
 */
function extractJsonArray(raw: string): string {
  const withoutFences = raw.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("[");
  const end = withoutFences.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    return withoutFences;
  }
  return withoutFences.slice(start, end + 1);
}

export async function generateQuizFromDocument(
  documentText: string,
  numQuestions: number = 5
): Promise<QuizQuestion[]> {
  const ai = getClient();
  const context = truncateContext(documentText);

 const prompt = `You are an expert academic evaluator creating a practice quiz and memo for a South African student based on the document below. 

CRITICAL CONTENT RULE: Do NOT generate questions about the document's administrative structure, guidelines, total marks, time limits, or page counts. Focus entirely on the core educational content, formulas, or actual questions within the body of the document.

CRITICAL EXPLANATION STYLE RULE (applies to EVERY question, not just math/technical ones):
The "explanation" field must be SHORT — a maximum of 2 sentences, or the minimal step-by-step working if it's a calculation. No conversational tone, no introductory phrases like "This is correct because..." or "The answer is X, which means...". Do NOT restate the full question or all four options.
- For mathematical/technical questions: show ONLY the direct working/proof, formatted like a terse exam marking memo (e.g. "2x = 10 → x = 5").
- For conceptual/factual questions: state ONLY the single key fact or reason that makes the answer correct, in one short sentence.
If you cannot explain it in 2 sentences or fewer, you are including unnecessary detail — cut it down.

Create exactly ${numQuestions} multiple-choice questions based on this criteria.

DOCUMENT:
"""
${context}
"""

Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text.
Use exactly this structure:
[
  {
    "question": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "explanation": "..."
  }
]
Each question must have exactly 4 options. correctIndex is the 0-based index of the correct option.`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    })
  );

  const raw = response.text ?? "[]";
  const cleaned = extractJsonArray(raw);

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Response was not an array");
    return parsed as QuizQuestion[];
  } catch (err) {
    // Log the raw response so we can see exactly what the model sent back
    // if this still fails — much easier to diagnose than a generic error.
    console.error("Quiz JSON parse failed. Raw model response was:\n", raw);
    console.error("Parse error:", err);
    throw new Error("AI returned an unexpected format. Please try again.");
  }
}
