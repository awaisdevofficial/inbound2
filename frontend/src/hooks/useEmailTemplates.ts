import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";
import { useProfile } from "./useProfile";
import { fillEmailPlaceholders } from "@/lib/emailPlaceholders";

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  description?: string | null;
  is_default: boolean;
  accent_color?: string;
  design_style?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
}

export function useEmailTemplates() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        // Handle missing table error gracefully
        if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
          // Removed console.warn for security
          setTemplates([]);
        } else {
          // Removed console.error for security
          setTemplates([]);
        }
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      // Removed console.error for security
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (template: Omit<EmailTemplate, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return null;

    try {
      // If setting as default, unset other defaults
      if (template.is_default) {
        await supabase
          .from("email_templates")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true);
      }

      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          user_id: user.id,
          ...template,
        })
        .select()
        .single();

      if (error) {
        // Handle missing table error gracefully
        if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
          toast({
            title: "Table Not Found",
            description: "Please run the migration: migrations/add_email_templates_table.sql",
            variant: "destructive",
          });
          return null;
        }
        throw error;
      }

      await fetchTemplates();
      toast({
        title: "Template Created",
        description: "Email template has been created successfully",
      });

      return data;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, template: Partial<EmailTemplate>) => {
    if (!user) return false;

    try {
      // If setting as default, unset other defaults
      if (template.is_default) {
        await supabase
          .from("email_templates")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true)
          .neq("id", id);
      }

      const { error } = await supabase
        .from("email_templates")
        .update(template)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        // Handle missing table error gracefully
        if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
          toast({
            title: "Table Not Found",
            description: "Please run the migration: migrations/add_email_templates_table.sql",
            variant: "destructive",
          });
          return null;
        }
        throw error;
      }

      await fetchTemplates();
      toast({
        title: "Template Updated",
        description: "Email template has been updated successfully",
      });

      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        // Handle missing table error gracefully
        if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
          toast({
            title: "Table Not Found",
            description: "Please run the migration: migrations/add_email_templates_table.sql",
            variant: "destructive",
          });
          return null;
        }
        throw error;
      }

      await fetchTemplates();
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted",
      });

      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive",
      });
      return false;
    }
  };

  const getDefaultTemplate = (): EmailTemplate | null => {
    return templates.find((t) => t.is_default) || templates[0] || null;
  };

  const processTemplate = (template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } => {
    let subject = template.subject;
    let body = template.body;

    // First, fill bracket-style placeholders like [Your Full Name], [Your Position], etc.
    subject = fillEmailPlaceholders(subject, profile, user, {
      recipientName: variables.contact_name,
      recipientEmail: undefined,
    });
    body = fillEmailPlaceholders(body, profile, user, {
      recipientName: variables.contact_name,
      recipientEmail: undefined,
    });

    // Then replace variables in format {{variable_name}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(regex, value || "");
      body = body.replace(regex, value || "");
    });

    return { subject, body };
  };

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getDefaultTemplate,
    processTemplate,
    refetch: fetchTemplates,
  };
}
