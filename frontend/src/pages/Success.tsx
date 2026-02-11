import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Success() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex absolute left-5 top-5 bottom-5 w-[582px] bg-gradient-primary rounded-[24px] shadow-glow p-[60px] flex flex-col justify-between overflow-hidden z-10">
        <div className="relative z-10 flex-shrink-0">
          <h1 className="text-[64px] font-bold text-white leading-tight mb-[10px] tracking-[-1px]">
            Success!<br />
            You're all set
          </h1>
          <div className="w-[340px] h-[3px] bg-white rounded-[2px] mb-10 opacity-90" />
          <p className="text-[17px] leading-relaxed text-white max-w-[500px] font-normal">
            Your account has been successfully updated.<br />
            You can now continue using all our features.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center items-end w-full px-[60px] box-border">
          <img
            src="/assest/success.png"
            alt="Character"
            className="max-w-[380px] w-auto h-auto max-h-[500px] object-contain block m-0"
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 lg:ml-[602px] p-8 lg:p-[60px_80px] flex flex-col justify-center relative overflow-y-auto bg-background">
        <div className="max-w-[480px] w-full mx-auto relative z-10 text-center">
          <div className="w-[100px] h-[100px] bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-success/30">
            <Check className="w-[50px] h-[50px] text-white stroke-[3]" />
          </div>

          <h2 className="text-[32px] font-bold text-foreground mb-4">
            Password Updated!
          </h2>
          <p className="text-[15px] text-muted-foreground mb-10 max-w-[400px] mx-auto leading-relaxed">
            Your password has been changed successfully. You can continue using
            your<br />
            account with your new credentials.
          </p>

          <Button
            onClick={() => navigate("/signin")}
            className="w-full h-12 bg-gradient-primary text-white text-[16px] font-semibold rounded-[10px] shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
