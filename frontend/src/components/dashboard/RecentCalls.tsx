import { Phone, Clock, CheckCircle, XCircle, PhoneCall } from "lucide-react";
import { Call, CallStatus } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface RecentCallsProps {
  calls: Call[];
  loading: boolean;
}

const statusConfig: Record<
  CallStatus,
  {
    icon: typeof Phone;
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "outline",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  in_progress: {
    icon: PhoneCall,
    label: "In Progress",
    variant: "secondary",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    variant: "default",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    variant: "destructive",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

export function RecentCalls({ calls, loading }: RecentCallsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 bg-gradient-to-r from-secondary/80 to-secondary/40 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
        <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
          <Phone className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          No calls yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {calls.map((call) => {
        const config = statusConfig[call.status] || {
          icon: Clock,
          label: call.status || "Unknown",
          variant: "outline" as const,
          color: "text-muted-foreground",
          bgColor: "bg-muted",
        };
        const Icon = config.icon;

        return (
          <div
            key={call.id}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary/80 to-secondary/40 rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-md transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-full ${config.bgColor} flex items-center justify-center border border-border/30`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {call.contact_name || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  {call.phone_number}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                variant={config.variant}
                className="text-xs font-semibold px-2.5 py-0.5"
              >
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">
                {call.started_at
                  ? formatDistanceToNow(new Date(call.started_at), {
                      addSuffix: true,
                    })
                  : call.completed_at
                  ? formatDistanceToNow(new Date(call.completed_at), {
                      addSuffix: true,
                    })
                  : "Just now"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
