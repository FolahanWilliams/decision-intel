'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Lightbulb, ArrowRight, Loader2 } from 'lucide-react';

interface Recommendation {
  type: 'precedent' | 'warning' | 'strategy';
  title: string;
  description: string;
  relatedAnalysisId: string;
  relatedDocumentId: string;
  confidence: number;
  outcome: string;
  scoreDiff: number;
}

interface RecommendationsPanelProps {
  analysisId: string;
}

export function RecommendationsPanel({ analysisId }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      try {
        // Get orgId
        const teamRes = await fetch('/api/team');
        if (!teamRes.ok) return;
        const teamData = await teamRes.json();
        const orgId = teamData?.orgId || teamData?.organization?.id;
        if (!orgId || cancelled) return;

        const res = await fetch(
          `/api/decision-graph/recommendations?analysisId=${encodeURIComponent(analysisId)}&orgId=${encodeURIComponent(orgId)}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setRecommendations(data.recommendations || []);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 size={14} className="animate-spin" />
        Loading recommendations...
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <Lightbulb size={14} style={{ color: 'var(--warning)' }} />
        Graph Recommendations
      </h3>
      <div className="space-y-2">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="p-3 rounded-lg border"
            style={{
              background: rec.type === 'warning' ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
              borderColor: rec.type === 'warning' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
            }}
          >
            <div className="flex items-start gap-2">
              {rec.type === 'warning' ? (
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--error)' }}
                />
              ) : (
                <CheckCircle
                  size={14}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--success)' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground mb-1">{rec.title}</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {rec.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    Confidence: {Math.round(rec.confidence * 100)}%
                  </span>
                  <Link
                    href={`/documents/${rec.relatedDocumentId}`}
                    className="flex items-center gap-1 text-[10px]"
                    style={{ color: 'var(--info)' }}
                  >
                    View decision <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
