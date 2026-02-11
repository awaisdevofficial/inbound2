// Phone verification using apilayer.com API
export interface PhoneVerificationResult {
  valid: boolean;
  number: string;
  local_format: string;
  international_format: string;
  country_prefix: string;
  country_code: string;
  country_name: string;
  location: string;
  carrier: string;
  line_type: string;
}

export interface PhoneVerificationError {
  error: string;
  message?: string;
}

/**
 * Verify a phone number using apilayer.com number verification API
 * @param phoneNumber - Phone number to verify (can be in any format, e.g., "14158586273" or "+14158586273")
 * @returns Promise with verification result or error
 */
export async function verifyPhoneNumber(
  phoneNumber: string
): Promise<{ success: true; data: PhoneVerificationResult } | { success: false; error: string }> {
  try {
    const apiKey = import.meta.env.VITE_APILAYER_NUMBER_VERIFICATION_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        error: "API key not configured. Please add VITE_APILAYER_NUMBER_VERIFICATION_API_KEY to your .env file.",
      };
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/[\s\-()]/g, "");
    
    const response = await fetch(
      `https://api.apilayer.com/number_verification/validate?number=${encodeURIComponent(cleanNumber)}`,
      {
        method: "GET",
        headers: {
          apikey: apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `API request failed with status ${response.status}`,
      };
    }

    const data: PhoneVerificationResult = await response.json();
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during phone verification",
    };
  }
}
