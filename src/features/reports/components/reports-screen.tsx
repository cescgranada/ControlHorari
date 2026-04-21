"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDuration, formatTime, getDateKey, APP_TIME_ZONE } from "@/lib/utils/time";
import type { ReportSnapshot, UserReportSnapshot } from "@/types/domain";
import { ReportsChart } from "./reports-chart";
import { ReportsGeoMapButton } from "./reports-geo-map-button";

type ReportsScreenProps = {
  snapshot: ReportSnapshot;
  isAdmin?: boolean;
  users?: Array<{ id: string; full_name: string; email: string }>;
  selectedUserIds?: string[];
  userSnapshots?: UserReportSnapshot[];
};

function getDatePreset(label: string): string {
  const now = new Date();
  const todayStr = getDateKey(now, APP_TIME_ZONE);
  const [year, month] = todayStr.split("-").map(Number) as [number, number, number];
  switch (label) {
    case "today":
      return todayStr;
    case "weekStart": {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: APP_TIME_ZONE,
        weekday: "short"
      }).formatToParts(now);
      const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const day = dayMap[weekday] ?? 1;
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now.getTime() + diff * 86400000);
      return getDateKey(monday, APP_TIME_ZONE);
    }
    case "monthStart":
      return `${year}-${String(month).padStart(2, "0")}-01`;
    case "monthEnd": {
      const lastDay = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
    case "lastMonthStart": {
      const lm = month === 1 ? 12 : month - 1;
      const ly = month === 1 ? year - 1 : year;
      return `${ly}-${String(lm).padStart(2, "0")}-01`;
    }
    case "lastMonthEnd": {
      const lastDay = new Date(year, month - 1, 0).getDate();
      const lm = month === 1 ? 12 : month - 1;
      const ly = month === 1 ? year - 1 : year;
      return `${ly}-${String(lm).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
    default:
      return "";
  }
}

function UserReportCard({ userReport }: { userReport: UserReportSnapshot }) {
  const { userName, snapshot } = userReport;
  const daysWithData = snapshot.days.filter((d) => d.hasEntry);

  return (
    <div className="grid gap-6">
      <Card className="bg-white/90 shadow-panel">
        <div className="flex items-center justify-between">
          <div>
            <Badge tone="brand">{userName}</Badge>
            <h3 className="mt-2 font-serif text-2xl text-ink">
              Informe individual
            </h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink/65">
              {daysWithData.length} dies amb registre
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card className="border-brand/15 bg-brand-soft/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Dies
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {snapshot.totals.days}
            </p>
          </Card>
          <Card className="border-success/20 bg-success-soft/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Brut
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {formatDuration(snapshot.totals.workedMinutes)}
            </p>
          </Card>
          <Card className="border-pause/20 bg-pause-soft/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Pausa
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {formatDuration(snapshot.totals.breakMinutes)}
            </p>
          </Card>
          <Card className="border-brand/15 bg-brand-soft/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Net
            </p>
            <p className="mt-2 text-xl font-semibold text-brand-strong">
              {formatDuration(snapshot.totals.netMinutes)}
            </p>
          </Card>
          <Card className="border-line bg-mist/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Mitjana
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {formatDuration(snapshot.totals.avgNetMinutesPerDay)}
            </p>
          </Card>
        </div>

        <div className="mt-6">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-strong/80">
            Evolució del temps net
          </p>
          <ReportsChart data={snapshot.days} />
        </div>

        <div className="mt-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-ink/50">
            Detall diari
          </p>
          {daysWithData.length === 0 ? (
            <div className="rounded-2xl bg-mist/70 px-4 py-6 text-center text-sm text-ink/60">
              Sense registres en aquest període.
            </div>
          ) : (
            <div className="grid gap-3">
              {snapshot.days
                .filter((d) => d.hasEntry)
                .map((day) => (
                  <DayRow key={day.dateKey} day={day} />
                ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function DayRow({ day }: { day: UserReportSnapshot["snapshot"]["days"][0] }) {
  const hasGeoIn = day.clockInLat != null && day.clockInLng != null;
  const hasGeoOut = day.clockOutLat != null && day.clockOutLng != null;
  return (
    <Card key={day.dateKey} className="bg-white/90 shadow-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Badge
            tone={day.hasEntry ? "success" : day.absence ? "danger" : "neutral"}
          >
            {day.hasEntry
              ? "Completat"
              : day.absence
                ? "Absència"
                : "Sense registre"}
          </Badge>
          {day.isManual && (
            <Badge tone="pause" className="ml-2">
              Manual
            </Badge>
          )}
          <p className="mt-2 text-sm text-ink/65">
            {day.entryCount} jornada/es · {day.breaksCount} pausa/es
          </p>
          {(day.notes || day.editReason || day.absence) && (
            <div className="mt-2 space-y-1">
              {day.absence && (
                <div className="flex flex-col gap-1 rounded-xl border border-line/40 bg-mist/50 p-2">
                  <p className="text-xs font-bold uppercase text-danger opacity-80">
                    {day.absence.type === "sick"
                      ? "Baixa mèdica"
                      : day.absence.type === "personal"
                        ? "Assumpte personal"
                        : "Absència"}
                  </p>
                  {day.absence.reason && (
                    <p className="text-xs italic text-ink/70">
                      &quot;{day.absence.reason}&quot;
                    </p>
                  )}
                </div>
              )}
              {day.notes && (
                <p className="flex items-start gap-1 text-xs italic text-ink/70">
                  <span className="font-semibold not-italic">Nota:</span>{" "}
                  {day.notes}
                </p>
              )}
              {day.editReason && (
                <p className="flex items-start gap-1 text-xs text-brand-strong/80">
                  <span className="font-semibold">Motiu edició:</span>{" "}
                  {day.editReason}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[480px]">
          <div className="rounded-2xl border border-line/80 bg-mist/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Entrada
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {day.firstClockIn ? formatTime(day.firstClockIn) : "--:--"}
            </p>
          </div>
          <div className="rounded-2xl border border-line/80 bg-mist/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Sortida
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {day.lastClockOut ? formatTime(day.lastClockOut) : "--:--"}
            </p>
          </div>
          <div className="rounded-2xl border border-line/80 bg-mist/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Brut
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {formatDuration(day.workedMinutes)}
            </p>
          </div>
          <div className="rounded-2xl border border-brand/15 bg-brand-soft/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-strong/75">
              Net
            </p>
            <p className="mt-2 text-xl font-semibold text-ink">
              {formatDuration(day.netMinutes)}
            </p>
          </div>
        </div>
      </div>
      {(hasGeoIn || hasGeoOut) && (
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink/50">
          {hasGeoIn && (
            <span>
              Entrada: {day.clockInLat!.toFixed(6)},{" "}
              {day.clockInLng!.toFixed(6)}
            </span>
          )}
          {hasGeoOut && (
            <span>
              Sortida: {day.clockOutLat!.toFixed(6)},{" "}
              {day.clockOutLng!.toFixed(6)}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

export function ReportsScreen({
  snapshot,
  isAdmin = false,
  users = [],
  selectedUserIds = [],
  userSnapshots = []
}: ReportsScreenProps) {
  const allSelected =
    selectedUserIds.length === 0 || selectedUserIds.length === users.length;
  const [expanded, setExpanded] = useState(false);

  const MAX_EXPORT_DAYS = 184;
  const exportRangeDays = Math.ceil(
    (new Date(snapshot.filters.to).getTime() -
      new Date(snapshot.filters.from).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const exportRangeTooLarge = exportRangeDays > MAX_EXPORT_DAYS;

  const exportUserIds =
    userSnapshots.length > 0
      ? userSnapshots.map((us) => us.userId)
      : isAdmin
        ? users.map((u) => u.id)
        : [];
  const userIdParam =
    exportUserIds.length > 0
      ? exportUserIds.map((id) => "userId=" + id).join("&")
      : "";
  const exportParams =
    "from=" +
    snapshot.filters.from +
    "&to=" +
    snapshot.filters.to +
    "&period=" +
    snapshot.filters.period +
    (userIdParam ? "&" + userIdParam : "");
  const csvUrl = "/api/reports/csv?" + exportParams;
  const pdfUrl = "/api/reports/pdf?" + exportParams;

  const allUsersIdParam = isAdmin && users.length > 0
    ? users.map((u) => "userId=" + u.id).join("&")
    : "";
  const allUsersExportParams =
    "from=" +
    snapshot.filters.from +
    "&to=" +
    snapshot.filters.to +
    "&period=" +
    snapshot.filters.period +
    (allUsersIdParam ? "&" + allUsersIdParam : "");
  const allUsersCsvUrl = "/api/reports/csv?" + allUsersExportParams;
  const allUsersPdfUrl = "/api/reports/pdf?" + allUsersExportParams;

  const today = getDatePreset("today");
  const weekStart = getDatePreset("weekStart");
  const monthStart = getDatePreset("monthStart");
  const monthEnd = getDatePreset("monthEnd");
  const lastMonthStart = getDatePreset("lastMonthStart");
  const lastMonthEnd = getDatePreset("lastMonthEnd");

  const selectedCount = allSelected ? users.length : selectedUserIds.length;
  const selectedNames = !allSelected
    ? users
        .filter((u) => selectedUserIds.includes(u.id))
        .map((u) => u.full_name)
    : [];

  const hasUserSnapshots = userSnapshots.length > 0;

  return (
    <div className="grid gap-6">
      <Card className="bg-white/90 shadow-panel">
        <Badge tone="brand">Informes</Badge>
        <h2 className="mt-4 font-serif text-3xl text-ink">
          {isAdmin ? "Informes dels treballadors" : "Resum del període"}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
          {isAdmin
            ? "Selecciona els treballadors i el període per generar informes detallats."
            : "Visualitza el teu temps treballat, pauses i resums per dia."}
        </p>

        <form className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
          {isAdmin && users.length > 0 && (
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-ink">
                Treballadors
              </span>
              <div className="rounded-2xl border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm text-ink"
                >
                  <span>
                    {allSelected
                      ? "Tots els treballadors (" + users.length + ")"
                      : selectedCount === 1
                        ? selectedNames[0]
                        : selectedCount + " seleccionats"}
                  </span>
                  <svg
                    className={
                      "h-4 w-4 text-ink/50 transition-transform " +
                      (expanded ? "rotate-180" : "")
                    }
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expanded && (
                  <div className="max-h-48 space-y-1 overflow-y-auto border-t border-line/50 px-3 py-2">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-mist">
                      <input
                        type="checkbox"
                        name="allUsers"
                        defaultChecked={allSelected}
                        className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                        onChange={(e) => {
                          const form = e.target.form;
                          if (form) {
                            form
                              .querySelectorAll("input[name=userId]")
                              .forEach((cb) => {
                                (cb as HTMLInputElement).checked =
                                  e.target.checked;
                              });
                          }
                        }}
                      />
                      <span className="font-medium">
                        Seleccionar tots ({users.length})
                      </span>
                    </label>
                    <hr className="border-line/50" />
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-mist"
                      >
                        <input
                          type="checkbox"
                          name="userId"
                          value={user.id}
                          defaultChecked={
                            allSelected || selectedUserIds.includes(user.id)
                          }
                          className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                        />
                        <span>{user.full_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_auto]">
            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Des de</span>
              <input
                type="date"
                name="from"
                defaultValue={snapshot.filters.from}
                className="min-h-11 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
              />
            </label>
            <div className="flex items-end">
              <span className="pb-3 text-ink/40">—</span>
            </div>
            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Fins a</span>
              <input
                type="date"
                name="to"
                defaultValue={snapshot.filters.to}
                className="min-h-11 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
              />
            </label>
            <button
              type="submit"
              className="min-h-11 self-end rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Filtrar
            </button>
            <Link
              href="/app/informes"
              className="inline-flex min-h-11 items-center justify-center self-end rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
            >
              Reiniciar
            </Link>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="self-center text-xs text-ink/50">Ràpid:</span>
          {[
            { label: "Avui", from: today, to: today },
            { label: "Aquesta setmana", from: weekStart, to: today },
            { label: "Aquest mes", from: monthStart, to: monthEnd },
            { label: "Mes passat", from: lastMonthStart, to: lastMonthEnd }
          ].map((preset) => (
            <Link
              key={preset.label}
              href={"/app/informes?from=" + preset.from + "&to=" + preset.to}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:border-brand/30 hover:bg-brand-soft hover:text-brand-strong"
            >
              {preset.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 border-t border-line/80 pt-4">
          {exportRangeTooLarge && (
            <p className="mb-3 rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">
              El rang seleccionat és de <strong>{exportRangeDays} dies</strong>.
              El màxim permès per exportar és de {MAX_EXPORT_DAYS} dies (~6
              mesos). Redueix el rang de dates.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">
              Exportar selecció
            </span>
            <Button
              variant="secondary"
              disabled={exportRangeTooLarge}
              onClick={() =>
                !exportRangeTooLarge && window.open(csvUrl, "_blank")
              }
            >
              CSV
            </Button>
            <Button
              variant="secondary"
              disabled={exportRangeTooLarge}
              onClick={() =>
                !exportRangeTooLarge && window.open(pdfUrl, "_blank")
              }
            >
              PDF
            </Button>
            {isAdmin && userSnapshots.length > 0 && (
              <ReportsGeoMapButton userSnapshots={userSnapshots} />
            )}
            {isAdmin && users.length > 0 && (
              <>
                <span className="ml-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">
                  Exportar tots
                </span>
                <Button
                  variant="secondary"
                  disabled={exportRangeTooLarge}
                  onClick={() =>
                    !exportRangeTooLarge && window.open(allUsersCsvUrl, "_blank")
                  }
                >
                  CSV tots
                </Button>
                <Button
                  variant="secondary"
                  disabled={exportRangeTooLarge}
                  onClick={() =>
                    !exportRangeTooLarge && window.open(allUsersPdfUrl, "_blank")
                  }
                >
                  PDF tots
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {hasUserSnapshots ? (
        <div className="grid gap-8">
          {userSnapshots.map((userReport) => (
            <UserReportCard key={userReport.userId} userReport={userReport} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-brand/15 bg-brand-soft/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                Dies
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {snapshot.totals.days}
              </p>
            </Card>
            <Card className="border-success/20 bg-success-soft/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                Brut
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {formatDuration(snapshot.totals.workedMinutes)}
              </p>
            </Card>
            <Card className="border-pause/20 bg-pause-soft/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                Pausa
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {formatDuration(snapshot.totals.breakMinutes)}
              </p>
            </Card>
            <Card className="border-brand/15 bg-brand-soft/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                Net
              </p>
              <p className="mt-2 text-xl font-semibold text-brand-strong">
                {formatDuration(snapshot.totals.netMinutes)}
              </p>
            </Card>
            <Card className="border-line bg-mist/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                Mitjana
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {formatDuration(snapshot.totals.avgNetMinutesPerDay)}
              </p>
            </Card>
          </div>
          <Card className="bg-white/90 shadow-panel">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-brand-strong/80">
              Evolució del temps net
            </p>
            <ReportsChart data={snapshot.days} />
          </Card>
          {snapshot.days.length === 0 ? (
            <Card className="bg-white/90 shadow-panel">
              <Badge tone="neutral">Sense resultats</Badge>
              <h3 className="mt-4 font-serif text-2xl text-ink">
                No hi ha dades en aquest rang
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
                Ajusta el filtre de dates per veure els informes.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3">
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-ink/50">
                Detall diari
              </p>
              {snapshot.days.map((day) => (
                <DayRow key={day.dateKey} day={day} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
