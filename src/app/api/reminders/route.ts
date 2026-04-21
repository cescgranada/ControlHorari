export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { APP_TIME_ZONE } from "@/lib/utils/time";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Missing configuration variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const localParts = new Intl.DateTimeFormat("en-US", {
      timeZone: APP_TIME_ZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(now);
    const dayNames: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const weekdayPart = localParts.find((p) => p.type === "weekday")?.value ?? "Mon";
    const dayOfWeek = dayNames[weekdayPart] ?? now.getDay();
    const hour = localParts.find((p) => p.type === "hour")?.value?.padStart(2, "0") ?? "00";
    const minute = localParts.find((p) => p.type === "minute")?.value?.padStart(2, "0") ?? "00";
    const currentTime = `${hour}:${minute}`;

    const { data: schedules, error: schedulesError } = await supabase
      .from("weekly_schedules")
      .select("user_id, morning_in, reminder_minutes_before")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ message: "No schedules to check", count: 0 });
    }

    const usersToRemind: string[] = [];

    for (const schedule of schedules) {
      const [clockInHour, clockInMin] = schedule.morning_in
        .split(":")
        .map(Number);
      const totalMins = clockInHour * 60 + clockInMin - schedule.reminder_minutes_before;
      const rh = Math.floor(((totalMins % 1440) + 1440) % 1440 / 60);
      const rm = ((totalMins % 60) + 60) % 60;
      const reminderTimeStr = `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;

      if (
        reminderTimeStr <= currentTime &&
        currentTime <= schedule.morning_in
      ) {
        const { data: entry } = await supabase
          .from("time_entries")
          .select("id")
          .eq("user_id", schedule.user_id)
          .is("clock_out", null)
          .single();

        if (!entry) {
          usersToRemind.push(schedule.user_id);
        }
      }
    }

    if (usersToRemind.length === 0) {
      return NextResponse.json({ message: "No users to remind", count: 0 });
    }

    return NextResponse.json({
      message: "Reminders scheduled",
      users: usersToRemind,
      count: usersToRemind.length
    });
  } catch (error) {
    console.error("Error in reminders endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
