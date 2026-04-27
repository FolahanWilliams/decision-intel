'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, ThumbsUp, ThumbsDown, Loader2, ArrowRight } from 'lucide-react';
import { useNudges, type NudgeSummary } from '@/hooks/useHumanDecisions';
import { SEVERITY_STYLES, NUDGE_TYPE_LABELS } from '@/lib/constants/human-audit';

export function NudgeWidget() {
  const { nudges: allNudges, mutate } = useNudges(false, 100);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const unacked = allNudges.filter(n => !n.acknowledgedAt).slice(0, 3);

  if (unacked.length === 0) return null;

  const handleAcknowledge = async (nudgeId: string, wasHelpful: boolean) => {
    setAcknowledging(nudgeId);
    try {
      const res = await fetch('/api/nudges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId, wasHelpful }),
      });
      if (res.ok) await mutate();
    } catch (err) {
      console.warn('[NudgeWidget] acknowledge failed:', err);
    } finally {
      setAcknowledging(null);
    }
  };

  const totalUnacked = allNudges.filter(n => !n.acknowledgedAt).length;

  return (
    <div className="card card-glow animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div
        className="card-header flex items-center justify-between"
        style={{ padding: '14px 20px' }}
      >
        <div className="flex items-center gap-sm">
          <Bell size={16} style={{ color: 'var(--warning)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Active Nudges</h3>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              background: 'var(--warning)',
              color: '#000',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            {totalUnacked}
          </span>
        </div>
        <Link
          href="/dashboard/decision-quality?tab=nudges"
          className="flex items-center gap-xs"
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div style={{ padding: 0 }}>
        {unacked.map((nudge: NudgeSummary, idx: number) => {
          const severity = SEVERITY_STYLES[nudge.severity] || SEVERITY_STYLES.info;
          const isAcking = acknowledging === nudge.id;
          return (
            <div
              key={nudge.id}
              style={{
                padding: '12px 20px',
                borderTop: idx === 0 ? 'none' : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <AlertTriangle
                size={14}
                style={{ color: severity.color, marginTop: 2, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: severity.color }}>
                    {NUDGE_TYPE_LABELS[nudge.nudgeType] || nudge.nudgeType}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      padding: '1px 6px',
                      background: severity.color,
                      color: '#fff',
                      fontWeight: 600,
                      borderRadius: '3px',
                    }}
                  >
                    {nudge.severity.toUpperCase()}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {nudge.message}
                </p>
              </div>
              <div className="flex items-center gap-xs" style={{ flexShrink: 0 }}>
                <button
                  onClick={() => handleAcknowledge(nudge.id, true)}
                  disabled={isAcking}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--success)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    opacity: isAcking ? 0.5 : 1,
                  }}
                  title="Helpful"
                >
                  {isAcking ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ThumbsUp size={14} />
                  )}
                </button>
                <button
                  onClick={() => handleAcknowledge(nudge.id, false)}
                  disabled={isAcking}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    opacity: isAcking ? 0.5 : 1,
                  }}
                  title="Dismiss"
                >
                  <ThumbsDown size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
