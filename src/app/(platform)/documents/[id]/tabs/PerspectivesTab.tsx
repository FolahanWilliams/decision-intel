'use client';

import { useState } from 'react';
import { CognitiveAnalysisResult } from '@/types';
import { RedTeamTab } from './RedTeamTab';
import { BoardroomTab } from './BoardroomTab';
import { SimulatorTab } from './SimulatorTab';

type SubView = 'adversarial' | 'boardroom' | 'what-if';

interface PerspectivesTabProps {
  // Red Team props
  analysisId?: string;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
    imageUrl?: string | null;
  };
  // Boardroom props
  simulation?: any;
  orgId?: string;
  hasOutcome?: boolean;
  // Simulator props
  documentContent: string;
  documentId: string;
  originalScore?: number;
  originalNoiseScore?: number;
  originalBiasCount?: number;
  originalBiasTypes?: string[];
}

const SUB_VIEWS: { key: SubView; label: string }[] = [
  { key: 'adversarial', label: 'Adversarial' },
  { key: 'boardroom', label: 'Boardroom' },
  { key: 'what-if', label: 'What-If' },
];

export function PerspectivesTab({
  analysisId,
  cognitiveAnalysis,
  preMortem,
  simulation,
  orgId,
  hasOutcome,
  documentContent,
  documentId,
  originalScore,
  originalNoiseScore,
  originalBiasCount,
  originalBiasTypes,
}: PerspectivesTabProps) {
  const [subView, setSubView] = useState<SubView>('adversarial');

  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          gap: 2,
          padding: 3,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 16,
        }}
      >
        {SUB_VIEWS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubView(key)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: subView === key ? 600 : 400,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: subView === key ? 'var(--accent-primary)' : 'transparent',
              color: subView === key ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {subView === 'adversarial' && (
        <RedTeamTab
          analysisId={analysisId}
          cognitiveAnalysis={cognitiveAnalysis}
          preMortem={preMortem}
        />
      )}

      {subView === 'boardroom' && (
        <BoardroomTab simulation={simulation} orgId={orgId} hasOutcome={hasOutcome} />
      )}

      {subView === 'what-if' && (
        <SimulatorTab
          documentContent={documentContent}
          documentId={documentId}
          originalScore={originalScore}
          originalNoiseScore={originalNoiseScore}
          originalBiasCount={originalBiasCount ?? 0}
          originalBiasTypes={originalBiasTypes}
        />
      )}
    </div>
  );
}
