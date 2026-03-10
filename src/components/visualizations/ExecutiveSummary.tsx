'use client';

import { AlertTriangle, Brain, Activity } from 'lucide-react';
import { ScoreCard } from './QualityMetrics';

interface ExecutiveSummaryProps {
    overallScore: number;
    noiseScore: number;
    biasCount: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    verdict?: 'APPROVED' | 'REJECTED' | 'MIXED';
}

export function ExecutiveSummary({
    overallScore,
    noiseScore,
    biasCount,
    riskLevel,
    summary,
    verdict
}: ExecutiveSummaryProps) {

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return 'text-success';
            case 'medium': return 'text-warning';
            case 'high': return 'text-accent-primary';
            case 'critical': return 'text-error';
            default: return 'text-muted';
        }
    };

    const getVerdictBadge = (verdict?: string) => {
        if (!verdict) return null;
        const styles = {
            APPROVED: 'bg-success/20 text-success border-success/30',
            REJECTED: 'bg-error/20 text-error border-error/30',
            MIXED: 'bg-warning/20 text-warning border-warning/30',
        };
        return (
            <span className={`px-3 py-1 text-xs font-bold border ${styles[verdict as keyof typeof styles] || ''}`}>
                {verdict}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Executive Summary</h2>
                    <p className="text-muted text-sm">AI-driven analysis of decision quality and risk</p>
                </div>
                {getVerdictBadge(verdict)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <ScoreCard
                    title="Decision Quality"
                    score={overallScore}
                    description="Overall assessment of logic, evidence, and coherence."
                    severity={overallScore > 80 ? 'success' : overallScore > 60 ? 'warning' : 'error'}
                    trend="up"
                    trendValue="5%"
                />

                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-secondary/20 border border-border flex flex-col items-center justify-center text-center">
                        <Brain className="w-8 h-8 text-accent-secondary mb-2" />
                        <span className="text-2xl font-bold">{biasCount}</span>
                        <span className="text-xs text-muted tracking-wide">Cognitive Biases</span>
                    </div>

                    <div className="p-4 bg-secondary/20 border border-border flex flex-col items-center justify-center text-center">
                        <Activity className="w-8 h-8 text-accent-secondary mb-2" />
                        <span className="text-2xl font-bold">{noiseScore.toFixed(1)}</span>
                        <span className="text-xs text-muted tracking-wide">Noise Score</span>
                    </div>

                    <div className="p-4 bg-secondary/20 border border-border flex flex-col items-center justify-center text-center">
                        <AlertTriangle className={`w-8 h-8 mb-2 ${getRiskColor(riskLevel)}`} />
                        <span className={`text-2xl font-bold capitalize ${getRiskColor(riskLevel)}`}>{riskLevel}</span>
                        <span className="text-xs text-muted tracking-wide">Risk Level</span>
                    </div>
                </div>
            </div>

            <div className="p-6 bg-secondary/10 border border-border">
                <h3 className="text-sm font-medium text-muted tracking-wide mb-3">Analysis Synthesis</h3>
                <p className="leading-relaxed text-foreground/90">{summary}</p>
            </div>
        </div>
    );
}
