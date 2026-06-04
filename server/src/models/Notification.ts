import mongoose, { Schema, Types } from "mongoose";

export type NotificationType = "status_update" | "upvote_milestone" | "escalation" | "resolution";

export interface INotification {
  _id: Types.ObjectId;
  userId: string;
  type: NotificationType;
  message: string;
  complaintId: Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["status_update", "upvote_milestone", "escalation", "resolution"],
      required: true,
    },
    message: { type: String, required: true },
    complaintId: { type: Schema.Types.ObjectId, ref: "Complaint", required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
