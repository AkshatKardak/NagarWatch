"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getSocket, joinMapRoom, joinUserRoom } from "@/lib/socket";
import { useComplaintStore } from "@/store/complaintStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { ComplaintStatus, IComplaint } from "@/types/complaint";
import type { INotification } from "@/types/user";

export function useSocket(): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const { user } = useUser();
  const addComplaintFromSocket = useComplaintStore((state) => state.addComplaintFromSocket);
  const updateComplaintFromSocket = useComplaintStore((state) => state.updateComplaintFromSocket);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const socket = getSocket();
    const onConnect = (): void => setConnected(true);
    const onDisconnect = (): void => setConnected(false);
    const onNewComplaint = (complaint: IComplaint): void => addComplaintFromSocket(complaint);
    const onStatusUpdated = (update: { complaintId: string; status: ComplaintStatus }): void =>
      updateComplaintFromSocket(update);
    const onNotification = (notification: INotification): void => addNotification(notification);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    joinMapRoom();
    if (user?.id) joinUserRoom(user.id);
    socket.on("new_complaint", onNewComplaint);
    socket.on("status_updated", onStatusUpdated);
    socket.on("new_notification", onNotification);
    setConnected(socket.connected);

    return () => {
      socket.off("new_complaint", onNewComplaint);
      socket.off("status_updated", onStatusUpdated);
      socket.off("new_notification", onNotification);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [addComplaintFromSocket, addNotification, updateComplaintFromSocket, user?.id]);

  return { connected };
}
