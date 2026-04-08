import Link from "next/link";

import { AuthNotice } from "@/features/auth/components/auth-notice";
import {
  finishBreakAction,
  finishWorkdayAction,
  startBreakAction,
  startWorkdayAction
} from "@/features/dashboard/actions";
import { LiveDuration } from "@/features/dashboard/components/live-duration";
import { GeolocationButton } from "@/features/dashboard/components/geolocation-button";
import { MarkAbsenceForm } from "@/components/mark-absence-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/constants/navigation";
import { formatDuration, formatTime } from "@/lib/utils/time";
import type { BreakType, DashboardSnapshot } from "@/types/domain";

function getGreeting(): string {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 8 && hour < 13) {
    return "Bon dia";
  } else if (hour >= 15 && hour < 17) {
    return "Bona tarda";
  } else {
    return "Bon dia";
  }
}

type DashboardScreenProps = {
  snapshot: DashboardSnapshot;
  userName: string;
  userRole: "worker" | "admin";
  error?: string;
  message?: string;
};

function getStatusTone(status: DashboardSnapshot["status"]) {
  switch (status) {
    case "active":
      return "success" as const;
    case "closed":
      return "brand" as const;
    case "incident":
      return "danger" as const;
    case "on_break":
      return "pause" as const;
    default:
      return "neutral" as const;
  }
}

function getStatusLabel(status: DashboardSnapshot["status"]) {
  switch (status) {
    case "active":
      return "Jornada activa";
    case "closed":
      return "Jornada finalitzada";
    case "incident":
      return "Incidencia";
    case "on_break":
      return "Pausa activa";
    default:
      return "Jornada no iniciada";
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
      return "Reunio externa";
    default:
      return type;
  }
}

export function DashboardScreen({
  snapshot,
  userName,
  userRole,
  error,
  message
}: DashboardScreenProps) {
  const activeEntry = snapshot.activeEntry;
  const activePause = snapshot.activePause;
  const canStartBreak = Boolean(
    activeEntry && !activePause && userRole !== "admin"
  );
  const canFinishWorkday = Boolean(
    activeEntry && !activePause && userRole !== "admin"
  );
  const canStartWorkday = !activeEntry && userRole !== "admin";

  // Si l'usuari és administrador, mostra un missatge diferent
  if (userRole === "admin") {
    return (
      <div className="grid gap-6">
        <Card className="bg-white/90 shadow-panel">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge tone="danger">Administrador</Badge>
              <h2 className="mt-4 font-serif text-3xl text-ink">
                {getGreeting()}, {userName}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
                Ets administrador. Els administradors no necessiten fitxar. Pots
                gestionar usuaris i visualitzar totes les dades.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Link href={routes.adminUsers}>
              <Card className="cursor-pointer border-brand/15 bg-brand-soft/70 transition hover:bg-brand-soft">
                <p className="text-sm font-semibold text-ink">
                  Gestió d&apos;usuaris
                </p>
                <p className="mt-2 text-lg text-ink/70">
                  Crea, edita i gestiona usuaris
                </p>
              </Card>
            </Link>

            <Link href={routes.reports}>
              <Card className="cursor-pointer border-pause/20 bg-pause-soft/70 transition hover:bg-pause-soft">
                <p className="text-sm font-semibold text-ink">Informes</p>
                <p className="mt-2 text-lg text-ink/70">
                  Genera i exporta informes
                </p>
              </Card>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Per a treballadors i coordinadors, mostra el dashboard normal
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="bg-white/90 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone={getStatusTone(snapshot.status)}>
              {getStatusLabel(snapshot.status)}
            </Badge>
            <h2 className="mt-4 font-serif text-3xl text-ink">
              {getGreeting()}, {userName}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
              Aquest espai concentra l&apos;estat actual de la jornada, el resum
              del dia i l&apos;acció principal de fitxatge.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-brand/15 bg-brand-soft/70 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-strong/75">
              Temps d&apos;avui
            </p>
            <p className="mt-2 text-3xl font-semibold text-brand-strong">
              {activePause ? (
                <LiveDuration startIso={activePause.startedAt} />
              ) : activeEntry ? (
                <LiveDuration startIso={activeEntry.clockIn} />
              ) : (
                formatDuration(snapshot.today.netMinutes)
              )}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {activePause
                ? "Durada de la pausa actual"
                : activeEntry
                  ? "Temps en jornada activa"
                  : "Resum net del dia"}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <AuthNotice tone="error" message={error} />
          <AuthNotice message={message} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {canStartWorkday ? (
            <GeolocationButton
              action={startWorkdayAction}
              className="sm:min-w-48"
              showComment={true}
            >
              Iniciar jornada
            </GeolocationButton>
          ) : null}

          {canStartBreak ? (
            <form
              action={startBreakAction}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <select
                name="breakType"
                defaultValue="breakfast"
                className="min-h-11 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand sm:min-w-44"
              >
                <option value="breakfast">Esmorzar</option>
                <option value="lunch">Dinar</option>
                <option value="personal">Pausa personal</option>
                <option value="meeting">Reunió externa</option>
              </select>
              <Button type="submit" variant="secondary" className="sm:min-w-44">
                Iniciar pausa
              </Button>
            </form>
          ) : null}

          {activePause ? (
            <form action={finishBreakAction}>
              <Button type="submit" className="sm:min-w-48">
                Finalitzar pausa
              </Button>
            </form>
          ) : null}

          {canFinishWorkday ? (
            <GeolocationButton
              action={finishWorkdayAction}
              className="sm:min-w-48"
              showComment={true}
              existingNote={activeEntry?.notes ?? null}
            >
              Finalitzar jornada
            </GeolocationButton>
          ) : null}

          <Link
            href={routes.history}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist sm:min-w-48"
          >
            Veure historial
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="border-success/20 bg-success-soft/70">
            <p className="text-sm font-semibold text-ink">Entrada</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {formatTime(snapshot.today.firstClockIn)}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {snapshot.today.hasEntry
                ? "Primer registre del dia"
                : "No registrada"}
            </p>
          </Card>

          <Card className="border-pause/20 bg-pause-soft/70">
            <p className="text-sm font-semibold text-ink">Pauses</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {activePause ? (
                <LiveDuration startIso={activePause.startedAt} />
              ) : (
                formatDuration(snapshot.today.breakMinutes)
              )}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {activePause
                ? getBreakLabel(activePause.breakType)
                : snapshot.today.pauses.length > 0
                  ? `${snapshot.today.pauses.length} pausa/es registrades`
                  : "Sense pauses avui"}
            </p>
          </Card>

          <Card className="border-brand/15 bg-brand-soft/70">
            <p className="text-sm font-semibold text-ink">Temps net</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {formatDuration(snapshot.today.netMinutes)}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              {snapshot.today.hasEntry
                ? "Total avui sense pauses"
                : "Cap registre avui"}
            </p>
          </Card>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white/90 shadow-panel">
          <div className="flex items-center justify-between">
            <Badge tone="brand">Setmana actual</Badge>
            <Link
              href={routes.reports}
              className="text-sm font-semibold text-brand-strong hover:underline"
            >
              Informes
            </Link>
          </div>
          <h3 className="mt-4 font-serif text-2xl text-ink">Resum setmanal</h3>
          <p className="text-ink/68 mt-2 text-sm leading-7">
            {snapshot.week.length > 0
              ? `Portes ${formatDuration(snapshot.week.reduce((sum, day) => sum + day.netMinutes, 0))} aquesta setmana.`
              : "Sense hores registrades aquesta setmana."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line/80 bg-mist/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                Dies
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {snapshot.week.filter((day) => day.hasEntry).length}
              </p>
            </div>
            <div className="rounded-2xl border border-line/80 bg-mist/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
                Net
              </p>
              <p className="mt-2 text-xl font-semibold text-ink">
                {formatDuration(
                  snapshot.week.reduce((sum, day) => sum + day.netMinutes, 0)
                )}
              </p>
            </div>
          </div>
        </Card>

        <MarkAbsenceForm absences={snapshot.absences} />
      </div>
    </div>
  );
}
