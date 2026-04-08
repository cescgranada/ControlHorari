"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationMapProps = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  title?: string;
};

export function LocationMap({
  latitude,
  longitude,
  accuracy,
  title = "Ubicació"
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Fix for Leaflet default icon issue in Next.js
    const prototype = L.Icon.Default.prototype as unknown as {
      _getIconUrl?: unknown;
    };
    delete prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
    });

    const map = L.map(mapRef.current).setView([latitude, longitude], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = L.marker([latitude, longitude]).addTo(map);
    marker
      .bindPopup(
        `<b>${title}</b><br>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}`
      )
      .openPopup();

    if (accuracy) {
      L.circle([latitude, longitude], {
        radius: accuracy,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.2,
        weight: 1
      }).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, accuracy, title]);

  return (
    <div
      ref={mapRef}
      className="h-48 w-full rounded-2xl border border-line/80"
      style={{ minHeight: "200px" }}
    />
  );
}
