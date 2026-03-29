'use client';

import { ReplayTab } from './ReplayTab';
import { LogicTab } from './LogicTab';
import type { AnalysisResult, LogicalAnalysisResult } from '@/types';

interface EvidenceTabProps {
  analysisData: AnalysisResult;
  logicalAnalysis?: LogicalAnalysisResult;
}

export function EvidenceTab({ analysisData, logicalAnalysis }: EvidenceTabProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Score Waterfall Section */}
      <section>
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
          Score Waterfall
        </h2>
        <ReplayTab analysisData={analysisData} />
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
