'use client';

import { useState } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { COPILOT_AGENTS, AGENT_LABELS, type CopilotAgentType } from '@/lib/copilot/types';
import { type ResolveSessionData } from '@/hooks/useCopilotStream';

interface ResolveDecisionModalProps {
  onResolve: (data: ResolveSessionData) => Promise<unknown>;
  onClose: () => void;
}

const OUTCOME_OPTIONS = [
  { value: 'success', label: 'Success', color: 'text-green-400' },
  { value: 'partial_success', label: 'Partial Success', color: 'text-yellow-400' },
  { value: 'failure', label: 'Failure', color: 'text-red-400' },
  { value: 'inconclusive', label: 'Inconclusive', color: 'text-zinc-400' },
] as const;

export function ResolveDecisionModal({ onResolve, onClose }: ResolveDecisionModalProps) {
  const [chosenOption, setChosenOption] = useState('');
  const [outcome, setOutcome] = useState('');
  const [impactScore, setImpactScore] = useState(5);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [helpfulAgents, setHelpfulAgents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAgent = (agent: string) => {
    setHelpfulAgents(prev =>
      prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenOption.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const data: ResolveSessionData = {
        chosenOption: chosenOption.trim(),
        ...(outcome && { outcome }),
        ...(outcome && { impactScore }),
        ...(lessonsLearned.trim() && { lessonsLearned: lessonsLearned.trim() }),
        ...(helpfulAgents.length > 0 && { helpfulAgents }),
      };
      await onResolve(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      >
        <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">Decision Logged</h3>
          <p className="text-sm text-zinc-400 mb-6">
            Your agents are learning from this decision. Future recommendations will be smarter.
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-zinc-100">Resolve Decision</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Chosen Option */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              What did you decide? <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={chosenOption}
              onChange={e => setChosenOption(e.target.value)}
              placeholder="e.g., Proceed with Option A — expand to EU market"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Outcome (optional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              How did it go?{' '}
              <span className="text-zinc-500">(optional — log later if too early)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOME_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOutcome(outcome === opt.value ? '' : opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    outcome === opt.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <span className={opt.color}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Impact Score — only show if outcome selected */}
          {outcome && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Impact Score: {impactScore}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={impactScore}
                onChange={e => setImpactScore(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>Low impact</span>
                <span>High impact</span>
              </div>
            </div>
          )}

          {/* Lessons Learned */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Lessons learned <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              value={lessonsLearned}
              onChange={e => setLessonsLearned(e.target.value)}
              placeholder="What would you do differently? What surprised you?"
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Helpful Agents */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Which agents were most helpful? <span className="text-zinc-500">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COPILOT_AGENTS.map(agent => (
                <button
                  key={agent}
                  type="button"
                  onClick={() => toggleAgent(agent)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    helpfulAgents.includes(agent)
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {AGENT_LABELS[agent as CopilotAgentType]}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!chosenOption.trim() || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
