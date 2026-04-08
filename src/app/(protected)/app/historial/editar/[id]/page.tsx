import { redirect } from "next/navigation";
import { requireUser } from "@/server/services/auth.service";
import { getTimeEntryById } from "@/server/repositories/time-entry.repository";
import { updateEntryAction } from "@/features/history/actions";
import { routes } from "@/lib/constants/navigation";

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

  // Convert to local datetime string for input
  const toLocalDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
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

            const clockInIso = new Date(clockIn).toISOString();
            const clockOutIso = clockOut
              ? new Date(clockOut).toISOString()
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
            <label className="block text-sm font-medium text-ink">
              Període
            </label>
            <select
              name="period"
              defaultValue={currentPeriod}
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="full">Jornada completa</option>
              <option value="morning">Matí</option>
              <option value="afternoon">Tarda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Data i hora d&apos;entrada
            </label>
            <input
              type="datetime-local"
              name="clockIn"
              defaultValue={clockInLocal}
              required
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Data i hora de sortida (opcional)
            </label>
            <input
              type="datetime-local"
              name="clockOut"
              defaultValue={clockOutLocal}
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Motiu de la correcció
            </label>
            <textarea
              name="reason"
              required
              rows={3}
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
