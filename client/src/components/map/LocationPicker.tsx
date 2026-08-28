"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Loader2,
  Search,
  CheckCircle2,
  Globe,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertTo3Words, convertToCoordinates, format3Words } from "@/lib/what3words";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] sm:h-[360px] w-full bg-stone-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-stone-200">
      <Loader2 className="size-6 animate-spin text-[#D95D0F]" />
      <span className="text-xs font-semibold">Loading interactive map...</span>
    </div>
  ),
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function forwardGeocode(query: string): Promise<{ lat: number; lng: number; address: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=1`
    );
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name,
      };
    }
    return null;
  } catch {
    return null;
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
  const [searchQuery, setSearchQuery] = useState<string>(initialAddress);
  const [w3w, setW3w] = useState<string>("");
  const [w3wInput, setW3wInput] = useState<string>("");
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingW3W, setLoadingW3W] = useState(false);
  const [searchError, setSearchError] = useState<string>("");

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
    }
    if (initialAddress) {
      setAddress(initialAddress);
      setSearchQuery(initialAddress);
    }
  }, [initialLat, initialLng, initialAddress]);

  // When map pin is clicked or dragged
  const handleMapChange = async (loc: { lat: number; lng: number; address: string }) => {
    setLat(loc.lat);
    setLng(loc.lng);
    setAddress(loc.address);
    setSearchQuery(loc.address);
    setSearchError("");

    const threeWords = await convertTo3Words(loc.lat, loc.lng);
    setW3w(threeWords);
    setW3wInput(threeWords);

    onLocationSelect(loc.lat, loc.lng, loc.address);
  };

  // When user searches a location by text name / landmark
  const handleSearchLocation = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setLoadingSearch(true);
    setSearchError("");

    const result = await forwardGeocode(query);
    if (result) {
      setLat(result.lat);
      setLng(result.lng);
      setAddress(result.address);
      setSearchQuery(result.address);

      const threeWords = await convertTo3Words(result.lat, result.lng);
      setW3w(threeWords);
      setW3wInput(threeWords);

      onLocationSelect(result.lat, result.lng, result.address);
    } else {
      // Fallback: If geocoding fails, still set the custom address text with current lat/lng
      setAddress(query);
      onLocationSelect(lat, lng, query);
      setSearchError("Location pinned with your custom address text");
    }
    setLoadingSearch(false);
  };

  // When user detects GPS location
  const handleUseCurrentLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setLoadingGPS(true);
      setSearchError("");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const userAddr = await reverseGeocode(userLat, userLng);
          const threeWords = await convertTo3Words(userLat, userLng);

          setLat(userLat);
          setLng(userLng);
          setAddress(userAddr);
          setSearchQuery(userAddr);
          setW3w(threeWords);
          setW3wInput(threeWords);
          setLoadingGPS(false);

          onLocationSelect(userLat, userLng, userAddr);
        },
        (err) => {
          setLoadingGPS(false);
          setSearchError("Unable to retrieve GPS location. Please type location name or pin on map.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // What3Words 3-word resolver
  const handleResolve3Words = async () => {
    if (!w3wInput.trim()) return;
    setLoadingW3W(true);
    setSearchError("");

    try {
      const coords = await convertToCoordinates(w3wInput);
      const addr = await reverseGeocode(coords.lat, coords.lng);
      const formatted = format3Words(w3wInput);

      setLat(coords.lat);
      setLng(coords.lng);
      setAddress(addr);
      setSearchQuery(addr);
      setW3w(formatted);

      onLocationSelect(coords.lat, coords.lng, addr);
    } catch {
      setSearchError("Invalid what3words address (expected format: word.word.word)");
    } finally {
      setLoadingW3W(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-6 shadow-xs">
      {/* 1. Address Name Input & Search Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <MapPin className="size-3.5 text-[#D95D0F]" />
            Option A: Write Location Name / Landmark
          </label>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Type area, road, landmark or ward
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setAddress(e.target.value);
                onLocationSelect(lat, lng, e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearchLocation();
                }
              }}
              placeholder="e.g. Indiranagar 100ft Road, Ward 7, Bangalore"
              className="h-11 rounded-xl border-stone-300 bg-[#FAF8F5]/60 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#D95D0F] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setAddress("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <Button
            type="button"
            onClick={handleSearchLocation}
            disabled={loadingSearch || !searchQuery.trim()}
            className="h-11 px-5 rounded-xl bg-[#D95D0F] hover:bg-[#c2510b] text-white font-bold text-xs uppercase tracking-wider shadow-sm shrink-0"
          >
            {loadingSearch ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Search className="size-4 mr-1.5" />
            )}
            Search & Pin
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={loadingGPS}
            className="h-11 px-4 rounded-xl border-orange-200/90 text-[#D95D0F] bg-orange-50/70 hover:bg-orange-100 font-bold text-xs uppercase tracking-wider shrink-0 transition"
          >
            {loadingGPS ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Navigation className="size-4 mr-1.5 text-[#D95D0F]" />
            )}
            Detect GPS
          </Button>
        </div>

        {searchError && (
          <p className="text-[11px] font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60">
            ℹ️ {searchError}
          </p>
        )}
      </div>

      {/* 2. Interactive Map Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Globe className="size-3.5 text-[#D95D0F]" />
            Option B: Pin on Interactive Map
          </label>
          <span className="text-[11px] text-slate-500 font-medium">
            Click anywhere or drag the orange pin
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-50">
          <MapPicker
            value={lat && lng ? { lat, lng } : null}
            onChange={handleMapChange}
          />
        </div>
      </div>

      {/* 3. Micro-location (what3words) option */}
      <div className="pt-1">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={w3wInput}
              onChange={(e) => setW3wInput(e.target.value)}
              placeholder="/// 3-word code (e.g. filled.count.soap)"
              className="h-10 rounded-xl border-stone-300 font-mono text-xs text-slate-800 placeholder:text-slate-400 bg-[#FAF8F5]/40"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleResolve3Words}
            disabled={loadingW3W || !w3wInput.trim()}
            className="h-10 px-4 rounded-xl border-stone-300 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-stone-100 shrink-0"
          >
            {loadingW3W ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            Resolve 3-Words
          </Button>
        </div>
      </div>

      {/* 4. Active Location Confirmation Card */}
      {address && (
        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-orange-200/70 text-xs space-y-1.5 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-slate-900 flex items-start gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{address}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pl-6 pt-0.5">
            <span>
              <strong>GPS:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
            {w3w && (
              <span className="font-mono font-bold text-[#D95D0F]">
                <strong>w3w:</strong> {w3w}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
