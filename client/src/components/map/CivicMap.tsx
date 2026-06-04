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

export default function CivicMap({
  complaints,
  height = "500px",
  center = [18.5204, 73.8567],
  zoom = 13,
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
    <div className="relative">
      {showControls ? (
        <div className="absolute left-3 top-3 z-[500] flex gap-2 bg-white/90 p-2 shadow">
          {["pending", "in_progress", "resolved"].map((status) => (
            <span key={status} className="border px-2 py-1 text-xs capitalize">
              {status.replace("_", " ")}
            </span>
          ))}
        </div>
      ) : null}
      <MapContainer center={center} zoom={zoom} style={{ height }} className="z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        {complaints.map((complaint) => {
          const [lng, lat] = complaint.location.coordinates;
          return (
            <Marker key={complaint._id} position={[lat, lng]} icon={markerIcon(complaint)}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <strong>{complaint.title}</strong>
                  <p>
                    {getCategoryLabel(complaint.category)} - {complaint.status.replace("_", " ")}
                  </p>
                  <p>{complaint.upvoteCount} upvotes</p>
                  <p>{timeAgo(complaint.createdAt)}</p>
                  {onMarkerClick ? (
                    <button className="text-primary underline" type="button" onClick={() => onMarkerClick(complaint)}>
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
