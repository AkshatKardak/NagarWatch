"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";

// Fix Leaflet default marker icons broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// CartoDB Voyager — fast, crisp, reliable tiles with full street names and landmark details
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

/** High-contrast orange SVG teardrop pin */
const PICK_ICON = L.divIcon({
  className: "custom-map-picker-pin",
  html: `<div style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 30 42">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z"
        fill="#D95D0F" stroke="#FFFFFF" stroke-width="2.5"/>
      <circle cx="15" cy="15" r="5.5" fill="#FFFFFF"/>
    </svg>
  </div>`,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
  popupAnchor: [0, -46],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/** Handles smooth map resizing and centering when coordinates change */
function MapController({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on mount and window resize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 15), {
        duration: 0.8,
      });
    }
  }, [center, map]);

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
      const address = await reverseGeocode(lat, lng);
      await onPick({ lat, lng, address });
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
  const defaultCenter = { lat: 18.5204, lng: 73.8567 }; // Default: Pune / Central
  const currentPos = value?.lat && value?.lng ? value : null;

  async function handlePick(location: { lat: number; lng: number; address: string }): Promise<void> {
    onChange(location);
  }

  return (
    <div className="relative w-full h-[320px] sm:h-[360px] bg-stone-100 rounded-2xl overflow-hidden">
      <MapContainer
        center={currentPos ?? defaultCenter}
        zoom={currentPos ? 15 : 13}
        minZoom={4}
        maxZoom={19}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <MapController center={currentPos} />
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
          subdomains={["a", "b", "c", "d"]}
        />
        <PickerEvents onPick={handlePick} />

        {currentPos && (
          <Marker
            position={currentPos}
            icon={PICK_ICON}
            draggable
            eventHandlers={{
              dragend: async (event) => {
                const target = event.target;
                if (target instanceof L.Marker) {
                  const { lat, lng } = target.getLatLng();
                  const address = await reverseGeocode(lat, lng);
                  await handlePick({ lat, lng, address });
                }
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
