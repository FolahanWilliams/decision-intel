import { CognitiveAnalysisResult } from '@/types';
import {
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  EyeOff,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/ToastContext';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('RedTeamView');

export function RedTeamView({
  analysisId,
  analysis,
  preMortem,
}: {
  analysisId?: string;
  analysis?: CognitiveAnalysisResult;
  preMortem?: { failureScenarios: string[]; preventiveMeasures: string[] };
}) {
  const { showToast } = useToast();
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'helpful' | 'unhelpful' | null>(null);

  if (!analysis && !preMortem) return null;

  const handleFeedback = async (rating: number) => {
    if (!analysisId) return;
    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'preMortem',
          analysisId,
          rating,
        }),
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

  const blindSpotGap = analysis?.blindSpotGap || 0;
  const blindSpots = analysis?.blindSpots || [];
  const counterArguments = analysis?.counterArguments || [];

  // Color logic for blind spot gap
  const gapColor =
    blindSpotGap < 50 ? 'text-red-500' : blindSpotGap < 80 ? 'text-yellow-500' : 'text-green-500';
  const gapLabel =
    blindSpotGap < 50
      ? 'Tunnel Vision Detected'
      : blindSpotGap < 80
        ? 'Moderate Diversity'
        : 'Balanced Perspective';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {analysis && (
        <>
          {/* Header / Score */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Cognitive Diversity Score</h3>
                <ShieldAlert className={`h-4 w-4 ${gapColor}`} />
              </div>
              <div className="card-body">
                <div className={`text-2xl font-bold ${gapColor}`}>{blindSpotGap}/100</div>
                <p className="text-xs text-muted-foreground">{gapLabel}</p>
                {/* Simple Progress Bar */}
                <div
                  className="mt-2 h-2 w-full bg-secondary overflow-hidden"
                  style={{ background: 'var(--bg-secondary)' }}
                >
                  <div
                    className={`h-full ${blindSpotGap < 50 ? 'bg-red-500' : blindSpotGap < 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{
                      width: `${blindSpotGap}%`,
                      background:
                        blindSpotGap < 50
                          ? 'var(--error)'
                          : blindSpotGap < 80
                            ? 'var(--warning)'
                            : 'var(--success)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Blind Spots */}
          {blindSpots.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-orange-500" />
                  <h3 className="card-title">Blind Spots Identified</h3>
                </div>
                <p className="text-sm text-muted">
                  Perspectives completely missing from the document
                </p>
              </div>
              <div className="card-body grid gap-4 md:grid-cols-2">
                {blindSpots.map((spot, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 p-3 border bg-orange-500/10 border-orange-200 dark:border-orange-900"
                    style={{
                      borderColor: 'var(--border-color)',
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <span className="font-semibold text-orange-700 dark:text-orange-300">
                      {spot.name}
                    </span>
                    <span className="text-sm text-muted-foreground">{spot.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counter Arguments */}
          <h3 className="text-lg font-semibold flex items-center gap-2 mt-8 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Red Team Challenges
            <span
              className="badge ml-2"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {counterArguments.length}
            </span>
          </h3>

          <div className="grid gap-4">
            {counterArguments.map((arg, i) => (
              <div
                key={i}
                className="card border-l-4 border-l-red-500"
                style={{ borderLeft: '4px solid var(--error)' }}
              >
                <div className="card-body pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-red-600 dark:text-red-400">
                        {arg.perspective}
                      </h4>
                      <p className="text-sm text-foreground">{arg.argument}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[100px]">
                      <span
                        className="badge"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Confidence: {(arg.confidence * 100).toFixed(0)}%
                      </span>
                      {arg.sourceUrl && (
                        <a
                          href={arg.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-blue-500 hover:underline"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          View Source <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {preMortem && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <ShieldAlert
              className="h-5 w-5 text-purple-500"
              style={{ color: 'var(--accent-primary)' }}
            />
            Pre-Mortem Failure Scenarios
          </h3>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <div className="card flex flex-col h-full">
              <div className="card-header pb-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle
                    className="h-4 w-4 text-warning"
                    style={{ color: 'var(--warning)' }}
                  />
                  Potential Failures
                </h4>
              </div>
              <div className="card-body flex-1">
                <ul className="space-y-3 pl-5 list-disc" style={{ color: 'var(--text-secondary)' }}>
                  {preMortem.failureScenarios.map((scenario, i) => (
                    <li key={i} className="text-sm">
                      {scenario}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card flex flex-col h-full">
              <div className="card-header pb-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-success" style={{ color: 'var(--success)' }} />
                  Preventive Measures
                </h4>
              </div>
              <div className="card-body flex-1">
                <ul className="space-y-3 pl-5 list-disc" style={{ color: 'var(--text-secondary)' }}>
                  {preMortem.preventiveMeasures.map((measure, i) => (
                    <li key={i} className="text-sm">
                      {measure}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Pre-Mortem Feedback */}
          {analysisId && (
            <div
              className="mt-6 flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg bg-secondary/20"
              style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}
            >
              <div
                className="text-sm font-medium mb-3 sm:mb-0"
                style={{ color: 'var(--text-primary)' }}
              >
                Are these pre-mortem scenarios helpful?
              </div>
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => handleFeedback(1)}
                  disabled={isSubmittingFeedback || feedbackGiven !== null}
                  className={`btn btn-sm flex items-center gap-xs transition-colors ${
                    feedbackGiven === 'helpful'
                      ? 'bg-success/20 text-success border-success/30'
                      : feedbackGiven === 'unhelpful'
                        ? 'opacity-50'
                        : 'btn-secondary'
                  }`}
                  aria-label="Helpful scenarios"
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
                  className={`btn btn-sm flex items-center gap-xs transition-colors ${
                    feedbackGiven === 'unhelpful'
                      ? 'bg-error/20 text-error border-error/30'
                      : feedbackGiven === 'helpful'
                        ? 'opacity-50'
                        : 'btn-secondary'
                  }`}
                  aria-label="Unhelpful scenarios"
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
        </div>
      )}
    </div>
  );
}
