import {
  Bot,
  Phone,
  BookOpen,
  Settings,
  CreditCard,
  User,
  Shield,
  Activity,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useActivityLogs, ActivityLog } from "@/hooks/useActivityLogs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const getActivityIcon = (activityType: ActivityLog["activity_type"]) => {
  switch (activityType) {
    case "agent_created":
    case "agent_updated":
    case "agent_deleted":
    case "agent_activated":
    case "agent_deactivated":
      return Bot;
    case "call_completed":
    case "call_failed":
      return Phone;
    case "knowledge_base_created":
    case "knowledge_base_updated":
    case "knowledge_base_deleted":
      return BookOpen;
    case "profile_updated":
    case "password_changed":
    case "account_deactivated":
    case "account_reactivated":
      return User;
    case "billing_updated":
      return CreditCard;
    case "settings_updated":
      return Settings;
    default:
      return Activity;
  }
};

const getActivityColor = (activityType: ActivityLog["activity_type"]) => {
  if (activityType.includes("created") || activityType === "account_reactivated") {
    return "text-green-500 bg-green-500/10";
  }
  if (activityType.includes("deleted") || activityType === "account_deactivated") {
    return "text-red-500 bg-red-500/10";
  }
  if (activityType.includes("updated") || activityType.includes("changed")) {
    return "text-blue-500 bg-blue-500/10";
  }
  if (activityType === "call_completed") {
    return "text-green-500 bg-green-500/10";
  }
  if (activityType === "call_failed") {
    return "text-red-500 bg-red-500/10";
  }
  return "text-primary bg-primary/10";
};

const getActivityBadgeVariant = (activityType: ActivityLog["activity_type"]) => {
  if (activityType.includes("created") || activityType === "account_reactivated") {
    return "success";
  }
  if (activityType.includes("deleted") || activityType === "account_deactivated") {
    return "destructive";
  }
  if (activityType.includes("updated") || activityType.includes("changed")) {
    return "secondary";
  }
  return "outline";
};

export function RecentActivity({ limit = 20 }: { limit?: number }) {
  const { activities, loading } = useActivityLogs(limit);

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Recent Activity
          </CardTitle>
          <CardDescription className="text-sm mt-1">Your recent account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="border-[3px] border-muted border-t-primary rounded-full w-8 h-8 animate-spin mb-3" />
            <div className="text-sm text-muted-foreground font-medium">Loading activity...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            Recent Activity
          </CardTitle>
          <CardDescription className="text-sm mt-1">Your recent account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No activity yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Your actions will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          Recent Activity
        </CardTitle>
        <CardDescription className="text-sm mt-1">Your recent account activity</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 pr-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              const iconColor = getActivityColor(activity.activity_type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-200 hover:scale-[1.01] border border-transparent hover:border-border/50"
                >
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ring-transparent transition-all duration-200",
                      iconColor
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-foreground leading-relaxed">
                        {activity.description}
                      </p>
                      <Badge
                        variant={getActivityBadgeVariant(activity.activity_type)}
                        className="text-xs flex-shrink-0 font-medium"
                      >
                        {activity.activity_type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2.5 text-xs text-muted-foreground/70 font-medium">
                        {activity.metadata.agent_name && (
                          <span>Agent: <span className="font-semibold">{activity.metadata.agent_name}</span></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
