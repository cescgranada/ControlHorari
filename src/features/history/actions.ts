"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/lib/constants/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/action";
import { requireUser } from "@/server/services/auth.service";
import {
  validateTimeEntry,
  isWithinLastNDays
} from "@/lib/utils/time-validation";

export type AddManualEntryResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export type UpdateEntryResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function addManualEntryAction(
  formData: FormData
): Promise<AddManualEntryResult> {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  // Get form data
  const date = formData.get("date") as string;
  const clockInTime = formData.get("clockIn") as string;
  const clockOutTime = formData.get("clockOut") as string | null;
  const reason = formData.get("reason") as string;

  if (!date || !clockInTime || !reason) {
    return { success: false, error: "Falten camps obligatoris." };
  }

  // Parse dates
  const [year, month, day] = date.split("-").map(Number);
  const [inHours, inMinutes] = clockInTime.split(":").map(Number);
  const clockInDate = new Date(year, month - 1, day, inHours, inMinutes);

  let clockOutDate: Date | null = null;
  if (clockOutTime) {
    const [outHours, outMinutes] = clockOutTime.split(":").map(Number);
    clockOutDate = new Date(year, month - 1, day, outHours, outMinutes);
    if (clockOutDate <= clockInDate) {
      return {
        success: false,
        error: "L'hora de sortida ha de ser posterior a l'entrada."
      };
    }
  }

  // Validate date range (not older than 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (clockInDate < sevenDaysAgo) {
    return {
      success: false,
      error: "Només es poden rectificar entrades dels últims 7 dies."
    };
  }

  // Validate time entry using shared validation function
  const validation = await validateTimeEntry(
    context.user.id,
    clockInDate.toISOString(),
    clockOutDate ? clockOutDate.toISOString() : null,
    undefined,
    supabase
  );

  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  // Create manual entry (always open first, then close if needed)
  const payload = {
    user_id: context.user.id,
    clock_in: clockInDate.toISOString(),
    clock_out: null,
    is_manual: true,
    edited_by: context.user.id,
    edit_reason: reason,
    source: "web"
  };

  const { data: insertedEntry, error: insertError } = await supabase
    .from("time_entries")
    .insert(payload as never)
    .select("id")
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // If clock_out was provided, update the entry to close it
  if (clockOutDate && insertedEntry) {
    const { error: updateError } = await supabase
      .from("time_entries")
      .update({
        clock_out: clockOutDate.toISOString(),
        is_manual: true,
        edited_by: context.user.id,
        edit_reason: reason
      } as never)
      .eq("id", (insertedEntry as { id: string }).id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  }

  revalidatePath(routes.history);
  revalidatePath(routes.app);

  return { success: true, message: "Entrada manual afegida correctament." };
}

export async function updateEntryAction(
  entryId: string,
  clockInIso: string,
  clockOutIso: string | null,
  reason: string,
  period: string = "full"
): Promise<UpdateEntryResult> {
  const context = await requireUser();
  const supabase = createSupabaseActionClient();

  // Get the entry to verify ownership and check dates
  const { data: entryData, error: fetchError } = await supabase
    .from("time_entries")
    .select("user_id, clock_in, clock_out")
    .eq("id", entryId)
    .single();

  if (fetchError || !entryData) {
    return { success: false, error: "Entrada no trobada." };
  }

  const entry = entryData as {
    user_id: string;
    clock_in: string;
    clock_out: string | null;
  };

  // Ensure the entry belongs to the current user
  if (entry.user_id !== context.user.id) {
    return {
      success: false,
      error: "No tens permisos per modificar aquesta entrada."
    };
  }

  // Check if the entry is within the last 7 days
  if (!isWithinLastNDays(entry.clock_in, 7)) {
    return {
      success: false,
      error: "Només es poden modificar entrades dels últims 7 dies."
    };
  }

  // If the entry is closed, require a reason
  if (entry.clock_out && !reason.trim()) {
    return {
      success: false,
      error: "Cal indicar el motiu de la correcció per a entrades tancades."
    };
  }

  // Validate the updated time entry
  const validation = await validateTimeEntry(
    context.user.id,
    clockInIso,
    clockOutIso,
    entryId,
    supabase
  );

  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  // Update the entry
  const updateData = {
    clock_in: clockInIso,
    clock_out: clockOutIso,
    is_manual: true,
    edited_by: context.user.id,
    edit_reason: reason,
    period: period
  };

  const { error } = await supabase
    .from("time_entries")
    .update(updateData as never)
    .eq("id", entryId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(routes.history);
  revalidatePath(routes.app);

  return { success: true, message: "Entrada actualitzada correctament." };
}
