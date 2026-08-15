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
    licenseNumber: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

contractorSchema.index({ department: 1, ratingAvg: -1 });

export const Contractor = mongoose.model<IContractor>("Contractor", contractorSchema);
export default Contractor;
