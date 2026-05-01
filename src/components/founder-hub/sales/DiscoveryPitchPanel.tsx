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
} from 'lucide-react';
import {
  DISCOVERY_QUESTIONS,
  DEFLECTION_SCRIPT,
  DEFLECTION_DISCIPLINE,
  PERSONA_OPENERS,
  PITCH_TRIGGERS,
  DISCOVERY_DISCIPLINE_RULES,
  FOLLOWUP_EMAIL_TEMPLATE,
  WHAT_30_CONVERSATIONS_PRODUCE,
  type PersonaId,
} from '@/lib/data/discovery-pitch-toolkit';
import { MomDiscoveryFrameworkViz } from './MomDiscoveryFrameworkViz';

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
  const [persona, setPersona] = useState<PersonaId>('cso');
  const [expandedTrigger, setExpandedTrigger] = useState<number | null>(null);
  const activePersona = PERSONA_OPENERS.find(p => p.id === persona)!;

  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHeader
        accent={C.green}
        eyebrow="Discovery + tailored-pitch · v3.3 motion"
        title="Pre-event reference · the only thing you read in the Uber"
        body="Your one job: find out if their pain is real. Discovery questions ALL FOUR before any pitch. Then pivot with tailored language keyed to what they revealed. The 30-conversation pattern surfaces from the data — don't try to extract it in the first meeting."
      />

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
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
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
                background:
                  persona === p.id
                    ? C.indigoSoft
                    : 'var(--bg-secondary)',
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
        {activePersona.disciplineNote && (
          <div
            style={{
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
          The pivot sentence: <em>&ldquo;Based on what you said about [their specific pain in their
          words], I think I have something you should see.&rdquo;</em> Then this pitch keyed to
          the signal. Click to expand each trigger.
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
                  <strong style={{ color: C.amber }}>If they revealed:</strong>{' '}
                  &ldquo;{trigger.ifRevealed}&rdquo;
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
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
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
        <div style={blockEyebrow(C.green)}>
          What 30 conversations produce
        </div>
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
