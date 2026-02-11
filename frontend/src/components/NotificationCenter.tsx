import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Phone,
  Bot,
  CreditCard,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "error":
      return XCircle;
    case "billing":
      return CreditCard;
    case "agent":
      return Bot;
    case "call":
      return Phone;
    case "system":
      return Settings;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "success":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    case "billing":
      return "text-blue-500";
    case "agent":
      return "text-purple-500";
    case "call":
      return "text-indigo-500";
    default:
      return "text-primary";
  }
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-10 h-10 rounded-lg hover:bg-muted/50 transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] sm:w-[420px] p-0 border-border/50 shadow-2xl backdrop-blur-xl bg-card/95" align="end">
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-8 text-xs hover:bg-muted transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <CheckCheck className="h-4 w-4 mr-1.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[450px]">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="border-[3px] border-muted border-t-primary rounded-full w-8 h-8 animate-spin" />
                <div className="text-sm text-muted-foreground">Loading notifications...</div>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You'll see updates here when they arrive
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer relative group",
                      !notification.read && "bg-muted/30 border-l-2 border-l-primary"
                    )}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50", iconColor)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p
                            className={cn(
                              "text-sm font-semibold leading-tight",
                              !notification.read && "font-bold"
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5 animate-pulse" />
                          )}
                        </div>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-2.5 font-medium">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10 hover:scale-110 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border/50 bg-muted/10">
            <Button
              variant="ghost"
              className="w-full text-sm font-medium hover:bg-muted transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
