'use client';

import { NoiseJudge } from '../NoiseJudge';
import { QualityGauge } from '@/components/visualizations/QualityMetrics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NoiseBenchmark } from '@/types';

interface NoiseTabProps {
    noiseScore: number;
    noiseStats?: { mean: number; stdDev: number; variance: number };
    noiseBenchmarks?: NoiseBenchmark[];
}

export function NoiseTab({ noiseScore, noiseStats, noiseBenchmarks }: NoiseTabProps) {
    return (
        <ErrorBoundary sectionName="Noise Analysis">
            <div className="card">
                <div className="card-body">
                    {noiseStats ? (
                        <div className="space-y-8">
                            <div className="flex justify-center gap-10">
                                <QualityGauge
                                    value={noiseScore}
                                    label="Noise Level"
                                    color="#ef4444"
                                    maxValue={100}
                                />
                                <QualityGauge
                                    value={100 - noiseScore}
                                    label="Consistency"
                                    color="#10b981"
                                    maxValue={100}
                                />
                            </div>
                            <NoiseJudge analysis={{ ...noiseStats, benchmarks: noiseBenchmarks, score: noiseScore }} />
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted">No noise analysis available.</div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}
