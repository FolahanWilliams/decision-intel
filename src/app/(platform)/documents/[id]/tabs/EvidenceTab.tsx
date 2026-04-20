'use client';

import { ReplayTab } from './ReplayTab';
import { LogicTab } from './LogicTab';
import type { AnalysisResult, LogicalAnalysisResult } from '@/types';

interface OutcomeData {
  outcome: string;
  confirmedBiases: string[];
  falsPositiveBiases: string[];
  lessonsLearned?: string | null;
  notes?: string | null;
  impactScore?: number | null;
  mostAccurateTwin?: string | null;
}

interface EvidenceTabProps {
  analysisData: AnalysisResult;
  logicalAnalysis?: LogicalAnalysisResult;
  outcome?: OutcomeData | null;
  recalibratedDqi?: {
    originalScore: number;
    recalibratedScore: number;
    delta: number;
    recalibratedGrade: string;
    brierScore?: number;
    brierCategory?: 'excellent' | 'good' | 'fair' | 'poor';
  } | null;
}

export function EvidenceTab({
  analysisData,
  logicalAnalysis,
  outcome,
  recalibratedDqi,
}: EvidenceTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Score Waterfall Section */}
      <section>
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Score Waterfall
        </h2>
        <ReplayTab
          analysisData={analysisData}
          outcome={outcome}
          recalibratedDqi={recalibratedDqi}
        />
      </section>

      {/* Fallacy Analysis Section */}
      <section>
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Fallacy Analysis
        </h2>
        <LogicTab logicalAnalysis={logicalAnalysis} />
      </section>
    </div>
  );
}
