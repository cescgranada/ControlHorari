"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useEscapeKey } from "@/hooks/use-escape-key";
import type { UserReportSnapshot } from "@/types/domain";
import {
  type ReportGeoPoint,
  buildUserColors
} from "./reports-geo-map";

const ReportsGeoMap = dynamic(
  () => import("./reports-geo-map").then((mod) => mod.ReportsGeoMap),
  { ssr: false }
);

type ReportsGeoMapButtonProps = {
  userSnapshots: UserReportSnapshot[];
};

export function ReportsGeoMapButton({ userSnapshots }: ReportsGeoMapButtonProps) {
  const [open, setOpen] = useState(false);

  const { points, userColors } = useMemo(() => {
    const pts: ReportGeoPoint[] = userSnapshots.flatMap(
      ({ userId, userName, snapshot }) =>
        snapshot.days.flatMap((day) => {
          const result: ReportGeoPoint[] = [];
          if (day.clockInLat && day.clockInLng) {
            result.push({
              userId,
              userName,
              dateKey: day.dateKey,
              type: "clockIn",
              lat: day.clockInLat,
              lng: day.clockInLng,
              time: day.firstClockIn
            });
          }
          if (day.clockOutLat && day.clockOutLng) {
            result.push({
              userId,
              userName,
              dateKey: day.dateKey,
              type: "clockOut",
              lat: day.clockOutLat,
              lng: day.clockOutLng,
              time: day.lastClockOut
            });
          }
          return result;
        })
    );

    const colors = buildUserColors(
      userSnapshots.map((u) => u.userId)
    );

    return { points: pts, userColors: colors };
  }, [userSnapshots]);

  if (points.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist"
      >
        <svg
          className="h-4 w-4 text-brand"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        Mapa de fitxatges
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
          {points.length}
        </span>
      </button>

      {open && (
        <GeoMapModal
          points={points}
          userColors={userColors}
          userSnapshots={userSnapshots}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

type GeoMapModalProps = {
  points: ReportGeoPoint[];
  userColors: Record<string, string>;
  userSnapshots: UserReportSnapshot[];
  onClose: () => void;
};

function GeoMapModal({ points, userColors, userSnapshots, onClose }: GeoMapModalProps) {
  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative m-4 flex flex-1 flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl sm:m-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line/80 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-strong/70">
              Geolocalització de fitxatges
            </p>
            <h2 className="mt-0.5 font-serif text-xl text-ink">
              Tots els treballadors
            </h2>
          </div>
          <div className="flex items-start gap-4">
            {/* Legend */}
            <div className="hidden flex-col gap-2 sm:flex">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {userSnapshots.map(({ userId, userName }) => (
                  <span
                    key={userId}
                    className="flex items-center gap-1.5 text-xs text-ink/70"
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full border-2"
                      style={{
                        backgroundColor: userColors[userId],
                        borderColor: userColors[userId]
                      }}
                    />
                    {userName}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5 text-xs text-ink/50">
                  <span className="inline-block h-3 w-3 rounded-full bg-current opacity-80" />
                  Cercle ple = Entrada
                </span>
                <span className="flex items-center gap-1.5 text-xs text-ink/50">
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-current bg-white" />
                  Cercle buit = Sortida
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink/60 transition hover:bg-mist"
              aria-label="Tancar"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 overflow-hidden">
          <ReportsGeoMap points={points} userColors={userColors} />
        </div>

        {/* Mobile legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-line/80 px-6 py-3 sm:hidden">
          {userSnapshots.map(({ userId, userName }) => (
            <span
              key={userId}
              className="flex items-center gap-1.5 text-xs text-ink/70"
            >
              <span
                className="inline-block h-3 w-3 rounded-full border-2"
                style={{
                  backgroundColor: userColors[userId],
                  borderColor: userColors[userId]
                }}
              />
              {userName}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
