export type AppRole = "worker" | "admin";

export type BreakType = "breakfast" | "lunch" | "personal" | "meeting";

export type WorkStatus = "idle" | "active" | "on_break" | "closed" | "incident";

export type DashboardPauseItem = {
  id: string;
  type: BreakType;
  startedAt: string;
  endedAt: string | null;
  minutes: number;
};

export type DashboardDaySummary = {
  dateKey: string;
  firstClockIn: string | null;
  lastClockOut: string | null;
  workedMinutes: number;
  breakMinutes: number;
  netMinutes: number;
  hasEntry: boolean;
  pauses: DashboardPauseItem[];
};

export type DashboardWeekDay = {
  dateKey: string;
  label: string;
  netMinutes: number;
  isToday: boolean;
  hasEntry: boolean;
};

export type DashboardSnapshot = {
  status: WorkStatus;
  activeEntry: {
    id: string;
    clockIn: string;
    notes: string | null;
  } | null;
  activePause: {
    id: string;
    breakType: BreakType;
    startedAt: string;
  } | null;
  today: DashboardDaySummary;
  week: DashboardWeekDay[];
  absences: Array<{
    id: string;
    date: string;
    type: "sick" | "personal" | "other";
    status: "pending" | "approved" | "rejected";
    isFullDay: boolean;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }>;
};

export type HistoryEntryStatus = "ok" | "active" | "incident";

export type HistoryEntryItem = {
  id: string;
  dateKey: string;
  dateLabel: string;
  clockIn: string;
  clockOut: string | null;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  workedMinutes: number;
  breakMinutes: number;
  netMinutes: number;
  status: HistoryEntryStatus;
  pauses: DashboardPauseItem[];
  notes: string | null;
  isManual: boolean;
  editReason: string | null;
};

export type HistoryFilters = {
  from: string;
  to: string;
};

export type HistorySnapshot = {
  filters: HistoryFilters;
  entries: HistoryEntryItem[];
  absences: Array<{
    id: string;
    date: string;
    type: "sick" | "personal" | "other";
    status: "pending" | "approved" | "rejected";
    isFullDay: boolean;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
  }>;
  totals: {
    days: number;
    netMinutes: number;
    breakMinutes: number;
    incidents: number;
  };
};

export type ReportDaySummary = {
  dateKey: string;
  firstClockIn: string | null;
  lastClockOut: string | null;
  workedMinutes: number;
  breakMinutes: number;
  netMinutes: number;
  hasEntry: boolean;
  entryCount: number;
  breaksCount: number;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  notes: string | null;
  isManual: boolean;
  editReason: string | null;
  absence?: {
    type: "sick" | "personal" | "other";
    status: "pending" | "approved" | "rejected";
    reason: string | null;
  } | null;
};

export type ReportPeriod = "day" | "week" | "month" | "custom";

export type ReportFilters = {
  from: string;
  to: string;
  period: ReportPeriod;
};

export type ReportSnapshot = {
  filters: ReportFilters;
  days: ReportDaySummary[];
  totals: {
    days: number;
    workedMinutes: number;
    breakMinutes: number;
    netMinutes: number;
    entries: number;
    avgNetMinutesPerDay: number;
  };
};

export type UserReportSnapshot = {
  userId: string;
  userName: string;
  snapshot: ReportSnapshot;
};
