import { NextRequest } from "next/server";
import {
  getReportSnapshot,
  getReportSnapshotsPerUser
} from "@/server/services/reports.service";
import { requireUser } from "@/server/services/auth.service";
import { getAllUsers } from "@/server/repositories/user.repository";
import { formatTime } from "@/lib/utils/time";
import { jsPDF } from "jspdf";

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

    const dateRange = `${from}-${to}`;
    let filename = `Informe_${dateRange}.pdf`;
    const doc = new jsPDF();
    const lineHeight = 7;
    const colWidths = [30, 40, 40, 30, 30];
    const headers = ["Data", "Entrada", "Sortida", "Temps net", "Pauses"];

    function drawTable(startY: number, data: string[][]): number {
      let y = startY;

      let x = 14;
      headers.forEach((header, i) => {
        doc.text(header, x, y);
        x += colWidths[i];
      });

      y += lineHeight;
      doc.line(14, y, 196, y);
      y += 5;

      data.forEach((row) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        x = 14;
        row.forEach((cell, i) => {
          doc.text(String(cell), x, y);
          x += colWidths[i];
        });
        y += lineHeight;
      });

      return y;
    }

    if (isAdmin && userIdParams.length > 0) {
      const usersResult = await getAllUsers();
      const allUsers = Array.isArray(usersResult.data) ? usersResult.data : [];
      const selectedUsers = allUsers
        .filter((u) => userIdParams.includes(u.id))
        .map((u) => ({ id: u.id, full_name: u.full_name }));

      const namesSlug =
        selectedUsers.length <= 3
          ? selectedUsers.map((u) => u.full_name.split(" ")[0]).join("_")
          : "Multiples_Treballadors";
      filename = `${namesSlug}_${dateRange}.pdf`;

      const userSnapshots = await getReportSnapshotsPerUser(
        selectedUsers,
        filters
      );

      doc.setFontSize(18);
      doc.text("Informe d'hores", 14, 22);
      doc.setFontSize(11);
      doc.text(`Administrador: ${context.user.email}`, 14, 30);
      doc.text(`Període: ${from} a ${to}`, 14, 36);

      let y = 48;

      for (const userReport of userSnapshots) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(13);
        doc.text(userReport.userName, 14, y);
        y += 8;
        doc.setFontSize(10);

        const data = userReport.snapshot.days.map((day) => [
          day.dateKey,
          day.firstClockIn ? formatTime(day.firstClockIn) : "",
          day.lastClockOut ? formatTime(day.lastClockOut) : "",
          `${day.netMinutes} min`,
          `${day.breakMinutes} min`
        ]);

        data.push([
          "TOTAL",
          "",
          "",
          `${userReport.snapshot.totals.netMinutes} min`,
          `${userReport.snapshot.totals.breakMinutes} min`
        ]);

        y = drawTable(y, data);
        y += 5;

        // Afegir notes/incidències si n'hi ha
        const dayWithNotes = userReport.snapshot.days.filter(
          (d) => d.notes || d.editReason || d.absence
        );
        if (dayWithNotes.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Notes i Incidències:", 14, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          dayWithNotes.forEach((d) => {
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
            const noteText = [
              d.absence
                ? `ABSÈNCIA (${d.absence.type}${d.absence.reason ? `: ${d.absence.reason}` : ""})`
                : null,
              d.notes ? `Nota: ${d.notes}` : null,
              d.editReason ? `Motiu: ${d.editReason}` : null,
              d.isManual ? "(Marcatge Manual)" : null
            ]
              .filter(Boolean)
              .join(" - ");

            const splitText = doc.splitTextToSize(
              `${d.dateKey}: ${noteText}`,
              180
            );
            doc.text(splitText, 14, y);
            y += splitText.length * 5;
          });
        }
        y += 10;
      }
    } else {
      const snapshot = await getReportSnapshot(context.user.id, filters);

      const userName =
        context.profile?.full_name ||
        context.user.email?.split("@")[0] ||
        "Usuari";

      doc.setFontSize(18);
      doc.text("Informe d'hores", 14, 22);
      doc.setFontSize(11);
      doc.text(`Treballador: ${userName}`, 14, 30);
      doc.text(`Email: ${context.user.email}`, 14, 36);
      doc.text(`Període: ${from} a ${to}`, 14, 42);

      filename = `${userName.replace(/\s+/g, "_")}_${dateRange}.pdf`;

      const data = snapshot.days.map((day) => [
        day.dateKey,
        day.firstClockIn ? formatTime(day.firstClockIn) : "",
        day.lastClockOut ? formatTime(day.lastClockOut) : "",
        `${day.netMinutes} min`,
        `${day.breakMinutes} min`
      ]);

      data.push([
        "TOTAL",
        "",
        "",
        `${snapshot.totals.netMinutes} min`,
        `${snapshot.totals.breakMinutes} min`
      ]);

      drawTable(45, data);
    }

    const pdfOutput = doc.output("blob");

    return new Response(pdfOutput, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en generar el PDF.";
    return new Response(errorMessage, { status: 500 });
  }
}
