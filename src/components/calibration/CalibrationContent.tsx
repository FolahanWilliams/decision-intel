'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { CalibrationProfile } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { formatBiasName } from '@/lib/utils/labels';

function TrendIcon({ trend }: { trend: 'increasing' | 'decreasing' | 'stable' }) {
  if (trend === 'decreasing') return <TrendingDown size={12} className="text-emerald-400" />;
  if (trend === 'increasing') return <TrendingUp size={12} className="text-red-400" />;
  return <Minus size={12} className="text-zinc-400" />;
}

export function CalibrationContent() {
  const [profile, setProfile] = useState<CalibrationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/calibration/profile');
        if (!res.ok) throw new Error('Failed to load calibration data');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load calibration data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 size={24} className="animate-spin text-muted" />
        <span className="ml-2 text-muted">Loading calibration profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-l-4 border-l-red-500">
        <div className="card-body">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.totalDecisions === 0) {
    return (
      <div className="card mt-6">
        <div className="card-body text-center p-12">
          <Brain size={48} className="mx-auto mb-4 text-muted" />
          <h2 className="text-lg font-semibold mb-2">No Decision History Yet</h2>
          <p className="text-sm text-muted mb-4">
            Analyze documents and report outcomes to build your personal calibration profile.
            Klein&apos;s RPD framework requires pattern history to surface useful insights.
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const scoreColor =
    profile.calibrationScore >= 70
      ? 'text-emerald-400'
      : profile.calibrationScore >= 40
        ? 'text-amber-400'
        : 'text-red-400';

  const totalOutcomes =
    profile.outcomeRate.success + profile.outcomeRate.failure + profile.outcomeRate.mixed;

  return (
    <>
      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-6">
        <ErrorBoundary sectionName="Calibration Score">
          <div className="card">
            <div className="card-header flex flex-row items-center justify-between pb-2">
              <h4 className="text-sm font-medium">Calibration Score</h4>
              <Target size={16} className={scoreColor} />
            </div>
            <div className="card-body">
              <div className={`text-3xl font-bold ${scoreColor}`}>{profile.calibrationScore}</div>
              <p className="text-xs text-muted">
                {profile.calibrationScore >= 70
                  ? 'Well-calibrated'
                  : profile.calibrationScore >= 40
                    ? 'Developing'
                    : 'Needs attention'}
              </p>
              <div className="mt-2 h-2 bg-muted/20 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    profile.calibrationScore >= 70
                      ? 'bg-emerald-500'
                      : profile.calibrationScore >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${profile.calibrationScore}%` }}
                />
              </div>
            </div>
          </div>
        </ErrorBoundary>

        <div className="card">
          <div className="card-header flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Total Decisions</h4>
            <Brain size={16} className="text-blue-400" />
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-400">{profile.totalDecisions}</div>
            <p className="text-xs text-muted">Analyses performed</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Outcomes Reported</h4>
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-emerald-400">{totalOutcomes}</div>
            <p className="text-xs text-muted">
              {totalOutcomes > 0
                ? `${Math.round((profile.outcomeRate.success / totalOutcomes) * 100)}% success rate`
                : 'Report outcomes to unlock insights'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Blind Spots</h4>
            <AlertTriangle size={16} className="text-orange-400" />
          </div>
          <div className="card-body">
            <div className="text-3xl font-bold text-orange-400">
              {profile.patternBlindSpots.length}
            </div>
            <p className="text-xs text-muted">Persistent patterns to watch</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Recurring Biases */}
        <ErrorBoundary sectionName="Recurring Biases">
          <div className="card">
            <div className="card-header">
              <h4 className="text-sm font-semibold">Recurring Biases</h4>
              <p className="text-xs text-muted mt-1">
                Most frequent biases across your decisions, with trend direction
              </p>
            </div>
            <div className="card-body">
              {profile.recurringBiases.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Not enough data yet. Analyze more documents to see patterns.
                </p>
              ) : (
                <div className="space-y-2">
                  {profile.recurringBiases.map((bias, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {formatBiasName(bias.biasType)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted font-mono">{bias.frequency}x</span>
                        <div className="flex items-center gap-1">
                          <TrendIcon trend={bias.trend} />
                          <span
                            className={`text-[10px] ${
                              bias.trend === 'decreasing'
                                ? 'text-emerald-400'
                                : bias.trend === 'increasing'
                                  ? 'text-red-400'
                                  : 'text-zinc-400'
                            }`}
                          >
                            {bias.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>

        {/* Outcome Distribution */}
        <ErrorBoundary sectionName="Outcome Distribution">
          <div className="card">
            <div className="card-header">
              <h4 className="text-sm font-semibold">Outcome Distribution</h4>
              <p className="text-xs text-muted mt-1">
                How your decisions have played out over time
              </p>
            </div>
            <div className="card-body">
              {totalOutcomes === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No outcomes reported yet. Report decision outcomes to build your calibration
                  curve.
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Visual bar */}
                  <div className="h-8 flex overflow-hidden">
                    {profile.outcomeRate.success > 0 && (
                      <div
                        className="bg-emerald-500 flex items-center justify-center"
                        style={{
                          width: `${(profile.outcomeRate.success / totalOutcomes) * 100}%`,
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {profile.outcomeRate.success}
                        </span>
                      </div>
                    )}
                    {profile.outcomeRate.mixed > 0 && (
                      <div
                        className="bg-amber-500 flex items-center justify-center"
                        style={{
                          width: `${(profile.outcomeRate.mixed / totalOutcomes) * 100}%`,
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {profile.outcomeRate.mixed}
                        </span>
                      </div>
                    )}
                    {profile.outcomeRate.failure > 0 && (
                      <div
                        className="bg-red-500 flex items-center justify-center"
                        style={{
                          width: `${(profile.outcomeRate.failure / totalOutcomes) * 100}%`,
                        }}
                      >
                        <span className="text-[10px] font-bold text-white">
                          {profile.outcomeRate.failure}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-400">
                        {profile.outcomeRate.success}
                      </div>
                      <span className="text-[10px] text-muted">Success</span>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-amber-400">
                        {profile.outcomeRate.mixed}
                      </div>
                      <span className="text-[10px] text-muted">Mixed</span>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-400">
                        {profile.outcomeRate.failure}
                      </div>
                      <span className="text-[10px] text-muted">Failure</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>

        {/* Pattern Blind Spots */}
        <ErrorBoundary sectionName="Pattern Blind Spots">
          <div className="card">
            <div className="card-header">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={14} className="text-orange-400" />
                Pattern Blind Spots
              </h4>
              <p className="text-xs text-muted mt-1">
                Biases that persist across your decisions without improvement
              </p>
            </div>
            <div className="card-body">
              {profile.patternBlindSpots.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  No persistent blind spots detected. Keep analyzing and reporting outcomes.
                </p>
              ) : (
                <div className="space-y-2">
                  {profile.patternBlindSpots.map((spot, i) => (
                    <div key={i} className="p-3 bg-orange-500/5 border border-orange-500/20">
                      <span className="text-xs font-medium text-orange-400 capitalize">{spot}</span>
                      <p className="text-[10px] text-muted mt-1">
                        This bias appears frequently in your analyses and is not trending downward.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>

        {/* Strength Patterns */}
        <ErrorBoundary sectionName="Strength Patterns">
          <div className="card">
            <div className="card-header">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle size={14} className="text-emerald-400" />
                Strength Patterns
              </h4>
              <p className="text-xs text-muted mt-1">
                Areas where your decision-making is improving
              </p>
            </div>
            <div className="card-body">
              {profile.strengthPatterns.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Keep analyzing and reporting outcomes to discover your strengths.
                </p>
              ) : (
                <div className="space-y-2">
                  {profile.strengthPatterns.map((strength, i) => (
                    <div key={i} className="p-3 bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-xs font-medium text-emerald-400 capitalize">
                        {strength}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </>
  );
}
