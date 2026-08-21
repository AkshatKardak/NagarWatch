import mongoose, { Schema, Types } from "mongoose";

export interface IWard {
  _id: Types.ObjectId;
  name: string;
  city: string;
  boundary: { type: "Polygon"; coordinates: number[][][] };
  assignedAuthorities: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const wardSchema = new Schema<IWard>(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    boundary: {
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    assignedAuthorities: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

wardSchema.index({ boundary: "2dsphere" });

export const Ward = mongoose.model<IWard>("Ward", wardSchema);
export default Ward;
