'use client';

import { useCallback, useRef, useState } from 'react';
import type {
  ExtractedProfile,
  GeneratedOutreach,
  OutreachIntent,
  OutreachStreamEvent,
} from '@/lib/outreach/types';

export type OutreachStep = 'idle' | 'parse' | 'analyze' | 'match' | 'draft' | 'done' | 'error';

export interface UseOutreachGenerationState {
  step: OutreachStep;
  stepLabel: string;
  profile: ExtractedProfile | null;
  result: GeneratedOutreach | null;
  artifactId: string | null;
  error: string | null;
  isRunning: boolean;
}

export interface GenerateInput {
  url?: string;
  rawText?: string;
  intent: OutreachIntent;
  contactName?: string;
  contactTitle?: string;
  contactCompany?: string;
}

export function useOutreachGeneration(founderPass: string) {
  const [state, setState] = useState<UseOutreachGenerationState>({
    step: 'idle',
    stepLabel: '',
    profile: null,
    result: null,
    artifactId: null,
    error: null,
    isRunning: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      step: 'idle',
      stepLabel: '',
      profile: null,
      result: null,
      artifactId: null,
      error: null,
      isRunning: false,
    });
  }, []);

  const generate = useCallback(
    async (input: GenerateInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        step: 'parse',
        stepLabel: 'Parsing profile...',
        profile: null,
        result: null,
        artifactId: null,
        error: null,
        isRunning: true,
      });

      try {
        const res = await fetch('/api/founder-hub/outreach/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-pass': founderPass,
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Request failed with status ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            const dataLine = frame.split('\n').find(l => l.startsWith('data:'));
            if (!dataLine) continue;
            const raw = dataLine.slice(5).trim();
            if (!raw) continue;

            let event: OutreachStreamEvent;
            try {
              event = JSON.parse(raw) as OutreachStreamEvent;
            } catch {
              continue;
            }

            setState(prev => applyEvent(prev, event));
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          step: 'error',
          stepLabel: '',
          error: msg,
          isRunning: false,
        }));
      }
    },
    [founderPass]
  );

  return { state, generate, reset };
}

function applyEvent(
  prev: UseOutreachGenerationState,
  event: OutreachStreamEvent
): UseOutreachGenerationState {
  switch (event.type) {
    case 'step':
      return { ...prev, step: event.step, stepLabel: event.label };
    case 'profile':
      return { ...prev, profile: event.profile };
    case 'result':
      return {
        ...prev,
        result: event.outreach,
        artifactId: event.artifactId || null,
        profile: event.outreach.profile,
      };
    case 'done':
      return { ...prev, step: 'done', stepLabel: '', isRunning: false };
    case 'error':
      return {
        ...prev,
        step: 'error',
        stepLabel: '',
        error: event.message,
        isRunning: false,
      };
    default:
      return prev;
  }
}
