import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/database";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const WEBHOOK_URL = "https://auto.nsolbpo.com/webhook/deactivation-code";

export function useProfile() {
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
        .maybeSingle();

      if (error) {
        // If timezone column doesn't exist, it means migration hasn't been run
        if (
          error.message?.includes("column") &&
          error.message?.includes("timezone")
        ) {
          // Removed console.warn for security
          // Return profile without timezone for now
          const profileData = data as any;
          if (profileData) {
            setProfile({ ...profileData, timezone: "UTC" } as Profile);
          } else {
            setProfile(null);
          }
        } else {
          throw error;
        }
      } else {
        // Handle case where no profile exists (data is null)
        if (!data) {
          setProfile(null);
        } else {
          // Ensure timezone exists, default to UTC if not set
          const profileData = data as any;
          setProfile({
            ...profileData,
            timezone: profileData?.timezone || "UTC",
          } as Profile);
        }
      }
    } catch (error: any) {
      // Removed console.error for security
      // Don't show toast for missing column - it's a migration issue
      if (
        !error?.message?.includes("column") ||
        !error?.message?.includes("timezone")
      ) {
        const errorMessage = error?.message || "Failed to fetch profile. Please try again.";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    
    // Set up real-time subscription instead of polling
    if (!user) return;

    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedProfile = payload.new as any;
          setProfile({
            ...updatedProfile,
            timezone: updatedProfile?.timezone || "UTC",
          } as Profile);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfile, user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setProfile(null);
        return null;
      }
      setProfile(data as Profile);
      return data;
    } catch (error: any) {
      // Removed console.error for security
      const errorMessage = error?.message || "Failed to update profile.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  // Helper function to send deactivation code email
  const sendDeactivationCodeEmail = async (deactivationCode: string) => {
    if (!user?.email) {
      return { success: false, error: "User email not found" };
    }

    try {
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Deactivation Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Account Deactivation</h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Verification Code</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hello ${profile?.full_name || user.email?.split("@")[0] || "User"},
                      </p>
                      <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        You have requested to deactivate your account. Please use the verification code below to complete the deactivation process.
                      </p>
                      <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                        <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${deactivationCode}</p>
                      </div>
                      <p style="margin: 20px 0 0 0; color: #999999; font-size: 12px; line-height: 1.6;">
                        <strong>Important:</strong> This code will expire in 15 minutes. If you did not request this deactivation, please ignore this email or contact support immediately.
                      </p>
                      <p style="margin: 30px 0 0 0; color: #333333; font-size: 14px;">
                        Best regards,<br>
                        <strong>Inbound Genie Team</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textBody = `
Account Deactivation Verification Code

Hello ${profile?.full_name || user.email?.split("@")[0] || "User"},

You have requested to deactivate your account. Please use the verification code below to complete the deactivation process.

Your Verification Code: ${deactivationCode}

Important: This code will expire in 15 minutes. If you did not request this deactivation, please ignore this email or contact support immediately.

Best regards,
Inbound Genie Team
      `.trim();

      // Send email via secure system endpoint
      const response = await fetch(`${BACKEND_URL}/api/send-system-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to_email: user.email,
          subject: "Account Deactivation Verification Code",
          body: textBody,
          html_body: htmlBody,
          type: "deactivation",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to send deactivation code email" };
    }
  };

  // Helper function to send deactivation code and invoice to webhook
  const sendDeactivationToWebhook = async (deactivationCode: string) => {
    if (!user) return;

    try {
      // Get latest invoice for the user
      const { data: latestInvoice } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const payload = {
        deactivation_code: deactivationCode,
        user: {
          id: user.id,
          email: user.email,
          name: profile?.full_name,
        },
        invoice: latestInvoice ? {
          id: latestInvoice.id,
          invoice_number: latestInvoice.invoice_number,
          package_name: latestInvoice.package_name,
          amount: latestInvoice.amount,
          currency: latestInvoice.currency,
          status: latestInvoice.status,
          created_at: latestInvoice.created_at,
          due_date: latestInvoice.due_date,
        } : null,
      };

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } catch (error: any) {
      // Silently handle webhook errors
    }
  };

  const requestDeactivation = async (reason: string) => {
    if (!user) return { success: false, code: null, error: null };

    try {
      const { data, error } = await (supabase.rpc as any)("request_account_deactivation", {
        p_user_id: user.id,
        p_reason: reason,
      });

      if (error) throw error;

      // Send deactivation code email (code is sent via email, not shown on frontend)
      const emailResult = await sendDeactivationCodeEmail(data);
      
      // Send to webhook (async, don't wait)
      sendDeactivationToWebhook(data).catch(() => {
        // Silently handle webhook errors
      });

      // Return success without exposing the code to frontend
      if (emailResult.success) {
        return { success: true, code: null, error: null }; // Don't return code to frontend
      } else {
        return { success: false, code: null, error: emailResult.error || "Failed to send deactivation code email" };
      }
    } catch (error: any) {
      // Removed console.error for security
      return {
        success: false,
        code: null,
        error: error?.message || "Failed to request deactivation.",
      };
    }
  };

  const verifyDeactivationCode = async (code: string) => {
    if (!user) return false;

    try {
      const { error } = await (supabase.rpc as any)("verify_and_deactivate_account", {
        p_user_id: user.id,
        p_code: code,
      });

      if (error) throw error;

      // Refresh profile
      await fetchProfile();

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated successfully. You will be logged out.",
      });

      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Invalid or expired verification code.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deactivateAccount = async () => {
    if (!user) return false;

    try {
      const { error } = await (supabase.rpc as any)("deactivate_account", {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Refresh profile
      await fetchProfile();

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated successfully.",
      });

      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to deactivate account.",
        variant: "destructive",
      });
      return false;
    }
  };

  const reactivateAccount = async () => {
    if (!user) return false;

    try {
      const { error } = await (supabase.rpc as any)("reactivate_account", {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Refresh profile
      await fetchProfile();

      toast({
        title: "Account Reactivated",
        description: "Your account has been reactivated successfully.",
      });

      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error?.message || "Failed to reactivate account.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
    deactivateAccount,
    reactivateAccount,
    requestDeactivation,
    verifyDeactivationCode,
  };
}
