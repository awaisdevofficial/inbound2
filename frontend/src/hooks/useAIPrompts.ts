import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AIPrompt } from "@/types/database";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export function useAIPrompts() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    if (!user) {
      setPrompts([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user's own prompts and template prompts
      const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .or(`user_id.eq.${user.id},is_template.eq.true`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrompts((data as AIPrompt[]) || []);
    } catch (error: any) {
      // Removed console.error for security
      if (!error?.message?.includes("does not exist")) {
        toast({
          title: "Error",
          description: error?.message || "Failed to fetch prompts",
          variant: "destructive",
        });
      }
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPrompts();

    // Set up real-time subscription
    if (!user) return;

    const channel = supabase
      .channel("prompts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_prompts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPrompts((prev) => [payload.new as AIPrompt, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPrompts((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as AIPrompt) : item
              )
            );
          } else if (payload.eventType === "DELETE") {
            setPrompts((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPrompts, user]);

  const createPrompt = async (prompt: Omit<AIPrompt, "id" | "user_id" | "created_at" | "updated_at" | "usage_count">) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("ai_prompts")
        .insert({
          user_id: user.id,
          ...prompt,
          usage_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Prompt Created",
        description: "AI prompt has been created successfully",
      });

      await fetchPrompts();
      return data as AIPrompt;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to create prompt",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePrompt = async (id: string, updates: Partial<AIPrompt>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("ai_prompts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Prompt Updated",
        description: "AI prompt has been updated successfully",
      });

      await fetchPrompts();
      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to update prompt",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePrompt = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("ai_prompts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Prompt Deleted",
        description: "AI prompt has been deleted",
      });

      await fetchPrompts();
      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to delete prompt",
        variant: "destructive",
      });
      return false;
    }
  };

  const incrementUsage = async (id: string) => {
    if (!user) return;

    try {
      const prompt = prompts.find((p) => p.id === id);
      if (!prompt) return;

      await supabase
        .from("ai_prompts")
        .update({ usage_count: (prompt.usage_count || 0) + 1 })
        .eq("id", id);

      // Update local state
      setPrompts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, usage_count: (p.usage_count || 0) + 1 } : p
        )
      );
    } catch (error) {
      // Removed console.error for security
    }
  };

  const getPromptsByCategory = (category: string) => {
    return prompts.filter((p) => p.category === category);
  };

  const getTemplatePrompts = () => {
    return prompts.filter((p) => p.is_template);
  };

  const getUserPrompts = () => {
    return prompts.filter((p) => p.user_id === user?.id && !p.is_template);
  };

  const getActivePrompts = () => {
    return prompts.filter((p) => p.is_active);
  };

  return {
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    incrementUsage,
    getPromptsByCategory,
    getTemplatePrompts,
    getUserPrompts,
    getActivePrompts,
    refetch: fetchPrompts,
  };
}
