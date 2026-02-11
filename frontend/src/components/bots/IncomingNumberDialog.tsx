import { useState } from "react";
import { Phone, Check, Loader2, PhoneIncoming, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface IncomingNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomingNumbers: string[];
  onSelectNumber: (number: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function IncomingNumberDialog({
  open,
  onOpenChange,
  incomingNumbers,
  onSelectNumber,
  isSubmitting = false,
}: IncomingNumberDialogProps) {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);

  const handleSelect = async (number: string) => {
    setSelectedNumber(number);
    await onSelectNumber(number);
    // Reset selection after successful submission
    setSelectedNumber(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/20 border-border/50 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/10 shadow-lg">
              <PhoneIncoming className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Select Incoming Phone Number
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Choose a phone number to associate with your inbound agent. This
                number will receive all incoming calls for this agent.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 mt-4 min-h-0 overflow-y-auto overflow-x-hidden pr-4">
          {incomingNumbers.length === 0 ? (
            <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-border/50 rounded-xl shadow-sm">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <Phone className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground mb-2">
                  No Incoming Numbers Available
                </p>
                <p className="text-sm text-muted-foreground">
                  Please contact support to add incoming numbers to your account.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Available Numbers ({incomingNumbers.length})
                </p>
                <Separator />
              </div>
              {incomingNumbers.map((number, index) => {
                const isSelected = selectedNumber === number;
                const isProcessing = isSubmitting && isSelected;

                return (
                  <Card
                    key={index}
                    className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/40 ${
                      isSelected
                        ? "border-primary border-2 shadow-lg shadow-primary/10 bg-primary/5"
                        : "border-border/50 hover:bg-card/80"
                    } ${isSubmitting && !isSelected ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isSubmitting && handleSelect(number)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-primary/10 text-primary group-hover:bg-primary/20"
                            }`}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                              <Phone className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-xl text-foreground">
                                {number}
                              </p>
                              {isSelected && (
                                <Badge
                                  variant="default"
                                  className="gap-1 bg-primary text-primary-foreground"
                                >
                                  <Check className="h-3 w-3" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isProcessing
                                ? "Assigning number to agent..."
                                : isSelected
                                  ? "This number will be assigned to your inbound agent"
                                  : "Click to select and assign this number"}
                            </p>
                          </div>
                        </div>
                        {!isSelected && !isProcessing && (
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="ml-4"
                            disabled={isSubmitting}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border/50 gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="border-border/50"
          >
            Cancel
          </Button>
          {selectedNumber && !isSubmitting && (
            <Button
              onClick={() => handleSelect(selectedNumber)}
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 min-w-[160px]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Confirm Selection
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
