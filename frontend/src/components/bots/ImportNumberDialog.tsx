import { useState } from "react";
import { Phone, Loader2, Plus, X, Upload, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { verifyPhoneNumber } from "@/lib/phoneVerification";

interface ImportedNumber {
  phone_number: string;
  termination_uri: string;
  id?: string;
  importStatus?: "pending" | "importing" | "success" | "failed";
  importError?: string;
}

interface ImportNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (numbers: ImportedNumber[]) => void;
  existingNumbers?: ImportedNumber[];
}

export function ImportNumberDialog({
  open,
  onOpenChange,
  onImportSuccess,
  existingNumbers = [],
}: ImportNumberDialogProps) {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [terminationUri, setTerminationUri] = useState("");
  const [importedNumbers, setImportedNumbers] = useState<ImportedNumber[]>(existingNumbers);
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAddNumber = async () => {
    if (!phoneNumber.trim() || !terminationUri.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both phone number and termination URI",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number (e.g., +14157774444)",
        variant: "destructive",
      });
      return;
    }

    // Verify phone number using apilayer API
    setIsVerifying(true);
    const verificationResult = await verifyPhoneNumber(phoneNumber.trim());
    setIsVerifying(false);

    if (!verificationResult.success) {
      toast({
        title: "Verification Error",
        description: verificationResult.error,
        variant: "destructive",
      });
      return;
    }

    if (!verificationResult.data.valid) {
      toast({
        title: "Invalid Phone Number",
        description: "The phone number could not be verified. Please check and try again.",
        variant: "destructive",
      });
      return;
    }

    // Use verified international format for consistency
    const verifiedNumber = verificationResult.data.international_format;

    const newNumber: ImportedNumber = {
      phone_number: verifiedNumber,
      termination_uri: terminationUri.trim(),
    };

    setImportedNumbers((prev) => [...prev, newNumber]);
    setPhoneNumber("");
    setTerminationUri("");
    
    toast({
      title: "Number Added",
      description: `Verified number added: ${verifiedNumber} (${verificationResult.data.carrier}, ${verificationResult.data.line_type})`,
    });
  };

  const handleRemoveNumber = (index: number) => {
    setImportedNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (importedNumbers.length === 0) {
      toast({
        title: "No Numbers to Import",
        description: "Please add at least one number to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setIsSubmitting(true);
    const failedNumbers: Array<{ number: ImportedNumber; error: string }> = [];
    const successfulNumbers: ImportedNumber[] = [];

    // Mark all numbers as importing
    setImportedNumbers((prev) =>
      prev.map((n) => ({ ...n, importStatus: "importing" as const }))
    );

    // Import each number via webhook
    for (let i = 0; i < importedNumbers.length; i++) {
      const number = importedNumbers[i];
      try {
        const webhookPayload = {
          action: "import_phone_number",
          phone_number: number.phone_number,
          termination_uri: number.termination_uri,
          user_id: user?.id,
          user_email: user?.email,
          timestamp: new Date().toISOString(),
        };

        // Call webhook with improved error handling
        const { callWebhook } = await import("@/lib/webhook");
        const webhookResult = await callWebhook(webhookPayload, {
          timeout: 30000,
          useSupabaseProxy: false,
        });

        if (!webhookResult.success) {
          throw new Error(webhookResult.error || "Webhook request failed");
        }

        const webhookResponse: any = webhookResult.data || webhookResult;

        // Check response message for success keywords (case insensitive)
        // Check all possible message fields - including error field which might contain success message
        const allMessages = [
          webhookResponse.message,
          webhookResponse.error,  // Check error field too - webhook might return success message here
          webhookResponse.response,
          webhookResponse.data?.message,
          webhookResponse.data?.error,
          JSON.stringify(webhookResponse)
        ].filter(Boolean).join(" ").toLowerCase();
        
        const hasSuccessKeywords = 
          allMessages.includes("success") ||
          allMessages.includes("imported") ||
          allMessages.includes("successfully");

        // Check if response indicates success
        // Consider it successful if:
        // 1. Webhook result indicates success, OR
        // 2. Response contains success keywords in ANY field (including error field), OR
        // 3. Response has success indicators
        const isHttpOk = webhookResult.success;
        const hasSuccessIndicators = 
          webhookResponse.success === true ||
          webhookResponse.status === "success" ||
          webhookResponse.imported === true ||
          webhookResponse.phone_number === number.phone_number ||
          webhookResponse.id ||
          webhookResponse.phone_number_id ||
          webhookResponse.phone_id;

        // PRIORITY: If message contains success keywords, ALWAYS treat as success
        // This handles cases where webhook returns "Successfully Imported" in error/message field
        if (hasSuccessKeywords) {
          // Success! Continue to save to database - don't throw error
        } else if (isHttpOk || hasSuccessIndicators) {
          // HTTP OK or has success indicators - treat as success
        } else {
          // No success indicators found - treat as error
          const errorMessage = 
            webhookResponse.error || 
            webhookResponse.message || 
            webhookResponse.response ||
            webhookResult.error ||
            "Webhook request failed";
          throw new Error(errorMessage);
        }

        // Successfully imported - save to database
        const importedNumberId = webhookResponse.id || 
                                 webhookResponse.phone_number_id || 
                                 webhookResponse.phone_id ||
                                 null;
        
        // Save to database
        // Note: imported_phone_numbers table is not in generated types, using type assertion
        if (user) {
          try {
            const { error: dbError } = await supabase
              .from("imported_phone_numbers" as any)
              .upsert({
                user_id: user.id,
                phone_number: number.phone_number,
                termination_uri: number.termination_uri,
                status: "active" as const,
                imported_at: new Date().toISOString(),
              }, {
                onConflict: "user_id,phone_number",
                ignoreDuplicates: false, // Update if exists
              });

            if (dbError) {
              // Removed console.error for security
              // Continue anyway as webhook import was successful
            }
          } catch (dbError: any) {
            // Removed console.error for security
            // Continue anyway as webhook import was successful
          }
        }
        
        const importedNumber: ImportedNumber = {
          ...number,
          id: importedNumberId || number.phone_number,
          importStatus: "success",
        };
        successfulNumbers.push(importedNumber);
        
        // Update status in UI
        setImportedNumbers((prev) =>
          prev.map((n) =>
            n.phone_number === number.phone_number
              ? importedNumber
              : n
          )
        );
      } catch (error) {
        // Removed console.error for security
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        const failedNumber: ImportedNumber = {
          ...number,
          importStatus: "failed",
          importError: errorMessage,
        };
        failedNumbers.push({ 
          number: failedNumber, 
          error: errorMessage 
        });
        
        // Update status in UI
        setImportedNumbers((prev) =>
          prev.map((n) =>
            n.phone_number === number.phone_number
              ? failedNumber
              : n
          )
        );
      }
    }

    setIsImporting(false);
    setIsSubmitting(false);

    // Show results
    if (failedNumbers.length === 0 && successfulNumbers.length > 0) {
      // All successful - show green success and close dialog
      toast({
        title: "✅ Import Successful",
        description: `Successfully imported ${successfulNumbers.length} number(s). You can now use them to create your agent.`,
        className: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      });
      
      // Call success callback
      onImportSuccess(successfulNumbers);
      
      // Wait a moment to show success state, then close and reset
      setTimeout(() => {
        // Reset form only after successful completion
        setImportedNumbers([]);
        setPhoneNumber("");
        setTerminationUri("");
        onOpenChange(false);
      }, 1500);
    } else if (successfulNumbers.length > 0 && failedNumbers.length > 0) {
      // Partial success - keep dialog open for failed numbers
      const failedDetails = failedNumbers
        .map(f => `${f.number.phone_number}: ${f.error}`)
        .join("; ");
      toast({
        title: "⚠️ Partial Import Success",
        description: `Successfully imported ${successfulNumbers.length} number(s). ${failedNumbers.length} failed. ${failedDetails.length > 100 ? failedDetails.substring(0, 100) + "..." : failedDetails}`,
        variant: "destructive",
      });
      // Still add successful numbers
      onImportSuccess(successfulNumbers);
      // Remove successful numbers from the list, keep failed ones
      setImportedNumbers(failedNumbers.map(f => f.number));
    } else {
      // All failed - keep dialog open
      const failedDetails = failedNumbers
        .map(f => `${f.number.phone_number}: ${f.error}`)
        .join("; ");
      toast({
        title: "❌ Import Failed",
        description: `Failed to import ${failedNumbers.length} number(s). ${failedDetails.length > 150 ? failedDetails.substring(0, 150) + "..." : failedDetails}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (!isImporting && !isSubmitting) {
      onOpenChange(false);
    }
  };

  const handleClose = (open: boolean) => {
    // Only allow closing when not importing/submitting
    if (!open && (isImporting || isSubmitting)) {
      return;
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/20 border-border/50 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/10 shadow-lg">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Import Your Own Number
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Add your phone numbers with termination URIs. You can import multiple numbers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 mt-4 min-h-0 overflow-y-auto overflow-x-hidden pr-4">
          <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-border/50 rounded-xl shadow-sm">
            <div className="space-y-5">
              {/* Video Tutorial Section */}
              <div className="space-y-3 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold text-foreground">
                    How to Import Numbers
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Follow the steps in the video below to learn how to import your phone numbers:
                </p>
                <div className="rounded-lg overflow-hidden border border-border/50 bg-black/5">
                  <video
                    controls
                    className="w-full h-auto max-h-[400px]"
                    preload="metadata"
                  >
                    <source src="/assest/In Bound Calling.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="bg-background/50 border border-border/30 rounded-md p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">Quick Instructions:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Enter your phone number in E.164 format (e.g., +14157774444)</li>
                    <li>Enter the termination URI for your phone number</li>
                    <li>Click "Add to Import List" to add the number</li>
                    <li>Repeat for additional numbers if needed</li>
                    <li>Click "Import Numbers" to complete the import process</li>
                  </ol>
                </div>
              </div>

              <Separator />

              {/* Add Number Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="phone_number"
                    className="text-sm font-semibold flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone_number"
                    placeholder="e.g., +14157774444"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary transition-all"
                    disabled={isImporting || isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number in E.164 format (e.g., +14157774444)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="termination_uri"
                    className="text-sm font-semibold flex items-center gap-2"
                  >
                    Termination URI <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="termination_uri"
                    placeholder="e.g., someuri.pstn.twilio.com"
                    value={terminationUri}
                    onChange={(e) => setTerminationUri(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary transition-all"
                    disabled={isImporting || isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the termination URI for your phone number
                  </p>
                </div>

                <Button
                  onClick={handleAddNumber}
                  disabled={isImporting || isSubmitting || isVerifying || !phoneNumber.trim() || !terminationUri.trim()}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Import List
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              {/* Imported Numbers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Numbers to Import ({importedNumbers.length})
                  </Label>
                  {importedNumbers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImportedNumbers([])}
                      disabled={isImporting || isSubmitting}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {importedNumbers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No numbers added yet</p>
                    <p className="text-xs mt-1">Add numbers above to get started</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {importedNumbers.map((number, index) => {
                        const isImporting = number.importStatus === "importing";
                        const isSuccess = number.importStatus === "success";
                        const isFailed = number.importStatus === "failed";
                        
                        return (
                          <Card
                            key={index}
                            className={`border-border/50 bg-card/50 transition-all ${
                              isSuccess ? "border-green-500/70 bg-green-500/10 shadow-green-500/20 shadow-sm" :
                              isFailed ? "border-red-500/50 bg-red-500/5" :
                              isImporting ? "border-primary/50 bg-primary/5" :
                              ""
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    {isImporting ? (
                                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                    ) : isSuccess ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    ) : isFailed ? (
                                      <Phone className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    ) : (
                                      <Phone className="h-4 w-4 text-primary" />
                                    )}
                                    <span className={`font-semibold ${
                                      isSuccess ? "text-green-700 dark:text-green-300" : ""
                                    }`}>
                                      {number.phone_number}
                                    </span>
                                    {isSuccess && (
                                      <Badge variant="default" className="bg-green-600 dark:bg-green-500 text-white text-xs border-0">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Imported
                                      </Badge>
                                    )}
                                    {isFailed && (
                                      <Badge variant="destructive" className="text-xs">
                                        Failed
                                      </Badge>
                                    )}
                                    {isImporting && (
                                      <Badge variant="secondary" className="text-xs">
                                        Importing...
                                      </Badge>
                                    )}
                                  </div>
                                  <div className={`text-sm ${
                                    isSuccess ? "text-green-700/80 dark:text-green-300/80" : "text-muted-foreground"
                                  }`}>
                                    <span className="font-medium">URI:</span> {number.termination_uri}
                                  </div>
                                  {isFailed && number.importError && (
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                      Error: {number.importError}
                                    </div>
                                  )}
                                  {isSuccess && (
                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Successfully imported via webhook
                                    </div>
                                  )}
                                </div>
                                {!isImporting && !isSuccess && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveNumber(index)}
                                    disabled={isImporting || isSubmitting}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className="pt-4 border-t border-border/50 gap-3 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isImporting || isSubmitting}
            className="border-border/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || isSubmitting || importedNumbers.length === 0}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/20 min-w-[160px]"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing... Please wait
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Numbers ({importedNumbers.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
