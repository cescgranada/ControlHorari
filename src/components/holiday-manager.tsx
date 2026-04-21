"use client";

import { useState, useCallback } from "react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type HolidayScope = "national" | "regional" | "school";
type HolidayType = "holiday" | "closure" | "vacation";

type Holiday = {
  id: string;
  date: string;
  name: string;
  scope: HolidayScope;
  type: HolidayType;
};

type HolidayManagerProps = {
  holidays: Holiday[];
  onAdd: (
    date: string,
    name: string,
    scope: HolidayScope,
    type: HolidayType
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function getScopeLabel(scope: HolidayScope): string {
  switch (scope) {
    case "national":
      return "Nacional";
    case "regional":
      return "Autonòmic";
    case "school":
      return "Centre";
    default:
      return scope;
  }
}

function getTypeLabel(type: HolidayType): string {
  switch (type) {
    case "holiday":
      return "Festa";
    case "closure":
      return "Tancament";
    case "vacation":
      return "Vacances";
    default:
      return type;
  }
}

function getTypeTone(type: HolidayType) {
  switch (type) {
    case "holiday":
      return "brand" as const;
    case "closure":
      return "pause" as const;
    case "vacation":
      return "success" as const;
    default:
      return "neutral" as const;
  }
}

export function HolidayManager({
  holidays,
  onAdd,
  onDelete
}: HolidayManagerProps) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<HolidayScope>("school");
  const [type, setType] = useState<HolidayType>("holiday");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);
  const closeModal = useCallback(() => setHolidayToDelete(null), []);
  useEscapeKey(closeModal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await onAdd(date, name, scope, type);
      setSaved(true);
      setDate("");
      setName("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al afegir el festiu."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!holidayToDelete) return;
    try {
      await onDelete(holidayToDelete.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setHolidayToDelete(null);
    }
  };

  const grouped = holidays.reduce(
    (acc, h) => {
      const month = h.date.substring(0, 7);
      if (!acc[month]) acc[month] = [];
      acc[month].push(h);
      return acc;
    },
    {} as Record<string, Holiday[]>
  );

  return (
    <>
    {holidayToDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white p-6 shadow-panel">
          <h3 className="font-serif text-xl text-ink">Eliminar festiu</h3>
          <p className="mt-2 text-sm text-ink/70">
            Segur que vols eliminar{" "}
            <strong>{holidayToDelete.name}</strong> ({holidayToDelete.date})?
            Aquesta acció no es pot desfer.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setHolidayToDelete(null)}
              className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist"
            >
              Cancel·lar
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
    <Card className="bg-white/90 p-4 shadow-panel">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-ink">
            Calendari de festius
          </h3>
          <p className="text-xs text-ink/60">
            Gestiona els dies festius, tancaments i vacances del centre.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Data</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Nom</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Sant Jordi"
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
                required
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Àmbit</span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as HolidayScope)}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
              >
                <option value="national">Nacional</option>
                <option value="regional">Autonòmic</option>
                <option value="school">Centre</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-ink">
              <span>Tipus</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as HolidayType)}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
              >
                <option value="holiday">Festa</option>
                <option value="closure">Tancament</option>
                <option value="vacation">Vacances</option>
              </select>
            </label>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saving} className="text-sm">
              {saving ? "Desant..." : "Afegir festiu"}
            </Button>
            {saved && <span className="text-sm text-success">Afegit!</span>}
          </div>
        </form>

        {holidays.length > 0 && (
          <div className="space-y-4 border-t border-line/80 pt-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, monthHolidays]) => (
                <div key={month}>
                  <p className="mb-2 text-sm font-semibold text-ink">
                    {new Date(month + "-01").toLocaleDateString("ca-ES", {
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                  <div className="space-y-2">
                    {monthHolidays.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="flex items-center justify-between rounded-xl border border-line/80 bg-mist/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Badge tone={getTypeTone(holiday.type)}>
                            {getTypeLabel(holiday.type)}
                          </Badge>
                          <span className="text-sm text-ink">
                            {holiday.date}
                          </span>
                          <span className="text-sm font-medium text-ink">
                            {holiday.name}
                          </span>
                          <span className="text-xs text-ink/60">
                            {getScopeLabel(holiday.scope)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHolidayToDelete(holiday)}
                          className="text-xs text-danger hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </Card>
    </>
  );
}
