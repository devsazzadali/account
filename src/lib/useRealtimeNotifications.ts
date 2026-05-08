import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

export type NotificationType = "order" | "payment" | "alert" | "delivery";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  orderId?: string;
}

export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notif: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Listen for order updates
    const channel = supabase
      .channel(`user_notifications_${userId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${userId}` }, (payload) => {
        const order = payload.new as any;
        const statusMessages: Record<string, string> = {
          paid: "Payment confirmed. Your order is being processed.",
          processing: "Your order is being prepared for delivery.",
          delivered: "Your account credentials are ready!",
          completed: "Order completed successfully.",
          disputed: "Your dispute has been opened. Admin is reviewing.",
          refunded: "Your refund has been processed.",
        };
        if (statusMessages[order.status]) {
          addNotification({
            type: order.status === "delivered" ? "delivery" : order.status === "paid" ? "payment" : "order",
            title: `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
            message: statusMessages[order.status],
            orderId: order.id,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification]);

  return { notifications, unreadCount, markAllRead, markRead, addNotification };
}
