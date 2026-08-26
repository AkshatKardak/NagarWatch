import mongoose, { Schema, Types } from "mongoose";

export interface IContractor {
  _id: Types.ObjectId;
  name: string;
  department: "Roads" | "Waste Management" | "Electricity" | "Water Supply" | "Drainage" | "General";
  contactEmail: string;
  contactPhone: string;
  wardsCovered: Types.ObjectId[];
  ratingAvg: number;
  ratingCount: number;
  totalAssigned: number;
  totalResolved: number;
  onTimeResolutions: number;
  slaBreaches: number;
  licenseNumber: string;
  isActive: boolean;

  // Government Registration Fields
  class?: string;
  category?: string;
  address?: string;
  state?: string;

  cpwdRegistration?: {
    number?: string;
    class?: string;
    category?: string;
    enlistmentDate?: Date;
    authority?: string;
    source: "CPWD" | "STATE_PWD" | "MUNICIPALITY" | "MANUAL";
  };

  verificationDetails?: {
    isVerified: boolean;
    verifiedAt?: Date;
    verifiedBy?: Types.ObjectId;
    verificationSource?: "CPWD_DATASET" | "STATE_PWD" | "MANUAL_REVIEW" | "MUNICIPALITY";
    documents?: string[];
  };

  performanceMetrics?: {
    jobsAssigned: number;
    jobsCompleted: number;
    onTimeCompletions: number;
    slaBreaches: number;
    reopenedJobs: number;
    averageResolutionHours: number;
    performanceScore: number;
  };

  blacklistStatus?: {
    isBlacklisted: boolean;
    reason?: string;
    blacklistedAt?: Date;
    source?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const contractorSchema = new Schema<IContractor>(
  {
    name: { type: String, required: true, trim: true },
    department: {
      type: String,
      enum: ["Roads", "Waste Management", "Electricity", "Water Supply", "Drainage", "General"],
      default: "General",
      required: true,
    },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true },
    wardsCovered: [{ type: Schema.Types.ObjectId, ref: "Ward" }],
    ratingAvg: { type: Number, default: 4.5, min: 1, max: 5 },
    ratingCount: { type: Number, default: 12 },
    totalAssigned: { type: Number, default: 45 },
    totalResolved: { type: Number, default: 42 },
    onTimeResolutions: { type: Number, default: 39 },
    slaBreaches: { type: Number, default: 3 },
    licenseNumber: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    class: { type: String, default: "Class I" },
    category: { type: String, default: "Buildings & Roads" },
    address: { type: String, default: "" },
    state: { type: String, default: "Maharashtra" },

    cpwdRegistration: {
      number: { type: String },
      class: { type: String },
      category: { type: String },
      enlistmentDate: { type: Date },
      authority: { type: String },
      source: {
        type: String,
        enum: ["CPWD", "STATE_PWD", "MUNICIPALITY", "MANUAL"],
        default: "MANUAL",
      },
    },

    verificationDetails: {
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verificationSource: {
        type: String,
        enum: ["CPWD_DATASET", "STATE_PWD", "MANUAL_REVIEW", "MUNICIPALITY"],
      },
      documents: [{ type: String }],
    },

    performanceMetrics: {
      jobsAssigned: { type: Number, default: 0 },
      jobsCompleted: { type: Number, default: 0 },
      onTimeCompletions: { type: Number, default: 0 },
      slaBreaches: { type: Number, default: 0 },
      reopenedJobs: { type: Number, default: 0 },
      averageResolutionHours: { type: Number, default: 0 },
      performanceScore: { type: Number, default: 0 },
    },

    blacklistStatus: {
      isBlacklisted: { type: Boolean, default: false },
      reason: { type: String },
      blacklistedAt: { type: Date },
      source: { type: String },
    },
  },
  { timestamps: true }
);

// Indexes
contractorSchema.index({ department: 1, ratingAvg: -1 });
contractorSchema.index({ "cpwdRegistration.number": 1 });
contractorSchema.index({ "verificationDetails.isVerified": 1 });
contractorSchema.index({ "blacklistStatus.isBlacklisted": 1 });
contractorSchema.index({ "performanceMetrics.performanceScore": -1 });

export const Contractor = mongoose.model<IContractor>("Contractor", contractorSchema);
export default Contractor;
