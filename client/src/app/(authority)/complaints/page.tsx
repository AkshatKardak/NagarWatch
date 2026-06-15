"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Download, Loader2, AlertTriangle, Eye } from "lucide-react"

import { useComplaintStore } from "@/store/complaintStore"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { getSLATimeLeft, getCategoryLabel, getPriorityColor, getStatusColor } from "@/lib/utils"
import type { ComplaintCategory, ComplaintStatus, ComplaintPriority, IComplaint } from "@/types/complaint"

const categories = ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"]

export default function AuthorityComplaintQueue() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const { complaints, total, totalPages, loading, error, fetchComplaints } = useComplaintStore()

  // Local filter states
  const [statusFilter, setStatusFilter] = useState<"all" | Co