import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error" | "system" | "billing" | "agent" | "call";
  title: string;
  message: string | null;
  read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  read_at: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.read).length);
    } catch (error) {
      // Removed console.error for security
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription
    if (user) {
      const channel = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return;

      try {
        const { error } = await (supabase.rpc as any)("mark_notification_read", {
          p_notification_id: notificationId,
          p_user_id: user.id,
        });

        if (error) throw error;

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        // Removed console.error for security
      }
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await (supabase.rpc as any)("mark_all_notifications_read", {
        p_user_id: user.id,
      });

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      // Removed console.error for security
    }
  }, [user]);

  const createNotification = useCallback(
    async (
      type: Notification["type"],
      title: string,
      message?: string,
      metadata?: Record<string, any>
    ) => {
      if (!user) return;

      try {
        const { error } = await (supabase.rpc as any)("create_notification", {
          p_user_id: user.id,
          p_type: type,
          p_title: title,
          p_message: message || null,
          p_metadata: metadata || null,
        });

        if (error) throw error;

        // Refresh notifications
        fetchNotifications();
      } catch (error) {
        // Removed console.error for security
      }
    },
    [user, fetchNotifications]
  );

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refresh: fetchNotifications,
  };
}
