import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checkingDeactivation, setCheckingDeactivation] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const checkDeactivation = async () => {
      if (!user || loading) {
        setCheckingDeactivation(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_deactivated")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!error && profile?.is_deactivated) {
          // Account is deactivated, sign out and redirect
          await signOut();
          navigate("/auth", {
            state: { message: "Your account has been deactivated. Please contact support to reactivate." },
          });
        }
      } catch (error) {
        // Removed console.error for security
      } finally {
        setCheckingDeactivation(false);
      }
    };

    checkDeactivation();
  }, [user, loading, signOut, navigate]);

  if (loading || checkingDeactivation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
