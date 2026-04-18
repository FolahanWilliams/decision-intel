'use client';

import { useState } from 'react';
import { useOutreachGeneration } from '@/hooks/useOutreachGeneration';
import { OutreachComposer } from '../outreach/OutreachComposer';
import { OutreachPipelineViz } from '../outreach/OutreachPipelineViz';
import { OutreachResult } from '../outreach/OutreachResult';

// Wraps the existing generator hook + composer + result surfaces in a compact
// single-column layout that fits inside an Outreach Command Center Section.
// All the heavy lifting (LinkedIn parsing, profile extraction, LLM draft, DB
// persistence) lives in /api/founder-hub/outreach/generate — this just gives
// you the form-and-result surface without leaving the outreach workflow.

interface Props {
  founderPass: string;
}

export function LinkedInOutreachGenerator({ founderPass }: Props) {
  const { state, generate, reset } = useOutreachGeneration(founderPass);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const handleGenerate = (input: Parameters<typeof generate>[0]) => {
    generate(input);
  };

  const showPipeline = state.isRunning || state.step === 'error';
  const showResult = state.result && state.step === 'done';

  return (
    <div>
      <OutreachComposer onGenerate={handleGenerate} isRunning={state.isRunning} />

      {showPipeline && (
        <div style={{ marginTop: 14 }}>
          <OutreachPipelineViz currentStep={state.step} error={state.error} />
          {state.isRunning && state.stepLabel && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--accent-primary)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {state.stepLabel}
            </div>
          )}
        </div>
      )}

      {showResult && state.result && (
        <div style={{ marginTop: 14 }}>
          <OutreachResult
            outreach={state.result}
            artifactId={state.artifactId}
            founderPass={founderPass}
            onRegenerate={reset}
            onStatusChanged={() => setRefreshSignal(v => v + 1)}
            onSavedToPipeline={() => setRefreshSignal(v => v + 1)}
          />
          {refreshSignal > 0 && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Saved. View the full history in the Outreach &amp; Meetings tab.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
