import {
  APP_TIME_ZONE,
  formatFullDateLabel,
  getDateKey,
  getDurationMinutes,
  toDateInputValue
} from "@/lib/utils/time";
import { createClient } from "@/lib/supabase/server";
import { getBreaksForEntries } from "@/server/repositories/break.repository";
import {
  getHistoryEntriesForUser,
  type TimeEntryHistoryItem
} from "@/server/repositories/time-entry.repository";
import type {
  DashboardPauseItem,
  HistoryEntryItem,
  HistoryFilters,
  HistorySnapshot
} from "@/types/domain";

type RawHistoryFilters = {
  from?: string | string[];
  to?: string | string[];
};

function pickFirst(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function isValidDateInput(value?: string) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function getDefaultFilters(): HistoryFilters {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(today)
  };
}

export function normalizeHistoryFilters(
  rawFilters?: RawHistoryFilters
): HistoryFilters {
  const defaults = getDefaultFilters();
  const from = pickFirst(rawFilters?.from);
  const to = pickFirst(rawFilters?.to);

  const normalizedFrom = isValidDateInput(from) ? from! : defaults.from;
  const normalizedTo = isValidDateInput(to) ? to! : defaults.to;

  if (normalizedFrom > normalizedTo) {
    return {
      from: normalizedTo,
      to: normalizedFrom
    };
  }

  return {
    from: normalizedFrom,
    to: normalizedTo
  };
}

function getUtcRange(filters: HistoryFilters) {
  return {
    fromIso: `${filters.from}T00:00:00.000Z`,
    toIso: `${filters.to}T23:59:59.999Z`
  };
}

function buildEntryStatus(entry: TimeEntryHistoryItem) {
  const todayKey = getDateKey(new Date(), APP_TIME_ZONE);
  const entryDateKey = getDateKey(entry.clock_in, APP_TIME_ZONE);

  if (!entry.clock_out) {
    return entryDateKey === todayKey ? "active" : "incident";
  }

  if (entry.is_manual) {
    return "incident";
  }

  return "ok";
}

function buildHistoryEntry(
  entry: TimeEntryHistoryItem,
  pauses: DashboardPauseItem[]
): HistoryEntryItem {
  const end = entry.clock_out ?? new Date().toISOString();
  const workedMinutes = getDurationMinutes(entry.clock_in, end);
  const breakMinutes = pauses.reduce(
    (total, entryPause) => total + entryPause.minutes,
    0
  );

  return {
    id: entry.id,
    dateKey: getDateKey(entry.clock_in, APP_TIME_ZONE),
    dateLabel: formatFullDateLabel(entry.clock_in, APP_TIME_ZONE),
    clockIn: entry.clock_in,
    clockOut: entry.clock_out,
    clockInLat: entry.clock_in_lat,
    clockInLng: entry.clock_in_lng,
    clockOutLat: entry.clock_out_lat,
    clockOutLng: entry.clock_out_lng,
    workedMinutes,
    breakMinutes,
    netMinutes: Math.max(0, workedMinutes - breakMinutes),
    status: buildEntryStatus(entry),
    pauses,
    notes: entry.notes,
    isManual: entry.is_manual,
    editReason: entry.edit_reason
  };
}

export async function getHistorySnapshot(
  userId: string,
  rawFilters?: RawHistoryFilters
): Promise<HistorySnapshot> {
  const filters = normalizeHistoryFilters(rawFilters);
  const { fromIso, toIso } = getUtcRange(filters);
  const { data: entries, error: entriesError } = await getHistoryEntriesForUser(
    userId,
    fromIso,
    toIso
  );

  if (entriesError) {
    throw new Error(`Error obtenint entrades: ${entriesError.message}`);
  }
  const entryIds = ((entries as any[]) || []).map((entry: any) => entry.id);
  const { data: breaks, error: breaksError } =
    await getBreaksForEntries(entryIds);

  if (breaksError) {
    throw new Error(`Error obtenint pauses: ${breaksError.message}`);
  }

  const breaksByEntryId = new Map<string, DashboardPauseItem[]>();

  for (const entryBreak of breaks || []) {
    const existing = breaksByEntryId.get(entryBreak.entry_id) ?? [];

    existing.push({
      id: entryBreak.id,
      type: entryBreak.break_type,
      startedAt: entryBreak.started_at,
      endedAt: entryBreak.ended_at,
      minutes: getDurationMinutes(
        entryBreak.started_at,
        entryBreak.ended_at ?? new Date().toISOString()
      )
    });

    breaksByEntryId.set(entryBreak.entry_id, existing);
  }

  const historyEntries = (entries as any[]).map((entry: any) =>
    buildHistoryEntry(entry, breaksByEntryId.get(entry.id) ?? [])
  );

  const supabase = createClient();
  const { data: absences } = await supabase
    .from("absences")
    .select(
      "id, absence_date, absence_type, status, reason, is_full_day, start_time, end_time"
    )
    .eq("user_id", userId)
    .gte("absence_date", filters.from)
    .lte("absence_date", filters.to);

  const normalizedAbsences = ((absences as any[]) || []).map((a: any) => ({
    id: a.id,
    date: a.absence_date,
    type: a.absence_type as "sick" | "personal" | "other",
    status: a.status as "pending" | "approved" | "rejected",
    isFullDay: a.is_full_day,
    startTime: a.start_time,
    endTime: a.end_time,
    reason: a.reason
  }));

  return {
    filters,
    entries: historyEntries,
    absences: normalizedAbsences,
    totals: {
      days: historyEntries.length,
      netMinutes: historyEntries.reduce(
        (total: number, entry: any) => total + entry.netMinutes,
        0
      ),
      breakMinutes: historyEntries.reduce(
        (total: number, entry: any) => total + entry.breakMinutes,
        0
      ),
      incidents: historyEntries.filter((entry) => entry.status === "incident")
        .length
    }
  };
}
