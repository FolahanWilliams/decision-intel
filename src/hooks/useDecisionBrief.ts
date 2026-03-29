'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SSEReader } from '@/lib/sse';
import type { DecisionBrief } from '@/lib/schemas/decision-brief';

export interface UseDecisionBriefReturn {
  brief: DecisionBrief | null;
  version: number | null;
  briefCreatedAt: Date | null;
  isStreaming: boolean;
  streamText: string;
  error: string | null;
  generateBrief: () => Promise<void>;
  loadExisting: () => Promise<void>;
}

export function useDecisionBrief(dealId: string): UseDecisionBriefReturn {
  const [brief, setBrief] = useState<DecisionBrief | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [briefCreatedAt, setBriefCreatedAt] = useState<Date | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadExisting = useCallback(async () => {
    try {
      const res = await fetch(`/api/deals/${dealId}/brief`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.brief) {
        setBrief(data.brief);
        setVersion(data.version ?? null);
        setBriefCreatedAt(data.createdAt ? new Date(data.createdAt) : null);
      }
    } catch {
      // Silent — loading existing is best-effort
    }
  }, [dealId]);

  const generateBrief = useCallback(async () => {
    if (isStreaming) return;

    setError(null);
    setStreamText('');
    setBrief(null);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/deals/${dealId}/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Brief generation failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      const sseReader = new SSEReader();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        sseReader.processChunk(chunk, (data: unknown) => {
          const event = data as Record<string, unknown>;

          if (event.type === 'chunk') {
            accumulated += (event.text as string) || '';
            setStreamText(accumulated);
          } else if (event.type === 'done') {
            const completedBrief = event.brief as DecisionBrief;
            setBrief(completedBrief);
          } else if (event.type === 'error') {
            setError((event.error as string) || 'Brief generation failed');
          }
        });
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Brief generation failed');
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [dealId, isStreaming]);

  // Load existing brief on mount
  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  // Abort on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    brief,
    version,
    briefCreatedAt,
    isStreaming,
    streamText,
    error,
    generateBrief,
    loadExisting,
  };
}
