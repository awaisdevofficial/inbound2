import { Profile } from "@/types/database";
import { User } from "@supabase/supabase-js";

/**
 * Fills bracket-style placeholders like [Your Full Name] with user profile data
 * This is used when generating/loading emails so users can edit the filled content
 */
export function fillEmailPlaceholders(
  text: string,
  profile: Profile | null,
  user: User | null,
  additionalData?: {
    recipientName?: string;
    recipientEmail?: string;
    callId?: string;
  }
): string {
  if (!text) return text;

  let filledText = text;

  // Get sender information
  const senderName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "";
  const senderFirstName = senderName.split(' ')[0] || senderName;
  const companyName = profile?.company_name || "";
  const companyAddress = profile?.company_address || "";
  const senderPosition = profile?.position || "";
  const contactInfo = profile?.contact_info || "";
  const senderEmail = user?.email || "";

  // Get recipient information
  const recipientName = additionalData?.recipientName || "";
  const recipientFirstName = recipientName ? recipientName.split(' ')[0] : "";
  const recipientEmail = additionalData?.recipientEmail || "";

  // Current date information
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = new Date().getFullYear().toString();

  // Map of bracket-style placeholders to values
  const bracketPlaceholders: Record<string, string> = {
    "[Your Full Name]": senderName,
    "[Your Name]": senderName,
    "[Your First Name]": senderFirstName,
    "[Your Position]": senderPosition,
    "[Your Title]": senderPosition,
    "[Your Company]": companyName,
    "[Company Name]": companyName,
    "[Your Company Name]": companyName,
    "[Your Contact Information]": contactInfo,
    "[Contact Information]": contactInfo,
    "[Your Email]": senderEmail,
    "[Your Address]": companyAddress,
    "[Company Address]": companyAddress,
    "[Your Company Address]": companyAddress,
    "[Recipient Name]": recipientName || recipientEmail.split('@')[0] || "",
    "[Recipient First Name]": recipientFirstName || recipientEmail.split('@')[0] || "",
    "[Date]": currentDate,
    "[Current Date]": currentDate,
    "[Year]": currentYear,
    "[Current Year]": currentYear,
  };

  // Replace all bracket-style placeholders (case-insensitive)
  Object.entries(bracketPlaceholders).forEach(([placeholder, value]) => {
    // Case-insensitive replacement
    const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    filledText = filledText.replace(regex, value);
  });

  return filledText;
}

/**
 * Gets a list of available bracket-style placeholders for display in UI
 */
export function getAvailablePlaceholders(): Array<{ placeholder: string; description: string }> {
  return [
    { placeholder: "[Your Full Name]", description: "Your full name from profile" },
    { placeholder: "[Your First Name]", description: "Your first name" },
    { placeholder: "[Your Position]", description: "Your job title/position" },
    { placeholder: "[Your Company]", description: "Your company name" },
    { placeholder: "[Your Contact Information]", description: "Your contact information" },
    { placeholder: "[Your Email]", description: "Your email address" },
    { placeholder: "[Your Address]", description: "Your company address" },
    { placeholder: "[Recipient Name]", description: "Recipient's name (if available)" },
    { placeholder: "[Recipient First Name]", description: "Recipient's first name" },
    { placeholder: "[Date]", description: "Current date" },
    { placeholder: "[Year]", description: "Current year" },
  ];
}
