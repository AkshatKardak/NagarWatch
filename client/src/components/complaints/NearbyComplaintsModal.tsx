"use client";

import { MapPin, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IComplaint } from "@/types/complaint";
import { getCategoryLabel, getStatusColor } from "@/lib/utils";

export function NearbyComplaintsModal({
  complaints,
  onJoin,
  onCreate,
  onClose,
}: {
  complaints: IComplaint[];
  onJoin: (id: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Similar Issues Already Reported</h2>
            <p className="text-sm text-muted-foreground">
              {complaints.length} complaint(s) found within 50 metres of your location
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="mr-auto font-semibold">{complaint.title}</h3>
                <span className="border px-2 py-1 text-xs">{getCategoryLabel(complaint.category)}</span>
                <span className={`px-2 py-1 text-xs ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <ThumbsUp className="size-3" />
                {complaint.upvoteCount} people reported this
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3" />
                {complaint.location.address}
              </p>
              <Button type="button" className="mt-3" onClick={() => onJoin(complaint._id)}>
                Join & Upvote
              </Button>
            </div>
          ))}
        </div>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={onCreate}>
            Report as New Issue
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
