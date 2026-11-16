import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// pdfjs-dist v4 uses Promise.withResolvers() internally, which only exists
// natively in Node 22+. Polyfill it so this works on Node 18/20 runtimes too
// (e.g. Vercel's default Node runtime). Without this, every PDF — including
// valid, text-based ones — throws and gets misreported as "scanned/corrupted".
if (typeof (Promise as any).withResolvers !== "function") {
  (Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

/**
 * Extracts plain text from a PDF buffer using pdfjs-dist's text layer only —
 * deliberately avoids any canvas/rendering APIs (DOMMatrix, ImageData, Path2D),
 * which require native bindings that can fail to install on some platforms.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, isEvalSupported: false }).promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n\n";
  }

  await doc.destroy();
  return fullText.trim();
}