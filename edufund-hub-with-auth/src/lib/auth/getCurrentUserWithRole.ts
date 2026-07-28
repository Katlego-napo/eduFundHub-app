import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current user along with whether they are an admin.
 * Use in Server Components / Route Handlers only.
 */
export async function getCurrentUserWithRole() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  return { user: userData.user, isAdmin: profile?.is_admin ?? false };
}
