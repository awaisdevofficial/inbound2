// VoiceSelector.tsx
// Drop-in replacement for the Voice <Select> block in BotFormDialog.
// Key fix: voices are rendered in a plain scrollable list, NOT inside SelectItem,
// so play-button clicks never collide with item-selection events.

import { useRef, useState, useEffect } from "react";
import { Loader2, Play, Pause, AlertCircle, Mic } from "lucide-react";
import { Label } from "@/components/ui/label";

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

interface VoiceSelectorProps {
  voices: Voice[];
  loadingVoices: boolean;
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
}

export function VoiceSelector({
  voices,
  loadingVoices,
  selectedVoiceId,
  onSelect,
}: VoiceSelectorProps) {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [audioErrorId, setAudioErrorId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const handlePlayPreview = async (voice: Voice, e: React.MouseEvent) => {
    // Prevent the row-click (selection) from firing
    e.stopPropagation();
    e.preventDefault();

    if (!voice.preview_audio_url) {
      setAudioErrorId(voice.voice_id);
      setTimeout(() => setAudioErrorId(null), 2000);
      return;
    }

    const id = voice.voice_id;

    // Stop whatever is currently playing
    if (playingVoiceId && audioRefs.current[playingVoiceId]) {
      audioRefs.current[playingVoiceId].pause();
      audioRefs.current[playingVoiceId].currentTime = 0;
    }

    // Toggle off if same voice clicked again
    if (playingVoiceId === id) {
      if (audioRefs.current[id]) {
        audioRefs.current[id].pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    setAudioErrorId(null);
    setLoadingAudioId(id);

    try {
      if (!audioRefs.current[id]) {
        const audio = new Audio(voice.preview_audio_url);
        audio.preload = "auto";
        
        const handleEnded = () => {
          setPlayingVoiceId(null);
          setLoadingAudioId(null);
        };
        
        const handleCanPlay = () => {
          setLoadingAudioId(null);
        };
        
        const handleError = () => {
          setPlayingVoiceId(null);
          setLoadingAudioId(null);
          setAudioErrorId(id);
          setTimeout(() => setAudioErrorId(null), 3000);
        };
        
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("canplay", handleCanPlay);
        audio.addEventListener("canplaythrough", handleCanPlay);
        audio.addEventListener("error", handleError);
        
        // Store cleanup function
        (audio as any)._cleanup = () => {
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("canplay", handleCanPlay);
          audio.removeEventListener("canplaythrough", handleCanPlay);
          audio.removeEventListener("error", handleError);
        };
        
        audioRefs.current[id] = audio;
      }

      const el = audioRefs.current[id];
      el.currentTime = 0;
      await el.play();
      setPlayingVoiceId(id);
      setLoadingAudioId(null);
    } catch {
      setPlayingVoiceId(null);
      setLoadingAudioId(null);
      setAudioErrorId(id);
      setTimeout(() => setAudioErrorId(null), 3000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
        if ((audio as any)._cleanup) {
          (audio as any)._cleanup();
        }
      });
      setPlayingVoiceId(null);
      setLoadingAudioId(null);
      setAudioErrorId(null);
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Mic className="h-4 w-4 text-primary" />
        Voice <span className="text-destructive">*</span>
      </Label>

      {/* ── Custom scrollable list ── */}
      <div className="relative rounded-md border border-border/50 bg-background/50 overflow-hidden">
        {loadingVoices ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading voices…
          </div>
        ) : voices.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No voices available. Please run the migration to add voices.
          </p>
        ) : (
          <ul
            className="divide-y divide-border/40 max-h-64 overflow-y-auto"
            role="listbox"
            aria-label="Voice selection"
          >
            {voices.map((voice) => {
              const isSelected = selectedVoiceId === voice.voice_id;
              const isPlaying = playingVoiceId === voice.voice_id;
              const isLoadingAudio = loadingAudioId === voice.voice_id;
              const hasError = audioErrorId === voice.voice_id;

              return (
                <li
                  key={voice.voice_id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(voice.voice_id)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 cursor-pointer
                    transition-colors duration-100 select-none
                    ${isSelected
                      ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
                      : "hover:bg-muted/50"
                    }
                  `}
                >
                  {/* Selection indicator */}
                  <span
                    className={`flex-shrink-0 w-2 h-2 rounded-full transition-colors ${
                      isSelected ? "bg-primary" : "bg-transparent"
                    }`}
                  />

                  {/* Avatar */}
                  {voice.avatar_url && (
                    <img
                      src={voice.avatar_url}
                      alt={voice.voice_name ?? voice.voice_id}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {voice.voice_name ?? voice.voice_id}
                      </span>
                      {voice.gender && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                            voice.gender === "female"
                              ? "bg-pink-500/20 text-pink-600 dark:text-pink-400"
                              : voice.gender === "male"
                              ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                              : "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                          }`}
                        >
                          {voice.gender}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      {voice.accent && <span>{voice.accent}</span>}
                      {voice.age && <span>• {voice.age}</span>}
                      {voice.provider && <span>• {voice.provider}</span>}
                    </div>
                  </div>

                  {/* ── Play button – fully isolated from row selection ── */}
                  {voice.preview_audio_url && (
                    <button
                      type="button"
                      aria-label={
                        isPlaying
                          ? `Pause ${voice.voice_name}`
                          : `Play preview for ${voice.voice_name}`
                      }
                      disabled={isLoadingAudio}
                      /* stopPropagation here prevents the li onClick from firing */
                      onClick={(e) => handlePlayPreview(voice, e)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="
                        flex-shrink-0 p-2 rounded-full
                        hover:bg-primary/10 active:bg-primary/20
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                      "
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      ) : hasError ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : isPlaying ? (
                        <Pause className="h-4 w-4 text-primary" />
                      ) : (
                        <Play className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Click a voice to select it. Use the{" "}
        <Play className="inline h-3 w-3" /> button to hear a preview.
      </p>
    </div>
  );
}
