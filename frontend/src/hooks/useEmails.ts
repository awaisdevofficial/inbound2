import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserEmail {
  id: string;
  email: string;
  name?: string | null;
  smtp_password?: string | null;
  is_primary: boolean;
  is_verified?: boolean;
  created_at?: string;
}

export function useEmails() {
  const { user } = useAuth();
  const [emails, setEmails] = useState<UserEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmails = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_emails")
          .select("*")
          .eq("user_id", user.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          // Removed console.error for security
          setEmails([]);
        } else {
          // Only return emails with SMTP password configured and not primary
          const smtpEmails = (data || []).filter(
            (e) => !e.is_primary && e.smtp_password && e.smtp_password.trim() !== ""
          );
          setEmails(smtpEmails);
        }
      } catch (error) {
        // Removed console.error for security
        setEmails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [user]);

  const getPrimaryEmail = (): UserEmail | null => {
    // Return first SMTP email instead of primary
    return emails.find((e) => e.smtp_password) || emails[0] || null;
  };

  return {
    emails,
    loading,
    getPrimaryEmail,
    refetch: async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_emails")
          .select("*")
          .eq("user_id", user.id)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          // Removed console.error for security
        } else {
          // Only return emails with SMTP password configured and not primary
          const smtpEmails = (data || []).filter(
            (e) => !e.is_primary && e.smtp_password && e.smtp_password.trim() !== ""
          );
          setEmails(smtpEmails);
        }
      } catch (error) {
        // Removed console.error for security
      } finally {
        setLoading(false);
      }
    },
  };
}
