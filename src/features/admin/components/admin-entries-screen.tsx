"use client";

import { useState } from "react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserListItem } from "@/server/repositories/user.repository";
import type { TimeEntryHistoryItem } from "@/server/repositories/time-entry.repository";
import {
  getEntriesForUserAction,
  updateEntryAction,
  createManualEntryForUserAction,
  deleteEntryAction
} from "@/features/admin/actions";
import { APP_TIME_ZONE, getDateKey, formatTime } from "@/lib/utils/time";

type AdminEntriesScreenProps = {
  users: UserListItem[];
};

export function AdminEntriesScreen({ users }: AdminEntriesScreenProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return getDateKey(d, APP_TIME_ZONE);
  });
  const [toDate, setToDate] = useState<string>(() =>
    getDateKey(new Date(), APP_TIME_ZONE)
  );
  const [entries, setEntries] = useState<TimeEntryHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntryHistoryItem | null>(
    null
  );
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntryHistoryItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  async function loadEntries() {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      const fromIso = `${fromDate}T00:00:00.000Z`;
      const toIso = `${toDate}T23:59:59.999Z`;
      const data = await getEntriesForUserAction(
        selectedUserId,
        fromIso,
        toIso
      );
      setEntries(data);
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error carregant entrades");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEntry(
    entryId: string,
    clockIn: string,
    clockOut: string | null,
    reason: string
  ) {
    try {
      await updateEntryAction(entryId, clockIn, clockOut, reason);
      setEditingEntry(null);
      await loadEntries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error actualitzant entrada"
      );
    }
  }

  async function handleCreateEntry(
    clockIn: string,
    clockOut: string | null,
    reason: string
  ) {
    if (!selectedUserId) return;
    try {
      await createManualEntryForUserAction(
        selectedUserId,
        clockIn,
        clockOut,
        reason
      );
      setNewEntryOpen(false);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creant entrada");
    }
  }

  async function handleDeleteEntry(entryId: string) {
    setLoading(true);
    try {
      await deleteEntryAction(entryId);
      setEntryToDelete(null);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminant entrada");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-white/90 shadow-panel">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="danger">Administració</Badge>
            <h2 className="mt-4 font-serif text-3xl text-ink">
              Correcció manual d&apos;entrades
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
              Selecciona un usuari i un rang de dates per veure i corregir les
              seves entrades d&apos;hores. Els administradors poden modificar
              qualsevol entrada.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div>
            <label
              htmlFor="user"
              className="block text-sm font-medium text-ink"
            >
              Usuari
            </label>
            <select
              id="user"
              value={selectedUserId ?? ""}
              onChange={(e) => setSelectedUserId(e.target.value || null)}
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
            >
              <option value="">Selecciona un usuari</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="from"
              className="block text-sm font-medium text-ink"
            >
              Des de
            </label>
            <input
              type="date"
              id="from"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="to" className="block text-sm font-medium text-ink">
              Fins a
            </label>
            <input
              type="date"
              id="to"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              className="flex-1"
              disabled={!selectedUserId || loading}
              onClick={loadEntries}
            >
              {loading ? "Carregant..." : "Carregar entrades"}
            </Button>
            <Button
              variant="secondary"
              disabled={!selectedUserId}
              onClick={() => setNewEntryOpen(true)}
            >
              Nova entrada
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading && (
        <Card className="bg-white/90 shadow-panel">
          <div className="mb-4 h-7 w-48 animate-pulse rounded-lg bg-mist" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead>
                <tr>
                  {["Data", "Entrada", "Sortida", "Manual", "GPS", "Motiu", "Accions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/65">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-mist" style={{ width: j === 5 ? "80%" : j === 6 ? "100%" : "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && selectedUser && entries.length > 0 && (
        <Card className="bg-white/90 shadow-panel">
          <h3 className="font-serif text-2xl text-ink">
            Entrades de {selectedUser.full_name}
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/65">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/65">
                    Entrada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/65">
                    Sortida
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/65">
                    Manual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/65">
                    GPS
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/65">
                    Motiu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink/65">
                    Accions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">
                      {getDateKey(entry.clock_in, APP_TIME_ZONE)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">
                      {formatTime(entry.clock_in)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">
                      {formatTime(entry.clock_out) ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">
                      {entry.is_manual ? "Sí" : "No"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        title={
                          entry.clock_in_lat && entry.clock_in_lng && entry.clock_out_lat && entry.clock_out_lng
                            ? "Entrada i sortida geolocalitzades"
                            : entry.clock_in_lat && entry.clock_in_lng
                              ? "Entrada geolocalitzada"
                              : entry.clock_out_lat && entry.clock_out_lng
                                ? "Sortida geolocalitzada"
                                : "Sense geolocalització"
                        }
                        className={
                          (entry.clock_in_lat && entry.clock_in_lng) || (entry.clock_out_lat && entry.clock_out_lng)
                            ? "font-medium text-success"
                            : "text-ink/35"
                        }
                      >
                        {entry.clock_in_lat && entry.clock_in_lng && entry.clock_out_lat && entry.clock_out_lng
                          ? "E+S"
                          : entry.clock_in_lat && entry.clock_in_lng
                            ? "E"
                            : entry.clock_out_lat && entry.clock_out_lng
                              ? "S"
                              : "—"}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-ink">
                      {entry.edit_reason || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <Button
                        variant="secondary"
                        className="mr-2"
                        onClick={() => setEditingEntry(entry)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        className="border-danger/20 text-danger hover:bg-danger-soft/70"
                        onClick={() => setEntryToDelete(entry)}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && hasSearched && selectedUser && entries.length === 0 && (
        <Card className="bg-white/90 shadow-panel">
          <p className="text-ink/70">
            No s&apos;han trobat entrades per a l&apos;usuari seleccionat i el
            període indicat.
          </p>
        </Card>
      )}

      {/* Modal for editing entry */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleUpdateEntry}
        />
      )}

      {/* Modal for new entry */}
      {newEntryOpen && selectedUserId && (
        <NewEntryModal
          onClose={() => setNewEntryOpen(false)}
          onSave={handleCreateEntry}
        />
      )}

      {/* Modal de confirmació d'eliminació */}
      {entryToDelete && (
        <DeleteConfirmModal
          entry={entryToDelete}
          loading={loading}
          onCancel={() => setEntryToDelete(null)}
          onConfirm={() => handleDeleteEntry(entryToDelete.id)}
        />
      )}
    </div>
  );
}

type DeleteConfirmModalProps = {
  entry: TimeEntryHistoryItem;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteConfirmModal({ entry, loading, onCancel, onConfirm }: DeleteConfirmModalProps) {
  useEscapeKey(onCancel);
  const date = getDateKey(entry.clock_in, APP_TIME_ZONE);
  const clockIn = formatTime(entry.clock_in);
  const clockOut = entry.clock_out ? formatTime(entry.clock_out) : "sense sortida";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-sm bg-white p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft">
            <svg
              className="h-7 w-7 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ink">Eliminar entrada</h3>
            <p className="mt-1 text-sm text-ink/60">
              Aquesta acció no es pot desfer.
            </p>
          </div>
          <div className="w-full rounded-xl border border-line bg-mist/40 px-4 py-3 text-left text-sm">
            <p className="font-medium capitalize text-ink">{date}</p>
            <p className="mt-0.5 text-ink/60">
              {clockIn} → {clockOut}
            </p>
            {entry.edit_reason && (
              <p className="mt-1 text-xs italic text-ink/50">
                &ldquo;{entry.edit_reason}&rdquo;
              </p>
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel·lar
          </Button>
          <Button
            className="flex-1 bg-danger text-white hover:bg-danger/90"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Eliminant..." : "Eliminar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

type EditEntryModalProps = {
  entry: TimeEntryHistoryItem;
  onClose: () => void;
  onSave: (
    entryId: string,
    clockIn: string,
    clockOut: string | null,
    reason: string
  ) => Promise<void>;
};

function toLocalDateTime(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function EditEntryModal({ entry, onClose, onSave }: EditEntryModalProps) {
  useEscapeKey(onClose);
  const [clockIn, setClockIn] = useState<string>(toLocalDateTime(entry.clock_in));
  const [clockOut, setClockOut] = useState<string>(
    entry.clock_out ? toLocalDateTime(entry.clock_out) : ""
  );
  const [reason, setReason] = useState<string>(entry.edit_reason || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onSave(
      entry.id,
      new Date(clockIn).toISOString(),
      clockOut ? new Date(clockOut).toISOString() : null,
      reason
    );
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-2xl text-ink">Editar entrada</h3>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">
              Data i hora d&apos;entrada
            </label>
            <input
              type="datetime-local"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Data i hora de sortida (opcional)
            </label>
            <input
              type="datetime-local"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Motiu de la correcció
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Explica per què s'ha de corregir aquesta entrada..."
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand placeholder:text-ink/35"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel·lar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Desant..." : "Desar canvis"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

type NewEntryModalProps = {
  onClose: () => void;
  onSave: (
    clockIn: string,
    clockOut: string | null,
    reason: string
  ) => Promise<void>;
};

function NewEntryModal({ onClose, onSave }: NewEntryModalProps) {
  useEscapeKey(onClose);
  const [date, setDate] = useState<string>(() => getDateKey(new Date(), APP_TIME_ZONE));
  const [clockInTime, setClockInTime] = useState<string>("08:00");
  const [clockOutTime, setClockOutTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const clockIn = new Date(`${date}T${clockInTime}`).toISOString();
    const clockOut = clockOutTime
      ? new Date(`${date}T${clockOutTime}`).toISOString()
      : null;
    await onSave(clockIn, clockOut, reason);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-2xl text-ink">Crear entrada manual</h3>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink">
                Hora d&apos;entrada
              </label>
              <input
                type="time"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
                required
                className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">
                Hora de sortida (opcional)
              </label>
              <input
                type="time"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Motiu de la creació manual
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Indica el motiu d'aquesta entrada manual..."
              className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-brand placeholder:text-ink/35"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel·lar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creant..." : "Crear entrada"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
