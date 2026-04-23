'use client';

/**
 * Partner detail — Overview tab.
 *
 * Renders the "what they do" section of the rich profile. Falls back
 * to "Not yet populated" placeholders so the tab still makes sense
 * while the founder is still researching a newly-added partner.
 */

import { Building2, Globe, Landmark, Users, Crown } from 'lucide-react';
import type { PartnerRichProfile } from '@/types/partner-profile';
import type { Application } from '../types';

interface Props {
  app: Application;
}

export function PartnerOverviewTab({ app }: Props) {
  const profile = app.richProfile ?? null;
  const w = profile?.whatTheyDo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Summary */}
      <Section title="Summary" icon={<Building2 size={14} />}>
        {w?.summary ? (
          <p style={{ ...para, marginBottom: 0 }}>{w.summary}</p>
        ) : (
          <Placeholder text="No summary yet. Populate richProfile.whatTheyDo.summary to render here." />
        )}
      </Section>

      {/* Scale */}
      {w?.scale && <ScaleRow scale={w.scale} />}

      {/* Services */}
      {w?.services && w.services.length > 0 && (
        <Section title="Services & offerings" icon={<Landmark size={14} />}>
          <div
            style={{
              display: 'grid',
              gap: 10,
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {w.services.map((s, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Philosophy + heritage */}
      {(w?.philosophy || w?.heritage) && (
        <Section title="Philosophy & heritage" icon={<Globe size={14} />}>
          {w.philosophy && (
            <div
              style={{
                padding: 10,
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.18)',
                borderRadius: 6,
                fontSize: 12.5,
                color: 'var(--text-primary)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                marginBottom: w.heritage ? 10 : 0,
              }}
            >
              {w.philosophy}
            </div>
          )}
          {w.heritage && <p style={para}>{w.heritage}</p>}
        </Section>
      )}

      {/* Key people */}
      {w?.keyPeople && w.keyPeople.length > 0 && (
        <Section title="Named people" icon={<Crown size={14} />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {w.keyPeople.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {p.name}
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      marginLeft: 8,
                    }}
                  >
                    {p.role}
                  </span>
                </div>
                {p.note && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-secondary)',
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    {p.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Intro context */}
      {profile?.introContext && (
        <Section title="How the intro happened" icon={<Users size={14} />}>
          <IntroContextRow ctx={profile.introContext} />
        </Section>
      )}
    </div>
  );
}

function ScaleRow({ scale }: { scale: NonNullable<PartnerRichProfile['whatTheyDo']>['scale'] }) {
  if (!scale) return null;
  const chips: Array<{ label: string; value: string }> = [];
  if (scale.aum) chips.push({ label: 'AUM', value: scale.aum });
  if (scale.teamSize) chips.push({ label: 'Team', value: scale.teamSize });
  if (scale.founded) chips.push({ label: 'Founded', value: scale.founded });
  if (scale.regulator) chips.push({ label: 'Regulator', value: scale.regulator });
  if (scale.headquarters) chips.push({ label: 'HQ', value: scale.headquarters });
  if (chips.length === 0 && (!scale.licenses || scale.licenses.length === 0)) return null;

  return (
    <div
      style={{
        padding: 14,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map(c => (
          <span
            key={c.label}
            style={{
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--bg-tertiary, rgba(0,0,0,0.03))',
              border: '1px solid var(--border-color)',
              fontSize: 11,
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, marginRight: 6 }}>
              {c.label}
            </span>
            {c.value}
          </span>
        ))}
      </div>
      {scale.licenses && scale.licenses.length > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 700, marginRight: 6 }}>
            Licences
          </span>
          {scale.licenses.join(' · ')}
        </div>
      )}
    </div>
  );
}

function IntroContextRow({ ctx }: { ctx: NonNullable<PartnerRichProfile['introContext']> }) {
  const rows: Array<{ label: string; value: string }> = [];
  if (ctx.source) rows.push({ label: 'Source', value: ctx.source });
  if (ctx.venue) rows.push({ label: 'Venue', value: ctx.venue });
  if (ctx.depth) rows.push({ label: 'Depth', value: ctx.depth });
  if (ctx.rule) rows.push({ label: 'Rule', value: ctx.rule });
  if (rows.length === 0) return <Placeholder text="No intro context captured yet." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(r => (
        <div
          key={r.label}
          style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, alignItems: 'start' }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              paddingTop: 2,
            }}
          >
            {r.label}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
            {r.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
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
        {title}
      </h3>
      {children}
    </section>
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

const para: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-primary)',
  lineHeight: 1.6,
  margin: '0 0 8px',
};
