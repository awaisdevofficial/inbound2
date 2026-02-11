import { useState, useEffect } from "react";
import { Loader2, MessageSquare, User, Sparkles, PhoneIncoming, Phone, Upload, Plus, X, BookOpen, Clock, FileText, Zap } from "lucide-react";
import { VoiceSelector } from "@/components/voices/VoiceSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { TimezoneSelector } from "@/components/TimezoneSelector";
import { useBots } from "@/hooks/useBots";
import { useAuth } from "@/hooks/useAuth";
import { useAIPrompts } from "@/hooks/useAIPrompts";
import { supabase } from "@/integrations/supabase/client";
import type { Bot, BotConfig } from "@/types/database";

interface BotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bot?: Bot | null;
  onSubmit: (data: {
    name: string;
    voice_id?: string | null;
    model?: string | null;
    general_prompt?: string | null;
    begin_message?: string | string[] | null; // Support both string and array
    max_call_duration_ms?: number | null;
    Speaking_plan?: string | null;
    retell_llm_id?: string | null;
    is_inbound?: boolean | null;
    transfer_call_to?: string | null;
    incoming_number?: string | null;
    knowledge_base_id?: string | null;
    unavailability_settings?: {
      enabled: boolean;
      timezone: string;
      unavailable_start_time: string;
      unavailable_end_time: string;
      unavailable_days: string[];
    } | null;
    unavailability_prompt?: string | null;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface BotFormData {
  voice_id: string;
  model: string;
  general_prompt: string;
  begin_message: string | string[]; // Support both string (backward compat) and array
  max_call_duration_ms: number;
  Speaking_plan: string;
  is_inbound: boolean;
  transfer_call_to: string;
  incoming_number: string;
  retell_llm_id: string;
  knowledge_base_id: string;
}

// Voice interface matching database schema
interface Voice {
  id: number;
  voice_id: string;
  voice_type: string | null;
  standard_voice_type: string | null;
  voice_name: string | null;
  provider: string | null;
  accent: string | null;
  gender: string | null;
  age: string | null;
  avatar_url: string | null;
  preview_audio_url: string | null;
  s2s_model: string | null;
}

interface KnowledgeBase {
  id: string;
  knowledge_base_id: string;
  knowledge_base_name: string;
  status: string;
}

const defaultFormData: BotFormData = {
  voice_id: "",
  model: "gpt-4.1",
  general_prompt: "",
  begin_message: "Hello! How can I assist you today?", // Single message for inbound
  max_call_duration_ms: 3600000,
  Speaking_plan: "",
  is_inbound: true, // Always inbound
  transfer_call_to: "",
  incoming_number: "",
  retell_llm_id: "",
  knowledge_base_id: "",
};

export function BotFormDialog({
  open,
  onOpenChange,
  bot,
  onSubmit,
  isSubmitting,
}: BotFormDialogProps) {
  const [name, setName] = useState("");
  const [formData, setFormData] = useState<BotFormData>(defaultFormData);
  const [loadingBot, setLoadingBot] = useState(false);
  const [currentBot, setCurrentBot] = useState<Bot | null>(null);
  const [dbImportedNumbers, setDbImportedNumbers] = useState<string[]>([]);
  const [loadingImportedNumbers, setLoadingImportedNumbers] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  
  // Availability/Timing settings (unavailable hours)
  const [enableAvailability, setEnableAvailability] = useState(false);
  const [availabilityTimezone, setAvailabilityTimezone] = useState("America/New_York");
  const [unavailableStartTime, setUnavailableStartTime] = useState("20:00"); // 8PM
  const [unavailableEndTime, setUnavailableEndTime] = useState("08:00"); // 8AM
  const [unavailableDays, setUnavailableDays] = useState<string[]>([]);
  
  const { fetchBot } = useBots();
  const { user } = useAuth();
  const { getUserPrompts } = useAIPrompts();
  const isEdit = !!bot;
  
  // Quick prompt selection
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const userPrompts = getUserPrompts();
  
  // Close prompt selector when clicking outside
  useEffect(() => {
    if (showPromptSelector) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.prompt-selector-container')) {
          setShowPromptSelector(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPromptSelector]);

  // Fetch imported phone numbers from database
  useEffect(() => {
    const fetchImportedNumbers = async () => {
      if (!user || !open || !formData.is_inbound) {
        setDbImportedNumbers([]);
        return;
      }

      setLoadingImportedNumbers(true);
      try {
        // Note: imported_phone_numbers table is not in generated types, using type assertion
        const { data, error } = await supabase
          .from("imported_phone_numbers" as any)
          .select("phone_number")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const phoneNumbers = (data || []).map((item: any) => item.phone_number);
        setDbImportedNumbers(phoneNumbers);
      } catch (error: any) {
        // Removed console.error for security
        // Don't show error toast, just log it
        setDbImportedNumbers([]);
      } finally {
        setLoadingImportedNumbers(false);
      }
    };

    fetchImportedNumbers();
  }, [user, open, formData.is_inbound]);

  // Fetch knowledge bases from database
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      if (!user || !open) {
        setKnowledgeBases([]);
        return;
      }

      setLoadingKnowledgeBases(true);
      try {
        // Note: knowledge_bases table is not in generated types, using type assertion
        const { data, error } = await supabase
          .from("knowledge_bases" as any)
          .select("id, knowledge_base_id, knowledge_base_name, status")
          .eq("user_id", user.id)
          .eq("status", "complete") // Only show completed knowledge bases
          .order("created_at", { ascending: false });

        if (error) throw error;

        setKnowledgeBases((data || []) as KnowledgeBase[]);
      } catch (error: any) {
        // Removed console.error for security
        // Don't show error toast, just log it
        setKnowledgeBases([]);
      } finally {
        setLoadingKnowledgeBases(false);
      }
    };

    fetchKnowledgeBases();
  }, [user, open]);

  // Fetch voices from database
  useEffect(() => {
    const fetchVoices = async () => {
      if (!open) {
        setVoices([]);
        return;
      }

      setLoadingVoices(true);
      try {
        const { data, error } = await supabase
          .from("voices" as any)
          .select("*")
          .order("voice_name", { ascending: true });

        if (error) throw error;

        const voicesData = (data || []) as unknown as Voice[];
        setVoices(voicesData);
        
        // Set default voice_id if not set and voices are available (only in create mode)
        if (voicesData.length > 0 && !isEdit && !formData.voice_id) {
          setFormData(prev => ({ ...prev, voice_id: voicesData[0].voice_id }));
        }
      } catch (error: any) {
        // Removed console.error for security
        setVoices([]);
      } finally {
        setLoadingVoices(false);
      }
    };

    fetchVoices();
  }, [open, isEdit]);


  // Fetch fresh bot data when dialog opens in edit mode
  useEffect(() => {
    if (open && bot?.id) {
      setLoadingBot(true);
      const botId = bot.id;
      fetchBot(botId)
        .then((freshBot) => {
          if (freshBot) {
            setCurrentBot(freshBot);
            setName(freshBot.name);
            // Load data from schema fields
            // Convert begin_message to array if it's a string (backward compatibility)
            const beginMessage = freshBot.begin_message
              ? Array.isArray(freshBot.begin_message)
                ? freshBot.begin_message
                : typeof freshBot.begin_message === 'string'
                  ? [freshBot.begin_message]
                  : defaultFormData.begin_message
              : defaultFormData.begin_message;
            
            const generalPrompt = freshBot.general_prompt || defaultFormData.general_prompt;
            
            // Try to load from bot_config first, then fall back to parsing prompt
            const botConfig = freshBot.bot_config as any;
            let availabilitySettings;
            if (botConfig?.unavailability_settings) {
              availabilitySettings = {
                enabled: botConfig.unavailability_settings.enabled || false,
                timezone: botConfig.unavailability_settings.timezone || "America/New_York",
                startTime: botConfig.unavailability_settings.unavailable_start_time || "20:00",
                endTime: botConfig.unavailability_settings.unavailable_end_time || "08:00",
                unavailableDays: botConfig.unavailability_settings.unavailable_days || [],
              };
            } else {
              availabilitySettings = parseAvailabilityFromPrompt(generalPrompt);
            }
            
            setEnableAvailability(availabilitySettings.enabled);
            setAvailabilityTimezone(availabilitySettings.timezone);
            setUnavailableStartTime(availabilitySettings.startTime);
            setUnavailableEndTime(availabilitySettings.endTime);
            setUnavailableDays(availabilitySettings.unavailableDays || []);
            
            // Remove availability instructions from prompt for editing (base prompt only)
            const basePrompt = hasAvailabilityInstructions(generalPrompt) 
              ? removeAvailabilityInstructions(generalPrompt)
              : generalPrompt;
            
            setFormData({
              voice_id: freshBot.voice_id || defaultFormData.voice_id,
              model: freshBot.model || defaultFormData.model,
              general_prompt: basePrompt,
              begin_message: beginMessage,
              max_call_duration_ms:
                freshBot.max_call_duration_ms ||
                defaultFormData.max_call_duration_ms,
              Speaking_plan:
                freshBot.Speaking_plan || defaultFormData.Speaking_plan,
              is_inbound: freshBot.is_inbound ?? defaultFormData.is_inbound,
              transfer_call_to:
                freshBot.transfer_call_to || defaultFormData.transfer_call_to,
              incoming_number: defaultFormData.incoming_number,
              retell_llm_id: freshBot.retell_llm_id || defaultFormData.retell_llm_id,
              knowledge_base_id: (freshBot.bot_config as any)?.knowledge_base_id || defaultFormData.knowledge_base_id,
            });
          } else if (bot) {
            // Fallback to passed bot if fetch returns null
            setCurrentBot(bot);
            setName(bot.name);
            // Convert begin_message to array if it's a string (backward compatibility)
            const beginMessage = bot.begin_message
              ? Array.isArray(bot.begin_message)
                ? bot.begin_message
                : typeof bot.begin_message === 'string'
                  ? [bot.begin_message]
                  : defaultFormData.begin_message
              : defaultFormData.begin_message;
            
            const generalPrompt = bot.general_prompt || defaultFormData.general_prompt;
            const availabilitySettings = parseAvailabilityFromPrompt(generalPrompt);
            
            setEnableAvailability(availabilitySettings.enabled);
            setAvailabilityTimezone(availabilitySettings.timezone);
            setUnavailableStartTime(availabilitySettings.startTime);
            setUnavailableEndTime(availabilitySettings.endTime);
            setUnavailableDays(availabilitySettings.unavailableDays || []);
            
            // Remove availability instructions from prompt for editing (base prompt only)
            const basePrompt = hasAvailabilityInstructions(generalPrompt) 
              ? removeAvailabilityInstructions(generalPrompt)
              : generalPrompt;
            
            setFormData({
              voice_id: bot.voice_id || defaultFormData.voice_id,
              model: bot.model || defaultFormData.model,
              general_prompt: basePrompt,
              begin_message: beginMessage,
              max_call_duration_ms:
                bot.max_call_duration_ms ||
                defaultFormData.max_call_duration_ms,
              Speaking_plan: bot.Speaking_plan || defaultFormData.Speaking_plan,
              is_inbound: bot.is_inbound ?? defaultFormData.is_inbound,
              transfer_call_to:
                bot.transfer_call_to || defaultFormData.transfer_call_to,
              incoming_number: defaultFormData.incoming_number,
              retell_llm_id: bot.retell_llm_id || defaultFormData.retell_llm_id,
              knowledge_base_id: (bot.bot_config as any)?.knowledge_base_id || defaultFormData.knowledge_base_id,
            });
          }
        })
        .catch(() => {
          // Fallback to passed bot if fetch fails
          if (bot) {
            setCurrentBot(bot);
            setName(bot.name);
            // Convert begin_message to array if it's a string (backward compatibility)
            const beginMessage = bot.begin_message
              ? Array.isArray(bot.begin_message)
                ? bot.begin_message
                : typeof bot.begin_message === 'string'
                  ? [bot.begin_message]
                  : defaultFormData.begin_message
              : defaultFormData.begin_message;
            
            const generalPrompt = bot.general_prompt || defaultFormData.general_prompt;
            const availabilitySettings = parseAvailabilityFromPrompt(generalPrompt);
            
            setEnableAvailability(availabilitySettings.enabled);
            setAvailabilityTimezone(availabilitySettings.timezone);
            setUnavailableStartTime(availabilitySettings.startTime);
            setUnavailableEndTime(availabilitySettings.endTime);
            setUnavailableDays(availabilitySettings.unavailableDays || []);
            
            // Remove availability instructions from prompt for editing (base prompt only)
            const basePrompt = hasAvailabilityInstructions(generalPrompt) 
              ? removeAvailabilityInstructions(generalPrompt)
              : generalPrompt;
            
            setFormData({
              voice_id: bot.voice_id || defaultFormData.voice_id,
              model: bot.model || defaultFormData.model,
              general_prompt: basePrompt,
              begin_message: beginMessage,
              max_call_duration_ms:
                bot.max_call_duration_ms ||
                defaultFormData.max_call_duration_ms,
              Speaking_plan: bot.Speaking_plan || defaultFormData.Speaking_plan,
              is_inbound: bot.is_inbound ?? defaultFormData.is_inbound,
              transfer_call_to:
                bot.transfer_call_to || defaultFormData.transfer_call_to,
              incoming_number: defaultFormData.incoming_number,
              retell_llm_id: bot.retell_llm_id || defaultFormData.retell_llm_id,
              knowledge_base_id: (bot.bot_config as any)?.knowledge_base_id || defaultFormData.knowledge_base_id,
            });
          }
        })
        .finally(() => {
          setLoadingBot(false);
        });
    } else if (open && !bot) {
      // Create mode - only reset form if it was previously in edit mode
      // This preserves user input when dialog is closed and reopened
      if (currentBot !== null) {
        setCurrentBot(null);
        setName("");
        setFormData(defaultFormData);
    setEnableAvailability(false);
    setAvailabilityTimezone("America/New_York");
    setUnavailableStartTime("20:00");
    setUnavailableEndTime("08:00");
    setUnavailableDays([]);
      }
      setLoadingBot(false);
    }
    // Don't reset state when dialog closes - preserve user input
  }, [open, bot, fetchBot]);

  const handleSubmit = async () => {
    // For inbound bots, send first message as string
    const beginMessage = Array.isArray(formData.begin_message) 
      ? formData.begin_message[0] || "" 
      : formData.begin_message || "";
    
    // Prepare general prompt - remove any existing availability instructions
    let finalPrompt = formData.general_prompt;
    if (hasAvailabilityInstructions(finalPrompt)) {
      finalPrompt = removeAvailabilityInstructions(finalPrompt);
    }
    
    // Generate unavailability prompt separately if enabled
    const unavailabilityPrompt = enableAvailability 
      ? getAvailabilityInstructions().trim() // Remove leading/trailing whitespace
      : null;
    
    await onSubmit({
      name,
      voice_id: formData.voice_id,
      model: formData.model,
      general_prompt: finalPrompt,
      begin_message: beginMessage,
      max_call_duration_ms: formData.max_call_duration_ms,
      Speaking_plan: formData.Speaking_plan,
      is_inbound: true, // Always inbound
      transfer_call_to: formData.transfer_call_to,
      incoming_number: formData.incoming_number,
      retell_llm_id: formData.retell_llm_id || null,
      knowledge_base_id: formData.knowledge_base_id || null,
      unavailability_settings: enableAvailability ? {
        enabled: true,
        timezone: availabilityTimezone,
        unavailable_start_time: unavailableStartTime,
        unavailable_end_time: unavailableEndTime,
        unavailable_days: unavailableDays,
      } : null, // Explicitly send null when not enabled
      unavailability_prompt: unavailabilityPrompt, // Separate prompt field
    });
    
    // Reset form after successful submission
    setCurrentBot(null);
    setName("");
    setFormData(defaultFormData);
    setEnableAvailability(false);
    setAvailabilityTimezone("America/New_York");
    setUnavailableStartTime("20:00");
    setUnavailableEndTime("08:00");
    setUnavailableDays([]);
  };

  const updateFormData = <K extends keyof BotFormData>(
    key: K,
    value: BotFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Helper function to convert timezone to placeholder format
  const formatTimezonePlaceholder = (timezone: string) => {
    // Convert "America/New_York" to "America/New_York" format (already correct)
    return timezone.replace(/\//g, "/");
  };

  // Helper function to generate availability instructions
  const getAvailabilityInstructions = () => {
    const timezonePlaceholder = formatTimezonePlaceholder(availabilityTimezone);
    const unavailableStart = unavailableStartTime;
    const unavailableEnd = unavailableEndTime;
    
    // Format times for display (convert 24h to 12h)
    const formatTimeForDisplay = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const unavailableStartDisplay = formatTimeForDisplay(unavailableStart);
    const unavailableEndDisplay = formatTimeForDisplay(unavailableEnd);

    // User sets unavailable hours directly (e.g., 8PM to 8AM)
    const unavailableMessage = `If the current time is between ${unavailableStartDisplay} and ${unavailableEndDisplay} in ${timezonePlaceholder} timezone, you are UNAVAILABLE.`;

    // Unavailable days message
    let unavailableDaysMessage = "";
    if (unavailableDays.length > 0) {
      // Logic for "If today is X, you are unavailable"
      // We list the days
      unavailableDaysMessage = `- If the current day is ${unavailableDays.join(" or ")} (in ${timezonePlaceholder} timezone), you are UNAVAILABLE.`;
    }

    // Calculate available hours for the message (opposite of unavailable)
    const unavailableStartHour = parseInt(unavailableStart.split(':')[0]);
    const unavailableEndHour = parseInt(unavailableEnd.split(':')[0]);
    
    // ... logic for available message ...
    // Note: The available message logic in the original code was just a string variable assignment that wasn't really used in the final prompt effectively other than implicitly by "During available hours...".
    // I will keep the prompt structure simple.

    return `## AGENT AVAILABILITY CHECK

IMPORTANT: Before responding to the caller, you MUST check the current time in ${timezonePlaceholder} timezone.

The current time is {{current_time_${timezonePlaceholder}}}.

AVAILABILITY RULES:
${unavailableDaysMessage}
- ${unavailableMessage}
- During unavailable hours (${unavailableStartDisplay} to ${unavailableEndDisplay}) or unavailable days, you MUST immediately tell the caller: "I'm sorry, but we are currently unavailable. We are not available between ${unavailableStartDisplay} and ${unavailableEndDisplay} ${timezonePlaceholder} time${unavailableDays.length > 0 ? " or on " + unavailableDays.join(", ") : ""}. Please call back outside of these hours. Thank you for your call."
- After delivering the unavailable message, politely end the call.
- During available hours (outside of ${unavailableStartDisplay} to ${unavailableEndDisplay} ${timezonePlaceholder} time${unavailableDays.length > 0 ? " and not on " + unavailableDays.join(", ") : ""}), proceed normally with the conversation.

Always check the time FIRST before engaging in any conversation with the caller.`;
  };

  // Helper function to check if prompt contains availability instructions
  const hasAvailabilityInstructions = (prompt: string) => {
    return prompt.includes("AGENT AVAILABILITY CHECK") || 
           prompt.includes("current_time_");
  };

  // Helper function to remove availability instructions from prompt
  const removeAvailabilityInstructions = (prompt: string) => {
    const instructionsStart = prompt.indexOf("## AGENT AVAILABILITY CHECK");
    if (instructionsStart === -1) return prompt;
    return prompt.substring(0, instructionsStart).trim();
  };

  // Helper function to parse availability settings from prompt
  const parseAvailabilityFromPrompt = (prompt: string) => {
    if (!hasAvailabilityInstructions(prompt)) {
      return { enabled: false, timezone: "America/New_York", startTime: "20:00", endTime: "08:00", unavailableDays: [] };
    }

    // Try to extract timezone from placeholder
    const timezoneMatch = prompt.match(/current_time_([A-Za-z0-9_/]+)/);
    const timezone = timezoneMatch ? timezoneMatch[1] : "America/New_York";

    // Try to extract unavailable days
    // Pattern: "If the current day is Monday or Sunday (in ..."
    // or "If the current day is Monday, Tuesday or Sunday (in ..."
    let unavailableDays: string[] = [];
    const daysMatch = prompt.match(/If the current day is ([^()]+) \(in/);
    if (daysMatch) {
        const daysText = daysMatch[1];
        // Split by comma or " or "
        unavailableDays = daysText.split(/,| or /)
            .map(d => d.trim())
            .filter(d => DAYS_OF_WEEK.includes(d));
    }

    // Try to extract unavailable times from the prompt (format: "between X:XX AM/PM and Y:YY AM/PM")
    // Look for pattern like "between 8:00 PM and 8:00 AM"
    const timeMatch = prompt.match(/between (\d{1,2}):(\d{2})\s*(AM|PM) and (\d{1,2}):(\d{2})\s*(AM|PM)/i);
    
    if (timeMatch) {
      // Convert 12-hour to 24-hour format
      const convertTo24Hour = (hour: number, ampm: string) => {
        if (ampm.toUpperCase() === 'PM' && hour !== 12) {
          return hour + 12;
        } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
          return 0;
        }
        return hour;
      };
      
      const startHour = convertTo24Hour(parseInt(timeMatch[1]), timeMatch[3]);
      const startMin = timeMatch[2];
      const endHour = convertTo24Hour(parseInt(timeMatch[4]), timeMatch[6]);
      const endMin = timeMatch[5];
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin}`;
      
      return { enabled: true, timezone, startTime, endTime, unavailableDays };
    }

    // Fallback: try to extract from "unavailable hours" section
    const unavailableMatch = prompt.match(/unavailable hours \(([^)]+)\)/);
    if (unavailableMatch) {
      // Default to 8PM to 8AM if we can't parse
      return { enabled: true, timezone, startTime: "20:00", endTime: "08:00", unavailableDays };
    }

    // Default fallback
    return { enabled: true, timezone, startTime: "20:00", endTime: "08:00", unavailableDays };
  };

  const isLoading = loadingBot;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/20 border-border/50 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/10 shadow-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                {isEdit ? "Edit Voice Agent" : "Create Voice Agent"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Configure your AI voice agent
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 mt-4 min-h-0 overflow-y-auto overflow-x-hidden pr-4">
          {loadingBot ? (
            <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-border/50 rounded-xl shadow-sm">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading bot data...
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-border/50 rounded-xl shadow-sm">
              <div className="space-y-5">
                {/* Agent Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-primary" />
                    Agent Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sales Assistant, Support Bot"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary transition-all"
                  />
                </div>

                {/* Incoming Number Selection - Show in both create and edit */}
                <div className="space-y-2">
                    <Label
                      htmlFor="incoming_number"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <PhoneIncoming className="h-4 w-4 text-primary" />
                      Assign Number to Agent {!isEdit && <span className="text-destructive">*</span>}
                    </Label>
                    <div className="space-y-2">
                      <Select
                        value={formData.incoming_number || ""}
                        onValueChange={(value) => {
                          updateFormData("incoming_number", value);
                        }}
                      >
                        <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                          <SelectValue placeholder="Select incoming number" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Imported Numbers from Database */}
                          {dbImportedNumbers.map((phoneNumber) => (
                            <SelectItem key={phoneNumber} value={phoneNumber}>
                              <span className="font-medium">{phoneNumber}</span>
                            </SelectItem>
                          ))}
                          
                          {/* No numbers message */}
                          {dbImportedNumbers.length === 0 && 
                           !loadingImportedNumbers && (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                              No incoming numbers available
                            </div>
                          )}
                          
                          {/* Loading state */}
                          {loadingImportedNumbers && (
                            <div className="px-2 py-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading imported numbers...
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select the phone number that will receive incoming calls for this agent
                    </p>
                  </div>

                {/* Transfer Call To - Show in both create and edit */}
                <div className="space-y-2">
                    <Label
                      htmlFor="transfer_call_to"
                      className="text-sm font-semibold flex items-center gap-2"
                    >
                      <PhoneIncoming className="h-4 w-4 text-primary" />
                      Transfer Call To <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="transfer_call_to"
                      placeholder="e.g., +1234567890"
                      value={formData.transfer_call_to}
                      onChange={(e) =>
                        updateFormData("transfer_call_to", e.target.value)
                      }
                      className="bg-background/50 border-border/50 focus:border-primary transition-all"
                    />
                    <p className="text-xs text-muted-foreground">
                      Phone number to transfer inbound calls to (required)
                    </p>
                  </div>

                {/* Begin Message - Single for inbound */}
                <div className="space-y-2">
                  <Label
                    htmlFor="begin_message"
                    className="text-sm font-semibold"
                  >
                    Begin Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="begin_message"
                    placeholder="Hello! How can I assist you today?"
                    value={Array.isArray(formData.begin_message) 
                      ? formData.begin_message[0] || "" 
                      : formData.begin_message || ""}
                    onChange={(e) => {
                      updateFormData("begin_message", e.target.value);
                    }}
                    rows={2}
                    className="bg-background/50 border-border/50 focus:border-primary resize-none"
                  />
                </div>

                {/* General Prompt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="general_prompt"
                      className="text-sm font-semibold"
                    >
                      General Prompt <span className="text-destructive">*</span>
                    </Label>
                    {userPrompts.length > 0 && (
                      <div className="relative prompt-selector-container">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPromptSelector(!showPromptSelector)}
                          className="h-7 text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Quick Select Prompt
                        </Button>
                        {showPromptSelector && (
                          <div className="absolute right-0 top-9 z-50 w-72 bg-popover border border-border rounded-md shadow-lg p-2 max-h-80 overflow-y-auto">
                            <div className="space-y-1">
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1 flex items-center justify-between">
                                <span>Select a saved prompt:</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowPromptSelector(false)}
                                  className="h-5 w-5 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              {userPrompts.length === 0 ? (
                                <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                                  No saved prompts. <br />
                                  <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                      window.open("/ai-prompt", "_blank");
                                      setShowPromptSelector(false);
                                    }}
                                    className="h-auto p-0 text-xs mt-1"
                                  >
                                    Generate one now
                                  </Button>
                                </div>
                              ) : (
                                userPrompts.map((prompt) => (
                                  <button
                                    key={prompt.id}
                                    type="button"
                                    onClick={() => {
                                      updateFormData("general_prompt", prompt.system_prompt || "");
                                      if (prompt.begin_message) {
                                        updateFormData("begin_message", prompt.begin_message);
                                      }
                                      setShowPromptSelector(false);
                                    }}
                                    className="w-full text-left px-2 py-2 text-xs rounded hover:bg-accent transition-colors flex items-start gap-2 border border-transparent hover:border-border"
                                  >
                                    <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate text-foreground">{prompt.name}</div>
                                      <div className="text-muted-foreground truncate text-[10px] mt-0.5">
                                        {prompt.system_prompt?.substring(0, 60)}...
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                          {prompt.category}
                                        </span>
                                        {prompt.is_active && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">
                                            Active
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="general_prompt"
                    placeholder="You are a helpful customer service agent for [Company Name]. Your role is to assist customers with their inquiries..."
                    value={formData.general_prompt}
                    onChange={(e) =>
                      updateFormData("general_prompt", e.target.value)
                    }
                    rows={6}
                    className="bg-background/50 border-border/50 focus:border-primary resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Define the agent's personality, role, and detailed
                      instructions
                    </p>
                    {userPrompts.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open("/ai-prompt", "_blank")}
                        className="h-6 text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate New Prompt
                      </Button>
                    )}
                  </div>
                </div>

                {/* Agent Timing / Availability Settings */}
                <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable_availability"
                      checked={enableAvailability}
                      onCheckedChange={(checked) => setEnableAvailability(checked as boolean)}
                    />
                    <Label
                      htmlFor="enable_availability"
                      className="text-sm font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-primary" />
                      Enable Agent Timing / Availability Check
                    </Label>
                  </div>
                  
                  {enableAvailability && (
                    <div className="space-y-3 mt-3 pl-6 border-l-2 border-primary/20">
                      <p className="text-xs text-muted-foreground">
                        Configure when you are NOT available. During these unavailable hours, 
                        the agent will inform callers that you are unavailable and ask them to call back.
                      </p>
                      
                      {/* Timezone Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Timezone <span className="text-destructive">*</span>
                        </Label>
                        <TimezoneSelector
                          value={availabilityTimezone}
                          onValueChange={setAvailabilityTimezone}
                        />
                        <p className="text-xs text-muted-foreground">
                          Select the timezone for availability checking
                        </p>
                      </div>

                      {/* Unavailable Days */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Unavailable Days (All Day)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <div
                              key={day}
                              onClick={() => {
                                setUnavailableDays((prev) =>
                                  prev.includes(day)
                                    ? prev.filter((d) => d !== day)
                                    : [...prev, day]
                                );
                              }}
                              className={`
                                cursor-pointer px-3 py-1.5 rounded-md text-xs font-medium border transition-all select-none
                                ${
                                  unavailableDays.includes(day)
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:border-primary/50"
                                }
                              `}
                            >
                              {day.slice(0, 3)}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setUnavailableDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])}
                          >
                            Select Weekdays
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setUnavailableDays(["Saturday", "Sunday"])}
                          >
                            Select Weekends
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setUnavailableDays([])}
                          >
                            Clear
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Select days when the agent is unavailable all day
                        </p>
                      </div>

                      {/* Time Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="unavailable_start" className="text-sm font-medium">
                            Unavailable From (Start Time) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="unavailable_start"
                            type="time"
                            value={unavailableStartTime}
                            onChange={(e) => setUnavailableStartTime(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground">
                            Start of unavailable hours (e.g., 8:00 PM)
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="unavailable_end" className="text-sm font-medium">
                            Unavailable Until (End Time) <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="unavailable_end"
                            type="time"
                            value={unavailableEndTime}
                            onChange={(e) => setUnavailableEndTime(e.target.value)}
                            className="bg-background/50 border-border/50 focus:border-primary"
                          />
                          <p className="text-xs text-muted-foreground">
                            End of unavailable hours (e.g., 8:00 AM)
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-md bg-blue-50/50 border border-blue-200/50">
                        <p className="text-xs text-blue-900/80">
                          <strong>Note:</strong> The agent will check the current time using <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">{"{{current_time_" + formatTimezonePlaceholder(availabilityTimezone) + "}}"}</code> placeholder. 
                          If the time is between {unavailableStartTime} and {unavailableEndTime} in {availabilityTimezone} timezone, 
                          the agent will inform callers that you are unavailable.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Knowledge Base Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Knowledge Base
                  </Label>
                  <Select
                    value={formData.knowledge_base_id ? formData.knowledge_base_id : "none"}
                    onValueChange={(v) => updateFormData("knowledge_base_id", v === "none" ? "" : v)}
                    disabled={loadingKnowledgeBases}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary">
                      <SelectValue placeholder={loadingKnowledgeBases ? "Loading..." : "Select a knowledge base (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (No knowledge base)</SelectItem>
                      {knowledgeBases.length === 0 && !loadingKnowledgeBases ? (
                        <SelectItem value="no-kb" disabled>
                          No knowledge bases available
                        </SelectItem>
                      ) : (
                        knowledgeBases.map((kb) => (
                          <SelectItem key={kb.id} value={kb.knowledge_base_id}>
                            {kb.knowledge_base_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a knowledge base to provide context to your agent (optional)
                  </p>
                </div>

                {/* Voice Selection */}
                <VoiceSelector
                  voices={voices}
                  loadingVoices={loadingVoices}
                  selectedVoiceId={formData.voice_id}
                  onSelect={(voiceId) => updateFormData("voice_id", voiceId)}
                />

              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border/50 gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-border/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isLoading ||
              !name.trim() ||
              !(Array.isArray(formData.begin_message) 
                  ? formData.begin_message[0]?.trim() 
                  : formData.begin_message?.trim()) ||
              !formData.general_prompt?.trim() ||
              !formData.voice_id ||
              !formData.transfer_call_to?.trim() ||
              (!isEdit && !formData.incoming_number)
            }
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 min-w-[160px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {isEdit ? "Save Changes" : "Create Agent"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
