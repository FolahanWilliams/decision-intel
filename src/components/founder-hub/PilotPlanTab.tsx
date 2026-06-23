'use client';

/**
 * PilotPlanTab — the post-VC-pass re-foundation, as a living Founder Hub surface.
 *
 * The navigable home for the plan to land the first 3 paid pilots + the public
 * prospective track record that earns funding. Founder-hub-internal (admin-gated).
 *
 * Pure renderer over PILOT_PLAN (pilot-plan/pilot-plan-data.ts). Edit content
 * THERE. The publicCalls[] ledger is the one living part — add a call when you
 * lock it, update status + result as the proxy dates land.
 */

import { AccentCard } from '@/components/ui/AccentCard';
import { PILOT_PLAN, type CredibilityAsset } from './pilot-plan/pilot-plan-data';
import { type PublicCall, CALL_STATUS_META } from '@/lib/data/public-calls';

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

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

// CALL_STATUS_META now imported from the canonical SSOT (@/lib/data/public-calls),
// shared with the public /track-record page.

const ASSET_STATUS_META: Record<CredibilityAsset['status'], { label: string; color: string }> = {
  have: { label: 'Have', color: 'var(--success)' },
  building: { label: 'Building', color: 'var(--warning)' },
  todo: { label: 'To do', color: 'var(--text-muted)' },
};

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        borderRadius: 999,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function CallRow({ call }: { call: PublicCall }) {
  const meta = CALL_STATUS_META[call.status];
  return (
    <div
      style={{
        borderLeft: `3px solid ${meta.color}`,
        paddingLeft: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
          {call.subject}
        </span>
        <Pill label={meta.label} color={meta.color} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          locked {call.dateLocked} · due {call.dueDate}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Flag:</strong> {call.flag}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--text-primary)' }}>Proxy:</strong> {call.proxy}
      </div>
      {call.result && (
        <div style={{ fontSize: 12.5, color: meta.color, lineHeight: 1.5 }}>
          <strong>Result:</strong> {call.result}
        </div>
      )}
      {call.mirrors && (
        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--accent-primary)' }}>
            Mirrors (the buyer&apos;s risk):
          </strong>{' '}
          {call.mirrors}
        </div>
      )}
    </div>
  );
}

export function PilotPlanTab() {
  const p = PILOT_PLAN;
  return (
    <div
      style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      {/* Header */}
      <div>
        <div style={eyebrowStyle}>Plan · first 3 paid pilots → fundable</div>
        <h1
          style={{
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '6px 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          {p.headline}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.55,
            maxWidth: '64ch',
          }}
        >
          {p.thesis}
        </p>
        <p
          style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}
        >
          {p.provenance}
        </p>
      </div>

      {/* Focus — the two named lanes + sprint intensity. The founder’s own
          discipline: named targets, not a broad campaign; don’t spread thin. */}
      <AccentCard accent="primary" title={<CardTitle>{p.focus.headline}</CardTitle>}>
        <Bullets items={p.focus.lanes} />
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}
        >
          {p.focus.note}
        </p>
      </AccentCard>

      {/* Next move — the one thing this week */}
      <AccentCard accent="primary" tinted title={<CardTitle>Do this week</CardTitle>}>
        <Para>{p.nextMove}</Para>
      </AccentCard>

      {/* Public calls ledger — the living engine */}
      <AccentCard
        accent="info"
        title={
          <CardTitle>Public calls ledger · the track record, accumulating in public</CardTitle>
        }
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Add a call in <code>src/lib/data/public-calls.ts</code>; update status + result as the
          proxy dates land. Score the FLAG (did the reasoning-risk materialise?), never the
          forecast. Publish the false positives. This same SSOT renders the public page.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {p.publicCalls.map(call => (
            <CallRow key={call.id} call={call} />
          ))}
        </div>
        <a
          href="/track-record"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 14,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--info)',
          }}
        >
          View the public page · /track-record →
        </a>
      </AccentCard>

      {/* Diagnosis */}
      <AccentCard accent="warning" title={<CardTitle>The diagnosis, settled</CardTitle>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {p.diagnosis.map(d => (
            <div key={d.title} style={{ borderLeft: '2px solid var(--warning)', paddingLeft: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                {d.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  marginTop: 3,
                }}
              >
                {d.body}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {/* The pass, line by line — the rehearsable demolition */}
      <AccentCard
        accent="danger"
        title={<CardTitle>The pass, line by line · how you answer the next Rob</CardTitle>}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          Rob&apos;s six objections are the set every credible buyer raises. Agree first, then
          reframe, then point at the proof. Rehearse it; never re-derive it live.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {p.theRobPass.map((pt, i) => (
            <div
              key={i}
              style={{
                borderLeft: '2px solid var(--error)',
                paddingLeft: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                &ldquo;{pt.objection}&rdquo;
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                {pt.answer}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--accent-primary)' }}>Proof:</strong> {pt.proof}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {/* The pilots — two named lanes + opportunistic */}
      <div style={eyebrowStyle}>The pilots · two named lanes + opportunistic</div>
      {p.pilots.map(pilot => (
        <AccentCard
          key={pilot.name}
          accent="primary"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <CardTitle>{pilot.name}</CardTitle>
              <Pill label={pilot.tag} color="var(--accent-primary)" />
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(
              [
                ['Who', pilot.who],
                ['Why', pilot.why],
                ['How', pilot.how],
                ['Pilot', pilot.shape],
                ['Price', pilot.price],
                ['Success', pilot.success],
              ] as const
            ).map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px minmax(0, 1fr)',
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
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {v}
                </div>
              </div>
            ))}
          </div>
        </AccentCard>
      ))}

      {/* Sankore — highest-ceiling stretch (re-weighted 2026-06-22, founder call) */}
      <AccentCard accent="info" tinted title={<CardTitle>{p.sankore.headline}</CardTitle>}>
        <Para>{p.sankore.body}</Para>
      </AccentCard>

      {/* Public track record */}
      <AccentCard accent="info" title={<CardTitle>{p.publicTrackRecord.headline}</CardTitle>}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--success)',
            marginBottom: 6,
          }}
        >
          Why it works
        </div>
        <Bullets items={p.publicTrackRecord.why} />
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--error)',
            margin: '14px 0 6px',
          }}
        >
          Discipline (load-bearing)
        </div>
        <Bullets items={p.publicTrackRecord.discipline} />
      </AccentCard>

      {/* SpaceX worked call */}
      <AccentCard
        accent="primary"
        title={<CardTitle>Worked example · call #1 — SpaceX (SPCX)</CardTitle>}
      >
        <Para>{p.spacex.decision}</Para>
        <div style={{ marginTop: 12 }}>
          <Bullets items={p.spacex.facts} />
        </div>
        <SubLabel>What the S-1 argues</SubLabel>
        <Bullets items={p.spacex.thesis} />
        <SubLabel>What DI flags (reasoning-risks, in-lane)</SubLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {p.spacex.flags.map(f => (
            <div
              key={f.bias}
              style={{ borderLeft: '2px solid var(--accent-primary)', paddingLeft: 12 }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                {f.bias}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginTop: 2,
                }}
              >
                {f.body}
              </div>
            </div>
          ))}
        </div>
        <SubLabel>The locked call (the flag, dated)</SubLabel>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            lineHeight: 1.6,
            fontStyle: 'italic',
            background: 'color-mix(in srgb, var(--accent-primary) 7%, transparent)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          {p.spacex.lockedCall}
        </div>
        <SubLabel>The proxies</SubLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {p.spacex.proxies.map(pr => (
            <div
              key={pr.window}
              style={{
                display: 'grid',
                gridTemplateColumns: '150px minmax(0, 1fr)',
                gap: 12,
                alignItems: 'baseline',
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--info)' }}>
                {pr.window}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {pr.q}
              </div>
            </div>
          ))}
        </div>
        <SubLabel>How it’s scored — and why this is the whole point</SubLabel>
        <Bullets items={p.spacex.scoring} />
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <strong style={{ color: 'var(--text-secondary)' }}>Framing guardrail:</strong>{' '}
          {p.spacex.guardrail}
        </div>
      </AccentCard>

      {/* Refinements */}
      <AccentCard
        accent="warning"
        title={
          <CardTitle>Three refinements (2026-06-21 review) — sharpen, don’t replace</CardTitle>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {p.refinements.map(r => (
            <div key={r.n} style={{ borderLeft: '2px solid var(--warning)', paddingLeft: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                {r.n}. {r.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  marginTop: 3,
                }}
              >
                {r.body}
              </div>
            </div>
          ))}
        </div>
      </AccentCard>

      {/* Credibility re-rank */}
      <AccentCard
        accent="info"
        title={
          <CardTitle>Credibility assets, re-ranked — lead with 1–3, not the cheques</CardTitle>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {p.credibility.map(c => {
            const meta = ASSET_STATUS_META[c.status];
            return (
              <div
                key={c.rank}
                style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}
              >
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {c.rank}
                </span>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {c.asset}
                    </span>
                    <Pill label={meta.label} color={meta.color} />
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginTop: 2,
                    }}
                  >
                    {c.note}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AccentCard>

      {/* Sequence */}
      <AccentCard accent="primary" title={<CardTitle>The sequence — don’t jump ahead</CardTitle>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {p.sequence.map(phase => (
            <div key={phase.window}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  marginBottom: 6,
                }}
              >
                {phase.window}
              </div>
              <Bullets items={phase.items} />
            </div>
          ))}
        </div>
      </AccentCard>

      {/* Guardrails */}
      <AccentCard accent="muted" title={<CardTitle>Guardrails — tape to the wall</CardTitle>}>
        <Bullets items={p.guardrails} />
      </AccentCard>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--accent-primary)',
        margin: '14px 0 6px',
      }}
    >
      {children}
    </div>
  );
}
