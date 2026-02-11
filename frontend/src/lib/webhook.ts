/**
 * Webhook utility functions for making webhook calls with proper error handling
 */

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || "https://auto.nsolbpo.com/webhook/inbound";

export interface WebhookResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  [key: string]: any;
}

/**
 * Makes a webhook call with proper error handling and logging
 */
export async function callWebhook(
  payload: Record<string, any>,
  options?: {
    timeout?: number;
    useSupabaseProxy?: boolean;
    url?: string; // Custom webhook URL override
  }
): Promise<WebhookResponse> {
  const { timeout = 30000, useSupabaseProxy = false, url } = options || {};
  const webhookUrl = url || WEBHOOK_URL;

  try {
    let response: Response;
    let responseText: string;

    if (useSupabaseProxy) {
      // Use Supabase edge function as proxy
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("bot-management", {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || "Supabase function error");
      }

      return {
        success: data?.success || false,
        data: data?.webhook_response || data,
        ...data,
      };
    } else {
      // Direct webhook call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseText = await response.text();
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === "AbortError") {
          throw new Error(`Webhook request timed out after ${timeout}ms`);
        }
        
        if (fetchError.message?.includes("CORS")) {
          throw new Error(
            "CORS Error: The webhook server is not allowing requests from this origin. " +
            "Please configure CORS on the webhook server or use the Supabase proxy."
          );
        }
        
        if (fetchError.message?.includes("Failed to fetch")) {
          throw new Error(
            "Network Error: Unable to reach the webhook server. " +
            "Please check your internet connection and ensure the webhook server is running."
          );
        }
        
        throw fetchError;
      }

      // Parse response
      let webhookResponse: WebhookResponse;
      try {
        webhookResponse = JSON.parse(responseText);
      } catch {
        webhookResponse = {
          success: response.ok,
          message: responseText,
          raw: responseText,
        };
      }

      // Check if response indicates success
      const isSuccess =
        response.ok &&
        (webhookResponse.success !== false) &&
        !webhookResponse.error;

      if (!isSuccess) {
        const errorMessage =
          webhookResponse.error ||
          webhookResponse.message ||
          `Webhook returned status ${response.status}`;

        throw new Error(errorMessage);
      }

      return {
        success: true,
        ...webhookResponse,
      };
    }
  } catch (error: any) {
    // Removed console.error for security - prevents sensitive data exposure

    return {
      success: false,
      error: error.message || "Unknown error occurred",
      message: error.message,
    };
  }
}

/**
 * Makes a webhook call with file upload support
 */
export async function callWebhookWithFile(
  file: File,
  additionalData: Record<string, any> = {},
  options?: {
    timeout?: number;
    useSupabaseProxy?: boolean;
    url?: string; // Custom webhook URL override
  }
): Promise<WebhookResponse> {
  const { timeout = 120000, useSupabaseProxy = false, url } = options || {}; // 2 minute timeout for file uploads
  const webhookUrl = url || WEBHOOK_URL;

  try {
    let response: Response;
    let responseText: string;

    if (useSupabaseProxy) {
      // For file uploads through proxy, we need to convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke("bot-management", {
        body: {
          ...additionalData,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64File,
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Supabase function error");
      }

      return {
        success: data?.success || false,
        data: data?.webhook_response || data,
        ...data,
      };
    } else {
      // Direct webhook call with FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      
      // Append additional data as JSON string or individual fields
      Object.keys(additionalData).forEach((key) => {
        if (typeof additionalData[key] === "object") {
          formData.append(key, JSON.stringify(additionalData[key]));
        } else {
          formData.append(key, String(additionalData[key]));
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        response = await fetch(webhookUrl, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseText = await response.text();
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === "AbortError") {
          throw new Error(`Webhook request timed out after ${timeout}ms`);
        }
        
        throw fetchError;
      }

      // Parse response
      let webhookResponse: WebhookResponse;
      try {
        webhookResponse = JSON.parse(responseText);
      } catch {
        webhookResponse = {
          success: response.ok,
          message: responseText,
          raw: responseText,
        };
      }

      // Check if response indicates success
      const isSuccess =
        response.ok &&
        (webhookResponse.success !== false) &&
        !webhookResponse.error;

      if (!isSuccess) {
        const errorMessage =
          webhookResponse.error ||
          webhookResponse.message ||
          `Webhook returned status ${response.status}`;

        throw new Error(errorMessage);
      }

      return {
        success: true,
        ...webhookResponse,
      };
    }
  } catch (error: any) {
    // Removed console.error for security - prevents sensitive data exposure

    return {
      success: false,
      error: error.message || "Unknown error occurred",
      message: error.message,
    };
  }
}

/**
 * Validates webhook response structure
 */
export function validateWebhookResponse(response: any): boolean {
  if (!response) return false;
  
  // Check for success indicators
  if (response.success === true) return true;
  if (response.status === "success") return true;
  if (response.id || response.bot_id || response.agent_id) return true;
  
  // Check for error indicators
  if (response.error) return false;
  if (response.success === false) return false;
  
  return true;
}
