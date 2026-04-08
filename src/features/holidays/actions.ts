"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseActionClient } from "@/lib/supabase/action";
import { requireUser } from "@/server/services/auth.service";
import { routes } from "@/lib/constants/navigation";

export type HolidayScope = "national" | "regional" | "school";
export type HolidayType = "holiday" | "closure" | "vacation";

export async function addHolidayAction(
  date: string,
  name: string,
  scope: HolidayScope,
  type: HolidayType
) {
  const context = await requireUser();

  if (context.profile?.role !== "admin") {
    throw new Error("Només els administradors poden afegir festius.");
  }

  const supabase = createSupabaseActionClient();

  const { error } = await supabase.from("holidays").insert({
    holiday_date: date,
    name,
    scope,
    type
  } as never);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminHolidays);
}

export async function deleteHolidayAction(id: string) {
  const context = await requireUser();

  if (context.profile?.role !== "admin") {
    throw new Error("Només els administradors poden eliminar festius.");
  }

  const supabase = createSupabaseActionClient();

  const { error } = await supabase.from("holidays").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminHolidays);
}
