import axios from "axios";
import type { Complaint, User, Ward, Contractor, Notification } from "./types";

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

let authToken: string | null = null;
let tokenFetcher: (() => Promise<string | null>) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setTokenFetcher(fn: () => Promise<string | null>): void {
  tokenFetcher = fn;
}

export function clearTokenFetcher(): void {
  tokenFetcher = null;
  authToken = null;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add Clerk token to every request
api.interceptors.request.use(async (config) => {
  let token = authToken;

  if (!token && typeof window !== "undefined" && window.Clerk?.session?.getToken) {
    try {
      token = await window.Clerk.session.getToken();
    } catch {
      // fallback
    }
  }

  if (!token && tokenFetcher) {
    try {
      token = await tokenFetcher();
    } catch {
      // fallback
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/sign-in")) {
        window.location.href = "/sign-in";
      }
    }
    return Promise.reject(error);
  }
);

// API Methods
export const complaintsApi = {
  getAll: (params?: { status?: string; wardId?: string; category?: string; page?: number; limit?: number }) =>
    api.get<any>("/complaints", { params }),

  getById: (id: string) =>
    api.get<any>(`/complaints/${id}`),

  create: (data: FormData) =>
    api.post<any>("/complaints", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id: string, data: Partial<Complaint>) =>
    api.patch<any>(`/complaints/${id}`, data),

  delete: (id: string) =>
    api.delete(`/complaints/${id}`),

  assignContractor: (id: string, contractorId: string) =>
    api.patch(`/complaints/${id}/assign`, { contractorId }),

  updateStatus: (id: string, status: string, note?: string) =>
    api.patch(`/complaints/${id}/status`, { status, note }),

  upvote: (id: string) =>
    api.post(`/complaints/${id}/upvote`),

  resolve: (id: string, data: FormData) =>
    api.post(`/complaints/${id}/resolve`, data),

  submitFeedback: (id: string, data: { rating: number; comment?: string }) =>
    api.post(`/complaints/${id}/feedback`, data),

  getNearby: (lat: number, lng: number, radius?: number) =>
    api.get("/complaints/nearby", { params: { lat, lng, radius: radius || 50 } }),

  getAnalytics: () =>
    api.get("/complaints/analytics/summary"),

  getTemporalAnalytics: (timeframe = "30d", ward?: string) =>
    api.get("/complaints/analytics/temporal", { params: { timeframe, ward } }),

  exportCSVUrl: (): string => `${API_URL}/complaints/export/csv`,
};

export const usersApi = {
  getMe: () =>
    api.get<any>("/users/me"),

  getAll: (role?: string) =>
    api.get<any>("/users", { params: { role } }),

  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),

  sync: (data: { email: string; name: string }) =>
    api.post("/users/sync", data),

  getMyComplaints: (params?: { page?: number; limit?: number }) =>
    api.get("/users/me/complaints", { params }),

  getNotifications: () =>
    api.get("/users/me/notifications"),

  markNotificationRead: (id: string) =>
    api.patch(`/users/me/notifications/${id}/read`),
};

export const wardsApi = {
  getAll: () =>
    api.get<any>("/wards"),

  create: (data: Partial<Ward>) =>
    api.post<any>("/wards", data),

  update: (id: string, data: Partial<Ward>) =>
    api.put<any>(`/wards/${id}`, data),

  delete: (id: string) =>
    api.delete(`/wards/${id}`),

  getComplaints: (wardId: string) =>
    api.get<any>(`/wards/${wardId}/complaints`),
};

export const contractorsApi = {
  getAll: (params?: { department?: string; sort?: string }) =>
    api.get<any>("/contractors", { params }),

  getById: (id: string) =>
    api.get<any>(`/contractors/${id}`),

  assign: (data: { complaintId: string; contractorId: string }) =>
    api.post("/contractors/assign", data),
};

export const aiApi = {
  generateRTI: (data: {
    complaintId: string;
    applicantName: string;
    applicantAddress: string;
    applicantPhone?: string;
  }) => api.post("/ai/rti", data),

  categorize: (data: { title: string; description: string }) =>
    api.post("/ai/categorize", data),

  categorizeImage: (data: { imageBase64: string; mimeType?: string }) =>
    api.post("/ai/categorize-image", data),

  checkDuplicates: (data: {
    title?: string;
    description?: string;
    category?: string;
    lat?: number;
    lng?: number;
  }) => api.post("/ai/check-duplicates", data),

  weeklySummary: () => api.post("/ai/weekly-summary"),
};

// Aliases for camelCase / UPPERCASE compatibility
export const complaintsAPI = complaintsApi;
export const usersAPI = usersApi;
export const wardsAPI = wardsApi;
export const contractorsAPI = contractorsApi;
export const aiAPI = aiApi;

export default api;
