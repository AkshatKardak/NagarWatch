import mongoose, { Schema, Document } from "mongoose";

export interface IBlacklistedContractor extends Document {
  contractorName: string;
  reason: string;
  blacklistedAt: Date;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const blacklistedContractorSchema = new Schema<IBlacklistedContractor>(
  {
    contractorName: { type: String, required: true, trim: true, index: true },
    reason: { type: String, required: true },
    blacklistedAt: { type: Date, default: Date.now },
    source: { type: String, default: "CPWD_DEBARRED" },
  },
  { timestamps: true }
);

blacklistedContractorSchema.index({ contractorName: "text" });

export const BlacklistedContractor = mongoose.model<IBlacklistedContractor>(
  "BlacklistedContractor",
  blacklistedContractorSchema
);

export default BlacklistedContractor;
