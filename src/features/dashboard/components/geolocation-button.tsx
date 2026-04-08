"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";

const LocationMap = dynamic(
  () => import("./location-map").then((mod) => mod.LocationMap),
  { ssr: false }
);

type GeolocationButtonProps = {
  action: (formData: FormData) => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  showMap?: boolean;
  showComment?: boolean;
  existingNote?: string | null;
};

export function GeolocationButton({
  action,
  children,
  variant = "primary",
  className,
  showMap = true,
  showComment = false,
  existingNote = null
}: GeolocationButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { latitude, longitude, accuracy, loading, error, getCurrentPosition } =
    useGeolocation();
  const [submittedOnError, setSubmittedOnError] = useState(false);
  const [comment, setComment] = useState(existingNote ?? "");

  useEffect(() => {
    if (latitude !== null && longitude !== null && formRef.current) {
      const formData = new FormData(formRef.current);
      formData.set("latitude", latitude.toString());
      formData.set("longitude", longitude.toString());
      formData.set("comment", comment);
      action(formData);
    }
  }, [latitude, longitude, action, comment]);

  useEffect(() => {
    if (error && formRef.current && !loading && !submittedOnError) {
      setSubmittedOnError(true);
      const formData = new FormData(formRef.current);
      formData.set("comment", comment);
      action(formData);
    }
  }, [error, action, loading, submittedOnError, comment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedOnError(false);
    getCurrentPosition();
  };

  return (
    <div className="flex flex-col gap-3">
      <form ref={formRef} action={action} onSubmit={handleSubmit}>
        <input type="hidden" name="latitude" value={latitude ?? ""} />
        <input type="hidden" name="longitude" value={longitude ?? ""} />

        {showComment && (
          <div className="mb-3">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 50))}
              placeholder="Comentari (opcional, màx. 50 caràcters)"
              maxLength={50}
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand"
            />
            <div className="mt-1 flex items-center justify-between">
              {existingNote && comment === existingNote ? (
                <p className="text-xs text-ink/40">
                  Nota de l&apos;entrada. Pots modificar-la o esborrar-la.
                </p>
              ) : (
                <span />
              )}
              <p className="ml-auto text-xs text-ink/40">
                {comment.length}/50 caràcters
              </p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant={variant}
          className={className}
          disabled={loading}
        >
          {loading ? "Obtenint ubicació..." : children}
        </Button>

        {error && !loading && (
          <p className="mt-2 text-xs text-ink/60">
            {error}. Es registrarà sense coordenades.
          </p>
        )}
      </form>

      {showMap && latitude !== null && longitude !== null && (
        <div className="mt-4">
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            accuracy={accuracy ?? undefined}
            title="Ubicació del fitxatge"
          />
          <p className="mt-2 text-xs text-ink/60">
            Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
            {accuracy && ` (precisió: ${Math.round(accuracy)}m)`}
          </p>
        </div>
      )}
    </div>
  );
}
