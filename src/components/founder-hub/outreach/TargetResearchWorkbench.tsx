'use client';

/**
 * TargetResearchWorkbench — pre-event prep tool, shipped 2026-05-27 for
 * Strategy World London (BAFTA, June 9-10).
 *
 * Operationalises the T-2w → T-1w prep-arc actions named in
 * src/lib/data/event-prep.ts ACTION_CADENCE.prepArc:
 *   - "Match each name to industry → canonical bias hook from 143-case library."
 *   - "Send first / second wave of 10 DMs."
 *
 * Workflow:
 *   1. Founder pastes an attendee list (LinkedIn-export shape supported).
 *   2. Component parses lines → classifies each by wedge persona →
 *      picks a canonical bias hook → drafts an opener.
 *   3. Founder edits the opener per-prospect (pending substitution
 *      tokens like {topic}, {recent-deal-or-thread} are surfaced as
 *      chips so nothing ships with literal {placeholder} text).
 *   4. "Save to ledger" creates a WedgeProspect at stage='dm_sent' via
 *      the existing /api/founder-hub/outreach/prospects POST — same
 *      idempotency + audit-log discipline as the ConversionLedgerPanel.
 *
 * Mounts at the TOP of OutreachHubTab's pipeline section because
 * pre-event prep is the highest-priority work for the next 13 days.
 */

import { useMemo, useState } from 'react';
import { Users, ClipboardCopy, CheckCircle2, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  parseAttendeeInput,
  researchProspect,
  summarizeResearch,
  type ResearchedProspect,
  type PersonaIdOrOther,
} from '@/lib/outreach/target-research';
import {
  getHighestPriorityUpcomingEvent,
  daysUntil,
  hasEventEnded,
  WEDGE_PERSONAS,
} from '@/lib/data/event-prep';

interface Props {
  founderPass: string;
}

const PERSONA_LABEL_SHORT: Record<PersonaIdOrOther, string> = {
  fractional_cso: 'Fractional CSO',
  midmarket_corp_dev: 'Corp Dev Head',
  smaller_fund_gp: 'Fund GP',
  pe_backed_founder: 'PE-backed CEO',
  other: 'Manual review',
};

const PERSONA_ACCENT: Record<PersonaIdOrOther, string> = {
  fractional_cso: '#16A34A',
  midmarket_corp_dev: '#0EA5E9',
  smaller_fund_gp: '#A855F7',
  pe_backed_founder: '#EAB308',
  other: '#64748B',
};

const EXAMPLE_INPUT = `# Strategy World London — paste your target shortlist here.
# Accepted formats: "Name, Title, Company" · "Name | Title | Company"
# "Name - Title at Company" · "Name (Title, Company)" · "Name — Company" · bare name.

Marcus Reynolds, Fractional CSO, Reynolds Strategy
Damien Park, Head of Corporate Development, Marlin Industries
Aisha Okafor, General Partner, Pan-African Capital
Henrik Olsson, CEO, Helix Manufacturing`;

export function TargetResearchWorkbench({ founderPass }: Props) {
  const [raw, setRaw] = useState('');
  const [researched, setResearched] = useState<ResearchedProspect[]>([]);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const event = useMemo(() => getHighestPriorityUpcomingEvent(), []);
  const eventCountdown = event ? daysUntil(event) : null;

  const handleResearch = () => {
    const parsed = parseAttendeeInput(raw);
    setResearched(parsed.map(researchProspect));
    setSavedIndices(new Set());
    setErrorIndex(null);
    setErrorMsg(null);
  };

  const handleLoadExample = () => {
    setRaw(EXAMPLE_INPUT);
  };

  const handleClear = () => {
    setRaw('');
    setResearched([]);
    setSavedIndices(new Set());
    setErrorIndex(null);
    setErrorMsg(null);
  };

  const handleOpenerEdit = (index: number, newText: string) => {
    setResearched(current => current.map((r, i) => (i === index ? { ...r, opener: newText } : r)));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may fail in sandboxed contexts — silent per
      // CLAUDE.md fire-and-forget exceptions (UI feedback would be
      // misleading on a transient permission issue).
    }
  };

  const handleSaveToLedger = async (index: number) => {
    const prospect = researched[index];
    if (!prospect || prospect.persona === 'other') return;
    setSavingIndex(index);
    setErrorIndex(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/founder-hub/outreach/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-pass': founderPass,
        },
        body: JSON.stringify({
          name: prospect.name,
          company: prospect.company,
          title: prospect.title,
          persona: prospect.persona,
          source: 'linkedin_dm',
          stage: 'dm_sent',
          anchorCaseSlug: prospect.biasHook?.case ?? null,
          notes: prospect.opener,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null); // canonical body-parse exception
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      setSavedIndices(prev => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    } catch (e) {
      setErrorIndex(index);
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSavingIndex(null);
    }
  };

  const summary = useMemo(() => summarizeResearch(researched), [researched]);

  // Suggest a status framing based on the event countdown so the
  // founder sees "you're at T-13d → focus on second-wave DMs + booking
  // coffees" without re-deriving it from the prep-arc table.
  const phaseHint = useMemo(() => {
    if (eventCountdown == null) return null;
    if (eventCountdown <= 0)
      return 'Event is today / has started — run the event; live-audit memos at every coffee.';
    if (eventCountdown <= 7)
      return 'T-1w: pre-book 5+ coffees. Send calendar pins with the audit promise.';
    if (eventCountdown <= 14)
      return 'T-2w: convert replies to discovery calls. Send second wave of DMs.';
    if (eventCountdown <= 21) return 'T-3w: send first wave of 10 DMs to top-priority names.';
    if (eventCountdown <= 35) return 'T-5w: match each name to a 143-case bias hook (this tool).';
    return 'Pull the published attendee list. Filter to the 4 wedge personas. Target 20-30 names.';
  }, [eventCountdown]);

  return (
    <ErrorBoundary sectionName="Target Research Workbench">
      <AccentCard
        accent="primary"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Users size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Target Research Workbench
            </span>
            {event && !hasEventEnded(event) && (
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                {event.name} ·{' '}
                {eventCountdown != null && eventCountdown > 0
                  ? `T-${eventCountdown}d`
                  : 'happening now'}
              </span>
            )}
          </div>
        }
      >
        <div style={{ padding: '12px 0 4px' }}>
          {phaseHint && (
            <div
              style={{
                marginBottom: 14,
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                borderLeft: '3px solid var(--accent-primary)',
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {phaseHint}
            </div>
          )}

          <p
            style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 0, lineHeight: 1.55 }}
          >
            Paste an attendee shortlist (LinkedIn export, conference list, warm-intro names).
            Classifies each by wedge persona, picks a canonical case from the 143-case library,
            drafts the opener. Edit per-prospect, then save to the ledger.
          </p>

          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder={
              'Name, Title, Company\nor\nName | Title | Company\nor\nName - Title at Company'
            }
            rows={6}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              fontFamily: 'var(--font-mono, monospace)',
              lineHeight: 1.55,
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              resize: 'vertical',
              marginBottom: 10,
            }}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            <button
              type="button"
              onClick={handleResearch}
              disabled={raw.trim().length === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background:
                  raw.trim().length === 0 ? 'var(--bg-secondary)' : 'var(--accent-primary)',
                color: raw.trim().length === 0 ? 'var(--text-muted)' : '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 600,
                cursor: raw.trim().length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={13} />
              Research {researched.length > 0 ? 'again' : 'attendees'}
            </button>
            <button
              type="button"
              onClick={handleLoadExample}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Load example
            </button>
            {(raw.length > 0 || researched.length > 0) && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid transparent',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {researched.length > 0 && (
            <>
              {/* Summary strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {(
                  [
                    'fractional_cso',
                    'midmarket_corp_dev',
                    'smaller_fund_gp',
                    'pe_backed_founder',
                  ] as const
                ).map(pid => (
                  <div
                    key={pid}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderTop: `3px solid ${PERSONA_ACCENT[pid]}`,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {PERSONA_LABEL_SHORT[pid]}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {summary.byPersona[pid]}
                    </div>
                  </div>
                ))}
                {summary.byPersona.other > 0 && (
                  <div
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderTop: `3px solid ${PERSONA_ACCENT.other}`,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Manual review
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--warning)' }}>
                      {summary.byPersona.other}
                    </div>
                  </div>
                )}
              </div>

              {/* Per-prospect cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {researched.map((p, idx) => {
                  const saved = savedIndices.has(idx);
                  const errored = errorIndex === idx;
                  const isOther = p.persona === 'other';
                  return (
                    <div
                      key={`${p.name}-${idx}`}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderLeft: `3px solid ${PERSONA_ACCENT[p.persona]}`,
                        borderRadius: 'var(--radius-sm)',
                        opacity: isOther ? 0.85 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 12,
                          flexWrap: 'wrap',
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              marginTop: 2,
                            }}
                          >
                            {[p.title, p.company].filter(Boolean).join(' · ') ||
                              'No role / company'}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '3px 10px',
                            background: 'var(--bg-secondary)',
                            color: PERSONA_ACCENT[p.persona],
                            border: `1px solid ${PERSONA_ACCENT[p.persona]}33`,
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {PERSONA_LABEL_SHORT[p.persona]}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          fontStyle: 'italic',
                          marginBottom: 10,
                          lineHeight: 1.5,
                        }}
                      >
                        {p.personaReason}
                      </div>

                      {p.biasHook && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-secondary)',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 10,
                            lineHeight: 1.55,
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>{p.biasHook.bias}</span>
                          {' · '}
                          <span>{p.biasHook.case}</span>
                          <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                            {p.biasHook.whatItDid}
                          </div>
                        </div>
                      )}

                      {!isOther && p.opener && (
                        <>
                          <textarea
                            value={p.opener}
                            onChange={e => handleOpenerEdit(idx, e.target.value)}
                            rows={6}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 12.5,
                              lineHeight: 1.6,
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              resize: 'vertical',
                              marginBottom: 8,
                              fontFamily: 'inherit',
                            }}
                          />

                          {p.pendingSubstitutions.length > 0 && (
                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--warning)',
                                marginBottom: 10,
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                              }}
                            >
                              <AlertTriangle size={11} />
                              <span style={{ fontWeight: 600 }}>Still to edit:</span>
                              {p.pendingSubstitutions.map(token => (
                                <span
                                  key={token}
                                  style={{
                                    padding: '2px 8px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 999,
                                    fontSize: 10.5,
                                    fontFamily: 'var(--font-mono, monospace)',
                                  }}
                                >
                                  {`{${token}}`}
                                </span>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.opener ?? '')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <ClipboardCopy size={12} />
                              Copy opener
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveToLedger(idx)}
                              disabled={saved || savingIndex === idx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px',
                                background: saved
                                  ? 'var(--success-soft, color-mix(in srgb, var(--success) 12%, transparent))'
                                  : 'var(--accent-primary)',
                                color: saved ? 'var(--success)' : '#FFFFFF',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: saved ? 'default' : 'pointer',
                                opacity: savingIndex === idx ? 0.6 : 1,
                              }}
                            >
                              {saved ? (
                                <>
                                  <CheckCircle2 size={12} />
                                  In ledger
                                </>
                              ) : (
                                <>
                                  <Send size={12} />
                                  {savingIndex === idx ? 'Saving…' : 'Save to ledger'}
                                </>
                              )}
                            </button>
                            {errored && errorMsg && (
                              <span style={{ fontSize: 11, color: 'var(--error)' }}>
                                {errorMsg}
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {isOther && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-secondary)',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            lineHeight: 1.55,
                          }}
                        >
                          Not in the 4 Phase-1 wedge personas. Either skip, or re-tag manually if
                          you know them personally (the conversion ledger accepts
                          &lsquo;other&rsquo; but their data won&rsquo;t feed the Vohra HXC cohort).
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Foot — anchor link to the wedge personas SSOT for
                  founder recall on persona definitions. */}
              <div
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Persona definitions:{' '}
                {WEDGE_PERSONAS.map((p, i) => (
                  <span key={p.id}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {p.label}
                    </span>
                    {i < WEDGE_PERSONAS.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </AccentCard>
    </ErrorBoundary>
  );
}
