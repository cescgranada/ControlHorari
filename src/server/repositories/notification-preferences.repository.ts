import { createClient } from "@/lib/supabase/server";

export async function getNotificationPreferencesByUserId(userId: string) {
  const supabase = createClient();

  return supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
}
