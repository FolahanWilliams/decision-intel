'use client';

/**
 * AccountabilitySprintTab — the founder's prep + 4-week plan for the Kristian
 * Marcus 1-on-1 (the accountability sprint that collapsed into an exclusive
 * advisory session). Mirrors the LRQA / Cornerstone warm-intro brief pattern:
 * a static, founder-hub-internal brief rendered from a data SSOT
 * (sprint/sprint-brief-data.ts). Role-neutral tab label; named content inside.
 *
 * No founderPass / API calls — pure static brief.
 */

import {
  Handshake,
  GitCompareArrows,
  Search,
  Quote,
  Flag,
  CalendarDays,
  ListChecks,
  Gift,
  ClipboardCheck,
  ShieldAlert,
  Users,
  MessagesSquare,
  Send,
  FileText,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import {
  SPRINT_META,
  READ_THE_ROOM,
  RESONANCE,
  EXTRACTION_TARGETS,
  GOAL,
  FOUR_WEEK_PLAN,
  WEEK_ONE,
  GIVE,
  LOGISTICS,
  GUARDRAILS,
  RELATIONSHIP_PLAY,
  DISCOVERY_SCRIPT,
  LEAVE_BEHIND,
  ONE_PAGER,
} from './sprint/sprint-brief-data';
import { ConvergenceViz, SprintArcViz, ExtractionLadderViz } from './sprint/SprintVizzes';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}

function Section({ icon, title, subtitle, accent, children }: SectionProps) {
  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${accent}18`,
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
      </div>
      {children}
    </section>
  );
}

const ACCENT = {
  green: 'var(--accent-primary)',
  info: 'var(--info)',
  warning: 'var(--warning)',
  danger: 'var(--error)',
  muted: 'var(--text-muted)',
};

/** A verbatim line to say out loud — rendered as a quotable block. */
function SayThis({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${ACCENT.green}`,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        fontSize: 13.5,
        lineHeight: 1.6,
        color: 'var(--text-primary)',
        fontStyle: 'italic',
      }}
    >
      {children}
    </div>
  );
}

const bodyText: React.CSSProperties = {
  fontSize: 13.5,
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
};

export function AccountabilitySprintTab() {
  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: ACCENT.green,
            marginBottom: 8,
          }}
        >
          <Handshake size={13} strokeWidth={2.5} aria-hidden />
          Accountability Sprint · 1-on-1 advisory
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--fs-page-h1-platform)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
        >
          {SPRINT_META.host} · the extraction plan
        </h1>
        <p style={{ ...bodyText, marginTop: 8 }}>
          {SPRINT_META.hostRole}.{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{SPRINT_META.when}</strong> ·{' '}
          {SPRINT_META.where}.
        </p>
        <div style={{ marginTop: 12 }}>
          <SayThis>{SPRINT_META.oneLiner}</SayThis>
        </div>
      </div>

      {/* Read the room */}
      <Section
        icon={<Users size={16} />}
        title="Read the room first"
        subtitle="Why this is a gift, not a workshop"
        accent={ACCENT.green}
      >
        <p style={{ ...bodyText, margin: 0 }}>{READ_THE_ROOM}</p>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          InsurX context: {SPRINT_META.hostCompany}
        </div>
      </Section>

      {/* The parallel / opener */}
      <Section
        icon={<GitCompareArrows size={16} />}
        title="The parallel that earns instant respect"
        subtitle="Open with this — InsurX and Decision Intel are the same company aimed at two markets"
        accent={ACCENT.info}
      >
        <div style={{ marginBottom: 14 }}>
          <SayThis>{RESONANCE.opener}</SayThis>
        </div>
        <div style={{ marginBottom: 14 }}>
          <ConvergenceViz />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RESONANCE.map.map((row, i) => (
            <AccentCard key={i} accent="info" title={null}>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
                className="sprint-resonance-grid"
              >
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: ACCENT.info,
                      marginBottom: 4,
                    }}
                  >
                    InsurX
                  </div>
                  <div style={bodyText}>{row.insurx}</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: ACCENT.green,
                      marginBottom: 4,
                    }}
                  >
                    Decision Intel
                  </div>
                  <div style={bodyText}>{row.di}</div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                → {row.takeaway}
              </div>
            </AccentCard>
          ))}
        </div>
      </Section>

      {/* What to extract */}
      <Section
        icon={<Search size={16} />}
        title="What to extract from him"
        subtitle="The heart of it — ranked by his unique edge. Lead with A + B; let the rest pull through."
        accent={ACCENT.green}
      >
        <div style={{ marginBottom: 16 }}>
          <ExtractionLadderViz />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXTRACTION_TARGETS.map(t => (
            <AccentCard
              key={t.id}
              accent={t.priority === 'lead' ? 'primary' : 'muted'}
              title={t.title}
            >
              <p style={{ ...bodyText, margin: '0 0 10px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Why him: </strong>
                {t.whyHim}
              </p>
              {t.questions.map((q, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    marginTop: i === 0 ? 0 : 8,
                  }}
                >
                  <Quote
                    size={13}
                    style={{ color: ACCENT.green, flexShrink: 0, marginTop: 2 }}
                    aria-hidden
                  />
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: 'var(--text-primary)',
                      fontStyle: 'italic',
                    }}
                  >
                    {q}
                  </span>
                </div>
              ))}
            </AccentCard>
          ))}
        </div>
      </Section>

      {/* The goal + corrections */}
      <Section
        icon={<Flag size={16} />}
        title="The 4-week goal he asked you to bring"
        subtitle="Not generic — and two corrections that raise his respect"
        accent={ACCENT.warning}
      >
        <div style={{ marginBottom: 12 }}>
          <SayThis>{GOAL.recommended}</SayThis>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GOAL.corrections.map((c, i) => (
            <AccentCard key={i} accent="warning" title={c.title}>
              <p style={{ ...bodyText, margin: 0 }}>{c.detail}</p>
            </AccentCard>
          ))}
        </div>
      </Section>

      {/* Full 4-week plan */}
      <Section
        icon={<CalendarDays size={16} />}
        title="The full 4-week plan"
        subtitle="DI-aligned: HXC-persona wedge, discovery-led, BAFTA as the week-1 engine"
        accent={ACCENT.info}
      >
        <div style={{ marginBottom: 16 }}>
          <SprintArcViz />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FOUR_WEEK_PLAN.map((w, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${ACCENT.info}`,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {w.week}
                </span>
                <span style={{ fontSize: 12, color: ACCENT.info, fontWeight: 700 }}>{w.phase}</span>
              </div>
              <div style={{ ...bodyText, marginBottom: 8 }}>{w.objective}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Success: </strong>
                {w.metric}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Week 1 commitments + time */}
      <Section
        icon={<ListChecks size={16} />}
        title="Week-1 commitments to put on the table"
        subtitle="The three deliverables he asked for + when you'll actually do the work"
        accent={ACCENT.green}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          className="sprint-week1-grid"
        >
          <AccentCard accent="primary" title="Deliverables for next check-in">
            <ol
              style={{
                ...bodyText,
                margin: 0,
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {WEEK_ONE.commitments.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
          </AccentCard>
          <AccentCard accent="info" title="Time protection (when you'll work)">
            <ul
              style={{
                ...bodyText,
                margin: 0,
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {WEEK_ONE.timeProtection.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </AccentCard>
        </div>
      </Section>

      {/* Week-1 deliverable 1 — Discovery script */}
      <Section
        icon={<MessagesSquare size={16} />}
        title="Deliverable 1 · Discovery script"
        subtitle="Bring this tomorrow. Run it live at BAFTA + every call. Mom-Test: past-tense, behaviour-not-opinion, no pitch until the pivot."
        accent={ACCENT.green}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <div style={bodyText}>
            <strong style={{ color: 'var(--text-primary)' }}>Opener — </strong>
            {DISCOVERY_SCRIPT.opener}
          </div>
          <div style={bodyText}>
            <strong style={{ color: 'var(--text-primary)' }}>Deflection — </strong>
            {DISCOVERY_SCRIPT.deflection}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DISCOVERY_SCRIPT.questions.map((item, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${ACCENT.green}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    flexShrink: 0,
                    borderRadius: 5,
                    background: ACCENT.green,
                    color: '#fff',
                    fontSize: 10.5,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                  }}
                >
                  {item.q}
                </span>
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, paddingLeft: 26 }}
              >
                <strong style={{ color: 'var(--text-secondary)' }}>Listen for: </strong>
                {item.listenFor}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <SayThis>
            <strong>Pivot (only if signal): </strong>
            {DISCOVERY_SCRIPT.pivot}
          </SayThis>
        </div>
        <div style={{ ...bodyText, marginTop: 10 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Capture rule — </strong>
          {DISCOVERY_SCRIPT.captureRule}
        </div>
      </Section>

      {/* Week-1 deliverable 2 — Leave-behind line */}
      <Section
        icon={<Send size={16} />}
        title="Deliverable 2 · Jargon-free leave-behind"
        subtitle="The one line a prospect forwards to a colleague. Zero engineering vocabulary — no DPR / DQI / R²F / pipeline."
        accent={ACCENT.info}
      >
        <div style={{ marginBottom: 12 }}>
          <SayThis>{LEAVE_BEHIND.coreLine}</SayThis>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEAVE_BEHIND.variants.map((v, i) => (
            <div key={i} style={bodyText}>
              <strong style={{ color: 'var(--text-primary)' }}>{v.persona}: </strong>
              {v.line}
            </div>
          ))}
        </div>
      </Section>

      {/* Week-1 deliverable 3 — One-pager */}
      <Section
        icon={<FileText size={16} />}
        title="Deliverable 3 · One-pager"
        subtitle="The leave-behind artefact + the script for what you actually say. Hand it over, or DM it after."
        accent={ACCENT.warning}
      >
        <AccentCard accent="primary" title={null}>
          <div
            style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}
          >
            {ONE_PAGER.headline}
          </div>
          <div style={{ ...bodyText, marginTop: 6, color: 'var(--text-primary)' }}>
            {ONE_PAGER.subhead}
          </div>
          <div style={{ ...bodyText, marginTop: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>The problem — </strong>
            {ONE_PAGER.problem}
          </div>
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: ACCENT.green,
                marginBottom: 6,
              }}
            >
              What you get in 60 seconds
            </div>
            <ul
              style={{
                ...bodyText,
                margin: 0,
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {ONE_PAGER.whatYouGet.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
          <div style={{ ...bodyText, marginTop: 12 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Proof — </strong>
            {ONE_PAGER.proof}
          </div>
          <div style={{ marginTop: 12 }}>
            <SayThis>
              <strong>Call to action: </strong>
              {ONE_PAGER.cta}
            </SayThis>
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic' }}
          >
            {ONE_PAGER.egoSafeFooter}
          </div>
        </AccentCard>
      </Section>

      {/* What to give */}
      <Section
        icon={<Gift size={16} />}
        title="What to give him"
        subtitle="A mentee who only extracts is forgettable — make him want to keep investing"
        accent={ACCENT.warning}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GIVE.map((g, i) => (
            <div key={i} style={{ ...bodyText }}>
              <strong style={{ color: 'var(--text-primary)' }}>{g.move}. </strong>
              {g.detail}
            </div>
          ))}
        </div>
      </Section>

      {/* Logistics + guardrails */}
      <Section
        icon={<ClipboardCheck size={16} />}
        title="The 5-minute logistics checklist"
        subtitle="Walk in ready"
        accent={ACCENT.muted}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {LOGISTICS.map((l, i) => (
            <div key={i} style={{ ...bodyText }}>
              <strong style={{ color: 'var(--text-primary)' }}>{l.item}. </strong>
              {l.detail}
            </div>
          ))}
        </div>
        <AccentCard accent="danger" title="This is NOT a pitch — guardrails">
          <ul
            style={{
              ...bodyText,
              margin: 0,
              paddingLeft: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {GUARDRAILS.map((g, i) => (
              <li key={i}>
                <ShieldAlert
                  size={12}
                  style={{ color: ACCENT.danger, marginRight: 4, verticalAlign: 'middle' }}
                  aria-hidden
                />
                {g}
              </li>
            ))}
          </ul>
        </AccentCard>
      </Section>

      {/* The relationship play */}
      <Section
        icon={<Users size={16} />}
        title="The actual prize: a four-week relationship"
        subtitle="Not one evening"
        accent={ACCENT.green}
      >
        <p style={{ ...bodyText, margin: 0 }}>{RELATIONSHIP_PLAY}</p>
      </Section>

      <style>{`
        @media (max-width: 640px) {
          .sprint-resonance-grid { grid-template-columns: 1fr !important; }
          .sprint-week1-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
