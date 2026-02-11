import { useWallet } from "@/hooks/useWallet";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingDown, Clock, Plus } from "lucide-react";
import {
  formatCurrency,
  getCreditBalanceStatus,
  estimateRemainingMinutes,
  formatDuration,
} from "@/lib/credits";
import { Skeleton } from "@/components/ui/skeleton";

interface CreditBalanceCardProps {
  onAddCredits?: () => void;
}

export function CreditBalanceCard({ onAddCredits }: CreditBalanceCardProps) {
  const { wallet, loading: walletLoading } = useWallet();
  const { profile, loading: profileLoading } = useProfile();
  const { getTotalMinutesUsed, loading: usageLoading } = useCreditUsage();

  if (walletLoading || usageLoading || profileLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Credit Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Use profile fields (maintained by database trigger) as primary source
  const remainingCredits = profile?.Remaning_credits 
    ? parseFloat(String(profile.Remaning_credits)) 
    : 0;
  const totalMinutesUsed = profile?.total_minutes_used 
    ? parseFloat(String(profile.total_minutes_used)) 
    : getTotalMinutesUsed();
  const { status, color, message } = getCreditBalanceStatus(remainingCredits);
  const remainingMinutes = estimateRemainingMinutes(remainingCredits);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Credit Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="space-y-2">
          <div className="text-3xl font-bold">{remainingCredits.toFixed(2)} credits</div>
          <p className="text-sm text-slate-500">{remainingCredits.toFixed(2)} minutes available</p>
          <p className={`text-sm ${color}`}>{message}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Remaining
            </div>
            <div className="text-lg font-semibold">
              {Math.floor(remainingMinutes)} min
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" />
              Used
            </div>
            <div className="text-lg font-semibold">
              {formatDuration(Math.floor(totalMinutesUsed * 60))}
            </div>
          </div>
        </div>

        {/* Add Credits Button */}
        {onAddCredits && (
          <Button
            onClick={onAddCredits}
            className="w-full"
            variant={status === "critical" ? "destructive" : "default"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Credits
          </Button>
        )}

        {/* Warning for low balance */}
        {status === "critical" && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
            ⚠️ Your balance is critically low. Please add credits to continue
            receiving calls.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
