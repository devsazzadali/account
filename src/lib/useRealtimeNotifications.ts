"use client";

// AccountStoreOne — notifications hook (polling replacement for the old
// the old realtime channel). Notifications are real rows in the
// `notifications` table, written server-side by the order/payment flows;
// this hook polls them and persists read-state back to the table.

import { useEffect, useState, useCallback, useRef } from "react";
import { db } from "./dbclient";

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

function mapRow(r: any): AppNotification {
  return {
    id: r.id,
    type: (["order", "payment", "alert", "delivery"].includes(r.type) ? r.type : "order") as NotificationType,
    title: r.title,
    message: r.message,
    read: !!r.is_read,
    createdAt: new Date(r.created_at),
  };
}

export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const knownIds = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await db
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      knownIds.current = new Set(data.map((r: any) => r.id));
      setNotifications(data.map(mapRow));
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [userId, refresh]);

  const addNotification = useCallback((notif: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    // Local-only toast helper (kept for API compatibility); durable
    // notifications are created server-side by the order flows.
    const local: AppNotification = {
      ...notif,
      id: `local-${crypto.randomUUID()}`,
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => [local, ...prev].slice(0, 50));
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (userId) await db.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!id.startsWith("local-")) await db.from("notifications").update({ is_read: true }).eq("id", id);
  }, []);

  return { notifications, unreadCount, markAllRead, markRead, addNotification };
}
