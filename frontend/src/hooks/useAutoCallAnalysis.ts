import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Call } from '@/types/database';
import { useAuth } from './useAuth';
import { useCallAnalysis } from './useCallAnalysis';

/**
 * Hook that automatically analyzes calls when they complete
 * Checks for calls with transcript and Lead_status="Yes" or is_lead=true
 */
export function useAutoCallAnalysis() {
  const { user } = useAuth();
  const { analyzeCall, analyzing } = useCallAnalysis();

  // Check for existing unanalyzed calls on mount
  useEffect(() => {
    if (!user) return;

    const checkExistingCalls = async () => {
      try {
        // Find completed calls with transcript that haven't been analyzed
        // and are leads (Lead_status="Yes" or is_lead=true)
        const { data: unanalyzedCalls, error } = await supabase
          .from('calls')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('transcript', 'is', null)
          .or('analyzed.is.null,analyzed.eq.false')
          .order('completed_at', { ascending: false })
          .limit(10); // Process up to 10 at a time

        if (error) {
          // Silently fail - don't spam errors
          return;
        }

        if (!unanalyzedCalls || unanalyzedCalls.length === 0) {
          return;
        }

        // Check each call to see if it's a lead
        for (const call of unanalyzedCalls as Call[]) {
          const hasTranscript = call.transcript && call.transcript.trim().length > 0;
          const isLeadCall =
            call.Lead_status === 'Yes' ||
            call.is_lead === true ||
            (call.metadata &&
              typeof call.metadata === 'object' &&
              ((call.metadata as any).Lead_status === 'Yes' ||
                (call.metadata as any).lead_status === 'Yes'));

          if (hasTranscript && isLeadCall && !call.analyzed) {
            // Small delay between each analysis
            setTimeout(async () => {
              try {
                await analyzeCall(call.id);
              } catch (error) {
                // Error already handled in useCallAnalysis hook
              }
            }, 2000 * (unanalyzedCalls.indexOf(call) + 1)); // Stagger the requests
          }
        }
      } catch (error) {
        // Silently fail
      }
    };

    // Check after a short delay to avoid blocking initial load
    const timeoutId = setTimeout(checkExistingCalls, 3000);

    return () => clearTimeout(timeoutId);
  }, [user, analyzeCall]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('auto-call-analysis')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const updatedCall = payload.new as unknown as Call;
          const previousCall = payload.old as unknown as Call;

          // Check if call just completed and has transcript
          const justCompleted =
            updatedCall.status === 'completed' &&
            previousCall.status !== 'completed';

          // Check if transcript was just added
          const transcriptAdded =
            updatedCall.transcript &&
            updatedCall.transcript.trim().length > 0 &&
            (!previousCall.transcript || previousCall.transcript.trim().length === 0);

          // Check if it's a lead (Lead_status="Yes" or is_lead=true)
          const isLeadCall =
            updatedCall.Lead_status === 'Yes' ||
            updatedCall.is_lead === true ||
            (updatedCall.metadata &&
              typeof updatedCall.metadata === 'object' &&
              ((updatedCall.metadata as any).Lead_status === 'Yes' ||
                (updatedCall.metadata as any).lead_status === 'Yes'));

          // Only analyze if:
          // 1. Call just completed OR transcript was just added
          // 2. Has transcript
          // 3. Is a lead (Lead_status="Yes" or is_lead=true)
          // 4. Not already analyzed
          if (
            (justCompleted || transcriptAdded) &&
            updatedCall.transcript &&
            updatedCall.transcript.trim().length > 0 &&
            isLeadCall &&
            !updatedCall.analyzed
          ) {
            // Small delay to ensure transcript is fully saved
            setTimeout(async () => {
              try {
                await analyzeCall(updatedCall.id);
              } catch (error) {
                // Error already handled in useCallAnalysis hook
              }
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, analyzeCall]);
}
