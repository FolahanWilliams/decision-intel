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
  { value: 'success', label: 'Success', tone: 'var(--success)' },
  { value: 'partial_success', label: 'Partial Success', tone: 'var(--warning)' },
  { value: 'failure', label: 'Failure', tone: 'var(--error)' },
  { value: 'inconclusive', label: 'Inconclusive', tone: 'var(--text-muted)' },
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
        style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      >
        <div
          className="mx-4 w-full max-w-md rounded-xl p-8 text-center"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <CheckCircle2
            className="mx-auto h-12 w-12 mb-4"
            style={{ color: 'var(--success)' }}
          />
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Decision Logged
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your agents are learning from this decision. Future recommendations will be smarter.
          </p>
          <button
            onClick={onClose}
            className="rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
            style={{
              background: 'var(--accent-primary)',
              color: 'white',
            }}
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
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
    >
      <div
        className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Resolve Decision
          </h3>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Chosen Option */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              What did you decide? <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={chosenOption}
              onChange={e => setChosenOption(e.target.value)}
              placeholder="e.g., Proceed with Option A — expand to EU market"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>

          {/* Outcome (optional) */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              How did it go?{' '}
              <span style={{ color: 'var(--text-muted)' }}>
                (optional — log later if too early)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOME_OPTIONS.map(opt => {
                const selected = outcome === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOutcome(selected ? '' : opt.value)}
                    className="rounded-lg px-3 py-2 text-sm transition-colors"
                    style={{
                      background: selected
                        ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                        : 'var(--bg-elevated)',
                      border: `1px solid ${selected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ color: opt.tone }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impact Score — only show if outcome selected */}
          {outcome && (
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Impact Score: {impactScore}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={impactScore}
                onChange={e => setImpactScore(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Low impact</span>
                <span>High impact</span>
              </div>
            </div>
          )}

          {/* Lessons Learned */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Lessons learned <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <textarea
              value={lessonsLearned}
              onChange={e => setLessonsLearned(e.target.value)}
              placeholder="What would you do differently? What surprised you?"
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Helpful Agents */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              Which agents were most helpful?{' '}
              <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COPILOT_AGENTS.map(agent => {
                const selected = helpfulAgents.includes(agent);
                return (
                  <button
                    key={agent}
                    type="button"
                    onClick={() => toggleAgent(agent)}
                    className="rounded-full px-3 py-1.5 text-xs transition-colors"
                    style={{
                      background: selected
                        ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                        : 'var(--bg-elevated)',
                      border: `1px solid ${selected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      color: selected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {AGENT_LABELS[agent as CopilotAgentType]}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{
                background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--error) 35%, transparent)',
                color: 'var(--error)',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm transition-colors"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!chosenOption.trim() || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
              }}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
