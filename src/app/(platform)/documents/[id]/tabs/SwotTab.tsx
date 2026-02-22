'use client';

import { SwotMatrix } from '../SwotMatrix';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SwotAnalysisResult } from '@/types';

interface SwotTabProps {
    swotAnalysis?: SwotAnalysisResult;
}

export function SwotTab({ swotAnalysis }: SwotTabProps) {
    return (
        <ErrorBoundary sectionName="SWOT Analysis">
            <div className="card">
                <div className="card-body">
                    {swotAnalysis ? (
                        <SwotMatrix data={swotAnalysis} />
                    ) : (
                        <div className="text-center p-8 text-muted">No SWOT analysis data available.</div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}
