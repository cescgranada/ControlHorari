export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";
import {
  getReportSnapshot,
  getReportSnapshotsPerUser
} from "@/server/services/reports.service";
import { requireUser } from "@/server/services/auth.service";
import { getAllUsers } from "@/server/repositories/user.repository";
import { formatTime } from "@/lib/utils/time";

export async function GET(request: NextRequest) {
  try {
    const context = await requireUser();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const period = searchParams.get("period") ?? "custom";
    const userIdParams = searchParams.getAll("userId");

    if (!from || !to) {
      return new Response("Les dates són obligatòries", { status: 400 });
    }

    // Límit de 184 dies (~6 mesos) per evitar exportacions massives
    const MAX_RANGE_DAYS = 184;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return new Response("Format de data invàlid. Usa YYYY-MM-DD.", {
        status: 400
      });
    }

    if (toDate < fromDate) {
      return new Response(
        "La data de fi no pot ser anterior a la data d'inici.",
        { status: 400 }
      );
    }

    const diffDays = Math.ceil(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > MAX_RANGE_DAYS) {
      return new Response(
        `El rang màxim d'exportació és de ${MAX_RANGE_DAYS} dies (~6 mesos). Has seleccionat ${diffDays} dies.`,
        { status: 400 }
      );
    }

    const isAdmin = context.profile?.role === "admin";

    const validPeriods = ["day", "week", "month", "custom"] as const;
    type ValidPeriod = (typeof validPeriods)[number];
    const isValidPeriod = (p: string): p is ValidPeriod =>
      validPeriods.includes(p as ValidPeriod);

    const filters = {
      from,
      to,
      period: isValidPeriod(period) ? period : "custom"
    };

    const headers = [
      "Usuari",
      "Data",
      "Entrada",
      "Sortida",
      "Temps brut",
      "Pauses",
      "Temps net",
      "Jornades",
      "Pauses registrades",
      "Notes",
      "Motiu d'edició",
      "Tipus",
      "Absència"
    ];

    const fmtMin = (minutes: number): string => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${String(m).padStart(2, "0")}min`;
    };

    let rows: string[][];
    const userNames: string[] = [];

    if (isAdmin && userIdParams.length > 0) {
      const usersResult = await getAllUsers();
      const allUsers = Array.isArray(usersResult.data) ? usersResult.data : [];
      const selectedUsers = allUsers
        .filter((u) => userIdParams.includes(u.id))
        .map((u) => ({ id: u.id, full_name: u.full_name }));

      const userSnapshots = await getReportSnapshotsPerUser(
        selectedUsers,
        filters
      );

      rows = [];
      for (const userReport of userSnapshots) {
        userNames.push(userReport.userName);
        for (const day of userReport.snapshot.days) {
          rows.push([
            userReport.userName,
            day.dateKey,
            day.firstClockIn ? formatTime(day.firstClockIn) : "",
            day.lastClockOut ? formatTime(day.lastClockOut) : "",
            fmtMin(day.workedMinutes),
            fmtMin(day.breakMinutes),
            fmtMin(day.netMinutes),
            day.entryCount.toString(),
            day.breaksCount.toString(),
            day.notes || "",
            day.editReason || "",
            day.isManual ? "Manual" : "Automàtic",
            day.absence
              ? `${day.absence.type}${day.absence.reason ? `: ${day.absence.reason}` : ""}`
              : ""
          ]);
        }
        rows.push([
          userReport.userName,
          "TOTAL",
          "",
          "",
          fmtMin(userReport.snapshot.totals.workedMinutes),
          fmtMin(userReport.snapshot.totals.breakMinutes),
          fmtMin(userReport.snapshot.totals.netMinutes),
          userReport.snapshot.totals.entries.toString(),
          ""
        ]);
      }
    } else {
      const snapshot = await getReportSnapshot(context.user.id, filters);
      const userName =
        context.profile?.full_name ||
        context.user.email?.split("@")[0] ||
        "Usuari";

      rows = snapshot.days.map((day) => [
        userName,
        day.dateKey,
        day.firstClockIn ? formatTime(day.firstClockIn) : "",
        day.lastClockOut ? formatTime(day.lastClockOut) : "",
        fmtMin(day.workedMinutes),
        fmtMin(day.breakMinutes),
        fmtMin(day.netMinutes),
        day.entryCount.toString(),
        day.breaksCount.toString(),
        day.notes || "",
        day.editReason || "",
        day.isManual ? "Manual" : "Automàtic",
        day.absence
          ? `${day.absence.type}${day.absence.reason ? `: ${day.absence.reason}` : ""}`
          : ""
      ]);

      rows.push([
        userName,
        "TOTAL",
        "",
        "",
        fmtMin(snapshot.totals.workedMinutes),
        fmtMin(snapshot.totals.breakMinutes),
        fmtMin(snapshot.totals.netMinutes),
        snapshot.totals.entries.toString(),
        ""
      ]);

      rows.push([
        userName,
        "MITJANA/DIA",
        "",
        "",
        "",
        "",
        fmtMin(snapshot.totals.avgNetMinutesPerDay),
        "",
        ""
      ]);
    }

    const dateRange = `${from}-${to}`;
    let namePart = context.user.email?.split("@")[0] || "Informe";

    if (userNames.length === 1) {
      namePart = userNames[0].replace(/\s+/g, "_");
    } else if (userNames.length > 1) {
      namePart =
        userNames.length <= 3
          ? userNames.map((n) => n.split(" ")[0]).join("_")
          : "Multiples_Treballadors";
    }

    const filename = `${namePart}_${dateRange}.csv`;

    const escapeCell = (cell: string) =>
      `"${cell.replace(/"/g, '""')}"`;

    const csvContent = [
      "sep=;",
      headers.map(escapeCell).join(";"),
      ...rows.map((row) => row.map(escapeCell).join(";"))
    ].join("\n");

    const bom = "\uFEFF";
    return new Response(bom + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en generar el CSV.";
    return new Response(errorMessage, { status: 500 });
  }
}
