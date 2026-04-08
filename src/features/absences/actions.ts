"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseActionClient } from "@/lib/supabase/action";
import { requireUser, requireRole } from "@/server/services/auth.service";
import { routes } from "@/lib/constants/navigation";

export type AbsenceType = "sick" | "personal" | "other";
export type AbsenceStatus = "pending" | "approved" | "rejected";

export async function markAbsenceAction(
  date: string,
  type: AbsenceType,
  reason: string,
  isFullDay: boolean = true,
  startTime: string | null = null,
  endTime: string | null = null
) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  // 1. Control de duplicats: comprovar si ja existeix una sol·licitud per a aquesta data
  const { data: existing } = await supabase
    .from("absences")
    .select("id")
    .eq("user_id", context.user.id)
    .eq("absence_date", date)
    .maybeSingle();

  if (existing) {
    throw new Error(
      `Ja existeix una sol·licitud d'absència o baixa per al dia ${date.split("-").reverse().join("/")}. En cas d'error, elimina la sol·licitud pendent abans de crear-ne una de nova.`
    );
  }

  // Només els permisos per "Dia personal" requereixen aprovació de l'administració.
  // Les baixes i altres visites mèdiques s'aproven automàticament.
  const status: AbsenceStatus = type === "personal" ? "pending" : "approved";

  const { error } = await supabase.from("absences").insert({
    user_id: context.user.id,
    absence_date: date,
    absence_type: type,
    status,
    is_full_day: isFullDay,
    start_time: isFullDay ? null : startTime,
    end_time: isFullDay ? null : endTime,
    reason: reason.trim() || null
  } as never);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.history);
  revalidatePath(routes.app);
}

export async function updateAbsenceStatusAction(
  id: string,
  status: AbsenceStatus
) {
  await requireRole(["admin"]);
  const supabase = createSupabaseActionClient();

  const { error } = await supabase
    .from("absences")
    .update({ status } as never)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.history);
  revalidatePath(routes.app);
  revalidatePath(routes.adminUsers);
}

export async function deleteAbsenceAction(id: string) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { error } = await supabase
    .from("absences")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.history);
  revalidatePath(routes.app);
}

export async function getUserAbsencesAction(from: string, to: string) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { data, error } = await supabase
    .from("absences")
    .select(
      "id, absence_date, absence_type, status, reason, is_full_day, start_time, end_time"
    )
    .eq("user_id", context.user.id)
    .gte("absence_date", from)
    .lte("absence_date", to)
    .order("absence_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data as Array<{
      id: string;
      absence_date: string;
      absence_type: string;
      status: string;
      reason: string | null;
      is_full_day: boolean;
      start_time: string | null;
      end_time: string | null;
    }>) ?? []
  ).map((item) => ({
    id: item.id,
    date: item.absence_date,
    type: item.absence_type as AbsenceType,
    status: item.status as AbsenceStatus,
    reason: item.reason,
    isFullDay: item.is_full_day,
    startTime: item.start_time,
    endTime: item.end_time
  }));
}
