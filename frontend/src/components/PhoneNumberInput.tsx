import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

// Comprehensive list of countries with ISO codes (matching libphonenumber-js format)
const countries = [
  { value: "US", label: "United States", code: "+1" },
  { value: "CA", label: "Canada", code: "+1" },
  { value: "GB", label: "United Kingdom", code: "+44" },
  { value: "AU", label: "Australia", code: "+61" },
  { value: "DE", label: "Germany", code: "+49" },
  { value: "FR", label: "France", code: "+33" },
  { value: "IT", label: "Italy", code: "+39" },
  { value: "ES", label: "Spain", code: "+34" },
  { value: "NL", label: "Netherlands", code: "+31" },
  { value: "BE", label: "Belgium", code: "+32" },
  { value: "CH", label: "Switzerland", code: "+41" },
  { value: "AT", label: "Austria", code: "+43" },
  { value: "SE", label: "Sweden", code: "+46" },
  { value: "NO", label: "Norway", code: "+47" },
  { value: "DK", label: "Denmark", code: "+45" },
  { value: "FI", label: "Finland", code: "+358" },
  { value: "PL", label: "Poland", code: "+48" },
  { value: "CZ", label: "Czech Republic", code: "+420" },
  { value: "HU", label: "Hungary", code: "+36" },
  { value: "GR", label: "Greece", code: "+30" },
  { value: "PT", label: "Portugal", code: "+351" },
  { value: "IE", label: "Ireland", code: "+353" },
  { value: "MX", label: "Mexico", code: "+52" },
  { value: "BR", label: "Brazil", code: "+55" },
  { value: "AR", label: "Argentina", code: "+54" },
  { value: "CL", label: "Chile", code: "+56" },
  { value: "CO", label: "Colombia", code: "+57" },
  { value: "PE", label: "Peru", code: "+51" },
  { value: "AE", label: "United Arab Emirates", code: "+971" },
  { value: "SA", label: "Saudi Arabia", code: "+966" },
  { value: "IL", label: "Israel", code: "+972" },
  { value: "TR", label: "Turkey", code: "+90" },
  { value: "IN", label: "India", code: "+91" },
  { value: "PK", label: "Pakistan", code: "+92" },
  { value: "BD", label: "Bangladesh", code: "+880" },
  { value: "TH", label: "Thailand", code: "+66" },
  { value: "SG", label: "Singapore", code: "+65" },
  { value: "MY", label: "Malaysia", code: "+60" },
  { value: "ID", label: "Indonesia", code: "+62" },
  { value: "PH", label: "Philippines", code: "+63" },
  { value: "HK", label: "Hong Kong", code: "+852" },
  { value: "CN", label: "China", code: "+86" },
  { value: "TW", label: "Taiwan", code: "+886" },
  { value: "KR", label: "South Korea", code: "+82" },
  { value: "JP", label: "Japan", code: "+81" },
  { value: "NZ", label: "New Zealand", code: "+64" },
  { value: "ZA", label: "South Africa", code: "+27" },
  { value: "EG", label: "Egypt", code: "+20" },
  { value: "NG", label: "Nigeria", code: "+234" },
  { value: "KE", label: "Kenya", code: "+254" },
  { value: "RU", label: "Russia", code: "+7" },
];

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  countryCode: string;
  onCountryCodeChange: (countryCode: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
  height?: "sm" | "md" | "lg";
}

export function PhoneNumberInput({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  disabled = false,
  className,
  placeholder = "Enter phone number",
  error,
  height = "md",
}: PhoneNumberInputProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = countries.find((country) => country.value === countryCode) || countries[0];
  const countryCallingCode = selectedCountry.code;

  const heightClass = {
    sm: "h-10",
    md: "h-11",
    lg: "h-[48px]",
  }[height];

  // Validate phone number
  const validatePhone = (phone: string, country: string): boolean => {
    if (!phone.trim()) return false;
    try {
      const fullNumber = `${countryCallingCode}${phone}`;
      return isValidPhoneNumber(fullNumber, country as any);
    } catch {
      return false;
    }
  };

  const isValid = value ? validatePhone(value, countryCode) : true;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                `w-[80px] lg:w-[100px] ${heightClass} px-3 justify-between border-[1.5px] border-border rounded-[10px] bg-muted hover:bg-muted text-[14px]`,
                error && "border-destructive",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-[14px] font-medium text-foreground">
                {countryCallingCode}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.value}
                      value={`${country.label} ${country.code}`}
                      onSelect={() => {
                        onCountryCodeChange(country.value);
                        setOpen(false);
                      }}
                    >
                      <span className="flex-1">{country.label}</span>
                      <span className="text-muted-foreground ml-2">
                        {country.code}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          type="tel"
          value={value}
          onChange={(e) => {
            // Only allow digits, spaces, dashes, and parentheses
            const cleaned = e.target.value.replace(/[^\d\s\-()]/g, "");
            onChange(cleaned);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            `flex-1 ${heightClass} px-[18px] text-[15px] bg-white border-[1.5px] border-border rounded-[10px] focus:border-primary focus:ring-2 focus:ring-primary/20`,
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            !isValid && value && !error && "border-yellow-500 focus:border-yellow-500"
          )}
        />
      </div>
      {error && (
        <p className="text-[12px] text-destructive mt-1">{error}</p>
      )}
      {!isValid && value && !error && (
        <p className="text-[12px] text-yellow-600 mt-1">
          Please enter a valid phone number for {selectedCountry.label}
        </p>
      )}
    </div>
  );
}

// Country-specific expected digit ranges (digits after country code)
const countryDigitRanges: Record<string, { min: number; max: number }> = {
  US: { min: 10, max: 10 },
  CA: { min: 10, max: 10 },
  GB: { min: 10, max: 11 },
  AU: { min: 9, max: 9 },
  DE: { min: 10, max: 12 },
  FR: { min: 9, max: 9 },
  IT: { min: 9, max: 11 },
  ES: { min: 9, max: 9 },
  NL: { min: 9, max: 9 },
  BE: { min: 8, max: 9 },
  CH: { min: 9, max: 9 },
  AT: { min: 10, max: 13 },
  SE: { min: 7, max: 13 },
  NO: { min: 8, max: 8 },
  DK: { min: 8, max: 8 },
  FI: { min: 9, max: 11 },
  PL: { min: 9, max: 9 },
  CZ: { min: 9, max: 9 },
  HU: { min: 8, max: 9 },
  GR: { min: 10, max: 10 },
  PT: { min: 9, max: 9 },
  IE: { min: 9, max: 9 },
  MX: { min: 10, max: 10 },
  BR: { min: 10, max: 11 },
  AR: { min: 10, max: 10 },
  CL: { min: 9, max: 9 },
  CO: { min: 10, max: 10 },
  PE: { min: 9, max: 9 },
  AE: { min: 9, max: 9 },
  SA: { min: 9, max: 9 },
  IL: { min: 9, max: 10 },
  TR: { min: 10, max: 10 },
  IN: { min: 10, max: 10 },
  PK: { min: 10, max: 10 },
  BD: { min: 10, max: 10 },
  TH: { min: 9, max: 9 },
  SG: { min: 8, max: 8 },
  MY: { min: 9, max: 10 },
  ID: { min: 9, max: 12 },
  PH: { min: 10, max: 10 },
  HK: { min: 8, max: 8 },
  CN: { min: 11, max: 11 },
  TW: { min: 9, max: 10 },
  KR: { min: 10, max: 11 },
  JP: { min: 10, max: 11 },
  NZ: { min: 8, max: 10 },
  ZA: { min: 9, max: 9 },
  EG: { min: 10, max: 10 },
  NG: { min: 10, max: 10 },
  KE: { min: 9, max: 9 },
  RU: { min: 10, max: 10 },
};

// Helper function to validate phone number with country code
export function validatePhoneNumber(phone: string, countryCode: string): { isValid: boolean; error?: string } {
  if (!phone.trim()) {
    return { isValid: false, error: "Phone number is required" };
  }

  const selectedCountry = countries.find((country) => country.value === countryCode);
  if (!selectedCountry) {
    return { isValid: false, error: "Invalid country code" };
  }

  // Extract only digits from the phone number (strip spaces, dashes, parentheses)
  const digitsOnly = phone.replace(/\D/g, "");

  // Basic checks: must contain only valid characters
  if (!/^[\d\s\-()]+$/.test(phone.trim())) {
    return { isValid: false, error: "Phone number can only contain digits, spaces, dashes, and parentheses" };
  }

  // Check minimum digit count
  if (digitsOnly.length < 4) {
    return { isValid: false, error: "Phone number is too short. Please enter a valid number." };
  }

  // E.164 max is 15 digits total (including country code), so local part max ~13
  if (digitsOnly.length > 15) {
    return { isValid: false, error: "Phone number is too long. Numbers cannot exceed 15 digits." };
  }

  // Country-specific digit length validation
  const expectedRange = countryDigitRanges[countryCode];
  if (expectedRange) {
    if (digitsOnly.length < expectedRange.min) {
      return {
        isValid: false,
        error: expectedRange.min === expectedRange.max
          ? `Phone numbers for ${selectedCountry.label} must be ${expectedRange.min} digits. You entered ${digitsOnly.length} digits.`
          : `Phone numbers for ${selectedCountry.label} must be ${expectedRange.min}-${expectedRange.max} digits. You entered ${digitsOnly.length} digits.`,
      };
    }
    if (digitsOnly.length > expectedRange.max) {
      return {
        isValid: false,
        error: expectedRange.min === expectedRange.max
          ? `Phone numbers for ${selectedCountry.label} must be ${expectedRange.max} digits. You entered ${digitsOnly.length} digits.`
          : `Phone numbers for ${selectedCountry.label} must be ${expectedRange.min}-${expectedRange.max} digits. You entered ${digitsOnly.length} digits.`,
      };
    }
  }

  // Use libphonenumber-js for comprehensive validation
  try {
    const fullNumber = `${selectedCountry.code}${phone.replace(/\s/g, "")}`;
    const isValid = isValidPhoneNumber(fullNumber, countryCode as any);
    
    if (!isValid) {
      return { isValid: false, error: `The phone number is not valid for ${selectedCountry.label}. Please check the number and try again.` };
    }

    return { isValid: true };
  } catch (error) {
    // If the validation library fails/throws, allow signup to proceed (don't block)
    console.warn("Phone validation library error — allowing signup to proceed:", error);
    return { isValid: true };
  }
}

// Helper function to get formatted phone number
export function formatPhoneNumber(phone: string, countryCode: string): string {
  const selectedCountry = countries.find((country) => country.value === countryCode);
  if (!selectedCountry) return phone;
  
  try {
    const fullNumber = `${selectedCountry.code}${phone.replace(/\s/g, "")}`;
    const parsed = parsePhoneNumber(fullNumber);
    return parsed.formatInternational();
  } catch {
    return `${selectedCountry.code}${phone}`;
  }
}
