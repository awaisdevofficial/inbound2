import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type:
    | "agent_created"
    | "agent_updated"
    | "agent_deleted"
    | "agent_activated"
    | "agent_deactivated"
    | "call_completed"
    | "call_failed"
    | "knowledge_base_created"
    | "knowledge_base_updated"
    | "knowledge_base_deleted"
    | "phone_number_imported"
    | "phone_number_removed"
    | "profile_updated"
    | "password_changed"
    | "account_deactivated"
    | "account_reactivated"
    | "billing_updated"
    | "settings_updated";
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export function useActivityLogs(limit: number = 50) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      // Removed console.error for security
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchActivities();

    // Set up real-time subscription
    if (user) {
      const channel = supabase
        .channel("activity_logs")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_logs",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchActivities();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchActivities]);

  const logActivity = useCallback(
    async (
      activityType: ActivityLog["activity_type"],
      description: string,
      entityType?: string,
      entityId?: string,
      metadata?: Record<string, any>
    ) => {
      if (!user) return;

      try {
        // Get user agent and IP if available
        const userAgent = navigator.userAgent;
        // Note: IP address would need to be obtained server-side

        const { error } = await (supabase.rpc as any)("log_activity", {
          p_user_id: user.id,
          p_activity_type: activityType,
          p_description: description,
          p_entity_type: entityType || null,
          p_entity_id: entityId || null,
          p_metadata: metadata || null,
          p_ip_address: null, // Would need server-side implementation
          p_user_agent: userAgent,
        });

        if (error) throw error;

        // Refresh activities
        fetchActivities();
      } catch (error) {
        // Removed console.error for security
      }
    },
    [user, fetchActivities]
  );

  return {
    activities,
    loading,
    logActivity,
    refresh: fetchActivities,
  };
}
