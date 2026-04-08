import { createClient } from "@/lib/supabase/server";

export type TimeEntryListItem = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  notes: string | null;
  is_manual: boolean;
  edit_reason: string | null;
};

export type TimeEntryHistoryItem = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  notes: string | null;
  is_manual: boolean;
  edit_reason: string | null;
};

export async function getActiveEntryForUser(userId: string) {
  const supabase = createClient();

  const result = await supabase
    .from("time_entries")
    .select("id, user_id, clock_in, clock_out, notes")
    .eq("user_id", userId)
    .is("clock_out", null)
    .maybeSingle();

  return {
    ...result,
    data: (result.data as TimeEntryListItem | null) ?? null
  };
}

export async function getRecentEntriesForUser(userId: string, fromIso: string) {
  const supabase = createClient();

  const result = await supabase
    .from("time_entries")
    .select("id, user_id, clock_in, clock_out")
    .eq("user_id", userId)
    .gte("clock_in", fromIso)
    .order("clock_in", { ascending: true });

  return {
    ...result,
    data: (result.data as TimeEntryListItem[] | null) ?? null
  };
}

export async function getHistoryEntriesForUser(
  userId: string,
  fromIso: string,
  toIso: string
) {
  const supabase = createClient();

  const result = await supabase
    .from("time_entries")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng, notes, is_manual, edit_reason"
    )
    .eq("user_id", userId)
    .gte("clock_in", fromIso)
    .lte("clock_in", toIso)
    .order("clock_in", { ascending: false });

  return {
    ...result,
    data: (result.data as TimeEntryHistoryItem[] | null) ?? []
  };
}

export async function getEntriesForUserInRange(
  userId: string,
  fromIso: string,
  toIso: string
) {
  const supabase = createClient();

  const result = await supabase
    .from("time_entries")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng, notes, is_manual, edit_reason"
    )
    .eq("user_id", userId)
    .gte("clock_in", fromIso)
    .lte("clock_in", toIso)
    .order("clock_in", { ascending: true });

  const data = result.data as TimeEntryListItem[] | null;

  return {
    ...result,
    data: data ?? []
  };
}

export async function getEntriesForUsersInRange(
  userIds: string[],
  fromIso: string,
  toIso: string
) {
  const supabase = createClient();

  const result = await supabase
    .from("time_entries")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng, notes, is_manual, edit_reason"
    )
    .in("user_id", userIds)
    .gte("clock_in", fromIso)
    .lte("clock_in", toIso)
    .order("clock_in", { ascending: true });

  const data = result.data as TimeEntryListItem[] | null;

  return {
    ...result,
    data: data ?? []
  };
}

export async function getTimeEntryById(entryId: string) {
  const supabase = createClient();

  const result = await supabase
    .from("time_entries")
    .select(
      "id, user_id, clock_in, clock_out, clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng, notes, is_manual, edit_reason"
    )
    .eq("id", entryId)
    .single();

  return {
    ...result,
    data: (result.data as TimeEntryHistoryItem | null) ?? null
  };
}
