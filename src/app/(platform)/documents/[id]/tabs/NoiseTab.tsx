'use client';

import { NoiseJudge } from '../NoiseJudge';
import { AnimatedNoiseGauge } from '@/components/visualizations/AnimatedNoiseGauge';
import { ClaimDeviationScatter } from '@/components/visualizations/ClaimDeviationScatter';
import { NoiseDecomposition } from '@/components/visualizations/NoiseDecomposition';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NoiseBenchmark } from '@/types';

interface NoiseTabProps {
  noiseScore: number;
  noiseStats?: { mean: number; stdDev: number; variance: number };
  noiseBenchmarks?: NoiseBenchmark[];
}

export function NoiseTab({ noiseScore, noiseStats, noiseBenchmarks }: NoiseTabProps) {
  if (!noiseStats) {
    return (
      <ErrorBoundary sectionName="Noise Analysis">
        <div className="card">
          <div className="card-body">
            <div className="text-center p-8 text-muted">No noise analysis available.</div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const benchmarks = noiseBenchmarks || [];

  return (
    <ErrorBoundary sectionName="Noise Analysis">
      <div className="flex flex-col gap-lg">
        {/* 1. Animated Gauges */}
        <div className="card">
          <div className="card-header">
            <h4>Noise & Consistency Overview</h4>
          </div>
          <div className="card-body">
            <AnimatedNoiseGauge
              noiseScore={noiseScore}
              consistencyScore={100 - noiseScore}
            />
          </div>
        </div>

        {/* 2. Claim Deviation Scatter + Noise Decomposition side by side */}
        {benchmarks.length > 0 && (
          <ErrorBoundary sectionName="Noise Visualizations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
              <div className="card">
                <div className="card-header">
                  <h4>Document vs Market Claims</h4>
                </div>
                <div className="card-body">
                  <ClaimDeviationScatter benchmarks={benchmarks} />
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h4>Noise Sources</h4>
                </div>
                <div className="card-body">
                  <NoiseDecomposition
                    benchmarks={benchmarks}
                    noiseScore={noiseScore}
                  />
                </div>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* 3. Market Reality Check Table (existing NoiseJudge) */}
        <div className="card">
          <div className="card-body">
            <NoiseJudge
              analysis={{ ...noiseStats, benchmarks: noiseBenchmarks, score: noiseScore }}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
