import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString))
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const day = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
  return `${day} at ${time}`
}

export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? "" : "s"} ago`
}

export function getSLATimeLeft(deadline: string): {
  hours: number
  minutes: number
  isOverdue: boolean
  percentage: number
} {
  const deadlineTime = new Date(deadline).getTime()
  const now = Date.now()
  const diffMs = deadlineTime - now
  const absMs = Math.abs(diffMs)
  const hours = Math.floor(absMs / 3600000)
  const minutes = Math.floor((absMs % 3600000) / 60000)
  const totalWindow = 72 * 3600000
  const used = totalWindow - Math.max(diffMs, 0)
  const percentage = Math.min(100, Math.max(0, Math.round((used / totalWindow) * 100)))
  return { hours, minutes, isOverdue: diffMs < 0, percentage }
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    pothole: "Pothole",
    garbage: "Garbage Dump",
    water: "Water Issue",
    streetlight: "Streetlight",
    road: "Road Damage",
    drainage: "Drainage",
    other: "Other",
  }
  return labels[category] || "Other"
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    critical: "text-red-600",
  }
  return colors[priority] || "text-muted-foreground"
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-red-100 text-red-700",
    in_progress: "bg-orange-100 text-orange-700",
    resolved: "bg-green-100 text-green-700",
  }
  return colors[status] || "bg-muted text-muted-foreground"
}

export function getMarkerColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "#ef4444",
    in_progress: "#f97316",
    resolved: "#22c55e",
  }
  return colors[status] || "#64748b"
}
