import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a local date/time in user's timezone to UTC ISO string
 */
export function localToUTC(localDate: Date, userTimezone: string): string {
  // fromZonedTime treats the input date as if it's in the specified timezone
  // and converts it to UTC
  const utcDate = fromZonedTime(localDate, userTimezone);
  return utcDate.toISOString();
}

/**
 * Convert a UTC date to user's timezone for display
 */
export function utcToLocal(
  utcDate: Date | string | null | undefined,
  userTimezone: string,
): Date {
  // Handle null, undefined, or empty string
  if (!utcDate) {
    return new Date(); // Return current date as fallback
  }

  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return new Date(); // Return current date as fallback
  }

  try {
    // toZonedTime converts a UTC date to the specified timezone
    return toZonedTime(date, userTimezone);
  } catch (error) {
    // Removed console.error for security
    return new Date(); // Return current date as fallback
  }
}

/**
 * Format a date in user's timezone
 */
export function formatInUserTimezone(
  date: Date | string | null | undefined,
  userTimezone: string,
  formatStr: string = "PPpp",
): string {
  // Handle null, undefined, or empty string
  if (!date) {
    return "-";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "-";
  }

  try {
    return formatInTimeZone(dateObj, userTimezone, formatStr);
  } catch (error) {
    // Removed console.error for security
    return "-";
  }
}

/**
 * Convert a date/time from any timezone to Asia/Karachi timezone
 *
 * @param date - The date object (date portion only, time will be set from timeString)
 * @param timeString - Time string in format "HH:mm"
 * @param sourceTimezone - The timezone the date/time is in (e.g., "UTC", "America/New_York")
 * @returns ISO-8601 string with Asia/Karachi timezone offset (e.g., "2026-01-24T22:43:00+05:00")
 */
export function convertToKarachiTime(
  date: Date,
  timeString: string,
  sourceTimezone: string,
): string {
  const KARACHI_TIMEZONE = "Asia/Karachi";

  // Parse time string
  const [hours, minutes] = timeString.split(":").map(Number);

  // Create a date object with the specified date and time
  const scheduledDateTime = new Date(date);
  scheduledDateTime.setHours(hours, minutes, 0, 0);

  // Convert from source timezone to UTC (to get the exact moment in time)
  const utcDate = fromZonedTime(scheduledDateTime, sourceTimezone);

  // Format the date/time in Karachi timezone using formatInTimeZone
  const formatted = formatInTimeZone(
    utcDate,
    KARACHI_TIMEZONE,
    "yyyy-MM-dd'T'HH:mm:ss",
  );

  // Get the timezone offset for Asia/Karachi
  // We use a sample date to determine the offset (Asia/Karachi is UTC+5, no DST)
  // But we calculate it dynamically to be safe
  const sampleDate = new Date("2024-01-01T00:00:00Z"); // Use a known UTC date
  const karachiSample = sampleDate.toLocaleString("en-US", {
    timeZone: KARACHI_TIMEZONE,
    hour12: false,
  });
  const utcSample = sampleDate.toLocaleString("en-US", {
    timeZone: "UTC",
    hour12: false,
  });

  // Parse both to calculate offset
  // This is a simplified approach - Asia/Karachi is always +05:00
  // But we calculate it to handle any edge cases
  const offsetString = "+05:00"; // Asia/Karachi is always UTC+5 (no DST)

  return `${formatted}${offsetString}`;
}

/**
 * Formats webhook responses for display, handling:
 * - Escape sequences in strings (\n, \r, \t, etc.)
 * - JSON parsing and formatting
 * - Nested objects and arrays
 * - Various response types
 */
export function formatWebhookResponse(data: unknown): string {
  if (data === null || data === undefined) {
    return "No response data";
  }

  // Helper function to process strings and convert escape sequences
  const processString = (str: string): string => {
    return str
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  };

  // Helper function to recursively process objects and arrays
  const processValue = (value: unknown): unknown => {
    if (typeof value === "string") {
      return processString(value);
    } else if (Array.isArray(value)) {
      return value.map(processValue);
    } else if (value !== null && typeof value === "object") {
      const processed: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        processed[key] = processValue(val);
      }
      return processed;
    }
    return value;
  };

  if (typeof data === "string") {
    // Try to parse as JSON if it looks like JSON
    try {
      const parsed = JSON.parse(data);
      const processed = processValue(parsed);
      return JSON.stringify(processed, null, 2);
    } catch {
      // If not JSON, process escape sequences in the string
      return processString(data);
    }
  }

  if (typeof data === "object") {
    // Format object nicely with processed escape sequences
    try {
      const processed = processValue(data);
      return JSON.stringify(processed, null, 2);
    } catch {
      return String(data);
    }
  }

  return String(data);
}

/**
 * Formats webhook data in a user-friendly way
 * Removes technical IDs, UUIDs, empty fields, and system/internal keys
 * Makes keys human-readable with spaces and capitalization
 */
export function formatUserFriendlyData(
  data: any,
): { label: string; value: string }[] {
  if (!data || typeof data !== "object") {
    return [];
  }

  // Fields to hide from users (technical/internal)
  const hiddenFields = [
    "user_id",
    "agent_id",
    "call_id",
    "bot_id",
    "id",
    "uuid",
    "guid",
    "created_at",
    "updated_at",
    "deleted_at",
    "modified_at",
    "metadata",
    "timestamp",
    "action",
    "internal_id",
    "system_id",
    "api_key",
    "token",
    "secret",
    "hash",
    "checksum",
    "version",
    "revision",
    "created_by",
    "updated_by",
    "deleted_by",
    "owner_id",
    "tenant_id",
    "organization_id",
    "workspace_id",
  ];

  // User-friendly labels
  const fieldLabels: Record<string, string> = {
    contact_name: "Contact Name",
    phone_number: "Phone Number",
    status: "Status",
    duration: "Duration",
    message: "Message",
    response: "Response",
    success: "Result",
    error: "Error Details",
    first_name: "First Name",
    last_name: "Last Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    city: "City",
    state: "State",
    country: "Country",
    zip_code: "Zip Code",
    postal_code: "Postal Code",
  };

  /**
   * Check if a value looks like a UUID
   * Matches formats like: 123e4567-e89b-12d3-a456-426614174000
   */
  const isUUID = (val: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
  };

  /**
   * Check if a field name looks like it contains an ID or UUID
   */
  const isIdField = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    return (
      lowerKey.endsWith("_id") ||
      lowerKey.endsWith("id") ||
      lowerKey.includes("uuid") ||
      lowerKey.includes("guid") ||
      lowerKey === "id"
    );
  };

  /**
   * Check if a value is empty (empty string, empty array, empty object)
   */
  const isEmpty = (val: any): boolean => {
    if (val === "" || val === null || val === undefined) return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (
      typeof val === "object" &&
      !Array.isArray(val) &&
      Object.keys(val).length === 0
    )
      return true;
    return false;
  };

  const formatted: { label: string; value: string }[] = [];

  // First, check if it's a nested response with 'data' or 'response'
  const actualData = data.data || data.response || data;

  for (const [key, value] of Object.entries(actualData)) {
    // Skip hidden fields
    if (hiddenFields.includes(key.toLowerCase())) continue;

    // Skip ID fields (unless they're explicitly whitelisted)
    if (isIdField(key)) continue;

    // Skip null/undefined/empty values
    if (isEmpty(value)) continue;

    // Skip UUID values
    if (typeof value === "string" && isUUID(value)) continue;

    // Get user-friendly label
    const label =
      fieldLabels[key] ||
      key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    // Format value based on type
    let displayValue: string;
    if (typeof value === "boolean") {
      displayValue = value ? "✓ Yes" : "✗ No";
    } else if (typeof value === "object") {
      // For nested objects, try to extract meaningful info
      if (Array.isArray(value)) {
        // Only show array count if not empty
        if (value.length > 0) {
          displayValue = `${value.length} item${value.length !== 1 ? "s" : ""}`;
        } else {
          continue; // Skip empty arrays
        }
      } else {
        // For objects, recursively format or stringify
        const nested = formatUserFriendlyData(value);
        if (nested.length > 0) {
          // Format nested object as indented key-value pairs
          displayValue = nested
            .map((item) => `  ${item.label}: ${item.value}`)
            .join("\n");
        } else {
          continue; // Skip if nested formatting returns nothing
        }
      }
    } else {
      displayValue = String(value).trim();
      // Skip if the trimmed value is empty
      if (!displayValue) continue;
    }

    formatted.push({ label, value: displayValue });
  }

  return formatted;
}

/**
 * Formats a Scheduled_at JSON string into a human-readable format
 * 
 * @param scheduledAt - JSON string like '{"timezone":"Asia/Karachi","scheduled_date":"2026-01-31","scheduled_time":"21:37"}'
 * @param formatStr - Optional date-fns format string (default: "MMM dd, yyyy 'at' h:mm a")
 * @returns Formatted string like "Jan 31, 2026 at 9:37 PM (Asia/Karachi)" or "-" if invalid
 */
export function formatScheduledAt(
  scheduledAt: string | null | undefined,
  formatStr: string = "MMM dd, yyyy 'at' h:mm a",
): string {
  if (!scheduledAt) {
    return "-";
  }

  try {
    // Try to parse as JSON
    const parsed = typeof scheduledAt === "string" ? JSON.parse(scheduledAt) : scheduledAt;
    
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.timezone &&
      parsed.scheduled_date &&
      parsed.scheduled_time
    ) {
      // Combine date and time
      const dateTimeString = `${parsed.scheduled_date}T${parsed.scheduled_time}:00`;
      const date = new Date(dateTimeString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "-";
      }

      // Format the date
      const formattedDate = format(date, formatStr);
      
      // Get timezone abbreviation or use the timezone name
      const timezoneName = parsed.timezone.split("/").pop() || parsed.timezone;
      
      return `${formattedDate} (${timezoneName})`;
    }
    
    // If it's not the expected JSON format, try to parse as ISO date string
    const date = new Date(scheduledAt);
    if (!isNaN(date.getTime())) {
      return format(date, formatStr);
    }
    
    return "-";
  } catch (error) {
    // If parsing fails, try to parse as ISO date string
    try {
      const date = new Date(scheduledAt);
      if (!isNaN(date.getTime())) {
        return format(date, formatStr);
      }
    } catch {
      // If all parsing fails, return the original string or "-"
      return "-";
    }
    return "-";
  }
}

/**
 * Exports data to CSV format and downloads it
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param headers - Optional array of header labels. If not provided, uses object keys
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: { key: string; label: string }[]
): void {
  if (data.length === 0) {
    return;
  }

  // Get all unique keys from the data
  const allKeys = new Set<string>();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => allKeys.add(key));
  });

  // Use provided headers or generate from keys
  const csvHeaders = headers || Array.from(allKeys).map((key) => ({ key, label: key }));
  
  // Create CSV header row
  const headerRow = csvHeaders.map((h) => escapeCSVValue(h.label)).join(",");

  // Create CSV data rows
  const dataRows = data.map((item) => {
    return csvHeaders
      .map((header) => {
        const value = item[header.key];
        return escapeCSVValue(formatCSVValue(value));
      })
      .join(",");
  });

  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes CSV values to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Formats a value for CSV export
 */
function formatCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => formatCSVValue(item)).join("; ");
  }

  // Handle objects
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}
