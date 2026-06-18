"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import type { IComplaint } from "@/types/complaint";
import { getCategoryLabel, getMarkerColor, timeAgo } from "@/lib/utils";

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MAPPLS_KEY = process.env.NEXT_PUBLIC_MAPPLS_KEY;

// Correct Mappls tile URL uses {s}.mapmyindia.com with subdomains a/b/c
const TILE_URL = MAPPLS_KEY
  ? `https://{s}.mapmyindia.com/advancedmaps/v1/${MAPPLS_KEY}/still_map/{z}/{x}/{y}.png`
  : "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";

const TILE_SUBDOMAINS = MAPPLS_KEY ? ["a", "b", "c"] : ["a", "b", "c"];

const TILE_ATTRIBUTION = MAPPLS_KEY
  ? '&copy; <a href="https://mappls.com">Mappls</a> | MapmyIndia'
  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Humanitarian OSM Team';

/** SVG teardrop pin */
function makePinIcon(color: string, size: "normal" | "large" = "normal"): L.DivIcon {
  const w = size === "large" ? 36 : 28;
  const h = size === "large" ? 50 : 40;
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

const STATUS_COLORS: Record<string, string> = {
  pending: "#EF4444",
  in_progress: "#F59E0B",
  resolved: "#10B981",
};

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function CivicMap({
  complaints,
  height = "500px",
  center = [20.5937, 78.9629],
  zoom = 5,
  onMarkerClick,
  showControls,
  className = "",
}: {
  complaints: IComplaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: IComplaint) => void;
  showControls?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border shadow-sm ${className}`}
      style={{ height, borderColor: "#ECE7DE" }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={4}
        maxZoom={18}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <InvalidateOnMount />

        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          subdomains={TILE_SUBDOMAINS}
          maxZoom={18}
          tileSize={256}
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
              {[
                { label: "Pending", color: STATUS_COLORS.pending },
                { label: "In Progress", color: STATUS_COLORS.in_progress },
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
                  <span style={{ color: "#374151", fontWeight: 500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {complaints.map((complaint) => {
          const [lng, lat] = complaint.location.coordinates;
          const color = STATUS_COLORS[complaint.status] ?? "#6B7280";
          const size = complaint.priority === "critical" ? "large" : "normal";
          return (
            <Marker
              key={complaint._id}
              position={[lat, lng]}
              icon={makePinIcon(color, size)}
              eventHandlers={onMarkerClick ? { click: () => onMarkerClick(complaint) } : {}}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: "Arial, sans-serif" }}>
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
                      {complaint.status.replace("_", " ")}
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
      </MapContainer>
    </div>
  );
}
