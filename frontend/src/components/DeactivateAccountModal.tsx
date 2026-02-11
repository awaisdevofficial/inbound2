import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DeactivateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  requestDeactivation: (reason: string) => Promise<{ success: boolean; code: null; error: string | null }>;
  verifyDeactivationCode: (code: string) => Promise<boolean>;
  userEmail?: string;
}

type Step = "reason" | "code-sent" | "verify" | "success";

export function DeactivateAccountModal({
  open,
  onOpenChange,
  onSuccess,
  requestDeactivation,
  verifyDeactivationCode,
  userEmail,
}: DeactivateAccountModalProps) {
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState("");
  const [verificationCode, setVerificationCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleReasonSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for deactivating your account.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await requestDeactivation(reason);
    setIsLoading(false);

    if (result.success) {
      // Code is sent via email, not returned to frontend
      setStep("code-sent");
      toast({
        title: "Verification Code Sent",
        description: `A verification code has been sent to ${userEmail || "your email"}. Please check your inbox.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to request deactivation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...verificationCode];
    newCode[index] = value.replace(/\D/g, ""); // Only allow digits
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join("");
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const success = await verifyDeactivationCode(code);
    setIsLoading(false);

    if (success) {
      setStep("success");
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    }
  };

  const handleResendCode = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Cannot resend code. Please start over.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await requestDeactivation(reason);
    setIsLoading(false);

    if (result.success) {
      // Code is sent via email, not returned to frontend
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setStep("reason");
    setReason("");
    setVerificationCode(["", "", "", "", "", ""]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Deactivate Account
          </DialogTitle>
          <DialogDescription>
            {step === "reason" && "Please tell us why you want to deactivate your account. This helps us improve our service."}
            {step === "code-sent" && "We've sent a verification code to your email. Please enter it below to confirm deactivation."}
            {step === "verify" && "Enter the 6-digit verification code sent to your email."}
            {step === "success" && "Your account has been deactivated successfully."}
          </DialogDescription>
        </DialogHeader>

        {step === "reason" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Deactivation *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., No longer using the service, found an alternative, pricing concerns, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                disabled={isLoading}
                className="resize-none"
              />
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning-foreground">
                <strong>Warning:</strong> Once deactivated, you will not be able to log in again. 
                You can reactivate your account by contacting support.
              </p>
            </div>
          </div>
        )}

        {step === "code-sent" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center p-6 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-center space-y-2">
                <Mail className="h-12 w-12 text-primary mx-auto" />
                <p className="text-sm font-medium">Code sent to</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground text-center">
                Please check your email for the verification code. It may take a few moments to arrive.
                <br />
                <strong>Note:</strong> The code will expire in 15 minutes.
              </p>
            </div>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Enter Verification Code</Label>
              <div className="flex gap-2 justify-center">
                {verificationCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-lg font-mono font-bold"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendCode}
              disabled={isLoading}
              className="w-full"
            >
              Didn't receive the code? Resend
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center p-6 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Your account has been deactivated. You will be logged out shortly.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "reason" && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReasonSubmit}
                disabled={isLoading || !reason.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </>
          )}
          {step === "code-sent" && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={() => setStep("verify")} disabled={isLoading}>
                Enter Code
              </Button>
            </>
          )}
          {step === "verify" && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.join("").length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Deactivate"
                )}
              </Button>
            </>
          )}
          {step === "success" && (
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
