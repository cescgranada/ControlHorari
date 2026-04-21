import { redirect } from "next/navigation";
import { requireUser } from "@/server/services/auth.service";
import { getTimeEntryById } from "@/server/repositories/time-entry.repository";
import { updateEntryAction } from "@/features/history/actions";
import { routes } from "@/lib/constants/navigation";
import { localToISO, APP_TIME_ZONE } from "@/lib/utils/time";

type EditEntryPageProps = {
  params: {
    id: string;
  };
};

export default async function EditEntryPage({ params }: EditEntryPageProps) {
  const context = await requireUser();
  const { id } = params;

  const { data: entry, error } = await getTimeEntryById(id);

  if (error || !entry) {
    redirect(routes.history);
  }

  // Ensure the entry belongs to the current user
  if (entry.user_id !== context.user.id) {
    redirect(routes.history);
  }

  // Check if entry is within last 7 days
  const entryDate = new Date(entry.clock_in);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (entryDate < sevenDaysAgo) {
    redirect(routes.history);
  }

  // Convert UTC ISO to datetime-local value in Europe/Madrid
  const toLocalDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
    return parts.replace(" ", "T");
  };

  const clockInLocal = toLocalDateTime(entry.clock_in);
  const clockOutLocal = entry.clock_out ? toLocalDateTime(entry.clock_out) : "";
  const currentPeriod = (entry as { period?: string }).period || "full";

  return (
    <div className="grid gap-6">
      <div className="rounded-md bg-white/90 p-6 shadow-panel">
        <h1 className="font-serif text-3xl text-ink">Editar entrada</h1>
        <p className="mt-2 text-sm text-ink/70">
          Modifica els camps necessaris i indica el motiu de la correcció.
        </p>

        <form
          action={async (formData: FormData) => {
            "use server";
            const clockIn = formData.get("clockIn") as string;
            const clockOut = formData.get("clockOut") as string;
            const reason = formData.get("reason") as string;
            const period = formData.get("period") as string;

            // clockIn/clockOut are "YYYY-MM-DDTHH:MM" from datetime-local input (Europe/Madrid)
            const [ciDate, ciTime] = clockIn.split("T") as [string, string];
            const clockInIso = localToISO(ciDate, ciTime, APP_TIME_ZONE);
            const clockOutIso = clockOut
              ? (() => { const [coDate, coTime] = clockOut.split("T") as [string, string]; return localToISO(coDate, coTime, APP_TIME_ZONE); })()
              : null;

            await updateEntryAction(
              id,
              clockInIso,
              clockOutIso,
              reason,
              period
            );
            redirect(routes.history);
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-ink/80">
              Període
            </label>
            <select
              name="period"
              defaultValue={currentPeriod}
              className="mt-1.5 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/5"
            >
              <option value="full">Jornada completa</option>
              <option value="morning">Matí</option>
              <option value="afternoon">Tarda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink/80">
              Data i hora d&apos;entrada
            </label>
            <input
              type="datetime-local"
              name="clockIn"
              defaultValue={clockInLocal}
              required
              className="mt-1.5 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink/80">
              Data i hora de sortida
              <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-ink/40">Opcional</span>
            </label>
            <input
              type="datetime-local"
              name="clockOut"
              defaultValue={clockOutLocal}
              className="mt-1.5 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/5"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink/80">
              Motiu de la correcció
            </label>
            <textarea
              name="reason"
              required
              rows={3}
              className="mt-1.5 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/5"
              placeholder="Indica per què necessites corregir aquesta entrada..."
            />
          </div>

          {(entry.clock_in_lat != null || entry.clock_out_lat != null) && (
            <div className="rounded-2xl border border-line/80 bg-mist/60 px-4 py-4">
              <p className="text-sm font-semibold text-ink">
                Ubicació del fitxatge original
              </p>
              <p className="mt-1 text-xs text-ink/50">
                La geolocalització no es pot modificar. Es conserva del fitxatge
                original.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {entry.clock_in_lat != null && entry.clock_in_lng != null && (
                  <div className="rounded-xl border border-line/60 bg-white px-3 py-2">
                    <p className="text-xs text-ink/60">Entrada</p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {entry.clock_in_lat.toFixed(6)},{" "}
                      {entry.clock_in_lng.toFixed(6)}
                    </p>
                  </div>
                )}
                {entry.clock_out_lat != null && entry.clock_out_lng != null && (
                  <div className="rounded-xl border border-line/60 bg-white px-3 py-2">
                    <p className="text-xs text-ink/60">Sortida</p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {entry.clock_out_lat.toFixed(6)},{" "}
                      {entry.clock_out_lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <a
              href={routes.history}
              className="rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-white"
            >
              Cancel·lar
            </a>
            <button
              type="submit"
              className="rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Desar canvis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
