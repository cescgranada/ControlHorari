"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateAbsenceStatusAction } from "@/features/absences/actions";
import type { PendingAbsence } from "@/server/services/team.service";

type AdminAbsenceManagementProps = {
  pendingAbsences: PendingAbsence[];
};

export function AdminAbsenceManagement({
  pendingAbsences: initialAbsences
}: AdminAbsenceManagementProps) {
  const [absences, setAbsences] = useState(initialAbsences);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusUpdate = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    setLoadingId(id);
    try {
      await updateAbsenceStatusAction(id, status);
      // Remove from list on success
      setAbsences((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error updating absence status:", error);
      alert("Error al processar la sol·licitud.");
    } finally {
      setLoadingId(null);
    }
  };

  if (absences.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-l-4 border-none border-l-brand bg-white/90 p-6 shadow-panel">
      <div className="mb-6 flex items-center gap-2">
        <Badge tone="brand">Pendent d&apos;aprovació</Badge>
        <h2 className="font-serif text-2xl text-ink">
          Dies personals sol·licitats
        </h2>
      </div>

      <div className="grid gap-4">
        {absences.map((absence) => (
          <div
            key={absence.id}
            className="flex flex-col gap-4 rounded-2xl border border-line/50 p-4 transition hover:bg-mist/30 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft font-bold text-brand-strong">
                {absence.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ink">{absence.userName}</p>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <p className="font-serif text-xl text-ink">
                    {absence.date
                      ? absence.date.split("-").reverse().join("/")
                      : ""}
                  </p>
                  {!absence.isFullDay &&
                    absence.startTime &&
                    absence.endTime && (
                      <Badge tone="pause" className="px-2 py-0.5 text-[10px]">
                        {absence.startTime.substring(0, 5)} -{" "}
                        {absence.endTime.substring(0, 5)}
                      </Badge>
                    )}
                </div>
                {absence.reason && (
                  <p className="mt-1 text-sm italic text-ink/60">
                    &quot;{absence.reason}&quot;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-center">
              <Button
                variant="secondary"
                className="h-10 rounded-xl border-danger/20 px-4 text-xs font-bold text-danger hover:bg-danger-soft/70"
                onClick={() => handleStatusUpdate(absence.id, "rejected")}
                disabled={loadingId === absence.id}
              >
                Rebutjar
              </Button>
              <Button
                className="h-10 rounded-xl px-4 text-xs font-bold shadow-md shadow-brand/10"
                onClick={() => handleStatusUpdate(absence.id, "approved")}
                disabled={loadingId === absence.id}
              >
                {loadingId === absence.id ? "Processant..." : "Aprovar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
