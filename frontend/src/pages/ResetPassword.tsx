import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // Throttle reset requests - prevent rapid successive sends
      const lastResetKey = `last_password_reset_${email}`;
      const lastResetTime = localStorage.getItem(lastResetKey);
      const now = Date.now();
      
      if (lastResetTime && (now - parseInt(lastResetTime)) < 60000) {
        const secondsLeft = Math.ceil((60000 - (now - parseInt(lastResetTime))) / 1000);
        toast({
          title: "Please wait",
          description: `Please wait ${secondsLeft} seconds before requesting another reset link.`,
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-new-password`,
      });

      if (error) {
        // Handle email rate limit error specifically
        if (error.message?.includes("over_email_send_rate_limit") || 
            error.message?.includes("email rate limit")) {
          toast({
            title: "Rate limit exceeded",
            description: "Too many emails sent. Please wait a few minutes before requesting another reset link.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Store last reset time
      localStorage.setItem(lastResetKey, now.toString());

      // Show success state
      setLinkSent(true);

      toast({
        title: "Reset link sent!",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setLinkSent(false);
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex absolute left-5 top-5 bottom-5 w-[582px] bg-gradient-primary rounded-[24px] shadow-glow p-[60px] flex flex-col justify-between overflow-hidden z-10">
        <div className="relative z-10 flex-shrink-0">
          <h1 className="text-[64px] font-bold text-white leading-tight mb-[10px] tracking-[-1px]">
            Reset your<br />
            password
          </h1>
          <div className="w-[340px] h-[3px] bg-white rounded-[2px] mb-10 opacity-90" />
          <p className="text-[17px] leading-relaxed text-white max-w-[500px] font-normal">
            Don't worry, we've got you covered.<br />
            Enter your email and we'll help you<br />
            get back into your account.
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
          {!linkSent ? (
            <>
              <h2 className="text-[36px] font-bold text-foreground mb-3 text-center">
                Reset Your Password
              </h2>
              <p className="text-[15px] text-muted-foreground mb-10 text-center font-normal">
                Enter your email address and we'll send you a link to<br />
                create a new password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-[14px] font-medium text-foreground mb-2 block">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    placeholder="123@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 px-[18px] text-[15px] bg-white border-[1.5px] border-border rounded-[10px] focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-primary text-white text-[16px] font-semibold rounded-[10px] shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="text-center text-[14px] text-muted-foreground mt-6">
                Back to{" "}
                <Link
                  to="/signin"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* Link Sent Confirmation */
            <div className="text-center space-y-6">
              <div className="w-[80px] h-[80px] bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <div>
                <h2 className="text-[32px] font-bold text-foreground mb-3">
                  Check Your Email
                </h2>
                <p className="text-[15px] text-muted-foreground font-normal leading-relaxed">
                  We've sent a password reset link to<br />
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900 space-y-1">
                    <p className="font-medium">What to do next:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-700">
                      <li>Open your email inbox</li>
                      <li>Click the password reset link in the email</li>
                      <li>Create your new password</li>
                    </ol>
                    <p className="text-blue-600 text-xs mt-2">
                      The link will expire in 1 hour. Check your spam folder if you don't see it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 text-[15px] font-medium rounded-[10px]"
                  onClick={handleResend}
                >
                  Didn't receive it? Send again
                </Button>

                <Link to="/signin" className="block">
                  <Button
                    variant="ghost"
                    className="w-full h-12 text-[15px] font-medium rounded-[10px] text-muted-foreground"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign in
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
