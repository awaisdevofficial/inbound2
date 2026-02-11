import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Call, CallStatus } from "@/types/database";
import { useAuth } from "./useAuth";
import { formatInUserTimezone, formatWebhookResponse } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function useCalls() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setCalls((data as unknown as Call[]) || []);
    } catch (error: any) {
      // Removed console.error for security
      const errorMessage = error?.message || "Failed to fetch calls. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await fetchCalls();
    setLoading(false);
  }, [user, fetchCalls]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const callsChannel = supabase
      .channel("calls-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calls",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setCalls((prev) => [payload.new as unknown as Call, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedCall = payload.new as unknown as Call;

            setCalls((prev) => {
              const previousCall = prev.find((c) => c.id === updatedCall.id);

              // Check if webhook_response was just added/updated
              if (
                updatedCall.webhook_response &&
                (!previousCall?.webhook_response ||
                  JSON.stringify(previousCall.webhook_response) !==
                    JSON.stringify(updatedCall.webhook_response))
              ) {
                // Show toast notification when webhook response is received
                const formattedResponse = formatWebhookResponse(
                  updatedCall.webhook_response,
                );
                toast({
                  title: "Webhook Response Received",
                  description:
                    formattedResponse.length > 150
                      ? `${formattedResponse.substring(0, 150)}...`
                      : formattedResponse,
                });
              }

              return prev.map((call) =>
                call.id === updatedCall.id ? updatedCall : call,
              );
            });
          } else if (payload.eventType === "DELETE") {
            setCalls((prev) =>
              prev.filter((call) => call.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
    };
  }, [user]);

  // Calculate statistics
  const stats = {
    totalCalls: calls.length,
    pendingCalls: calls.filter((c) => c.status === "pending").length,
    inProgressCalls: calls.filter((c) => c.status === "in_progress").length,
    completedCalls: calls.filter((c) => c.status === "completed").length,
    failedCalls: calls.filter((c) => c.status === "failed").length,
    notConnectedCalls: calls.filter((c) => c.status === "not_connected").length,
    nightTimeDontCallCalls: calls.filter(
      (c) => c.status === "night_time_dont_call",
    ).length,
  };

  return {
    calls,
    loading,
    stats,
    refetch: fetchAll,
  };
}
