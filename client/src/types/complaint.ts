export type ComplaintCategory =
  | "pothole"
  | "garbage"
  | "water"
  | "streetlight"
  | "road"
  | "drainage"
  | "other";

export type ComplaintStatus = "pending" | "in_progress" | "resolved";
export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export interface ILocation {
  type: string;
  coordinates: [number, number];
  address: string;
  what3words?: string;
  landmark?: string;
}

export interface IImages {
  before: string;
  after?: string;
}

export interface ISLAEscalationLog {
  level: number;
  escalatedAt: string;
  reason: string;
}

export interface ISLA {
  deadline: string;
  breached: boolean;
  warningEmailSent: boolean;
  escalationLevel: number;
  escalationLog: ISLAEscalationLog[];
}

export interface IStatusHistory {
  status: ComplaintStatus;
  updatedBy: { _id: string; name: string };
  updatedAt: string;
  note: string;
}

export interface ICitizenFeedback {
  rating: number;
  comment?: string;
  submittedAt: string;
  citizenId: string;
}

export interface IContractor {
  _id: string;
  name: string;
  department: "Roads" | "Waste Management" | "Electricity" | "Water Supply" | "Drainage" | "General";
  contactEmail: string;
  contactPhone: string;
  wardsCovered?: Array<{ _id: string; name: string; city: string }>;
  ratingAvg: number;
  ratingCount: number;
  totalAssigned: number;
  totalResolved: number;
  onTimeResolutions: number;
  slaBreaches: number;
  licenseNumber: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IComplaint {
  _id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  priorityScore: number;
  location: ILocation;
  images: IImages;
  submittedBy: { _id: string; name: string; email: string };
  assignedTo?: { _id: string; name: string; email: string };
  assignedContractor?: IContractor | { _id: string; name: string; department?: string };
  ward?: { _id: string; name: string; city: string };
  upvotes: string[];
  upvoteCount: number;
  sla: ISLA;
  statusHistory: IStatusHistory[];
  citizenFeedback?: ICitizenFeedback;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IComplaintCreate {
  title: string;
  description: string;
  category: ComplaintCategory;
  lat: number;
  lng: number;
  address: string;
  what3words?: string;
  landmark?: string;
  image: File;
}

export interface IComplaintFilters {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  ward?: string;
  page?: number;
  limit?: number;
}

export interface IAnalytics {
  byCategory: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  byWard: { _id: string; wardName: string; count: number; breachCount?: number }[];
  avgResolutionHours: number;
  slaBreachRate: { total: number; breached: number; percentage: number };
  dailyTrend: { date: string; count: number }[];
}

export interface ITemporalAnalytics {
  timeframe: string;
  metrics: {
    totalComplaints: number;
    resolvedComplaints: number;
    breachedComplaints: number;
    resolutionRate: number;
    breachRate: number;
  };
  dailyTrend: Array<{ date: string; reported: number; resolved: number }>;
  categoryBreakdown: Array<{ _id: string; count: number }>;
  statusBreakdown: Array<{ _id: string; count: number }>;
}
