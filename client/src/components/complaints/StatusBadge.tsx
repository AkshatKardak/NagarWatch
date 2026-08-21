"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn, getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status ? status.toLowerCase().replace(/ /g, "_") : "pending";
  const displayLabel = status ? status.replace(/_/g, " ") : "pending";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "capitalize font-bold text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm",
        getStatusColor(normalized),
        className
      )}
    >
      {displayLabel}
    </Badge>
  );
}

export default StatusBadge;
