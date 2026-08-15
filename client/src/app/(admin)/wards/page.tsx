"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Plus, Pencil, Trash2, Shield, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react"

import { wardsAPI } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import type { IWard } from "@/types/user"

export default function AdminWardManagement() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  const [wards, setWards] = useState<IWard[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWard, setEditingWard] = useState<IWard | null>(null)
  
  const [form, setForm] = useState({
    name: "",
    city: "",
    assignedAuthorities: "",
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // SEO
  useEffect(() => {
    document.title = "NagarWatch Admin - Ward Management"
  }, [])

  // 1. Role Guard Check
  useEffect(() => {
    if (clerkLoaded) {
      if (!clerkUser) {
        router.push("/sign-in")
        return
      }
      const role = clerkUser.publicMetadata?.role as string
      if (role !== "admin") {
        router.push("/unauthorized")
      }
    }
  }, [clerkUser, clerkLoaded, router])

  const loadWards = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await wardsAPI.getAll()
      if (response.data.success) {
        setWards(response.data.wards || [])
      } else {
        setError("Failed to fetch wards.")
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load wards list.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch Wards list
  useEffect(() => {
    if (clerkUser) {
      void loadWards()
    }
  }, [clerkUser])

  // Open Dialog for Add
  const handleOpenAddDialog = () => {
    setEditingWard(null)
    setForm({ name: "", city: "", assignedAuthorities: "" })
    setError(null)
    setIsDialogOpen(true)
  }

  // Open Dialog for Edit
  const handleOpenEditDialog = (ward: IWard) => {
    setEditingWard(ward)
    setForm({
      name: ward.name,
      city: ward.city,
      assignedAuthorities: ward.assignedAuthorities.map((a) => a._id).join(", "),
    })
    setError(null)
    setIsDialogOpen(true)
  }

  // Deactivate/Delete ward
  const handleDeleteWard = async (ward: IWard) => {
    if (!window.confirm(`Deactivate ward "${ward.name}"?`)) return
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await wardsAPI.delete(ward._id)
      if (response.data.success) {
        setSuccessMessage(`Ward "${ward.name}" deactivated successfully.`)
        await loadWards()
      } else {
        setError("Failed to deactivate ward.")
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete ward.")
    }
  }

  // Save/Update Ward Form
  const handleSaveWard = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      setError("Name and city are required fields.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    const authoritiesArray = form.assignedAuthorities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const wardData: Partial<IWard> = {
      name: form.name.trim(),
      city: form.city.trim(),
      assignedAuthorities: authoritiesArray as any, // Expecting IDs backend-side
    }

    try {
      let response
      if (editingWard) {
        response = await wardsAPI.update(editingWard._id, wardData)
      } else {
        response = await wardsAPI.create(wardData)
      }

      if (response.data.success) {
        setSuccessMessage(`Ward "${form.name}" saved successfully!`)
        setIsDialogOpen(false)
        await loadWards()
      } else {
        setError("Failed to save ward details.")
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save ward changes.")
    } finally {
      setSaving(false)
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

  return (
    <main className="space-y-6 p-6 max-w-7xl mx-auto pt-24 min-h-screen">
      {/* Toast Success/Errors */}
      {successMessage && (
        <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 shadow border border-green-700 text-sm font-medium rounded-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-white font-bold ml-2 text-xs uppercase">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 shadow border border-red-700 text-sm font-medium rounded-md animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1 truncate">{error}</span>
          <button onClick={() => setError(null)} className="text-white font-bold ml-2 text-xs uppercase">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Row */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Ward Management</h1>
          <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {wards.length} Wards
          </Badge>
        </div>
        <Button
          onClick={handleOpenAddDialog}
          className="bg-primary hover:bg-primary/95 text-white font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          Add New Ward
        </Button>
      </header>

      {/* Wards list Table */}
      <Card className="border border-gray-200/50 shadow-sm bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : wards.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-semibold">
            No wards configured. Click &ldquo;Add New Ward&rdquo; to start.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-xs font-bold uppercase text-gray-400">Ward Name</TableHead>
                <TableHead className="text-xs font-bold uppercase text-gray-400">City</TableHead>
                <TableHead className="text-xs font-bold uppercase text-gray-400">Assigned Authorities</TableHead>
                <TableHead className="text-xs font-bold uppercase text-gray-400">Status</TableHead>
                <TableHead className="w-40 text-right text-xs font-bold uppercase text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wards.map((w) => {
                const autCount = w.assignedAuthorities?.length || 0
                const authNames = w.assignedAuthorities?.map((a) => a.name).join(", ") || "None"

                return (
                  <TableRow key={w._id}>
                    <TableCell className="font-bold text-gray-900 text-sm">{w.name}</TableCell>
                    <TableCell className="font-semibold text-gray-700 text-sm">{w.city}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold border-gray-300 bg-gray-50 text-gray-600 shrink-0">
                          {autCount} Assigned
                        </Badge>
                        <span className="text-xs text-gray-500 truncate max-w-xs block" title={authNames}>
                          {authNames}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        w.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {w.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenEditDialog(w)}
                        className="text-[10px] font-bold border-gray-300 hover:bg-gray-100 h-7"
                      >
                        <Pencil className="size-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => handleDeleteWard(w)}
                        disabled={!w.isActive}
                        className="text-[10px] font-bold h-7"
                      >
                        <Trash2 className="size-3 mr-1" />
                        Deactivate
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWard ? `Edit Ward: ${editingWard.name}` : "Add New Ward"}
            </DialogTitle>
          </DialogHeader>

          {/* Form Content */}
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ward-name">Ward Name</Label>
              <Input
                id="ward-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Ward No. 12"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward-city">City</Label>
              <Input
                id="ward-city"
                value={form.city}
                onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Pune"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ward-authorities">Authority User IDs</Label>
              <Textarea
                id="ward-authorities"
                value={form.assignedAuthorities}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedAuthorities: e.target.value }))}
                placeholder="Enter Clerk User IDs comma-separated..."
                className="min-h-[80px]"
              />
            </div>

            {/* Info notice box */}
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg p-3.5 text-blue-800">
              <Info className="size-4.5 shrink-0 text-blue-600 mt-0.5" />
              <div className="text-[10px] font-semibold leading-relaxed">
                Ward boundaries (GeoJSON) are managed by the system administrator via MongoDB. Assign authority IDs here.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="text-xs uppercase tracking-wider font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWard}
              disabled={saving}
              className="bg-primary text-white font-bold text-xs uppercase tracking-wider"
            >
              {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Save Ward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
