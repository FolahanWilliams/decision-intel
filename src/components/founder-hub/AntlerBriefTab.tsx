'use client';

/**
 * AntlerBriefTab — Antler research + approach brief. The June-2026 "Magnus
 * Grimeland / Antler CEO inbound" was an IMPERSONATION (see the
 * project-antler-magnus-inbound memory); this is the real-firm prep for
 * pursuing Antler via the warm path that opened at a networking event (a VC
 * offering an intro to Antler's London partners). Founder-hub-internal
 * (admin-gated); names Antler/Magnus in the content like the LRQA + Cornerstone
 * briefs, while the visible tab label stays role-neutral.
 *
 * Pure renderer over ANTLER_BRIEF (antler-brief-data.ts). Edit content there.
 */

import { AccentCard } from '@/components/ui/AccentCard';
import { ANTLER_BRIEF } from './antler/antler-brief-data';

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--accent-primary)',
};

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </div>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((t, i) => (
        <li key={i} style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {t}
        </li>
      ))}
    </ul>
  );
}

function KeyValList({ items }: { items: readonly { k: string; v: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map(({ k, v }) => (
        <div
          key={k}
          style={{
            display: 'grid',
            gridTemplateColumns: '110px minmax(0, 1fr)',
            gap: 12,
            alignItems: 'baseline',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent-primary)',
            }}
          >
            {k}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            {v}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AntlerBriefTab() {
  const b = ANTLER_BRIEF;
  return (
    <div
      style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Header */}
      <div>
        <div style={eyebrowStyle}>Investor brief · Antler · research &amp; approach</div>
        <h1
          style={{
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '6px 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          Antler · research &amp; approach
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.55,
            maxWidth: '60ch',
          }}
        >
          {b.setup.headline}
        </p>
      </div>

      {/* Setup */}
      <AccentCard
        accent="warning"
        tinted
        title={<CardTitle>What happened · the real path</CardTitle>}
      >
        <Bullets items={b.setup.points} />
      </AccentCard>

      {/* The path */}
      <AccentCard accent="info" title={<CardTitle>The path in</CardTitle>}>
        <KeyValList
          items={[
            { k: 'Path', v: b.logistics.who },
            { k: 'Channel', v: b.logistics.format },
            { k: 'Verify', v: b.logistics.cc },
            { k: 'Discipline', v: b.logistics.practical },
          ]}
        />
      </AccentCard>

      {/* Who Magnus is */}
      <AccentCard accent="info" title={<CardTitle>Who you’re meeting</CardTitle>}>
        <KeyValList items={b.magnus} />
      </AccentCard>

      {/* What Antler offers */}
      <AccentCard accent="info" title={<CardTitle>What Antler actually offers</CardTitle>}>
        <KeyValList items={b.antler} />
      </AccentCard>

      {/* Terms */}
      <AccentCard accent="warning" tinted title={<CardTitle>{b.terms.headline}</CardTitle>}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {b.terms.body}
        </p>
      </AccentCard>

      {/* What they look for */}
      <AccentCard
        accent="primary"
        title={<CardTitle>What they look for — and how you show it</CardTitle>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {b.founderTraits.map(t => (
            <div
              key={t.trait}
              style={{ borderLeft: '2px solid var(--accent-primary)', paddingLeft: 12 }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                {t.trait}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  marginTop: 2,
                }}
              >
                They want: {t.theyWant}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginTop: 3,
                }}
              >
                You: {t.youShow}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {/* Playbook */}
      <AccentCard accent="primary" title={<CardTitle>The meeting playbook</CardTitle>}>
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 13.5,
            color: 'var(--text-primary)',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          {b.playbook.goal}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--success)',
                marginBottom: 6,
              }}
            >
              Do
            </div>
            <Bullets items={b.playbook.dos} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--error)',
                marginBottom: 6,
              }}
            >
              Don’t
            </div>
            <Bullets items={b.playbook.donts} />
          </div>
        </div>
      </AccentCard>

      {/* Questions */}
      <AccentCard accent="info" title={<CardTitle>Ask these five</CardTitle>}>
        <ol
          style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {b.questions.map((q, i) => (
            <li
              key={i}
              style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}
            >
              {q}
            </li>
          ))}
        </ol>
      </AccentCard>

      {/* Proof points */}
      <AccentCard accent="success" title={<CardTitle>Proof points to drop</CardTitle>}>
        <Bullets items={b.proofPoints} />
      </AccentCard>

      {/* Why now */}
      <AccentCard accent="info" title={<CardTitle>{b.whyNow.headline}</CardTitle>}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {b.whyNow.body}
        </p>
      </AccentCard>

      {/* Asks */}
      <AccentCard accent="primary" title={<CardTitle>The tiered ask</CardTitle>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {b.asks.map(a => (
            <div
              key={a.tier}
              style={{
                display: 'grid',
                gridTemplateColumns: '64px minmax(0, 1fr)',
                gap: 12,
                alignItems: 'baseline',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-primary)',
                }}
              >
                {a.tier}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {a.ask}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {/* Guardrails */}
      <AccentCard
        accent="danger"
        tinted
        title={<CardTitle>Guardrails — don’t over-rotate</CardTitle>}
      >
        <Bullets items={b.guardrails} />
      </AccentCard>
    </div>
  );
}
