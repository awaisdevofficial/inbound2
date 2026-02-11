import { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Minimize2,
  Maximize2,
  X,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatUserFriendlyData } from "@/lib/utils";

interface WebhookResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  status: "pending" | "success" | "error";
  response?: unknown;
  errorMessage?: string;
}

export function WebhookResponseDialog({
  open,
  onOpenChange,
  action,
  status,
  response,
  errorMessage,
}: WebhookResponseDialogProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case "success":
        return <CheckCircle2 className="h-8 w-8 text-success" />;
      case "error":
        return <XCircle className="h-8 w-8 text-destructive" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return `Processing ${action}...`;
      case "success":
        return `${action} completed successfully!`;
      case "error":
        return `${action} failed`;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: "Bot Creation",
      update: "Bot Update",
      delete: "Bot Deletion",
    };
    return labels[action] || action;
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border",
            "bg-card/95 backdrop-blur-sm border-border/50",
            status === "pending" && "animate-pulse",
          )}
        >
          {getStatusIcon()}
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {getActionLabel(action)}
            </span>
            <span className="text-xs text-muted-foreground">
              {status === "pending"
                ? "Processing..."
                : status === "success"
                  ? "Complete"
                  : "Failed"}
            </span>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            {status !== "pending" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={status !== "pending" ? onOpenChange : undefined}
    >
      <DialogContent className="max-w-md bg-gradient-to-b from-card to-background border-border/50">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">
            {getActionLabel(action)}
          </DialogTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-4">
          <div
            className={cn(
              "p-4 rounded-full shadow-lg",
              status === "pending" && "bg-primary/10 shadow-primary/20",
              status === "success" && "bg-success/10 shadow-success/20",
              status === "error" && "bg-destructive/10 shadow-destructive/20",
            )}
          >
            {getStatusIcon()}
          </div>

          <p
            className={cn(
              "text-center font-semibold text-lg",
              status === "success" && "text-success",
              status === "error" && "text-destructive",
              status === "pending" && "text-primary",
            )}
          >
            {getStatusText()}
          </p>

          {status === "pending" && (
            <p className="text-sm text-muted-foreground text-center">
              Waiting for webhook response...
              <br />
              <span className="text-xs">You can minimize this window</span>
            </p>
          )}

          {errorMessage && (
            <div className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          {response && status === "success" && (
            <div className="w-full space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Response Details:
              </p>
              <ScrollArea className="h-48 w-full">
                <div className="space-y-2">
                  {formatUserFriendlyData(response).length > 0 ? (
                    formatUserFriendlyData(response).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1 p-3 rounded-lg bg-gradient-to-r from-secondary/80 to-secondary/40 border border-border/50"
                      >
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {item.label}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {item.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-success/5 border border-success/20">
                      <Info className="h-5 w-5 text-success" />
                      <p className="text-sm text-muted-foreground">
                        Operation completed successfully
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {status !== "pending" && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              className="min-w-[100px] bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
