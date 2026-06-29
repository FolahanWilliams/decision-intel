'use client';

/**
 * DiscoveryPitchPanel — interactive pre-event reference for the v3.3
 * hybrid discovery + tailored-pitch motion.
 *
 * Renders the 4 verbatim discovery questions, the deflection script,
 * persona-specific openers, click-to-reveal pitch triggers, the
 * follow-up template, and the discipline rules. Lives at the TOP of
 * SalesToolkitTab so it's the first thing the founder sees when
 * preparing for events / warm-intro calls.
 *
 * All content reads from src/lib/data/discovery-pitch-toolkit.ts —
 * the typed source-of-truth. When the motion changes, edit the data
 * file; this component picks up the change automatically.
 */

import { useState } from 'react';
import {
  MessageCircle,
  Eye,
  Mail,
  AlertTriangle,
  Users,
  Target,
  ChevronDown,
  ChevronRight,
  GitBranch,
  PhoneCall,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  DISCOVERY_QUESTIONS,
  DEFLECTION_SCRIPT,
  DEFLECTION_DISCIPLINE,
  PERSONA_OPENERS,
  PITCH_TRIGGERS,
  PAIN_PATTERNS,
  DISCOVERY_DISCIPLINE_RULES,
  FOLLOWUP_EMAIL_TEMPLATE,
  WHAT_30_CONVERSATIONS_PRODUCE,
  ETA_CALL_SCRIPT,
  ETA_BROKER_TELLS,
  ETA_CALL_PRINCIPLES,
  DECISION_COST_DISCOVERY,
  ETA_FOUNDING_OFFER,
  EFFICIENCY_KPIS,
  type PainPattern,
  type PersonaId,
} from '@/lib/data/discovery-pitch-toolkit';
import { MomDiscoveryFrameworkViz } from './MomDiscoveryFrameworkViz';
import { EtaCostCalculator } from './EtaCostCalculator';

const C = {
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.06)',
  amberBorder: 'rgba(217, 119, 6, 0.22)',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.06)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
  indigo: '#6366F1',
  indigoSoft: 'rgba(99, 102, 241, 0.04)',
  indigoBorder: 'rgba(99, 102, 241, 0.18)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.04)',
  redBorder: 'rgba(220, 38, 38, 0.18)',
};

export function DiscoveryPitchPanel() {
  // Default persona — fractional_cso is the v3.5 HXC wedge default
  // (mirrors Sparring Room's default per Item 1 lock 2026-05-07).
  // Re-aligned 2026-05-08 from legacy 'cso' to 'fractional_cso' as
  // part of the discovery-toolkit v3.5 refresh.
  const [persona, setPersona] = useState<PersonaId>('fractional_cso');
  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);
  const [expandedPattern, setExpandedPattern] = useState<PainPattern['id'] | null>(null);
  const activePersona = PERSONA_OPENERS.find(p => p.id === persona)!;

  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHeader
        accent={C.green}
        eyebrow="Discovery + tailored-pitch · v3.3 motion"
        title="Pre-event reference · the only thing you read in the Uber"
        body="Your one job: find out if their pain is real. Discovery questions ALL FOUR before any pitch. Then pivot with tailored language keyed to what they revealed. The 30-conversation pattern surfaces from the data — don't try to extract it in the first meeting."
      />

      {/* ─── ETA wedge · DECISION COST discovery (run BEFORE the pitch) ───
          The discovery half: make the searcher RATIONALIZE their own decision
          cost (months + fees on dead deals + the regret of the late miss),
          then reveal DI as the IC they don't have. NotebookLM 809f5104
          synthesis, Mom-Test + JOLT grounded. Reads DECISION_COST_DISCOVERY +
          ETA_FOUNDING_OFFER from discovery-pitch-toolkit.ts (edit there). */}
      <div
        style={{
          background: C.greenSoft,
          border: `1px solid ${C.greenBorder}`,
          borderLeft: `3px solid ${C.green}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div style={blockEyebrow(C.green)}>
          <Search size={11} /> ETA wedge · Decision Cost discovery · run this BEFORE the pitch
        </div>
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            margin: '0 0 14px 0',
          }}
        >
          Nobody buys a &ldquo;reasoning audit.&rdquo; They buy confidence they are not missing
          something before committing irreversible capital. Make them total their OWN decision cost
          first &mdash; the months and fees bled on dead deals, the regret of the late miss &mdash;
          then DI reveals itself as the IC they don&rsquo;t have. Facts not opinions; ego-safe; on
          hesitation take risk OFF the table, never dial up FOMO.
        </p>

        {DECISION_COST_DISCOVERY.map(s => (
          <div
            key={s.stage}
            style={{
              display: 'grid',
              gridTemplateColumns: '34px 1fr',
              gap: 12,
              marginBottom: 12,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: C.green,
                lineHeight: 1,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              }}
            >
              {s.stage}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: C.green,
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: s.kind === 'ask' ? C.indigo : C.amber,
                    border: `1px solid ${s.kind === 'ask' ? C.indigoBorder : C.amberBorder}`,
                    background: s.kind === 'ask' ? C.indigoSoft : C.amberSoft,
                    borderRadius: 4,
                    padding: '1px 5px',
                  }}
                >
                  {s.kind === 'ask' ? 'ASK' : 'SAY'}
                </span>
              </div>
              {s.ask.map((q, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: 'var(--text-primary)',
                    lineHeight: 1.5,
                    marginBottom: 5,
                  }}
                >
                  &ldquo;{q}&rdquo;
                </div>
              ))}
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginTop: 4,
                }}
              >
                {s.extracts}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  lineHeight: 1.45,
                  marginTop: 5,
                }}
              >
                <strong style={{ color: C.red }}>Guardrail · </strong>
                {s.guardrail}
              </div>
            </div>
          </div>
        ))}

        {/* The irresistible founding offer */}
        <div
          style={{
            marginTop: 6,
            background: 'color-mix(in srgb, var(--accent-primary) 8%, var(--bg-card))',
            border: `1px solid ${C.greenBorder}`,
            borderRadius: 'var(--radius-sm)',
            padding: 14,
          }}
        >
          <div style={blockEyebrow(C.green)}>
            <ShieldCheck size={11} /> {ETA_FOUNDING_OFFER.headline} · what makes call one a yes
          </div>
          <div style={{ marginTop: 8 }}>
            {ETA_FOUNDING_OFFER.lines.map((l, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  marginBottom: 6,
                  paddingLeft: 12,
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: C.green }}>·</span>
                {l}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginTop: 8,
            }}
          >
            <strong style={{ color: 'var(--text-primary)' }}>Why it&rsquo;s irresistible: </strong>
            {ETA_FOUNDING_OFFER.whyIrresistible}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              marginTop: 6,
            }}
          >
            {ETA_FOUNDING_OFFER.founding}
          </div>
        </div>
      </div>

      {/* ─── ETA wedge · live sales-call script (current Phase-1 motion) ───
          The PITCH half — runs after the Decision Cost discovery above. The
          ETA / owner-operator layer is the current wedge (ICP pivot 2026-06-26).
          The persona openers + pain patterns
          further down are the older bridge-phase content (their ETA migration
          is a recorded follow-up). Reads from ETA_CALL_SCRIPT / ETA_BROKER_TELLS
          / ETA_CALL_PRINCIPLES in discovery-pitch-toolkit.ts. */}
      <div
        style={{
          background: C.greenSoft,
          border: `1px solid ${C.greenBorder}`,
          borderLeft: `3px solid ${C.green}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div style={blockEyebrow(C.green)}>
          <PhoneCall size={11} /> ETA wedge · live sales-call script · current Phase-1 motion
        </div>
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            margin: '0 0 14px 0',
          }}
        >
          The warmer motion — once a self-funded searcher / sponsor agrees to bring a CIM
          they&rsquo;re actively looking at. Discovery first, then the live audit on <em>their</em>{' '}
          real deal (the leading indicator that predicts conversion, not a generic demo), then the
          referral the instant a finding lands. The persona openers below are bridge-phase; this is
          the wedge.
        </p>

        {ETA_CALL_SCRIPT.map(s => (
          <div
            key={s.step}
            style={{
              display: 'grid',
              gridTemplateColumns: '34px 1fr',
              gap: 12,
              marginBottom: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: C.green,
                lineHeight: 1,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              }}
            >
              {s.step}
            </div>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: C.green,
                  marginBottom: 6,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  marginBottom: 6,
                }}
              >
                &ldquo;{s.say}&rdquo;
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 4,
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Why:</strong> {s.why}
              </div>
              <div style={{ fontSize: 11.5, color: C.red, lineHeight: 1.5 }}>
                <strong>Avoid:</strong> {s.avoid}
              </div>
            </div>
          </div>
        ))}

        {/* Broker-narrative tells — live-call ammunition, mirrors the
            acquisition_thesis overlay */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${C.amber}`,
            borderRadius: 'var(--radius-sm)',
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={blockEyebrow(C.amber)}>
            <Search size={11} /> Broker-narrative tells · what the audit flags on a CIM upload
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            Tag a broker CIM as an <strong>acquisition thesis</strong> on upload so these fire. Each
            is a risk indicator to <em>pressure-test</em>, never an accusation the seller lied.
          </div>
          {ETA_BROKER_TELLS.map(t => (
            <div
              key={t.tell}
              style={{
                marginBottom: 10,
                paddingBottom: 10,
                borderBottom: '1px dashed var(--border-color)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.tell}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {t.mapsTo}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {t.plain}
              </div>
            </div>
          ))}
        </div>

        {/* Lock-clean guardrails */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${C.indigo}`,
            borderRadius: 'var(--radius-sm)',
            padding: 12,
          }}
        >
          <div style={blockEyebrow(C.indigo)}>
            <ShieldCheck size={11} /> Guardrails · the 4 things a sophisticated searcher punishes
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 18,
              fontSize: 11.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            {ETA_CALL_PRINCIPLES.map(p => (
              <li key={p} style={{ marginBottom: 5 }}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Cost-of-inaction calculator — the screen-share-on-the-call tool that
          pairs with step 4 of the script (anchor the big number before the
          price). Net-new piece from the ETA sales-playbook research pack; the
          rest of the pack (DM copy, discovery, objections, bias map, broker
          tells) was already built. Self-contained; lock-clean guardrails. */}
      <EtaCostCalculator />

      {/* Efficiency vs outcome KPIs — what you can honestly promise NOW vs the
          long-game moat. Reiner/Josh KPI lesson 2026-06-29; reads EFFICIENCY_KPIS
          from discovery-pitch-toolkit.ts. The trap: Taktile shows outcome KPIs
          (n=thousands, fast); DI is n=1, years-out, so promise efficiency now and
          name the moat as direction, never as a number. */}
      <div
        style={{
          background: C.greenSoft,
          border: `1px solid ${C.greenBorder}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div style={blockEyebrow(C.green)}>
          <Target size={11} /> The KPIs you can honestly promise (vs the moat)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
            marginTop: 12,
          }}
        >
          {[EFFICIENCY_KPIS.wedge, EFFICIENCY_KPIS.moat].map((group, gi) => (
            <div
              key={group.label}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${gi === 0 ? C.greenBorder : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: gi === 0 ? C.green : 'var(--text-secondary)',
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {group.label}
              </div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {group.items.map(item => (
                  <li
                    key={item}
                    style={{
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                      marginBottom: 4,
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            margin: '12px 0 0',
          }}
        >
          {EFFICIENCY_KPIS.discipline}
        </p>
      </div>

      {/* Mom Discovery Test framework dynamic viz — interactive SVG flow.
          Mounts at the top so the visual lives next to the text-based reference;
          click any stage to zoom into the verbatim language. */}
      <MomDiscoveryFrameworkViz />

      {/* The 4 discovery questions */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${C.green}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={blockEyebrow(C.green)}>
          <MessageCircle size={11} /> The 4 questions · ask in order, no skipping
        </div>
        {DISCOVERY_QUESTIONS.map(q => (
          <div
            key={q.order}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: C.green,
                lineHeight: 1,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              }}
            >
              Q{q.order}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  marginBottom: 6,
                }}
              >
                &ldquo;{q.question}&rdquo;
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 4,
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Why:</strong> {q.why}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Watch for:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: 18 }}>
                  {q.watchFor.map(s => (
                    <li key={s} style={{ marginBottom: 2 }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deflection script */}
      <div
        style={{
          background: C.redSoft,
          border: `1px solid ${C.redBorder}`,
          borderRadius: 'var(--radius-md)',
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={blockEyebrow(C.red)}>
          <Eye size={11} /> Deflection · if asked &ldquo;what do you do?&rdquo; before Q4
        </div>
        <div
          style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 8,
          }}
        >
          &ldquo;{DEFLECTION_SCRIPT}&rdquo;
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {DEFLECTION_DISCIPLINE.map(d => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>

      {/* Persona-specific openers */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${C.indigo}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={blockEyebrow(C.indigo)}>
          <Users size={11} /> Opener · pick your persona before the conversation
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {PERSONA_OPENERS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersona(p.id)}
              style={{
                padding: '8px 10px',
                fontSize: 11.5,
                fontWeight: persona === p.id ? 700 : 500,
                background: persona === p.id ? C.indigoSoft : 'var(--bg-secondary)',
                border: `1px solid ${persona === p.id ? C.indigo : 'var(--border-color)'}`,
                color: persona === p.id ? C.indigo : 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div
          style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            background: C.indigoSoft,
            border: `1px solid ${C.indigoBorder}`,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: activePersona.disciplineNote ? 8 : 0,
          }}
        >
          &ldquo;{activePersona.opener}&rdquo;
        </div>

        {/* Per-persona discovery question + pain cue + bridge sentence —
            NotebookLM synthesis 2026-05-08, v3.5 HXC narrowing. The Mom-
            Test 4 questions in DISCOVERY_QUESTIONS still get asked in
            fixed order; this is the SHARPER lead-in for cold-context
            DMs to this specific persona. */}
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            background: 'var(--bg-secondary)',
            border: `1px solid ${C.indigoBorder}`,
            borderLeft: `3px solid ${C.indigo}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: 11.5,
            lineHeight: 1.55,
            color: 'var(--text-primary)',
            display: 'grid',
            gap: 8,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: C.indigo,
                marginBottom: 4,
              }}
            >
              Sharpened discovery question · {activePersona.archetype}-archetype
            </div>
            <div style={{ fontSize: 12.5, fontStyle: 'italic' }}>
              &ldquo;{activePersona.discoveryQuestion}&rdquo;
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
                marginBottom: 2,
              }}
            >
              Listen for
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {activePersona.painSignalCue.map(cue => (
                <li key={cue} style={{ marginBottom: 2 }}>
                  &ldquo;{cue}&rdquo;
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary)',
                marginBottom: 2,
              }}
            >
              Bridge sentence (if cue fires)
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-primary)' }}>
              {activePersona.bridgeSentence}
            </div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              lineHeight: 1.45,
              paddingTop: 6,
              borderTop: '1px dashed var(--border-color)',
            }}
          >
            Master-KB anchor: {activePersona.kbAnchor}
          </div>
        </div>

        {activePersona.disciplineNote && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11.5,
              color: C.red,
              fontWeight: 600,
              padding: '6px 10px',
              background: C.redSoft,
              border: `1px solid ${C.redBorder}`,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <AlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {activePersona.disciplineNote}
          </div>
        )}
      </div>

      {/* Tailored-pitch playbook (collapsible cards) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${C.amber}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={blockEyebrow(C.amber)}>
          <Target size={11} /> Tailored-pitch playbook · trigger fires AFTER all 4 questions
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          The pivot sentence:{' '}
          <em>
            &ldquo;Based on what you said about [their specific pain in their words], I think I have
            something you should see.&rdquo;
          </em>{' '}
          Then this pitch keyed to the signal. Click to expand each trigger.
        </div>
        {PITCH_TRIGGERS.map((trigger, i) => {
          const isExpanded = expandedTrigger === i;
          return (
            <div
              key={i}
              style={{
                marginBottom: 8,
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: isExpanded ? C.amberSoft : 'var(--bg-secondary)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedTrigger(isExpanded ? null : i)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  textAlign: 'left',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <ChevronRight size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                )}
                <span style={{ flex: 1 }}>
                  <strong style={{ color: C.amber }}>If they revealed:</strong> &ldquo;
                  {trigger.ifRevealed}&rdquo;
                </span>
              </button>
              {isExpanded && (
                <div style={{ padding: '0 12px 12px 34px' }}>
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: C.green,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 4,
                      }}
                    >
                      Pitch (verbatim)
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontStyle: 'italic',
                        color: 'var(--text-primary)',
                        lineHeight: 1.6,
                        background: 'var(--bg-card)',
                        border: `1px solid ${C.greenBorder}`,
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      &ldquo;{trigger.pitch}&rdquo;
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: C.red,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 4,
                      }}
                    >
                      Avoid
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      {trigger.avoid}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pain patterns × feature crosswalk · Goldner archaeology, locked 2026-05-05 */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${C.indigo}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={blockEyebrow(C.indigo)}>
          <GitBranch size={11} /> Pain patterns · the demo move is determined by which one fires
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            marginBottom: 12,
          }}
        >
          The three patterns cut ACROSS personas. Once you hear which one the prospect described,
          you don&rsquo;t need to rehearse all 4 personas &times; 7 scenarios &mdash; you match the
          pattern to its feature and run. Click to expand each pattern for signal phrases, feature
          wedge, demo move, and bias-hook anchors.
        </div>
        {PAIN_PATTERNS.map(pattern => {
          const isExpanded = expandedPattern === pattern.id;
          return (
            <div
              key={pattern.id}
              style={{
                marginBottom: 8,
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: isExpanded ? C.indigoSoft : 'var(--bg-secondary)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setExpandedPattern(isExpanded ? null : pattern.id)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  textAlign: 'left',
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <ChevronRight size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                )}
                <span style={{ flex: 1, color: C.indigo }}>{pattern.label}</span>
              </button>
              {isExpanded && (
                <div style={{ padding: '0 12px 12px 34px' }}>
                  <PatternDetailBlock pattern={pattern} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Follow-up email template */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${C.green}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={blockEyebrow(C.green)}>
          <Mail size={11} /> 4-line follow-up · within 12 hours of every conversation
        </div>
        <pre
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            fontSize: 11.5,
            color: 'var(--text-primary)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            margin: 0,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.55,
            overflow: 'auto',
          }}
        >
          {FOLLOWUP_EMAIL_TEMPLATE}
        </pre>
      </div>

      {/* Discipline rules */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderLeft: `3px solid ${C.red}`,
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 14,
        }}
      >
        <div style={blockEyebrow(C.red)}>
          <AlertTriangle size={11} /> Discipline · what NOT to do
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          {DISCOVERY_DISCIPLINE_RULES.map(d => (
            <li
              key={d.rule}
              style={{
                marginBottom: 10,
                paddingLeft: 14,
                borderLeft: `2px solid ${C.redBorder}`,
              }}
            >
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
                {d.rule}
              </div>
              <div style={{ fontSize: 11.5 }}>{d.why}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Outcomes after 30 conversations */}
      <div
        style={{
          background: C.greenSoft,
          border: `1px solid ${C.greenBorder}`,
          borderRadius: 'var(--radius-md)',
          padding: 14,
        }}
      >
        <div style={blockEyebrow(C.green)}>What 30 conversations produce</div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 12,
            color: 'var(--text-primary)',
            lineHeight: 1.55,
          }}
        >
          {WHAT_30_CONVERSATIONS_PRODUCE.map(s => (
            <li key={s} style={{ marginBottom: 4 }}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function SectionHeader({
  accent,
  eyebrow,
  title,
  body,
}: {
  accent: string;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: accent,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 6px 0',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}

function PatternDetailBlock({ pattern }: { pattern: PainPattern }) {
  const indigo = '#6366F1';
  const green = '#16A34A';
  const amber = '#D97706';
  return (
    <div>
      {/* Signal phrases */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: indigo,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Signal phrases (their words)
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 16,
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          {pattern.signalPhrases.map(phrase => (
            <li key={phrase} style={{ marginBottom: 2 }}>
              &ldquo;{phrase}&rdquo;
            </li>
          ))}
        </ul>
      </div>

      {/* Feature wedge */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: green,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Feature wedge (what to demo)
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {pattern.featureWedge}
        </div>
      </div>

      {/* Demo move */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: amber,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Demo move (run it on the call)
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-primary)',
            lineHeight: 1.55,
            fontStyle: 'italic',
          }}
        >
          {pattern.demoMove}
        </div>
      </div>

      {/* Bias hook anchors */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Bias-hook anchors (lead with the matching one)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {pattern.biasHookAnchors.map(anchor => (
            <span
              key={anchor}
              style={{
                fontSize: 10.5,
                color: 'var(--text-secondary)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
              }}
            >
              {anchor}
            </span>
          ))}
        </div>
      </div>

      {/* Why this is the move */}
      <div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4,
          }}
        >
          Why this is the highest-leverage move
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {pattern.starterRationale}
        </div>
      </div>
    </div>
  );
}

function blockEyebrow(color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color,
    marginBottom: 8,
  };
}
