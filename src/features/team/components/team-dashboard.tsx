"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatTime } from "@/lib/utils/time";

type TeamMemberStatus = {
  id: string;
  name: string;
  email: string;
  status: "clocked_in" | "clocked_out" | "finished" | "on_break" | "absent";
  clockInTime: string | null;
  clockOutTime: string | null;
  absenceType: "sick" | "personal" | "other" | null;
  absenceReason: string | null;
};

type TeamDashboardProps = {
  members: TeamMemberStatus[];
};

function getStatusLabel(status: TeamMemberStatus["status"]): string {
  switch (status) {
    case "clocked_in":
      return "Treballant";
    case "clocked_out":
      return "No ha fitxat";
    case "finished":
      return "Jornada acabada";
    case "on_break":
      return "En pausa";
    case "absent":
      return "Absent";
    default:
      return status;
  }
}

function getStatusTone(status: TeamMemberStatus["status"]) {
  switch (status) {
    case "clocked_in":
      return "success" as const;
    case "clocked_out":
      return "danger" as const;
    case "finished":
      return "brand" as const;
    case "on_break":
      return "pause" as const;
    case "absent":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function getAbsenceTypeLabel(type: "sick" | "personal" | "other"): string {
  switch (type) {
    case "sick":
      return "Baixa mèdica";
    case "personal":
      return "Assumpte personal";
    case "other":
      return "Altre motiu";
    default:
      return type;
  }
}

export function TeamDashboard({ members }: TeamDashboardProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredMembers =
    filter === "all" ? members : members.filter((m) => m.status === filter);

  const stats = {
    total: members.length,
    clockedIn: members.filter((m) => m.status === "clocked_in").length,
    clockedOut: members.filter((m) => m.status === "clocked_out").length,
    finished: members.filter((m) => m.status === "finished").length,
    onBreak: members.filter((m) => m.status === "on_break").length,
    absent: members.filter((m) => m.status === "absent").length
  };

  return (
    <div className="grid gap-6">
      <Card className="bg-white/90 shadow-panel">
        <Badge tone="brand">Equip</Badge>
        <h2 className="mt-4 font-serif text-3xl text-ink">
          Estat de l&apos;equip
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
          Vista general de tots els treballadors del dia d&apos;avui.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-6">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              filter === "all"
                ? "border-brand/20 bg-brand-soft/70"
                : "border-line/80 bg-white hover:bg-mist/50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {stats.total}
            </p>
          </button>

          <button
            onClick={() => setFilter("clocked_in")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              filter === "clocked_in"
                ? "border-success/20 bg-success-soft/70"
                : "border-line/80 bg-white hover:bg-mist/50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Treballant
            </p>
            <p className="mt-1 text-2xl font-semibold text-success">
              {stats.clockedIn}
            </p>
          </button>

          <button
            onClick={() => setFilter("clocked_out")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              filter === "clocked_out"
                ? "border-danger/20 bg-danger-soft/70"
                : "border-line/80 bg-white hover:bg-mist/50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              No fitxat
            </p>
            <p className="mt-1 text-2xl font-semibold text-danger">
              {stats.clockedOut}
            </p>
          </button>

          <button
            onClick={() => setFilter("finished")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              filter === "finished"
                ? "border-brand/20 bg-brand-soft/70"
                : "border-line/80 bg-white hover:bg-mist/50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Acabada
            </p>
            <p className="mt-1 text-2xl font-semibold text-brand-strong">
              {stats.finished}
            </p>
          </button>

          <button
            onClick={() => setFilter("on_break")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              filter === "on_break"
                ? "border-pause/20 bg-pause-soft/70"
                : "border-line/80 bg-white hover:bg-mist/50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              En pausa
            </p>
            <p className="mt-1 text-2xl font-semibold text-pause">
              {stats.onBreak}
            </p>
          </button>

          <button
            onClick={() => setFilter("absent")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              filter === "absent"
                ? "border-line bg-mist/70"
                : "border-line/80 bg-white hover:bg-mist/50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              Absents
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink/60">
              {stats.absent}
            </p>
          </button>
        </div>
      </Card>

      <div className="grid gap-3">
        {filteredMembers.length === 0 ? (
          <Card className="bg-white/90 shadow-panel">
            <p className="text-sm text-ink/60">
              No hi ha treballadors en aquesta categoria.
            </p>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id} className="bg-white/90 p-4 shadow-panel">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      member.status === "clocked_in"
                        ? "bg-success"
                        : member.status === "clocked_out"
                          ? "bg-danger"
                          : member.status === "finished"
                            ? "bg-brand"
                            : member.status === "on_break"
                              ? "bg-pause"
                              : "bg-line"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {member.name}
                    </p>
                    <p className="text-xs text-ink/60">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {member.status === "absent" && member.absenceType && (
                    <div className="text-right">
                      <Badge tone="neutral">
                        {getAbsenceTypeLabel(member.absenceType)}
                      </Badge>
                      {member.absenceReason && (
                        <p className="mt-1 text-xs text-ink/60">
                          {member.absenceReason}
                        </p>
                      )}
                    </div>
                  )}

                  {member.status === "clocked_in" && member.clockInTime && (
                    <div className="text-right">
                      <p className="text-xs text-ink/60">Entrada</p>
                      <p className="text-sm font-semibold text-ink">
                        {formatTime(member.clockInTime)}
                      </p>
                    </div>
                  )}

                  {member.status === "on_break" && (
                    <div className="text-right">
                      <Badge tone="pause">En pausa</Badge>
                      {member.clockInTime && (
                        <p className="mt-1 text-xs text-ink/60">
                          Entrada: {formatTime(member.clockInTime)}
                        </p>
                      )}
                    </div>
                  )}

                  <Badge tone={getStatusTone(member.status)}>
                    {getStatusLabel(member.status)}
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
