import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const { data: schedules, error: schedulesError } = await supabase
      .from("weekly_schedules")
      .select("user_id, clock_in_time, reminder_minutes_before")
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
      const [clockInHour, clockInMin] = schedule.clock_in_time
        .split(":")
        .map(Number);
      const reminderTime = new Date();
      reminderTime.setHours(
        clockInHour,
        clockInMin - schedule.reminder_minutes_before,
        0,
        0
      );

      const reminderTimeStr = reminderTime.toTimeString().slice(0, 5);

      if (
        reminderTimeStr <= currentTime &&
        currentTime <= schedule.clock_in_time
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
