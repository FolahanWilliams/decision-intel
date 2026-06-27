'use client';

/**
 * The Human Pitch — founder-private framing tab.
 *
 * You sell to humans who do not care about R²F / DQI / DPR. This tab holds the
 * plain-English pitch: analogies a stranger gets in one sentence (each with a
 * dynamic viz), the frame per audience, the bias-leverage persuasion system
 * from the new books, and the guardrails (jargon to drop, overclaims to avoid).
 *
 * Reads the SSOT in framing/framing-data.ts. Edit the strings there.
 */

import { Eye, Users, Lightbulb, Languages, ShieldAlert } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { AnalogyViz } from './framing/FramingVizzes';
import {
  ANALOGIES,
  AUDIENCE_FRAMINGS,
  PERSUASION_PRINCIPLES,
  JARGON_SWAPS,
  CREDIBILITY_GUARDRAILS,
  SPEAK_HUMAN_RULE,
  type AudienceFraming,
} from './framing/framing-data';

const SectionHead = ({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
    <span style={{ color: 'var(--accent-primary)', display: 'inline-flex' }}>{icon}</span>
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--accent-primary)',
        }}
      >
        {kicker}
      </div>
      <h2
        style={{
          margin: '2px 0 0',
          fontSize: 'var(--fs-lg)',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h2>
    </div>
  </div>
);

const SayNot = ({ say, not }: { say: string; not: string }) => (
  <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'color-mix(in srgb, var(--success) 8%, var(--bg-card))',
        border: '1px solid color-mix(in srgb, var(--success) 26%, var(--border-color))',
        fontSize: 13.5,
        lineHeight: 1.5,
        color: 'var(--text-primary)',
      }}
    >
      <strong style={{ color: 'var(--success)' }}>Say this:</strong> {say}
    </div>
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        fontSize: 12.5,
        lineHeight: 1.5,
        color: 'var(--text-muted)',
      }}
    >
      <strong style={{ color: 'var(--text-secondary)' }}>Not this:</strong>{' '}
      <span
        style={{
          textDecoration: 'line-through',
          textDecorationColor: 'color-mix(in srgb, var(--error) 60%, transparent)',
        }}
      >
        {not}
      </span>
    </div>
  </div>
);

const AudienceCard = ({ a }: { a: AudienceFraming }) => {
  const accent = a.id === 'eta' ? 'primary' : a.id === 'fractional_cso' ? 'info' : 'warning';
  return (
    <AccentCard
      accent={accent}
      title={
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>{a.label}</span>
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>{a.who}</span>
        </span>
      }
    >
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}
      >
        {a.humanFrame}
      </p>
      <div
        style={{
          margin: '12px 0',
          padding: '12px 14px',
          borderLeft: '3px solid var(--accent-primary)',
          background: 'var(--bg-elevated)',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          fontSize: 13.5,
          fontStyle: 'italic',
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
        }}
      >
        “{a.coldOpen}”
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr', marginTop: 4 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--success)',
              marginBottom: 6,
            }}
          >
            What you are really selling
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
            {a.sellThis.map((s, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--error)',
              marginBottom: 6,
            }}
          >
            Never say
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5 }}>
            {a.notThis.map((s, i) => (
              <li key={i} style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AccentCard>
  );
};

export function HumanPitchTab() {
  return (
    <div style={{ maxWidth: 940, margin: '0 auto', display: 'grid', gap: 28 }}>
      <style>{`
        @media (max-width: 720px){ .hp-analogy{ grid-template-columns: 1fr !important; } }
      `}</style>

      {/* header + the rule */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--fs-page-h1-platform)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          The Human Pitch
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}
        >
          {SPEAK_HUMAN_RULE}
        </p>
      </div>

      {/* 1. Analogies */}
      <section>
        <SectionHead
          icon={<Eye size={18} />}
          kicker="Pictures, not paragraphs"
          title="Analogies that land in one sentence"
        />
        <div style={{ display: 'grid', gap: 18 }}>
          {ANALOGIES.map((a, idx) => (
            <AccentCard key={a.id} accent={idx === 0 ? 'primary' : 'muted'} tinted={idx === 0}>
              <div
                className="hp-analogy"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 300px) 1fr',
                  gap: 22,
                  alignItems: 'center',
                }}
              >
                <div>
                  <AnalogyViz id={a.id} />
                </div>
                <div>
                  {idx === 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--accent-primary)',
                        marginBottom: 6,
                      }}
                    >
                      The core one
                    </div>
                  )}
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 'var(--fs-md)',
                      fontWeight: 700,
                      lineHeight: 1.3,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {a.title}
                  </h3>
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {a.hook}
                  </p>
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {a.bridge}
                  </p>
                  <SayNot say={a.sayThis} not={a.notThis} />
                </div>
              </div>
            </AccentCard>
          ))}
        </div>
      </section>

      {/* 2. Per audience */}
      <section>
        <SectionHead
          icon={<Users size={18} />}
          kicker="Same product, three humans"
          title="Frame it for the person in front of you"
        />
        <div style={{ display: 'grid', gap: 16 }}>
          {AUDIENCE_FRAMINGS.map(a => (
            <AudienceCard key={a.id} a={a} />
          ))}
        </div>
      </section>

      {/* 3. Persuasion system */}
      <section>
        <SectionHead
          icon={<Lightbulb size={18} />}
          kicker="Leverage bias to your advantage"
          title="The persuasion system (from the books you added)"
        />
        <div style={{ display: 'grid', gap: 12 }}>
          {PERSUASION_PRINCIPLES.map((p, i) => (
            <AccentCard key={i} accent="info">
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {p.title}
              </div>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                }}
              >
                {p.body}
              </p>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                }}
              >
                {p.source}
              </p>
            </AccentCard>
          ))}
        </div>
      </section>

      {/* 4. Jargon swaps */}
      <section>
        <SectionHead
          icon={<Languages size={18} />}
          kicker="Drop the acronyms"
          title="Translate the jargon into human"
        />
        <AccentCard accent="muted" bodyStyle={{ padding: 0 }}>
          {JARGON_SWAPS.map((j, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 0.8fr) 1.2fr',
                gap: 14,
                padding: '12px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--border-color)',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'color-mix(in srgb, var(--error) 50%, transparent)',
                }}
              >
                {j.jargon}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {j.human}
              </div>
            </div>
          ))}
        </AccentCard>
      </section>

      {/* 5. Guardrails */}
      <section>
        <SectionHead
          icon={<ShieldAlert size={18} />}
          kicker="The two lines that kill the deal"
          title="Never say these (the credibility traps)"
        />
        <div style={{ display: 'grid', gap: 12 }}>
          {CREDIBILITY_GUARDRAILS.map((g, i) => (
            <AccentCard key={i} accent="danger" tinted>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--error)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'color-mix(in srgb, var(--error) 55%, transparent)',
                }}
              >
                {g.never}
              </div>
              <div style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--text-primary)' }}>
                <strong style={{ color: 'var(--success)' }}>Say instead:</strong> {g.instead}
              </div>
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: 'var(--text-muted)',
                }}
              >
                {g.why}
              </p>
            </AccentCard>
          ))}
        </div>
      </section>
    </div>
  );
}
