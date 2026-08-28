"use client"

import { useEffect, useState, use, useMemo } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  MapPin,
  ThumbsUp,
  AlertTriangle,
  Calendar,
  User,
  PersonStanding,
  BarChart2,
  CheckCircle,
  ArrowLeft,
  ImageOff,
  AlertCircle,
  Loader2,
  Star,
  HardHat,
  Shield,
  CheckCircle2,
} from "lucide-react"
import toast from "react-hot-toast"
import { CitizenFeedbackModal } from "@/components/complaints/CitizenFeedbackModal"
import { CitizenVerificationCard } from "@/components/complaints/CitizenVerificationCard"
import { useAuth } from "@/hooks/useAuth"

import { useComplaintStore } from "@/store/complaintStore"
import { complaintsAPI } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

export default function PublicComplaintDetail({ params }: PageProps) {
  const router = useRouter()
  // Support both NextJS 14 sync params and NextJS 15/16 async params
  const unwrappedParams = (typeof (params as any)?.then === "function"
    ? use(params as Promise<{ id: string }>)
    : params) as { id: string }
  const id = unwrappedParams.id

  const {
    selectedComplaint: complaint,
    loading,
    error,
    fetchComplaintById,
    upvoteComplaint,
  } = useComplaintStore()

  const [isUpvoting, setIsUpvoting] = useState(false)
  const [upvoteError, setUpvoteError] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLocalError(null)
      try {
        await fetchComplaintById(id)
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to load complaint")
      }
    }
    void load()
  }, [id, fetchComplaintById])

  // SEO titles and tags
  useEffect(() => {
    if (complaint?.title) {
      document.title = `NagarWatch - ${complaint.title}`
    }
  }, [complaint])

  const { role: userRole } = useAuth()
  const isAuthorityOrAdmin = userRole === "authority" || userRole === "admin" || userRole === "contractor"
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [resolveNote, setResolveNote] = useState("")
  const [resolveImage, setResolveImage] = useState<File | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      await complaintsAPI.updateStatus(id, newStatus, `Status updated by ${userRole} to ${newStatus}`)
      toast.success(`Status updated to ${newStatus.toUpperCase()}`)
      await fetchComplaintById(id)
    } catch {
      toast.error("Failed to update status")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleContractorAssign = async (contractorId: string) => {
    if (!contractorId) return
    try {
      await complaintsAPI.assignContractor(id, contractorId)
      toast.success("Contractor assigned successfully")
      await fetchComplaintById(id)
    } catch {
      toast.error("Failed to assign contractor")
    }
  }

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResolving(true)
    try {
      const formData = new FormData()
      formData.append("resolutionNote", resolveNote || "Resolved on site")
      if (resolveImage) {
        formData.append("image", resolveImage)
      }
      await complaintsAPI.resolve(id, formData)
      toast.success("Complaint marked as resolved!")
      await fetchComplaintById(id)
    } catch {
      try {
        await complaintsAPI.updateStatus(id, "resolved", resolveNote || "Resolved")
        toast.success("Complaint marked as resolved!")
        await fetchComplaintById(id)
      } catch {
        toast.error("Failed to resolve complaint")
      }
    } finally {
      setIsResolving(false)
    }
  }

  const handleUpvote = async () => {
    if (isUpvoting) return
    setIsUpvoting(true)
    setUpvoteError(null)
    try {
      await upvoteComplaint(id)
    } catch (err) {
      setUpvoteError("Failed to register upvote. Try again.")
    } finally {
      setIsUpvoting(false)
    }
  }

  // Parse coords safely
  const mapCenter = useMemo<[number, number]>(() => {
    if (complaint?.location?.coordinates) {
      const [lng, lat] = complaint.location.coordinates
      return [lat, lng]
    }
    return [18.5204, 73.8567]
  }, [complaint])

  const complaintsList = useMemo(() => {
    return complaint ? [complaint] : []
  }, [complaint])

  // Loading skeleton state
  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 mt-16 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (error || localError) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 mt-20 flex justify-center">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="size-12 text-red-500 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-red-800">Error Loading Issue</h3>
              <p className="text-sm text-red-600 mt-1">{localError || error}</p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
              <Button onClick={() => fetchComplaintById(id)}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!complaint) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 mt-20 flex justify-center">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <ImageOff className="size-12 text-gray-300 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Issue Not Found</h2>
          <p className="text-sm text-gray-500">The requested civic issue could not be found.</p>
          <Button onClick={() => router.push("/complaints")}>Back to Feed</Button>
        </Card>
      </main>
    )
  }

  const upvoteProgressValue = Math.min(100, (complaint.upvoteCount / 100) * 100)

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pt-24 space-y-6">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-gray-500 hover:text-gray-900 px-0"
      >
        <ArrowLeft className="size-4" />
        Back to Complaints
      </Button>

      {/* Main Headers */}
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
          {complaint.title}
        </h1>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="border-gray-300 text-gray-700 font-semibold px-2.5 py-0.5">
            {getCategoryLabel(complaint.category)}
          </Badge>
          <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getStatusColor(complaint.status)}`}>
            {complaint.status.replace("_", " ")}
          </span>
          <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider border bg-white ${getPriorityColor(complaint.priority)}`}>
            {complaint.priority} priority
          </span>
        </div>
        <p className="text-xs text-gray-400 font-medium">
          Submitted {timeAgo(complaint.createdAt)} &middot; {complaint.location.address}
        </p>
      </header>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feature 3: Citizen Resolution Verification Action Card */}
          {(complaint.status === "awaiting_citizen_verification" ||
            complaint.status === "resolution_submitted") && (
            <CitizenVerificationCard
              complaintId={complaint._id}
              beforeImage={complaint.images?.before}
              afterImage={complaint.images?.after || (complaint as any).resolutionProof?.afterImage}
              resolutionNote={complaint.resolutionNote}
              onVerified={async () => {
                toast.success("Resolution verified successfully!");
                await fetchComplaintById(id);
              }}
              onReopened={async () => {
                toast.error("Issue reopened and reassigned for remediation.");
                await fetchComplaintById(id);
              }}
            />
          )}

          {/* Images Card */}
          <Card className="overflow-hidden border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-4 space-y-4">
              {complaint.status === "resolved" && complaint.images.after ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                        Before (Issue Reported)
                      </span>
                      <img
                        src={complaint.images.before}
                        alt="Before Resolution"
                        className="w-full h-64 object-cover rounded-lg border border-gray-100"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest block mb-1">
                        After (Resolved proof)
                      </span>
                      <img
                        src={complaint.images.after}
                        alt="After Resolution"
                        className="w-full h-64 object-cover rounded-lg border-2 border-green-500"
                      />
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-lg py-2.5 px-4 flex items-center gap-2">
                    <CheckCircle className="size-4 text-green-600 shrink-0" />
                    <span>Resolved on {formatDateTime(complaint.resolvedAt!)}</span>
                  </div>
                </div>
              ) : complaint.images.before ? (
                <img
                  src={complaint.images.before}
                  alt="Reported Issue Proof"
                  className="w-full h-72 object-cover rounded-lg border border-gray-100"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-gray-50 border border-dashed rounded-lg text-gray-400 gap-2">
                  <ImageOff className="size-10 text-gray-300" />
                  <span className="text-sm font-medium">No Image Uploaded</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {complaint.description}
              </p>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <MapPin className="size-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <p className="text-sm text-gray-700 font-medium">
                  {complaint.location.address}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {complaint.location.what3words && (
                    <Badge variant="outline" className="font-mono text-xs border-orange-300 bg-orange-50 text-[#D95D0F]">
                      3-Word Pin: {complaint.location.what3words}
                    </Badge>
                  )}
                  {complaint.location.landmark && (
                    <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                      Landmark: {complaint.location.landmark}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="h-[200px] w-full rounded-lg overflow-hidden border border-gray-200">
                <DynamicMap
                  complaints={complaintsList}
                  height="100%"
                  zoom={15}
                  center={mapCenter}
                  showControls={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status History Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 py-4 px-6">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <StatusTimeline
                statusHistory={complaint.statusHistory}
                currentStatus={complaint.status}
              />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Upvote Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-50 text-primary flex items-center justify-center rounded-full mb-3">
                  <ThumbsUp className="size-7" />
                </div>
                <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
                  {complaint.upvoteCount}
                </span>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">
                  people reported this issue
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-400">
                  <span>Upvote Goal Progress</span>
                  <span>{complaint.upvoteCount}/100</span>
                </div>
                <Progress value={upvoteProgressValue} className="h-2 rounded-full" />
              </div>

              {complaint.status !== "resolved" && (
                <div className="space-y-2">
                  <Button
                    onClick={handleUpvote}
                    disabled={isUpvoting}
                    className="w-full bg-primary hover:bg-primary/95 text-white py-3 font-bold"
                  >
                    {isUpvoting ? (
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                    ) : (
                      <ThumbsUp className="size-4 mr-1.5" />
                    )}
                    Upvote This Issue
                  </Button>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide">
                    Upvoting helps prioritize this issue
                  </p>
                  {upvoteError && (
                    <p className="text-xs text-red-600 font-medium bg-red-50 py-1.5 px-3 border border-red-100 rounded-md">
                      {upvoteError}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Authority / Admin Management Panel */}
          {isAuthorityOrAdmin && (
            <Card className="border-2 border-orange-200 bg-orange-50/40 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="py-3 px-5 border-b border-orange-200/80 bg-orange-100/50">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-[#D95D0F] flex items-center gap-1.5">
                  <Shield className="size-4 text-[#D95D0F]" />
                  Authority Action Control
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {/* Status selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    Change Status
                  </label>
                  <select
                    value={complaint.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-slate-900 focus:border-[#D95D0F] focus:outline-none shadow-xs"
                  >
                    <option value="pending">Pending Triage</option>
                    <option value="in_progress">In Progress (Work Assigned)</option>
                    <option value="resolved">Resolved (Completed)</option>
                  </select>
                </div>

                {/* Assign Contractor */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    Assign Contractor
                  </label>
                  <select
                    defaultValue={
                      typeof complaint.assignedContractor === "object"
                        ? complaint.assignedContractor?._id
                        : complaint.assignedContractor || ""
                    }
                    onChange={(e) => handleContractorAssign(e.target.value)}
                    className="w-full text-xs font-medium rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-slate-900 focus:border-[#D95D0F] focus:outline-none shadow-xs"
                  >
                    <option value="">Select Contractor</option>
                    <option value="65e2b0000000000000000001">Apex Infrastructure Ltd.</option>
                    <option value="65e2b0000000000000000002">CleanCity Waste Management</option>
                    <option value="65e2b0000000000000000003">Urja Power &amp; Lighting Solutions</option>
                    <option value="65e2b0000000000000000004">JalDhara Water Supply Works</option>
                    <option value="65e2b0000000000000000005">Varun Water Pipelines</option>
                  </select>
                </div>

                {/* Resolve Form */}
                {complaint.status !== "resolved" && (
                  <form onSubmit={handleResolveSubmit} className="space-y-3 pt-2 border-t border-orange-200/60">
                    <input
                      type="text"
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      placeholder="Resolution notes (e.g. Repair finished)"
                      className="w-full text-xs rounded-xl border border-stone-300 bg-white p-2.5 focus:border-emerald-600 focus:outline-none"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setResolveImage(e.target.files?.[0] || null)}
                      className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-600 file:text-white"
                    />
                    <Button
                      type="submit"
                      disabled={isResolving}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-xs"
                    >
                      {isResolving ? (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      ) : (
                        <CheckCircle2 className="size-3.5 mr-1.5" />
                      )}
                      Mark Resolved &amp; Upload Proof
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* SLA Card */}
          {complaint.status !== "resolved" && (
            <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <SLATimer sla={complaint.sla} category={getCategoryLabel(complaint.category)} />
            </div>
          )}

          {/* Details Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 py-3 px-6 bg-gray-50/50">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <PersonStanding className="size-4 text-gray-400 shrink-0" />
                  <span className="truncate">
                    Submitted by: <strong className="font-semibold">{complaint.submittedBy?.name || "Anonymous"}</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <MapPin className="size-4 text-gray-400 shrink-0" />
                  <span>
                    Ward: <strong className="font-semibold">{complaint.ward?.name || "Unassigned"}</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <User className="size-4 text-gray-400 shrink-0" />
                  <span className="truncate">
                    Assigned to: <strong className="font-semibold">{complaint.assignedTo?.name || "Not yet assigned"}</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <Calendar className="size-4 text-gray-400 shrink-0" />
                  <span>
                    Submitted: <strong className="font-semibold">{formatDate(complaint.createdAt)}</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <BarChart2 className="size-4 text-gray-400 shrink-0" />
                  <span>
                    Priority Score: <strong className="font-semibold text-primary">{complaint.priorityScore}</strong>
                  </span>
                </li>

                {complaint.status === "resolved" && (
                  <li className="flex items-center gap-3 text-sm text-green-700 font-medium">
                    <CheckCircle className="size-4 text-green-600 shrink-0" />
                    <span>
                      Resolved: {formatDateTime(complaint.resolvedAt!)}
                    </span>
                  </li>
                )}

                {complaint.sla?.escalationLevel > 0 && (
                  <li className="flex items-start gap-3 text-sm text-red-600 bg-red-50 p-3 border border-red-100 rounded-lg">
                    <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-bold">SLA Escalation Level {complaint.sla.escalationLevel}</p>
                      <p className="text-xs text-red-500/80 mt-0.5">
                        Escalated to higher authorities due to inactivity.
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Resolution Note Card */}
          {complaint.resolutionNote && (
            <Card className="border-2 border-green-200 bg-green-50/20 shadow-sm">
              <CardHeader className="border-b border-green-100 py-3 px-6 bg-green-50/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-700 flex items-center gap-1.5">
                  <CheckCircle className="size-4" />
                  Resolution Note
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-700 italic leading-relaxed whitespace-pre-line">
                  &ldquo;{complaint.resolutionNote}&rdquo;
                </p>
              </CardContent>
            </Card>
          )}

          {/* Citizen Feedback Card */}
          {complaint.status === "resolved" && (
            <Card className="border border-stone-200 bg-white shadow-sm">
              <CardHeader className="border-b border-stone-100 py-3 px-6 bg-stone-50/50">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Star className="size-4 text-amber-500 fill-amber-500" />
                  Citizen Service Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {complaint.citizenFeedback ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`size-4 ${
                            s <= complaint.citizenFeedback!.rating
                              ? "text-amber-500 fill-amber-500"
                              : "text-stone-200"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs font-bold text-slate-800">
                        {complaint.citizenFeedback.rating} / 5 Stars
                      </span>
                    </div>
                    {complaint.citizenFeedback.comment && (
                      <p className="text-xs text-slate-600 italic bg-stone-50 p-3 rounded-lg border border-stone-100">
                        "{complaint.citizenFeedback.comment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <p className="text-xs text-slate-500">
                      Was this civic issue resolved to your satisfaction?
                    </p>
                    <Button
                      onClick={() => setFeedbackOpen(true)}
                      className="w-full bg-[#D95D0F] hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider py-2"
                    >
                      <Star className="size-3.5 mr-1.5 fill-white" />
                      Rate Contractor Work
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <CitizenFeedbackModal
        complaintId={complaint._id}
        complaintTitle={complaint.title}
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        onSuccess={() => fetchComplaintById(id)}
      />
    </main>
  )
}
