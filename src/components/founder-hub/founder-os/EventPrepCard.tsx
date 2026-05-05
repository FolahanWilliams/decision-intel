'use client';

/**
 * Event Prep card — surfaces the next highest-priority Phase 1 wedge event
 * with countdown + 4-persona DM scaffolding + action cadence.
 *
 * Locked 2026-05-05 (deep nightly audit Section 9.1). Mounts on FounderOSTab
 * between the hero and the streak grid. Auto-hides when no event is upcoming
 * within 90 days — the surface only earns the slot when there is a calendar-
 * gated outreach forcing function.
 *
 * Source of truth: src/lib/data/event-prep.ts. When the event lineup, persona
 * shape, or DM templates change, edit the data module — this component reads
 * by import.
 */

import { useState } from 'react';
import { Calendar, Users, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ACTION_CADENCE,
  WEDGE_PERSONAS,
  daysUntil,
  getDmTemplate,
  getHighestPriorityUpcomingEvent,
  type WedgePersonaId,
  type WedgePersona,
  type PrepEvent,
} from '@/lib/data/event-prep';

const HIDE_AFTER_DAYS = 90;

export function EventPrepCard() {
  const event = getHighestPriorityUpcomingEvent();
  const [openPersona, setOpenPersona] = useState<WedgePersonaId | null>(null);
  const [showCadence, setShowCadence] = useState(false);

  if (!event) return null;
  const days = daysUntil(event);
  if (days > HIDE_AFTER_DAYS) return null;

  const accentColor =
    event.priority === 'highest'
      ? 'var(--accent-primary)'
      : event.priority === 'high'
        ? 'var(--warning)'
        : 'var(--text-muted)';

  const urgencyBand = days <= 7 ? 'critical' : days <= 21 ? 'high' : 'medium';
  const urgencyColor =
    urgencyBand === 'critical'
      ? 'var(--error)'
      : urgencyBand === 'high'
        ? 'var(--warning)'
        : 'var(--text-secondary)';

  return (
    <div
      className="event-prep-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 22px',
        marginBottom: 20,
      }}
    >
      <EventHeader event={event} days={days} urgencyColor={urgencyColor} />
      <PersonaRow
        primaryPersonas={event.primaryPersonas}
        openPersona={openPersona}
        onTogglePersona={id => setOpenPersona(prev => (prev === id ? null : id))}
      />
      {openPersona && <PersonaDetail personaId={openPersona} />}
      <CadenceToggle
        open={showCadence}
        weeksOut={Math.ceil(days / 7)}
        onToggle={() => setShowCadence(v => !v)}
      />
      {showCadence && <CadenceList weeksOut={Math.ceil(days / 7)} />}
      <MobileStyles />
    </div>
  );
}

function EventHeader({
  event,
  days,
  urgencyColor,
}: {
  event: PrepEvent;
  days: number;
  urgencyColor: string;
}) {
  return (
    <div
      className="event-prep-header"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 14,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            marginBottom: 8,
          }}
        >
          <Calendar size={11} />
          Phase 1 wedge · {event.priority} signal
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: 4,
            lineHeight: 1.3,
          }}
        >
          {event.name}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 8,
          }}
        >
          {event.startDate}
          {event.endDate !== event.startDate ? ` → ${event.endDate}` : ''} · {event.venue}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            maxWidth: 640,
          }}
        >
          {event.rationale}
        </div>
      </div>
      <div
        style={{
          textAlign: 'right',
          flexShrink: 0,
          minWidth: 100,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: urgencyColor,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          }}
        >
          {days}d
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          {days === 0 ? 'Today' : days < 0 ? 'Past' : 'Until'}
        </div>
      </div>
    </div>
  );
}

function PersonaRow({
  primaryPersonas,
  openPersona,
  onTogglePersona,
}: {
  primaryPersonas: WedgePersonaId[];
  openPersona: WedgePersonaId | null;
  onTogglePersona: (id: WedgePersonaId) => void;
}) {
  const ordered = [
    ...primaryPersonas,
    ...WEDGE_PERSONAS.filter(p => !primaryPersonas.includes(p.id)).map(p => p.id),
  ];
  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        <Users size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
        Pick a persona to see DM scaffolding
      </div>
      <div
        className="event-prep-persona-row"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {ordered.map(id => {
          const persona = WEDGE_PERSONAS.find(p => p.id === id);
          if (!persona) return null;
          const isPrimary = primaryPersonas.includes(id);
          const isOpen = openPersona === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTogglePersona(id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12.5,
                fontWeight: 600,
                border: `1px solid ${isOpen ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: isOpen ? 'var(--bg-elevated)' : 'var(--bg-card)',
                color: isOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {isPrimary && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--accent-primary)',
                  }}
                  aria-label="Primary persona for this event"
                />
              )}
              {persona.label}
              {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PersonaDetail({ personaId }: { personaId: WedgePersonaId }) {
  const persona = WEDGE_PERSONAS.find(p => p.id === personaId);
  const template = getDmTemplate(personaId);
  if (!persona || !template) return null;

  return (
    <div
      style={{
        marginTop: 16,
        padding: '16px 18px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <PersonaPainBlock persona={persona} />
      <BiasHookList persona={persona} />
      <DmTemplateBlock label="Cold opener (paste then edit)" body={template.opener} />
      <DmTemplateBlock label="Curiosity reply" body={template.curiosityReply} />
      <DmTemplateBlock label="Discovery-call ask (after 1-2 exchanges)" body={template.discoveryAsk} />
      <DmTemplateBlock
        label="4-line follow-up to introducer (warm-intro discipline)"
        body={template.introducerFollowUp}
      />
    </div>
  );
}

function PersonaPainBlock({ persona }: { persona: WedgePersona }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        Self-articulated pain · {persona.band}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          fontStyle: 'italic',
        }}
      >
        &ldquo;{persona.selfArticulatedPain}&rdquo;
      </div>
    </div>
  );
}

function BiasHookList({ persona }: { persona: WedgePersona }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}
      >
        Canonical bias hooks (pick one matching the prospect&rsquo;s industry)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {persona.canonicalBiasHooks.map(hook => (
          <div
            key={hook.case}
            style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              padding: '8px 10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{hook.bias}</span> ·{' '}
            <span style={{ fontWeight: 600 }}>{hook.case}</span> — {hook.whatItDid}.
          </div>
        ))}
      </div>
    </div>
  );
}

function DmTemplateBlock({ label, body }: { label: string; body: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Mail size={11} />
        {label}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          padding: '10px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          whiteSpace: 'pre-wrap',
        }}
      >
        {body}
      </div>
    </div>
  );
}

function CadenceToggle({
  open,
  weeksOut,
  onToggle,
}: {
  open: boolean;
  weeksOut: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12,
        fontWeight: 600,
        border: '1px solid var(--border-color)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
      }}
    >
      {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {open ? 'Hide' : 'Show'} {weeksOut}-week prep cadence ({ACTION_CADENCE.weeklyDmTarget.min}-
      {ACTION_CADENCE.weeklyDmTarget.max} DMs/week target)
    </button>
  );
}

function CadenceList({ weeksOut }: { weeksOut: number }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: '14px 16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ACTION_CADENCE.prepArc.map(step => {
          const isCurrentWeek = step.weeksBeforeEvent === weeksOut;
          const isPast = step.weeksBeforeEvent > weeksOut;
          return (
            <div
              key={step.weeksBeforeEvent}
              style={{
                display: 'flex',
                gap: 12,
                opacity: isPast ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: 56,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: isCurrentWeek ? 'var(--accent-primary)' : 'var(--text-muted)',
                  paddingTop: 2,
                }}
              >
                {step.weeksBeforeEvent === 0 ? 'Event' : `T-${step.weeksBeforeEvent}w`}
              </div>
              <div
                style={{
                  flex: 1,
                  fontSize: 12.5,
                  color: isCurrentWeek ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1.55,
                  fontWeight: isCurrentWeek ? 600 : 400,
                }}
              >
                {step.action}
                {isCurrentWeek && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    · This week
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--border-color)',
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        Sharran 1-1-1 traffic-source discipline: max {ACTION_CADENCE.monthlyEventCap} events/month.
        Every warm intro = 20-min audit on a real memo, not a sales pitch. Send a{' '}
        {ACTION_CADENCE.followUpToIntroducerLines}-line follow-up to the introducer after every
        intro.
      </div>
    </div>
  );
}

function MobileStyles() {
  return (
    <style jsx>{`
      @media (max-width: 700px) {
        :global(.event-prep-card) {
          padding: 16px 14px;
        }
        :global(.event-prep-header) {
          flex-direction: column;
          gap: 12px;
        }
        :global(.event-prep-persona-row) {
          flex-direction: column;
        }
        :global(.event-prep-persona-row button) {
          width: 100%;
          justify-content: flex-start;
        }
      }
    `}</style>
  );
}
