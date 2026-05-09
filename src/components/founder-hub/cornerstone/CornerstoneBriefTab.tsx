'use client';

/**
 * CornerstoneBriefTab — private founder-hub surface (locked 2026-05-09
 * evening, Phase 2 of the DecisionContainer refactor). Mirrors the
 * LRQA pattern: data-driven brief with 6 sections rendered inline as
 * a single tab.
 *
 * Per CLAUDE.md no-named-prospects rule: this component renders no
 * proper-noun firm name in shipped HTML — the data file carries the
 * name for founder-recall but the user-facing copy stays role-neutral
 * ("the fund / the partner / the GP team"). The brief surface is
 * behind Supabase platform auth + the founder-hub-pass gate.
 */

import {
  CORNERSTONE_PROFILE,
  CORNERSTONE_INTEGRATION_PATHS,
  CORNERSTONE_ASK_HIERARCHY,
  CORNERSTONE_MEETING_PREP,
  CORNERSTONE_INTERNSHIP_GOALS,
  CORNERSTONE_FOLLOWUP_TEMPLATE,
} from './cornerstone-brief-data';
import { CheckCircle2, AlertCircle, Mail, Briefcase, Target, Search, X } from 'lucide-react';

const FIT_COLORS: Record<
  'critical' | 'high' | 'medium',
  { bg: string; fg: string; border: string }
> = {
  critical: {
    bg: 'rgba(34, 197, 94, 0.08)',
    fg: 'var(--success)',
    border: 'var(--success)',
  },
  high: {
    bg: 'rgba(245, 158, 11, 0.06)',
    fg: 'var(--warning)',
    border: 'var(--warning)',
  },
  medium: {
    bg: 'var(--bg-secondary)',
    fg: 'var(--text-secondary)',
    border: 'var(--border-color)',
  },
};

const PREP_ICON: Record<'research' | 'artefact' | 'rehearse' | 'avoid', React.ReactNode> = {
  research: <Search size={14} />,
  artefact: <Briefcase size={14} />,
  rehearse: <Target size={14} />,
  avoid: <X size={14} />,
};

const PREP_COLOR: Record<'research' | 'artefact' | 'rehearse' | 'avoid', string> = {
  research: 'var(--info)',
  artefact: 'var(--accent-primary)',
  rehearse: 'var(--warning)',
  avoid: 'var(--error)',
};

export function CornerstoneBriefTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section 1: Profile + senior-direct framing */}
      <Section
        eyebrow="Section 1"
        title="Fund profile + strategic framing"
        body="Pre-seed/seed UK VC. Why this internship is positioned for the senior-direct corp dev track, not the contracting analyst ladder."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Stat label="Fund stage" value="Fund I" hint="~£20M committed" />
          <Stat label="Cheque size" value="£250K – £1M" hint="up to ~40 portfolio companies" />
          <Stat
            label="Sectors"
            value="Live · Work · Play"
            hint="HealthTech, AI, FinTech, Marketplaces"
          />
          <Stat label="Internship role" value="NextGen Fellowship" hint="Intern Analyst track" />
        </div>
        <Callout tone="warning">
          <strong>Strategic frame</strong>: the internship is positioned for the senior-direct corp
          dev track (technical-strategist via acqui-hire-structured terms at Lazard / KKR Capstone /
          Vista Operating Group / Databricks / Snowflake), <em>not</em> the analyst ladder. The
          artefact carried out is &ldquo;I built and validated the audit layer for committee-stage
          decisions while embedded in a fund&rdquo; — not &ldquo;I made analyst tasks faster.&rdquo;
        </Callout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 12,
          }}
        >
          {CORNERSTONE_PROFILE.team.map(t => (
            <div
              key={t.name}
              style={{
                padding: 10,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
                {t.name} — {t.role}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                }}
              >
                {t.background}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 2: Integration paths */}
      <Section
        eyebrow="Section 2"
        title="DI ↔ workflow integration paths"
        body="Five points where DI maps onto the partner team's actual workflow. Ranked by fit-strength."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CORNERSTONE_INTEGRATION_PATHS.map(p => {
            const colors = FIT_COLORS[p.fitStrength];
            return (
              <div
                key={p.id}
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{p.title}</div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: colors.bg,
                      color: colors.fg,
                      fontSize: 'var(--fs-2xs)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.fitStrength} fit
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {p.pitch}
                </p>
                <p
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {p.detail}
                </p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Section 3: Ask hierarchy */}
      <Section
        eyebrow="Section 3"
        title="Ask hierarchy — three tiers"
        body="What to ask for, when, and what to do if the answer is no. Each tier earns the next."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CORNERSTONE_ASK_HIERARCHY.map(a => (
            <div
              key={a.tier}
              style={{
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--fs-2xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  marginBottom: 4,
                }}
              >
                Tier {a.tier}
              </div>
              <div
                style={{
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {a.label}
              </div>
              <div style={{ marginBottom: 8 }}>
                <Label>Literal ask</Label>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  {a.literalAsk}
                </p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div>
                  <Label tone="success">Why yes</Label>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                    {a.whyYes}
                  </p>
                </div>
                <div>
                  <Label tone="warning">Why no</Label>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                    {a.whyNo}
                  </p>
                </div>
              </div>
              <div>
                <Label>Fallback</Label>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                  {a.fallback}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 4: Meeting prep */}
      <Section
        eyebrow="Section 4"
        title="Meeting preparation board"
        body="Categorised checklist: research / artefact / rehearse / avoid."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CORNERSTONE_MEETING_PREP.map((p, i) => (
            <div
              key={i}
              style={{
                padding: 10,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${PREP_COLOR[p.category]}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: PREP_COLOR[p.category], display: 'inline-flex' }}>
                  {PREP_ICON[p.category]}
                </span>
                <span
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: PREP_COLOR[p.category],
                    fontWeight: 600,
                  }}
                >
                  {p.category}
                </span>
                <span
                  style={{
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  {p.label}
                </span>
              </div>
              <p
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--text-secondary)',
                  paddingLeft: 22,
                  lineHeight: 1.5,
                }}
              >
                {p.detail}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 5: Internship goals */}
      <Section
        eyebrow="Section 5"
        title="Internship goals + measures"
        body="Six concrete goals. Each carries a measure so the founder can self-grade at month 3 + month 6."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CORNERSTONE_INTERNSHIP_GOALS.map((g, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <CheckCircle2
                size={16}
                style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: 4 }}>
                  {g.goal}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--text-secondary)',
                    marginBottom: 4,
                  }}
                >
                  {g.why}
                </div>
                <div
                  style={{
                    fontSize: 'var(--fs-2xs)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Measure: {g.measure}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 6: Follow-up templates */}
      <Section
        eyebrow="Section 6"
        title="Follow-up templates"
        body="Verbatim message drafts. Edit per meeting; keep the voice consistent."
      >
        <FollowupTemplate
          icon={<Mail size={14} />}
          subject={CORNERSTONE_FOLLOWUP_TEMPLATE.postMeeting.subject}
          timing={CORNERSTONE_FOLLOWUP_TEMPLATE.postMeeting.timing}
          body={CORNERSTONE_FOLLOWUP_TEMPLATE.postMeeting.body}
        />
        <div style={{ height: 12 }} />
        <FollowupTemplate
          icon={<Mail size={14} />}
          subject={CORNERSTONE_FOLLOWUP_TEMPLATE.midPointReview.subject}
          timing={CORNERSTONE_FOLLOWUP_TEMPLATE.midPointReview.timing}
          body={CORNERSTONE_FOLLOWUP_TEMPLATE.midPointReview.body}
        />
      </Section>

      <Callout tone="error">
        <AlertCircle
          size={14}
          style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }}
        />
        <strong>Discipline rule</strong>: this brief carries the proper noun for founder-recall. The
        rendered HTML on every shipped surface stays role-neutral. Per the CLAUDE.md
        no-named-prospects rule: never let firm-specific deal-flow surface on <code>/security</code>{' '}
        · <code>/case-studies</code> · marketing surfaces · or commit messages. Anonymisation is the
        locked default.
      </Callout>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          color: 'var(--text-muted)',
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        {eyebrow}
      </div>
      <h3
        style={{
          fontSize: 'var(--fs-md)',
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {title}
      </h3>
      {body && (
        <p
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 12,
          }}
        >
          {body}
        </p>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 'var(--fs-3xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 600 }}>{value}</div>
      {hint && (
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Label({ children, tone }: { children: React.ReactNode; tone?: 'success' | 'warning' }) {
  const color =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'warning'
        ? 'var(--warning)'
        : 'var(--text-muted)';
  return (
    <div
      style={{
        fontSize: 'var(--fs-3xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color,
        marginBottom: 2,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'error';
  children: React.ReactNode;
}) {
  const colors = {
    success: { bg: 'rgba(34, 197, 94, 0.06)', fg: 'var(--success)' },
    warning: { bg: 'rgba(245, 158, 11, 0.06)', fg: 'var(--warning)' },
    error: { bg: 'rgba(239, 68, 68, 0.06)', fg: 'var(--error)' },
  }[tone];
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 'var(--radius-md)',
        background: colors.bg,
        borderLeft: `3px solid ${colors.fg}`,
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-primary)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

function FollowupTemplate({
  icon,
  subject,
  timing,
  body,
}: {
  icon: React.ReactNode;
  subject: string;
  timing: string;
  body: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{subject}</span>
        </div>
        <span
          style={{
            fontSize: 'var(--fs-2xs)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {timing}
        </span>
      </div>
      <pre
        style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          fontFamily: 'inherit',
          whiteSpace: 'pre-wrap',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {body}
      </pre>
    </div>
  );
}
