'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  MessageCircle,
  Mail,
  Mic,
  Globe,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraftOutcome {
  id: string;
  analysisId: string;
  outcome: string;
  confidence: number;
  evidence: string[];
  source: string;
  sourceRef: string;
  createdAt: string;
  analysisTitle: string;
  decisionStatement: string | null;
}

function formatSource(source: string): string {
  return source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Icon + color per source channel (M5.4). Keeps the channel visible at a
 * glance in the banner so users can tell whether a draft came from a
 * forwarded email, a Slack message, or a meeting transcript.
 */
function sourceVisuals(source: string): { Icon: typeof FileText; color: string } {
  switch (source) {
    case 'document':
      return { Icon: FileText, color: '#60a5fa' }; // blue
    case 'slack':
      return { Icon: MessageCircle, color: '#a78bfa' }; // purple
    case 'email':
      return { Icon: Mail, color: '#f472b6' }; // pink
    case 'meeting':
      return { Icon: Mic, color: '#fbbf24' }; // amber
    case 'web_intelligence':
      return { Icon: Globe, color: '#4ade80' }; // green
    default:
      return { Icon: Lightbulb, color: '#71717a' };
  }
}

/**
 * "2 days ago" style relative timestamp. Cheap, no dep on date-fns.
 * M5.4: surfaces draft age so stale drafts can be noticed + cleared.
 */
function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days < 1) {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    return hours < 1 ? 'just now' : `${hours}h ago`;
  }
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
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

export function DraftOutcomeBanner() {
  const [drafts, setDrafts] = useState<DraftOutcome[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/outcomes/draft');
      if (!res.ok) return;
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch {
      // Silently fail — feature may not be migrated yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleAction = async (draftId: string, action: 'confirm' | 'dismiss') => {
    setActionLoading(draftId);
    setActionError(null);
    try {
      const res = await fetch('/api/outcomes/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, action }),
      });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
      } else {
        setActionError(`Failed to ${action} outcome. Please try again.`);
      }
    } catch {
      setActionError(`Failed to ${action} outcome. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || drafts.length === 0) return null;

  return (
    <div role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
        aria-label={`${drafts.length} draft outcomes detected. ${expanded ? 'Collapse' : 'Expand'} to review.`}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            {drafts.length} decision{drafts.length !== 1 ? 's' : ''} may have outcomes detected
          </span>
          {/* M5.4 — surface per-source activity chips so users can tell at
              a glance which passive channels the flywheel is firing from. */}
          <div className="flex items-center gap-1 ml-1">
            {(() => {
              const sourceSet = new Set(drafts.map(d => d.source));
              return Array.from(sourceSet).map(src => {
                const { Icon: SrcIcon, color } = sourceVisuals(src);
                const count = drafts.filter(d => d.source === src).length;
                return (
                  <span
                    key={src}
                    title={`${count} from ${formatSource(src)}`}
                    className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      color,
                      background: `${color}15`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <SrcIcon className="h-2.5 w-2.5" />
                    {count}
                  </span>
                );
              });
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Review</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {actionError && (
            <div
              className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400"
              role="alert"
            >
              {actionError}
            </div>
          )}
          {drafts.map(draft => (
            <div key={draft.id} className="rounded-md border border-border bg-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{draft.analysisTitle}</div>
                  {draft.decisionStatement && (
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {draft.decisionStatement}
                    </div>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${outcomeBadge(draft.outcome)}`}
                >
                  {draft.outcome.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {(() => {
                  const { Icon: SourceIcon, color: sourceColor } = sourceVisuals(draft.source);
                  return (
                    <span className="inline-flex items-center gap-1" style={{ color: sourceColor }}>
                      <SourceIcon className="h-3 w-3" />
                      {formatSource(draft.source)}
                    </span>
                  );
                })()}
                <span>Confidence: {(draft.confidence * 100).toFixed(0)}%</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {relativeTime(draft.createdAt)}
                </span>
              </div>

              {draft.evidence.length > 0 && (
                <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
                  {draft.evidence[0].slice(0, 150)}
                  {draft.evidence[0].length > 150 ? '...' : ''}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
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
                  Confirm
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
      )}
    </div>
  );
}
