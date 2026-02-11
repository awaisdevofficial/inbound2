import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useCallAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeCall = async (callId: string) => {
    setAnalyzing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/calls/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze call');
      }

      toast({
        title: 'Analysis Complete',
        description: 'Call has been analyzed and categorized successfully.',
      });

      // Refresh the calls data by triggering a refetch
      // The real-time subscription should handle the update automatically
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze call',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setAnalyzing(false);
    }
  };

  return { analyzeCall, analyzing };
}
