import { Phone, PhoneCall, PhoneOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CallStatus = "idle" | "calling" | "connected" | "ended" | "error";

interface CallStatusProps {
  status: CallStatus;
}

const statusConfig = {
  idle: {
    icon: Phone,
    label: "Ready to Call",
    description: "Enter details below to start a call",
    className: "text-muted-foreground",
    iconClassName: "text-muted-foreground",
    bgColor: "bg-secondary/50",
  },
  calling: {
    icon: PhoneCall,
    label: "Connecting...",
    description: "Initiating your call",
    className: "text-primary",
    iconClassName: "text-primary animate-ring",
    bgColor: "bg-gradient-to-br from-primary/20 to-accent/10",
  },
  connected: {
    icon: PhoneCall,
    label: "Call Active",
    description: "Your agent is on the line",
    className: "text-success",
    iconClassName: "text-success",
    bgColor: "bg-gradient-to-br from-success/20 to-success/10",
  },
  ended: {
    icon: PhoneOff,
    label: "Call Ended",
    description: "The call has been terminated",
    className: "text-muted-foreground",
    iconClassName: "text-muted-foreground",
    bgColor: "bg-secondary/50",
  },
  error: {
    icon: AlertCircle,
    label: "Call Failed",
    description: "Unable to connect the call",
    className: "text-destructive",
    iconClassName: "text-destructive",
    bgColor: "bg-gradient-to-br from-destructive/20 to-destructive/10",
  },
};

export function CallStatus({ status }: CallStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-gradient-card shadow-card">
      <div
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300",
          config.bgColor,
          status === "connected" &&
            "shadow-glow border-success/60 shadow-success/30",
          status === "calling" && "animate-pulse-glow border-primary/50",
          status === "error" && "border-destructive/50",
          status === "idle" && "border-border/50",
          status === "ended" && "border-border/50",
        )}
      >
        <Icon className={cn("w-10 h-10", config.iconClassName)} />
        {status === "connected" && (
          <>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full" />
          </>
        )}
        {status === "calling" && (
          <span className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />
        )}
      </div>
      <div className="space-y-1">
        <h3 className={cn("font-bold text-xl", config.className)}>
          {config.label}
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          {config.description}
        </p>
      </div>
    </div>
  );
}
