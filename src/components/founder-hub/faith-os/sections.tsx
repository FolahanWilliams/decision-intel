'use client';

/**
 * Faith OS — static content sections (2026-05-28).
 *
 * Presentational only; all data reads from faith-os/content.ts. The
 * interactive surfaces (daily spiritual checkin, reading-plan progress,
 * prayer journal, Sabbath tracker) live in FaithOSTab.tsx because they
 * hold state + hit /api/founder-os/*.
 *
 * Styling: CSS variables only (light-theme posture), AccentCard for the
 * stacked-card surfaces, mobile-responsive via the parent's grid rules.
 */

import { useState } from 'react';
import {
  Anchor,
  BookOpen,
  Building2,
  ChevronDown,
  Layers,
  Quote,
  ShieldCheck,
  Sunrise,
  Users,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  AGENCY_SURRENDER,
  ANTI_PROSPERITY_GUARDRAIL,
  FAITH_AND_WORK,
  FOUNDERS_OF_FAITH,
  PILLAR_SCRIPTURE_ANCHORS,
  SABBATH,
  SUCCESS_SCRIPTURE_MAP,
} from '@/components/founder-hub/faith-os/content';

// ─── shared bits ──────────────────────────────────────────────────────

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ color: 'var(--accent-primary)', display: 'flex' }}>{icon}</span>
      <h3
        style={{
          margin: 0,
          fontSize: 'var(--fs-md, 18px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {label}
      </h3>
    </div>
  );
}

function VerseBlock({ refLabel, text }: { refLabel: string; text: string }) {
  return (
    <blockquote
      style={{
        margin: '8px 0 0',
        padding: '10px 14px',
        borderLeft: '3px solid color-mix(in srgb, var(--info) 45%, transparent)',
        background: 'color-mix(in srgb, var(--info) 4%, transparent)',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 13.5,
          fontStyle: 'italic',
          color: 'var(--text-primary)',
          lineHeight: 1.55,
        }}
      >
        &ldquo;{text}&rdquo;
      </p>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--info)',
        }}
      >
        {refLabel}
      </div>
    </blockquote>
  );
}

// ─── The spine: agency / surrender ──────────────────────────────────────

export function AgencySurrenderSpine() {
  return (
    <AccentCard accent="primary" tinted title={null}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Anchor size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--accent-primary)',
          }}
        >
          The Foundation
        </span>
      </div>
      <h2
        style={{
          margin: '0 0 10px',
          fontSize: 'var(--fs-lg, 20px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        {AGENCY_SURRENDER.title}
      </h2>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        {AGENCY_SURRENDER.thesis}
      </p>
      <VerseBlock
        refLabel={AGENCY_SURRENDER.scriptureRefs.join(' · ')}
        text="The heart of man plans his way, but the LORD establishes his steps."
      />
      <p
        style={{
          margin: '14px 0 12px',
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        {AGENCY_SURRENDER.whyItMatters}
      </p>
      <div
        style={{
          marginTop: 8,
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--accent-primary)',
            marginBottom: 4,
          }}
        >
          Why this is also the product
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.6 }}>
          {AGENCY_SURRENDER.productResonance}
        </p>
      </div>
    </AccentCard>
  );
}

// ─── Success psychology ↔ scripture map ─────────────────────────────────

export function SuccessScriptureMap() {
  const [open, setOpen] = useState<string | null>(SUCCESS_SCRIPTURE_MAP[0]?.id ?? null);

  return (
    <section>
      <SectionHeading
        icon={<Layers size={18} />}
        label="Success psychology, grounded in scripture"
      />
      <p
        style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}
      >
        Each principle the literature names has a deeper scriptural parallel — sturdier because it
        is grounded in identity and calling, not in the outcome landing. Tap any row to open it.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SUCCESS_SCRIPTURE_MAP.map(entry => {
          const isOpen = open === entry.id;
          return (
            <div
              key={entry.id}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : entry.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                }}
                aria-expanded={isOpen}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{entry.principle}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.source}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--info)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.scriptureRef}
                  </span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: 'var(--text-muted)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.18s ease',
                    }}
                  />
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 16px 16px' }}>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {entry.coreIdea}
                  </p>
                  <VerseBlock refLabel={entry.scriptureRef} text={entry.scriptureText} />
                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Quote
                      size={14}
                      style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 3 }}
                      aria-hidden
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                      }}
                    >
                      <strong style={{ color: 'var(--accent-primary)' }}>Why it holds: </strong>
                      {entry.whyFaithFrameHolds}
                    </p>
                  </div>
                  {entry.pillarLink != null && (
                    <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
                      Deepens Founder OS Pillar {entry.pillarLink}.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Faith & work theology ──────────────────────────────────────────────

export function FaithAndWorkSection() {
  return (
    <section>
      <SectionHeading
        icon={<Building2 size={18} />}
        label="Faith & work — vocation, stewardship, excellence"
      />
      <div style={{ display: 'grid', gap: 12 }}>
        {FAITH_AND_WORK.map(entry => (
          <AccentCard key={entry.id} accent="info" title={entry.title}>
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 11.5,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              {entry.source}
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 13.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {entry.body}
            </p>
            <VerseBlock refLabel={entry.scriptureRef} text={entry.scriptureText} />
          </AccentCard>
        ))}
      </div>
    </section>
  );
}

// ─── Founders of faith ──────────────────────────────────────────────────

export function FoundersOfFaithSection() {
  return (
    <section>
      <SectionHeading
        icon={<Users size={18} />}
        label="Founders of faith — scripture's own builders"
      />
      <div style={{ display: 'grid', gap: 12 }}>
        {FOUNDERS_OF_FAITH.map(f => (
          <AccentCard key={f.id} accent="muted" title={f.name}>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              {f.role}
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <span style={labelChip('primary')}>The parallel</span>
                <p style={bodyP}>{f.parallel}</p>
              </div>
              <div>
                <span style={labelChip('info')}>The lesson</span>
                <p style={bodyP}>{f.lesson}</p>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <BookOpen
                size={13}
                style={{ display: 'inline', verticalAlign: '-2px', marginRight: 5 }}
                aria-hidden
              />
              Read: {f.readRange}
            </div>
          </AccentCard>
        ))}
      </div>
    </section>
  );
}

// ─── Pillar scripture anchors ───────────────────────────────────────────

export function PillarAnchorsSection({ collapsible = false }: { collapsible?: boolean }) {
  // When collapsible (mounted on the Founder OS daily surface), start closed
  // so it grounds the pillars without bloating the daily checkin view.
  const [open, setOpen] = useState(!collapsible);

  return (
    <section>
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: open ? 12 : 0,
          }}
          aria-expanded={open}
        >
          <Anchor size={18} style={{ color: 'var(--accent-primary)' }} aria-hidden />
          <span
            style={{
              fontSize: 'var(--fs-md, 18px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            Scripture anchors for these 6 pillars
          </span>
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-muted)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.18s ease',
            }}
          />
        </button>
      ) : (
        <SectionHeading
          icon={<Anchor size={18} />}
          label="Scripture anchors for the 6 Founder OS pillars"
        />
      )}
      {!collapsible && (
        <p
          style={{
            margin: '0 0 14px',
            fontSize: 13.5,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}
        >
          The discipline layer you already run on, grounded. Each cognitive pillar carries a
          scriptural reframe — the same practice, now rooted in something deeper than neuroscience.
        </p>
      )}
      {!open ? null : (
        <div style={{ display: 'grid', gap: 10 }}>
          {PILLAR_SCRIPTURE_ANCHORS.map(p => (
            <div
              key={p.pillar}
              style={{
                border: '1px solid var(--border-color)',
                borderLeft: '3px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 2,
                }}
              >
                Pillar {p.pillar} · {p.pillarName}
              </div>
              <VerseBlock refLabel={p.scriptureRef} text={p.scriptureText} />
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                {p.reframe}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Sabbath ────────────────────────────────────────────────────────────

export function SabbathCard({
  takenThisWeek,
  onToggle,
}: {
  takenThisWeek: boolean;
  onToggle: () => void;
}) {
  return (
    <AccentCard accent="warning" tinted title={null}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Sunrise size={18} style={{ color: 'var(--warning)' }} aria-hidden />
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--fs-md, 18px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {SABBATH.title}
        </h3>
      </div>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 13.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        {SABBATH.body}
      </p>
      <p
        style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}
      >
        <strong>Practice: </strong>
        {SABBATH.practice}
      </p>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <input
          type="checkbox"
          checked={takenThisWeek}
          onChange={onToggle}
          style={{ width: 16, height: 16 }}
        />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
          I took a real Sabbath this week
        </span>
      </label>
      <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--text-muted)' }}>
        A rhythm to protect, not a streak to win. Resets each week.
      </p>
    </AccentCard>
  );
}

// ─── Anti-prosperity guardrail ──────────────────────────────────────────

export function AntiProsperityGuardrail() {
  return (
    <AccentCard accent="danger" tinted title={null}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <ShieldCheck size={18} style={{ color: 'var(--error)' }} aria-hidden />
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--fs-md, 18px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          The guardrail
        </h3>
      </div>
      <p
        style={{
          margin: '0 0 6px',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}
      >
        {ANTI_PROSPERITY_GUARDRAIL.rule}
      </p>
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 13.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        {ANTI_PROSPERITY_GUARDRAIL.why}
      </p>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        className="faith-guardrail-grid"
      >
        <div>
          <div style={labelChip('danger')}>This is NOT</div>
          <ul style={listStyle}>
            {ANTI_PROSPERITY_GUARDRAIL.whatThisIsNot.map(item => (
              <li key={item} style={liStyle}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div style={labelChip('success')}>This IS</div>
          <ul style={listStyle}>
            {ANTI_PROSPERITY_GUARDRAIL.whatThisIs.map(item => (
              <li key={item} style={liStyle}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .faith-guardrail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AccentCard>
  );
}

// ─── small style helpers ────────────────────────────────────────────────

function labelChip(tone: 'primary' | 'info' | 'success' | 'danger'): React.CSSProperties {
  const color =
    tone === 'primary'
      ? 'var(--accent-primary)'
      : tone === 'info'
        ? 'var(--info)'
        : tone === 'success'
          ? 'var(--success)'
          : 'var(--error)';
  return {
    display: 'inline-block',
    fontSize: 10.5,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color,
    marginBottom: 4,
  };
}

const bodyP: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.55,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const liStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
};
