'use client';

import { useState } from 'react';
import { Zap, ShieldAlert, ChevronRight, ChevronDown, Shield } from 'lucide-react';
import { CognitiveSovereigntyStack } from './FounderOSPanel';
import {
  STRENGTHS,
  WEAKNESSES,
  type Strength,
  type Weakness,
} from './data/strengths-weaknesses';

const SEVERITY_COLOR = {
  critical: '#DC2626',
  high: '#D97706',
  medium: '#0EA5E9',
};

const CATEGORY_COLOR = {
  execution: '#16A34A',
  intellectual: '#7C3AED',
  narrative: '#D97706',
  network: '#0EA5E9',
  compliance: '#DC2626',
};

function StrengthCard({
  s,
  isOpen,
  onToggle,
}: {
  s: Strength;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const accent = CATEGORY_COLOR[s.category];
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isOpen ? accent : 'var(--border-color)'}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: accent,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {s.rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {s.title}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: 4,
            }}
          >
            {s.category}
          </div>
        </div>
        <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isOpen && (
        <div style={{ padding: '0 14px 14px 50px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Evidence
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
              {s.evidence.map(e => (
                <li
                  key={e}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}
                >
                  {e}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 6,
              }}
            >
              Why it matters
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {s.whyItMatters}
            </p>
          </div>

          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#7C3AED',
                marginBottom: 6,
              }}
            >
              How to weaponise
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
              {s.howToWeaponize.map(h => (
                <li
                  key={h}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.15)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#DC2626',
                marginBottom: 4,
              }}
            >
              Tripwire
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.tripwire}</div>
          </div>

          {s.nbLmCitation && (
            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              Source: {s.nbLmCitation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeaknessCard({
  w,
  isOpen,
  onToggle,
}: {
  w: Weakness;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const accent = SEVERITY_COLOR[w.severity];
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isOpen ? accent : 'var(--border-color)'}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          padding: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: accent,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {w.rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {w.title}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginTop: 4,
            }}
          >
            {w.severity}
          </div>
        </div>
        <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isOpen && (
        <div style={{ padding: '0 14px 14px 50px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                marginBottom: 6,
              }}
            >
              Evidence
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
              {w.evidence.map(e => (
                <li
                  key={e}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}
                >
                  {e}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#DC2626',
                marginBottom: 6,
              }}
            >
              Why it hurts
            </div>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {w.whyItHurts}
            </p>
          </div>

          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 6,
              }}
            >
              Countermove
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
              {w.countermove.map(c => (
                <li
                  key={c}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: 'rgba(22,163,74,0.06)',
              border: '1px solid rgba(22,163,74,0.18)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#16A34A',
                marginBottom: 4,
              }}
            >
              Next 30 days
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{w.next30Days}</div>
          </div>

          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.15)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#DC2626',
                marginBottom: 4,
              }}
            >
              Tripwire
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{w.tripwire}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StrengthsWeaknessesMatrix() {
  const [openStrengthIds, setOpenStrengthIds] = useState<Set<string>>(new Set([STRENGTHS[0].id]));
  const [openWeaknessIds, setOpenWeaknessIds] = useState<Set<string>>(new Set([WEAKNESSES[0].id]));

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };

  return (
    <>
      {/* Foundation block — Cognitive Sovereignty Stack interwoven 2026-05-02
          per the founder's "interweave, don't pile" course-correct. The 4
          tiers (protect → acquire → encode → deploy) are the operating-
          system-level strengths that all 5 weaponisable strengths below
          rest on. Without Tier 1 (neurobiological protection) the upper
          tiers collapse — the prefrontal cortex can't orchestrate the 5
          strengths if its dopaminergic baseline is hijacked by short-form
          video. Reading this block FIRST reframes the strengths-vs-weaknesses
          matrix: every weakness below is what happens when a sovereignty
          tier is neglected. */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Shield size={12} /> Foundation · Cognitive Sovereignty Stack
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            marginBottom: 10,
          }}
        >
          The 4-tier protocol stack underwriting every strength below. Each tier
          names the protocol + the source. Tier 1 is the foundation — without
          neurobiological protection, the upper tiers collapse. The 5 strengths
          to weaponise (right) and 5 weaknesses to neutralise (further right)
          all rest on this stack being maintained.
        </div>
        <CognitiveSovereigntyStack />
      </div>

    <div className="sw-grid">
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#16A34A',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Zap size={12} /> 5 strengths to weaponise
        </div>
        {STRENGTHS.map(s => (
          <StrengthCard
            key={s.id}
            s={s}
            isOpen={openStrengthIds.has(s.id)}
            onToggle={() => toggle(openStrengthIds, s.id, setOpenStrengthIds)}
          />
        ))}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#DC2626',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldAlert size={12} /> 5 weaknesses to neutralise
        </div>
        {WEAKNESSES.map(w => (
          <WeaknessCard
            key={w.id}
            w={w}
            isOpen={openWeaknessIds.has(w.id)}
            onToggle={() => toggle(openWeaknessIds, w.id, setOpenWeaknessIds)}
          />
        ))}
      </div>

      <style>{`
        .sw-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .sw-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
    </>
  );
}
