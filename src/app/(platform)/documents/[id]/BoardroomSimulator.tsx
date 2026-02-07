import React from 'react';
import { SimulationResult } from '@/types';
import { User, Briefcase, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface BoardroomSimulatorProps {
    simulation: SimulationResult;
}

const VOTE_COLORS = {
    'APPROVE': 'var(--success)',
    'REJECT': 'var(--error)',
    'REVISE': 'var(--warning)',
    'MIXED': 'var(--accent-primary)',
    'APPROVED': 'var(--success)', // Handle slight mismatch in overallVerdict vs twin vote
    'REJECTED': 'var(--error)'
};

const PERSONA_ICONS: Record<string, React.ReactNode> = {
    'Fiscal Conservative': <Briefcase size={24} />,
    'Aggressive Growth': <User size={24} />,
    'Compliance Guard': <Scale size={24} />
};

export function BoardroomSimulator({ simulation }: BoardroomSimulatorProps) {
    if (!simulation) {
        return <div className="text-muted text-center p-xl">Simulation data not available.</div>;
    }

    return (
        <div className="flex flex-col gap-lg animate-fade-in">
            {/* Header / Overall Verdict */}
            <div className="card" style={{ borderLeft: `4px solid ${VOTE_COLORS[simulation.overallVerdict] || 'var(--text-primary)'}` }}>
                <div className="card-body flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold mb-xs">Boardroom Verdict</h3>
                        <p className="text-muted text-sm">Consensus from 3 AI Personas</p>
                    </div>
                    <div className="text-2xl font-black" style={{ color: VOTE_COLORS[simulation.overallVerdict] }}>
                        {simulation.overallVerdict}
                    </div>
                </div>
            </div>

            {/* Twins Grid */}
            <div className="grid grid-3 gap-md">
                {simulation.twins.map((twin, idx) => (
                    <div key={idx} className="card relative overflow-hidden group hover:border-accent-primary transition-all">
                        {/* Status Stripe */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                            background: VOTE_COLORS[twin.vote]
                        }} />

                        <div className="card-body">
                            {/* Persona Header */}
                            <div className="flex items-center gap-md mb-md">
                                <div className="p-sm rounded-full bg-bg-tertiary" style={{ color: 'var(--text-primary)' }}>
                                    {PERSONA_ICONS[twin.name] || <User size={24} />}
                                </div>
                                <div>
                                    <div className="font-bold text-sm">{twin.name}</div>
                                    <div className="text-xs text-muted">{twin.role}</div>
                                </div>
                            </div>

                            {/* Vote Badge */}
                            <div className="flex items-center justify-between mb-md">
                                <span className="badge" style={{
                                    background: `${VOTE_COLORS[twin.vote]}22`,
                                    color: VOTE_COLORS[twin.vote],
                                    borderColor: VOTE_COLORS[twin.vote]
                                }}>
                                    {twin.vote === 'APPROVE' && <CheckCircle size={12} className="mr-xs" />}
                                    {twin.vote === 'REJECT' && <XCircle size={12} className="mr-xs" />}
                                    {twin.vote === 'REVISE' && <AlertTriangle size={12} className="mr-xs" />}
                                    {twin.vote}
                                </span>
                                <span className="text-xs font-mono opacity-70">
                                    {Math.round(twin.confidence)}% Conf.
                                </span>
                            </div>

                            {/* Rationale */}
                            <div className="p-sm bg-bg-tertiary rounded-md text-xs italic mb-md border-l-2 border-border" style={{ lineHeight: 1.5 }}>
                                &quot;{twin.rationale}&quot;
                            </div>

                            {/* Key Risk/Opp */}
                            {twin.keyRiskIdentified && (
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider mb-xs text-muted">
                                        Key {twin.vote === 'APPROVE' ? 'Opportunity' : 'Risk'}
                                    </div>
                                    <div className="text-xs">
                                        {twin.keyRiskIdentified}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
