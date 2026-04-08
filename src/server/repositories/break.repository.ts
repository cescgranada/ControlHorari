import { createClient } from "@/lib/supabase/server";

export type BreakListItem = {
  id: string;
  entry_id: string;
  break_type: "breakfast" | "lunch" | "personal" | "meeting";
  started_at: string;
  ended_at: string | null;
};

export async function getBreaksForEntries(entryIds: string[]) {
  if (entryIds.length === 0) {
    return {
      data: [] as BreakListItem[],
      error: null
    };
  }

  const supabase = createClient();

  const result = await supabase
    .from("breaks")
    .select("id, entry_id, break_type, started_at, ended_at")
    .in("entry_id", entryIds)
    .order("started_at", { ascending: true });

  return {
    ...result,
    data: (result.data as BreakListItem[] | null) ?? []
  };
}

export async function getActiveBreakForEntry(entryId: string) {
  const supabase = createClient();

  const result = await supabase
    .from("breaks")
    .select("id, entry_id, break_type, started_at, ended_at")
    .eq("entry_id", entryId)
    .is("ended_at", null)
    .maybeSingle();

  return {
    ...result,
    data: (result.data as BreakListItem | null) ?? null
  };
}
