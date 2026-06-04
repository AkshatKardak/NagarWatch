"use client";

import { CheckCircle, Clock, MapPin, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IComplaint } from "@/types/complaint";
import { cn, getCategoryLabel, getPriorityColor, getStatusColor, timeAgo } from "@/lib/utils";

interface ComplaintCardProps {
  complaint: IComplaint;
  showUpvote?: boolean;
  onUpvote?: (id: string) => void;
  onClick?: (id: string) => void;
  compact?: boolean;
}

export function ComplaintCard({ complaint, showUpvote, onUpvote, onClick, compact }: ComplaintCardProps) {
  return (
    <article
      className={cn(
        "border bg-white p-4 shadow-sm transition hover:border-primary/40",
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => onClick?.(complaint._id)}
    >
      <div className={cn("flex gap-4", compact && "gap-3")}>
        {complaint.images.before ? (
          <img
            src={complaint.images.before}
            alt={complaint.title}
            className={cn("h-24 w-28 object-cover", compact && "h-16 w-20")}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="border px-2 py-1 text-xs">{getCategoryLabel(complaint.category)}</span>
            <span className={cn("border px-2 py-1 text-xs font-semibold", getPriorityColor(complaint.priority))}>
              {complaint.priority}
            </span>
            <span className={cn("px-2 py-1 text-xs font-medium", getStatusColor(complaint.status))}>
              {complaint.status.replace("_", " ")}
            </span>
          </div>
          <h3 className={cn("font-semibold", compact ? "line-clamp-1 text-sm" : "line-clamp-2")}>{complaint.title}</h3>
          {!compact ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{complaint.description}</p> : null}
          <p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {complaint.location.address}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="size-3" />
                {complaint.upvoteCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {timeAgo(complaint.createdAt)}
              </span>
              {complaint.status === "resolved" && complaint.images.after ? (
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="size-3" />
                  Resolved
                </span>
              ) : null}
            </div>
            {showUpvote ? (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  onUpvote?.(complaint._id);
                }}
              >
                <ThumbsUp className="size-3" />
                Upvote
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
