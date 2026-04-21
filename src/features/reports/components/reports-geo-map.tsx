"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatTime } from "@/lib/utils/time";

export type ReportGeoPoint = {
  userId: string;
  userName: string;
  dateKey: string;
  type: "clockIn" | "clockOut";
  lat: number;
  lng: number;
  time: string | null;
};

const USER_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
  "#84cc16",
  "#ef4444",
  "#a855f7"
];

type ReportsGeoMapProps = {
  points: ReportGeoPoint[];
  userColors: Record<string, string>;
};

export function ReportsGeoMap({ points, userColors }: ReportsGeoMapProps) {
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

    for (const point of points) {
      const latlng = L.latLng(point.lat, point.lng);
      bounds.push(latlng);
      const color = userColors[point.userId] ?? "#6b7280";
      const isClockIn = point.type === "clockIn";

      L.circleMarker(latlng, {
        radius: 7,
        color,
        fillColor: isClockIn ? color : "#ffffff",
        fillOpacity: isClockIn ? 0.85 : 1,
        weight: 2.5
      })
        .addTo(map)
        .bindPopup(
          `<b>${point.userName}</b><br/>` +
          `${isClockIn ? "Entrada" : "Sortida"} · ${point.dateKey}` +
          (point.time ? `<br/>${formatTime(point.time)}` : "")
        );
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
  }, [points, userColors]);

  return <div ref={mapRef} className="h-full w-full" />;
}

export function buildUserColors(
  userIds: string[]
): Record<string, string> {
  return Object.fromEntries(
    userIds.map((id, i) => [id, USER_COLORS[i % USER_COLORS.length] as string])
  );
}
