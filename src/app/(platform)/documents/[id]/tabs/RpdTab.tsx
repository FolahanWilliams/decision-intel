'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RecognitionCuesResult, NarrativePreMortem, RpdSimulationResult } from '@/types';
import {
  Brain,
  Eye,
  Target,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';

interface RpdTabProps {
  recognitionCues?: RecognitionCuesResult;
  narrativePreMortem?: NarrativePreMortem;
  documentId?: string;
}

type RpdView = 'overview' | 'cues' | 'stories' | 'simulator';

const VIEWS: {
  id: RpdView;
  label: string;
  icon: typeof Brain;
  needs: 'cues' | 'stories' | 'either' | 'always';
}[] = [
  { id: 'overview', label: 'Overview', icon: Brain, needs: 'either' },
  { id: 'cues', label: 'Recognition Cues', icon: Eye, needs: 'cues' },
  { id: 'stories', label: 'War Stories', icon: BookOpen, needs: 'stories' },
  { id: 'simulator', label: 'Mental Simulator', icon: PlayCircle, needs: 'always' },
];

function OutcomeIcon({ outcome }: { outcome?: 'SUCCESS' | 'FAILURE' | 'MIXED' }) {
  if (outcome === 'SUCCESS') return <CheckCircle size={14} className="text-emerald-400" />;
  if (outcome === 'FAILURE') return <XCircle size={14} className="text-red-400" />;
  if (outcome === 'MIXED') return <AlertTriangle size={14} className="text-amber-400" />;
  return <HelpCircle size={14} className="text-muted" />;
}

export function RpdTab({ recognitionCues, narrativePreMortem, documentId }: RpdTabProps) {
  const [activeView, setActiveView] = useState<RpdView>('overview');
  const [chosenAction, setChosenAction] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<RpdSimulationResult | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const runMentalSimulation = async () => {
    if (!documentId || !chosenAction.trim()) return;
    setIsSimulating(true);
    setSimulationError(null);
    setSimulationResult(null);

    try {
      const res = await fetch('/api/rpd-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, chosenAction: chosenAction.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setSimulationResult(data.result);
    } catch (err) {
      setSimulationError(err instanceof Error ? err.message : 'Mental simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!recognitionCues && !narrativePreMortem) {
    return (
      <ErrorBoundary sectionName="Pattern Recognition">
        <div className="card">
          <div className="card-body">
            <div className="text-center p-8 text-muted">
              No pattern recognition data available. This analysis may not have enough historical
              data for RPD analysis.
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const cues = recognitionCues?.cues ?? [];
  const warStories = narrativePreMortem?.warStories ?? [];
  const confidenceLevel = recognitionCues?.confidenceLevel ?? 0;

  const confidenceColor =
    confidenceLevel >= 70
      ? 'text-emerald-600 dark:text-emerald-400'
      : confidenceLevel >= 40
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-zinc-600 dark:text-zinc-400';
  const confidenceLabel =
    confidenceLevel >= 70
      ? 'High Confidence'
      : confidenceLevel >= 40
        ? 'Moderate'
        : 'Low Confidence';

  const availableViews = VIEWS.filter(v => {
    if (v.needs === 'cues') return !!recognitionCues;
    if (v.needs === 'stories') return warStories.length > 0;
    if (v.needs === 'always') return !!documentId;
    return true;
  });

  return (
    <ErrorBoundary sectionName="Pattern Recognition (Klein RPD)">
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
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
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
            {/* Pattern Match Banner */}
            {recognitionCues?.patternMatch && (
              <div className="card border-l-4 border-l-blue-500">
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <Brain size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Pattern Match</h4>
                      <p className="text-sm text-muted leading-relaxed">
                        {recognitionCues.patternMatch}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Score cards */}
            {recognitionCues && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                <div className="card">
                  <div className="card-header flex flex-row items-center justify-between pb-2">
                    <h4 className="text-sm font-medium">Recognition Confidence</h4>
                    <Target size={16} className={confidenceColor} />
                  </div>
                  <div className="card-body">
                    <div className={`text-2xl font-bold ${confidenceColor}`}>
                      {confidenceLevel}/100
                    </div>
                    <p className="text-xs text-muted">{confidenceLabel}</p>
                    <div className="mt-2 h-2 bg-muted/20 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          confidenceLevel >= 70
                            ? 'bg-emerald-500'
                            : confidenceLevel >= 40
                              ? 'bg-amber-500'
                              : 'bg-zinc-500'
                        }`}
                        style={{ width: `${confidenceLevel}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header flex flex-row items-center justify-between pb-2">
                    <h4 className="text-sm font-medium">Cues Identified</h4>
                    <Eye size={16} className="text-blue-400" />
                  </div>
                  <div className="card-body">
                    <div className="text-2xl font-bold text-blue-400">{cues.length}</div>
                    <p className="text-xs text-muted">From historical patterns</p>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header flex flex-row items-center justify-between pb-2">
                    <h4 className="text-sm font-medium">War Stories</h4>
                    <BookOpen size={16} className="text-orange-400" />
                  </div>
                  <div className="card-body">
                    <div className="text-2xl font-bold text-orange-400">{warStories.length}</div>
                    <p className="text-xs text-muted">Cautionary narratives</p>
                  </div>
                </div>
              </div>
            )}

            {/* Expert Heuristic */}
            {recognitionCues?.expertHeuristic && (
              <div className="card bg-blue-500/5 border-blue-500/20">
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <Target size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">
                        Expert Heuristic
                      </h4>
                      <p className="text-sm text-foreground leading-relaxed">
                        {recognitionCues.expertHeuristic}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top cues preview */}
            {cues.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h4 className="flex items-center gap-2">
                    <Eye size={14} className="text-blue-400" />
                    Key Recognition Cues
                  </h4>
                </div>
                <div className="card-body space-y-3">
                  {cues.slice(0, 3).map((cue, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 border border-border bg-card/50"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <OutcomeIcon outcome={cue.outcome} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-foreground">{cue.title}</span>
                          {cue.similarity > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 font-mono">
                              {Math.round(cue.similarity * 100)}% match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted line-clamp-2">{cue.description}</p>
                        {cue.missedCue && (
                          <p className="text-[11px] text-red-400 mt-1">
                            <AlertTriangle size={10} className="inline mr-1" />
                            Missed: {cue.missedCue}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {cues.length > 3 && (
                    <button
                      onClick={() => setActiveView('cues')}
                      className="w-full text-center text-[11px] text-accent-primary hover:underline py-1"
                    >
                      View all {cues.length} recognition cues &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Full Cues View */}
        {activeView === 'cues' && recognitionCues && (
          <div className="card">
            <div className="card-header">
              <h4 className="flex items-center gap-2">
                <Eye size={16} className="text-blue-400" />
                All Recognition Cues
              </h4>
              <p className="text-xs text-muted mt-1">
                Patterns an experienced decision-maker would notice based on historical data
              </p>
            </div>
            <div className="card-body space-y-4">
              {cues.map((cue, i) => (
                <div key={i} className="p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <OutcomeIcon outcome={cue.outcome} />
                      <h5 className="text-sm font-semibold text-foreground">{cue.title}</h5>
                    </div>
                    <div className="flex items-center gap-2">
                      {cue.outcome && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 font-medium ${
                            cue.outcome === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : cue.outcome === 'FAILURE'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {cue.outcome}
                        </span>
                      )}
                      {cue.similarity > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 font-mono">
                          {Math.round(cue.similarity * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted leading-relaxed mb-2">{cue.description}</p>

                  {cue.historicalDealTitle && (
                    <p className="text-[11px] text-muted">
                      <span className="font-medium text-foreground/70">Reference:</span>{' '}
                      {cue.historicalDealTitle}
                    </p>
                  )}

                  {cue.missedCue && (
                    <div className="mt-2 p-2 bg-red-500/5 border border-red-500/20">
                      <p className="text-[11px] text-red-400">
                        <AlertTriangle size={10} className="inline mr-1" />
                        <span className="font-medium">Missed Cue:</span> {cue.missedCue}
                      </p>
                    </div>
                  )}

                  {cue.lessonLearned && (
                    <div className="mt-2 p-2 bg-blue-500/5 border border-blue-500/20">
                      <p className="text-[11px] text-blue-400">
                        <Brain size={10} className="inline mr-1" />
                        <span className="font-medium">Lesson:</span> {cue.lessonLearned}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* War Stories View */}
        {activeView === 'stories' && warStories.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h4 className="flex items-center gap-2">
                <BookOpen size={16} className="text-orange-400" />
                Cautionary War Stories
              </h4>
              <p className="text-xs text-muted mt-1">
                Vivid narratives of how similar decisions went wrong &mdash; Klein&apos;s research
                shows stories are more memorable and actionable than bullet lists
              </p>
            </div>
            <div className="card-body space-y-4">
              {warStories.map((story, i) => {
                const probColor =
                  story.probability === 'high'
                    ? 'bg-red-500/10 text-red-400'
                    : story.probability === 'medium'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-zinc-500/10 text-zinc-400';

                return (
                  <div
                    key={i}
                    className="p-4 border border-border border-l-4 border-l-orange-500/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-semibold text-foreground">{story.title}</h5>
                      <span className={`text-[10px] px-1.5 py-0.5 font-medium ${probColor}`}>
                        {story.probability} probability
                      </span>
                    </div>

                    <p className="text-xs text-muted leading-relaxed mb-3 italic">
                      &ldquo;{story.narrative}&rdquo;
                    </p>

                    {story.historicalBasis && (
                      <p className="text-[10px] text-muted mb-2">
                        <span className="font-medium">Basis:</span> {story.historicalBasis}
                      </p>
                    )}

                    <div className="p-2 bg-orange-500/5 border border-orange-500/20">
                      <p className="text-[11px] text-orange-400">
                        <Target size={10} className="inline mr-1" />
                        <span className="font-medium">Key Takeaway:</span> {story.keyTakeaway}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mental Simulator View */}
        {activeView === 'simulator' && documentId && (
          <div className="flex flex-col gap-lg">
            <div className="card">
              <div className="card-header">
                <h4 className="flex items-center gap-2">
                  <PlayCircle size={16} className="text-purple-400" />
                  RPD Mental Simulator
                </h4>
                <p className="text-xs text-muted mt-1">
                  Klein&apos;s RPD: Pick one promising course of action and mentally simulate how it
                  plays out. No need to compare dozens of alternatives &mdash; experts evaluate one
                  option deeply.
                </p>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground">
                    What&apos;s your chosen course of action?
                  </label>
                  <textarea
                    value={chosenAction}
                    onChange={e => setChosenAction(e.target.value)}
                    placeholder='e.g., "Proceed with the acquisition at the proposed valuation" or "Request renegotiation of key terms before committee approval"'
                    className="w-full p-3 bg-card border border-border text-sm text-foreground placeholder:text-muted resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted">{chosenAction.length}/500</span>
                    <button
                      onClick={runMentalSimulation}
                      disabled={isSimulating || !chosenAction.trim()}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {isSimulating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Simulating...
                        </>
                      ) : (
                        <>
                          <Brain size={14} />
                          Run Mental Simulation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {simulationError && (
              <div className="card border-l-4 border-l-red-500">
                <div className="card-body">
                  <p className="text-sm text-red-400">{simulationError}</p>
                </div>
              </div>
            )}

            {simulationResult && (
              <>
                {/* Recommendation Banner */}
                <div
                  className={`card border-l-4 ${
                    simulationResult.recommendation === 'PROCEED'
                      ? 'border-l-emerald-500'
                      : simulationResult.recommendation === 'MODIFY'
                        ? 'border-l-amber-500'
                        : 'border-l-red-500'
                  }`}
                >
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      {simulationResult.recommendation === 'PROCEED' ? (
                        <CheckCircle size={20} className="text-emerald-400" />
                      ) : simulationResult.recommendation === 'MODIFY' ? (
                        <AlertTriangle size={20} className="text-amber-400" />
                      ) : (
                        <XCircle size={20} className="text-red-400" />
                      )}
                      <div>
                        <h4 className="text-sm font-semibold">
                          Recommendation: {simulationResult.recommendation}
                        </h4>
                        {simulationResult.modificationSuggestion && (
                          <p className="text-xs text-muted mt-1">
                            {simulationResult.modificationSuggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mental Simulation */}
                <div className="card">
                  <div className="card-header">
                    <h4 className="text-sm font-semibold">Mental Simulation</h4>
                  </div>
                  <div className="card-body space-y-3">
                    <div>
                      <span className="text-[10px] font-medium text-muted uppercase tracking-wide">
                        Most Likely Outcome
                      </span>
                      <p className="text-sm text-foreground mt-1 leading-relaxed">
                        {simulationResult.mentalSimulation.likelyOutcome}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-card border border-border">
                        <span className="text-[10px] text-muted">Confidence</span>
                        <div className="text-lg font-bold text-foreground">
                          {simulationResult.mentalSimulation.confidenceLevel}%
                        </div>
                      </div>
                      <div className="p-2 bg-card border border-border">
                        <span className="text-[10px] text-muted">Time Horizon</span>
                        <div className="text-sm font-semibold text-foreground mt-1">
                          {simulationResult.mentalSimulation.timeHorizon}
                        </div>
                      </div>
                    </div>

                    {simulationResult.mentalSimulation.keyAssumptions.length > 0 && (
                      <div>
                        <span className="text-[10px] font-medium text-muted uppercase tracking-wide">
                          Key Assumptions
                        </span>
                        <ul className="mt-1 space-y-1">
                          {simulationResult.mentalSimulation.keyAssumptions.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted">
                              <ArrowRight size={10} className="mt-1 flex-shrink-0 text-blue-400" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {simulationResult.mentalSimulation.criticalFailurePoints.length > 0 && (
                      <div>
                        <span className="text-[10px] font-medium text-red-400 uppercase tracking-wide">
                          Critical Failure Points
                        </span>
                        <ul className="mt-1 space-y-1">
                          {simulationResult.mentalSimulation.criticalFailurePoints.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-red-400/80">
                              <AlertTriangle size={10} className="mt-1 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expert Perspective */}
                {simulationResult.expertPerspective && (
                  <div className="card bg-purple-500/5 border-purple-500/20">
                    <div className="card-body">
                      <div className="flex items-start gap-3">
                        <Target size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-1">
                            Expert Perspective
                          </h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {simulationResult.expertPerspective}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Historical Analogs */}
                {simulationResult.historicalAnalogs &&
                  simulationResult.historicalAnalogs.length > 0 && (
                    <div className="card">
                      <div className="card-header">
                        <h4 className="text-sm font-semibold">Historical Analogs</h4>
                      </div>
                      <div className="card-body space-y-2">
                        {simulationResult.historicalAnalogs.map((analog, i) => (
                          <div key={i} className="p-3 border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-foreground">
                                {analog.dealTitle}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 font-mono">
                                {Math.round(analog.similarity * 100)}% match
                              </span>
                            </div>
                            <p className="text-[11px] text-muted">
                              <span className="font-medium">Action:</span> {analog.action}
                            </p>
                            <p className="text-[11px] text-muted">
                              <span className="font-medium">Outcome:</span> {analog.outcome}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
