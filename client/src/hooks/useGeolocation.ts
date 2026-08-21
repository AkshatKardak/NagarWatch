"use client";

import { useState } from "react";

export interface GeoLocationResult {
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
}

export function useGeolocation(): {
  location: GeoLocationResult | null;
  loading: boolean;
  error: string | null;
  getLocation: () => void;
} {
  const [location, setLocation] = useState<GeoLocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = (): void => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng, latitude: lat, longitude: lng });
        setLoading(false);
      },
      (err) => {
        setError(`Could not get location: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { location, loading, error, getLocation };
}

export default useGeolocation;
