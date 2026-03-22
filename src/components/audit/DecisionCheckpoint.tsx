'use client';

import { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

/**
 * DecisionCheckpoint — Structured RLHF Component (Moat 3)
 *
 * Captures the decision-maker's PRIOR BELIEFS before they see the analysis.
 * This creates proprietary behavioral data that no competitor can replicate:
 *   - Prior/posterior belief tracking
 *   - Cognitive fingerprint of each organization
 *   - Structured preference data for model fine-tuning
 *
 * Used before document analysis begins. Stores data as a DecisionPrior record.
 */

interface DecisionCheckpointProps {
  analysisId: string;
  onComplete: (prior: DecisionPriorData) => void;
  onSkip?: () => void;
  isRequired?: boolean; // true for high-risk analyses (overallScore < 50)
}

export interface DecisionPriorData {
  defaultAction: string;
  confidence: number;
  evidenceToChange: string;
}

export function DecisionCheckpoint({
  analysisId,
  onComplete,
  onSkip,
  isRequired = false,
}: DecisionCheckpointProps) {
  const [defaultAction, setDefaultAction] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [evidenceToChange, setEvidenceToChange] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = defaultAction.trim().length >= 10;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/decision-priors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          defaultAction: defaultAction.trim(),
          confidence,
          evidenceToChange: evidenceToChange.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save decision prior');
      }

      onComplete({
        defaultAction: defaultAction.trim(),
        confidence,
        evidenceToChange: evidenceToChange.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
            <BrainCircuit className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Decision Checkpoint</h3>
            <p className="text-sm text-zinc-400">
              Record your position <em>before</em> seeing the analysis
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-zinc-400 hover:text-white"
        >
          {showDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-5">
          <p className="text-sm text-zinc-300">
            This helps us measure how the analysis impacts your thinking. Your prior beliefs create
            a personal calibration profile that improves future analyses.
          </p>

          {/* Default Action */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Without further analysis, what would you do?
              <span className="text-amber-400">*</span>
            </label>
            <textarea
              value={defaultAction}
              onChange={e => setDefaultAction(e.target.value)}
              placeholder="e.g., I would approve this proposal as-is based on the team's recommendation..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              rows={3}
            />
            {defaultAction.length > 0 && defaultAction.length < 10 && (
              <p className="text-xs text-amber-400 mt-1">Please provide at least 10 characters</p>
            )}
          </div>

          {/* Confidence Slider */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              How confident are you in this action? ({confidence}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={confidence}
              onChange={e => setConfidence(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-zinc-500 mt-1">
              <span>Very uncertain</span>
              <span>Very confident</span>
            </div>
          </div>

          {/* Evidence to Change */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              What evidence would change your mind? (optional)
            </label>
            <textarea
              value={evidenceToChange}
              onChange={e => setEvidenceToChange(e.target.value)}
              placeholder="e.g., If the financial projections show >20% downside risk, or if regulatory compliance is uncertain..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Record &amp; Continue
            </button>
            {!isRequired && onSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-zinc-400 hover:text-zinc-300 underline"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
