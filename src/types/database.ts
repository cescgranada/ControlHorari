export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfileRow = {
  id: string;
  full_name: string;
  role: "worker" | "admin";
  weekly_hours: number;
  department: string | null;
  avatar_url: string | null;
  preferred_language: "ca" | "es" | "en";
  is_active: boolean;
  calendar_id: string | null;
  reminders_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type ProfileInsert = {
  id: string;
  full_name: string;
  role?: "worker" | "admin";
  weekly_hours?: number;
  department?: string | null;
  avatar_url?: string | null;
  preferred_language?: "ca" | "es" | "en";
  is_active?: boolean;
  calendar_id?: string | null;
  reminders_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
};

type TimeEntryRow = {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  clock_in_timezone: string;
  clock_out_timezone: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_in_accuracy_meters: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  clock_out_accuracy_meters: number | null;
  notes: string | null;
  source: string;
  is_manual: boolean;
  edited_by: string | null;
  edit_reason: string | null;
  period: "morning" | "afternoon" | "full";
  created_at: string;
  updated_at: string;
};

type TimeEntryInsert = {
  id?: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  clock_in_timezone?: string;
  clock_out_timezone?: string | null;
  clock_in_lat?: number | null;
  clock_in_lng?: number | null;
  clock_in_accuracy_meters?: number | null;
  clock_out_lat?: number | null;
  clock_out_lng?: number | null;
  clock_out_accuracy_meters?: number | null;
  notes?: string | null;
  source?: string;
  is_manual?: boolean;
  edited_by?: string | null;
  edit_reason?: string | null;
  period?: "morning" | "afternoon" | "full";
  created_at?: string;
  updated_at?: string;
};

type BreakRow = {
  id: string;
  entry_id: string;
  break_type: "breakfast" | "lunch" | "personal" | "meeting";
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

type BreakInsert = {
  id?: string;
  entry_id: string;
  break_type: "breakfast" | "lunch" | "personal" | "meeting";
  started_at: string;
  ended_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type WorkCalendarRow = {
  id: string;
  name: string;
  hours_per_day: number;
  working_days: number[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type WorkCalendarInsert = {
  id?: string;
  name: string;
  hours_per_day?: number;
  working_days?: number[];
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

type NotificationPreferencesRow = {
  user_id: string;
  notify_missing_clock_out: boolean;
  notify_weekly_summary: boolean;
  notify_entry_corrections: boolean;
  created_at: string;
  updated_at: string;
};

type NotificationPreferencesInsert = {
  user_id: string;
  notify_missing_clock_out?: boolean;
  notify_weekly_summary?: boolean;
  notify_entry_corrections?: boolean;
  created_at?: string;
  updated_at?: string;
};

type WeeklyScheduleRow = {
  id: string;
  user_id: string;
  day_of_week: number;
  morning_in: string;
  morning_out: string;
  afternoon_in: string | null;
  afternoon_out: string | null;
  has_afternoon: boolean;
  reminder_minutes_before: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type WeeklyScheduleInsert = {
  id?: string;
  user_id: string;
  day_of_week: number;
  morning_in?: string;
  morning_out?: string;
  afternoon_in?: string | null;
  afternoon_out?: string | null;
  has_afternoon?: boolean;
  reminder_minutes_before?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type HolidayRow = {
  id: string;
  holiday_date: string;
  name: string;
  scope: "national" | "regional" | "school";
  type: "holiday" | "closure" | "vacation";
  region_code: string | null;
  created_at: string;
  updated_at: string;
};

type HolidayInsert = {
  id?: string;
  holiday_date: string;
  name: string;
  scope: "national" | "regional" | "school";
  type: "holiday" | "closure" | "vacation";
  region_code?: string | null;
  created_at?: string;
  updated_at?: string;
};

type AbsenceRow = {
  id: string;
  user_id: string;
  absence_date: string;
  absence_type: "sick" | "personal" | "other";
  reason: string | null;
  created_at: string;
  updated_at: string;
};

type AbsenceInsert = {
  id?: string;
  user_id: string;
  absence_date: string;
  absence_type?: "sick" | "personal" | "other";
  reason?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      time_entries: {
        Row: TimeEntryRow;
        Insert: TimeEntryInsert;
        Update: Partial<TimeEntryInsert>;
        Relationships: [];
      };
      breaks: {
        Row: BreakRow;
        Insert: BreakInsert;
        Update: Partial<BreakInsert>;
        Relationships: [];
      };
      work_calendars: {
        Row: WorkCalendarRow;
        Insert: WorkCalendarInsert;
        Update: Partial<WorkCalendarInsert>;
        Relationships: [];
      };
      user_notification_preferences: {
        Row: NotificationPreferencesRow;
        Insert: NotificationPreferencesInsert;
        Update: Partial<NotificationPreferencesInsert>;
        Relationships: [];
      };
      weekly_schedules: {
        Row: WeeklyScheduleRow;
        Insert: WeeklyScheduleInsert;
        Update: Partial<WeeklyScheduleInsert>;
        Relationships: [];
      };
      holidays: {
        Row: HolidayRow;
        Insert: HolidayInsert;
        Update: Partial<HolidayInsert>;
        Relationships: [];
      };
      absences: {
        Row: AbsenceRow;
        Insert: AbsenceInsert;
        Update: Partial<AbsenceInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "worker" | "admin";
      break_type: "breakfast" | "lunch" | "personal" | "meeting";
      absence_type: "sick" | "personal" | "other";
      holiday_scope: "national" | "regional" | "school";
      holiday_type: "holiday" | "closure" | "vacation";
    };
    CompositeTypes: Record<string, never>;
  };
};
