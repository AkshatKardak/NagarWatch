"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { Complaint } from "@/lib/types";

const CivicMap = dynamic(() => import("./CivicMap"), { ssr: false });

interface ComplaintMapProps {
  complaints: Complaint[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (complaint: Complaint) => void;
  showControls?: boolean;
  className?: string;
}

export function ComplaintMap(props: ComplaintMapProps) {
  return <CivicMap {...(props as any)} />;
}

export default ComplaintMap;
