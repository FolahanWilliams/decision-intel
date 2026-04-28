'use client';

import { useState } from 'react';
import { ShieldAlert, HelpCircle, GitCompare } from 'lucide-react';
import { KILLER_RESPONSES, type KillerResponse } from './data';

const SCENARIO_ACCENT: Record<KillerResponse['scenario'], string> = {
  not_right_now: '#D97706',
  confused: '#0EA5E9',
  too_expensive: '#DC2626',
  we_have_a_process: '#7C3AED',
  how_are_you_different: '#16A34A',
};

const SCENARIO_LABEL: Record<KillerResponse['scenario'], string> = {
  not_right_now: '"This isn\'t for us right now"',
  confused: '"I\'m confused / I don\'t see the benefit"',
  too_expensive: '"This is too expensive"',
  we_have_a_process: '"We already have a process"',
  how_are_you_different: '"How are you different from [incumbent]?"',
};

const SCENARIO_ICON: Record<KillerResponse['scenario'], React.ComponentType<{ size?: number }>> = {
  not_right_now: ShieldAlert,
  confused: HelpCircle,
  too_expensive: ShieldAlert,
  we_have_a_process: ShieldAlert,
  how_are_you_different: GitCompare,
};

export function KillerResponsesPlaybook() {
  const scenarios = Array.from(new Set(KILLER_RESPONSES.map(r => r.scenario)));
  const [activeScenario, setActiveScenario] = useState<KillerResponse['scenario']>(scenarios[0]);

  const filtered = KILLER_RESPONSES.filter(r => r.scenario === activeScenario);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {scenarios.map(s => {
          const Icon = SCENARIO_ICON[s];
          const accent = SCENARIO_ACCENT[s];
          const isActive = s === activeScenario;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setActiveScenario(s)}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isActive ? accent : 'var(--border-color)'}`,
                background: isActive ? `${accent}12` : 'var(--bg-card)',
                color: isActive ? accent : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon size={12} /> {SCENARIO_LABEL[s]}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(r => {
          const accent = SCENARIO_ACCENT[r.scenario];
          return (
            <div
              key={r.id}
              style={{
                padding: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {r.responseCategory}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  marginBottom: 10,
                  lineHeight: 1.5,
                }}
              >
                Buyer signal: {r.buyerSignal}
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                  }}
                >
                  The underlying roadblock
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {r.underlyingRoadblock}
                </div>
              </div>

              <div
                style={{
                  padding: 12,
                  background: `${accent}08`,
                  border: `1px solid ${accent}28`,
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 6,
                  }}
                >
                  Exact phrasing · say this verbatim
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                    fontWeight: 500,
                    fontStyle: 'italic',
                  }}
                >
                  {r.exactPhrasing}
                </div>
              </div>

              <div className="killer-grid">
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#16A34A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Why it works
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {r.whyItWorks}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#7C3AED',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Follow-up move
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {r.followUpMove}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .killer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 700px) {
          .killer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
