import axios, { AxiosHeaders, type AxiosResponse } from "axios";
import type { IAnalytics, IComplaint, IComplaintFilters } from "@/types/complaint";
import type { INotification, IUser, IWard } from "@/types/user";

/**
 * Module-level token cache. Updated by setAuthToken() AND by the
 * tokenFetcher callback whenever an actual request is fired.
 */
let authToken: string | null = null;

/**
 * Optional async callback set by useAuthToken so the interceptor can
 * always request a guaranteed-fresh token directly from Clerk before
 * attaching it to the Authorization header.
 *
 * Without this, a cached (potentially expired) token string could sit in
 * `authToken` for up to 55 minutes and fail mid-session.
 */
let tokenFetcher: (() => Promise<string | null>) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Called once from useAuthToken so every axios request can get a live token. */
export function setTokenFetcher(fn: () => Promise<string | null>): void {
  tokenFetcher = fn;
}

export function clearTokenFetcher(): void {
  tokenFetcher = null;
  authToken = null;
}

export interface ListComplaintsResponse {
  success: true;
  complaints: IComplaint[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateComplaintResponse {
  success: true;
  complaint: IComplaint;
  nearbyCount?: number;
  nearbyComplaints?: IComplaint[];
}

export interface SingleComplaintResponse {
  success: true;
  complaint: IComplaint;
}

export interface NearbyComplaintsResponse {
  success: true;
  complaints: IComplaint[];
  count: number;
}

export interface UpvoteResponse {
  success: true;
  upvoteCount: number;
  priorityScore: number;
  priority: IComplaint["priority"];
}

export interface AnalyticsResponse {
  success: true;
  analytics: IAnalytics;
}

export interface UserResponse {
  success: true;
  user: IUser;
}

export interface MyComplaintsResponse extends ListComplaintsResponse {}

export interface NotificationsResponse {
  success: true;
  notifications: INotification[];
  unreadCount: number;
}

export interface WardsResponse {
  success: true;
  wards: IWard[];
}

export interface WardResponse {
  success: true;
  ward: IWard;
}

export interface RTIResponse {
  success: true;
  letter: string;
  daysPending: number;
  complaint: { title: string; id: string };
}

export interface CategorizeResponse {
  success: true;
  category: string;
  priority: string;
  keywords: string[];
  suggestedAction: string;
  estimatedSLAHours: number;
  confidence: number;
}

export interface WeeklySummaryResponse {
  success: true;
  summary: string;
  stats: {
    newComplaints: number;
    resolved: number;
    inProgress: number;
    pending: number;
    breached: number;
    categoryBreakdown: Array<{ _id: string; count: number }>;
  };
  period: { from: string; to: string };
}

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/v1`,
  withCredentials: true,
});

/**
 * Request interceptor — runs before EVERY axios request.
 *
 * If a tokenFetcher is registered (i.e. the user is signed in and
 * useAuthToken has mounted), we call it to get the freshest possible
 * Clerk JWT and set it on both the request header AND the module cache.
 *
 * If tokenFetcher is not available we fall back to the last known
 * cached `authToken` string (covers SSR-like edge cases).
 */
api.interceptors.request.use(async (config) => {
  let token = authToken;

  if (tokenFetcher) {
    try {
      const fresh = await tokenFetcher();
      if (fresh) {
        token = fresh;
        authToken = fresh; // keep cache in sync
      }
    } catch {
      // tokenFetcher failed — fall back to cached token
    }
  }

  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) console.warn("Unauthorized - token may have expired");
      if (error.response?.status === 403) console.warn("Forbidden - insufficient role");
    }
    return Promise.reject(error);
  }
);

export const complaintsAPI = {
  getAll: (params?: IComplaintFilters): Promise<AxiosResponse<ListComplaintsResponse>> =>
    api.get("/complaints", { params }),

  getById: (id: string): Promise<AxiosResponse<SingleComplaintResponse>> =>
    api.get(`/complaints/${id}`),

  getNearby: (
    lat: number,
    lng: number,
    radius?: number
  ): Promise<AxiosResponse<NearbyComplaintsResponse>> =>
    api.get("/complaints/nearby", { params: { lat, lng, radius: radius || 50 } }),

  // IMPORTANT: let axios set multipart headers automatically for FormData
  create: (formData: FormData): Promise<AxiosResponse<CreateComplaintResponse>> =>
    api.post("/complaints", formData),

  updateStatus: (
    id: string,
    data: { status: string; note?: string }
  ): Promise<AxiosResponse<SingleComplaintResponse>> =>
    api.patch(`/complaints/${id}/status`, data),

  upvote: (id: string): Promise<AxiosResponse<UpvoteResponse>> =>
    api.post(`/complaints/${id}/upvote`),

  resolve: (id: string, formData: FormData): Promise<AxiosResponse<SingleComplaintResponse>> =>
    api.post(`/complaints/${id}/resolve`, formData),

  getAnalytics: (): Promise<AxiosResponse<AnalyticsResponse>> =>
    api.get("/complaints/analytics/summary"),
};

export const usersAPI = {
  sync: (data: { email: string; name: string }): Promise<AxiosResponse<UserResponse>> =>
    api.post("/users/sync", data),

  getMe: (): Promise<AxiosResponse<UserResponse>> =>
    api.get("/users/me"),

  getMyComplaints: (
    params?: { page?: number; limit?: number }
  ): Promise<AxiosResponse<MyComplaintsResponse>> =>
    api.get("/users/me/complaints", { params }),

  getNotifications: (): Promise<AxiosResponse<NotificationsResponse>> =>
    api.get("/users/me/notifications"),

  markNotificationRead: (id: string): Promise<AxiosResponse<{ success: true }>> =>
    api.patch(`/users/me/notifications/${id}/read`),
};

export const wardsAPI = {
  getAll: (): Promise<AxiosResponse<WardsResponse>> =>
    api.get("/wards"),

  create: (data: Partial<IWard>): Promise<AxiosResponse<WardResponse>> =>
    api.post("/wards", data),

  update: (id: string, data: Partial<IWard>): Promise<AxiosResponse<WardResponse>> =>
    api.put(`/wards/${id}`, data),

  delete: (id: string): Promise<AxiosResponse<{ success: true; message: string }>> =>
    api.delete(`/wards/${id}`),
};

export const aiAPI = {
  generateRTI: (data: {
    complaintId: string;
    applicantName: string;
    applicantAddress: string;
    applicantPhone?: string;
  }): Promise<AxiosResponse<RTIResponse>> =>
    api.post("/ai/rti", data),

  categorize: (data: {
    title: string;
    description: string;
  }): Promise<AxiosResponse<CategorizeResponse>> =>
    api.post("/ai/categorize", data),

  weeklySummary: (): Promise<AxiosResponse<WeeklySummaryResponse>> =>
    api.post("/ai/weekly-summary"),
};

export default api;