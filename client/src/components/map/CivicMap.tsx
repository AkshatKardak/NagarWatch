"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import type { IComplaint } from "@/types/complaint";
import { getCategoryLabel, timeAgo } from "@/lib/utils";
import { getSocket } from "@/lib/socket";

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// CartoDB Dark Matter — black background, white uniform labels, no API key needed
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

const STATUS_COLORS: Record<string, string> = {
  pending: "#EF4444",
  in_progress: "#F59E0B",
  resolved: "#10B981",
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

export default function CivicMap({
  complaints: initialComplaints,
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
  const [complaints, setComplaints] = useState<IComplaint[]>(initialComplaints);

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
      className={`rounded-xl overflow-hidden border shadow-sm ${className}`}
      style={{ height, borderColor: "#1a1a2e" }}
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
          subdomains={["a", "b", "c", "d"]}
          maxZoom={19}
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
                background: "rgba(15,15,25,0.92)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                border: "1px solid #333",
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
                      fill={color} stroke="white" strokeWidth="3"
                    />
                    <circle cx="15" cy="15" r="6" fill="white" />
                  </svg>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{label}</span>
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
              icon={makeIcon(color, size)}
              eventHandlers={onMarkerClick ? { click: () => onMarkerClick(complaint) } : {}}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: "Arial, sans-serif", background: "#1e1e2e", borderRadius: 8, padding: 4 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 4px", color: "#f1f5f9" }}>
                    {complaint.title}
                  </p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 6px" }}>
                    {getCategoryLabel(complaint.category)} • {timeAgo(complaint.createdAt)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 99,
                      fontSize: 10, fontWeight: 700, color: "white", background: color,
                      textTransform: "capitalize",
                    }}>
                      {complaint.status.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      👍 {complaint.upvoteCount}
                    </span>
                  </div>
                  {onMarkerClick && (
                    <button
                      style={{
                        fontSize: 11, fontWeight: 700, color: "#fb923c",
                        background: "none", border: "none", cursor: "pointer",
                        padding: 0, textDecoration: "underline",
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
