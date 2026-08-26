import mongoose, { Schema, Types } from "mongoose";

export type ComplaintCategory =
  | "pothole"
  | "garbage"
  | "water"
  | "streetlight"
  | "road"
  | "drainage"
  | "other";

export type ComplaintStatus =
  | "pending"
  | "in_progress"
  | "resolution_submitted"
  | "awaiting_citizen_verification"
  | "verified_resolved"
  | "resolved"
  | "rejected"
  | "escalated"
  | "reopened";

export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export interface ICitizenFeedback {
  rating: number;
  comment?: string;
  submittedAt: Date;
  citizenId: Types.ObjectId;
}

export interface IResolutionAttempt {
  attemptNumber: number;
  afterImage: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  verificationStatus: string;
}

export interface IComplaint {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  priorityScore: number;
  location: {
    type: "Point";
    coordinates: number[];
    address: string;
    what3words?: string;
    landmark?: string;
  };
  images: { before: string; after?: string };
  submittedBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  assignedContractor?: Types.ObjectId;
  ward?: Types.ObjectId;
  upvotes: Types.ObjectId[];
  upvoteCount: number;
  sla: {
    deadline: Date;
    breached: boolean;
    warningEmailSent: boolean;
    escalationLevel: number;
    escalationLog: { level: number; escalatedAt: Date; reason: string }[];
  };
  statusHistory: { status: string; updatedBy: Types.ObjectId; updatedAt: Date; note: string }[];
  citizenFeedback?: ICitizenFeedback;
  resolutionNote?: string;
  resolvedAt?: Date;

  // New Citizen Resolution Verification Fields (Feature 3)
  resolutionProof?: {
    beforeImage?: string;
    afterImage: string;
    uploadedAt: Date;
    uploadedBy: Types.ObjectId;
  };
  verification?: {
    status: "PENDING" | "VERIFIED" | "REJECTED";
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;
    rejectionReason?: string;
  };
  resolutionAttempts?: IResolutionAttempt[];

  // New AI Assistant Recommendation Fields (Feature 5)
  aiRecommendation?: {
    category?: string;
    severity?: string;
    department?: string;
    confidence?: number;
    generatedAt?: Date;
  };
  finalClassification?: {
    category?: string;
    priority?: string;
    department?: string;
    source?: string; // "AI_RULE_ENGINE" | "MANUAL"
  };

  // Multilingual and Voice Fields (Features 6 & 7)
  originalContent?: {
    language: string;
    title: string;
    description: string;
  };
  normalizedContent?: {
    language: string;
    title: string;
    description: string;
  };
  voiceInput?: {
    enabled: boolean;
    language: string;
    transcript: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const escalationLogSchema = new Schema(
  {
    level: { type: Number, required: true },
    escalatedAt: { type: Date, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedAt: { type: Date, required: true },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const citizenFeedbackSchema = new Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now },
    citizenId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: false }
);

const resolutionAttemptSchema = new Schema(
  {
    attemptNumber: { type: Number, required: true },
    afterImage: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
    verificationStatus: { type: String, default: "PENDING" },
  },
  { _id: false }
);

const complaintSchema = new Schema<IComplaint>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: ["pothole", "garbage", "water", "streetlight", "road", "drainage", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "resolution_submitted",
        "awaiting_citizen_verification",
        "verified_resolved",
        "resolved",
        "rejected",
        "escalated",
        "reopened",
      ],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
    priorityScore: { type: Number, default: 0 },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value: number[]) => value.length === 2,
          message: "Location coordinates must be [lng, lat]",
        },
      },
      address: { type: String, required: true, trim: true },
      what3words: { type: String, trim: true },
      landmark: { type: String, trim: true },
    },
    images: {
      before: { type: String, required: true },
      after: { type: String },
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedContractor: { type: Schema.Types.ObjectId, ref: "Contractor" },
    ward: { type: Schema.Types.ObjectId, ref: "Ward" },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    upvoteCount: { type: Number, default: 0 },
    sla: {
      deadline: { type: Date, required: true },
      breached: { type: Boolean, default: false },
      warningEmailSent: { type: Boolean, default: false },
      escalationLevel: { type: Number, default: 0 },
      escalationLog: { type: [escalationLogSchema], default: [] },
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    citizenFeedback: { type: citizenFeedbackSchema },
    resolutionNote: { type: String },
    resolvedAt: { type: Date },

    // Citizen Resolution Verification Lifecycle Fields
    resolutionProof: {
      beforeImage: { type: String },
      afterImage: { type: String },
      uploadedAt: { type: Date },
      uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    verification: {
      status: {
        type: String,
        enum: ["PENDING", "VERIFIED", "REJECTED"],
        default: "PENDING",
      },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verifiedAt: { type: Date },
      rejectionReason: { type: String },
    },
    resolutionAttempts: { type: [resolutionAttemptSchema], default: [] },

    // AI Assistant Recommendations
    aiRecommendation: {
      category: { type: String },
      severity: { type: String },
      department: { type: String },
      confidence: { type: Number },
      generatedAt: { type: Date },
    },
    finalClassification: {
      category: { type: String },
      priority: { type: String },
      department: { type: String },
      source: { type: String, default: "MANUAL" },
    },

    // Multi-Language & Voice
    originalContent: {
      language: { type: String, default: "en" },
      title: { type: String },
      description: { type: String },
    },
    normalizedContent: {
      language: { type: String, default: "en" },
      title: { type: String },
      description: { type: String },
    },
    voiceInput: {
      enabled: { type: Boolean, default: false },
      language: { type: String },
      transcript: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes
complaintSchema.index({ location: "2dsphere" });
complaintSchema.index({ status: 1, ward: 1, category: 1 });
complaintSchema.index({ priorityScore: -1 });
complaintSchema.index({ "sla.deadline": 1, status: 1 });
complaintSchema.index({ assignedContractor: 1 });
complaintSchema.index({ "verification.status": 1 });
complaintSchema.index({ createdAt: -1 });

export const Complaint = mongoose.model<IComplaint>("Complaint", complaintSchema);
export default Complaint;
