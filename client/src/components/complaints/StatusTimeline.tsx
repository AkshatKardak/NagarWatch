"use client";

import { CheckCircle, Circle, Clock } from "lucide-react";
import type { ComplaintStatus, IStatusHistory } from "@/types/complaint";
import { cn, formatDateTime } from "@/lib/utils";

export function StatusTimeline({
  statusHistory,
  currentStatus,
}: {
  statusHistory: IStatusHistory[];
  currentStatus: ComplaintStatus;
}) {
  const sorted = [...statusHistory].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-4">
      {sorted.length ? (
        sorted.map((entry, index) => {
          const isResolved = entry.status === "resolved";
          const color =
            entry.status === "resolved"
              ? "text-green-600"
              : entry.status === "in_progress"
                ? "text-orange-600"
                : "text-red-600";
          const Icon = isResolved ? CheckCircle : entry.status === currentStatus ? Clock : Circle;
          return (
            <div key={`${entry.status}-${entry.updatedAt}`} className="relative flex gap-3">
              {index < sorted.length - 1 ? <span className="absolute left-2 top-5 h-full border-l" /> : null}
              <Icon className={cn("relative z-10 mt-1 size-4 bg-white", color)} />
              <div>
                <p className="text-sm font-semibold capitalize">{entry.status.replace("_", " ")}</p>
                <p className="text-xs text-muted-foreground">
                  Updated by {entry.updatedBy?.name || "NagarWatch"} - {formatDateTime(entry.updatedAt)}
                </p>
                {entry.note ? <p className="mt-1 text-sm italic text-muted-foreground">{entry.note}</p> : null}
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground">No status history yet.</p>
      )}
    </div>
  );
}
