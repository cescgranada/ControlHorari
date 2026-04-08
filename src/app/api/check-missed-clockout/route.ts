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
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const startOfYesterday = `${yesterdayStr}T00:00:00.000Z`;
    const endOfYesterday = `${yesterdayStr}T23:59:59.999Z`;

    const { data: openEntries, error: entriesError } = await supabase
      .from("time_entries")
      .select("id, user_id, clock_in")
      .is("clock_out", null)
      .gte("clock_in", startOfYesterday)
      .lte("clock_in", endOfYesterday);

    if (entriesError) {
      console.error("Error fetching open entries:", entriesError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!openEntries || openEntries.length === 0) {
      return NextResponse.json({
        message: "No open entries found for yesterday",
        count: 0
      });
    }

    const userIds = openEntries.map((e) => e.user_id);
    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const userMap = new Map(
      (users ?? []).map((u) => [
        u.id,
        { full_name: u.full_name, email: u.email ?? "" }
      ])
    );

    const usersToAlert = openEntries.map((entry) => {
      const user = userMap.get(entry.user_id);
      return {
        entryId: entry.id,
        userId: entry.user_id,
        name: user?.full_name ?? "Unknown",
        email: user?.email ?? "",
        clockIn: entry.clock_in
      };
    });

    return NextResponse.json({
      message: "Users with missing clock-out",
      users: usersToAlert,
      count: usersToAlert.length
    });
  } catch (error) {
    console.error("Error in missed clock-out check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
