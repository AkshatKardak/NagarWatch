export type UserRole = "citizen" | "authority" | "admin";

export interface IUser {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  ward?: { _id: string; name: string; city: string };
  isActive: boolean;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: "status_update" | "upvote_milestone" | "escalation" | "resolution";
  message: string;
  complaintId: string;
  read: boolean;
  createdAt: string;
}

export interface IWard {
  _id: string;
  name: string;
  city: string;
  boundary?: { type: string; coordinates: number[][][] };
  assignedAuthorities: { _id: string; name: string; email: string }[];
  isActive: boolean;
}
