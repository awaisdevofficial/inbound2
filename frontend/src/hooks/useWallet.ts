import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export function useWallet() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();

    // Set up real-time subscription for profile updates
    if (!user) return;

    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfile, user]);

  const addCredits = async (amount: number, description?: string, reference_id?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc("add_credits", {
        p_user_id: user.id,
        p_amount: amount,
        p_description: description || "Credit added",
        p_reference_id: reference_id || null,
      });

      if (error) throw error;

      await fetchWallet();

      toast({
        title: "Credits Added",
        description: `Successfully added ${amount.toLocaleString()} credits (${amount} minutes) to your account`,
      });

      return data;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to add credits",
        variant: "destructive",
      });
      return null;
    }
  };

  const getBalance = () => {
    return profile?.Remaning_credits ? parseFloat(String(profile.Remaning_credits)) : 0;
  };

  const hasInsufficientBalance = (requiredAmount: number = 5) => {
    return getBalance() < requiredAmount;
  };

  return {
    wallet: profile ? {
      id: profile.id,
      user_id: profile.user_id,
      balance: getBalance(),
      currency: "USD",
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    } : null,
    loading,
    balance: getBalance(),
    addCredits,
    hasInsufficientBalance,
    refetch: fetchProfile,
  };
}
