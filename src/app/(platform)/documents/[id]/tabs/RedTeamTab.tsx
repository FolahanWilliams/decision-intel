'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CounterArgumentStrength } from '@/components/visualizations/CounterArgumentStrength';
import { BlindSpotNetwork } from '@/components/visualizations/BlindSpotNetwork';
import { PreMortemScenarioCards } from '@/components/visualizations/PreMortemScenarioCards';
import { MitigationStrategyBuilder } from '@/components/visualizations/MitigationStrategyBuilder';
import { CognitiveAnalysisResult } from '@/types';
import {
  ShieldAlert,
  EyeOff,
  AlertTriangle,
  Shield,
  Skull,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useToast } from '@/components/ui/EnhancedToast';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('RedTeamTab');

interface RedTeamTabProps {
  analysisId?: string;
  cognitiveAnalysis?: CognitiveAnalysisResult;
  preMortem?: {
    failureScenarios: string[];
    preventiveMeasures: string[];
    inversion?: string[];
    redTeam?: Array<{
      objection: string;
      targetClaim: string;
      reasoning: string;
    }>;
  };
}

type RedTeamView = 'overview' | 'network' | 'counter' | 'mitigate' | 'premortem';

const VIEWS: {
  id: RedTeamView;
  label: string;
  icon: typeof ShieldAlert;
  needs: 'cognitive' | 'premortem' | 'either';
}[] = [
  { id: 'overview', label: 'Overview', icon: ShieldAlert, needs: 'either' },
  { id: 'network', label: 'Blind Spots', icon: EyeOff, needs: 'cognitive' },
  { id: 'counter', label: 'Challenges', icon: AlertTriangle, needs: 'cognitive' },
  { id: 'mitigate', label: 'Mitigate', icon: Shield, needs: 'cognitive' },
  { id: 'premortem', label: 'Pre-Mortem', icon: Skull, needs: 'premortem' },
];

export function RedTeamTab({ analysisId, cognitiveAnalysis, preMortem }: RedTeamTabProps) {
  const [activeView, setActiveView] = useState<RedTeamView>('overview');
  const { showToast } = useToast();
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'unhelpful' | null>(null);

  if (!cognitiveAnalysis && !preMortem) {
    return (
      <ErrorBoundary sectionName="Red Team Analysis">
        <div className="card">
          <div className="card-body">
            <div className="text-center p-8 text-muted">No red team analysis available.</div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const blindSpotGap = cognitiveAnalysis?.blindSpotGap ?? 0;
  const blindSpots = cognitiveAnalysis?.blindSpots ?? [];
  const counterArguments = cognitiveAnalysis?.counterArguments ?? [];

  const gapColor =
    blindSpotGap < 50 ? 'text-red-600 dark:text-red-400' : blindSpotGap < 80 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
  const gapLabel =
    blindSpotGap < 50
      ? 'Tunnel Vision Detected'
      : blindSpotGap < 80
        ? 'Moderate Diversity'
        : 'Balanced Perspective';

  const availableViews = VIEWS.filter(v => {
    if (v.needs === 'cognitive') return !!cognitiveAnalysis;
    if (v.needs === 'premortem') return !!preMortem;
    return true;
  });

  const handleFeedback = async (rating: number) => {
    if (!analysisId) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'preMortem', analysisId, rating }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setFeedbackGiven(rating > 0 ? 'helpful' : 'unhelpful');
      showToast('Thank you for your feedback', 'success');
    } catch (error) {
      log.error('Feedback error:', error);
      showToast('Failed to submit feedback', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <ErrorBoundary sectionName="Red Team Analysis">
      <div className="flex flex-col gap-lg">
        {/* View switcher */}
        <div className="card">
          <div className="card-body p-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {availableViews.map(view => {
                const Icon = view.icon;
                const isActive = activeView === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                      isActive
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'text-muted hover:text-foreground hover:bg-muted/10 border border-transparent'
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon size={14} />
                    {view.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overview */}
        {activeView === 'overview' && (
          <>
            {/* Score card */}
            {cognitiveAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="card">
                  <div className="card-header flex flex-row items-center justify-between pb-2">
                    <h4 className="text-sm font-medium">Cognitive Diversity</h4>
                    <ShieldAlert size={16} className={gapColor} />
                  </div>
                  <div className="card-body">
                    <div className={`text-2xl font-bold ${gapColor}`}>{blindSpotGap}/100</div>
                    <p className="text-xs text-muted">{gapLabel}</p>
                    <div className="mt-2 h-2 bg-muted/20 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          blindSpotGap < 50
                            ? 'bg-red-500'
                            : blindSpotGap < 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${blindSpotGap}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header flex flex-row items-center justify-between pb-2">
                    <h4 className="text-sm font-medium">Blind Spots</h4>
                    <EyeOff size={16} className="text-orange-400" />
                  </div>
                  <div className="card-body">
                    <div className="text-2xl font-bold text-orange-400">{blindSpots.length}</div>
                    <p className="text-xs text-muted">Missing perspectives</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header flex flex-row items-center justify-between pb-2">
                    <h4 className="text-sm font-medium">Challenges</h4>
                    <AlertTriangle size={16} className="text-red-400" />
                  </div>
                  <div className="card-body">
                    <div className="text-2xl font-bold text-red-400">{counterArguments.length}</div>
                    <p className="text-xs text-muted">
                      Avg strength:{' '}
                      {counterArguments.length > 0
                        ? Math.round(
                            (counterArguments.reduce((s, a) => s + a.confidence, 0) /
                              counterArguments.length) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick view of blind spots */}
            {blindSpots.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h4 className="flex items-center gap-2">
                    <EyeOff size={14} className="text-orange-400" />
                    Blind Spots
                  </h4>
                </div>
                <div className="card-body grid gap-3 md:grid-cols-2">
                  {blindSpots.map((spot, i) => (
                    <div key={i} className="p-3 border border-border bg-orange-500/5">
                      <span className="text-xs font-semibold text-orange-400">{spot.name}</span>
                      <p className="text-[11px] text-muted mt-1">{spot.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick top-3 counter-arguments */}
            {counterArguments.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h4 className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-400" />
                    Top Challenges
                  </h4>
                </div>
                <div className="card-body space-y-2">
                  {[...counterArguments]
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 3)
                    .map((arg, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 border border-border bg-card/50"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-foreground">
                            {arg.perspective}
                          </span>
                          <p className="text-[11px] text-muted line-clamp-1">{arg.argument}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16 h-1.5 bg-muted/20 overflow-hidden">
                            <div
                              className={`h-full ${
                                arg.confidence >= 0.7
                                  ? 'bg-red-500'
                                  : arg.confidence >= 0.4
                                    ? 'bg-amber-500'
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${arg.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums text-muted">
                            {Math.round(arg.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  {counterArguments.length > 3 && (
                    <button
                      onClick={() => setActiveView('counter')}
                      className="w-full text-center text-[11px] text-accent-primary hover:underline py-1"
                    >
                      View all {counterArguments.length} challenges →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Blind Spot Network */}
        {activeView === 'network' && cognitiveAnalysis && (
          <div className="card">
            <div className="card-body">
              <ErrorBoundary sectionName="Blind Spot Network">
                <BlindSpotNetwork blindSpots={blindSpots} blindSpotGap={blindSpotGap} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Counter-Argument Strength */}
        {activeView === 'counter' && cognitiveAnalysis && (
          <div className="card">
            <div className="card-body">
              <ErrorBoundary sectionName="Counter-Argument Strength">
                <CounterArgumentStrength counterArguments={counterArguments} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Mitigation Strategy Builder */}
        {activeView === 'mitigate' && cognitiveAnalysis && (
          <div className="card">
            <div className="card-body">
              <ErrorBoundary sectionName="Mitigation Strategies">
                <MitigationStrategyBuilder blindSpots={blindSpots} blindSpotGap={blindSpotGap} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Pre-Mortem Scenario Cards */}
        {activeView === 'premortem' && preMortem && (
          <>
            <div className="card">
              <div className="card-body">
                <ErrorBoundary sectionName="Pre-Mortem Scenarios">
                  <PreMortemScenarioCards
                    failureScenarios={preMortem.failureScenarios}
                    preventiveMeasures={preMortem.preventiveMeasures}
                    inversion={preMortem.inversion}
                    redTeam={preMortem.redTeam}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* Feedback (preserved from original) */}
            {analysisId && (
              <div className="p-4 flex flex-col sm:flex-row items-center justify-between bg-secondary/20 border border-border">
                <span className="text-sm font-medium mb-3 sm:mb-0">
                  Are these pre-mortem scenarios helpful?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFeedback(1)}
                    disabled={isSubmittingFeedback || feedbackGiven !== null}
                    className={`btn btn-sm flex items-center gap-1 transition-colors ${
                      feedbackGiven === 'helpful'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : feedbackGiven === 'unhelpful'
                          ? 'opacity-50'
                          : 'btn-secondary'
                    }`}
                  >
                    {isSubmittingFeedback && feedbackGiven === null ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ThumbsUp
                        size={14}
                        className={feedbackGiven === 'helpful' ? 'fill-current' : ''}
                      />
                    )}
                    Helpful
                  </button>
                  <button
                    onClick={() => handleFeedback(-1)}
                    disabled={isSubmittingFeedback || feedbackGiven !== null}
                    className={`btn btn-sm flex items-center gap-1 transition-colors ${
                      feedbackGiven === 'unhelpful'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : feedbackGiven === 'helpful'
                          ? 'opacity-50'
                          : 'btn-secondary'
                    }`}
                  >
                    {isSubmittingFeedback && feedbackGiven === null ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ThumbsDown
                        size={14}
                        className={feedbackGiven === 'unhelpful' ? 'fill-current' : ''}
                      />
                    )}
                    Unhelpful
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
