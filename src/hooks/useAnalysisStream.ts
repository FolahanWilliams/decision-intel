'use client';

import { useState, useCallback, useRef } from 'react';
import { SSEReader } from '@/lib/sse';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalysisStep {
    name: string;
    status: 'pending' | 'running' | 'complete';
    icon?: React.ReactNode;
}

interface StreamResult {
    overallScore?: number;
    [key: string]: unknown;
}

interface StreamOptions {
    /** Pre-configured analysis step names (used for the progress UI). */
    stepNames: string[];
    /** Called when a bias is detected in real-time. */
    onBiasDetected?: (biasType: string, severity: string) => void;
    /** Called when the noise score is emitted. */
    onNoiseUpdate?: (score: number) => void;
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
    const { stepNames, onBiasDetected, onNoiseUpdate, maxRetries = 2 } = options;

    const [steps, setSteps] = useState<AnalysisStep[]>([]);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<StreamResult | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const retryCountRef = useRef(0);

    // Initialize steps to "pending"
    const resetSteps = useCallback(() => {
        setSteps(stepNames.map(name => ({ name, status: 'pending' })));
        setProgress(0);
        setError(null);
        setResult(null);
    }, [stepNames]);

    /**
     * Core stream reader — extracted so retries can call it recursively.
     */
    const readStream = useCallback(async (documentId: string, signal: AbortSignal) => {
        const res = await fetch('/api/analyze/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId }),
            signal,
        });

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
                sseReader.processChunk(chunk, (data: unknown) => {
                    const update = data as Record<string, unknown>;

                    switch (update.type) {
                        case 'step': {
                            const stepName = update.step as string;
                            const stepStatus = update.status as 'running' | 'complete';
                            setProgress(Math.max(0, Number(update.progress) || 0));

                            setSteps(prev => prev.map(s => ({
                                ...s,
                                status: s.name === stepName
                                    ? stepStatus
                                    : s.status === 'complete' ? 'complete' : s.status
                            })));
                            break;
                        }

                        case 'bias': {
                            const biasType = update.biasType as string;
                            const biasResult = update.result as { severity?: string } | undefined;
                            onBiasDetected?.(biasType, biasResult?.severity ?? 'unknown');
                            break;
                        }

                        case 'noise': {
                            const noiseResult = update.result as { score?: number } | undefined;
                            if (noiseResult?.score != null) {
                                onNoiseUpdate?.(noiseResult.score);
                            }
                            break;
                        }

                        case 'error':
                            streamError = (update.message as string) || 'Analysis failed';
                            break;

                        case 'complete':
                            streamResult = update.result as StreamResult;
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
    }, [onBiasDetected, onNoiseUpdate]);

    /**
     * Start an analysis with automatic retry on network failure.
     */
    const startAnalysis = useCallback(async (documentId: string): Promise<StreamResult | null> => {
        // Cancel any in-flight analysis
        abortRef.current?.abort();

        const controller = new AbortController();
        abortRef.current = controller;
        retryCountRef.current = 0;

        resetSteps();
        setIsAnalyzing(true);
        setError(null);

        const attemptStream = async (): Promise<StreamResult | null> => {
            try {
                const streamResult = await readStream(documentId, controller.signal);
                setResult(streamResult);
                return streamResult;
            } catch (err) {
                if ((err as Error).name === 'AbortError') return null;

                // Retry on network-level errors (not application errors like "Analysis failed")
                const isNetworkError = (err as Error).message === 'Connection lost during analysis';
                if (isNetworkError && retryCountRef.current < maxRetries) {
                    retryCountRef.current++;
                    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 4000);
                    console.warn(`SSE retry ${retryCountRef.current}/${maxRetries} in ${delay}ms`);
                    await new Promise(r => setTimeout(r, delay));
                    return attemptStream();
                }

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
        }
    }, [readStream, resetSteps, maxRetries]);

    /**
     * Cancel any in-flight analysis stream.
     */
    const cancelAnalysis = useCallback(() => {
        abortRef.current?.abort();
        setIsAnalyzing(false);
    }, []);

    return {
        startAnalysis,
        cancelAnalysis,
        steps,
        progress,
        error,
        isAnalyzing,
        result,
    };
}
