import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CallAnalytics } from "@/types/database";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export function useCallAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<CallAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user) {
      setAnalytics([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("call_analytics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalytics((data as CallAnalytics[]) || []);
    } catch (error: any) {
      // Removed console.error for security
      // Don't show toast for missing table - it's expected if no analytics exist yet
      if (!error?.message?.includes("does not exist")) {
        toast({
          title: "Error",
          description: error?.message || "Failed to fetch analytics",
          variant: "destructive",
        });
      }
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAnalytics();

    // Set up real-time subscription
    if (!user) return;

    const channel = supabase
      .channel("analytics-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_analytics",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAnalytics((prev) => [payload.new as CallAnalytics, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAnalytics((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as CallAnalytics) : item
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnalytics, user]);

  const getAnalyticsByCallId = (callId: string) => {
    return analytics.find((a) => a.call_id === callId);
  };

  const getLeads = () => {
    return analytics.filter((a) => a.is_lead);
  };

  const getAnalyticsBySentiment = (sentiment: CallAnalytics["sentiment"]) => {
    return analytics.filter((a) => a.sentiment === sentiment);
  };

  const getHighQualityLeads = (minScore: number = 7) => {
    return analytics.filter(
      (a) => a.is_lead && a.lead_quality_score && a.lead_quality_score >= minScore
    );
  };

  const getVoicemailCalls = () => {
    return analytics.filter((a) => a.voicemail_detected);
  };

  const getTransferredCalls = () => {
    return analytics.filter((a) => a.transfer_occurred);
  };

  const getAverageSentiment = () => {
    const sentimentMap = { positive: 1, neutral: 0, negative: -1 };
    const total = analytics.reduce((sum, a) => {
      return sum + (a.sentiment ? sentimentMap[a.sentiment] : 0);
    }, 0);
    return analytics.length > 0 ? total / analytics.length : 0;
  };

  const getLeadConversionRate = () => {
    const totalCalls = analytics.length;
    const leads = getLeads().length;
    return totalCalls > 0 ? (leads / totalCalls) * 100 : 0;
  };

  return {
    analytics,
    loading,
    getAnalyticsByCallId,
    getLeads,
    getAnalyticsBySentiment,
    getHighQualityLeads,
    getVoicemailCalls,
    getTransferredCalls,
    getAverageSentiment,
    getLeadConversionRate,
    refetch: fetchAnalytics,
  };
}
