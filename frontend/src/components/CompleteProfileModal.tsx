import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
import {
  Building2,
  MapPin,
  Briefcase,
  Contact,
  User,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export function CompleteProfileModal() {
  const { profile, loading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  // Check if profile is incomplete
  const isProfileIncomplete = (p: typeof profile) => {
    if (!p) return false; // Don't show if profile hasn't loaded
    return (
      !p.full_name ||
      !p.company_name ||
      !p.position ||
      !p.company_address ||
      !p.contact_info
    );
  };

  // Calculate completion percentage
  const getCompletionPercent = () => {
    let filled = 0;
    const total = 5;
    if (fullName.trim()) filled++;
    if (position.trim()) filled++;
    if (companyName.trim()) filled++;
    if (companyAddress.trim()) filled++;
    if (contactInfo.trim()) filled++;
    return Math.round((filled / total) * 100);
  };

  const isFormValid = () => {
    return (
      fullName.trim() !== "" &&
      position.trim() !== "" &&
      companyName.trim() !== "" &&
      companyAddress.trim() !== "" &&
      contactInfo.trim() !== ""
    );
  };

  // Show modal when profile loads and is incomplete
  useEffect(() => {
    if (!loading && profile && isProfileIncomplete(profile)) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, profile]);

  // Pre-fill with existing data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPosition(profile.position || "");
      setCompanyName(profile.company_name || "");
      setCompanyAddress(profile.company_address || "");
      setContactInfo(profile.contact_info || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile({
        full_name: fullName.trim(),
        position: position.trim(),
        company_name: companyName.trim(),
        company_address: companyAddress.trim(),
        contact_info: contactInfo.trim(),
      });

      if (result) {
        toast({
          title: "Profile Complete!",
          description: "Your company information has been saved successfully.",
        });
        setOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile information.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToSettings = () => {
    setOpen(false);
    navigate("/settings");
  };

  // Don't render if loading or profile is complete
  if (loading || !profile || !isProfileIncomplete(profile)) {
    return null;
  }

  const completionPercent = getCompletionPercent();

  return (
    <Dialog open={open} onOpenChange={(val) => {
      // Prevent closing if profile is incomplete — user must fill it in
      if (!val && isProfileIncomplete(profile)) {
        toast({
          title: "Profile Required",
          description: "Please complete your company information to continue using the platform.",
          variant: "destructive",
        });
        return;
      }
      setOpen(val);
    }}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Complete Your Profile</DialogTitle>
              <DialogDescription className="mt-1">
                Please fill in your company information to get started. This is required to use the platform.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Profile Completion</span>
            <span className={`font-bold ${completionPercent === 100 ? "text-green-600" : "text-primary"}`}>
              {completionPercent}%
            </span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        <div className="space-y-4 mt-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-fullName" className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" />
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cp-fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Smith"
              className={!fullName.trim() ? "border-destructive/50" : ""}
            />
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-position" className="flex items-center gap-2 text-sm font-semibold">
              <Briefcase className="h-4 w-4 text-primary" />
              Your Position <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cp-position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Sales Manager, CEO, Support Lead"
              className={!position.trim() ? "border-destructive/50" : ""}
            />
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-companyName" className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cp-companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className={!companyName.trim() ? "border-destructive/50" : ""}
            />
          </div>

          {/* Company Address */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-companyAddress" className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Company Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cp-companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="e.g. 123 Main St, Suite 100, New York, NY 10001"
              className={!companyAddress.trim() ? "border-destructive/50" : ""}
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-contactInfo" className="flex items-center gap-2 text-sm font-semibold">
              <Contact className="h-4 w-4 text-primary" />
              Contact Information <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cp-contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. +1 (555) 123-4567 | www.example.com"
              className={!contactInfo.trim() ? "border-destructive/50" : ""}
            />
          </div>

          {/* Preview */}
          {(fullName || position || companyName) && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs leading-relaxed">
              <p className="text-muted-foreground font-medium mb-1">Preview:</p>
              {fullName && <p className="font-semibold text-sm">{fullName}</p>}
              {position && <p className="text-muted-foreground">{position}</p>}
              {companyName && <p className="text-muted-foreground">{companyName}</p>}
              {companyAddress && <p className="text-muted-foreground">{companyAddress}</p>}
              {contactInfo && <p className="text-muted-foreground">{contactInfo}</p>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !isFormValid()}
              className="flex-1 gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save & Continue
                </>
              )}
            </Button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              All fields are required. This information will be used in your email templates and signatures.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
