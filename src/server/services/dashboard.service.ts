import {
  APP_TIME_ZONE,
  formatDateLabel,
  getCurrentWeekDays,
  getDateKey,
  getDurationMinutes
} from "@/lib/utils/time";
import { getRecentAbsencesForUser } from "@/server/repositories/absence.repository";
import {
  getActiveBreakForEntry,
  getBreaksForEntries,
  type BreakListItem
} from "@/server/repositories/break.repository";
import {
  getActiveEntryForUser,
  getRecentEntriesForUser,
  type TimeEntryListItem
} from "@/server/repositories/time-entry.repository";
import type {
  DashboardDaySummary,
  DashboardPauseItem,
  DashboardSnapshot,
  DashboardWeekDay,
  WorkStatus
} from "@/types/domain";

function emptyDaySummary(dateKey: string): DashboardDaySummary {
  return {
    dateKey,
    firstClockIn: null,
    lastClockOut: null,
    workedMinutes: 0,
    breakMinutes: 0,
    netMinutes: 0,
    hasEntry: false,
    pauses: []
  };
}

function buildDaySummary(
  dateKey: string,
  entries: Array<Pick<TimeEntryListItem, "clock_in" | "clock_out">>,
  breaks: BreakListItem[]
): DashboardDaySummary {
  if (entries.length === 0) {
    return emptyDaySummary(dateKey);
  }

  const now = new Date();
  const firstClockIn = entries[0]?.clock_in ?? null;
  const lastClockOut =
    [...entries].reverse().find((entry) => entry.clock_out)?.clock_out ?? null;

  const workedMinutes = entries.reduce((total, entry) => {
    const end = entry.clock_out ?? now.toISOString();
    return total + getDurationMinutes(entry.clock_in, end);
  }, 0);

  const pauses: DashboardPauseItem[] = breaks.map((entryBreak) => ({
    id: entryBreak.id,
    type: entryBreak.break_type,
    startedAt: entryBreak.started_at,
    endedAt: entryBreak.ended_at,
    minutes: getDurationMinutes(
      entryBreak.started_at,
      entryBreak.ended_at ?? now.toISOString()
    )
  }));

  const breakMinutes = pauses.reduce(
    (total, entryBreak) => total + entryBreak.minutes,
    0
  );

  return {
    dateKey,
    firstClockIn,
    lastClockOut,
    workedMinutes,
    breakMinutes,
    netMinutes: Math.max(0, workedMinutes - breakMinutes),
    hasEntry: true,
    pauses
  };
}

function buildWeekSummary(
  groupedEntries: Map<
    string,
    Array<Pick<TimeEntryListItem, "clock_in" | "clock_out">>
  >,
  groupedBreaks: Map<string, BreakListItem[]>
) {
  const todayKey = getDateKey(new Date(), APP_TIME_ZONE);

  return getCurrentWeekDays().map<DashboardWeekDay>((day) => {
    const dateKey = getDateKey(day, APP_TIME_ZONE);
    const daySummary = buildDaySummary(
      dateKey,
      groupedEntries.get(dateKey) ?? [],
      groupedBreaks.get(dateKey) ?? []
    );

    return {
      dateKey,
      label: formatDateLabel(day, APP_TIME_ZONE),
      netMinutes: daySummary.netMinutes,
      isToday: dateKey === todayKey,
      hasEntry: daySummary.hasEntry
    };
  });
}

export async function getDashboardSnapshot(
  userId: string,
  weeklyHours = 30
): Promise<DashboardSnapshot> {
  const from = new Date();
  from.setDate(from.getDate() - 14);
  from.setHours(0, 0, 0, 0);

  const fromShort = new Date();
  fromShort.setDate(fromShort.getDate() - 30); // 30 dies per absències

  const [
    { data: activeEntry },
    { data: recentEntries },
    { data: recentAbsences }
  ] = await Promise.all([
    getActiveEntryForUser(userId),
    getRecentEntriesForUser(userId, from.toISOString()),
    getRecentAbsencesForUser(userId, fromShort.toISOString())
  ]);

  const entryIds = (recentEntries ?? []).map((entry) => entry.id);

  const [{ data: recentBreaks }, { data: activeBreak }] = await Promise.all([
    getBreaksForEntries(entryIds),
    activeEntry
      ? getActiveBreakForEntry(activeEntry.id)
      : Promise.resolve({ data: null })
  ]);

  const todayKey = getDateKey(new Date(), APP_TIME_ZONE);
  const groupedEntries = new Map<
    string,
    Array<Pick<TimeEntryListItem, "clock_in" | "clock_out">>
  >();
  const groupedBreaks = new Map<string, BreakListItem[]>();
  const entryDateById = new Map<string, string>();

  for (const entry of recentEntries ?? []) {
    const entryDateKey = getDateKey(entry.clock_in, APP_TIME_ZONE);
    const dayEntries = groupedEntries.get(entryDateKey) ?? [];

    dayEntries.push({
      clock_in: entry.clock_in,
      clock_out: entry.clock_out
    });

    groupedEntries.set(entryDateKey, dayEntries);
    entryDateById.set(entry.id, entryDateKey);
  }

  for (const entryBreak of recentBreaks ?? []) {
    const entryDateKey = entryDateById.get(entryBreak.entry_id);

    if (!entryDateKey) {
      continue;
    }

    const dayBreaks = groupedBreaks.get(entryDateKey) ?? [];
    dayBreaks.push(entryBreak);
    groupedBreaks.set(entryDateKey, dayBreaks);
  }

  const today = buildDaySummary(
    todayKey,
    groupedEntries.get(todayKey) ?? [],
    groupedBreaks.get(todayKey) ?? []
  );
  const week = buildWeekSummary(groupedEntries, groupedBreaks);

  const status: WorkStatus = activeBreak
    ? "on_break"
    : activeEntry
      ? "active"
      : today.hasEntry
        ? "closed"
        : "idle";

  return {
    status,
    weeklyHours,
    activeEntry: activeEntry
      ? {
          id: activeEntry.id,
          clockIn: activeEntry.clock_in,
          notes: activeEntry.notes ?? null
        }
      : null,
    activePause: activeBreak
      ? {
          id: activeBreak.id,
          breakType: activeBreak.break_type,
          startedAt: activeBreak.started_at
        }
      : null,
    today,
    week,
    absences: (recentAbsences ?? []).map((a) => ({
      id: a.id,
      date: a.absence_date,
      type: a.absence_type as "sick" | "personal" | "other",
      status: a.status as "pending" | "approved" | "rejected",
      isFullDay: a.is_full_day,
      startTime: a.start_time,
      endTime: a.end_time,
      reason: a.reason
    }))
  };
}
