import { APP_TIME_ZONE, getDateKey } from "@/lib/utils/time";
import { createClient } from "@/lib/supabase/server";

export type TeamMemberStatus = {
  id: string;
  name: string;
  email: string;
  status: "clocked_in" | "clocked_out" | "finished" | "on_break" | "absent";
  clockInTime: string | null;
  clockOutTime: string | null;
  absenceType: "sick" | "personal" | "other" | null;
  absenceReason: string | null;
};

export async function getTeamStatus(): Promise<TeamMemberStatus[]> {
  const supabase = createClient();

  const today = getDateKey(new Date(), APP_TIME_ZONE);
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name");

  if (usersError || !users) {
    throw new Error(usersError?.message || "Error obtenint usuaris");
  }

  const userIds = users.map((u) => u.id);

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, user_id, clock_in, clock_out")
    .in("user_id", userIds)
    .gte("clock_in", startOfDay)
    .lte("clock_in", endOfDay);

  const { data: absences } = await supabase
    .from("absences")
    .select("user_id, absence_type, reason")
    .in("user_id", userIds)
    .eq("absence_date", today);

  const { data: breaks } = await supabase
    .from("breaks")
    .select("entry_id, ended_at")
    .is("ended_at", null)
    .in(
      "entry_id",
      (entries ?? []).map((e) => e.id)
    );

  const activeBreakEntryIds = new Set((breaks ?? []).map((b) => b.entry_id));

  return users.map((user) => {
    const userEntry = (entries ?? []).find((e) => e.user_id === user.id);
    const userAbsence = (absences ?? []).find((a) => a.user_id === user.id);

    if (userAbsence) {
      return {
        id: user.id,
        name: user.full_name,
        email: user.email ?? "",
        status: "absent" as const,
        clockInTime: null,
        clockOutTime: null,
        absenceType: userAbsence.absence_type as "sick" | "personal" | "other",
        absenceReason: userAbsence.reason
      };
    }

    if (!userEntry) {
      return {
        id: user.id,
        name: user.full_name,
        email: user.email ?? "",
        status: "clocked_out" as const,
        clockInTime: null,
        clockOutTime: null,
        absenceType: null,
        absenceReason: null
      };
    }

    if (userEntry.clock_out) {
      return {
        id: user.id,
        name: user.full_name,
        email: user.email ?? "",
        status: "finished" as const,
        clockInTime: userEntry.clock_in,
        clockOutTime: userEntry.clock_out,
        absenceType: null,
        absenceReason: null
      };
    }

    if (activeBreakEntryIds.has(userEntry.id)) {
      return {
        id: user.id,
        name: user.full_name,
        email: user.email ?? "",
        status: "on_break" as const,
        clockInTime: userEntry.clock_in,
        clockOutTime: null,
        absenceType: null,
        absenceReason: null
      };
    }

    return {
      id: user.id,
      name: user.full_name,
      email: user.email ?? "",
      status: "clocked_in" as const,
      clockInTime: userEntry.clock_in,
      clockOutTime: null,
      absenceType: null,
      absenceReason: null
    };
  });
}

export type PendingAbsence = {
  id: string;
  userId: string;
  userName: string;
  date: string;
  type: "sick" | "personal" | "other";
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
};

export async function getPendingAbsences(): Promise<PendingAbsence[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("absences")
    .select(
      `
      id,
      user_id,
      absence_date,
      absence_type,
      status,
      reason,
      is_full_day,
      start_time,
      end_time,
      profiles (full_name)
    `
    )
    .eq("status", "pending")
    .order("absence_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  type AbsenceRow = {
    id: string;
    user_id: string;
    absence_date: string;
    absence_type: "sick" | "personal" | "other";
    status: "pending" | "approved" | "rejected";
    reason: string | null;
    is_full_day: boolean;
    start_time: string | null;
    end_time: string | null;
    profiles: { full_name: string } | null;
  };

  return ((data ?? []) as AbsenceRow[]).map((item) => ({
    id: item.id,
    userId: item.user_id,
    userName: item.profiles?.full_name ?? "Usuari desconegut",
    date: item.absence_date,
    type: item.absence_type,
    reason: item.reason,
    status: item.status,
    isFullDay: item.is_full_day,
    startTime: item.start_time,
    endTime: item.end_time
  }));
}
