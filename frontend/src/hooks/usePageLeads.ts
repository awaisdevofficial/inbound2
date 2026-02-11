import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageLead } from "@/types/database";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export function usePageLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<PageLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("page_leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        // Handle missing column error gracefully
        if (error.code === "42703" || error.message?.includes("does not exist")) {
          // Removed console.warn for security
          // Try to fetch without ordering by created_at
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("page_leads")
            .select("*")
            .eq("user_id", user.id);
          
          if (fallbackError) throw fallbackError;
          setLeads((fallbackData as unknown as PageLead[]) || []);
          return;
        }
        throw error;
      }
      setLeads((data as unknown as PageLead[]) || []);
    } catch (error: any) {
      // Removed console.error for security
      const errorMessage = error?.message || "Failed to fetch leads. Please try again.";
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
    await fetchLeads();
    setLoading(false);
  }, [user, fetchLeads]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const leadsChannel = supabase
      .channel("page-leads-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "page_leads",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLeads((prev) => [payload.new as unknown as PageLead, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedLead = payload.new as unknown as PageLead;
            setLeads((prev) =>
              prev.map((lead) =>
                lead.id === updatedLead.id ? updatedLead : lead,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setLeads((prev) =>
              prev.filter((lead) => lead.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leadsChannel);
    };
  }, [user]);

  return {
    leads,
    loading,
    refetch: fetchAll,
  };
}
