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

  const canSubmit =
    decisionStatement.trim().length >= 10 &&
    defaultAction.trim().length >= 10 &&
    successCriteria.some(c => c.trim().length > 0) &&
    failureCriteria.some(c => c.trim().length > 0);

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
      // Redirect to document upload with frame context
      router.push(`/dashboard/documents?frameId=${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
            <h1 className="text-2xl font-bold text-white">Frame Your Decision</h1>
            <p className="text-sm text-zinc-400">
              Define your decision parameters before uploading a document for analysis
            </p>
          </div>
        </div>
      </div>

      {/* Why this matters */}
      <div className="mb-6 rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-4">
        <p className="text-sm text-indigo-200">
          By capturing your intent <strong>before</strong> analysis, we create a more accurate
          audit. The AI will evaluate your document against your stated objectives, not just generic
          criteria. This also builds your organization&apos;s decision archive.
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
            Default Action <span className="text-indigo-400">*</span>
          </label>
          <p className="mb-2 text-xs text-zinc-500">Without further analysis, what would you do?</p>
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
            Success Criteria <span className="text-indigo-400">*</span>
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
            Failure Criteria <span className="text-indigo-400">*</span>
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

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Frame Decision &amp; Upload Document
          </button>
          <Link href="/dashboard/documents" className="text-sm text-zinc-400 hover:text-zinc-300">
            Skip framing (upload directly)
          </Link>
        </div>
      </form>
    </div>
  );
}
