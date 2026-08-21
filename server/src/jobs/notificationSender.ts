import Notification, { NotificationType } from "../models/Notification";
import { getIO } from "../config/socket";
import { emitToUser } from "../socket/handlers";

export async function sendNotification(data: {
  userId: string;
  type: NotificationType;
  message: string;
  complaintId?: any;
}): Promise<any> {
  try {
    const notification = await Notification.create(data);

    try {
      const io = getIO();
      emitToUser(io, data.userId, "notification", notification);
    } catch {
      // socket io might not be connected or user is offline
    }

    return notification;
  } catch (error) {
    console.error("[NotificationSender] Error creating notification:", error);
    throw error;
  }
}

export default { sendNotification };
