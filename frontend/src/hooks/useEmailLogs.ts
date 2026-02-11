import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { EmailSentLog } from "@/types/database";

export function useEmailLogs(limit: number = 50) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<EmailSentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_sent_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      setLogs((data as unknown as EmailSentLog[]) || []);
    } catch (error: any) {
      // Removed console.error for security
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchLogs();

    // Set up real-time subscription
    if (user) {
      const channel = supabase
        .channel("email_sent_logs")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "email_sent_logs",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchLogs();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchLogs]);

  return {
    logs,
    loading,
    refresh: fetchLogs,
  };
}
