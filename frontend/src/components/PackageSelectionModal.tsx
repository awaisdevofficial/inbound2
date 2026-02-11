import { useState } from "react";
import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription, SubscriptionPackage } from "@/hooks/useSubscription";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PackageSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: (invoiceId: string) => void;
}

export function PackageSelectionModal({
  open,
  onOpenChange,
  onInvoiceCreated,
}: PackageSelectionModalProps) {
  const { packages, createInvoice, loading } = useSubscription();
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const handleSelectPackage = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
  };

  const handleCreateInvoice = async () => {
    if (!selectedPackage) return;

    setCreatingInvoice(true);
    try {
      const invoiceId = await createInvoice(selectedPackage.id);
      if (invoiceId) {
        onInvoiceCreated?.(invoiceId);
        onOpenChange(false);
        setSelectedPackage(null);
      }
    } finally {
      setCreatingInvoice(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select a subscription plan to unlock all features and start using Genie 2.0
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all ${
                    selectedPackage?.id === pkg.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectPackage(pkg)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{pkg.display_name}</CardTitle>
                      {selectedPackage?.id === pkg.id && (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {formatCurrency(pkg.price, pkg.currency)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <CardDescription className="mt-2">{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {pkg.credits_included.toLocaleString()} credits included
                        </span>
                      </div>
                      {pkg.features && typeof pkg.features === "object" && (
                        <>
                          {pkg.features.max_agents && (
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                {pkg.features.max_agents === -1
                                  ? "Unlimited"
                                  : pkg.features.max_agents}{" "}
                                agents
                              </span>
                            </div>
                          )}
                          {pkg.features.max_calls_per_month && (
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="text-sm">
                                {pkg.features.max_calls_per_month === -1
                                  ? "Unlimited"
                                  : pkg.features.max_calls_per_month.toLocaleString()}{" "}
                                calls/month
                              </span>
                            </div>
                          )}
                          {pkg.features.priority_support && (
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="text-sm">Priority support</span>
                            </div>
                          )}
                          {pkg.features.dedicated_account_manager && (
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-primary" />
                              <span className="text-sm">Dedicated account manager</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedPackage && (
              <div className="border-t pt-6 space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Selected Plan:</span>
                    <span className="text-lg font-bold">
                      {selectedPackage.display_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total Amount:</span>
                    <span className="text-base font-semibold text-foreground">
                      {formatCurrency(selectedPackage.price, selectedPackage.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                    <span>Credits Included:</span>
                    <span className="text-base font-semibold text-foreground">
                      {selectedPackage.credits_included.toLocaleString()} credits
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
                    💡 Payment Process
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    After clicking "Buy Now", an invoice will be created. Once you complete
                    payment, click "Mark as Paid" to activate your subscription.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      setSelectedPackage(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateInvoice}
                    disabled={creatingInvoice}
                    className="flex-1"
                  >
                    {creatingInvoice ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Invoice...
                      </>
                    ) : (
                      "Buy Now"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
