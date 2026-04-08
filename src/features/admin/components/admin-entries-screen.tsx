"use client";

import { useState } from "react";
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

type AdminEntriesScreenProps = {
  users: UserListItem[];
};

export function AdminEntriesScreen({ users }: AdminEntriesScreenProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [entries, setEntries] = useState<TimeEntryHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntryHistoryItem | null>(
    null
  );
  const [newEntryOpen, setNewEntryOpen] = useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  async function loadEntries() {
    if (!selectedUserId) return;
    setLoading(true);
    setError(null);
    try {
      const fromIso = new Date(fromDate).toISOString();
      const toIso = new Date(toDate).toISOString();
      const data = await getEntriesForUserAction(
        selectedUserId,
        fromIso,
        toIso
      );
      setEntries(data);
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
    if (!confirm("Estàs segur que vols eliminar aquesta entrada?")) return;
    try {
      await deleteEntryAction(entryId);
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error eliminant entrada");
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
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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

      {selectedUser && entries.length > 0 && (
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
                      {new Date(entry.clock_in).toLocaleDateString("ca")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">
                      {new Date(entry.clock_in).toLocaleTimeString("ca", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">
                      {entry.clock_out
                        ? new Date(entry.clock_out).toLocaleTimeString("ca", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink">
                      {entry.is_manual ? "Sí" : "No"}
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
                        onClick={() => handleDeleteEntry(entry.id)}
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

      {selectedUser && entries.length === 0 && !loading && (
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

function EditEntryModal({ entry, onClose, onSave }: EditEntryModalProps) {
  const [clockIn, setClockIn] = useState<string>(
    new Date(entry.clock_in).toISOString().slice(0, 16)
  );
  const [clockOut, setClockOut] = useState<string>(
    entry.clock_out ? new Date(entry.clock_out).toISOString().slice(0, 16) : ""
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md bg-white p-6">
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
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md bg-white p-6">
        <h3 className="font-serif text-2xl text-ink">Crear entrada manual</h3>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
                className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
                className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
              className="mt-1 block w-full rounded-md border border-line px-3 py-2 text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
