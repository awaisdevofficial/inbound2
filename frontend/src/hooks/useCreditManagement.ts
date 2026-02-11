import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Call } from "@/types/database";
import { processCallCredits, processUnprocessedCalls } from "@/services/callCreditProcessor";
import {
  recordPurchase,
  getUserPurchases,
  getTotalCreditsPurchased,
  Purchase,
} from "@/services/purchaseTracker";
import { toast } from "./use-toast";

export function useCreditManagement() {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [totalPurchased, setTotalPurchased] = useState(0);

  // Monitor calls for automatic credit processing
  useEffect(() => {
    if (!user) return;

    // Process any unprocessed calls on mount
    processUnprocessedCalls(user.id).then((result) => {
      // Removed console.log for security
    });

    // Set up real-time subscription for calls
    const callsChannel = supabase
      .channel("credit-processing-calls")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const updatedCall = payload.new as Call;
          
          // Process credits when call is completed
          if (
            updatedCall.status === "completed" &&
            updatedCall.duration_seconds &&
            updatedCall.duration_seconds > 0
          ) {
            const result = await processCallCredits(updatedCall);
            
            if (result.success && result.creditsDeducted > 0) {
              toast({
                title: "Call Processed",
                description: `${result.creditsDeducted} credits deducted (${result.creditsDeducted} minutes)`,
              });
            } else if (result.error && !result.error.includes("already processed")) {
              if (result.error.includes("Insufficient credits")) {
                toast({
                  title: "Insufficient Credits",
                  description: result.error,
                  variant: "destructive",
                });
              } else {
                // Removed console.error for security
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
    };
  }, [user]);

  // Load purchases
  const loadPurchases = useCallback(async () => {
    if (!user) return;

    try {
      const userPurchases = await getUserPurchases(user.id);
      setPurchases(userPurchases);
      
      const total = await getTotalCreditsPurchased(user.id);
      setTotalPurchased(total);
    } catch (error) {
      // Removed console.error for security
    }
  }, [user]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Record a purchase
  const handlePurchase = async (
    packageId: string,
    packageName: string,
    credits: number, // Credits = minutes
    price: number,
    paymentMethod?: string,
    paymentReference?: string
  ) => {
    if (!user) return null;

    setProcessing(true);
    try {
      const purchase = await recordPurchase(
        user.id,
        packageId,
        packageName,
        credits, // Credits to add
        price,
        paymentMethod,
        paymentReference
      );

      if (purchase) {
        await loadPurchases();
        toast({
          title: "Purchase Recorded",
          description: `Successfully purchased ${packageName} package (${credits} credits)`,
        });
      }

      return purchase;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to record purchase",
        variant: "destructive",
      });
      return null;
    } finally {
      setProcessing(false);
    }
  };

  // Manually process unprocessed calls
  const processCalls = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      const result = await processUnprocessedCalls(user.id);
      
      toast({
        title: "Processing Complete",
        description: `Processed ${result.processed} calls. ${result.errors} errors.`,
      });

      return result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to process calls",
        variant: "destructive",
      });
      return { processed: 0, errors: 0 };
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    purchases,
    totalPurchased,
    handlePurchase,
    processCalls,
    loadPurchases,
  };
}
