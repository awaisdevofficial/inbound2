import { useState } from "react";
import { toast } from "./use-toast";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import { fillEmailPlaceholders } from "@/lib/emailPlaceholders";

export interface GenerateEmailParams {
  leadInfo?: {
    contact_name?: string;
    phone_number?: string;
    company_name?: string;
    call_date?: string;
    transcript?: string;
    metadata?: Record<string, any>;
  };
  emailType?: "follow-up" | "thank-you" | "appointment" | "custom";
  tone?: "professional" | "friendly" | "casual" | "formal";
  purpose?: string;
  context?: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
}

export function useAIEmail() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [generating, setGenerating] = useState(false);

  const generateEmail = async (params: GenerateEmailParams): Promise<GeneratedEmail | null> => {
    setGenerating(true);
    
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        toast({
          title: "Configuration Error",
          description: "OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.",
          variant: "destructive",
        });
        return null;
      }

      const {
        leadInfo,
        emailType = "follow-up",
        tone = "professional",
        purpose,
        context,
      } = params;

      // Build context from lead information
      let leadContext = "";
      let appointmentDetails = "";
      
      if (leadInfo) {
        leadContext = `
Lead Information:
${leadInfo.contact_name ? `- Contact Name: ${leadInfo.contact_name}` : ""}
${leadInfo.phone_number ? `- Phone Number: ${leadInfo.phone_number}` : ""}
${leadInfo.company_name ? `- Company: ${leadInfo.company_name}` : ""}
${leadInfo.call_date ? `- Call Date: ${leadInfo.call_date}` : ""}
${leadInfo.transcript ? `- Call Transcript: ${leadInfo.transcript.substring(0, 500)}...` : ""}
`;

        // Extract appointment information from extracted_data
        if (leadInfo.extracted_data && typeof leadInfo.extracted_data === 'object') {
          const extracted = leadInfo.extracted_data as any;
          if (extracted.appointment && (extracted.appointment.scheduled || extracted.appointment.requested)) {
            let formattedDate = extracted.appointment.date || "";
            let dayOfWeek = "";
            if (extracted.appointment.date) {
              try {
                const dateObj = new Date(extracted.appointment.date);
                if (!isNaN(dateObj.getTime())) {
                  formattedDate = dateObj.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                }
              } catch {}
            }
            
            appointmentDetails = `
APPOINTMENT INFORMATION:
- Status: ${extracted.appointment.scheduled ? "CONFIRMED/SCHEDULED" : "REQUESTED"}
- Date: ${formattedDate}${dayOfWeek ? ` (${dayOfWeek})` : ""}
- Time: ${extracted.appointment.time || "TBD"}
${extracted.appointment.timezone ? `- Timezone: ${extracted.appointment.timezone}` : ""}
${extracted.appointment.appointment_type ? `- Type: ${extracted.appointment.appointment_type}` : ""}

IMPORTANT: When generating the email, make sure to:
1. Mention the specific day of the week (${dayOfWeek || "the scheduled day"}) prominently
2. Confirm the appointment date and time clearly
3. Be warm and professional
4. Include any relevant details about what will be discussed
5. Provide contact information for changes or questions
`;
          }
        }
      }

      const systemInstruction = `You are an expert email writer specializing in business communication and lead follow-up emails.
Your task is to generate professional, effective email content that:
- Is clear, concise, and engaging
- Maintains the specified tone throughout
- Includes appropriate call-to-action
- Uses proper business email formatting
- Is personalized when lead information is provided
- Avoids being too salesy or pushy
- Creates value for the recipient

Output Format:
You must return ONLY a JSON object with this exact structure:
{
  "subject": "Email subject line here",
  "body": "Email body content here (can include line breaks with \\n)"
}

Do not include any other text, explanations, or markdown formatting. Only return the JSON object.`;

      const emailTypeDescriptions = {
        "follow-up": "a follow-up email after a phone call or conversation",
        "thank-you": "a thank you email expressing gratitude",
        "appointment": "an appointment confirmation or reminder email",
        "custom": purpose || "a business email",
      };

      const userPrompt = `Generate ${emailTypeDescriptions[emailType]} with a ${tone} tone.

${leadContext}

${appointmentDetails}

${context ? `Additional Context: ${context}` : ""}

${purpose ? `Purpose: ${purpose}` : ""}

Requirements:
- Subject line should be clear and compelling (max 60 characters)
- Email body should be 2-4 paragraphs
- Include a professional greeting and closing
- Add a clear call-to-action
- Use the lead's name if provided
- Reference the call/contact if applicable
${appointmentDetails ? `- CRITICAL: Mention the appointment date and day of the week prominently` : ""}
${appointmentDetails ? `- Include appointment confirmation details if scheduled` : ""}
- Keep it concise and actionable

Return the email as a JSON object with "subject" and "body" fields.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemInstruction,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      try {
        const parsed = JSON.parse(content);
        
        // Replace \n with actual line breaks
        let body = parsed.body?.replace(/\\n/g, "\n") || "";
        
        // Fill bracket-style placeholders with user profile data
        body = fillEmailPlaceholders(body, profile, user, {
          recipientName: leadInfo?.contact_name,
          recipientEmail: undefined,
        });
        
        let subject = parsed.subject || "Follow-up Email";
        subject = fillEmailPlaceholders(subject, profile, user);
        
        return {
          subject,
          body: body,
        };
      } catch (parseError) {
        // Fallback: try to extract subject and body from text
        const lines = content.split("\n");
        const subject = lines.find((line: string) => line.toLowerCase().includes("subject"))?.replace(/subject:?/i, "").trim() || "Follow-up Email";
        const body = content.replace(/subject:?.*/i, "").trim();
        
        return {
          subject,
          body: body || "Thank you for your interest. We'd like to follow up with you.",
        };
      }
    } catch (error) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate email. Please check your API key.",
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const generateTemplate = async (params: {
    name: string;
    description?: string;
    emailType?: "follow-up" | "thank-you" | "appointment" | "custom";
    tone?: "professional" | "friendly" | "casual" | "formal";
    purpose?: string;
  }): Promise<GeneratedEmail | null> => {
    setGenerating(true);
    
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        toast({
          title: "Configuration Error",
          description: "OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env file.",
          variant: "destructive",
        });
        return null;
      }

      const {
        name,
        description,
        emailType = "follow-up",
        tone = "professional",
        purpose,
      } = params;

      const systemInstruction = `You are an expert email template creator specializing in business communication.
Your task is to create reusable email templates that:
- Include placeholders for dynamic content using {{variable_name}} format
- Are clear, professional, and effective
- Maintain the specified tone
- Include appropriate structure and formatting
- Can be personalized with variables like {{contact_name}}, {{phone_number}}, {{company_name}}, {{call_date}}

Available variables that can be used:
- {{contact_name}} - Contact's name
- {{phone_number}} - Phone number
- {{company_name}} - Company name
- {{call_date}} - Date of call

Output Format:
You must return ONLY a JSON object with this exact structure:
{
  "subject": "Email subject with {{variables}}",
  "body": "Email body with {{variables}} and line breaks as \\n"
}

Do not include any other text or explanations. Only return the JSON object.`;

      const emailTypeDescriptions = {
        "follow-up": "a follow-up email template after a phone call",
        "thank-you": "a thank you email template",
        "appointment": "an appointment confirmation or reminder email template",
        "custom": purpose || "a business email template",
      };

      const userPrompt = `Create ${emailTypeDescriptions[emailType]} template named "${name}" with a ${tone} tone.

${description ? `Description: ${description}` : ""}
${purpose ? `Purpose: ${purpose}` : ""}

Requirements:
- Subject line should include variables like {{contact_name}} or {{phone_number}}
- Email body should be 2-4 paragraphs
- Use variables for personalization: {{contact_name}}, {{phone_number}}, {{company_name}}, {{call_date}}
- Include a professional greeting and closing
- Add a clear call-to-action
- Make it reusable and adaptable
- Keep it concise and actionable

Return the template as a JSON object with "subject" and "body" fields.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemInstruction,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      try {
        const parsed = JSON.parse(content);
        let body = parsed.body?.replace(/\\n/g, "\n") || "";
        
        // Fill bracket-style placeholders with user profile data
        body = fillEmailPlaceholders(body, profile, user);
        
        let subject = parsed.subject || "Follow-up: {{contact_name}}";
        subject = fillEmailPlaceholders(subject, profile, user);
        
        return {
          subject,
          body: body,
        };
      } catch (parseError) {
        return {
          subject: "Follow-up: {{contact_name}}",
          body: `Hello {{contact_name}},\n\nThank you for your interest. We'd like to follow up regarding our conversation on {{call_date}}.\n\nBest regards`,
        };
      }
    } catch (error) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate template",
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return {
    generateEmail,
    generateTemplate,
    generating,
  };
}
