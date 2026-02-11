import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function SetNewPassword() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isPasswordRecovery } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Wait for the recovery session to be established from the URL hash
  useEffect(() => {
    if (authLoading) return;

    // If user is authenticated (recovery token was processed), mark session ready
    if (user) {
      setSessionReady(true);
      return;
    }

    // If no user and auth is done loading, check if there's a hash with tokens
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
      // Supabase client should auto-process this hash.
      // Give it a moment, then check again
      const timeout = setTimeout(() => {
        if (!user) {
          toast({
            title: "Link Expired",
            description: "This password reset link has expired. Please request a new one.",
            variant: "destructive",
          });
          navigate("/reset-password");
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }

    // No hash and no user = direct access / invalid link
    toast({
      title: "Invalid Link",
      description: "This password reset link is invalid or expired. Please request a new one.",
      variant: "destructive",
    });
    navigate("/reset-password");
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Session expired. Please request a new password reset link.",
        variant: "destructive",
      });
      navigate("/reset-password");
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully! You can now sign in with your new password.",
      });

      // Sign out so they can log in fresh with new password
      await supabase.auth.signOut();
      navigate("/success");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!sessionReady && !user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex absolute left-5 top-5 bottom-5 w-[582px] bg-gradient-primary rounded-[24px] shadow-glow p-[60px] flex flex-col justify-between overflow-hidden z-10">
        <div className="relative z-10 flex-shrink-0">
          <h1 className="text-[64px] font-bold text-white leading-tight mb-[10px] tracking-[-1px]">
            Set a new<br />
            password
          </h1>
          <div className="w-[340px] h-[3px] bg-white rounded-[2px] mb-10 opacity-90" />
          <p className="text-[17px] leading-relaxed text-white max-w-[500px] font-normal">
            Create a strong password to secure your account.<br />
            Make sure it's something you'll remember!
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center items-end w-full px-[60px] box-border">
          <img
            src="/assest/resetpassword.png"
            alt="Character"
            className="max-w-[380px] w-auto h-auto max-h-[500px] object-contain block m-0"
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 lg:ml-[602px] p-8 lg:p-[60px_80px] flex flex-col justify-center relative overflow-y-auto bg-background">
        <div className="max-w-[480px] w-full mx-auto relative z-10">
          <h2 className="text-[36px] font-bold text-foreground mb-3 text-center">
            Set a New Password.
          </h2>
          <p className="text-[15px] text-muted-foreground mb-10 text-center font-normal">
            Create a new password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-[14px] font-medium text-foreground mb-2 block">
                Enter New Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Your New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-[18px] pr-[45px] text-[15px] bg-white border-[1.5px] border-border rounded-[10px] focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-[14px] font-medium text-foreground mb-2 block">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter Your Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 px-[18px] pr-[45px] text-[15px] bg-white border-[1.5px] border-border rounded-[10px] focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-primary text-white text-[16px] font-semibold rounded-[10px] shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
