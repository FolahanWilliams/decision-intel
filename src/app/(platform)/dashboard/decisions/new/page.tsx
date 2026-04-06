'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Target,
  ArrowLeft,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Decision Framing Page (Moat 4: Outcomes-First Workflow)
 *
 * Inverts the workflow: define decision parameters BEFORE uploading a document.
 * This captures intent before cognitive biases influence interpretation,
 * making NeuroAudit the system of record for decision rationale.
 *
 * Creates a DecisionFrame record, then redirects to document upload
 * with the frame attached.
 */

export default function NewDecisionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [decisionStatement, setDecisionStatement] = useState('');
  const [defaultAction, setDefaultAction] = useState('');
  const [successCriteria, setSuccessCriteria] = useState<string[]>(['']);
  const [failureCriteria, setFailureCriteria] = useState<string[]>(['']);
  const [stakeholders, setStakeholders] = useState<string[]>(['']);

  // Only the decision statement is required. Everything else (default action,
  // success/failure criteria, stakeholders) is optional so users can capture
  // a frame in one sentence and enrich it later — or skip framing entirely.
  const canSubmit = decisionStatement.trim().length >= 3;

  function addCriterion(list: string[], setter: (v: string[]) => void) {
    setter([...list, '']);
  }

  function updateCriterion(
    list: string[],
    setter: (v: string[]) => void,
    index: number,
    value: string
  ) {
    const updated = [...list];
    updated[index] = value;
    setter(updated);
  }

  function removeCriterion(list: string[], setter: (v: string[]) => void, index: number) {
    if (list.length <= 1) return;
    setter(list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/decision-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionStatement: decisionStatement.trim(),
          defaultAction: defaultAction.trim(),
          successCriteria: successCriteria.filter(c => c.trim()).map(c => c.trim()),
          failureCriteria: failureCriteria.filter(c => c.trim()).map(c => c.trim()),
          stakeholders: stakeholders.filter(s => s.trim()).map(s => s.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create decision frame');
      }

      const { id } = await res.json();
      // Redirect to dashboard upload area with frame context
      router.push(`/dashboard?frameId=${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ErrorBoundary sectionName="New Decision">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20">
              <Target className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Frame Your Decision{' '}
                <span className="text-sm font-normal text-zinc-500">(optional)</span>
              </h1>
              <p className="text-sm text-zinc-400">
                A one-line decision statement is all we need — or skip framing entirely and upload
                directly.
              </p>
            </div>
          </div>
        </div>

        {/* Why this matters */}
        <div className="mb-6 rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-4">
          <p className="text-sm text-indigo-200">
            Framing is <strong>optional but helpful</strong>. If you capture your intent before
            analysis, the AI audits your document against your stated objectives instead of generic
            criteria. You can always skip framing, or fill in only the decision statement and enrich
            the rest later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Decision Statement */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Decision Statement <span className="text-indigo-400">*</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500">What are you deciding?</p>
            <textarea
              value={decisionStatement}
              onChange={e => setDecisionStatement(e.target.value)}
              placeholder="We are deciding whether to approve the Q3 acquisition of Acme Corp..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          {/* Default Action */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Default Action <span className="text-xs font-normal text-zinc-500">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500">
              Without further analysis, what would you do?
            </p>
            <textarea
              value={defaultAction}
              onChange={e => setDefaultAction(e.target.value)}
              placeholder="I would approve the acquisition based on the management team's recommendation..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              rows={2}
            />
          </div>

          {/* Success Criteria */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Success Criteria <span className="text-xs font-normal text-zinc-500">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500">This decision succeeds if...</p>
            {successCriteria.map((criterion, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input
                  value={criterion}
                  onChange={e =>
                    updateCriterion(successCriteria, setSuccessCriteria, i, e.target.value)
                  }
                  placeholder={`Success criterion ${i + 1}`}
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                {successCriteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(successCriteria, setSuccessCriteria, i)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addCriterion(successCriteria, setSuccessCriteria)}
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
            >
              <Plus className="h-3 w-3" /> Add criterion
            </button>
          </div>

          {/* Failure Criteria */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Failure Criteria <span className="text-xs font-normal text-zinc-500">(optional)</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500">This decision fails if...</p>
            {failureCriteria.map((criterion, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input
                  value={criterion}
                  onChange={e =>
                    updateCriterion(failureCriteria, setFailureCriteria, i, e.target.value)
                  }
                  placeholder={`Failure criterion ${i + 1}`}
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                {failureCriteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(failureCriteria, setFailureCriteria, i)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addCriterion(failureCriteria, setFailureCriteria)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
            >
              <Plus className="h-3 w-3" /> Add criterion
            </button>
          </div>

          {/* Stakeholders */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Users className="h-4 w-4 text-blue-400" />
              Stakeholders Affected (optional)
            </label>
            <p className="mb-2 text-xs text-zinc-500">Maps to boardroom simulation personas</p>
            {stakeholders.map((stakeholder, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input
                  value={stakeholder}
                  onChange={e => updateCriterion(stakeholders, setStakeholders, i, e.target.value)}
                  placeholder={`e.g., Shareholders, Customers, Employees...`}
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {stakeholders.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(stakeholders, setStakeholders, i)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addCriterion(stakeholders, setStakeholders)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <Plus className="h-3 w-3" /> Add stakeholder
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Save Frame & Upload Document'}
            </button>
            <Link
              href="/dashboard?view=browse"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              Skip framing — upload directly
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </form>
      </div>
    </ErrorBoundary>
  );
}
