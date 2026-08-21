"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { Ward } from "@/lib/types";

const CivicMap = dynamic(() => import("./CivicMap"), { ssr: false });

interface WardMapProps {
  wards?: Ward[];
  height?: string;
  className?: string;
}

export function WardMap({ wards = [], height = "450px", className = "" }: WardMapProps) {
  // Convert wards to map center / points
  return (
    <div className={`rounded-2xl overflow-hidden border border-stone-200 ${className}`} style={{ height }}>
      <CivicMap
        complaints={[]}
        height={height}
        center={[18.5204, 73.8567]}
        zoom={12}
        showControls
      />
    </div>
  );
}

export default WardMap;
