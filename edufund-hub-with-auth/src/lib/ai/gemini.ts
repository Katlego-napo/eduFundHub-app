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
Answer the student's question using ONLY the information in the study guide below.
If the answer isn't in the study guide, say so clearly rather than guessing,
and suggest the student ask their teacher or check their textbook.
Keep your answer clear, concise, and exam-relevant.

STUDY GUIDE:
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
