"use client"

import { useEffect, useState, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import dynamic from "next/dynamic"
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  Loader2,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react"

import { useComplaintStore } from "@/store/complaintStore"
import { complaintsAPI } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusTimeline } from "@/components/complaints/StatusTimeline"
import { SLATimer } from "@/components/complaints/SLATimer"
import {
  formatDate,
  formatDateTime,
  timeAgo,
  getCategoryLabel,
  getPriorityColor,
  getStatusColor,
} from "@/lib/utils"

const DynamicMap = dynamic(() => import("@/components/map/CivicMap"), { ssr: false })

interface PageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default function AuthorityComplaintAction({ params }: PageProps) {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const unwrappedParams = typeof (params as any).then === "function" ? use(params as any) : params as { id: string }
  const id = unwrappedParams.id

  const { selectedComplaint: complaint, loading, error, fetchComplaintById } = useComplaintStore()

  const [updating, setUpdating] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [statusNote, setStatusNote] = useState("")
  const [resolutionNote, setResolutionNote] = useState("")
  const [afterImage, setAfterImage] = useState<File | null>(null)
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (complaint?.title) document.title = `NagarWatch Authority - ${complaint.title}`
  }, [complaint])

  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) { router.push("/sign-in"); return }
      const role = clerkUser.publicMetadata?.role as string
      if (role !== "authority") router.push("/unauthorized")
    }
  }, [clerkUser, clerkLoaded, router])

  useEffect(() => {
    if (clerkUser) {
      fetchComplaintById(id).catch(() => setErrorMessage("Failed to load complaint details."))
    }
  }, [id, clerkUser, fetchComplaintById])

  const mapCenter = useMemo<[number, number]>(() => {
    if (complaint?.location?.coordinates) {
      const [lng, lat] = complaint.location.coordinates
      return [lat, lng]
    }
    return [18.5204, 73.8567]
  }, [complaint])

  const complaintsList = useMemo(() => complaint ? [complaint] : [], [complaint])

  const handleMarkInProgress = async () => {
    if (updating) return
    setUpdating(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const response = await complaintsAPI.updateStatus(id, {
        status: "in_progress",
        note: statusNote || "Issue has been accepted and is currently in progress.",
      })
      if (response.data.success) {
        setSuccessMessage("Status updated to In Progress!")
        setStatusNote("")
        await fetchComplaintById(id)
      } else {
        setErrorMessage("Failed to update status.")
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to update status.")
    } finally {
      setUpdating(false)
    }
  }

  const handleImageChange = (file: File | null) => {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Only JPEG, PNG, and WebP images are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be under 5MB.")
      return
    }
    setAfterImage(file)
    setAfterImagePreview(URL.createObjectURL(file))
    setErrorMessage(null)
  }

  const handleResolve = async () => {
    if (resolving || !afterImage) {
      if (!afterImage) setErrorMessage("After image required to prove resolution.")
      return
    }
    setResolving(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const formData = new FormData()
      formData.append("image", afterImage)
      formData.append("resolutionNote", resolutionNote || "The issue has been resolved and verified with proof photo.")
      const response = await complaintsAPI.resolve(id, formData)
      if (response.data.success) {
        setSuccessMessage("Complaint resolved successfully!")
        setAfterImage(null)
        setAfterImagePreview(null)
        setResolutionNote("")
        await fetchComplaintById(id)
      } else {
        setErrorMessage("Failed to resolve complaint.")
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || "Failed to resolve complaint.")
    } finally {
      setResolving(false)
    }
  }

  if (!clerkLoaded || !clerkUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-semibold text-gray-500">Checking credentials...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 mt-16">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !complaint) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 mt-20 flex justify-center">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="size-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-bold text-red-800">Error Loading Issue</h3>
            <p className="text-sm text-red-600 mt-1">{error || "Complaint details could not be found."}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pt-24 space-y-6 min-h-screen">
      <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Button onClick={() => router.push("/authority/complaints")} variant="ghost" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 px-0 self-start">
          <ArrowLeft className="size-4" />
          Back to Complaints
        </Button>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider self-start sm:self-auto">
          Authority &rarr; Complaints &rarr; #{complaint._id.slice(-6)}
        </span>
      </nav>

      {successMessage && (
        <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 shadow border border-green-700 text-sm font-medium rounded-md">
          <CheckCircle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-white font-bold ml-2 text-xs uppercase">Dismiss</button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 shadow border border-red-700 text-sm font-medium rounded-md">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-white font-bold ml-2 text-xs uppercase">Dismiss</button>
        </div>
      )}

      <Card className="bg-white shadow-sm border border-gray-200/50 p-6 rounded-xl">
        <CardContent className="p-0 space-y-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{complaint.title}</h1>
            <div className="flex flex-wrap gap-2 items-center mt-3">
              <Badge variant="outline" className="border-gray-300 text-gray-700 font-semibold uppercase">{getCategoryLabel(complaint.category)}</Badge>
              <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusColor(complaint.status)}`}>{complaint.status.replace("_", " ")}</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border bg-white ${getPriorityColor(complaint.priority)}`}>{complaint.priority} Priority</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t pt-4 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div>Submitted by: <strong className="text-gray-900 font-bold">{complaint.submittedBy?.name || "Anonymous"}</strong> &middot; {timeAgo(complaint.createdAt)}{complaint.ward && (<> &middot; Ward: <strong className="text-gray-900 font-bold">{complaint.ward.name}</strong></>)}</div>
            <div>Priority Score: <strong className="text-primary font-bold">{complaint.priorityScore}</strong> &middot; Upvotes: <strong className="text-gray-900 font-bold">{complaint.upvoteCount}</strong></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 space-y-4">
          <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Before Image (Proof of Issue)</span>
              {complaint.images.before ? (
                <img src={complaint.images.before} alt="Civic Issue Proof" className="w-full h-72 object-cover rounded-lg border border-gray-100" />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-gray-50 border border-dashed rounded-lg text-gray-400">
                  <AlertCircle className="size-8" />
                  <span className="text-xs mt-1">No Image Provided</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100 py-3.5 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Description</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{complaint.description}</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100 py-3.5 px-6 flex flex-row items-center gap-2">
              <MapPin className="size-4 text-gray-400" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Location Map</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-xs font-semibold text-gray-800">{complaint.location.address}</p>
              <div className="h-[200px] w-full rounded-lg overflow-hidden border border-gray-200">
                <DynamicMap complaints={complaintsList} height="100%" zoom={15} center={mapCenter} showControls={false} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="border-b border-gray-100 py-3.5 px-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <StatusTimeline statusHistory={complaint.statusHistory} currentStatus={complaint.status} />
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-2 space-y-4">
          {complaint.status !== "resolved" && (
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <SLATimer sla={complaint.sla} category={getCategoryLabel(complaint.category)} />
              {complaint.sla.escalationLevel > 0 && (
                <div className="bg-red-50 p-4 border-t border-red-200 text-red-800 text-xs font-semibold space-y-2">
                  <div className="flex items-center gap-1.5 text-red-600">
                    <AlertTriangle className="size-4 animate-pulse" />
                    <span>Escalated to Level {complaint.sla.escalationLevel}</span>
                  </div>
                  {complaint.sla.escalationLog?.length > 0 && (
                    <p className="italic text-red-700/80 bg-red-100/50 p-2 border border-red-200/50">
                      Reason: &ldquo;{complaint.sla.escalationLog[complaint.sla.escalationLog.length - 1].reason}&rdquo;
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {complaint.status !== "resolved" && (
            <>
              {complaint.status === "pending" && (
                <Card className="border border-gray-200 bg-white shadow-sm">
                  <CardHeader className="border-b border-gray-100 py-3 px-6 bg-gray-50/50">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Mark as In Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Action Note (Optional)</span>
                      <Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Add a note about action being taken..." className="min-h-[80px]" />
                    </div>
                    <Button onClick={handleMarkInProgress} disabled={updating} className="w-full bg-primary hover:bg-primary/95 text-white font-bold">
                      {updating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Clock className="size-4 mr-1.5" />}
                      Mark In Progress
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="border-2 border-green-200 bg-white shadow-md">
                <CardHeader className="border-b border-green-100 py-3.5 px-6 bg-green-50/50">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-700 flex items-center gap-1.5">
                    <CheckCircle className="size-4" />
                    Mark as Resolved (Proof Required)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs text-gray-500">Upload an after photo proving the issue is resolved.</p>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50/50 transition relative">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" id="after-image-file" onChange={(e) => handleImageChange(e.target.files?.[0] || null)} />
                    {afterImagePreview ? (
                      <div className="space-y-3">
                        <img src={afterImagePreview} alt="After preview" className="w-full h-48 object-cover rounded-lg border-2 border-green-500" />
                        <div className="flex justify-center gap-3">
                          <label htmlFor="after-image-file" className="text-xs text-primary font-bold hover:underline cursor-pointer uppercase tracking-wider">Change Photo</label>
                          <button type="button" onClick={() => { setAfterImage(null); setAfterImagePreview(null) }} className="text-xs text-red-600 font-bold hover:underline uppercase tracking-wider">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="after-image-file" className="cursor-pointer block space-y-2">
                        <Upload className="mx-auto size-10 text-gray-400" />
                        <span className="text-xs font-bold text-gray-900 block">Click to upload after photo</span>
                        <span className="text-[10px] text-gray-400 block font-semibold">JPEG, PNG, WebP &middot; Max 5MB</span>
                      </label>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Resolution Details</span>
                    <Textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Describe what was done to fix this issue..." className="min-h-[100px]" />
                  </div>
                  <Button onClick={handleResolve} disabled={!afterImage || resolving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                    {resolving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <CheckCircle className="size-4 mr-1.5" />}
                    Upload Proof &amp; Resolve
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {complaint.status === "resolved" && (
            <Card className="border border-green-200 bg-green-50/20 shadow-sm p-6 text-center space-y-4">
              <CheckCircle className="size-12 text-green-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-green-800">Issue Resolved</h3>
                <p className="text-xs text-green-700 mt-0.5">This complaint was resolved on {formatDateTime(complaint.resolvedAt!)}</p>
              </div>
              {complaint.resolutionNote && (
                <div className="bg-white border border-green-100 p-4 rounded-lg text-left text-xs text-gray-700 italic">&ldquo;{complaint.resolutionNote}&rdquo;</div>
              )}
              {complaint.images.after && (
                <div>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest block mb-2 text-left">Resolution Proof:</span>
                  <img src={complaint.images.after} alt="Resolution Proof" className="w-full h-48 object-cover rounded-lg border-2 border-green-500" />
                </div>
              )}
            </Card>
          )}
        </section>
      </div>
    </main>
  )
}
