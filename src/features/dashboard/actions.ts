"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { routes } from "@/lib/constants/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/action";
import { breakTypeSchema } from "@/lib/validations/auth";
import { getActiveBreakForEntry } from "@/server/repositories/break.repository";
import { getActiveEntryForUser } from "@/server/repositories/time-entry.repository";
import { requireUser } from "@/server/services/auth.service";

function buildDashboardRedirect(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();

  return query ? `${routes.app}?${query}` : routes.app;
}

function validateCoordinates(
  lat: number | null,
  lng: number | null
): { valid: boolean; lat: number | null; lng: number | null } {
  if (lat === null || lng === null) {
    return { valid: true, lat: null, lng: null };
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { valid: true, lat: null, lng: null };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: true, lat: null, lng: null };
  }

  return { valid: true, lat, lng };
}

export async function startWorkdayAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { data: activeEntry } = await getActiveEntryForUser(context.user.id);

  if (activeEntry) {
    redirect(buildDashboardRedirect({ error: "Ja tens una jornada activa." }));
  }

  // Get and validate GPS coordinates if available
  const rawLat = formData.get("latitude")
    ? Number(formData.get("latitude"))
    : null;
  const rawLng = formData.get("longitude")
    ? Number(formData.get("longitude"))
    : null;
  const rawAccuracy = formData.get("accuracy")
    ? Number(formData.get("accuracy"))
    : null;
  const { lat: latitude, lng: longitude } = validateCoordinates(rawLat, rawLng);
  const accuracy =
    latitude !== null && rawAccuracy !== null && Number.isFinite(rawAccuracy) && rawAccuracy >= 0
      ? Math.round(rawAccuracy * 100) / 100
      : null;
  const comment = String(formData.get("comment") ?? "").trim();

  const { error } = await supabase.from("time_entries").insert({
    user_id: context.user.id,
    clock_in: new Date().toISOString(),
    clock_in_lat: latitude,
    clock_in_lng: longitude,
    clock_in_accuracy_meters: accuracy,
    notes: comment || null
  });

  if (error) {
    redirect(buildDashboardRedirect({ error: error.message }));
  }

  revalidatePath(routes.app);
  revalidatePath(routes.history);

  redirect(
    buildDashboardRedirect({ message: "Jornada iniciada correctament." })
  );
}

export async function finishWorkdayAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { data: activeEntry } = await getActiveEntryForUser(context.user.id);

  if (!activeEntry) {
    redirect(
      buildDashboardRedirect({
        error: "No hi ha cap jornada activa per tancar."
      })
    );
  }

  const activeEntryId = activeEntry.id;
  const { data: activeBreak } = await getActiveBreakForEntry(activeEntryId);

  if (activeBreak) {
    redirect(
      buildDashboardRedirect({
        error: "Tanca la pausa activa abans de finalitzar la jornada."
      })
    );
  }

  // Get and validate GPS coordinates if available
  const rawLat = formData.get("latitude")
    ? Number(formData.get("latitude"))
    : null;
  const rawLng = formData.get("longitude")
    ? Number(formData.get("longitude"))
    : null;
  const rawAccuracy = formData.get("accuracy")
    ? Number(formData.get("accuracy"))
    : null;
  const { lat: latitude, lng: longitude } = validateCoordinates(rawLat, rawLng);
  const accuracy =
    latitude !== null && rawAccuracy !== null && Number.isFinite(rawAccuracy) && rawAccuracy >= 0
      ? Math.round(rawAccuracy * 100) / 100
      : null;
  const comment = String(formData.get("comment") ?? "").trim();

  // Preserva la nota existent si l'usuari no escriu res al tancar la jornada.
  // Si l'usuari sí que escriu alguna cosa, la nova nota substitueix l'anterior.
  const mergedNotes = comment || activeEntry.notes || null;

  const { error } = await supabase
    .from("time_entries")
    .update({
      clock_out: new Date().toISOString(),
      clock_out_lat: latitude,
      clock_out_lng: longitude,
      clock_out_accuracy_meters: accuracy,
      notes: mergedNotes
    })
    .eq("id", activeEntryId)
    .eq("user_id", context.user.id)
    .is("clock_out", null);

  if (error) {
    redirect(buildDashboardRedirect({ error: error.message }));
  }

  revalidatePath(routes.app);
  revalidatePath(routes.history);

  redirect(
    buildDashboardRedirect({ message: "Jornada finalitzada correctament." })
  );
}

export async function startBreakAction(formData: FormData) {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { data: activeEntry } = await getActiveEntryForUser(context.user.id);

  if (!activeEntry) {
    redirect(
      buildDashboardRedirect({
        error: "Cal tenir una jornada activa abans d'iniciar una pausa."
      })
    );
  }

  const activeEntryId = activeEntry.id;
  const { data: activeBreak } = await getActiveBreakForEntry(activeEntryId);

  if (activeBreak) {
    redirect(buildDashboardRedirect({ error: "Ja tens una pausa activa." }));
  }

  const parsedBreakType = breakTypeSchema.safeParse(
    String(formData.get("breakType") ?? "")
  );

  if (!parsedBreakType.success) {
    redirect(
      buildDashboardRedirect({ error: "Selecciona un tipus de pausa valid." })
    );
  }

  const { error } = await supabase.from("breaks").insert({
    entry_id: activeEntryId,
    break_type: parsedBreakType.data,
    started_at: new Date().toISOString()
  });

  if (error) {
    redirect(buildDashboardRedirect({ error: error.message }));
  }

  revalidatePath(routes.app);
  revalidatePath(routes.history);

  redirect(buildDashboardRedirect({ message: "Pausa iniciada correctament." }));
}

export async function finishBreakAction() {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  const { data: activeEntry } = await getActiveEntryForUser(context.user.id);

  if (!activeEntry) {
    redirect(
      buildDashboardRedirect({
        error: "No hi ha cap jornada activa amb pausa per finalitzar."
      })
    );
  }

  const activeEntryId = activeEntry.id;
  const { data: activeBreak } = await getActiveBreakForEntry(activeEntryId);

  if (!activeBreak) {
    redirect(buildDashboardRedirect({ error: "No hi ha cap pausa activa." }));
  }

  const { error } = await supabase
    .from("breaks")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", activeBreak.id)
    .eq("entry_id", activeEntryId)
    .is("ended_at", null);

  if (error) {
    redirect(buildDashboardRedirect({ error: error.message }));
  }

  revalidatePath(routes.app);
  revalidatePath(routes.history);

  redirect(
    buildDashboardRedirect({ message: "Pausa finalitzada correctament." })
  );
}
