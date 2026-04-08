import { ProfileForm } from "@/features/profile/components/profile-form";
import { requireUser } from "@/server/services/auth.service";
import { createClient } from "@/lib/supabase/server";

type ProfilePageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  try {
    const context = await requireUser();
    const supabase = createClient();

    const { data: schedulesData } = await supabase
      .from("weekly_schedules")
      .select(
        "day_of_week, morning_in, morning_out, afternoon_in, afternoon_out, has_afternoon, reminder_minutes_before, is_active"
      )
      .eq("user_id", context.user.id)
      .order("day_of_week");

    const dayNames: Record<number, string> = {
      1: "Dilluns",
      2: "Dimarts",
      3: "Dimecres",
      4: "Dijous",
      5: "Divendres",
      6: "Dissabte",
      0: "Diumenge"
    };

    const defaultSchedules = [1, 2, 3, 4, 5].map((day) => ({
      dayOfWeek: day,
      dayName: dayNames[day],
      morningIn: "08:00",
      morningOut: "13:00",
      afternoonIn: "15:00",
      afternoonOut: "17:00",
      hasAfternoon: day !== 5,
      reminderMinutes: 15,
      isActive: true
    }));

    const schedules =
      schedulesData && schedulesData.length > 0
        ? schedulesData.map((s) => ({
            dayOfWeek: s.day_of_week,
            dayName: dayNames[s.day_of_week] ?? `Dia ${s.day_of_week}`,
            morningIn: s.morning_in ?? "08:00",
            morningOut: s.morning_out ?? "13:00",
            afternoonIn: s.afternoon_in ?? "15:00",
            afternoonOut: s.afternoon_out ?? "17:00",
            hasAfternoon: s.has_afternoon ?? false,
            reminderMinutes: s.reminder_minutes_before ?? 15,
            isActive: s.is_active ?? true
          }))
        : defaultSchedules;

    return (
      <ProfileForm
        email={context.user.email ?? ""}
        profile={context.profile}
        preferences={context.preferences}
        error={searchParams?.error}
        message={searchParams?.message}
        schedules={schedules}
      />
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar el perfil.";
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
