import { useState } from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
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

// Comprehensive list of IANA timezones grouped by region
const timezones = [
  // Americas
  {
    value: "America/New_York",
    label: "Eastern Time (US & Canada)",
    group: "Americas",
  },
  {
    value: "America/Chicago",
    label: "Central Time (US & Canada)",
    group: "Americas",
  },
  {
    value: "America/Denver",
    label: "Mountain Time (US & Canada)",
    group: "Americas",
  },
  {
    value: "America/Los_Angeles",
    label: "Pacific Time (US & Canada)",
    group: "Americas",
  },
  { value: "America/Phoenix", label: "Arizona", group: "Americas" },
  { value: "America/Anchorage", label: "Alaska", group: "Americas" },
  { value: "America/Honolulu", label: "Hawaii", group: "Americas" },
  { value: "America/Toronto", label: "Toronto", group: "Americas" },
  { value: "America/Vancouver", label: "Vancouver", group: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City", group: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo", group: "Americas" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", group: "Americas" },
  { value: "America/Lima", label: "Lima", group: "Americas" },
  { value: "America/Bogota", label: "Bogotá", group: "Americas" },
  { value: "America/Santiago", label: "Santiago", group: "Americas" },

  // Europe
  { value: "Europe/London", label: "London", group: "Europe" },
  { value: "Europe/Paris", label: "Paris", group: "Europe" },
  { value: "Europe/Berlin", label: "Berlin", group: "Europe" },
  { value: "Europe/Rome", label: "Rome", group: "Europe" },
  { value: "Europe/Madrid", label: "Madrid", group: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam", group: "Europe" },
  { value: "Europe/Brussels", label: "Brussels", group: "Europe" },
  { value: "Europe/Vienna", label: "Vienna", group: "Europe" },
  { value: "Europe/Zurich", label: "Zurich", group: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm", group: "Europe" },
  { value: "Europe/Oslo", label: "Oslo", group: "Europe" },
  { value: "Europe/Copenhagen", label: "Copenhagen", group: "Europe" },
  { value: "Europe/Helsinki", label: "Helsinki", group: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw", group: "Europe" },
  { value: "Europe/Prague", label: "Prague", group: "Europe" },
  { value: "Europe/Budapest", label: "Budapest", group: "Europe" },
  { value: "Europe/Athens", label: "Athens", group: "Europe" },
  { value: "Europe/Istanbul", label: "Istanbul", group: "Europe" },
  { value: "Europe/Moscow", label: "Moscow", group: "Europe" },
  { value: "Europe/Dublin", label: "Dublin", group: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbon", group: "Europe" },

  // Asia
  { value: "Asia/Dubai", label: "Dubai", group: "Asia" },
  { value: "Asia/Karachi", label: "Karachi", group: "Asia" },
  { value: "Asia/Kolkata", label: "Mumbai, New Delhi", group: "Asia" },
  { value: "Asia/Dhaka", label: "Dhaka", group: "Asia" },
  { value: "Asia/Bangkok", label: "Bangkok", group: "Asia" },
  { value: "Asia/Singapore", label: "Singapore", group: "Asia" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", group: "Asia" },
  { value: "Asia/Jakarta", label: "Jakarta", group: "Asia" },
  { value: "Asia/Manila", label: "Manila", group: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", group: "Asia" },
  { value: "Asia/Shanghai", label: "Beijing, Shanghai", group: "Asia" },
  { value: "Asia/Taipei", label: "Taipei", group: "Asia" },
  { value: "Asia/Seoul", label: "Seoul", group: "Asia" },
  { value: "Asia/Tokyo", label: "Tokyo", group: "Asia" },
  { value: "Asia/Sydney", label: "Sydney", group: "Asia" },
  { value: "Asia/Melbourne", label: "Melbourne", group: "Asia" },
  { value: "Asia/Auckland", label: "Auckland", group: "Asia" },

  // Africa
  { value: "Africa/Cairo", label: "Cairo", group: "Africa" },
  { value: "Africa/Johannesburg", label: "Johannesburg", group: "Africa" },
  { value: "Africa/Lagos", label: "Lagos", group: "Africa" },
  { value: "Africa/Nairobi", label: "Nairobi", group: "Africa" },
  { value: "Africa/Casablanca", label: "Casablanca", group: "Africa" },

  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", group: "UTC" },
];

interface TimezoneSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimezoneSelector({
  value,
  onValueChange,
  disabled,
  className,
}: TimezoneSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedTimezone = timezones.find((tz) => tz.value === value);

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
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className={cn(!selectedTimezone && "text-muted-foreground")}>
              {selectedTimezone ? selectedTimezone.label : "Select timezone..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            {["UTC", "Americas", "Europe", "Asia", "Africa"].map((group) => (
              <CommandGroup key={group} heading={group}>
                {timezones
                  .filter((tz) => tz.group === group)
                  .map((tz) => (
                    <CommandItem
                      key={tz.value}
                      value={tz.value}
                      onSelect={() => {
                        onValueChange(tz.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === tz.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {tz.label}
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
