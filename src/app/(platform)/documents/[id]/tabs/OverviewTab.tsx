'use client';

import { useEffect, useState } from 'react';
import { BiasInstance } from '@/types';
import { formatDate } from '@/lib/utils/format-date';
import { Brain, Lightbulb, ExternalLink, BarChart3 } from 'lucide-react';
import { DocumentTextHighlighter } from '@/components/visualizations/DocumentTextHighlighter';
import { BiasSparklineWithData } from '@/components/visualizations/BiasSparkline';
import { BiasNetwork } from '@/components/visualizations/BiasNetwork';
import { RiskHeatMap } from '@/components/visualizations/RiskHeatMap';
import { DecisionTimeline } from '@/components/visualizations/DecisionTimeline';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ResearchInsight } from '@/types';

interface ExtendedBiasInstance extends BiasInstance {
  researchInsight: ResearchInsight;
}

interface BiasFrequencyData {
  displayName: string;
  total: number;
  timeline: Array<{ date: string; count: number }>;
}

interface OverviewTabProps {
  documentContent: string;
  biases: BiasInstance[];
  uploadedAt: string;
  analysisCreatedAt?: string;
}

const SEVERITY_BADGE_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
};

const SEVERITY_BORDER_STYLES: Record<string, string> = {
  critical: 'border-red-500/20 bg-red-500/5',
  high: 'border-orange-500/20 bg-orange-500/5',
  medium: 'border-yellow-500/20 bg-yellow-500/5',
  low: 'border-border',
};

export function OverviewTab({
  documentContent,
  biases,
  uploadedAt,
  analysisCreatedAt,
}: OverviewTabProps) {
  // Fetch historical bias frequencies for sparklines
  const [biasFrequencies, setBiasFrequencies] = useState<Record<
    string,
    BiasFrequencyData
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/bias-frequency')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled && data?.frequencies) {
          setBiasFrequencies(data.frequencies);
        }
      })
      .catch(() => {
        // Sparklines are non-critical; silently degrade
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-lg">
      {/* 1. Document Text Highlighter — replaces old BiasHeatmap with sidebar linking */}
      <ErrorBoundary sectionName="Document Bias Highlighter">
        <DocumentTextHighlighter content={documentContent} biases={biases} />
      </ErrorBoundary>

      {/* 2. Bias Network + Risk Landscape side-by-side */}
      <ErrorBoundary sectionName="Bias Network & Risk Map">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg" style={{ minHeight: '400px' }}>
          <div className="card overflow-hidden">
            <div className="card-header">
              <h4>Bias Network Map</h4>
            </div>
            <div className="card-body overflow-hidden">
              <BiasNetwork
                biases={biases.map((b, i) => ({
                  ...b,
                  id: b.id || `bias-${i}`,
                  category: 'cognitive',
                }))}
                compact
              />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h4>Risk Landscape</h4>
            </div>
            <div className="card-body">
              <RiskHeatMap
                risks={biases.map(b => ({
                  category: b.biasType,
                  impact:
                    b.severity === 'critical'
                      ? 90
                      : b.severity === 'high'
                        ? 70
                        : b.severity === 'medium'
                          ? 50
                          : 30,
                  probability: 60,
                }))}
              />
            </div>
          </div>
        </div>
      </ErrorBoundary>

      {/* 3. Decision Timeline */}
      <ErrorBoundary sectionName="Decision Timeline">
        <div className="card">
          <div className="card-header">
            <h4>Decision Timeline</h4>
          </div>
          <div className="card-body">
            <DecisionTimeline
              events={[
                {
                  id: '1',
                  date: formatDate(uploadedAt),
                  title: 'Document Uploaded',
                  description: 'Initial file ingestion.',
                  type: 'info',
                  status: 'completed',
                },
                {
                  id: '2',
                  date: analysisCreatedAt ? formatDate(analysisCreatedAt) : 'Pending',
                  title: 'AI Audit Completed',
                  description: 'Deep scan for biases and noise.',
                  type: 'decision',
                  status: 'completed',
                },
              ]}
            />
          </div>
        </div>
      </ErrorBoundary>

      {/* 4. Bias Details with inline sparklines */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <Brain size={16} /> Bias Details
            </h3>
            {biasFrequencies && (
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <BarChart3 size={10} />
                Sparklines show historical frequency across your documents
              </span>
            )}
          </div>
        </div>
        <div className="card-body">
          {biases.length === 0 ? (
            <div className="text-center p-8 text-muted">No cognitive biases detected.</div>
          ) : (
            <div className="space-y-4">
              {biases.map((bias, i) => {
                const severityKey = bias.severity.toLowerCase();
                const badgeStyle = SEVERITY_BADGE_STYLES[severityKey] ?? 'bg-slate-700 text-slate-300';
                const borderStyle = SEVERITY_BORDER_STYLES[severityKey] ?? 'border-border';

                return (
                  <div
                    key={i}
                    className={`p-4 border bg-card/50 ${borderStyle}`}
                  >
                    <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold uppercase px-2 py-0.5 ${badgeStyle}`}
                        >
                          {bias.biasType}
                        </span>
                        <span className={`text-xs capitalize ${badgeStyle} px-1.5 py-0.5`}>
                          {bias.severity}
                        </span>
                      </div>
                      {/* Sparkline: historical frequency for this bias type */}
                      <BiasSparklineWithData
                        biasType={bias.biasType}
                        severity={bias.severity}
                        frequencies={biasFrequencies}
                        width={80}
                        height={20}
                      />
                    </div>
                    <p className="text-sm italic text-slate-300 border-l-2 border-slate-700 pl-3 my-2">
                      &quot;{bias.excerpt}&quot;
                    </p>
                    <p className="text-sm text-slate-400 mb-3">{bias.explanation}</p>

                    {(bias as unknown as ExtendedBiasInstance).researchInsight && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Lightbulb className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-blue-300">
                            Scientific Insight
                          </span>
                        </div>
                        <a
                          href={(bias as unknown as ExtendedBiasInstance).researchInsight.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-300 hover:text-blue-200 block mb-1"
                        >
                          {(bias as unknown as ExtendedBiasInstance).researchInsight.title}{' '}
                          <ExternalLink size={10} className="inline ml-1" />
                        </a>
                        <p className="text-xs text-slate-400">
                          {(bias as unknown as ExtendedBiasInstance).researchInsight.summary}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
