import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPdf } from "@/lib/ai/pdfExtract";
import { extractTextFromPdfViaOcr } from "@/lib/ai/gemini";
import { checkAndLogAiUsage, DAILY_LIMIT } from "@/lib/ai/rateLimit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Extract text
  let extractedText = "";
  try {
    extractedText = (await extractTextFromPdf(buffer)).trim();
  } catch (err) {
    console.error("PDF extraction failed:", err);
    return NextResponse.json(
      { error: "Couldn't read this PDF. It may be scanned/image-based or corrupted." },
      { status: 400 }
    );
  }

  if (!extractedText || extractedText.length < 20) {
    console.error(
      `Local PDF text extraction returned too little text (length: ${extractedText.length}). Falling back to AI OCR.`
    );

    // The PDF likely has no real text layer (scanned/photographed pages).
    // Fall back to asking Gemini to read it directly. This costs an actual
    // AI request, so it's rate-limited like the other AI features.
    const { allowed, usedToday } = await checkAndLogAiUsage(userData.user.id);
    if (!allowed) {
      return NextResponse.json(
        {
          error: `You've reached today's limit of ${DAILY_LIMIT} AI requests. Please try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    try {
      extractedText = (await extractTextFromPdfViaOcr(buffer)).trim();
    } catch (err) {
      console.error("OCR fallback failed:", err);
    }

    void usedToday; // not needed in the response here, but logged for the usage check
  }

  if (!extractedText || extractedText.length < 20) {
    return NextResponse.json(
      {
        error:
          "Couldn't find readable text in this PDF, even with OCR. The file may be corrupted, password-protected, or too low quality to read.",
      },
      { status: 400 }
    );
  }

  // Upload original file to Storage, scoped to this user's folder
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${userData.user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("study-documents")
    .upload(path, buffer, { contentType: "application/pdf", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("study-documents").getPublicUrl(path);

  const { data: docRow, error: insertError } = await supabase
    .from("study_documents")
    .insert({
      user_id: userData.user.id,
      file_name: file.name,
      file_url: urlData.publicUrl,
      extracted_text: extractedText,
    })
    .select()
    .single();

  if (insertError || !docRow) {
    return NextResponse.json(
      { error: insertError?.message ?? "Couldn't save document." },
      { status: 500 }
    );
  }

  return NextResponse.json({ document: docRow });
}