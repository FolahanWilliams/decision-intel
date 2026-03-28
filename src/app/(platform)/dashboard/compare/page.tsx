'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useDocuments } from '@/hooks/useDocuments';
import { GitCompareArrows, Plus, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalysisData {
  id: string;
  documentId: string;
  filename: string;
  overallScore: number;
  noiseScore: number;
  biasCount: number;
  topBiases: string[];
  factCheckScore: number | null;
  createdAt: string;
}

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(false);
  const { documents, isLoading: docsLoading } = useDocuments(true, 1, 50);

  // Fetch analysis details for selected documents
  const fetchAnalyses = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setAnalyses([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map(async id => {
          const res = await fetch(`/api/documents/${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          const analysis = data.analysis;
          if (!analysis) return null;
          return {
            id: analysis.id,
            documentId: id,
            filename: data.filename || 'Unknown',
            overallScore: analysis.overallScore ?? 0,
            noiseScore: analysis.noiseScore ?? 0,
            biasCount: analysis.biases?.length ?? 0,
            topBiases: (analysis.biases ?? [])
              .slice(0, 5)
              .map((b: { biasType: string }) => b.biasType),
            factCheckScore: analysis.factCheck?.score ?? null,
            createdAt: analysis.createdAt,
          } as AnalysisData;
        })
      );
      setAnalyses(results.filter((r): r is AnalysisData => r !== null));
    } catch {
      // Non-critical; leave analyses as-is
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses(selectedIds);
  }, [selectedIds, fetchAnalyses]);

  const completeDocs = documents.filter(
    d => d.status === 'complete' && !selectedIds.includes(d.id)
  );

  const toggleSelection = (docId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(docId)) return prev.filter(id => id !== docId);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, docId];
    });
  };

  const removeSelection = (docId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== docId));
  };

  const scoreDelta = (a: number, b: number) => {
    const diff = a - b;
    if (Math.abs(diff) < 1) return { icon: Minus, label: 'Same', color: 'text-gray-400' };
    if (diff > 0)
      return { icon: TrendingUp, label: `+${diff.toFixed(0)}`, color: 'text-green-400' };
    return { icon: TrendingDown, label: `${diff.toFixed(0)}`, color: 'text-red-400' };
  };

  return (
    <ErrorBoundary sectionName="Compare Analyses">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Compare Analyses</h1>
          <p className="text-gray-400">
            Compare multiple cognitive audits side by side to identify patterns and trends.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Selection Area */}
          <div className={cn('p-6 rounded-xl', 'liquid-glass-premium', 'border border-white/10')}>
            <h2 className="text-xl font-semibold text-white mb-4">
              Select Analyses to Compare{' '}
              <span className="text-sm text-gray-400 font-normal">({selectedIds.length}/3)</span>
            </h2>

            {/* Selected chips */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedIds.map(id => {
                  const doc = documents.find(d => d.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm border border-white/20"
                    >
                      {doc?.filename || id.slice(0, 8)}
                      <button
                        onClick={() => removeSelection(id)}
                        className="hover:text-red-400 transition-colors"
                        aria-label={`Remove ${doc?.filename}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Available documents */}
            {docsLoading ? (
              <p className="text-gray-500 text-sm">Loading documents...</p>
            ) : completeDocs.length === 0 && selectedIds.length === 0 ? (
              <div className="mt-4 p-12 text-center border-2 border-dashed border-white/20 rounded-lg">
                <p className="text-gray-500">
                  No completed analyses available. Upload and analyze documents first.
                </p>
              </div>
            ) : completeDocs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {completeDocs.slice(0, 12).map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => toggleSelection(doc.id)}
                    disabled={selectedIds.length >= 3}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                      'border border-white/10 hover:border-white/30',
                      selectedIds.length >= 3
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/5 cursor-pointer'
                    )}
                  >
                    <Plus size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-500">Score: {doc.score ?? 'N/A'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Empty state — nothing selected */}
          {!loading && selectedIds.length === 0 && completeDocs.length > 0 && (
            <div
              className={cn('p-8 rounded-xl text-center', 'liquid-glass', 'border border-white/10')}
            >
              <GitCompareArrows size={32} className="mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400 text-sm">
                Select two or more analyses above to compare them side by side.
              </p>
            </div>
          )}

          {/* Comparison Results */}
          {loading && (
            <div className="text-center py-8 text-gray-400">Loading comparison data...</div>
          )}

          {!loading && analyses.length >= 2 && (
            <div className={cn('p-6 rounded-xl', 'liquid-glass', 'border border-white/10')}>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <GitCompareArrows size={20} />
                Comparison Results
              </h2>

              {/* Score comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-400 py-3 px-4 font-medium">Metric</th>
                      {analyses.map(a => (
                        <th key={a.id} className="text-center text-white py-3 px-4 font-medium">
                          <span className="block truncate max-w-[180px]">{a.filename}</span>
                        </th>
                      ))}
                      {analyses.length === 2 && (
                        <th className="text-center text-gray-400 py-3 px-4 font-medium">Delta</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Overall Score */}
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-gray-300">Overall Score</td>
                      {analyses.map(a => (
                        <td key={a.id} className="text-center py-3 px-4">
                          <span
                            className={cn(
                              'text-lg font-bold',
                              a.overallScore >= 70
                                ? 'text-green-400'
                                : a.overallScore >= 40
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                            )}
                          >
                            {a.overallScore}
                          </span>
                        </td>
                      ))}
                      {analyses.length === 2 &&
                        (() => {
                          const d = scoreDelta(analyses[0].overallScore, analyses[1].overallScore);
                          const Icon = d.icon;
                          return (
                            <td className={cn('text-center py-3 px-4', d.color)}>
                              <span className="inline-flex items-center gap-1">
                                <Icon size={14} /> {d.label}
                              </span>
                            </td>
                          );
                        })()}
                    </tr>

                    {/* Noise Score */}
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-gray-300">Noise Score</td>
                      {analyses.map(a => (
                        <td key={a.id} className="text-center py-3 px-4 text-white">
                          {a.noiseScore}
                        </td>
                      ))}
                      {analyses.length === 2 &&
                        (() => {
                          const d = scoreDelta(analyses[1].noiseScore, analyses[0].noiseScore);
                          const Icon = d.icon;
                          return (
                            <td className={cn('text-center py-3 px-4', d.color)}>
                              <span className="inline-flex items-center gap-1">
                                <Icon size={14} /> {d.label}
                              </span>
                            </td>
                          );
                        })()}
                    </tr>

                    {/* Bias Count */}
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-gray-300">Biases Detected</td>
                      {analyses.map(a => (
                        <td key={a.id} className="text-center py-3 px-4 text-white">
                          {a.biasCount}
                        </td>
                      ))}
                      {analyses.length === 2 && (
                        <td className="text-center py-3 px-4 text-gray-400">
                          {Math.abs(analyses[0].biasCount - analyses[1].biasCount)} diff
                        </td>
                      )}
                    </tr>

                    {/* Fact Check Score */}
                    <tr className="border-b border-white/5">
                      <td className="py-3 px-4 text-gray-300">Fact Check Score</td>
                      {analyses.map(a => (
                        <td key={a.id} className="text-center py-3 px-4 text-white">
                          {a.factCheckScore !== null ? a.factCheckScore : 'N/A'}
                        </td>
                      ))}
                      {analyses.length === 2 &&
                        analyses[0].factCheckScore !== null &&
                        analyses[1].factCheckScore !== null &&
                        (() => {
                          const d = scoreDelta(
                            analyses[0].factCheckScore!,
                            analyses[1].factCheckScore!
                          );
                          const Icon = d.icon;
                          return (
                            <td className={cn('text-center py-3 px-4', d.color)}>
                              <span className="inline-flex items-center gap-1">
                                <Icon size={14} /> {d.label}
                              </span>
                            </td>
                          );
                        })()}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bias overlap */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                  Top Biases by Document
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyses.map(a => (
                    <div key={a.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-white font-medium mb-2 truncate">{a.filename}</p>
                      {a.topBiases.length > 0 ? (
                        <ul className="space-y-1">
                          {a.topBiases.map((bias, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/60 flex-shrink-0" />
                              {bias.replace(/_/g, ' ')}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500">No biases detected</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Common biases */}
                {analyses.length >= 2 &&
                  (() => {
                    const allBiasSets = analyses.map(a => new Set(a.topBiases));
                    const common = [...allBiasSets[0]].filter(b =>
                      allBiasSets.every(s => s.has(b))
                    );
                    if (common.length === 0) return null;
                    return (
                      <div className="mt-4 p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                        <p className="text-xs font-medium text-yellow-400 mb-1">
                          Common biases across all selected:
                        </p>
                        <p className="text-xs text-yellow-300/80">
                          {common.map(b => b.replace(/_/g, ' ')).join(', ')}
                        </p>
                      </div>
                    );
                  })()}
              </div>
            </div>
          )}

          {!loading && analyses.length === 1 && (
            <div
              className={cn('p-6 rounded-xl text-center', 'liquid-glass', 'border border-white/10')}
            >
              <p className="text-gray-400">Select at least one more analysis to compare.</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
