"use client";

import { useState, useEffect } from "react";

type GeolocationState = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false
  });

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocalització no suportada pel navegador"
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = "Error desconegut";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permís denegat per l'usuari";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informació de posició no disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Temps d'espera esgotat";
            break;
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Auto-request on mount (optional)
  useEffect(() => {
    // We don't auto-request to respect user privacy
    // Users must explicitly grant permission
  }, []);

  return {
    ...state,
    getCurrentPosition
  };
}
