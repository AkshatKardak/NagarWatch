"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, GeoJSON, CircleMarker, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import type { IComplaint } from "@/types/complaint";
import { getCategoryLabel, timeAgo } from "@/lib/utils";
import { getSocket } from "@/lib/socket";
import indiaBoundaryData from "./indiaBoundary.json";

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// CartoDB Voyager tile layer
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// National boundary of India coordinates bounding box
const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.4626999, 68.1097], // South-West
  [37.084107, 97.395561], // North-East
];

const STATUS_COLORS: Record<string, string> = {
  pending: "#EF4444",
  in_progress: "#F59E0B",
  resolution_submitted: "#3B82F6",
  awaiting_citizen_verification: "#8B5CF6",
  verified_resolved: "#10B981",
  resolved: "#10B981",
  reopened: "#DC2626",
};

function makeIcon(color: string, size: "normal" | "large" = "normal"): L.DivIcon {
  const w = size === "large" ? 36 : 30;
  const h = size === "large" ? 50 : 42;
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 30 42">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h],
  });
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function getHeatColor(weight: number): string {
  if (weight >= 8) return "#DC2626"; // Critical Red
  if (weight >= 5) return "#EA580C"; // High Orange
  if (weight >= 3) return "#F59E0B"; // Medium Amber
  return "#10B981"; // Low Emerald
}

export default function CivicMap({
  complaints: initialComplaints,
  height = "500px",
  center = [22.5937, 78.9629],
  zoom = 5,
  onMarkerClick,
  showControls,
  className = "",
  initialMode = "markers",
}: {
  complaints: IComplaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: IComplaint) => void;
  showControls?: boolean;
  className?: string;
  initialMode?: "markers" | "heatmap";
}) {
  const [complaints, setComplaints] = useState<IComplaint[]>(initialComplaints);
  const [viewMode, setViewMode] = useState<"markers" | "heatmap">(initialMode);

  useEffect(() => {
    setComplaints(initialComplaints);
  }, [initialComplaints]);

  useEffect(() => {
    const socket = getSocket();

    socket.on("complaint:new", (complaint: IComplaint) => {
      setComplaints((prev) => {
        if (prev.find((c) => c._id === complaint._id)) return prev;
        return [complaint, ...prev];
      });
    });

    socket.on("complaint:updated", (updated: IComplaint) => {
      setComplaints((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c))
      );
    });

    return () => {
      socket.off("complaint:new");
      socket.off("complaint:updated");
    };
  }, []);

  return (
    <div
      className={`relative z-0 isolate rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`}
      style={{ height, borderColor: "#ECE7DE", isolation: "isolate" }}
    >
      {/* Top Mode Switcher Bar */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center bg-white/95 backdrop-blur shadow-md rounded-lg p-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setViewMode("markers")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            viewMode === "markers"
              ? "bg-[#D95D0F] text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          📍 Markers View
        </button>
        <button
          type="button"
          onClick={() => setViewMode("heatmap")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            viewMode === "heatmap"
              ? "bg-[#D95D0F] text-white shadow-sm"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          🔥 Civic Heatmap
        </button>
      </div>

      {/* India Territory Sovereign Tag */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur px-3 py-1 rounded-md text-[11px] font-semibold text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-sm">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#EA580C]"></span>
        <span>National Civic Watch · Republic of India</span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={4}
        maxZoom={18}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        scrollWheelZoom
      >
        <InvalidateOnMount />

        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
          tileSize={256}
          subdomains="abcd"
        />

        {/* Official India Boundary Outline GeoJSON Layer */}
        <GeoJSON
          data={indiaBoundaryData as any}
          style={() => ({
            color: "#D95D0F",
            weight: 2.5,
            opacity: 0.95,
            fillColor: "#EA580C",
            fillOpacity: 0.03,
            dashArray: "6, 4",
          })}
        />

        {showControls && (
          <div
            className="leaflet-top leaflet-left"
            style={{ pointerEvents: "none", marginTop: 48 }}
          >
            <div
              className="leaflet-control"
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                border: "1px solid #ECE7DE",
              }}
            >
              {viewMode === "markers" ? (
                [
                  { label: "Pending", color: STATUS_COLORS.pending },
                  { label: "In Progress", color: STATUS_COLORS.in_progress },
                  { label: "Awaiting Verification", color: STATUS_COLORS.awaiting_citizen_verification },
                  { label: "Resolved", color: STATUS_COLORS.resolved },
                ].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="20" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z"
                        fill={color}
                        stroke="white"
                        strokeWidth="3"
                      />
                      <circle cx="15" cy="15" r="6" fill="white" />
                    </svg>
                    <span style={{ color: "#111827", fontWeight: 500 }}>{label}</span>
                  </div>
                ))
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontWeight: 700, color: "#111827" }}>Density Intensity</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#DC2626" }} />
                    <span>High Severity</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#F59E0B" }} />
                    <span>Medium Density</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10B981" }} />
                    <span>Low / Isolated</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Mode 1: Individual Markers ── */}
        {viewMode === "markers" &&
          complaints.map((complaint) => {
            const coordinates = complaint.location?.coordinates;
            if (!coordinates || coordinates.length < 2) return null;
            const [lng, lat] = coordinates;
            if (typeof lat !== "number" || typeof lng !== "number") return null;

            const color = STATUS_COLORS[complaint.status] ?? "#6B7280";
            const size = complaint.priority === "critical" ? "large" : "normal";

            return (
              <Marker
                key={complaint._id}
                position={[lat, lng]}
                icon={makeIcon(color, size)}
                eventHandlers={onMarkerClick ? { click: () => onMarkerClick(complaint) } : {}}
              >
                <Popup>
                  <div style={{ minWidth: 180, fontFamily: "Arial, sans-serif" }}>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 4px", color: "#0f172a" }}>
                      {complaint.title}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px" }}>
                      {getCategoryLabel(complaint.category)} • {timeAgo(complaint.createdAt)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "white",
                          background: color,
                          textTransform: "capitalize",
                        }}
                      >
                        {complaint.status.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        👍 {complaint.upvoteCount}
                      </span>
                    </div>
                    {onMarkerClick && (
                      <button
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#D95D0F",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                        }}
                        type="button"
                        onClick={() => onMarkerClick(complaint)}
                      >
                        View Details →
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* ── Mode 2: Real-time Civic Heatmap Density Layer ── */}
        {viewMode === "heatmap" &&
          complaints.map((complaint) => {
            const coordinates = complaint.location?.coordinates;
            if (!coordinates || coordinates.length < 2) return null;
            const [lng, lat] = coordinates;
            if (typeof lat !== "number" || typeof lng !== "number") return null;

            const weight = Math.min(
              10,
              Math.max(
                1,
                (complaint.priority === "critical"
                  ? 9
                  : complaint.priority === "high"
                  ? 7
                  : complaint.priority === "medium"
                  ? 4
                  : 2) + Math.min(3, complaint.upvoteCount || 0)
              )
            );

            const heatColor = getHeatColor(weight);
            const radius = 16 + weight * 3.5;

            return (
              <CircleMarker
                key={`heat-${complaint._id}`}
                center={[lat, lng]}
                radius={radius}
                pathOptions={{
                  color: heatColor,
                  fillColor: heatColor,
                  fillOpacity: 0.35,
                  weight: 1.5,
                }}
                eventHandlers={onMarkerClick ? { click: () => onMarkerClick(complaint) } : {}}
              >
                <Popup>
                  <div style={{ minWidth: 170, fontFamily: "Arial, sans-serif" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        color: "white",
                        background: heatColor,
                        marginBottom: 4,
                      }}
                    >
                      Heat Intensity: {weight} / 10
                    </span>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: "2px 0 4px", color: "#0f172a" }}>
                      {complaint.title}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 4px" }}>
                      {getCategoryLabel(complaint.category)} • {complaint.location.address}
                    </p>
                    {onMarkerClick && (
                      <button
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#D95D0F",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          textDecoration: "underline",
                        }}
                        type="button"
                        onClick={() => onMarkerClick(complaint)}
                      >
                        Inspect Issue →
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
