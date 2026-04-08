import { createClient } from "@/lib/supabase/server";

export type Holiday = {
  id: string;
  date: string;
  name: string;
  scope: "national" | "regional" | "school";
  type: "holiday" | "closure" | "vacation";
};

export async function getHolidays(
  from: string,
  to: string
): Promise<Holiday[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("holidays")
    .select("id, holiday_date, name, scope, type")
    .gte("holiday_date", from)
    .lte("holiday_date", to)
    .order("holiday_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    date: item.holiday_date,
    name: item.name,
    scope: item.scope as Holiday["scope"],
    type: item.type as Holiday["type"]
  }));
}

export async function addHoliday(
  date: string,
  name: string,
  scope: Holiday["scope"],
  type: Holiday["type"]
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("holidays").insert({
    holiday_date: date,
    name,
    scope,
    type
  } as never);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateHoliday(
  id: string,
  date: string,
  name: string,
  scope: Holiday["scope"],
  type: Holiday["type"]
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("holidays")
    .update({
      holiday_date: date,
      name,
      scope,
      type
    } as never)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteHoliday(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("holidays").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
