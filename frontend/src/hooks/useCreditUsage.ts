import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditUsageLog } from "@/types/database";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export function useCreditUsage() {
  const { user } = useAuth();
  const [usageLogs, setUsageLogs] = useState<CreditUsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsageLogs = useCallback(async () => {
    if (!user) {
      setUsageLogs([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("credit_usage_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsageLogs((data as CreditUsageLog[]) || []);
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch usage logs",
        variant: "destructive",
      });
      setUsageLogs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsageLogs();

    // Set up real-time subscription
    if (!user) return;

    const channel = supabase
      .channel("credit-usage-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "credit_usage_logs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newLog = payload.new as CreditUsageLog;
          setUsageLogs((prev) => [newLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsageLogs, user]);

  const getUsageByType = (type: CreditUsageLog["usage_type"]) => {
    return usageLogs.filter((log) => log.usage_type === type);
  };

  const getTotalUsageByType = (type: CreditUsageLog["usage_type"]) => {
    return usageLogs
      .filter((log) => log.usage_type === type)
      .reduce((sum, log) => sum + Number(log.amount_used), 0);
  };

  const getTotalMinutesUsed = () => {
    return usageLogs
      .filter((log) => log.usage_type === "call" && log.duration_seconds)
      .reduce((sum, log) => sum + (log.duration_seconds || 0), 0) / 60;
  };

  const getTotalCallCredits = () => {
    return getTotalUsageByType("call");
  };

  const getUsageForDateRange = (startDate: Date, endDate: Date) => {
    return usageLogs.filter((log) => {
      const logDate = new Date(log.created_at);
      return logDate >= startDate && logDate <= endDate;
    });
  };

  return {
    usageLogs,
    loading,
    getUsageByType,
    getTotalUsageByType,
    getTotalMinutesUsed,
    getTotalCallCredits,
    getUsageForDateRange,
    refetch: fetchUsageLogs,
  };
}
