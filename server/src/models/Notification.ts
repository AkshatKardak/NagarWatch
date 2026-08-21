import mongoose, { Schema, Types } from "mongoose";

export type NotificationType = "status_update" | "upvote_milestone" | "escalation" | "resolution" | "new_complaint";

export interface INotification {
  _id: Types.ObjectId;
  userId: string | Types.ObjectId;
  type: NotificationType;
  message: string;
  complaintId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.Mixed, required: true, index: true },
    type: {
      type: String,
      enum: ["status_update", "upvote_milestone", "escalation", "resolution", "new_complaint"],
      required: true,
    },
    message: { type: String, required: true },
    complaintId: { type: Schema.Types.ObjectId, ref: "Complaint" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;
