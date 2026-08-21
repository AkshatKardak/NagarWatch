export type UserRole = "citizen" | "authority" | "admin" | "contractor";

export type ComplaintCategory =
  | "pothole"
  | "garbage"
  | "water"
  | "streetlight"
  | "road"
  | "drainage"
  | "other"
  | string;

export type ComplaintStatus = "pending" | "in_progress" | "resolved" | string;
export type ComplaintPriority = "low" | "medium" | "high" | "critical" | string;

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  ward?: { _id: string; name: string; city: string } | string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type IUser = User;

export interface Ward {
  _id: string;
  name: string;
  city: string;
  boundary?: { type: string; coordinates: number[][][] };
  assignedAuthorities?: Array<{ _id: string; name: string; email: string } | string>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type IWard = Ward;

export interface Contractor {
  _id: string;
  name: string;
  department: "Roads" | "Waste Management" | "Electricity" | "Water Supply" | "Drainage" | "General" | string;
  contactEmail: string;
  contactPhone: string;
  wardsCovered?: Array<{ _id: string; name: string; city: string } | string>;
  ratingAvg: number;
  ratingCount: number;
  totalAssigned: number;
  totalResolved: number;
  onTimeResolutions: number;
  slaBreaches: number;
  licenseNumber: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type IContractor = Contractor;

export interface Notification {
  _id: string;
  userId: string;
  type: "status_update" | "upvote_milestone" | "escalation" | "resolution" | "new_complaint" | string;
  message: string;
  complaintId?: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type INotification = Notification;

export interface CitizenFeedback {
  rating: number;
  comment?: string;
  submittedAt: string;
  citizenId: string;
}

export type ICitizenFeedback = CitizenFeedback;

export interface ComplaintLocation {
  type?: string;
  coordinates: [number, number];
  address: string;
  what3words?: string;
  landmark?: string;
}

export interface Complaint {
  _id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  priorityScore: number;
  location: ComplaintLocation;
  images: {
    before: string;
    after?: string;
  };
  submittedBy: { _id: string; name: string; email: string } | any;
  assignedTo?: { _id: string; name: string; email: string } | any;
  assignedContractor?: Contractor | { _id: string; name: string; department?: string } | any;
  ward?: { _id: string; name: string; city: string } | any;
  upvotes: string[];
  upvoteCount: number;
  sla: {
    deadline: string;
    breached: boolean;
    warningEmailSent: boolean;
    escalationLevel: number;
    escalationLog: Array<{ level: number; escalatedAt: string; reason: string }>;
  };
  statusHistory: Array<{
    status: ComplaintStatus;
    updatedBy: { _id: string; name: string } | any;
    updatedAt: string;
    note: string;
  }>;
  citizenFeedback?: CitizenFeedback;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type IComplaint = Complaint;

export interface ComplaintFilter {
  status?: string;
  category?: string;
  wardId?: string;
  ward?: string;
  page?: number;
  limit?: number;
}

export type IComplaintFilters = ComplaintFilter;
