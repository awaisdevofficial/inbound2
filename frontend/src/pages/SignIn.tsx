import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Please agree to the Terms & Privacy");
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        throw signInError;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex absolute left-5 top-5 bottom-5 w-[582px] bg-gradient-primary rounded-[24px] shadow-glow p-[60px] flex flex-col justify-between overflow-hidden z-10">
        <div className="relative z-10 flex-shrink-0">
          <h1 className="text-[64px] font-bold text-white leading-tight mb-[10px] tracking-[-1px]">
            Sign in to your<br />
            creative HQ
          </h1>
          <div className="w-[340px] h-[3px] bg-white rounded-[2px] mb-10 opacity-90" />
          <p className="text-[17px] leading-relaxed text-white max-w-[500px] font-normal">
            Unlock the power of AI-driven<br />
            social media intelligence.<br />
            Create, analyze, and dominate<br />
            your social presence with<br />
            cutting-edge tools.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center items-end w-full px-[60px] box-border">
          <img
            src="/assest/signin.png"
            alt="Character"
            className="max-w-[380px] w-auto h-auto max-h-[500px] object-contain block m-0"
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 lg:ml-[602px] p-8 lg:p-[60px_80px] flex flex-col justify-center relative overflow-y-auto bg-background">
        <div className="max-w-[480px] w-full mx-auto relative z-10">
          <h2 className="text-[36px] font-bold text-foreground mb-3 text-center">
            Welcome back!
          </h2>
          <p className="text-[15px] text-muted-foreground mb-10 text-center font-normal">
            Good to see you again.
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

            <div className="text-right mb-2">
              <Link
                to="/reset-password"
                className="text-[14px] text-primary font-medium hover:underline"
              >
                Forget Password?
              </Link>
            </div>

            <div>
              <Label className="text-[14px] font-medium text-foreground mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 px-[18px] pr-[45px] text-[15px] bg-white border-[1.5px] border-border rounded-[10px] focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
              />
              <Label
                htmlFor="terms"
                className="text-[14px] text-muted-foreground cursor-pointer"
              >
                I agree to the Terms & Privacy
              </Label>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-[10px] text-destructive text-[14px] mb-4 text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-primary text-white text-[16px] font-semibold rounded-[10px] shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-[14px] text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </div>

          <div className="flex items-center gap-4 my-8 relative">
            <div className="flex-1 h-[1px] bg-border" />
            <span className="text-[14px] text-muted-foreground bg-background px-4">or</span>
            <div className="flex-1 h-[1px] bg-border" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              className="h-12 border-[1.5px] border-border rounded-[10px] hover:bg-secondary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </Button>

            {/* Apple Button */}
            <Button
              type="button"
              variant="outline"
              className="h-12 border-[1.5px] border-border rounded-[10px] hover:bg-secondary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </Button>

            {/* Facebook Button */}
            <Button
              type="button"
              variant="outline"
              className="h-12 border-[1.5px] border-border rounded-[10px] hover:bg-secondary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
