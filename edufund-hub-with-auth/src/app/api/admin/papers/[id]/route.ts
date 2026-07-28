import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { revalidatePath } from "next/cache";

function storagePathFromUrl(url: string): string | null {
  const marker = "/past-papers/";
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, isAdmin } = await getCurrentUserWithRole();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!isAdmin) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  // Regular client for reads — respects RLS as normal, no need to
  // bypass it just to look up the row.
  const supabase = await createClient();

  const { data: paper, error: fetchError } = await supabase
    .from("past_papers")
    .select("id, paper_url, memo_url")
    .eq("id", id)
    .single();

  if (fetchError || !paper) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  }

  // Remove the paper (and memo, if any) from Storage. Not blocking the
  // delete on this failing — an orphaned file in Storage is far less
  // harmful than a paper an admin can't remove from the listing.
  const pathsToRemove = [paper.paper_url, paper.memo_url]
    .filter((url): url is string => !!url)
    .map(storagePathFromUrl)
    .filter((path): path is string => !!path);

  if (pathsToRemove.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("past-papers")
      .remove(pathsToRemove);

    if (storageError) {
      console.error("Failed to delete paper file(s) from storage:", storageError);
    }
  }

  // Service-role client for the actual delete. This route has already
  // done its own auth + isAdmin check above, so we don't need RLS to
  // gate this write too — and relying on it silently no-ops if the
  // policy doesn't match how isAdmin is determined in app code.
  const serviceClient = createServiceClient();

  const { data: deletedRows, error: deleteError } = await serviceClient
    .from("past_papers")
    .delete()
    .eq("id", id)
    .select("id");

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (!deletedRows || deletedRows.length === 0) {
    return NextResponse.json(
      { error: "Paper not found or already deleted." },
      { status: 404 }
    );
  }

  // Bust the Next.js cache for the past-papers listing page so all users
  // immediately see the updated list without a manual refresh.
  revalidatePath("/past-papers");

  return NextResponse.json({ success: true });
}