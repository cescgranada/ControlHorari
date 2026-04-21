import Link from "next/link";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/constants/navigation";
import { formatDuration, formatTime } from "@/lib/utils/time";
import { isWithinLastNDays } from "@/lib/utils/time-validation";
import type {
  BreakType,
  HistoryEntryItem,
  HistorySnapshot
} from "@/types/domain";
import { AddManualEntryButton } from "./add-manual-entry-button";
import { HistoryGeoMapButton } from "./history-geo-map-button";

const LocationMap = dynamic(
  () =>
    import("@/features/dashboard/components/location-map").then(
      (mod) => mod.LocationMap
    ),
  { ssr: false }
);

type HistoryScreenProps = {
  snapshot: HistorySnapshot;
  isAdmin?: boolean;
  users?: Array<{ id: string; full_name: string; email: string }>;
  selectedUserId?: string;
};

function getStatusTone(status: HistoryEntryItem["status"]) {
  switch (status) {
    case "active":
      return "brand" as const;
    case "incident":
      return "danger" as const;
    default:
      return "success" as const;
  }
}

function getStatusLabel(status: HistoryEntryItem["status"]) {
  switch (status) {
    case "active":
      return "En curs";
    case "incident":
      return "Revisar";
    default:
      return "Correcte";
  }
}

function getBreakLabel(type: BreakType) {
  switch (type) {
    case "breakfast":
      return "Esmorzar";
    case "lunch":
      return "Dinar";
    case "personal":
      return "Pausa personal";
    case "meeting":
      return "Reunió externa";
    default:
      return type;
  }
}

export function HistoryScreen({
  snapshot,
  isAdmin = false,
  users = [],
  selectedUserId
}: HistoryScreenProps) {
  return (
    <div className="grid gap-6">
      <Card className="bg-white/90 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="success">
              {isAdmin && selectedUserId
                ? (users.find((u) => u.id === selectedUserId)?.full_name ?? "Treballador")
                : "Historial personal"}
            </Badge>
            <h2 className="mt-4 font-serif text-3xl text-ink">
              Jornades registrades
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
              Filtra per dates i revisa el detall de cada jornada, incloent-hi
              pauses, observacions i possibles incidències.
            </p>
          </div>

          <form className="grid gap-3 rounded-[1.5rem] border border-line/80 bg-mist/70 p-4 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
            {isAdmin && users.length > 0 && (
              <label className="grid gap-2 text-sm font-medium text-ink">
                <span>Treballador</span>
                <select
                  name="userId"
                  defaultValue={selectedUserId}
                  className="min-h-11 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="grid gap-2 text-sm font-medium text-ink">
              <span>Des de</span>
              <input
                type="date"
                name="from"
                defaultValue={snapshot.filters.from}
                className="min-h-11 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
              />
            </label>

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
              className="min-h-11 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Filtrar
            </button>

            <Link
              href={routes.history}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
            >
              Reiniciar
            </Link>
          </form>
          <div className="flex items-end gap-2">
            <HistoryGeoMapButton
              entries={snapshot.entries}
              workerName={
                isAdmin && selectedUserId
                  ? (users.find((u) => u.id === selectedUserId)?.full_name ?? undefined)
                  : undefined
              }
            />
            <AddManualEntryButton />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card className="border-success/20 bg-success-soft/70">
            <p className="text-sm font-semibold text-ink">Jornades</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {snapshot.totals.days}
            </p>
          </Card>
          <Card className="border-brand/15 bg-brand-soft/70">
            <p className="text-sm font-semibold text-ink">Temps net</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {formatDuration(snapshot.totals.netMinutes)}
            </p>
          </Card>
          <Card className="border-pause/20 bg-pause-soft/70">
            <p className="text-sm font-semibold text-ink">Pauses</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {formatDuration(snapshot.totals.breakMinutes)}
            </p>
          </Card>
          <Card className="border-danger/20 bg-danger-soft/70">
            <p className="text-sm font-semibold text-ink">Incidències</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {snapshot.totals.incidents}
            </p>
          </Card>
        </div>
      </Card>

      {snapshot.entries.length === 0 && snapshot.absences.length === 0 ? (
        <Card className="bg-white/90 shadow-panel">
          <Badge tone="neutral">Sense resultats</Badge>
          <h3 className="mt-4 font-serif text-2xl text-ink">
            No hi ha activitat en aquest rang
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
            Ajusta el filtre de dates per veure jornades o absències
            registrades.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {snapshot.absences.map((absence) => (
            <Card
              key={absence.id}
              className="border-l-4 border-danger/10 border-l-danger bg-danger-soft/20 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={absence.type === "sick" ? "danger" : "brand"}>
                      {absence.type === "sick"
                        ? "Baixa mèdica"
                        : absence.type === "personal"
                          ? "Assumpte personal"
                          : "Absència"}
                    </Badge>
                    <Badge
                      tone={
                        absence.status === "approved"
                          ? "success"
                          : absence.status === "rejected"
                            ? "danger"
                            : "pause"
                      }
                    >
                      {absence.status === "approved"
                        ? "Aprovada"
                        : absence.status === "rejected"
                          ? "Rebutjada"
                          : "Pendent"}
                    </Badge>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl text-ink">
                    {absence.date.split("-").reverse().join("/")}
                  </h3>
                  {absence.reason && (
                    <p className="mt-2 text-sm italic text-ink/70">
                      &quot;{absence.reason}&quot;
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 self-start rounded-full border border-line/10 bg-mist/50 px-3 py-1 text-xs font-semibold text-ink/60 lg:self-center">
                  Jornada no computable
                </div>
              </div>
            </Card>
          ))}
          {snapshot.entries.map((entry) => (
            <details
              key={entry.id}
              className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-panel"
            >
              <summary className="cursor-pointer list-none p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={getStatusTone(entry.status)}>
                        {getStatusLabel(entry.status)}
                      </Badge>
                      {entry.isManual ? (
                        <Badge tone="danger">Ajustada</Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-4 font-serif text-2xl text-ink">
                      {entry.dateLabel}
                    </h3>
                    <p className="mt-2 text-sm text-ink/65">
                      Entrada {formatTime(entry.clockIn)} · Sortida{" "}
                      {formatTime(entry.clockOut)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                    <div className="rounded-2xl border border-line/80 bg-mist/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                        Brut
                      </p>
                      <p className="mt-2 text-xl font-semibold text-ink">
                        {formatDuration(entry.workedMinutes)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-line/80 bg-mist/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                        Pauses
                      </p>
                      <p className="mt-2 text-xl font-semibold text-ink">
                        {formatDuration(entry.breakMinutes)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-brand/15 bg-brand-soft/70 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-strong/75">
                        Net
                      </p>
                      <p className="mt-2 text-xl font-semibold text-ink">
                        {formatDuration(entry.netMinutes)}
                      </p>
                    </div>
                  </div>
                </div>
              </summary>

              <div className="border-t border-line/80 bg-white px-5 py-5 sm:px-6 sm:py-6">
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-strong/75">
                      Detall de la jornada
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-line/80 px-4 py-3">
                        <p className="text-sm text-ink/60">Entrada</p>
                        <p className="mt-2 text-lg font-semibold text-ink">
                          {formatTime(entry.clockIn)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-line/80 px-4 py-3">
                        <p className="text-sm text-ink/60">Sortida</p>
                        <p className="mt-2 text-lg font-semibold text-ink">
                          {formatTime(entry.clockOut)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-line/80 px-4 py-3">
                        <p className="text-sm text-ink/60">Temps net</p>
                        <p className="mt-2 text-lg font-semibold text-ink">
                          {formatDuration(entry.netMinutes)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-line/80 px-4 py-4">
                      <p className="text-sm font-semibold text-ink">Pauses</p>
                      {entry.pauses.length === 0 ? (
                        <p className="mt-3 text-sm text-ink/65">
                          No hi ha pauses registrades en aquesta jornada.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {entry.pauses.map((entryPause) => (
                            <div
                              key={entryPause.id}
                              className="rounded-2xl border border-line/70 bg-mist/60 px-4 py-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-semibold text-ink">
                                  {getBreakLabel(entryPause.type)}
                                </p>
                                <Badge tone="pause">
                                  {formatDuration(entryPause.minutes)}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-ink/65">
                                {formatTime(entryPause.startedAt)} ·{" "}
                                {formatTime(entryPause.endedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-line/80 px-4 py-4">
                      <p className="text-sm font-semibold text-ink">
                        Observacions
                      </p>
                      <p className="text-ink/68 mt-3 text-sm leading-7">
                        {entry.notes ??
                          "Sense observacions per a aquesta jornada."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-line/80 px-4 py-4">
                      <p className="text-sm font-semibold text-ink">
                        Estat del registre
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone={getStatusTone(entry.status)}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                        {entry.isManual ? (
                          <Badge tone="danger">Correcció manual</Badge>
                        ) : null}
                      </div>
                      {entry.editReason ? (
                        <p className="text-ink/68 mt-3 text-sm leading-7">
                          Motiu de correcció: {entry.editReason}
                        </p>
                      ) : null}
                    </div>

                    {(entry.clockInLat && entry.clockInLng) ||
                    (entry.clockOutLat && entry.clockOutLng) ? (
                      <div className="rounded-2xl border border-line/80 px-4 py-4">
                        <p className="text-sm font-semibold text-ink">
                          Ubicació
                        </p>
                        <div className="mt-3 grid gap-4">
                          {entry.clockInLat && entry.clockInLng ? (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
                                Entrada
                              </p>
                              <LocationMap
                                latitude={entry.clockInLat}
                                longitude={entry.clockInLng}
                                title="Ubicació d'entrada"
                              />
                              <p className="mt-2 text-xs text-ink/60">
                                {entry.clockInLat.toFixed(6)}, {entry.clockInLng.toFixed(6)}
                              </p>
                            </div>
                          ) : null}
                          {entry.clockOutLat && entry.clockOutLng ? (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
                                Sortida
                              </p>
                              <LocationMap
                                latitude={entry.clockOutLat}
                                longitude={entry.clockOutLng}
                                title="Ubicació de sortida"
                              />
                              <p className="mt-2 text-xs text-ink/60">
                                {entry.clockOutLat.toFixed(6)}, {entry.clockOutLng.toFixed(6)}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {/* Edit button for entries within last 7 days */}
                    {entry.status !== "active" && isWithinLastNDays(entry.clockIn, 7) && (
                      <div className="rounded-2xl border border-line/80 px-4 py-4">
                        <p className="text-sm font-semibold text-ink">
                          Accions
                        </p>
                        <div className="mt-3">
                          <Link
                            href={`/app/historial/editar/${entry.id}`}
                            className="inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
                          >
                            Editar entrada
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      {snapshot.pagination.totalPages > 1 && (
        <Pagination
          page={snapshot.pagination.page}
          totalPages={snapshot.pagination.totalPages}
          totalEntries={snapshot.pagination.totalEntries}
          pageSize={snapshot.pagination.pageSize}
          filters={snapshot.filters}
          selectedUserId={selectedUserId}
        />
      )}
    </div>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  totalEntries: number;
  pageSize: number;
  filters: HistorySnapshot["filters"];
  selectedUserId?: string;
};

function Pagination({ page, totalPages, totalEntries, pageSize, filters, selectedUserId }: PaginationProps) {
  function buildUrl(targetPage: number) {
    const params = new URLSearchParams();
    params.set("from", filters.from);
    params.set("to", filters.to);
    if (selectedUserId) params.set("userId", selectedUserId);
    if (targetPage > 1) params.set("page", String(targetPage));
    return `/app/historial?${params.toString()}`;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalEntries);

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-ink/50">
        Mostrant {from}–{to} de {totalEntries} entrades
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildUrl(1)}
          aria-disabled={page === 1}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-line text-sm transition hover:bg-mist ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
        >
          «
        </Link>
        <Link
          href={buildUrl(page - 1)}
          aria-disabled={page === 1}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-line text-sm transition hover:bg-mist ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
        >
          ‹
        </Link>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-ink/40">…</span>
            ) : (
              <Link
                key={p}
                href={buildUrl(p as number)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition ${p === page ? "border-brand bg-brand text-white" : "border-line hover:bg-mist"}`}
              >
                {p}
              </Link>
            )
          )}

        <Link
          href={buildUrl(page + 1)}
          aria-disabled={page === totalPages}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-line text-sm transition hover:bg-mist ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}
        >
          ›
        </Link>
        <Link
          href={buildUrl(totalPages)}
          aria-disabled={page === totalPages}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-line text-sm transition hover:bg-mist ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}
        >
          »
        </Link>
      </div>
    </div>
  );
}
