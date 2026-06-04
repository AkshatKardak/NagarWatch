"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import type { ISLA } from "@/types/complaint";
import { cn, formatDateTime, getSLATimeLeft } from "@/lib/utils";

export function SLATimer({ sla, category }: { sla: ISLA; category: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getSLATimeLeft(sla.deadline));

  useEffect(() => {
    const interval = window.setInterval(() => setTimeLeft(getSLATimeLeft(sla.deadline)), 60000);
    return () => window.clearInterval(interval);
  }, [sla.deadline]);

  if (sla.breached) {
    return (
      <div className="border border-red-200 bg-red-50 p-4 text-red-800">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4" />
          SLA Breached - Escalated to Level {sla.escalationLevel}
        </div>
        <p className="mt-1 text-sm">Category: {category}</p>
      </div>
    );
  }

  const barColor =
    timeLeft.percentage > 80 ? "bg-red-600" : timeLeft.percentage >= 60 ? "bg-yellow-500" : "bg-green-600";

  return (
    <div className="border bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Clock className="size-4" />
          SLA Timer
        </p>
        <span className="text-sm text-muted-foreground">{category}</span>
      </div>
      <div className="h-2 bg-muted">
        <div className={cn("h-full", barColor)} style={{ width: `${timeLeft.percentage}%` }} />
      </div>
      <p className="mt-2 text-sm font-medium">
        {timeLeft.isOverdue
          ? `Overdue by ${timeLeft.hours}h ${timeLeft.minutes}m`
          : `${timeLeft.hours}h ${timeLeft.minutes}m remaining`}
      </p>
      <p className="text-xs text-muted-foreground">SLA Deadline: {formatDateTime(sla.deadline)}</p>
    </div>
  );
}
