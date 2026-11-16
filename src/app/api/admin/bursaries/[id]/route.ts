import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { revalidatePath } from "next/cache";

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

  // Bursaries have no associated storage file (official_url just links out
  // to the funder's own site), so deleting the row is all that's needed.
  //
  // Service-role client for the delete: this route has already done its
  // own auth + isAdmin check above, so we don't need RLS to gate this
  // write too — and relying on it silently no-ops if the policy doesn't
  // match how isAdmin is determined in app code.
  const serviceClient = createServiceClient();

  const { data: deletedRows, error } = await serviceClient
    .from("bursaries")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!deletedRows || deletedRows.length === 0) {
    return NextResponse.json(
      { error: "Bursary not found or already deleted." },
      { status: 404 }
    );
  }

  revalidatePath("/bursaries");

  return NextResponse.json({ success: true });
}