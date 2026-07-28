import { createClient } from "@/lib/supabase/server";

const DAILY_LIMIT = 30; // max AI requests per user per day

export async function checkAndLogAiUsage(
  userId: string
): Promise<{ allowed: boolean; usedToday: number }> {
  const supabase = await createClient();

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("used_at", since.toISOString());

  const usedToday = count ?? 0;

  if (usedToday >= DAILY_LIMIT) {
    return { allowed: false, usedToday };
  }

  await supabase.from("ai_usage_log").insert({ user_id: userId });
  return { allowed: true, usedToday: usedToday + 1 };
}

export { DAILY_LIMIT };
