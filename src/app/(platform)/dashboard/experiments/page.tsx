'use client';

/**
 * A/B Prompt Testing Dashboard
 *
 * Lists experiments, shows per-variant results, and allows
 * creating new experiments + triggering auto-optimization.
 */

import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Variant {
  id: string;
  label: string;
  template: string;
  severity: string;
}

interface ExperimentResult {
  variantId: string;
  label: string;
  impressions: number;
  acknowledged: number;
  helpful: number;
  beliefDeltaAvg: number;
  effectivenessRate: number;
}

interface Experiment {
  id: string;
  name: string;
  nudgeType: string;
  status: string;
  variants: Variant[];
  trafficSplit: Record<string, number>;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

// ─── Create Experiment Modal ────────────────────────────────────────────────

function CreateExperimentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [nudgeType, setNudgeType] = useState('');
  const [variantInputs, setVariantInputs] = useState([
    { id: 'A', label: 'Variant A', template: '', severity: 'medium' },
    { id: 'B', label: 'Variant B', template: '', severity: 'medium' },
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addVariant = () => {
    const letter = String.fromCharCode(65 + variantInputs.length);
    setVariantInputs(prev => [
      ...prev,
      { id: letter, label: `Variant ${letter}`, template: '', severity: 'medium' },
    ]);
  };

  const removeVariant = (idx: number) => {
    if (variantInputs.length <= 2) return;
    setVariantInputs(prev => prev.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx: number, field: string, value: string) => {
    setVariantInputs(prev => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim() || !nudgeType.trim()) {
      setError('Name and nudge type are required');
      return;
    }
    if (variantInputs.some(v => !v.template.trim())) {
      setError('All variants must have a template');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          nudgeType: nudgeType.trim(),
          variants: variantInputs,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create experiment');
        return;
      }
      onCreated();
      onClose();
      setName('');
      setNudgeType('');
      setVariantInputs([
        { id: 'A', label: 'Variant A', template: '', severity: 'medium' },
        { id: 'B', label: 'Variant B', template: '', severity: 'medium' },
      ]);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Experiment</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Experiment Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Anchoring bias nudge v2"
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nudge Type</label>
            <input
              type="text"
              value={nudgeType}
              onChange={e => setNudgeType(e.target.value)}
              placeholder="e.g. anchoring_bias"
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Variants</label>
              {variantInputs.length < 10 && (
                <button onClick={addVariant} className="text-sm text-blue-600 hover:text-blue-700">
                  + Add Variant
                </button>
              )}
            </div>
            <div className="space-y-3">
              {variantInputs.map((v, idx) => (
                <div key={idx} className="border rounded-lg p-3 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{v.label}</span>
                    {variantInputs.length > 2 && (
                      <button
                        onClick={() => removeVariant(idx)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    value={v.template}
                    onChange={e => updateVariant(idx, 'template', e.target.value)}
                    placeholder="Nudge template text..."
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700"
                  />
                  <select
                    value={v.severity}
                    onChange={e => updateVariant(idx, 'severity', e.target.value)}
                    className="mt-2 px-2 py-1 border rounded text-sm dark:bg-zinc-800 dark:border-zinc-700"
                  >
                    <option value="low">Low severity</option>
                    <option value="medium">Medium severity</option>
                    <option value="high">High severity</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Experiment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant Results Bar Chart ──────────────────────────────────────────────

function VariantBarChart({ results }: { results: ExperimentResult[] }) {
  const maxImpressions = Math.max(...results.map(r => r.impressions), 1);

  return (
    <div className="space-y-3">
      {results.map(r => (
        <div key={r.variantId} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{r.label}</span>
            <span className="text-zinc-500">
              {r.impressions} impressions &middot; {(r.effectivenessRate * 100).toFixed(1)}%
              effective
            </span>
          </div>
          <div className="flex gap-1 h-6">
            <div
              className="bg-blue-500 rounded-l"
              style={{ width: `${(r.impressions / maxImpressions) * 100}%` }}
              title={`${r.impressions} impressions`}
            />
            <div
              className="bg-green-500"
              style={{
                width: `${(r.helpful / maxImpressions) * 100}%`,
              }}
              title={`${r.helpful} helpful`}
            />
            <div
              className="bg-amber-500 rounded-r"
              style={{
                width: `${(r.acknowledged / maxImpressions) * 100}%`,
              }}
              title={`${r.acknowledged} acknowledged`}
            />
          </div>
          <div className="flex gap-4 text-xs text-zinc-500">
            <span>Belief delta: {r.beliefDeltaAvg.toFixed(2)}</span>
            <span>Helpful: {r.helpful}</span>
            <span>Acknowledged: {r.acknowledged}</span>
          </div>
        </div>
      ))}
      <div className="flex gap-4 text-xs text-zinc-400 mt-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded inline-block" /> Impressions
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500 rounded inline-block" /> Helpful
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-amber-500 rounded inline-block" /> Acknowledged
        </span>
      </div>
    </div>
  );
}

// ─── Experiment Detail Panel ────────────────────────────────────────────────

function ExperimentDetail({
  experiment,
  onBack,
  onRefresh,
}: {
  experiment: Experiment;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/experiments/${experiment.id}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [experiment.id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const res = await fetch(`/api/experiments/${experiment.id}`, { method: 'POST' });
      if (res.ok) {
        await fetchResults();
        onRefresh();
      }
    } catch {
      // ignore
    } finally {
      setOptimizing(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/experiments/${experiment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      // ignore
    } finally {
      setUpdating(false);
    }
  };

  // Find winner: variant with highest effectiveness rate and enough impressions
  const winner =
    results.length > 0
      ? results.reduce(
          (best, r) =>
            r.effectivenessRate > best.effectivenessRate && r.impressions >= 10 ? r : best,
          results[0]
        )
      : null;

  const hasConverged = winner && winner.effectivenessRate > 0 && winner.impressions >= 30;

  return (
    <div>
      <button onClick={onBack} className="text-sm text-blue-600 hover:text-blue-700 mb-4">
        &larr; Back to experiments
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{experiment.name}</h2>
          <p className="text-zinc-500 mt-1">
            Type: {experiment.nudgeType} &middot; Status:{' '}
            <span
              className={
                experiment.status === 'active'
                  ? 'text-green-600'
                  : experiment.status === 'paused'
                    ? 'text-amber-600'
                    : 'text-zinc-400'
              }
            >
              {experiment.status}
            </span>
          </p>
          {experiment.startedAt && (
            <p className="text-xs text-zinc-400 mt-1">
              Started: {new Date(experiment.startedAt).toLocaleDateString()}
              {experiment.endedAt &&
                ` — Ended: ${new Date(experiment.endedAt).toLocaleDateString()}`}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {experiment.status === 'active' && (
            <>
              <button
                onClick={() => handleStatusChange('paused')}
                disabled={updating}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                Pause
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={updating}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                End
              </button>
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {optimizing ? 'Optimizing...' : 'Auto-Optimize'}
              </button>
            </>
          )}
          {experiment.status === 'paused' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={updating}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Resume
            </button>
          )}
        </div>
      </div>

      {hasConverged && winner && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-green-800 dark:text-green-200 font-medium">
            Winner: {winner.label} — {(winner.effectivenessRate * 100).toFixed(1)}% effectiveness (
            {winner.impressions} impressions)
          </p>
        </div>
      )}

      {/* Traffic Split */}
      <div className="bg-white dark:bg-zinc-900 border rounded-xl p-4 mb-6 dark:border-zinc-700">
        <h3 className="font-semibold mb-3">Traffic Split</h3>
        <div className="flex h-4 rounded-full overflow-hidden">
          {Object.entries(experiment.trafficSplit).map(([variantId, pct], i) => {
            const colors = [
              'bg-blue-500',
              'bg-green-500',
              'bg-amber-500',
              'bg-purple-500',
              'bg-pink-500',
            ];
            return (
              <div
                key={variantId}
                className={colors[i % colors.length]}
                style={{ width: `${pct}%` }}
                title={`${variantId}: ${pct}%`}
              />
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-zinc-500">
          {Object.entries(experiment.trafficSplit).map(([variantId, pct]) => (
            <span key={variantId}>
              {variantId}: {pct}%
            </span>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-zinc-900 border rounded-xl p-4 dark:border-zinc-700">
        <h3 className="font-semibold mb-3">Variant Results</h3>
        {loading ? (
          <p className="text-zinc-400 text-sm">Loading results...</p>
        ) : results.length === 0 ? (
          <p className="text-zinc-400 text-sm">
            No results yet. Data will appear as nudges are delivered.
          </p>
        ) : (
          <VariantBarChart results={results} />
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function ExperimentsDashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Experiment | null>(null);

  const fetchExperiments = useCallback(async () => {
    try {
      const res = await fetch('/api/experiments');
      if (res.ok) {
        const data = await res.json();
        setExperiments(data.experiments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  if (selected) {
    return (
      <ErrorBoundary sectionName="Experiment Detail">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <ExperimentDetail
            experiment={selected}
            onBack={() => {
              setSelected(null);
              fetchExperiments();
            }}
            onRefresh={() => {
              fetchExperiments();
            }}
          />
        </div>
      </ErrorBoundary>
    );
  }

  const statusOrder: Record<string, number> = { active: 0, paused: 1, completed: 2 };
  const sorted = [...experiments].sort(
    (a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
  );

  return (
    <ErrorBoundary sectionName="A/B Prompt Testing">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">A/B Prompt Testing</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Test nudge variants and auto-optimize with Thompson sampling
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            New Experiment
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-400">Loading experiments...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">No experiments yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              Create your first experiment
            </button>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden dark:border-zinc-700">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Variants
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-700">
                {sorted.map(exp => (
                  <tr
                    key={exp.id}
                    onClick={() => setSelected(exp)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{exp.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{exp.nudgeType}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          exp.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : exp.status === 'paused'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {Array.isArray(exp.variants) ? exp.variants.length : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CreateExperimentModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={fetchExperiments}
        />
      </div>
    </ErrorBoundary>
  );
}
