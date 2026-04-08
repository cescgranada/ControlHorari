import { createClient } from "@/lib/supabase/server";
import {
  APP_TIME_ZONE,
  getDateKey,
  getDurationMinutes
} from "@/lib/utils/time";
import type { BreakListItem } from "@/server/repositories/break.repository";
import {
  getEntriesForUserInRange,
  getEntriesForUsersInRange
} from "@/server/repositories/time-entry.repository";
import type {
  ReportDaySummary,
  ReportSnapshot,
  UserReportSnapshot
} from "@/types/domain";

export type ReportPeriod = "day" | "week" | "month" | "custom";

export type ReportFilters = {
  from: string;
  to: string;
  period?: ReportPeriod;
};

function buildDaySummary(
  dateKey: string,
  entries: Array<{
    clock_in: string;
    clock_out: string | null;
    clock_in_lat?: number | null;
    clock_in_lng?: number | null;
    clock_out_lat?: number | null;
    clock_out_lng?: number | null;
    notes?: string | null;
    is_manual?: boolean;
    edit_reason?: string | null;
  }>,
  breaks: BreakListItem[],
  absence?: {
    absence_type: string;
    status: string;
    reason: string | null;
  } | null
): ReportDaySummary {
  const now = new Date();
  const firstClockIn = entries[0]?.clock_in ?? null;
  const lastEntryWithClockOut = [...entries].reverse().find((e) => e.clock_out);
  const lastClockOut = lastEntryWithClockOut?.clock_out ?? null;

  const workedMinutes = entries.reduce((total, entry) => {
    const end = entry.clock_out ?? now.toISOString();
    return total + getDurationMinutes(entry.clock_in, end);
  }, 0);

  const breakMinutes = breaks.reduce((total, entryBreak) => {
    const end = entryBreak.ended_at ?? now.toISOString();
    return total + getDurationMinutes(entryBreak.started_at, end);
  }, 0);

  const notes = entries
    .map((e) => e.notes)
    .filter(Boolean)
    .join(" | ");
  const editReason = entries
    .map((e) => e.edit_reason)
    .filter(Boolean)
    .join(" | ");
  const isManual = entries.some((e) => e.is_manual);

  return {
    dateKey,
    firstClockIn,
    lastClockOut,
    workedMinutes,
    breakMinutes,
    netMinutes: Math.max(0, workedMinutes - breakMinutes),
    hasEntry: entries.length > 0,
    entryCount: entries.length,
    breaksCount: breaks.length,
    clockInLat: entries[0]?.clock_in_lat ?? null,
    clockInLng: entries[0]?.clock_in_lng ?? null,
    clockOutLat: lastEntryWithClockOut?.clock_out_lat ?? null,
    clockOutLng: lastEntryWithClockOut?.clock_out_lng ?? null,
    notes: notes || null,
    isManual,
    editReason: editReason || null,
    absence: absence
      ? {
          type: absence.absence_type as any,
          status: absence.status as any,
          reason: absence.reason
        }
      : null
  };
}

// Helper function to get breaks for entries in a range (multiple users)
async function getBreaksForUsersInRange(
  userIds: string[],
  fromIso: string,
  toIso: string
): Promise<BreakListItem[]> {
  const supabase = createClient();

  const { data: entriesData, error: entriesError } = await supabase
    .from("time_entries")
    .select("id")
    .in("user_id", userIds)
    .gte("clock_in", fromIso)
    .lte("clock_in", toIso);

  if (entriesError) {
    throw new Error(`Error obtenint IDs d'entrades: ${entriesError.message}`);
  }

  const entries = entriesData as Array<{ id: string }> | null;

  if (!entries || entries.length === 0) {
    return [];
  }

  const entryIds = entries.map((e) => e.id);

  const { data: breaksData, error: breaksError } = await supabase
    .from("breaks")
    .select("id, entry_id, break_type, started_at, ended_at")
    .in("entry_id", entryIds)
    .order("started_at", { ascending: true });

  if (breaksError) {
    throw new Error(`Error obtenint pauses: ${breaksError.message}`);
  }

  return (breaksData as BreakListItem[] | null) ?? [];
}

async function getAbsencesForUsersInRange(
  userIds: string[],
  fromIso: string,
  toIso: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("absences")
    .select("user_id, absence_date, absence_type, status, reason")
    .in("user_id", userIds)
    .gte("absence_date", fromIso)
    .lte("absence_date", toIso);

  if (error) {
    throw new Error(`Error obtenint absències: ${error.message}`);
  }

  return (
    (data as Array<{
      user_id: string;
      absence_date: string;
      absence_type: string;
      status: string;
      reason: string | null;
    }>) ?? []
  );
}

export async function getReportSnapshot(
  userIdOrIds: string | string[],
  filters: ReportFilters
): Promise<ReportSnapshot> {
  const { from, to } = filters;
  const userIds = Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds];

  try {
    const [entriesResult, allBreaks, allAbsences] = await Promise.all([
      userIds.length === 1
        ? getEntriesForUserInRange(userIds[0], from, to)
        : getEntriesForUsersInRange(userIds, from, to),
      getBreaksForUsersInRange(userIds, from, to),
      getAbsencesForUsersInRange(userIds, from, to)
    ]);

    if (entriesResult.error) {
      throw new Error(
        `Error obtenint entrades: ${entriesResult.error.message}`
      );
    }

    const entries = (entriesResult.data ?? []) as Array<{
      id: string;
      clock_in: string;
      clock_out: string | null;
      clock_in_lat: number | null;
      clock_in_lng: number | null;
      clock_out_lat: number | null;
      clock_out_lng: number | null;
      notes: string | null;
      is_manual: boolean;
      edit_reason: string | null;
    }>;

    // Group entries by date
    const groupedEntries = new Map<
      string,
      Array<{
        clock_in: string;
        clock_out: string | null;
        clock_in_lat: number | null;
        clock_in_lng: number | null;
        clock_out_lat: number | null;
        clock_out_lng: number | null;
        notes?: string | null;
        is_manual?: boolean;
        edit_reason?: string | null;
      }>
    >();
    const entryIdToDate = new Map<string, string>();

    for (const entry of entries) {
      const dateKey = getDateKey(entry.clock_in, APP_TIME_ZONE);
      const dayEntries = groupedEntries.get(dateKey) ?? [];
      dayEntries.push({
        clock_in: entry.clock_in,
        clock_out: entry.clock_out,
        clock_in_lat: entry.clock_in_lat,
        clock_in_lng: entry.clock_in_lng,
        clock_out_lat: entry.clock_out_lat,
        clock_out_lng: entry.clock_out_lng,
        notes: entry.notes,
        is_manual: entry.is_manual,
        edit_reason: entry.edit_reason
      });
      groupedEntries.set(dateKey, dayEntries);
      entryIdToDate.set(entry.id, dateKey);
    }

    // Group breaks by date
    const groupedBreaks = new Map<string, BreakListItem[]>();

    for (const entryBreak of allBreaks) {
      const dateKey = entryIdToDate.get(entryBreak.entry_id);
      if (!dateKey) continue;

      const dayBreaks = groupedBreaks.get(dateKey) ?? [];
      dayBreaks.push(entryBreak);
      groupedBreaks.set(dateKey, dayBreaks);
    }

    // Build daily summaries for all dates in range
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const days: ReportDaySummary[] = [];
    let totalWorkedMinutes = 0;
    let totalBreakMinutes = 0;
    let totalNetMinutes = 0;
    let totalEntries = 0;

    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateKey = getDateKey(currentDate, APP_TIME_ZONE);
      const dayEntries = groupedEntries.get(dateKey) ?? [];
      const dayBreaks = groupedBreaks.get(dateKey) ?? [];
      const dayAbsence = allAbsences.find(
        (a) =>
          (Array.isArray(userIdOrIds)
            ? userIds.includes(a.user_id)
            : a.user_id === userIdOrIds) &&
          a.absence_date === dateKey &&
          a.status === "approved"
      );

      const daySummary = buildDaySummary(
        dateKey,
        dayEntries,
        dayBreaks,
        dayAbsence
      );
      days.push(daySummary);

      totalWorkedMinutes += daySummary.workedMinutes;
      totalBreakMinutes += daySummary.breakMinutes;
      totalNetMinutes += daySummary.netMinutes;
      totalEntries += daySummary.entryCount;

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      filters: {
        from,
        to,
        period: filters.period ?? "custom"
      },
      days,
      totals: {
        days: days.length,
        workedMinutes: totalWorkedMinutes,
        breakMinutes: totalBreakMinutes,
        netMinutes: totalNetMinutes,
        entries: totalEntries,
        avgNetMinutesPerDay:
          days.length > 0 ? Math.round(totalNetMinutes / days.length) : 0
      }
    };
  } catch (error) {
    throw error;
  }
}

export async function getReportSnapshotsPerUser(
  users: Array<{ id: string; full_name: string }>,
  filters: ReportFilters
): Promise<UserReportSnapshot[]> {
  const results = await Promise.all(
    users.map(async (user) => {
      const snapshot = await getReportSnapshot(user.id, filters);
      return {
        userId: user.id,
        userName: user.full_name,
        snapshot
      };
    })
  );
  return results;
}
