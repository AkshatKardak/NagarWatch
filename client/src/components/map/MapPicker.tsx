"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Same India-correct HOT tile layer as CivicMap
const INDIA_TILE_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const INDIA_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.hotosm.org">HOT</a>';

interface ReverseGeocodeResponse {
  display_name?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  );
  const data = (await response.json()) as ReverseGeocodeResponse;
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function PickerEvents({
  onPick,
}: {
  onPick: (location: { lat: number; lng: number; address: string }) => Promise<void>;
}) {
  useMapEvents({
    click: async (event) => {
      const lat = event.latlng.lat;
      const lng = event.latlng.lng;
      await onPick({ lat, lng, address: await reverseGeocode(lat, lng) });
    },
  });
  return null;
}

export default function MapPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number; address: string }) => void;
}) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(value);

  useEffect(() => setMarker(value), [value]);

  async function handlePick(location: { lat: number; lng: number; address: string }): Promise<void> {
    setMarker({ lat: location.lat, lng: location.lng });
    onChange(location);
  }

  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">
        Click on the map to pin the issue location
      </p>
      <MapContainer
        center={marker || { lat: 18.5204, lng: 73.8567 }} // Default: Pune
        zoom={13}
        style={{ height: 300 }}
        className="z-0 rounded-lg overflow-hidden"
      >
        <TileLayer url={INDIA_TILE_URL} attribution={INDIA_TILE_ATTRIBUTION} />
        <PickerEvents onPick={handlePick} />
        {marker ? (
          <Marker
            position={marker}
            draggable
            eventHandlers={{
              dragend: async (event) => {
                const target = event.target;
                if (target instanceof L.Marker) {
                  const latLng = target.getLatLng();
                  await handlePick({
                    lat: latLng.lat,
                    lng: latLng.lng,
                    address: await reverseGeocode(latLng.lat, latLng.lng),
                  });
                }
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
