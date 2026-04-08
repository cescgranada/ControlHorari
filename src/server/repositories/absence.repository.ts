import { createClient } from "@/lib/supabase/server";

export async function getRecentAbsencesForUser(
  userId: string,
  fromDate: string
) {
  const supabase = createClient();
  return supabase
    .from("absences")
    .select(
      "id, user_id, absence_date, absence_type, status, reason, is_full_day, start_time, end_time"
    )
    .eq("user_id", userId)
    .gte("absence_date", fromDate)
    .order("absence_date", { ascending: false });
}
