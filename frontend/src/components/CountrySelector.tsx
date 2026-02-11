import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

// Comprehensive list of countries with ISO codes
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

interface CountrySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CountrySelector({
  value,
  onValueChange,
  disabled,
  className,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = countries.find((country) => country.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className={cn(!selectedCountry && "text-muted-foreground")}>
              {selectedCountry
                ? `${selectedCountry.label} (${selectedCountry.code})`
                : "Select country..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.value}
                  onSelect={() => {
                    onValueChange(country.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0",
                    )}
                  />
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
  );
}
