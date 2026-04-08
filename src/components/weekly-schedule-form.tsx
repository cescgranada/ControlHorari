"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type DaySchedule = {
  dayOfWeek: number;
  dayName: string;
  morningIn: string;
  morningOut: string;
  afternoonIn: string;
  afternoonOut: string;
  hasAfternoon: boolean;
  reminderMinutes: number;
  isActive: boolean;
};

const DAYS_OF_WEEK: DaySchedule[] = [
  {
    dayOfWeek: 1,
    dayName: "Dilluns",
    morningIn: "08:00",
    morningOut: "13:00",
    afternoonIn: "15:00",
    afternoonOut: "17:00",
    hasAfternoon: true,
    reminderMinutes: 15,
    isActive: true
  },
  {
    dayOfWeek: 2,
    dayName: "Dimarts",
    morningIn: "08:00",
    morningOut: "13:00",
    afternoonIn: "15:00",
    afternoonOut: "17:00",
    hasAfternoon: true,
    reminderMinutes: 15,
    isActive: true
  },
  {
    dayOfWeek: 3,
    dayName: "Dimecres",
    morningIn: "08:00",
    morningOut: "13:00",
    afternoonIn: "15:00",
    afternoonOut: "17:00",
    hasAfternoon: true,
    reminderMinutes: 15,
    isActive: true
  },
  {
    dayOfWeek: 4,
    dayName: "Dijous",
    morningIn: "08:00",
    morningOut: "13:00",
    afternoonIn: "15:00",
    afternoonOut: "17:00",
    hasAfternoon: true,
    reminderMinutes: 15,
    isActive: true
  },
  {
    dayOfWeek: 5,
    dayName: "Divendres",
    morningIn: "08:00",
    morningOut: "13:00",
    afternoonIn: "15:00",
    afternoonOut: "17:00",
    hasAfternoon: false,
    reminderMinutes: 15,
    isActive: true
  }
];

type WeeklyScheduleFormProps = {
  initialSchedules?: DaySchedule[];
  onSave: (schedules: DaySchedule[]) => Promise<void>;
};

export function WeeklyScheduleForm({
  initialSchedules,
  onSave
}: WeeklyScheduleFormProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    initialSchedules ?? DAYS_OF_WEEK
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (dayOfWeek: number) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, isActive: !s.isActive } : s
      )
    );
    setSaved(false);
  };

  const handleAfternoonToggle = (dayOfWeek: number) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, hasAfternoon: !s.hasAfternoon } : s
      )
    );
    setSaved(false);
  };

  const handleTimeChange = (
    dayOfWeek: number,
    field: "morningIn" | "morningOut" | "afternoonIn" | "afternoonOut",
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
      )
    );
    setSaved(false);
  };

  const handleReminderChange = (dayOfWeek: number, minutes: number) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, reminderMinutes: minutes } : s
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(schedules);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desar l'horari.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/90 p-4 shadow-panel">
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-ink">Horari setmanal</h3>
          <p className="text-xs text-ink/60">
            Configura els teus horaris. Activa la tarda si la treballes.
          </p>
        </div>

        <div className="space-y-2">
          {schedules.map((schedule) => (
            <div
              key={schedule.dayOfWeek}
              className={`rounded-xl border p-3 ${
                schedule.isActive
                  ? "border-brand/20 bg-brand-soft/30"
                  : "border-line/80 bg-mist/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(schedule.dayOfWeek)}
                  className={`relative h-5 w-9 rounded-full transition ${
                    schedule.isActive ? "bg-brand" : "bg-line"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      schedule.isActive ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>

                <span className="w-16 text-xs font-medium text-ink">
                  {schedule.dayName}
                </span>

                <div className="flex flex-1 items-center gap-1">
                  <input
                    type="time"
                    value={schedule.morningIn}
                    onChange={(e) =>
                      handleTimeChange(
                        schedule.dayOfWeek,
                        "morningIn",
                        e.target.value
                      )
                    }
                    disabled={!schedule.isActive}
                    className="w-20 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none transition focus:border-brand disabled:opacity-50"
                  />
                  <span className="text-[10px] text-ink/40">-</span>
                  <input
                    type="time"
                    value={schedule.morningOut}
                    onChange={(e) =>
                      handleTimeChange(
                        schedule.dayOfWeek,
                        "morningOut",
                        e.target.value
                      )
                    }
                    disabled={!schedule.isActive}
                    className="w-20 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none transition focus:border-brand disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAfternoonToggle(schedule.dayOfWeek)}
                    disabled={!schedule.isActive}
                    className={`relative h-4 w-7 rounded-full transition ${
                      schedule.hasAfternoon ? "bg-brand" : "bg-line"
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                        schedule.hasAfternoon
                          ? "translate-x-3"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[10px] font-medium ${
                      schedule.hasAfternoon ? "text-ink" : "text-ink/40"
                    }`}
                  >
                    Tarda
                  </span>
                </div>

                {schedule.hasAfternoon && (
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={schedule.afternoonIn}
                      onChange={(e) =>
                        handleTimeChange(
                          schedule.dayOfWeek,
                          "afternoonIn",
                          e.target.value
                        )
                      }
                      disabled={!schedule.isActive}
                      className="w-20 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none transition focus:border-brand disabled:opacity-50"
                    />
                    <span className="text-[10px] text-ink/40">-</span>
                    <input
                      type="time"
                      value={schedule.afternoonOut}
                      onChange={(e) =>
                        handleTimeChange(
                          schedule.dayOfWeek,
                          "afternoonOut",
                          e.target.value
                        )
                      }
                      disabled={!schedule.isActive}
                      className="w-20 rounded-lg border border-line bg-white px-2 py-1.5 text-xs text-ink outline-none transition focus:border-brand disabled:opacity-50"
                    />
                  </div>
                )}

                <select
                  value={schedule.reminderMinutes}
                  onChange={(e) =>
                    handleReminderChange(
                      schedule.dayOfWeek,
                      Number(e.target.value)
                    )
                  }
                  disabled={!schedule.isActive}
                  className="w-16 rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] text-ink outline-none transition focus:border-brand disabled:opacity-50"
                >
                  <option value={5}>5m</option>
                  <option value={10}>10m</option>
                  <option value={15}>15m</option>
                  <option value={30}>30m</option>
                  <option value={60}>1h</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="py-2 text-sm"
          >
            {saving ? "Desant..." : "Desar"}
          </Button>
          {saved && <span className="text-xs text-success">Desat!</span>}
        </div>
      </div>
    </Card>
  );
}
