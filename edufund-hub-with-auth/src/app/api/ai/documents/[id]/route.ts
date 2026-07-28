import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Look the document up scoped to this user first — this both confirms
  // ownership (a user can never delete someone else's document) and gives
  // us the file_url we need to also remove the file from Storage.
  const { data: doc, error: fetchError } = await supabase
    .from("study_documents")
    .select("id, user_id, file_url")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  // The stored file_url is a public Supabase Storage URL, e.g.
  // https://xxx.supabase.co/storage/v1/object/public/study-documents/<userId>/<file>.pdf
  // Pull out everything after the bucket name to get the path within the bucket.
  const marker = "/study-documents/";
  const idx = doc.file_url.indexOf(marker);
  const storagePath = idx !== -1 ? doc.file_url.slice(idx + marker.length) : null;

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("study-documents")
      .remove([storagePath]);

    // Don't block the delete on a storage error — an orphaned file in
    // Storage is far less harmful than a document the user can't remove.
    if (storageError) {
      console.error("Failed to delete file from storage:", storageError);
    }
  }

  const { error: deleteError } = await supabase
    .from("study_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}