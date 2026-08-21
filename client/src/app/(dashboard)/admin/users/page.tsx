"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, ExternalLink, Info, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { usersApi } from "@/lib/api";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await usersApi.getAll();
        setUsers(res.data.users || res.data || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="size-6 text-[#D95D0F]" />
            Municipal User & Role Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">Manage citizen accounts, field authorities, ward assignments, and administrative privileges</p>
        </div>

        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase">
          <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
            Clerk Auth Console
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>

      {/* Role Reference Card */}
      <Card className="border border-stone-200 bg-white rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="p-5 border-b border-stone-100">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Registered Municipal Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="size-6 animate-spin text-[#D95D0F]" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium">
              No synced users in the database yet.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-stone-50">
                <TableRow>
                  <TableHead className="text-xs font-bold uppercase text-slate-400">Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-400">Email</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-400">Role</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-bold text-slate-900 text-sm">{u.name}</TableCell>
                    <TableCell className="text-slate-600 text-xs">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase ${
                          u.role === "admin"
                            ? "border-purple-300 bg-purple-50 text-purple-700"
                            : u.role === "authority"
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : "border-stone-300 bg-stone-50 text-slate-700"
                        }`}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
