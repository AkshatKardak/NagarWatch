"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Shield, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react";
import { wardsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Ward } from "@/lib/types";

export default function AdminWardsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    assignedAuthorities: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWards = async () => {
    setLoading(true);
    try {
      const res = await wardsApi.getAll();
      setWards(res.data.wards || res.data || []);
    } catch (err: any) {
      setError("Failed to load wards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWards();
  }, []);

  const handleOpenAddDialog = () => {
    setEditingWard(null);
    setForm({ name: "", city: "", assignedAuthorities: "" });
    setError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (ward: Ward) => {
    setEditingWard(ward);
    setForm({
      name: ward.name,
      city: ward.city,
      assignedAuthorities: (ward.assignedAuthorities || []).map((a: any) => a._id || a).join(", "),
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const handleDeleteWard = async (ward: Ward) => {
    if (!window.confirm(`Deactivate ward "${ward.name}"?`)) return;
    try {
      await wardsApi.delete(ward._id);
      await loadWards();
    } catch {
      // ignore
    }
  };

  const handleSaveWard = async () => {
    if (!form.name.trim() || !form.city.trim()) {
      setError("Name and city are required fields.");
      return;
    }

    setSaving(true);
    setError(null);

    const authoritiesArray = form.assignedAuthorities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const wardData: Partial<Ward> = {
      name: form.name.trim(),
      city: form.city.trim(),
      assignedAuthorities: authoritiesArray as any,
    };

    try {
      if (editingWard) {
        await wardsApi.update(editingWard._id, wardData);
      } else {
        await wardsApi.create(wardData);
      }
      setIsDialogOpen(false);
      await loadWards();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save ward.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Ward Infrastructure Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">Configure municipal ward zones, assign field officers, and supervise coverage</p>
        </div>

        <Button
          onClick={handleOpenAddDialog}
          className="bg-[#D95D0F] hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider self-start sm:self-auto"
        >
          <Plus className="size-3.5 mr-1.5" />
          Add New Ward
        </Button>
      </div>

      <Card className="border border-stone-200 bg-white rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : wards.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No wards configured.</div>
        ) : (
          <Table>
            <TableHeader className="bg-stone-50">
              <TableRow>
                <TableHead className="text-xs font-bold uppercase text-slate-400">Ward Name</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">City</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">Officers</TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">Status</TableHead>
                <TableHead className="w-32 text-right text-xs font-bold uppercase text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wards.map((w) => (
                <TableRow key={w._id}>
                  <TableCell className="font-bold text-slate-900 text-sm">{w.name}</TableCell>
                  <TableCell className="text-slate-600 text-xs">{w.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold border-stone-200">
                      {w.assignedAuthorities?.length || 0} Assigned
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleOpenEditDialog(w)}
                      className="text-[10px] font-bold h-7"
                    >
                      <Pencil className="size-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleDeleteWard(w)}
                      className="text-[10px] font-bold h-7"
                    >
                      <Trash2 className="size-3 mr-1" />
                      Deactivate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900">
              {editingWard ? `Edit Ward: ${editingWard.name}` : "Add New Municipal Ward"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {error && <p className="text-red-600 font-bold">{error}</p>}
            <div className="space-y-1">
              <Label htmlFor="w-name">Ward Name *</Label>
              <Input
                id="w-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ward No. 7 - Kothrud"
                className="rounded-xl border-stone-300"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="w-city">City *</Label>
              <Input
                id="w-city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Pune"
                className="rounded-xl border-stone-300"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="w-auth">Authority User IDs (Comma-separated)</Label>
              <Textarea
                id="w-auth"
                value={form.assignedAuthorities}
                onChange={(e) => setForm({ ...form, assignedAuthorities: e.target.value })}
                placeholder="user_xxx, user_yyy"
                className="rounded-xl border-stone-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs font-bold">
              Cancel
            </Button>
            <Button onClick={handleSaveWard} disabled={saving} className="bg-[#D95D0F] text-white text-xs font-bold">
              {saving ? "Saving..." : "Save Ward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
