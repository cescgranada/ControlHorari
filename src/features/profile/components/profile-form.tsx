import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReminderSettings } from "@/components/reminder-settings";
import { ChangePasswordForm } from "@/components/change-password-form";

import { AuthNotice } from "@/features/auth/components/auth-notice";
import { updateProfileAction } from "@/features/profile/actions";
import {
  updateRemindersEnabledAction,
  updateWeeklySchedulesAction,
  changePasswordAction
} from "@/features/profile/actions";
import type { Database } from "@/types/database";

type ProfileFormProps = {
  email: string;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  preferences:
    | Database["public"]["Tables"]["user_notification_preferences"]["Row"]
    | null;
  error?: string;
  message?: string;
  schedules?: Array<{
    dayOfWeek: number;
    dayName: string;
    morningIn: string;
    morningOut: string;
    afternoonIn: string;
    afternoonOut: string;
    hasAfternoon: boolean;
    reminderMinutes: number;
    isActive: boolean;
  }>;
};

export function ProfileForm({
  email,
  profile,
  preferences,
  error,
  message,
  schedules
}: ProfileFormProps) {
  const isAdmin = profile?.role === "admin";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="bg-white/90 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="brand">Perfil personal</Badge>
            <h2 className="mt-4 font-serif text-3xl text-ink">
              Dades i preferencies
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-ink/70">
              Aquest espai centralitza el nom visible i els avisos basics del
              sistema.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-brand/15 bg-brand-soft/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-strong/75">
              Rol
            </p>
            <p className="mt-2 text-lg font-semibold text-brand-strong">
              {profile?.role ?? "worker"}
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" action={updateProfileAction}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">
                Nom complet
              </span>
              <input
                name="fullName"
                type="text"
                defaultValue={profile?.full_name ?? ""}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Email</span>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full rounded-2xl border border-line bg-mist px-4 py-3 text-sm text-ink/70 outline-none"
              />
            </label>
          </div>

          <div className="text-ink/72 rounded-[1.5rem] border border-line/80 bg-mist/70 px-4 py-4 text-sm">
            <p className="font-semibold text-ink">Jornada contractual</p>
            <p className="mt-2">
              {(() => {
                const h = profile?.weekly_hours ?? 37.5;
                const whole = Math.floor(h);
                const mins = Math.round((h - whole) * 60);
                return mins > 0 ? `${whole}h ${mins}min/setmana` : `${whole} hores/setmana`;
              })()}
              {profile?.department ? ` · ${profile.department}` : ""}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-line/80 bg-white px-4 py-4">
            <p className="text-sm font-semibold text-ink">Notificacions</p>
            <div className="mt-4 grid gap-3">
              <label className="flex items-start gap-3 text-sm text-ink/75">
                <input
                  name="notifyMissingClockOut"
                  type="checkbox"
                  defaultChecked={preferences?.notify_missing_clock_out ?? true}
                  className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                />
                <span>
                  Rebre avis si queda una jornada oberta sense sortida.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-ink/75">
                <input
                  name="notifyWeeklySummary"
                  type="checkbox"
                  defaultChecked={preferences?.notify_weekly_summary ?? false}
                  className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                />
                <span>
                  Rebre resum setmanal quan aquesta funcionalitat estigui
                  activa.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-ink/75">
                <input
                  name="notifyEntryCorrections"
                  type="checkbox"
                  defaultChecked={preferences?.notify_entry_corrections ?? true}
                  className="mt-1 h-4 w-4 rounded border-line text-brand focus:ring-brand"
                />
                <span>
                  Rebre notificacio quan un fitxatge sigui corregit per
                  coordinacio o administracio.
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <AuthNotice tone="error" message={error} />
            <AuthNotice message={message} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit">Desar canvis</Button>
            <p className="text-sm text-ink/60">
              Els canvis de rol i jornada contractual es gestionen des
              d&apos;administracio.
            </p>
          </div>
        </form>
      </Card>

      <div className="grid gap-6">
        {!isAdmin && (
          <ReminderSettings
            userId={profile?.id ?? ""}
            initialEnabled={profile?.reminders_enabled ?? false}
            initialSchedules={schedules}
            onToggle={updateRemindersEnabledAction}
            onSaveSchedules={updateWeeklySchedulesAction}
          />
        )}

        <ChangePasswordForm onChangePassword={changePasswordAction} />
      </div>
    </div>
  );
}
