import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { complaintsApi, wardsApi } from "@/lib/api";
import type { Complaint } from "@/lib/types";

export function useComplaints(filters?: {
  status?: string;
  wardId?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["complaints", filters],
    queryFn: async () => {
      const res = await complaintsApi.getAll(filters);
      return res.data?.complaints || res.data || [];
    },
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const res = await complaintsApi.getById(id);
      return res.data?.complaint || res.data;
    },
    enabled: !!id,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => complaintsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: string;
      note?: string;
    }) => complaintsApi.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaint"] });
    },
  });
}

export function useWardComplaints(wardId: string) {
  return useQuery({
    queryKey: ["ward-complaints", wardId],
    queryFn: async () => {
      const res = await wardsApi.getComplaints(wardId);
      return res.data?.complaints || res.data || [];
    },
    enabled: !!wardId,
  });
}

export default useComplaints;
