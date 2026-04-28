'use client';

/**
 * ClosingLabTab — sales-psychology playbook surface (locked 2026-04-28).
 *
 * Synthesis of Eddie Maalouf's 6 high-ticket-psychology principles + Satyam's
 * 5 sales-infrastructure pillars + the brutal-honest pre-mortem critique
 * (5 silent objections, 3 fastest-converter personas, 3 trap personas, 80%
 * cut list) into one operational surface. All data sourced from
 * closing-lab/closing-lab-data.ts.
 *
 * Founder use:
 *   • Open the tab BEFORE every cold call. Read the persona-specific
 *     "exact phrase" for the buyer you are about to call.
 *   • Open the silent-objections section AFTER every call you lost. The
 *     objection that killed it is almost certainly one of the 5.
 *   • Read Maalouf principle #3 (Authority is Not Trust) and Satyam pillar
 *     #3 (Conviction is the Variable) before any high-stakes meeting until
 *     they are muscle memory.
 */

import { useState } from 'react';
import {
  Target,
  AlertTriangle,
  Compass,
  Shield,
  Zap,
  Layers,
  XCircle,
  ArrowRight,
  Quote,
} from 'lucide-react';
import {
  FASTEST_CONVERTERS,
  TRAP_PERSONAS,
  MAALOUF_PRINCIPLES,
  SATYAM_PILLARS,
  SILENT_OBJECTIONS,
  CUT_LIST,
  SIMPLIFIED_FUNNEL,
  NEVER_SAY_PHRASES,
  type FastestConverter,
  type MaaloufPrinciple,
  type SatyamPillar,
  type SilentObjection,
  type CutVerdict,
} from './closing-lab/closing-lab-data';

const STATUS_COLORS: Record<
  SilentObjection['status'],
  { bg: string; border: string; fg: string; label: string }
> = {
  shipped: {
    bg: 'rgba(22, 163, 74, 0.10)',
    border: 'rgba(22, 163, 74, 0.35)',
    fg: '#16A34A',
    label: 'Shipped',
  },
  in_progress: {
    bg: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.35)',
    fg: '#D97706',
    label: 'In progress',
  },
  todo: {
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.35)',
    fg: '#DC2626',
    label: 'To do · this week',
  },
};

const VERDICT_COLORS: Record<
  CutVerdict,
  { bg: string; border: string; fg: string; label: string }
> = {
  kill: {
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.40)',
    fg: '#DC2626',
    label: 'Kill',
  },
  hide_flag: {
    bg: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.40)',
    fg: '#D97706',
    label: 'Hide behind feature flag',
  },
  enterprise_only: {
    bg: 'rgba(139, 92, 246, 0.10)',
    border: 'rgba(139, 92, 246, 0.40)',
    fg: '#7C3AED',
    label: 'Move to enterprise tier',
  },
  keep: {
    bg: 'rgba(22, 163, 74, 0.10)',
    border: 'rgba(22, 163, 74, 0.40)',
    fg: '#16A34A',
    label: 'Keep',
  },
};

export function ClosingLabTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Hero />
      <FastestConvertersSection />
      <TrapPersonasSection />
      <MaaloufSection />
      <SatyamSection />
      <SilentObjectionsSection />
      <CutListAndFunnelSection />
      <NeverSaySection />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────

function Hero() {
  return (
    <div
      style={{
        padding: 18,
        background: 'linear-gradient(135deg, rgba(22,163,74,0.10), rgba(245,158,11,0.06))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#16A34A',
          marginBottom: 6,
        }}
      >
        Closing Lab · Sales Psychology Playbook
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        The psychology of closing high-ticket deals — for Decision Intel.
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          marginTop: 8,
          marginBottom: 0,
          lineHeight: 1.6,
          maxWidth: 760,
        }}
      >
        Eddie Maalouf&rsquo;s 6 high-ticket-psychology principles, Satyam&rsquo;s 5
        sales-infrastructure pillars, and the unvarnished pre-mortem critique — applied verbatim to
        the three personas who can swipe a corporate card today (mid-market PE/VC associate,
        boutique sell-side M&amp;A advisor, solo / fractional CSO). Read the exact phrase for the
        persona you are about to call. Read the silent objections after every lost deal — the
        objection that killed it is almost certainly one of the five.
      </p>
    </div>
  );
}

// ─── Section: Fastest Converters ───────────────────────────────────

function FastestConvertersSection() {
  const [activeId, setActiveId] = useState<FastestConverter['id']>(FASTEST_CONVERTERS[0].id);
  const active = FASTEST_CONVERTERS.find(c => c.id === activeId)!;
  const objection = SILENT_OBJECTIONS.find(o => o.id === active.topSilentObjection);
  const principle = MAALOUF_PRINCIPLES.find(p => p.id === active.loadBearingMaalouf);

  return (
    <section style={sectionStyle}>
      <SectionHeader
        eyebrow="The 3 fastest converters"
        title="Personas who can swipe a corporate card today"
        body="Pick a persona. Get the exact phrase to use, the category-of-one framing, the silent objection they will raise, the conviction anchor, the pre-call nurture asset, and the 14-day outreach sequence."
        icon={<Target size={16} color="#16A34A" />}
      />

      {/* Tab switcher */}
      <div style={tabRow}>
        {FASTEST_CONVERTERS.map(c => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              style={{
                ...tabButton,
                background: isActive ? 'var(--bg-card)' : 'var(--bg-secondary)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderLeft: isActive ? `3px solid ${c.color}` : '3px solid transparent',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: c.color }}>
                {c.archetype.toUpperCase()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {c.ticketBand}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active persona detail */}
      <div style={detailWrap(active.color)}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {active.description}
        </div>

        <DetailRow label="Why ready NOW" body={active.whyReadyNow} accent={active.color} />
        <DetailRow
          label={`Most load-bearing Maalouf principle · #${principle?.number}: ${principle?.label}`}
          body={active.exactPhrase}
          accent={active.color}
          bodyStyle="quote"
        />
        <DetailRow
          label="Satyam category-of-one framing"
          body={active.categoryFraming}
          accent={active.color}
          bodyStyle="quote"
        />
        <DetailRow
          label={`Top silent objection · ${objection?.label}`}
          body={`What they think: ${objection?.whatBuyerThinks}`}
          accent="#DC2626"
        />
        <DetailRow
          label="Verbatim response"
          body={active.objectionResponse}
          accent={active.color}
          bodyStyle="quote"
        />
        <DetailRow label="Conviction anchor" body={active.convictionAnchor} accent={active.color} />
        <DetailRow
          label="Pre-call nurture asset"
          body={active.preCallAsset}
          accent={active.color}
        />

        <div style={{ marginTop: 18 }}>
          <div style={subHeader(active.color)}>14-day outreach sequence</div>
          <ol style={sequenceList}>
            {active.outreachSequence.map((step, i) => (
              <li key={i} style={sequenceItem}>
                <span style={dayBadge(active.color)}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Trap Personas ────────────────────────────────────────

function TrapPersonasSection() {
  return (
    <section style={sectionStyle}>
      <SectionHeader
        eyebrow="The 3 traps"
        title="Personas that look attractive but cost runway"
        body="Each of these is a real ICP and a real dollar opportunity. They are also 12+ months out at pre-seed. Chasing them today bleeds time and bandwidth. Read the unlock condition for each before you put one on the calendar."
        icon={<AlertTriangle size={16} color="#94A3B8" />}
      />
      <div style={trapGrid}>
        {TRAP_PERSONAS.map(t => (
          <div key={t.id} style={trapCard(t.color)}>
            <div style={trapLabel}>{t.label}</div>
            <DetailRow
              label="Why they look attractive"
              body={t.whyTheyLookAttractive}
              accent={t.color}
              compact
            />
            <DetailRow
              label="Why they are a trap"
              body={t.whyTheyAreATrap}
              accent="#DC2626"
              compact
            />
            <DetailRow label="When to revisit" body={t.whenToRevisit} accent={t.color} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section: Maalouf Principles ───────────────────────────────────

function MaaloufSection() {
  const [activeId, setActiveId] = useState<MaaloufPrinciple['id']>(MAALOUF_PRINCIPLES[0].id);
  const active = MAALOUF_PRINCIPLES.find(p => p.id === activeId)!;
  return (
    <section style={sectionStyle}>
      <SectionHeader
        eyebrow="Maalouf's 6 principles"
        title="The psychology of closing high-ticket deals"
        body="Eddie Maalouf, founder of @imakeBADads, distilled into 6 principles applied verbatim to Decision Intel. Each principle carries a verbatim quote, the DI-specific application, an anti-pattern to avoid, and the ideal phrase to use on a real call."
        icon={<Compass size={16} color="#0EA5E9" />}
      />
      <div style={principleStrip}>
        {MAALOUF_PRINCIPLES.map(p => {
          const isActive = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              style={{
                ...principleChip,
                background: isActive ? 'var(--bg-card)' : 'var(--bg-secondary)',
                borderColor: isActive ? '#0EA5E9' : 'var(--border-color)',
              }}
            >
              <span style={principleNumber}>#{p.number}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={detailWrap('#0EA5E9')}>
        <div style={quoteBlock}>
          <Quote size={14} style={{ flexShrink: 0, marginTop: 2, color: '#0EA5E9' }} />
          <em>{active.maaloufQuote}</em>
        </div>
        <DetailRow label="DI application" body={active.diApplication} accent="#0EA5E9" />
        <DetailRow
          label="Anti-pattern · do NOT do this"
          body={active.antiPattern}
          accent="#DC2626"
        />
        <DetailRow
          label="Ideal phrase"
          body={active.idealPhrase}
          accent="#0EA5E9"
          bodyStyle="quote"
        />
      </div>
    </section>
  );
}

// ─── Section: Satyam Pillars ───────────────────────────────────────

function SatyamSection() {
  const [activeId, setActiveId] = useState<SatyamPillar['id']>(SATYAM_PILLARS[0].id);
  const active = SATYAM_PILLARS.find(p => p.id === activeId)!;
  return (
    <section style={sectionStyle}>
      <SectionHeader
        eyebrow="Satyam's 5 pillars"
        title="Sell so good competition becomes irrelevant"
        body="Five sales-infrastructure pillars from Satyam (@vizionaryfocuss). Each pillar carries a verbatim quote, the DI application, and the concrete this-week move."
        icon={<Layers size={16} color="#8B5CF6" />}
      />
      <div style={principleStrip}>
        {SATYAM_PILLARS.map(p => {
          const isActive = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              style={{
                ...principleChip,
                background: isActive ? 'var(--bg-card)' : 'var(--bg-secondary)',
                borderColor: isActive ? '#8B5CF6' : 'var(--border-color)',
              }}
            >
              <span style={{ ...principleNumber, color: '#8B5CF6' }}>#{p.number}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={detailWrap('#8B5CF6')}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Summary: </strong>
          {active.summary}
        </div>
        <div style={quoteBlock}>
          <Quote size={14} style={{ flexShrink: 0, marginTop: 2, color: '#8B5CF6' }} />
          <em>{active.satyamQuote}</em>
        </div>
        <DetailRow label="DI application" body={active.diApplication} accent="#8B5CF6" />
        <DetailRow label="This-week move" body={active.thisWeekMove} accent="#16A34A" />
      </div>
    </section>
  );
}

// ─── Section: Silent Objections ────────────────────────────────────

function SilentObjectionsSection() {
  return (
    <section style={sectionStyle}>
      <SectionHeader
        eyebrow="The 5 silent objections"
        title="What sophisticated buyers think but won't say to your face"
        body="The five objections that quietly close the tab on a procurement-stage buyer. Each carries the verbatim what-they-think, why it kills the deal, the concrete this-week fix, and the verbatim response when the buyer surfaces a softer version. Status badge tracks current state."
        icon={<Shield size={16} color="#DC2626" />}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SILENT_OBJECTIONS.map(o => {
          const status = STATUS_COLORS[o.status];
          return (
            <div key={o.id} style={objectionCard(status.border)}>
              <div style={objectionHeader}>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{o.label}</strong>
                <span style={statusBadge(status)}>{status.label}</span>
              </div>
              <div style={objectionThought}>
                <Quote
                  size={12}
                  style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-muted)' }}
                />
                <em>&ldquo;{o.whatBuyerThinks}&rdquo;</em>
              </div>
              <DetailRow
                label="Why it kills the deal"
                body={o.whyItKillsTheDeal}
                accent="#DC2626"
                compact
              />
              <DetailRow label="This-week fix" body={o.thisWeekFix} accent={status.fg} compact />
              {o.verbatimResponse && (
                <DetailRow
                  label="Verbatim response when surfaced"
                  body={o.verbatimResponse}
                  accent="#16A34A"
                  bodyStyle="quote"
                  compact
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Section: Cut List + 4-Step Funnel ─────────────────────────────

function CutListAndFunnelSection() {
  return (
    <section style={sectionStyle}>
      <SectionHeader
        eyebrow="The 80% cut list + 4-step conversion funnel"
        title="Hide the cathedral. Ship the funnel."
        body="DI has 200+ React components, 70+ API routes, 14 RSS feeds, an AI boardroom simulator, founder hub, content studio. For the 30-day fastest-converter close: kill / hide / enterprise-tier 80% of it. Below: the cut list, then the simplified 4-step landing → demo → audit → checkout funnel that closes paid validation."
        icon={<Zap size={16} color="#D97706" />}
      />

      {/* Cut list grid */}
      <div style={{ marginBottom: 18 }}>
        <div style={subHeader('#D97706')}>The cut list</div>
        <div style={cutListGrid}>
          {CUT_LIST.map(item => {
            const v = VERDICT_COLORS[item.verdict];
            return (
              <div key={item.feature} style={cutCard(v)}>
                <div style={cutCardHeader}>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {item.feature}
                  </strong>
                  <span style={verdictBadge(v)}>{v.label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.rationale}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4-step funnel */}
      <div>
        <div style={subHeader('#D97706')}>The simplified 4-step funnel</div>
        <div style={funnelRow}>
          {SIMPLIFIED_FUNNEL.map((step, i) => (
            <div key={step.number} style={{ display: 'contents' }}>
              <div style={funnelStep}>
                <div style={funnelStepNumber}>{step.number}</div>
                <div style={funnelStepLabel}>{step.label}</div>
                <DetailRow label="What it IS" body={step.what} accent="#16A34A" compact />
                <DetailRow
                  label="What it is NOT"
                  body={step.whatItIsNot}
                  accent="#DC2626"
                  compact
                />
                <DetailRow label="Action" body={step.action} accent="#0EA5E9" compact />
              </div>
              {i < SIMPLIFIED_FUNNEL.length - 1 && (
                <ArrowRight
                  size={16}
                  color="var(--text-muted)"
                  style={{ flexShrink: 0, alignSelf: 'center' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Phrases to Never Say ─────────────────────────────────

function NeverSaySection() {
  return (
    <section style={sectionStyle}>
      <SectionHeader
        eyebrow="3 phrases you must never say"
        title="The phrases that kill deals before the close"
        body="Each of these is a Maalouf or Satyam violation. Each kills the deal in the first 5 seconds after it leaves your mouth. Read these out loud once a week so they never accidentally come out on a real call."
        icon={<XCircle size={16} color="#DC2626" />}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NEVER_SAY_PHRASES.map((p, i) => (
          <div key={i} style={neverCard}>
            <div style={neverPhrase}>
              <XCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontStyle: 'italic' }}>&ldquo;{p.phrase}&rdquo;</span>
            </div>
            <DetailRow label="Why it kills the deal" body={p.whyItKills} accent="#DC2626" compact />
            <DetailRow
              label="Say this instead"
              body={p.saySteadInstead}
              accent="#16A34A"
              bodyStyle="quote"
              compact
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  body,
  icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--accent-primary)',
          marginBottom: 4,
        }}
      >
        {icon}
        {eyebrow}
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 4px 0',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
        {body}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  body,
  accent,
  compact = false,
  bodyStyle,
}: {
  label: string;
  body: string;
  accent: string;
  compact?: boolean;
  bodyStyle?: 'quote';
}) {
  return (
    <div style={{ marginBottom: compact ? 8 : 12 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: accent,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          ...(bodyStyle === 'quote'
            ? {
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 'var(--radius-sm)',
                fontStyle: 'italic',
              }
            : {}),
        }}
      >
        {bodyStyle === 'quote' ? `"${body}"` : body}
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  padding: 16,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
};

const tabRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 6,
  marginBottom: 14,
};

const tabButton: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s, border-color 0.2s',
};

const detailWrap = (color: string): React.CSSProperties => ({
  padding: 14,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderLeft: `3px solid ${color}`,
  borderRadius: 'var(--radius-md)',
});

const subHeader = (color: string): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color,
  marginBottom: 10,
});

const sequenceList: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const sequenceItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  fontSize: 12.5,
  color: 'var(--text-primary)',
  lineHeight: 1.55,
};

const dayBadge = (color: string): React.CSSProperties => ({
  flexShrink: 0,
  width: 22,
  height: 22,
  borderRadius: '50%',
  background: color,
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'JetBrains Mono', monospace",
});

const trapGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 10,
};

const trapCard = (color: string): React.CSSProperties => ({
  padding: 14,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderLeft: `3px solid ${color}`,
  borderRadius: 'var(--radius-md)',
});

const trapLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: 'var(--text-primary)',
  marginBottom: 10,
};

const principleStrip: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginBottom: 14,
};

const principleChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  border: '1px solid',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'background 0.2s, border-color 0.2s',
};

const principleNumber: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  fontFamily: "'JetBrains Mono', monospace",
  color: '#0EA5E9',
};

const quoteBlock: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: 12,
};

const objectionCard = (border: string): React.CSSProperties => ({
  padding: 14,
  background: 'var(--bg-secondary)',
  border: `1px solid ${border}`,
  borderRadius: 'var(--radius-md)',
});

const objectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 10,
  flexWrap: 'wrap',
};

const objectionThought: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '10px 14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12.5,
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: 12,
};

const statusBadge = (status: { bg: string; border: string; fg: string }): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  background: status.bg,
  border: `1px solid ${status.border}`,
  color: status.fg,
  borderRadius: 999,
});

const cutListGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 8,
};

const cutCard = (v: { border: string }): React.CSSProperties => ({
  padding: 12,
  background: 'var(--bg-secondary)',
  border: `1px solid ${v.border}`,
  borderRadius: 'var(--radius-md)',
});

const cutCardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  marginBottom: 6,
  flexWrap: 'wrap',
};

const verdictBadge = (v: { bg: string; border: string; fg: string }): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  fontSize: 9,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  background: v.bg,
  border: `1px solid ${v.border}`,
  color: v.fg,
  borderRadius: 999,
  whiteSpace: 'nowrap',
});

const funnelRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  gap: 8,
};

const funnelStep: React.CSSProperties = {
  flex: '1 1 200px',
  minWidth: 220,
  padding: 14,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const funnelStepNumber: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#16A34A',
  color: '#FFFFFF',
  fontWeight: 800,
  fontSize: 13,
  fontFamily: "'JetBrains Mono', monospace",
  marginBottom: 4,
};

const funnelStepLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 8,
};

const neverCard: React.CSSProperties = {
  padding: 14,
  background: 'rgba(239, 68, 68, 0.04)',
  border: '1px solid rgba(239, 68, 68, 0.25)',
  borderRadius: 'var(--radius-md)',
};

const neverPhrase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 13.5,
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 10,
  paddingBottom: 10,
  borderBottom: '1px solid var(--border-color)',
};
