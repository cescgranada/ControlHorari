"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/lib/constants/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/action";
import { requireUser } from "@/server/services/auth.service";
import type { Database } from "@/types/database";

function buildRedirect(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `${routes.profile}?${searchParams.toString()}`;
}

export async function updateProfileAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const notifyMissingClockOut = formData.get("notifyMissingClockOut") === "on";
  const notifyWeeklySummary = formData.get("notifyWeeklySummary") === "on";
  const notifyEntryCorrections =
    formData.get("notifyEntryCorrections") === "on";

  if (fullName.length < 2) {
    redirect(
      buildRedirect({
        error: "El nom complet ha de tenir almenys 2 caracters."
      })
    );
  }

  const profilePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
    full_name: fullName
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profilePayload as never)
    .eq("id", context.user.id);

  if (profileError) {
    redirect(buildRedirect({ error: profileError.message }));
  }

  const preferencesPayload: Database["public"]["Tables"]["user_notification_preferences"]["Insert"] =
    {
      user_id: context.user.id,
      notify_missing_clock_out: notifyMissingClockOut,
      notify_weekly_summary: notifyWeeklySummary,
      notify_entry_corrections: notifyEntryCorrections
    };

  const { error: preferencesError } = await supabase
    .from("user_notification_preferences")
    .upsert(preferencesPayload as never, { onConflict: "user_id" });

  if (preferencesError) {
    redirect(buildRedirect({ error: preferencesError.message }));
  }

  revalidatePath(routes.profile);
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: context.user.email!,
    password: currentPassword
  });

  if (signInError) {
    throw new Error("La contrasenya actual no és correcta.");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (updateError) {
    throw new Error(updateError.message);
  }
}

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

export async function updateRemindersEnabledAction(enabled: boolean) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { error } = await supabase
    .from("profiles")
    .update({ reminders_enabled: enabled } as never)
    .eq("id", context.user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.profile);
}

export async function updateWeeklySchedulesAction(schedules: DaySchedule[]) {
  try {
    const context = await requireUser();
    const supabase = createSupabaseActionClient();

    const { error: deleteError } = await supabase
      .from("weekly_schedules")
      .delete()
      .eq("user_id", context.user.id);

    if (deleteError) {
      throw new Error(`Error eliminant: ${deleteError.message}`);
    }

    const activeSchedules = schedules.filter((s) => s.isActive);

    if (activeSchedules.length > 0) {
      const { error } = await supabase.from("weekly_schedules").insert(
        activeSchedules.map((s) => ({
          user_id: context.user.id,
          day_of_week: s.dayOfWeek,
          morning_in: s.morningIn,
          morning_out: s.morningOut,
          afternoon_in: s.hasAfternoon ? s.afternoonIn : null,
          afternoon_out: s.hasAfternoon ? s.afternoonOut : null,
          has_afternoon: s.hasAfternoon,
          reminder_minutes_before: s.reminderMinutes,
          is_active: s.isActive
        })) as never
      );

      if (error) {
        throw new Error(`Error inserint: ${error.message}`);
      }
    }

    revalidatePath(routes.profile);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error desconegut"
    );
  }
}
