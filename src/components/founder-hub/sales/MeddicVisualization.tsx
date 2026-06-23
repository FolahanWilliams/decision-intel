'use client';

/**
 * MeddicVisualization — the dynamic MEDDIC qualification surface.
 *
 * Two jobs in one: (1) a context-rich reference for each MEDDIC element applied
 * to the DI sale (discovery questions → DI application → DI proof → strong
 * signal → trap), and (2) a LIVE qualifier — mark each element unknown / weak /
 * strong for a named prospect, persisted, with a deal-health gauge so the weak
 * links jump out before the next call. Content SSOT: meddic-data.ts.
 */

import { useState, useEffect } from 'react';
import { MEDDIC, QUAL_META, type MeddicId, type QualStatus } from './meddic-data';

const STORAGE_KEY = 'di-meddic-qual-v1';
const STATUSES: QualStatus[] = ['unknown', 'weak', 'strong'];

function defaultQual(): Record<MeddicId, QualStatus> {
  return MEDDIC.reduce(
    (acc, el) => {
      acc[el.id] = 'unknown';
      return acc;
    },
    {} as Record<MeddicId, QualStatus>
  );
}

export function MeddicVisualization() {
  const [activeId, setActiveId] = useState<MeddicId>(MEDDIC[0].id);
  const [qual, setQual] = useState<Record<MeddicId, QualStatus>>(defaultQual);
  const [dealName, setDealName] = useState('');

  // Hydrate from localStorage (deferred to satisfy react-hooks/set-state-in-effect).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          dealName?: string;
          status?: Partial<Record<MeddicId, QualStatus>>;
        };
        if (parsed.status) setQual(q => ({ ...q, ...parsed.status }));
        if (typeof parsed.dealName === 'string') setDealName(parsed.dealName);
      } catch {
        // malformed localStorage — start fresh (allowed silent-catch class)
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function persist(nextQual: Record<MeddicId, QualStatus>, nextDeal: string) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dealName: nextDeal, status: nextQual }));
    } catch {
      // localStorage unavailable (private mode) — non-fatal
    }
  }

  function setStatus(id: MeddicId, status: QualStatus) {
    const next = { ...qual, [id]: status };
    setQual(next);
    persist(next, dealName);
  }

  function onDealNameChange(v: string) {
    setDealName(v);
    persist(qual, v);
  }

  function reset() {
    const fresh = defaultQual();
    setQual(fresh);
    setDealName('');
    persist(fresh, '');
  }

  const active = MEDDIC.find(el => el.id === activeId) ?? MEDDIC[0];
  const strongCount = MEDDIC.filter(el => qual[el.id] === 'strong').length;
  const weakLinks = MEDDIC.filter(el => qual[el.id] !== 'strong');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Intro */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            marginBottom: 4,
          }}
        >
          MEDDIC · qualify the pilot
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The enterprise qualification framework, mapped to the DI sale. Click a letter for the
          discovery questions, how it applies to your wedge buyer, and the DI proof. Then mark each
          one for a live prospect — the weak links are exactly what to close before the next call.
        </p>
      </div>

      {/* Deal name + health gauge */}
      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Deal</span>
          <input
            value={dealName}
            onChange={e => onDealNameChange(e.target.value)}
            placeholder="Name the prospect / deal you are qualifying…"
            style={{
              flex: '1 1 240px',
              minWidth: 0,
              padding: '6px 10px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {strongCount} / {MEDDIC.length} strong
          </span>
          <button onClick={reset} style={resetBtnStyle}>
            Reset
          </button>
        </div>
        {/* Segmented health bar */}
        <div style={{ display: 'flex', gap: 4 }}>
          {MEDDIC.map(el => (
            <div
              key={el.id}
              title={`${el.name}: ${QUAL_META[qual[el.id]].label}`}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                background: QUAL_META[qual[el.id]].color,
                opacity: qual[el.id] === 'unknown' ? 0.4 : 1,
              }}
            />
          ))}
        </div>
        {weakLinks.length > 0 && (
          <div
            style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}
          >
            <strong style={{ color: 'var(--warning)' }}>Close next:</strong>{' '}
            {weakLinks.map(el => el.name).join(' · ')}
          </div>
        )}
      </div>

      {/* The 6-letter viz row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {MEDDIC.map(el => {
          const isActive = el.id === activeId;
          const status = qual[el.id];
          return (
            <button
              key={el.id}
              onClick={() => setActiveId(el.id)}
              style={{
                flex: '1 1 110px',
                minWidth: 100,
                textAlign: 'left',
                padding: '12px 12px 10px',
                borderRadius: 12,
                border: `1px solid ${isActive ? el.color : 'var(--border-color)'}`,
                background: isActive
                  ? `color-mix(in srgb, ${el.color} 10%, var(--bg-secondary))`
                  : 'var(--bg-secondary)',
                borderTop: `3px solid ${el.color}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ fontSize: 26, fontWeight: 800, color: el.color, lineHeight: 1 }}>
                  {el.letter}
                </span>
                <span
                  title={QUAL_META[status].label}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: QUAL_META[status].color,
                    opacity: status === 'unknown' ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginTop: 6,
                  lineHeight: 1.25,
                }}
              >
                {el.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active element detail */}
      <div style={{ ...cardStyle, borderLeft: `3px solid ${active.color}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: active.color, lineHeight: 1 }}>
            {active.letter}
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {active.name}
          </span>
        </div>
        <div
          style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}
        >
          {active.tagline}
        </div>

        {/* Qualification toggle for the active element */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
            }}
          >
            This deal
          </span>
          {STATUSES.map(s => {
            const on = qual[active.id] === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(active.id, s)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 9999,
                  cursor: 'pointer',
                  color: on ? '#fff' : 'var(--text-secondary)',
                  background: on ? QUAL_META[s].color : 'var(--bg-card)',
                  border: `1px solid ${on ? QUAL_META[s].color : 'var(--border-color)'}`,
                }}
              >
                {QUAL_META[s].label}
              </button>
            );
          })}
        </div>

        <Label>The question</Label>
        <Body>{active.question}</Body>

        <Label>Discovery questions</Label>
        <ul
          style={{
            margin: '0 0 6px',
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {active.discoveryQuestions.map((q, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {q}
            </li>
          ))}
        </ul>

        <Label>How it applies to the DI sale</Label>
        <Body>{active.diApplication}</Body>

        <Label>DI proof</Label>
        <div style={{ display: 'grid', gap: 8, marginBottom: 6 }}>
          {active.diProof.map((p, i) => (
            <div
              key={i}
              style={{
                padding: '9px 11px',
                background: `color-mix(in srgb, ${active.color} 8%, var(--bg-secondary))`,
                border: `1px solid color-mix(in srgb, ${active.color} 28%, transparent)`,
                borderRadius: 8,
              }}
            >
              <div
                style={{ fontSize: 12.5, fontWeight: 700, color: active.color, marginBottom: 2 }}
              >
                {p.label}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {p.detail}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 8,
            marginTop: 8,
          }}
        >
          <SignalBox kind="strong" body={active.strongSignal} />
          <SignalBox kind="trap" body={active.trap} />
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 16,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
};

const resetBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-muted)',
        marginTop: 12,
        marginBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: 6 }}>
      {children}
    </div>
  );
}

function SignalBox({ kind, body }: { kind: 'strong' | 'trap'; body: string }) {
  const color = kind === 'strong' ? 'var(--success)' : 'var(--error)';
  const label = kind === 'strong' ? 'Strong signal' : 'The trap';
  return (
    <div
      style={{
        padding: '9px 11px',
        background: `color-mix(in srgb, ${color} 9%, transparent)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
