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

const PAGE_SIZE = 20;

type RawHistoryFilters = {
  from?: string | string[];
  to?: string | string[];
  page?: string | string[];
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
  const entryIds = entries.map((entry) => entry.id);
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

  const allHistoryEntries = entries.map((entry) =>
    buildHistoryEntry(entry, breaksByEntryId.get(entry.id) ?? [])
  );

  const rawPage = pickFirst(rawFilters?.page);
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const totalEntries = allHistoryEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const historyEntries = allHistoryEntries.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
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

  type AbsenceRow = {
    id: string;
    absence_date: string;
    absence_type: "sick" | "personal" | "other";
    status: "pending" | "approved" | "rejected";
    is_full_day: boolean;
    start_time: string | null;
    end_time: string | null;
    reason: string | null;
  };
  const normalizedAbsences = ((absences ?? []) as AbsenceRow[]).map((a) => ({
    id: a.id,
    date: a.absence_date,
    type: a.absence_type,
    status: a.status,
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
      days: new Set(allHistoryEntries.map((e) => e.dateKey)).size,
      netMinutes: allHistoryEntries.reduce(
        (total, entry) => total + entry.netMinutes,
        0
      ),
      breakMinutes: allHistoryEntries.reduce(
        (total, entry) => total + entry.breakMinutes,
        0
      ),
      incidents: allHistoryEntries.filter((entry) => entry.status === "incident")
        .length
    },
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      totalEntries,
      totalPages
    }
  };
}
