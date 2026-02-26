'use client';

import { BoardroomSimulator } from '../BoardroomSimulator';
import { StakeholderMap } from '@/components/visualizations/StakeholderMap';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Twin {
    name: string;
    role: string;
    vote: 'APPROVE' | 'REJECT' | 'REVISE';
    confidence: number;
    rationale: string;
    keyRiskIdentified?: string;
    feedback?: string;
}

interface BoardroomTabProps {
    simulation?: {
        overallVerdict: 'APPROVED' | 'REJECTED' | 'MIXED';
        twins: Twin[];
    };
}

export function BoardroomTab({ simulation }: BoardroomTabProps) {
    return (
        <ErrorBoundary sectionName="Boardroom Simulation">
            <div className="card">
                <div className="card-body">
                    {simulation ? (
                        <div className="space-y-6">
                            <BoardroomSimulator simulation={simulation} />
                            <div className="card border-t border-border mt-6">
                                <div className="card-header">
                                    <h4>Stakeholder Alignment Map</h4>
                                </div>
                                <div className="card-body">
                                    <StakeholderMap stakeholders={simulation.twins?.map((t) => ({
                                        id: t.name,
                                        name: t.name,
                                        role: t.role,
                                        influence: Math.round(t.confidence || 50),
                                        interest: 70,
                                        stance: t.vote === 'APPROVE' ? 'supportive' : t.vote === 'REJECT' ? 'opposed' : 'neutral',
                                        keyConcerns: [t.keyRiskIdentified || t.rationale?.substring(0, 80) || 'No specific concerns noted'].filter(Boolean)
                                    })) || []} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted">Run &quot;Live Scan&quot; to convene the Virtual Board.</div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}
