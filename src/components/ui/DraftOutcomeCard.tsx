'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraftOutcomeCardProps {
  analysisId: string;
}

interface DraftOutcome {
  id: string;
  outcome: string;
  confidence: number;
  evidence: string[];
  source: string;
  createdAt: string;
}

function formatSource(source: string): string {
  return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function outcomeBadge(outcome: string): string {
  switch (outcome) {
    case 'success':
      return 'bg-green-500/15 text-green-400';
    case 'partial_success':
      return 'bg-yellow-500/15 text-yellow-400';
    case 'failure':
      return 'bg-red-500/15 text-red-400';
    default:
      return 'bg-zinc-500/15 text-zinc-400';
  }
}

export function DraftOutcomeCard({ analysisId }: DraftOutcomeCardProps) {
  const [drafts, setDrafts] = useState<DraftOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/outcomes/draft');
      if (!res.ok) return;
      const data = await res.json();
      // Filter to this analysis only
      const relevant = (data.drafts || []).filter(
        (d: { analysisId: string }) => d.analysisId === analysisId
      );
      setDrafts(relevant);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleAction = async (draftId: string, action: 'confirm' | 'dismiss') => {
    setActionLoading(draftId);
    try {
      const res = await fetch('/api/outcomes/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action }),
      });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
      }
    } catch {
      // Silent fail
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || drafts.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Outcome Detected</span>
      </div>

      {drafts.map(draft => (
        <div key={draft.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${outcomeBadge(draft.outcome)}`}
            >
              {draft.outcome.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-muted-foreground">
              via {formatSource(draft.source)} ({(draft.confidence * 100).toFixed(0)}% confidence)
            </span>
          </div>

          {draft.evidence.length > 0 && (
            <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
              {draft.evidence[0].slice(0, 200)}
              {draft.evidence[0].length > 200 ? '...' : ''}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              disabled={actionLoading === draft.id}
              onClick={() => handleAction(draft.id, 'confirm')}
            >
              {actionLoading === draft.id ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Check className="mr-1 h-3 w-3" />
              )}
              Confirm Outcome
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              disabled={actionLoading === draft.id}
              onClick={() => handleAction(draft.id, 'dismiss')}
            >
              <X className="mr-1 h-3 w-3" />
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
