'use client';

/**
 * JourneyDetailStrip — when a journey is active, this strip lays out
 * the ordered path as a horizontal step ribbon with the next un-visited
 * step highlighted as the recommended-next-action. Click any step to
 * jump straight to that tab.
 */

import { ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react';
import { NODES, type Journey, type TabId } from './founder-hub-map-data';

interface Props {
  journey: Journey;
  visited: Set<TabId>;
  onNavigate: (tabId: TabId) => void;
}

export function JourneyDetailStrip({ journey, visited, onNavigate }: Props) {
  const nodesById = new Map(NODES.map(n => [n.id, n]));

  // Walk the path; the FIRST step the user hasn't visited is the
  // "recommended next" — surfaces the next concrete action without
  // forcing the founder to think about ordering.
  const nextStepIdx = journey.path.findIndex(t => !visited.has(t));
  const completedCount = journey.path.filter(t => visited.has(t)).length;
  const pct = Math.round((completedCount / journey.path.length) * 100);

  return (
    <div style={wrap(journey.color)}>
      <div style={header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: journey.color,
              display: 'inline-block',
            }}
          />
          <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{journey.label}</strong>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            · {completedCount} of {journey.path.length} steps · ~{Math.round(journey.totalMinutes / 60)}h total
          </span>
        </div>
        <div style={progressTrack}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: journey.color,
              borderRadius: 999,
              transition: 'width 0.4s',
            }}
          />
        </div>
      </div>

      <div style={outcomeRow}>
        <span style={outcomeLabel}>Outcome:</span>
        <span style={outcomeText}>{journey.outcome}</span>
      </div>

      <div style={stepsRow} role="list" aria-label={`${journey.label} sequence`}>
        {journey.path.map((tabId, idx) => {
          const node = nodesById.get(tabId);
          if (!node) return null;
          const isVisited = visited.has(tabId);
          const isNext = idx === nextStepIdx;
          return (
            <div key={tabId} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => onNavigate(tabId)}
                style={{
                  ...stepBtn,
                  borderColor: isNext ? journey.color : isVisited ? journey.color : 'var(--border-color)',
                  background: isVisited
                    ? 'rgba(22, 163, 74, 0.06)'
                    : isNext
                      ? 'var(--bg-card)'
                      : 'var(--bg-secondary)',
                  boxShadow: isNext ? `0 0 0 3px ${journey.color}33` : 'none',
                }}
                role="listitem"
                aria-label={`Step ${idx + 1}: ${node.label}${isVisited ? ' (visited)' : ''}${isNext ? ' (next)' : ''}`}
              >
                <span style={stepIndex(journey.color)}>
                  {isVisited ? (
                    <CheckCircle2 size={14} color={journey.color} />
                  ) : (
                    <Circle size={14} color={journey.color} />
                  )}
                  <span>{idx + 1}</span>
                </span>
                <span style={stepLabel}>{node.label}</span>
                <span style={stepMinutes}>
                  <Clock size={9} /> {node.minutes}m
                </span>
              </button>
              {idx < journey.path.length - 1 && (
                <ArrowRight
                  size={14}
                  color="var(--text-muted)"
                  style={{ margin: '0 4px', flexShrink: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {nextStepIdx !== -1 && (
        <div style={nextActionRow}>
          <span style={nextActionEyebrow(journey.color)}>Recommended next →</span>
          <button
            type="button"
            onClick={() => onNavigate(journey.path[nextStepIdx])}
            style={primaryNextBtn(journey.color)}
          >
            Open {nodesById.get(journey.path[nextStepIdx])?.label}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
      {nextStepIdx === -1 && (
        <div style={{ ...nextActionRow, color: 'var(--success)' }}>
          <CheckCircle2 size={14} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            All {journey.path.length} steps explored. Pick a different journey or revisit any step
            to refresh.
          </span>
        </div>
      )}
    </div>
  );
}

const wrap = (color: string): React.CSSProperties => ({
  marginTop: 14,
  padding: 14,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderLeft: `3px solid ${color}`,
  borderRadius: 'var(--radius-lg)',
});

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
  flexWrap: 'wrap',
};

const progressTrack: React.CSSProperties = {
  marginLeft: 'auto',
  flex: '0 0 140px',
  height: 6,
  background: 'var(--bg-secondary)',
  borderRadius: 999,
  overflow: 'hidden',
};

const outcomeRow: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  marginBottom: 10,
  fontSize: 12,
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};

const outcomeLabel: React.CSSProperties = {
  fontWeight: 700,
  color: 'var(--text-primary)',
  flexShrink: 0,
};

const outcomeText: React.CSSProperties = {
  flex: 1,
};

const stepsRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 4,
  marginBottom: 12,
};

const stepBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  border: '1px solid',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
  fontSize: 11.5,
  color: 'var(--text-primary)',
};

const stepIndex = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 700,
  color,
  fontFamily: "'JetBrains Mono', monospace",
});

const stepLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-primary)',
};

const stepMinutes: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 3,
  fontSize: 10,
  color: 'var(--text-muted)',
  fontFamily: "'JetBrains Mono', monospace",
};

const nextActionRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 10,
  borderTop: '1px solid var(--border-color)',
  fontSize: 12,
};

const nextActionEyebrow = (color: string): React.CSSProperties => ({
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color,
});

const primaryNextBtn = (color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 700,
  color: '#FFFFFF',
  background: color,
  border: 'none',
  borderRadius: 'var(--radius-full)',
  cursor: 'pointer',
});
