"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useEscapeKey } from "@/hooks/use-escape-key";
import type { HistoryEntryItem } from "@/types/domain";

const HistoryGeoMap = dynamic(
  () =>
    import("./history-geo-map").then((mod) => mod.HistoryGeoMap),
  { ssr: false }
);

type HistoryGeoMapButtonProps = {
  entries: HistoryEntryItem[];
  workerName?: string;
};

export function HistoryGeoMapButton({ entries, workerName }: HistoryGeoMapButtonProps) {
  const [open, setOpen] = useState(false);

  const geoEntries = entries.filter(
    (e) =>
      (e.clockInLat && e.clockInLng) || (e.clockOutLat && e.clockOutLng)
  );

  if (geoEntries.length === 0) return null;

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
          {geoEntries.length}
        </span>
      </button>

      {open && (
        <GeoMapModal
          entries={geoEntries}
          workerName={workerName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

type GeoMapModalProps = {
  entries: HistoryEntryItem[];
  workerName?: string;
  onClose: () => void;
};

function GeoMapModal({ entries, workerName, onClose }: GeoMapModalProps) {
  useEscapeKey(onClose);

  const clockInCount = entries.filter((e) => e.clockInLat && e.clockInLng).length;
  const clockOutCount = entries.filter((e) => e.clockOutLat && e.clockOutLng).length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative flex flex-1 flex-col overflow-hidden m-4 rounded-[2rem] bg-white shadow-2xl sm:m-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/80 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-strong/70">
              Geolocalització de fitxatges
            </p>
            <h2 className="mt-0.5 font-serif text-xl text-ink">
              {workerName ?? "Historial"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden items-center gap-4 sm:flex">
              <span className="flex items-center gap-1.5 text-xs text-ink/65">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-green-700 bg-green-400" />
                Entrada ({clockInCount})
              </span>
              <span className="flex items-center gap-1.5 text-xs text-ink/65">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-red-700 bg-red-400" />
                Sortida ({clockOutCount})
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink/60 transition hover:bg-mist"
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
          <HistoryGeoMap entries={entries} />
        </div>

        {/* Mobile legend */}
        <div className="flex items-center justify-center gap-6 border-t border-line/80 px-6 py-3 sm:hidden">
          <span className="flex items-center gap-1.5 text-xs text-ink/65">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-green-700 bg-green-400" />
            Entrada ({clockInCount})
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink/65">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-red-700 bg-red-400" />
            Sortida ({clockOutCount})
          </span>
        </div>
      </div>
    </div>
  );
}
