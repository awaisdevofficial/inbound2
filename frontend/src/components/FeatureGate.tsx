import { ReactNode } from "react";

interface FeatureGateProps {
  children: ReactNode;
  featureName?: string;
}

// Free credit model - always allow access, no subscription gate
export function FeatureGate({ children }: FeatureGateProps) {
  return <>{children}</>;
}
