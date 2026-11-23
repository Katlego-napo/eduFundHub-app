import { NextResponse } from "next/server";
import { STUDY_ASSISTANT_ENABLED } from "@/lib/features";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!STUDY_ASSISTANT_ENABLED) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  const { id } = await params;
  const { user, isAdmin } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Only the admin can delete study guides." },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  const { data: doc, error: fetchError } = await supabase
    .from("study_documents")
    .select("id, file_url")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Study guide not found." }, { status: 404 });
  }

  // file_url is a public Storage URL; the path inside the bucket is whatever
  // follows the bucket name.
  const marker = "/study-documents/";
  const idx = doc.file_url.indexOf(marker);
  const storagePath = idx !== -1 ? doc.file_url.slice(idx + marker.length) : null;

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("study-documents")
      .remove([storagePath]);
    // An orphaned file is far less harmful than a guide that can't be removed.
    if (storageError) console.error("Failed to delete file from storage:", storageError);
  }

  const { error: deleteError } = await supabase
    .from("study_documents")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
