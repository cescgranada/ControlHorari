"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useNotifications } from "@/hooks/use-notifications";
import { WeeklyScheduleForm } from "./weekly-schedule-form";

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

type ReminderSettingsProps = {
  userId: string;
  initialEnabled?: boolean;
  initialSchedules?: DaySchedule[];
  onToggle: (enabled: boolean) => Promise<void>;
  onSaveSchedules: (schedules: DaySchedule[]) => Promise<void>;
};

export function ReminderSettings({
  initialEnabled = false,
  initialSchedules,
  onToggle,
  onSaveSchedules
}: ReminderSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const { isSupported, permission, requestPermission } = useNotifications();

  const handleToggle = async () => {
    setSaving(true);
    try {
      if (!enabled && permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          alert("Cal activar les notificacions per usar els recordatoris.");
          setSaving(false);
          return;
        }
      }
      const newValue = !enabled;
      setEnabled(newValue);
      await onToggle(newValue);
    } catch {
      setEnabled(!enabled);
    } finally {
      setSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-white/90 shadow-panel">
        <p className="text-sm text-ink/60">
          Les notificacions no estan disponibles en aquest navegador. Els
          recordatoris no es poden activar.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/90 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">
              Recordatoris automàtics
            </h3>
            <p className="text-sm text-ink/60">
              Rep una notificació cada dia a l&apos;hora configurada per
              recordar fitxar.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            className={`relative h-7 w-12 rounded-full transition ${
              enabled ? "bg-brand" : "bg-line"
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {permission === "denied" && (
          <p className="mt-2 text-sm text-danger">
            Les notificacions estan bloquejades. Canvia la configuració del
            navegador per activar-les.
          </p>
        )}

        {permission === "default" && !enabled && (
          <p className="mt-2 text-sm text-ink/50">
            Activa el toggle i concedeix permís per començar a rebre
            recordatoris.
          </p>
        )}
      </Card>

      {enabled && (
        <WeeklyScheduleForm
          initialSchedules={initialSchedules}
          onSave={onSaveSchedules}
        />
      )}
    </div>
  );
}
