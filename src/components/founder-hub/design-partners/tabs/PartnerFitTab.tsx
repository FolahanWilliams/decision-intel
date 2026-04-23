'use client';

/**
 * Partner detail — Fit Thesis tab.
 *
 * Renders the 5 wedges + risks + strategic value. Each wedge card
 * has the "where Decision Intel intersects" callout so the founder
 * can scan and rehearse.
 */

import { Target, ShieldAlert, TrendingUp } from 'lucide-react';
import type { Application } from '../types';

interface Props {
  app: Application;
}

export function PartnerFitTab({ app }: Props) {
  const profile = app.richProfile ?? null;
  const wedges = profile?.wedges ?? [];
  const risks = profile?.risks ?? [];
  const strategic = profile?.strategic ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section>
        <SectionHeading icon={<Target size={14} />} label={`Fit wedges (${wedges.length})`} />
        {wedges.length === 0 ? (
          <Placeholder text="No wedges captured yet. Populate richProfile.wedges[] to render." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wedges.map((w, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid var(--border-color)',
                  borderLeft: '3px solid var(--accent-primary)',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {w.title}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: '0 0 10px',
                  }}
                >
                  {w.description}
                </p>
                <div
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(22,163,74,0.06)',
                    borderRadius: 6,
                    borderLeft: '2px solid var(--accent-primary)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      marginBottom: 4,
                    }}
                  >
                    Where Decision Intel intersects
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    {w.diIntersect}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {risks.length > 0 && (
        <section>
          <SectionHeading icon={<ShieldAlert size={14} />} label="Risks to watch" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {risks.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(234,179,8,0.06)',
                  border: '1px solid rgba(234,179,8,0.22)',
                  borderRadius: 6,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {r.title}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.55,
                    marginTop: 4,
                  }}
                >
                  {r.detail}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {strategic &&
        (strategic.arr ||
          strategic.cohortConversion ||
          strategic.socialProof ||
          strategic.narrativeShift) && (
          <section>
            <SectionHeading icon={<TrendingUp size={14} />} label="Strategic value if they sign" />
            <div
              style={{
                display: 'grid',
                gap: 10,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              {strategic.arr && <StratCard label="Recurring revenue" value={strategic.arr} />}
              {strategic.cohortConversion && (
                <StratCard label="Cohort impact" value={strategic.cohortConversion} />
              )}
              {strategic.socialProof && (
                <StratCard label="Social-proof unlock" value={strategic.socialProof} />
              )}
              {strategic.narrativeShift && (
                <StratCard label="Narrative shift" value={strategic.narrativeShift} />
              )}
            </div>
          </section>
        )}
    </div>
  );
}

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h3
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: '0 0 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      {label}
    </h3>
  );
}

function StratCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 12,
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>{value}</div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        padding: 10,
        border: '1px dashed var(--border-color)',
        borderRadius: 6,
      }}
    >
      {text}
    </div>
  );
}
