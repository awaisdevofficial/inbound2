import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useState, useEffect } from "react";

export function InvoiceNotificationBanner() {
  const { profile } = useProfile();
  const [isVisible, setIsVisible] = useState(false);

  const totalMinutesUsed = profile?.total_minutes_used
    ? parseFloat(profile.total_minutes_used) || 0
    : 0;

  // Show notification when minutes >= 900
  useEffect(() => {
    setIsVisible(totalMinutesUsed >= 900);
  }, [totalMinutesUsed]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className="mx-6 sm:mx-8 mt-4 mb-0 border-destructive/50 bg-gradient-to-r from-destructive/10 via-destructive/15 to-destructive/10 dark:from-destructive/20 dark:via-destructive/25 dark:to-destructive/20 shadow-lg shadow-destructive/10 backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0 ring-2 ring-destructive/30">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-base font-bold mb-2">
            Payment Required
          </AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="flex-1 text-sm leading-relaxed">
              You have reached <span className="font-semibold">{totalMinutesUsed.toFixed(1)} minutes</span>. Please pay
              your invoice to continue using the service.
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/billing">
                <Button
                  size="sm"
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  Pay Invoice
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
