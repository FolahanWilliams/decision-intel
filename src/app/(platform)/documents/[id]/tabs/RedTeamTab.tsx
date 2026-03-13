'use client';

import { RedTeamView } from '../RedTeamView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CognitiveAnalysisResult } from '@/types';

interface RedTeamTabProps {
  analysisId?: string;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
  };
}

export function RedTeamTab({ analysisId, cognitiveAnalysis, preMortem }: RedTeamTabProps) {
  return (
    <ErrorBoundary sectionName="Red Team Analysis">
      <div className="card">
        <div className="card-body">
          {cognitiveAnalysis || preMortem ? (
            <RedTeamView
              analysisId={analysisId}
              analysis={cognitiveAnalysis}
              preMortem={preMortem}
            />
          ) : (
            <div className="text-center p-8 text-muted">No red team analysis available.</div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
