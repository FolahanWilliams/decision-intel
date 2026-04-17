'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SSEReader } from '@/lib/sse';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('AnalysisStream');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Abort the stream and surface an error after this duration.
 *  Matches the server-side `maxDuration` (240s) in /api/analyze/stream. */
const STREAM_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes

/** Minimum time a step must remain visible before a new step transition is applied.
 *  Prevents fast Gemini responses from flashing past the user. The animation runs
 *  on its own schedule; if the backend catches up, queued transitions flush through. */
const MIN_STEP_DWELL_MS = 400;
/** Catch-up mode threshold — if we're >= N steps behind, halve the dwell time. */
const CATCHUP_THRESHOLD = 2;
const CATCHUP_DWELL_MS = 180;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalysisStep {
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'complete';
  icon?: React.ReactNode;
}

interface StreamResult {
  overallScore?: number;
  [key: string]: unknown;
}

export interface OutcomeGateInfo {
  pendingCount: number;
  pendingAnalysisIds: string[];
  message: string;
}

interface StreamOptions {
  /** Pre-configured analysis step names (used for the progress UI). */
  stepNames: string[];
  /** Called when a bias is detected in real-time. */
  onBiasDetected?: (biasType: string, severity: string) => void;
  /** Called when the noise score is emitted. */
  onNoiseUpdate?: (score: number) => void;
  /** Called when the server sends an outcome reminder (soft gate). */
  onOutcomeReminder?: (pendingCount: number, analysisIds: string[]) => void;
  /** Max number of automatic retries on network failure. */
  maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that encapsulates the entire SSE analysis stream lifecycle:
 *   1. Starts the analysis by POSTing to `/api/analyze/stream`
 *   2. Reads the SSE stream with progress, bias, noise, error, and complete events
 *   3. Auto-retries on network failure (configurable, default 2)
 *   4. Cleans up via AbortController on unmount
 *
 * Replaces ~80 lines of inline stream-reading code in the dashboard.
 */
export function useAnalysisStream(options: StreamOptions) {
  const { stepNames, onBiasDetected, onNoiseUpdate, onOutcomeReminder, maxRetries = 2 } = options;

  const [steps, setSteps] = useState<AnalysisStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<StreamResult | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [outcomeGate, setOutcomeGate] = useState<OutcomeGateInfo | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  // Dwell-floor queue: buffered step transitions so fast nodes don't flash past.
  const stepQueueRef = useRef<Array<() => void>>([]);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStepFlushRef = useRef<number>(0);

  const enqueueStepUpdate = useCallback((apply: () => void) => {
    const now = Date.now();
    const sinceLast = now - lastStepFlushRef.current;
    const queueDepth = stepQueueRef.current.length;
    const dwell = queueDepth >= CATCHUP_THRESHOLD ? CATCHUP_DWELL_MS : MIN_STEP_DWELL_MS;

    if (sinceLast >= dwell && queueDepth === 0) {
      // No backlog and floor satisfied — apply immediately.
      apply();
      lastStepFlushRef.current = now;
      return;
    }

    stepQueueRef.current.push(apply);
    if (stepTimerRef.current) return;

    const flushNext = () => {
      const next = stepQueueRef.current.shift();
      if (!next) {
        stepTimerRef.current = null;
        return;
      }
      next();
      lastStepFlushRef.current = Date.now();
      if (stepQueueRef.current.length > 0) {
        const nextDwell =
          stepQueueRef.current.length >= CATCHUP_THRESHOLD ? CATCHUP_DWELL_MS : MIN_STEP_DWELL_MS;
        stepTimerRef.current = setTimeout(flushNext, nextDwell);
      } else {
        stepTimerRef.current = null;
      }
    };

    const delay = Math.max(0, dwell - sinceLast);
    stepTimerRef.current = setTimeout(flushNext, delay);
  }, []);

  const clearStepQueue = useCallback(() => {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    stepQueueRef.current = [];
    lastStepFlushRef.current = 0;
  }, []);

  // Store callbacks in refs to avoid recreating readStream when callers pass new arrow functions
  const onBiasDetectedRef = useRef(onBiasDetected);
  const onNoiseUpdateRef = useRef(onNoiseUpdate);
  const onOutcomeReminderRef = useRef(onOutcomeReminder);
  onBiasDetectedRef.current = onBiasDetected;
  onNoiseUpdateRef.current = onNoiseUpdate;
  onOutcomeReminderRef.current = onOutcomeReminder;

  // Initialize steps to "pending"
  const resetSteps = useCallback(() => {
    clearStepQueue();
    setSteps(stepNames.map(name => ({ name, status: 'pending' })));
    setProgress(0);
    setError(null);
    setResult(null);
    setTimedOut(false);
    lastEventIdRef.current = null;
    seenEventIdsRef.current.clear();
  }, [stepNames, clearStepQueue]);

  /**
   * Core stream reader — extracted so retries can call it recursively.
   */
  const readStream = useCallback(
    async (documentId: string, signal: AbortSignal, isRetry = false) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };

      // Include Last-Event-ID for resumption on retry
      if (isRetry && lastEventIdRef.current) {
        headers['Last-Event-ID'] = lastEventIdRef.current;
        log.info(`Resuming stream from event ID: ${lastEventIdRef.current}`);
      }

      const res = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ documentId }),
        signal,
      });

      if (!res.ok) {
        let errorMessage = `Analysis failed (${res.status})`;
        try {
          const errorData = await res.json();
          // Legacy: server no longer returns 423 for outcome gate (the gate
          // is now a non-blocking reminder delivered via SSE `outcome_reminder`
          // events). Kept for backward compatibility with older deployments.
          if (res.status === 423 && errorData.code === 'OUTCOME_GATE') {
            setOutcomeGate({
              pendingCount: errorData.pendingOutcomes,
              pendingAnalysisIds: errorData.pendingAnalysisIds || [],
              message: errorData.message || errorMessage,
            });
            // Don't throw inside the try — set message and fall through
            errorMessage = errorData.message || 'Outcome reporting required';
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch {
          /* ignore JSON parse errors — use status-based message */
        }
        throw new Error(errorMessage);
      }

      if (!res.body) {
        throw new Error('No response body from analysis endpoint');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sseReader = new SSEReader();
      let streamResult: StreamResult | null = null;
      let streamError: string | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          sseReader.processChunk(chunk, (data: unknown, eventId?: string) => {
            // Store last event ID for resumption
            if (eventId) {
              lastEventIdRef.current = eventId;

              // Skip duplicate events on resume
              if (seenEventIdsRef.current.has(eventId)) {
                log.debug(`Skipping duplicate event ID: ${eventId}`);
                return;
              }
              seenEventIdsRef.current.add(eventId);
            }

            const update = data as Record<string, unknown>;

            switch (update.type) {
              case 'step': {
                const stepName = update.step as string;
                const stepStatus = update.status as 'running' | 'complete';
                const stepDesc = update.description as string | undefined;
                const nextProgress = Math.max(0, Number(update.progress) || 0);

                enqueueStepUpdate(() => {
                  setProgress(nextProgress);
                  setSteps(prev => {
                    const existingIndex = prev.findIndex(s => s.name === stepName);
                    if (existingIndex >= 0) {
                      const next = [...prev];
                      next[existingIndex] = {
                        ...next[existingIndex],
                        status: stepStatus,
                        ...(stepDesc && { description: stepDesc }),
                      };
                      return next;
                    }
                    return [...prev, { name: stepName, description: stepDesc, status: stepStatus }];
                  });
                });
                break;
              }

              case 'bias': {
                const biasType = update.biasType as string;
                const biasResult = update.result as { severity?: string } | undefined;
                onBiasDetectedRef.current?.(biasType, biasResult?.severity ?? 'unknown');
                break;
              }

              case 'noise': {
                const noiseResult = update.result as { score?: number } | undefined;
                if (noiseResult?.score != null) {
                  onNoiseUpdateRef.current?.(noiseResult.score);
                }
                break;
              }

              case 'outcome_reminder': {
                const reminderCount = update.pendingCount as number;
                const reminderIds = (update.analysisIds as string[]) || [];
                onOutcomeReminderRef.current?.(reminderCount, reminderIds);
                break;
              }

              case 'error':
                streamError = (update.message as string) || 'Analysis failed';
                break;

              case 'complete':
                streamResult = update.result as StreamResult;
                // Flush any queued step updates immediately so the final
                // "complete" state isn't stuck waiting for the dwell floor.
                clearStepQueue();
                setSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));
                setProgress(100);
                break;
            }
          });
        }
      } catch (err) {
        // AbortError is expected during cleanup or retry
        if ((err as Error).name === 'AbortError') throw err;
        throw new Error('Connection lost during analysis');
      }

      if (streamError) throw new Error(streamError);
      if (!streamResult) throw new Error('Analysis completed but no result received');

      return streamResult;
    },
    // enqueueStepUpdate + clearStepQueue are stable (useCallback with []).
    // Listed here so the dep array is exhaustive; won't cause re-renders.
    [enqueueStepUpdate, clearStepQueue]
  );

  /**
   * Start an analysis with automatic retry on network failure.
   * Aborts automatically after STREAM_TIMEOUT_MS and sets timedOut=true
   * if all retries are exhausted.
   */
  const startAnalysis = useCallback(
    async (documentId: string): Promise<StreamResult | null> => {
      // Cancel any in-flight analysis and clear previous timeout
      abortRef.current?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const controller = new AbortController();
      abortRef.current = controller;
      retryCountRef.current = 0;

      resetSteps();
      setIsAnalyzing(true);
      setError(null);
      setTimedOut(false);
      setOutcomeGate(null);

      // Arm the global timeout — aborts the controller after STREAM_TIMEOUT_MS
      timeoutRef.current = setTimeout(() => {
        controller.abort();
      }, STREAM_TIMEOUT_MS);

      const attemptStream = async (isRetryAttempt = false): Promise<StreamResult | null> => {
        try {
          const streamResult = await readStream(documentId, controller.signal, isRetryAttempt);
          setResult(streamResult);
          return streamResult;
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            // Distinguish timeout-abort (retries exhausted) from user cancel
            if (retryCountRef.current >= maxRetries) {
              setTimedOut(true);
            }
            return null;
          }

          // Retry on network-level errors (not application errors like "Analysis failed")
          const isNetworkError = (err as Error).message === 'Connection lost during analysis';
          if (isNetworkError && retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 4000);
            log.warn(`SSE retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
            return attemptStream(true); // Pass true for retry attempts
          }

          // All retries used — treat as timed out for the UI
          if (isNetworkError) setTimedOut(true);
          throw err;
        }
      };

      try {
        return await attemptStream();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred during analysis';
        setError(message);
        return null;
      } finally {
        setIsAnalyzing(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    },
    [readStream, resetSteps, maxRetries]
  );

  /**
   * Cancel any in-flight analysis stream.
   */
  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  // Cleanup on unmount: abort any in-flight stream, clear timeout and step queue
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
  }, []);

  return {
    startAnalysis,
    cancelAnalysis,
    steps,
    progress,
    error,
    isAnalyzing,
    result,
    /** True when the stream was aborted due to timeout or exhausted retries. */
    timedOut,
    /** Non-null when the server returned a 423 outcome gate response. */
    outcomeGate,
  };
}
