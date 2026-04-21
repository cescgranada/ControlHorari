"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatTime } from "@/lib/utils/time";
import type { HistoryEntryItem } from "@/types/domain";

type HistoryGeoMapProps = {
  entries: HistoryEntryItem[];
};

export function HistoryGeoMap({ entries }: HistoryGeoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const bounds: L.LatLng[] = [];

    for (const entry of entries) {
      if (entry.clockInLat && entry.clockInLng) {
        const latlng = L.latLng(entry.clockInLat, entry.clockInLng);
        bounds.push(latlng);
        L.circleMarker(latlng, {
          radius: 8,
          color: "#15803d",
          fillColor: "#22c55e",
          fillOpacity: 0.85,
          weight: 2
        })
          .addTo(map)
          .bindPopup(
            `<b>Entrada</b><br/>${entry.dateLabel}<br/>${formatTime(entry.clockIn)}`
          );
      }

      if (entry.clockOutLat && entry.clockOutLng) {
        const latlng = L.latLng(entry.clockOutLat, entry.clockOutLng);
        bounds.push(latlng);
        L.circleMarker(latlng, {
          radius: 8,
          color: "#b91c1c",
          fillColor: "#ef4444",
          fillOpacity: 0.85,
          weight: 2
        })
          .addTo(map)
          .bindPopup(
            `<b>Sortida</b><br/>${entry.dateLabel}<br/>${formatTime(entry.clockOut)}`
          );
      }
    }

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      } else {
        map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
      }
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [entries]);

  return (
    <div
      ref={mapRef}
      className="h-full w-full"
    />
  );
}
