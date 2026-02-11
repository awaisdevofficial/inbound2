import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";
import { convertToHtmlEmail, type EmailDesignStyle } from "@/lib/htmlEmail";
import { useProfile } from "./useProfile";
import { fillEmailPlaceholders } from "@/lib/emailPlaceholders";

const BACKEND_EMAIL_URL = import.meta.env.VITE_BACKEND_EMAIL_URL || "http://localhost:3001/email";

export interface SendEmailParams {
  fromEmail: string;
  toEmail: string;
  toPhoneNumber?: string;
  subject: string;
  body: string;
  callId?: string;
  smtpPassword?: string;
  accentColor?: string;
  designStyle?: EmailDesignStyle;
  companyName?: string;
}

export function useSendEmail() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [sending, setSending] = useState(false);

  const sendEmail = async (params: SendEmailParams) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to send emails",
        variant: "destructive",
      });
      return { success: false, error: "Not authenticated" };
    }

    setSending(true);
    try {
      // First, log the email attempt in the database
      const { data: logData, error: logError } = await supabase
        .from("email_sent_logs")
        .insert({
          user_id: user.id,
          from_email: params.fromEmail,
          to_email: params.toEmail,
          to_phone_number: params.toPhoneNumber || null,
          subject: params.subject,
          body: params.body,
          call_id: params.callId || null,
          status: "pending",
        })
        .select()
        .single();

      if (logError) {
        // Removed console.error for security
        // Continue anyway - logging failure shouldn't block sending
      }

      // Send email via backend nodemailer service
      try {
        // Get sender and company information from profile
        const senderName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Team";
        const companyName = params.companyName || profile?.company_name || "";
        const companyAddress = profile?.company_address || "";
        const senderPosition = profile?.position || "";
        const contactInfo = profile?.contact_info || "";
        const senderEmail = params.fromEmail;

        // Get recipient name if available (from call data or contact)
        let recipientName = "";
        if (params.callId) {
          // Try to get recipient name from call data
          const { data: callData } = await supabase
            .from("calls")
            .select("contact_name, phone_number")
            .eq("id", params.callId)
            .single();
          
          if (callData?.contact_name) {
            recipientName = callData.contact_name;
          }
        }

        // Auto-fill email body with company details and personalization
        let processedBody = params.body;

        // First, fill bracket-style placeholders like [Your Full Name], [Your Position], etc.
        processedBody = fillEmailPlaceholders(processedBody, profile, user, {
          recipientName: recipientName || undefined,
          recipientEmail: params.toEmail,
          callId: params.callId,
        });

        // Then replace template variables in the body ({{variable}} format)
        const templateVariables: Record<string, string> = {
          "{{sender_name}}": senderName,
          "{{sender_first_name}}": senderName.split(' ')[0] || senderName,
          "{{company_name}}": companyName,
          "{{company_address}}": companyAddress,
          "{{sender_position}}": senderPosition,
          "{{sender_email}}": senderEmail,
          "{{contact_info}}": contactInfo,
          "{{recipient_name}}": recipientName || params.toEmail.split('@')[0],
          "{{recipient_first_name}}": recipientName ? recipientName.split(' ')[0] : params.toEmail.split('@')[0],
          "{{date}}": new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          "{{year}}": new Date().getFullYear().toString(),
        };

        // Replace all template variables
        Object.entries(templateVariables).forEach(([key, value]) => {
          processedBody = processedBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        });

        // If body doesn't contain any personalization and recipient name is available, add a greeting
        if (!processedBody.includes(recipientName) && !processedBody.includes("{{") && recipientName) {
          processedBody = `Dear ${recipientName},\n\n${processedBody}`;
        } else if (!processedBody.includes("{{") && !recipientName && !processedBody.toLowerCase().startsWith('dear') && !processedBody.toLowerCase().startsWith('hello') && !processedBody.toLowerCase().startsWith('hi')) {
          // Add a generic greeting if none exists
          processedBody = `Hello,\n\n${processedBody}`;
        }

        // Add email signature if not already present
        if (!processedBody.includes("Best regards") && !processedBody.includes("Sincerely") && !processedBody.includes("Regards")) {
          let signature = "\n\n";
          if (senderName) {
            signature += `Best regards,\n${senderName}`;
            if (senderPosition) {
              signature += `\n${senderPosition}`;
            }
            if (companyName) {
              signature += `\n${companyName}`;
            }
            if (companyAddress) {
              signature += `\n${companyAddress}`;
            }
            if (contactInfo) {
              signature += `\n${contactInfo}`;
            }
            signature += `\n${senderEmail}`;
          } else {
            signature += "Best regards";
          }
          processedBody += signature;
        }

        // Convert plain text body to beautiful HTML email
        const htmlBody = convertToHtmlEmail(params.subject, processedBody, {
          style: params.designStyle || "modern",
          accentColor: params.accentColor || "#4F46E5",
          companyName: companyName,
        });

        // Validate that SMTP password is provided
        if (!params.smtpPassword) {
          throw new Error("SMTP password (app password) is required to send emails");
        }

        // Send email to backend
        const response = await fetch(BACKEND_EMAIL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from_email: params.fromEmail,
            to_email: params.toEmail,
            subject: params.subject,
            body: processedBody, // Use processed body with auto-filled details
            html_body: htmlBody,
            smtp_password: params.smtpPassword,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to send email");
        }

        // Update log with success
        if (logData?.id) {
          await supabase
            .from("email_sent_logs")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", logData.id);
        }

        // Deduct credits for sending the email (0.5 credits per email)
        try {
          const { data: creditResult, error: creditError } = await (supabase.rpc as any)(
            "deduct_credits_for_email_send",
            {
              p_user_id: user.id,
              p_email_id: logData?.id || null,
              p_metadata: {
                from_email: params.fromEmail,
                to_email: params.toEmail,
                subject: params.subject,
                call_id: params.callId || null,
              },
            }
          );

          if (creditError) {
            // Log error but don't block success - credit deduction failure shouldn't prevent email from being sent
            // The error will be logged in the database notification system
          } else if (creditResult && typeof creditResult === 'object' && 'success' in creditResult && !creditResult.success) {
            // Insufficient credits or other deduction error
            const errorMsg = (creditResult as any).error || "Unknown error";
            toast({
              title: "Email Sent",
              description: `Email sent successfully, but credit deduction failed: ${errorMsg}`,
              variant: "destructive",
            });
          }
        } catch (creditDeductionError: any) {
          // Credit deduction failed but email was sent - log it but don't block
          // This is a non-critical error
        }

        toast({
          title: "Email Sent",
          description: `Email sent successfully to ${params.toEmail}`,
        });

        return { success: true, logId: logData?.id };
      } catch (emailError: any) {
        // Removed console.error for security
        
        // Update log with failure
        if (logData?.id) {
          await supabase
            .from("email_sent_logs")
            .update({
              status: "failed",
              error_message: emailError.message || "Email sending error",
            })
            .eq("id", logData.id);
        }

        const errorMsg = emailError.message || "Failed to send email";

        toast({
          title: "Email Sending Failed",
          description: errorMsg,
          variant: "destructive",
        });

        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setSending(false);
    }
  };

  return {
    sendEmail,
    sending,
  };
}
