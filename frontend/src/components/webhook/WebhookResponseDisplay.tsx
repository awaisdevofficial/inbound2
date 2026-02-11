/**
 * WebhookResponseDisplay Component
 *
 * A clean, professional component for displaying webhook responses in a card format.
 * Perfect for showing API responses, webhook callbacks, and system notifications.
 *
 * @example
 * ```tsx
 * // Success response
 * <WebhookResponseDisplay
 *   title="Call Initiated"
 *   response={{ status: "success", call_id: "123" }}
 *   status="success"
 * />
 *
 * // Error response
 * <WebhookResponseDisplay
 *   title="Webhook Error"
 *   errorMessage="Failed to process request"
 *   status="error"
 * />
 *
 * // Pending state
 * <WebhookResponseDisplay
 *   title="Processing..."
 *   status="pending"
 * />
 * ```
 */

import {
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatUserFriendlyData } from "@/lib/utils";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface WebhookResponseDisplayProps {
  title?: string;
  response?: unknown;
  status?: "success" | "error" | "pending";
  errorMessage?: string;
  className?: string;
  showCopyButton?: boolean;
}

export function WebhookResponseDisplay({
  title = "Webhook Response",
  response,
  status = "success",
  errorMessage,
  className,
  showCopyButton = true,
}: WebhookResponseDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!response) return;
    const formatted = formatUserFriendlyData(response);
    const text = formatted
      .map((item) => `${item.label}: ${item.value}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: CheckCircle2,
          label: "Success",
          variant: "default" as const,
          bgColor: "bg-success/10",
          borderColor: "border-success/30",
          iconColor: "text-success",
        };
      case "error":
        return {
          icon: XCircle,
          label: "Error",
          variant: "destructive" as const,
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
          iconColor: "text-destructive",
        };
      case "pending":
        return {
          icon: Loader2,
          label: "Processing",
          variant: "secondary" as const,
          bgColor: "bg-primary/10",
          borderColor: "border-primary/30",
          iconColor: "text-primary",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!response && !errorMessage) {
    return null;
  }

  return (
    <Card
      className={cn(
        "border transition-all duration-200 hover:shadow-md",
        config.borderColor,
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon
                className={cn(
                  "h-5 w-5",
                  config.iconColor,
                  status === "pending" && "animate-spin",
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge variant={config.variant} className="mt-1">
                {config.label}
              </Badge>
            </div>
          </div>
          {showCopyButton && response && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {errorMessage ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive font-medium">
              {errorMessage}
            </p>
          </div>
        ) : response ? (
          <div className="space-y-3">
            {formatUserFriendlyData(response).length > 0 ? (
              formatUserFriendlyData(response).map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1 p-3 rounded-lg bg-gradient-to-r from-secondary/80 to-secondary/40 border border-border/50 hover:border-primary/30 transition-colors"
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
              <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <Info className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Operation completed successfully
                </p>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
