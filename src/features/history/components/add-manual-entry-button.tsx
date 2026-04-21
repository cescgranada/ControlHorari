"use client";

import { useState, useCallback } from "react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useRouter } from "next/navigation";
import { getDateKey, APP_TIME_ZONE } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  addManualEntryAction,
  type AddManualEntryResult
} from "@/features/history/actions";

export function AddManualEntryButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const closeModal = useCallback(() => setIsOpen(false), []);
  useEscapeKey(closeModal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSplit, setIsSplit] = useState(false);

  const today = getDateKey(new Date(), APP_TIME_ZONE);
  const sevenDaysAgo = getDateKey(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), APP_TIME_ZONE);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSplit) {
        // Submit morning entry
        const morningData = new FormData();
        morningData.set("date", formData.get("date") as string);
        morningData.set("clockIn", formData.get("morningIn") as string);
        morningData.set("clockOut", formData.get("morningOut") as string);
        morningData.set("reason", formData.get("reason") as string);
        morningData.set("period", "morning");

        const morningResult: AddManualEntryResult =
          await addManualEntryAction(morningData);

        if (!morningResult.success) {
          setError(morningResult.error || "Error al crear l'entrada de matí.");
          setLoading(false);
          return;
        }

        // Submit afternoon entry
        const afternoonData = new FormData();
        afternoonData.set("date", formData.get("date") as string);
        afternoonData.set("clockIn", formData.get("afternoonIn") as string);
        afternoonData.set("clockOut", formData.get("afternoonOut") as string);
        afternoonData.set("reason", formData.get("reason") as string);
        afternoonData.set("period", "afternoon");

        const afternoonResult: AddManualEntryResult =
          await addManualEntryAction(afternoonData);

        if (!afternoonResult.success) {
          setError(
            afternoonResult.error || "Error al crear l'entrada de tarda."
          );
          setLoading(false);
          return;
        }

        setSuccess("Entrades de matí i tarda afegides correctament.");
      } else {
        // Single entry
        const result: AddManualEntryResult =
          await addManualEntryAction(formData);

        if (result.success) {
          setSuccess(result.message || "Entrada afegida correctament.");
        } else {
          setError(result.error || "Ha ocorregut un error.");
          setLoading(false);
          return;
        }
      }

      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        setIsSplit(false);
        router.refresh();
      }, 1500);
    } catch {
      setError("Ha ocorregut un error inesperat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="sm:min-w-48">
        Rectificar fitxatge
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto bg-white p-6">
            <h3 className="font-serif text-2xl text-ink">
              Rectificar fitxatge oblidat
            </h3>
            <p className="mt-2 text-sm text-ink/70">
              Introdueix les hores d&apos;una jornada que has oblidat de fitxar.
              Només pots rectificar entrades dels últims 7 dies.
            </p>

            {error && (
              <div className="mt-4 rounded-md bg-danger-soft p-3 text-sm text-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-md bg-success-soft p-3 text-sm text-success">
                {success}
              </div>
            )}

            <form action={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-ink"
                >
                  Data *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  min={sevenDaysAgo}
                  max={today}
                  defaultValue={today}
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSplit(!isSplit)}
                  className={`relative h-5 w-9 rounded-full transition ${
                    isSplit ? "bg-brand" : "bg-line"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      isSplit ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-ink">
                  Jornada partida (matí i tarda)
                </span>
              </div>

              {!isSplit ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="clockIn"
                      className="block text-sm font-medium text-ink"
                    >
                      Hora d&apos;entrada *
                    </label>
                    <input
                      type="time"
                      id="clockIn"
                      name="clockIn"
                      required
                      defaultValue="08:00"
                      className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="clockOut"
                      className="block text-sm font-medium text-ink"
                    >
                      Hora de sortida (opcional)
                    </label>
                    <input
                      type="time"
                      id="clockOut"
                      name="clockOut"
                      className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-line/80 bg-mist/50 p-3">
                    <p className="mb-2 text-sm font-semibold text-ink">Matí</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="morningIn"
                          className="block text-xs font-medium text-ink"
                        >
                          Entrada *
                        </label>
                        <input
                          type="time"
                          id="morningIn"
                          name="morningIn"
                          required
                          defaultValue="08:00"
                          className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="morningOut"
                          className="block text-xs font-medium text-ink"
                        >
                          Sortida *
                        </label>
                        <input
                          type="time"
                          id="morningOut"
                          name="morningOut"
                          required
                          defaultValue="13:00"
                          className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-line/80 bg-mist/50 p-3">
                    <p className="mb-2 text-sm font-semibold text-ink">Tarda</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="afternoonIn"
                          className="block text-xs font-medium text-ink"
                        >
                          Entrada *
                        </label>
                        <input
                          type="time"
                          id="afternoonIn"
                          name="afternoonIn"
                          required
                          defaultValue="15:00"
                          className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="afternoonOut"
                          className="block text-xs font-medium text-ink"
                        >
                          Sortida *
                        </label>
                        <input
                          type="time"
                          id="afternoonOut"
                          name="afternoonOut"
                          required
                          defaultValue="17:00"
                          className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-ink"
                >
                  Motiu de la rectificació *
                </label>
                <textarea
                  id="reason"
                  name="reason"
                  required
                  rows={3}
                  placeholder="Ex: He oblidat de fitxar l'entrada/sortida"
                  className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                    setSuccess(null);
                    setIsSplit(false);
                  }}
                  disabled={loading}
                >
                  Cancel·lar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Enviant..." : "Envia rectificació"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
