'use client';

import { RedTeamView } from '../RedTeamView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CognitiveAnalysisResult } from '@/types';

interface RedTeamTabProps {
    cognitiveAnalysis?: CognitiveAnalysisResult;
}

export function RedTeamTab({ cognitiveAnalysis }: RedTeamTabProps) {
    return (
        <ErrorBoundary sectionName="Red Team Analysis">
            <div className="card">
                <div className="card-body">
                    {cognitiveAnalysis ? (
                        <RedTeamView analysis={cognitiveAnalysis} />
                    ) : (
                        <div className="text-center p-8 text-muted">No cognitive diversity analysis available.</div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}
