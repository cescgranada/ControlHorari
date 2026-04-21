"use client";

import { useState, useEffect, useCallback } from "react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { getDateKey, APP_TIME_ZONE } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  markAbsenceAction,
  deleteAbsenceAction
} from "@/features/absences/actions";

type AbsenceType = "sick" | "personal" | "other";
type AbsenceStatus = "pending" | "approved" | "rejected";

type Absence = {
  id: string;
  date: string;
  type: AbsenceType;
  status: AbsenceStatus;
  isFullDay: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

type MarkAbsenceFormProps = {
  onSave?: (
    date: string,
    type: AbsenceType,
    reason: string,
    isFullDay: boolean,
    startTime: string | null,
    endTime: string | null
  ) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  absences?: Absence[];
  title?: string;
  description?: string;
};

function getAbsenceTypeLabel(type: AbsenceType): string {
  switch (type) {
    case "sick":
      return "Baixa mèdica";
    case "personal":
      return "Dia personal";
    case "other":
      return "Altre motiu";
    default:
      return type;
  }
}

function getStatusLabel(status: AbsenceStatus): string {
  switch (status) {
    case "pending":
      return "Pendent";
    case "approved":
      return "Aprovat";
    case "rejected":
      return "Rebutjat";
    default:
      return status;
  }
}

function getStatusTone(status: AbsenceStatus) {
  switch (status) {
    case "pending":
      return "pause" as const;
    case "approved":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function MarkAbsenceForm({
  onSave,
  onDelete,
  absences = [],
  title = "Gestió d'absències",
  description = "Comunica una baixa o sol·licita un dia personal. Recorda que els dies personals han de ser aprovats per l'administració."
}: MarkAbsenceFormProps) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<AbsenceType>("personal");
  const [reason, setReason] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("14:00");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [absenceToDelete, setAbsenceToDelete] = useState<Absence | null>(null);
  const closeModal = useCallback(() => setAbsenceToDelete(null), []);
  useEscapeKey(closeModal);

  useEffect(() => {
    setDate(getDateKey(new Date(), APP_TIME_ZONE));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (onSave) {
        await onSave(
          date,
          type,
          reason,
          isFullDay,
          isFullDay ? null : startTime,
          isFullDay ? null : endTime
        );
      } else {
        await markAbsenceAction(
          date,
          type,
          reason,
          isFullDay,
          isFullDay ? null : startTime,
          isFullDay ? null : endTime
        );
      }
      setSaved(true);
      setReason("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar el dia.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!absenceToDelete) return;
    try {
      if (onDelete) {
        await onDelete(absenceToDelete.id);
      } else {
        await deleteAbsenceAction(absenceToDelete.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setAbsenceToDelete(null);
    }
  };

  return (
    <>
    {absenceToDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-panel">
          <h3 className="font-serif text-xl text-ink">Cancel·lar sol·licitud</h3>
          <p className="mt-2 text-sm text-ink/70">
            Segur que vols eliminar la sol·licitud del{" "}
            <strong>{absenceToDelete.date.split("-").reverse().join("/")}</strong>?
            Aquesta acció no es pot desfer.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAbsenceToDelete(null)}
              className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist"
            >
              Mantenir
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-2xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    )}
    <Card className="bg-white/90 p-5 shadow-panel">
      <div className="space-y-5">
        <div>
          <h3 className="font-serif text-lg text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink/65">
            {description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {/* ROW 1: TIPUS */}
            <div className="flex flex-col gap-3">
              <label className="ml-1 text-sm font-semibold text-ink/80">
                Quin tipus d&apos;absència sol·licites?
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  {
                    id: "sick",
                    label: "Baixa mèdica",
                    icon: "🌡+",
                    desc: "Incapacitat per malaltia"
                  },
                  {
                    id: "personal",
                    label: "Dia personal",
                    icon: "🌴",
                    desc: "Assumptes propis / vacança"
                  },
                  {
                    id: "other",
                    label: "Altre motiu",
                    icon: "📋",
                    desc: "Visita mèdica, tràmits..."
                  }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id as AbsenceType)}
                    className={`group flex w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-200 ${
                      type === t.id
                        ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                        : "border-line bg-white hover:border-brand/40 hover:bg-mist/50"
                    }`}
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className="flex-shrink-0 text-xl opacity-90 transition-transform group-hover:scale-110">
                        {t.icon}
                      </span>
                      <span
                        className={`line-clamp-1 flex-1 font-semibold ${
                          type === t.id ? "text-brand" : "text-ink"
                        }`}
                      >
                        {t.label}
                      </span>
                    </div>
                    <span className="mt-1 line-clamp-2 w-full whitespace-normal text-xs text-ink/60">
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ROW 2: DATA & MOTIU */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="absence-date"
                  className="ml-1 text-sm font-semibold text-ink/80"
                >
                  Data de l&apos;absència
                </label>
                <input
                  id="absence-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-line bg-white px-4 py-2 text-sm text-ink outline-none transition-all duration-200 focus:border-brand focus:ring-4 focus:ring-brand/5"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="absence-reason"
                  className="ml-1 flex items-center justify-between text-sm font-semibold text-ink/80"
                >
                  Motiu o comentari
                  <span className="text-[10px] font-normal uppercase tracking-wider text-ink/40">
                    Opcional
                  </span>
                </label>
                <input
                  id="absence-reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Assumpte familiar..."
                  className="h-12 w-full rounded-2xl border border-line bg-white px-4 py-2 text-sm text-ink outline-none transition-all duration-200 focus:border-brand focus:ring-4 focus:ring-brand/5"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-2xl border border-line/40 bg-mist/30 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={isFullDay}
                  onChange={(e) => setIsFullDay(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-line after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none rtl:peer-checked:after:-translate-x-full"></div>
                <span className="ms-3 text-sm font-medium text-ink">
                  Dia sencer
                </span>
              </label>
            </div>

            {!isFullDay && (
              <div className="animate-in fade-in slide-in-from-left-4 flex items-center gap-4 duration-500">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                    Inici
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-10 rounded-xl border border-line bg-white px-3 py-1 text-sm text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/5"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                    Fi
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 rounded-xl border border-line bg-white px-3 py-1 text-sm text-ink outline-none transition-all focus:border-brand focus:ring-4 focus:ring-brand/5"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="animate-in fade-in rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger duration-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="h-12 min-w-48 shadow-lg shadow-brand/10 transition-transform active:scale-95"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processant...
                </span>
              ) : type === "personal" ? (
                "Sol·licitar dia"
              ) : (
                "Informar baixa"
              )}
            </Button>
            {saved && (
              <span className="animate-in fade-in slide-in-from-left-2 text-sm font-semibold text-success">
                ✓ Enviat correctament!
              </span>
            )}
          </div>
        </form>

        {absences.length > 0 && (
          <div className="border-t border-line/80 pt-5">
            <p className="mb-4 text-sm font-semibold text-ink">
              Sol·licituds recents
            </p>
            <div className="grid gap-3">
              {absences.map((absence) => (
                <div
                  key={absence.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-line/80 bg-mist/40 p-4 transition hover:bg-mist/60 sm:flex-row sm:items-center"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-ink">
                        {absence.date
                          ? absence.date.split("-").reverse().join("/")
                          : ""}
                      </span>
                      <span className="text-xs text-ink/60">
                        {getAbsenceTypeLabel(absence.type)}
                        {!absence.isFullDay &&
                          absence.startTime &&
                          absence.endTime && (
                            <span className="ml-1 font-medium text-brand">
                              ({absence.startTime.substring(0, 5)} -{" "}
                              {absence.endTime.substring(0, 5)})
                            </span>
                          )}
                      </span>
                    </div>

                    <Badge tone={getStatusTone(absence.status)}>
                      {getStatusLabel(absence.status)}
                    </Badge>

                    {absence.reason && (
                      <span className="text-sm italic text-ink/70">
                        &quot;{absence.reason}&quot;
                      </span>
                    )}
                  </div>

                  {absence.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => setAbsenceToDelete(absence)}
                      className="self-end text-sm font-medium text-danger hover:underline sm:self-auto"
                    >
                      Cancel·lar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
    </>
  );
}
