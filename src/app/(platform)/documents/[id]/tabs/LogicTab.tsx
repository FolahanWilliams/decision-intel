'use client';

import { FallacyList } from '../FallacyList';
import { LogicalAnalysisResult } from '@/types';

interface LogicTabProps {
    logicalAnalysis?: LogicalAnalysisResult;
}

export function LogicTab({ logicalAnalysis }: LogicTabProps) {
    return (
        <div className="card">
            <div className="card-body">
                {logicalAnalysis ? (
                    <FallacyList data={logicalAnalysis} />
                ) : (
                    <div className="text-center p-8 text-muted">No logical analysis data available.</div>
                )}
            </div>
        </div>
    );
}
