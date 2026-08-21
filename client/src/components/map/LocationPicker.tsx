"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertTo3Words, convertToCoordinates, format3Words } from "@/lib/what3words";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export function LocationPicker({
  onLocationSelect,
  initialLat = 18.5204,
  initialLng = 73.8567,
  initialAddress = "",
}: LocationPickerProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [address, setAddress] = useState<string>(initialAddress);
  const [w3w, setW3w] = useState<string>("");
  const [w3wInput, setW3wInput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
    }
  }, [initialLat, initialLng]);

  const handleMapChange = async (loc: { lat: number; lng: number; address: string }) => {
    setLat(loc.lat);
    setLng(loc.lng);
    setAddress(loc.address);
    const threeWords = await convertTo3Words(loc.lat, loc.lng);
    setW3w(threeWords);
    setW3wInput(threeWords);
    onLocationSelect(loc.lat, loc.lng, loc.address);
  };

  const handleResolve3Words = async () => {
    if (!w3wInput.trim()) return;
    setLoading(true);
    try {
      const coords = await convertToCoordinates(w3wInput);
      const addr = await reverseGeocode(coords.lat, coords.lng);
      const formatted = format3Words(w3wInput);
      setLat(coords.lat);
      setLng(coords.lng);
      setAddress(addr);
      setW3w(formatted);
      onLocationSelect(coords.lat, coords.lng, addr);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const userAddr = await reverseGeocode(userLat, userLng);
          const threeWords = await convertTo3Words(userLat, userLng);
          setLat(userLat);
          setLng(userLng);
          setAddress(userAddr);
          setW3w(threeWords);
          setW3wInput(threeWords);
          setLoading(false);
          onLocationSelect(userLat, userLng, userAddr);
        },
        () => setLoading(false),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="text-xs font-bold border-orange-200 text-[#D95D0F] bg-orange-50/50 hover:bg-orange-100"
        >
          {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Navigation className="size-3.5 mr-1.5" />}
          Detect Current GPS
        </Button>

        <div className="flex-1 flex gap-2">
          <Input
            value={w3wInput}
            onChange={(e) => setW3wInput(e.target.value)}
            placeholder="///what3words (e.g. filled.count.soap)"
            className="text-xs font-mono bg-white border-stone-300"
          />
          <Button
            type="button"
            onClick={handleResolve3Words}
            disabled={loading || !w3wInput.trim()}
            className="bg-[#D95D0F] text-white text-xs font-bold shrink-0"
          >
            Resolve
          </Button>
        </div>
      </div>

      {/* Map component */}
      <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
        <MapPicker
          value={lat && lng ? { lat, lng } : null}
          onChange={handleMapChange}
        />
      </div>

      {/* Selected location summary */}
      {address && (
        <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-xs space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <MapPin className="size-3.5 text-[#D95D0F] shrink-0" />
            <span className="truncate">{address}</span>
          </p>
          {w3w && (
            <p className="text-[11px] font-mono text-[#D95D0F] pl-5">
              Micro-location: {w3w}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
