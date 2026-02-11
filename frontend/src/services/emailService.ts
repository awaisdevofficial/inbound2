import { supabase } from "@/integrations/supabase/client";

// Default from email address (can be overridden)
const defaultFromEmail = import.meta.env.VITE_SMTP_FROM_EMAIL || 'noreply@example.com';
const defaultFromName = import.meta.env.VITE_SMTP_FROM_NAME || 'Inbound Genie';

interface SendEmailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Error types for email sending
 */
export interface EmailError {
  message: string;
  statusCode?: number;
  type?: 'bad_request' | 'server_error' | 'timeout' | 'unknown';
}

/**
 * Get user's email domain for sending emails
 * If user has a verified domain, use it; otherwise use default
 */
async function getUserFromEmail(userId?: string): Promise<string> {
  if (!userId) {
    return `${defaultFromName} <${defaultFromEmail}>`;
  }

  try {
    // Get user's profile and email preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", userId)
      .single();

    // Get user's primary email from user_emails table
    const { data: userEmail } = await supabase
      .from("user_emails")
      .select("email, name, is_verified")
      .eq("user_id", userId)
      .eq("is_primary", true)
      .eq("is_verified", true)
      .single();

    // If user has a verified primary email, use it
    if (userEmail?.email && userEmail.is_verified) {
      const displayName = userEmail.name || profile?.full_name || 'Inbound Genie User';
      return `${displayName} <${userEmail.email}>`;
    }

    // Fallback to profile email if available
    if (profile?.email) {
      const displayName = profile.full_name || 'Inbound Genie User';
      return `${displayName} <${profile.email}>`;
    }

    // Default fallback
    return `${defaultFromName} <${defaultFromEmail}>`;
  } catch (error) {
    // On error, use default
    return `${defaultFromName} <${defaultFromEmail}>`;
  }
}

/**
 * Send an email using Supabase SMTP via database function
 * @param opts - Email options
 * @param userId - Optional user ID to determine from email address
 * @returns Promise with data and error
 */
export async function sendEmail(
  opts: SendEmailOptions,
  userId?: string
): Promise<{ data: any; error: EmailError | null }> {
  try {
    // Ensure user has a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      const emailError: EmailError = {
        message: 'Not authenticated. Please sign in again.',
        statusCode: 401,
        type: 'bad_request',
      };
      return { data: null, error: emailError };
    }

    // Refresh session if needed (handles expired tokens)
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession(session);
      if (refreshError || !refreshData?.session) {
        const emailError: EmailError = {
          message: 'Session expired. Please sign in again.',
          statusCode: 401,
          type: 'bad_request',
        };
        return { data: null, error: emailError };
      }
    }

    // Determine from email address
    const fromEmail = opts.from || await getUserFromEmail(userId);

    // Normalize recipients to array
    const toList = Array.isArray(opts.to) ? opts.to : [opts.to];

    // Call database function to send email via SMTP
    const { data, error } = await supabase.rpc('send_email', {
      p_from: fromEmail,
      p_to: toList,
      p_subject: opts.subject,
      p_html: opts.html,
      p_reply_to: opts.replyTo || null,
    });

    if (error) {
      const emailError: EmailError = {
        message: error.message || 'Failed to send email',
        statusCode: 500,
        type: 'server_error',
      };
      return { data: null, error: emailError };
    }

    // Check if the response contains an error
    // data is Json type, so we need to check it properly
    if (data && typeof data === 'object' && 'error' in data) {
      const errorData = data as { error?: { message?: string; status?: number } };
      const emailError: EmailError = {
        message: errorData.error?.message || 'Failed to send email',
        statusCode: errorData.error?.status || 500,
        type: getErrorType(errorData.error?.status),
      };
      return { data: null, error: emailError };
    }

    // Check if success is false
    if (data && typeof data === 'object' && 'success' in data) {
      const result = data as { success?: boolean; error?: { message?: string; status?: number } };
      if (result.success === false && result.error) {
        const emailError: EmailError = {
          message: result.error.message || 'Failed to send email',
          statusCode: result.error.status || 500,
          type: getErrorType(result.error.status),
        };
        return { data: null, error: emailError };
      }
    }

    return { data: data || { success: true }, error: null };
  } catch (error: any) {
    // Handle unexpected errors
    const emailError: EmailError = {
      message: error?.message || 'Failed to send email',
      statusCode: error?.statusCode || error?.status,
      type: 'unknown',
    };
    return { data: null, error: emailError };
  }
}

/**
 * Map HTTP status codes to error types
 */
function getErrorType(statusCode?: number): EmailError['type'] {
  if (!statusCode) return 'unknown';
  
  switch (statusCode) {
    case 400:
      return 'bad_request';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'server_error';
    default:
      return 'unknown';
  }
}

/**
 * Send a low credit balance notification email
 * @param userEmail - Recipient email address
 * @param balance - Current credit balance
 * @param isCritical - Whether the balance is critically low (< 5 credits)
 * @param userId - Optional user ID for determining from email
 * @returns Promise with data and error
 */
export async function sendLowBalanceEmail(
  userEmail: string,
  balance: number,
  isCritical: boolean,
  userId?: string
): Promise<{ data: any; error: EmailError | null }> {
  const subject = isCritical
    ? 'Critical: Low Credit Balance Alert'
    : 'Low Credit Balance Warning';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${isCritical ? '#fee' : '#fff3cd'}; border-left: 4px solid ${isCritical ? '#dc3545' : '#ffc107'}; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
          <h2 style="margin-top: 0; color: ${isCritical ? '#dc3545' : '#856404'};">
            ${isCritical ? '⚠️ Critical: Low Credit Balance' : '⚠️ Low Credit Balance Warning'}
          </h2>
          <p style="font-size: 16px; margin: 10px 0;">
            Your credit balance is ${isCritical ? 'critically' : 'getting'} low.
          </p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${isCritical ? '#dc3545' : '#856404'};">
              Current Balance: ${balance.toFixed(2)} credits
            </p>
          </div>
          <p style="margin: 15px 0;">
            ${isCritical
              ? 'Please add more credits immediately to continue using the service without interruption.'
              : 'Consider adding more credits soon to avoid service interruption.'}
          </p>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
            Thank you for using our service.
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
  }, userId);
}

/**
 * Send deactivation verification code email
 */
export async function sendDeactivationVerificationEmail(
  userEmail: string,
  code: string,
  userId?: string
): Promise<{ data: any; error: EmailError | null }> {
  const subject = 'Account Deactivation Verification Code';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
          <h2 style="margin-top: 0; color: #dc3545;">
            Account Deactivation Verification
          </h2>
          <p style="font-size: 16px; margin: 10px 0;">
            You requested to deactivate your account. Please use the following verification code:
          </p>
          <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc3545; font-family: monospace;">
              ${code}
            </p>
          </div>
          <p style="font-size: 14px; color: #666; margin: 15px 0;">
            This code will expire in 15 minutes.
          </p>
          <p style="font-size: 14px; color: #666; margin: 15px 0;">
            If you did not request this deactivation, please ignore this email or contact support immediately.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 12px; color: #999; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: userEmail,
    subject,
    html,
  }, userId);
}

/**
 * Send user email (from user's own email address if configured)
 */
export async function sendUserEmail(
  fromEmail: string,
  toEmail: string,
  subject: string,
  body: string,
  userId?: string
): Promise<{ data: any; error: EmailError | null }> {
  // Convert plain text to HTML if needed
  const html = body.includes('<') ? body : `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="white-space: pre-wrap;">${body.replace(/\n/g, '<br>')}</div>
      </body>
    </html>
  `;

  return sendEmail({
    from: fromEmail,
    to: toEmail,
    subject,
    html,
    replyTo: fromEmail,
  }, userId);
}
