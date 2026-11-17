import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";

// Deletes several quizzes at once (used for "Delete topic").
// Body: { ids: string[] }  Admins only.
export async function POST(request: Request) {
  const { user, isAdmin } = await getCurrentUserWithRole();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 500 ||
    !ids.every((id) => typeof id === "string" && id.length > 0 && id.length <= 64)
  ) {
    return NextResponse.json({ error: "Send between 1 and 500 quiz ids." }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc.from("quizzes").delete().in("id", ids as string[]).select("id");

  if (error) {
    console.error("Bulk quiz delete failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/quizzes");
  return NextResponse.json({ success: true, deleted: data?.length ?? 0 });
}
