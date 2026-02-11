import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    timezone: string,
  ) => Promise<{ error: Error | null; user: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Detect password recovery event from Supabase
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }

      // Clear recovery flag after user updates password and signs in normally
      if (event === "SIGNED_IN" && isPasswordRecovery) {
        // Keep recovery true until the password is actually updated
      }

      if (event === "USER_UPDATED") {
        setIsPasswordRecovery(false);
      }

      if (event === "SIGNED_OUT") {
        setIsPasswordRecovery(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    timezone: string,
  ) => {
    const maxRetries = 2; // 3 total attempts (0, 1, 2)
    const baseDelay = 500;
    let authData = null;
    let authError = null;

    // Retry loop for handling network issues
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        // Assign response to variables
        authData = data;
        authError = error;

        // Early exit on success
        if (!authError && authData?.user) {
          break;
        }

        // If we got an error, check if it's retryable
        if (authError) {
          const errorMsg = authError.message || String(authError) || "";
          const isRetryableError = 
            errorMsg.includes("timeout") || 
            errorMsg.includes("504") || 
            errorMsg.includes("Gateway") ||
            errorMsg.includes("Failed to fetch") ||
            errorMsg.includes("network") ||
            errorMsg.includes("ECONNRESET");

          // Don't retry on non-retryable errors (like email already exists, invalid password, etc.)
          if (!isRetryableError || attempt === maxRetries) {
            break;
          }

          // Wait before retrying (exponential backoff) - only if not last attempt
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } catch (error: any) {
        // Handle network errors, timeouts, and other exceptions
        const errorMessage = error?.message || String(error) || "";
        const isRetryableError = 
          errorMessage.includes("timeout") || 
          errorMessage.includes("504") || 
          errorMessage.includes("Gateway") ||
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("network") ||
          errorMessage.includes("ECONNRESET");

        if (!isRetryableError || attempt === maxRetries) {
          authError = isRetryableError
            ? new Error("The server is taking too long to respond. Please check your internet connection and try again.")
            : (error instanceof Error ? error : new Error("An unexpected error occurred during signup."));
          break;
        }

        // Wait before retrying - only if not last attempt
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Handle errors after retry loop
    if (authError) {
      // Handle email rate limit error specifically
      if (authError.message?.includes("over_email_send_rate_limit") || 
          authError.message?.includes("email rate limit")) {
        return { 
          error: new Error("Email rate limit exceeded. Please wait a few minutes before trying again, or contact support if you need immediate access."),
          user: null,
        };
      }
      
      // Handle timeout and gateway errors
      const errorMsg = authError.message || String(authError) || "";
      if (errorMsg.includes("timeout") || 
          errorMsg.includes("504") || 
          errorMsg.includes("Gateway") ||
          errorMsg.includes("Failed to fetch")) {
        return {
          error: new Error("The server is taking too long to respond after multiple attempts. Please check your internet connection and try again later."),
          user: null,
        };
      }
      
      return { error: authError, user: null };
    }

    // Check if we have valid user data
    if (!authData?.user) {
      return { error: new Error("User creation failed - no user data returned"), user: null };
    }

    // Create profile using upsert for better performance (handles both insert and update)
    const defaultRetellApiKey = import.meta.env.VITE_RETELL_API_KEY || null;
    const userId = authData.user.id;
    const userEmail = authData.user.email || email;
    
    try {
      // Calculate trial expiration date (1 week from now)
      const trialExpirationDate = new Date();
      trialExpirationDate.setDate(trialExpirationDate.getDate() + 7);

      // Use upsert instead of check + insert for better performance
      // This will insert if not exists, or update if exists (idempotent)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          email: userEmail,
          full_name: fullName,
          timezone: timezone,
          retell_api_key: defaultRetellApiKey,
          total_minutes_used: 0,
          Total_credit: 0,
          Remaning_credits: 0,
          is_deactivated: false,
          payment_status: 'unpaid',
          trial_credits_expires_at: trialExpirationDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      // Only return error if profile creation fails critically
      // Don't block signup for minor profile issues (like duplicates)
      if (profileError && 
          !profileError.message?.includes("duplicate") && 
          !profileError.message?.includes("already exists")) {
        // Log error but don't block signup - profile can be created later
        console.warn("Profile creation warning:", profileError);
      }
    } catch (profileException) {
      // Catch any unexpected errors during profile creation
      // Don't block signup - user account is already created
      console.warn("Profile creation exception:", profileException);
    }

    return { error: null, user: authData?.user ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { error: authError };
    }

    // Check if account is deactivated
    if (authData.user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_deactivated")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (!profileError && profile?.is_deactivated) {
          // Sign out immediately if account is deactivated
          await supabase.auth.signOut();
          return {
            error: new Error(
              "Your account has been deactivated. Please contact support to reactivate your account."
            ),
          };
        }
      } catch (error) {
        // If we can't check the profile, allow login (fail open for better UX)
        console.warn("Could not verify account status:", error);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isPasswordRecovery, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}