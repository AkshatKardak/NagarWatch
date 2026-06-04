import mongoose, { Schema, Types } from "mongoose";

export type UserRole = "citizen" | "authority" | "admin";

export interface IUser {
  _id: Types.ObjectId;
  clerkId: string;
  email: string;
  name: string;
  role: UserRole;
  ward?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["citizen", "authority", "admin"],
      default: "citizen",
    },
    ward: { type: Schema.Types.ObjectId, ref: "Ward" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
