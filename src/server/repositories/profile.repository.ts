import { createClient } from "@/lib/supabase/server";

export async function getProfileById(profileId: string) {
  const supabase = createClient();

  return supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
}
