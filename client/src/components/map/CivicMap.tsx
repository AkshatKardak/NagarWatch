"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { IComplaint } from "@/types/complaint";
import { getCategoryLabel, getMarkerColor, timeAgo } from "@/lib/utils";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function markerIcon(complaint: IComplaint): L.DivIcon {
  const size = complaint.priority === "critical" ? 28 : 20;
  const color = getMarkerColor(complaint.status);
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,.25)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Tile layer: OpenStreetMap Humanitarian (HOT)
 *
 * Why HOT tiles instead of standard OSM?
 * - Fully compliant with India's official border depiction
 *   (Jammu & Kashmir, Ladakh, Aksai Chin, PoK shown correctly)
 * - Regularly updated — reflects Survey of India conventions
 * - Free, no API key required
 * - Optimised for civic/humanitarian use cases
 */
const INDIA_TILE_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const INDIA_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.hotosm.org">HOT</a>';

export default function CivicMap({
  complaints,
  height = "500px",
  center = [20.5937, 78.9629], // Geographic centre of India
  zoom = 5,
  onMarkerClick,
  showControls,
}: {
  complaints: IComplaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: IComplaint) => void;
  showControls?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      {showControls ? (
        <div
          className="absolute left-3 top-3 z-[500] flex gap-2 rounded-lg bg-white/95 px-3 py-2 shadow-md text-xs"
        >
          {[
            { status: "pending", color: "#EF4444", label: "Pending" },
            { status: "in_progress", color: "#F59E0B", label: "In Progress" },
            { status: "resolved", color: "#10B981", label: "Resolved" },
          ].map(({ status, color, label }) => (
            <span key={status} className="flex items-center gap-1.5 font-medium" style={{ color: "#374151" }}>
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
        </div>
      ) : null}
      <MapContainer center={center} zoom={zoom} style={{ height }} className="z-0">
        <TileLayer url={INDIA_TILE_URL} attribution={INDIA_TILE_ATTRIBUTION} />
        {complaints.map((complaint) => {
          const [lng, lat] = complaint.location.coordinates;
          return (
            <Marker key={complaint._id} position={[lat, lng]} icon={markerIcon(complaint)}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <strong>{complaint.title}</strong>
                  <p>
                    {getCategoryLabel(complaint.category)} — {complaint.status.replace("_", " ")}
                  </p>
                  <p>{complaint.upvoteCount} upvotes</p>
                  <p className="text-gray-400 text-xs">{timeAgo(complaint.createdAt)}</p>
                  {onMarkerClick ? (
                    <button
                      className="text-orange-600 underline font-medium"
                      type="button"
                      onClick={() => onMarkerClick(complaint)}
                    >
                      View Details
                    </button>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
