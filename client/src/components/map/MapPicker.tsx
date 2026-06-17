"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Mappls tiles — correct Indian political map
const MAPPLS_KEY =
  process.env.NEXT_PUBLIC_MAPPLS_KEY || "7790ee75403bdda0e09c4b54165453d0";
const MAPPLS_URL = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/still_map/{z}/{x}/{y}.png`;
const MAPPLS_ATTRIBUTION = '&copy; <a href="https://mappls.com">Mappls</a> | MapmyIndia';

/** Orange SVG teardrop pin for the selected location */
const PICK_ICON = L.divIcon({
  className: "",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z"
      fill="#D95D0F" stroke="white" stroke-width="2"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

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

/** Fixes map rendering inside flex / hidden / tab containers */
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function PickerEvents({
  onPick,
}: {
  onPick: (location: { lat: number; lng: number; address: string }) => Promise<void>;
}) {
  useMapEvents({
    click: async (event) => {
      const { lat, lng } = event.latlng;
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
      <p className="mb-2 text-sm" style={{ color: "#6B7280" }}>
        Click on the map to pin the issue location. Drag the pin to adjust.
      </p>
      <div
        className="overflow-hidden rounded-xl border shadow-sm"
        style={{ borderColor: "#ECE7DE", height: 320 }}
      >
        <MapContainer
          center={marker ?? { lat: 18.5204, lng: 73.8567 }} // Default: Pune
          zoom={13}
          minZoom={4}
          maxZoom={18}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <InvalidateOnMount />
          <TileLayer
            url={MAPPLS_URL}
            attribution={MAPPLS_ATTRIBUTION}
            maxZoom={18}
            tileSize={256}
          />
          <PickerEvents onPick={handlePick} />
          {marker && (
            <Marker
              position={marker}
              icon={PICK_ICON}
              draggable
              eventHandlers={{
                dragend: async (event) => {
                  const target = event.target;
                  if (target instanceof L.Marker) {
                    const { lat, lng } = target.getLatLng();
                    await handlePick({
                      lat,
                      lng,
                      address: await reverseGeocode(lat, lng),
                    });
                  }
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
