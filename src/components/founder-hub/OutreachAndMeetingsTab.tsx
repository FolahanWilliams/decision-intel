'use client';

import { useState } from 'react';
import { useOutreachGeneration } from '@/hooks/useOutreachGeneration';
import { OutreachComposer } from './outreach/OutreachComposer';
import { OutreachPipelineViz } from './outreach/OutreachPipelineViz';
import { OutreachResult } from './outreach/OutreachResult';
import { OutreachHistory } from './outreach/OutreachHistory';
import { ProspectPipeline } from './outreach/ProspectPipeline';

interface Props {
  founderPass: string;
}

export function OutreachAndMeetingsTab({ founderPass }: Props) {
  const { state, generate, reset } = useOutreachGeneration(founderPass);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [pipelineRefresh, setPipelineRefresh] = useState(0);

  const handleGenerate = (input: Parameters<typeof generate>[0]) => {
    generate(input);
  };

  const handleStatusChanged = () => {
    setHistoryRefresh(v => v + 1);
  };

  const handleSavedToPipeline = () => {
    setPipelineRefresh(v => v + 1);
  };

  const showPipeline = state.isRunning || state.step === 'error';
  const showResult = state.result && state.step === 'done';

  return (
    <div style={wrap}>
      {/* Prospect Pipeline — always visible at the top */}
      <ProspectPipeline founderPass={founderPass} refreshKey={pipelineRefresh} />

      <div style={intro}>
        <div style={kicker}>Generate Outreach</div>
        <h2 style={title}>Draft tailored messages in seconds</h2>
        <p style={subtitle}>
          Paste a LinkedIn URL or profile text, pick an intent, and get a tailored message
          backed by your positioning. Save to the pipeline above to track every prospect.
        </p>
      </div>

      <div style={grid}>
        <div>
          <OutreachComposer onGenerate={handleGenerate} isRunning={state.isRunning} />

          {showPipeline && (
            <div style={{ marginTop: 16 }}>
              <OutreachPipelineViz currentStep={state.step} error={state.error} />
              {state.isRunning && state.stepLabel && (
                <div style={activeLabel}>{state.stepLabel}</div>
              )}
            </div>
          )}

          {showResult && state.result && (
            <div style={{ marginTop: 16 }}>
              <OutreachResult
                outreach={state.result}
                artifactId={state.artifactId}
                founderPass={founderPass}
                onRegenerate={reset}
                onStatusChanged={handleStatusChanged}
                onSavedToPipeline={handleSavedToPipeline}
              />
            </div>
          )}
        </div>

        <OutreachHistory founderPass={founderPass} refreshKey={historyRefresh} />
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const intro: React.CSSProperties = {
  marginBottom: 4,
};

const kicker: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--accent-primary)',
  marginBottom: 6,
};

const title: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: 'var(--text-primary)',
  margin: '0 0 8px 0',
  letterSpacing: '-0.01em',
};

const subtitle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.55,
  margin: 0,
  maxWidth: 720,
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
  gap: 20,
  alignItems: 'start',
};

const activeLabel: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: 'var(--accent-primary)',
  fontWeight: 600,
  textAlign: 'center',
};
