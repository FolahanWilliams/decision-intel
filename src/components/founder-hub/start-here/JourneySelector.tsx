'use client';

/**
 * JourneySelector — picker tile-strip for the 5 journey modes plus a
 * "no journey · explore freely" reset. Sits above the FounderHubMap and
 * drives the highlighted path overlay.
 */

import { Compass } from 'lucide-react';
import { JOURNEYS, type Journey } from './founder-hub-map-data';

interface Props {
  active: Journey | null;
  onSelect: (journey: Journey | null) => void;
}

export function JourneySelector({ active, onSelect }: Props) {
  return (
    <div style={wrap}>
      <div style={headerRow}>
        <div>
          <div style={eyebrow}>What are you doing right now?</div>
          <div style={hint}>
            Pick a context and the map highlights the recommended sequence. The path is a
            suggestion, not a script — tab-hop freely; the highlights help you stay oriented.
          </div>
        </div>
        {active && (
          <button type="button" onClick={() => onSelect(null)} style={resetBtn} aria-label="Clear journey">
            ✕ Clear
          </button>
        )}
      </div>
      <div style={tilesGrid}>
        <FreeTile active={active === null} onClick={() => onSelect(null)} />
        {JOURNEYS.map(j => (
          <JourneyTile
            key={j.id}
            journey={j}
            active={active?.id === j.id}
            onClick={() => onSelect(j)}
          />
        ))}
      </div>
    </div>
  );
}

function FreeTile({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tileStyle,
        borderLeft: active ? '3px solid #475569' : '3px solid transparent',
        background: active ? 'var(--bg-card)' : 'var(--bg-secondary)',
      }}
      aria-pressed={active}
    >
      <div style={tileHeader}>
        <Compass size={14} color="#475569" />
        <span style={tileTitle}>Explore freely</span>
      </div>
      <div style={tileBody}>
        Show every connection at full opacity. Useful when you know the territory and want the
        bird&rsquo;s-eye view.
      </div>
    </button>
  );
}

function JourneyTile({
  journey,
  active,
  onClick,
}: {
  journey: Journey;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tileStyle,
        borderLeft: active ? `3px solid ${journey.color}` : '3px solid transparent',
        background: active ? 'var(--bg-card)' : 'var(--bg-secondary)',
      }}
      aria-pressed={active}
    >
      <div style={tileHeader}>
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
        <span style={tileTitle}>{journey.label}</span>
        <span style={tileMinutes}>~{Math.round(journey.totalMinutes / 60)}h</span>
      </div>
      <div style={tileBody}>{journey.description}</div>
      <div style={tileSteps}>{journey.path.length} steps</div>
    </button>
  );
}

const wrap: React.CSSProperties = {
  marginBottom: 14,
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 10,
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--accent-primary)',
};

const hint: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  maxWidth: 720,
};

const resetBtn: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 600,
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

const tilesGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 8,
};

const tileStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  transition: 'background 0.2s, border-color 0.2s',
};

const tileHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const tileTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const tileMinutes: React.CSSProperties = {
  marginLeft: 'auto',
  fontSize: 10,
  color: 'var(--text-muted)',
  fontFamily: "'JetBrains Mono', monospace",
};

const tileBody: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};

const tileSteps: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
