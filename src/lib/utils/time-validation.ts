import { getEntriesForUserInRange } from "@/server/repositories/time-entry.repository";

export async function validateTimeEntry(
  userId: string,
  clockInIso: string,
  clockOutIso: string | null,
  excludeEntryId?: string,
  supabaseClient?: any
): Promise<{ valid: boolean; error?: string }> {
  const clockIn = new Date(clockInIso);
  const clockOut = clockOutIso ? new Date(clockOutIso) : null;

  // 1. No future dates
  const now = new Date();
  if (clockIn > now) {
    return {
      valid: false,
      error: "La data i hora d'entrada no poden ser futures."
    };
  }

  if (clockOut && clockOut > now) {
    return {
      valid: false,
      error: "La data i hora de sortida no poden ser futures."
    };
  }

  // 2. clock_out >= clock_in
  if (clockOut && clockOut < clockIn) {
    return {
      valid: false,
      error: "L'hora de sortida ha de ser posterior a l'entrada."
    };
  }

  // 3. Check overlaps with other entries for the same user
  const dayStart = new Date(clockIn);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const { data: existingEntries } = supabaseClient
    ? await supabaseClient
        .from("time_entries")
        .select("id, clock_in, clock_out")
        .eq("user_id", userId)
        .gte("clock_in", dayStart.toISOString())
        .lt("clock_in", dayEnd.toISOString())
    : await getEntriesForUserInRange(
        userId,
        dayStart.toISOString(),
        dayEnd.toISOString()
      );

  if (existingEntries) {
    for (const existing of existingEntries) {
      if (excludeEntryId && existing.id === excludeEntryId) continue;

      const existingStart = new Date(existing.clock_in);
      const existingEnd = existing.clock_out
        ? new Date(existing.clock_out)
        : null;

      // Check overlap - treat null clock_out as Infinity (entry never ends)
      const effectiveExistingEnd = existingEnd ?? Infinity;
      if (
        clockIn < effectiveExistingEnd &&
        (!clockOut || clockOut > existingStart)
      ) {
        return {
          valid: false,
          error: "L'entrada se solapa amb una altra entrada existent."
        };
      }
    }
  }

  // 4. Optional: limit daily working hours (e.g., 12 hours max)
  const maxHours = 12;
  if (clockOut) {
    const hoursWorked =
      (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
    if (hoursWorked > maxHours) {
      return {
        valid: false,
        error: `La jornada no pot superar ${maxHours} hores.`
      };
    }
  }

  return { valid: true };
}

export function isWithinLastNDays(dateIso: string, days: number): boolean {
  const date = new Date(dateIso);
  const now = new Date();
  const limit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date >= limit;
}

export function isFutureDate(dateIso: string): boolean {
  return new Date(dateIso) > new Date();
}
