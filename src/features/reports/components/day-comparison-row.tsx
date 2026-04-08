import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDuration, formatTime } from "@/lib/utils/time";
import type { UserReportSnapshot } from "@/types/domain";

type DayComparisonRowProps = {
  dateKey: string;
  userSnapshots: UserReportSnapshot[];
};

export function DayComparisonRow({
  dateKey,
  userSnapshots
}: DayComparisonRowProps) {
  return (
    <Card className="bg-white/90 shadow-panel">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-strong/80">
        {dateKey}
      </p>
      <div
        className="mt-4 grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(userSnapshots.length, 3)}, 1fr)`
        }}
      >
        {userSnapshots.map((us) => {
          const day = us.snapshot.days.find((d) => d.dateKey === dateKey);
          if (!day || !day.hasEntry) {
            return (
              <div
                key={us.userId}
                className={`rounded-2xl border ${day?.absence ? "border-danger/20 bg-danger-soft/30" : "border-line/80 bg-mist/30"} px-4 py-3`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {us.userName}
                    </p>
                    {day?.absence && (
                      <p className="mt-1 text-[10px] font-bold uppercase text-danger">
                        {day.absence.type === "sick"
                          ? "Baixa mèdica"
                          : "Absència"}
                      </p>
                    )}
                  </div>
                  <Badge
                    tone={day?.absence ? "danger" : "neutral"}
                    className="text-xs"
                  >
                    {day?.absence ? "Absència" : "Sense registre"}
                  </Badge>
                </div>
              </div>
            );
          }

          const hasGeoIn = day.clockInLat != null && day.clockInLng != null;
          const hasGeoOut = day.clockOutLat != null && day.clockOutLng != null;

          return (
            <div
              key={us.userId}
              className="rounded-2xl border border-line/80 bg-mist/50 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{us.userName}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge tone="success" className="text-xs">
                    Completat
                  </Badge>
                  {day.isManual && (
                    <Badge tone="pause" className="text-xs">
                      Manual
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-ink/60">Entrada</p>
                  <p className="font-semibold text-ink">
                    {day.firstClockIn ? formatTime(day.firstClockIn) : "--:--"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink/60">Sortida</p>
                  <p className="font-semibold text-ink">
                    {day.lastClockOut ? formatTime(day.lastClockOut) : "--:--"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink/60">Brut</p>
                  <p className="font-semibold text-ink">
                    {formatDuration(day.workedMinutes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink/60">Net</p>
                  <p className="font-semibold text-brand-strong">
                    {formatDuration(day.netMinutes)}
                  </p>
                </div>
              </div>

              {(hasGeoIn || hasGeoOut) && (
                <div className="mt-2 flex flex-col gap-1 text-xs text-ink/40">
                  {hasGeoIn && (
                    <span>
                      In: {day.clockInLat!.toFixed(4)},{" "}
                      {day.clockInLng!.toFixed(4)}
                    </span>
                  )}
                  {hasGeoOut && (
                    <span>
                      Out: {day.clockOutLat!.toFixed(4)},{" "}
                      {day.clockOutLng!.toFixed(4)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
