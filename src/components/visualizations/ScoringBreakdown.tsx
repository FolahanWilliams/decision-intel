'use client';

import { Activity, GitBranch, TrendingUp, TrendingDown, Shield, Zap } from 'lucide-react';

interface CompoundScoringData {
  calibratedScore: number;
  compoundMultiplier: number;
  contextAdjustment: number;
  confidenceDecay: number;
  amplifyingInteractions: Array<{
    bias: string;
    multiplier: number;
    interactions: string[];
  }>;
  adjustments: Array<{
    source: string;
    delta: number;
    description: string;
  }>;
}

interface BayesianPriorsData {
  adjustedScore: number;
  beliefDelta: number;
  informationGain: number;
  priorInfluence: number;
  biasAdjustments: Array<{
    biasType: string;
    priorConfidence: number;
    posteriorConfidence: number;
    direction: string;
    reason: string;
  }>;
}

interface ScoringBreakdownProps {
  compoundScoring?: CompoundScoringData;
  bayesianPriors?: BayesianPriorsData;
  overallScore: number;
}

function formatBiasName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function MultiplierBadge({ value }: { value: number }) {
  const isAmplifying = value > 1.05;
  const isDampening = value < 0.95;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isAmplifying
          ? 'bg-red-500/15 text-red-400'
          : isDampening
            ? 'bg-green-500/15 text-green-400'
            : 'bg-zinc-500/15 text-zinc-400'
      }`}
    >
      {isAmplifying ? <TrendingUp className="h-3 w-3" /> : isDampening ? <TrendingDown className="h-3 w-3" /> : null}
      {value.toFixed(2)}x
    </span>
  );
}

export function ScoringBreakdown({ compoundScoring, bayesianPriors, overallScore: _overallScore }: ScoringBreakdownProps) {
  if (!compoundScoring && !bayesianPriors) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Scoring Breakdown</h3>
      </div>

      {/* Compound Scoring Section */}
      {compoundScoring && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4" />
            Compound Scoring Engine
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Calibrated Score</div>
              <div className="text-xl font-bold">{compoundScoring.calibratedScore.toFixed(1)}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Compound Multiplier</div>
              <div className="text-xl font-bold">
                <MultiplierBadge value={compoundScoring.compoundMultiplier} />
              </div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Context Adjustment</div>
              <div className="text-xl font-bold">
                {compoundScoring.contextAdjustment > 0 ? '+' : ''}
                {compoundScoring.contextAdjustment.toFixed(1)}
              </div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Confidence Decay</div>
              <div className="text-xl font-bold">{(compoundScoring.confidenceDecay * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* Amplifying Interactions */}
          {compoundScoring.amplifyingInteractions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                <GitBranch className="h-4 w-4" />
                Amplifying Bias Interactions ({compoundScoring.amplifyingInteractions.length})
              </div>
              <div className="space-y-2">
                {compoundScoring.amplifyingInteractions.map((interaction, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium">{formatBiasName(interaction.bias)}</span>
                      {interaction.interactions.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          interacts with {interaction.interactions.map(formatBiasName).join(', ')}
                        </span>
                      )}
                    </div>
                    <MultiplierBadge value={interaction.multiplier} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context Adjustments */}
          {compoundScoring.adjustments.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Context Adjustments</div>
              {compoundScoring.adjustments.map((adj, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{adj.description}</span>
                  <span className={adj.delta > 0 ? 'text-red-400' : adj.delta < 0 ? 'text-green-400' : 'text-zinc-400'}>
                    {adj.delta > 0 ? '+' : ''}{adj.delta.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bayesian Priors Section */}
      {bayesianPriors && (
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="h-4 w-4" />
            Bayesian Prior Integration
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Adjusted Score</div>
              <div className="text-xl font-bold">{bayesianPriors.adjustedScore.toFixed(1)}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Belief Delta</div>
              <div className={`text-xl font-bold ${bayesianPriors.beliefDelta > 0 ? 'text-green-400' : bayesianPriors.beliefDelta < 0 ? 'text-red-400' : ''}`}>
                {bayesianPriors.beliefDelta > 0 ? '+' : ''}
                {bayesianPriors.beliefDelta.toFixed(2)}
              </div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Info Gain (KL)</div>
              <div className="text-xl font-bold">{bayesianPriors.informationGain.toFixed(3)}</div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="text-xs text-muted-foreground">Prior Influence</div>
              <div className="text-xl font-bold">{(bayesianPriors.priorInfluence * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* Per-Bias Prior vs Posterior */}
          {bayesianPriors.biasAdjustments.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Prior → Posterior Confidence</div>
              {bayesianPriors.biasAdjustments.map((adj, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate font-medium">{formatBiasName(adj.biasType)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-zinc-800">
                        <div
                          className="h-2 rounded-full bg-zinc-500"
                          style={{ width: `${adj.priorConfidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">→</span>
                      <div className="h-2 flex-1 rounded-full bg-zinc-800">
                        <div
                          className={`h-2 rounded-full ${adj.posteriorConfidence > adj.priorConfidence ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${adj.posteriorConfidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs text-muted-foreground">
                    {(adj.priorConfidence * 100).toFixed(0)}% → {(adj.posteriorConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
