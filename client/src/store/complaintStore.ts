import { create } from "zustand";
import { complaintsAPI } from "@/lib/api";
import type { ComplaintStatus, IComplaint, IComplaintFilters } from "@/types/complaint";

interface ComplaintStore {
  complaints: IComplaint[];
  selectedComplaint: IComplaint | null;
  nearbyComplaints: IComplaint[];
  filters: IComplaintFilters;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  fetchComplaints: (filters?: IComplaintFilters) => Promise<void>;
  fetchComplaintById: (id: string) => Promise<void>;
  submitComplaint: (formData: FormData) => Promise<IComplaint>;
  upvoteComplaint: (id: string) => Promise<void>;
  setFilters: (filters: IComplaintFilters) => void;
  addComplaintFromSocket: (complaint: IComplaint) => void;
  updateComplaintFromSocket: (update: { complaintId: string; status: ComplaintStatus }) => void;
  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

export const useComplaintStore = create<ComplaintStore>((set, get) => ({
  complaints: [],
  selectedComplaint: null,
  nearbyComplaints: [],
  filters: {},
  loading: false,
  submitting: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  fetchComplaints: async (filters) => {
    set({ loading: true, error: null, filters: filters || get().filters });
    try {
      const response = await complaintsAPI.getAll(filters || get().filters);
      set({
        complaints: response.data.complaints,
        total: response.data.total,
        page: response.data.page,
        totalPages: response.data.totalPages,
        loading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  fetchComplaintById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await complaintsAPI.getById(id);
      set({ selectedComplaint: response.data.complaint, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  submitComplaint: async (formData) => {
    set({ submitting: true, error: null });
    try {
      const response = await complaintsAPI.create(formData);
      const complaint = response.data.complaint;
      if (!complaint) {
        throw new Error(response.data.message || "Failed to create complaint");
      }
      set((state) => ({
        complaints: [complaint, ...state.complaints],
        submitting: false,
        nearbyComplaints: response.data.nearbyComplaints || [],
      }));
      return complaint;
    } catch (error) {
      const message = getErrorMessage(error);
      set({ error: message, submitting: false });
      throw new Error(message);
    }
  },
  upvoteComplaint: async (id) => {
    try {
      const response = await complaintsAPI.upvote(id);
      set((state) => ({
        complaints: state.complaints.map((complaint) =>
          complaint._id === id
            ? {
                ...complaint,
                upvoteCount: response.data.upvoteCount,
                priorityScore: response.data.priorityScore,
                priority: response.data.priority,
              }
            : complaint
        ),
        selectedComplaint:
          state.selectedComplaint?._id === id
            ? {
                ...state.selectedComplaint,
                upvoteCount: response.data.upvoteCount,
                priorityScore: response.data.priorityScore,
                priority: response.data.priority,
              }
            : state.selectedComplaint,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  setFilters: (filters) => set({ filters }),
  addComplaintFromSocket: (complaint) =>
    set((state) => ({
      complaints: state.complaints.some((item) => item._id === complaint._id)
        ? state.complaints
        : [complaint, ...state.complaints],
    })),
  updateComplaintFromSocket: (update) =>
    set((state) => ({
      complaints: state.complaints.map((complaint) =>
        complaint._id === update.complaintId ? { ...complaint, status: update.status } : complaint
      ),
      selectedComplaint:
        state.selectedComplaint?._id === update.complaintId
          ? { ...state.selectedComplaint, status: update.status }
          : state.selectedComplaint,
    })),
  clearError: () => set({ error: null }),
}));
