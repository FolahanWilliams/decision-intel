'use client';

/**
 * MeetingPrepCard — dynamic meeting-preparation generator inside
 * Outreach Strategy.
 *
 * The founder pastes the prospect's LinkedIn info (profile summary, role,
 * recent posts — whatever he already has), the meeting context, and what
 * a win looks like. The /api/founder-hub/meeting-prep route streams back
 * a custom plan structured around ethos / pathos / logos + Cialdini
 * influence levers, grounded in Decision Intel's real assets and the
 * founder's specific position.
 *
 * Persistence (2026-04-23 extension): when the stream completes the
 * plan is POST'd to /api/founder-hub/meetings so it shows up in the
 * Meetings Log tab. The founder can log notes / learnings / outcome
 * there post-call, and the Founder AI chat context pulls from the same
 * table — so "where he is right now" stays visible to the mentor.
 */

import { useState, useRef, useCallback } from 'react';
import {
  Loader2,
  Sparkles,
  Copy,
  Check,
  Printer,
  RotateCcw,
  User,
  FileText,
  Target,
  BookmarkCheck,
  ArrowUpRight,
} from 'lucide-react';
import { FOUNDER_HUB_NAVIGATE_EVENT } from '@/lib/founder-hub/chat-nav';

const MEETING_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'cso_discovery', label: 'CSO / corp strategy discovery call' },
  { value: 'vc_fundraise_first', label: 'VC pre-seed first call' },
  { value: 'vc_pitch', label: 'VC pitch (partner meeting)' },
  { value: 'advisor_intro', label: 'Advisor / warm-intro coffee' },
  { value: 'design_partner_review', label: 'Design partner review / renewal' },
  { value: 'reference_call', label: 'Reference call (customer ref)' },
  { value: 'content_collab', label: 'Content / podcast / panel collab' },
  { value: 'other', label: 'Other — high-stakes meeting' },
];

interface Props {
  founderPass: string;
}

export function MeetingPrepCard({ founderPass }: Props) {
  const [meetingType, setMeetingType] = useState<string>('cso_discovery');
  const [prospectName, setProspectName] = useState('');
  const [prospectRole, setProspectRole] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [linkedInInfo, setLinkedInInfo] = useState('');
  const [meetingContext, setMeetingContext] = useState('');
  const [founderAsk, setFounderAsk] = useState('');

  const [plan, setPlan] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Persistence state — set once the plan finishes streaming and we've
  // POST'd it to /api/founder-hub/meetings. `saveError` stays mounted
  // alongside the plan so the founder still has the prose if the save
  // blips.
  const [savedMeetingId, setSavedMeetingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const canSubmit =
    linkedInInfo.trim().length >= 40 &&
    meetingContext.trim().length >= 20 &&
    founderAsk.trim().length >= 15 &&
    !streaming;

  const generate = useCallback(async () => {
    if (!canSubmit) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStreaming(true);
    setError(null);
    setSavedMeetingId(null);
    setSaveError(null);
    setPlan('');
    // Declared outside the try block so the post-finally persistence
    // block can see the final plan text.
    let accumulated = '';
    try {
      const res = await fetch('/api/founder-hub/meeting-prep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-pass': founderPass,
        },
        body: JSON.stringify({
          meetingType,
          prospectName,
          prospectRole,
          prospectCompany,
          linkedInInfo,
          meetingContext,
          founderAsk,
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? 'Generation failed. Check the inputs and retry.');
        setStreaming(false);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        setError('Streaming not available. Retry.');
        setStreaming(false);
        return;
      }
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6)) as
                | { type: 'chunk'; text: string }
                | { type: 'done' }
                | { type: 'error'; message?: string };
              if (data.type === 'chunk') {
                accumulated += data.text;
                setPlan(accumulated);
                // Auto-scroll output as tokens arrive.
                requestAnimationFrame(() => {
                  if (outputRef.current) {
                    outputRef.current.scrollTop = outputRef.current.scrollHeight;
                  }
                });
              } else if (data.type === 'error') {
                setError(data.message ?? 'Generation failed.');
              }
            } catch {
              /* malformed SSE line — keep reading */
            }
          }
        }
      } finally {
        reader.cancel();
      }
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (!isAbort) setError('Network error. Retry.');
    } finally {
      setStreaming(false);
    }

    // Persist once we have a full plan. Runs outside the SSE try/catch
    // so a persistence blip doesn't wipe the prose the founder can still
    // copy from the screen. 100-char floor matches the POST route's
    // minimum — if the stream got cut short, we skip saving rather than
    // seed the log with half-plans.
    const finalPlan = accumulated.trim();
    if (!ac.signal.aborted && finalPlan.length >= 100) {
      try {
        const saveRes = await fetch('/api/founder-hub/meetings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-founder-pass': founderPass,
          },
          body: JSON.stringify({
            meetingType,
            prospectName,
            prospectRole,
            prospectCompany,
            linkedInInfo: linkedInInfo.trim(),
            meetingContext: meetingContext.trim(),
            founderAsk: founderAsk.trim(),
            prepPlan: finalPlan,
            status: 'prep',
          }),
        });
        const json = (await saveRes.json().catch(() => null)) as {
          data?: { meeting?: { id?: string } };
          error?: string;
        } | null;
        if (!saveRes.ok) {
          setSaveError(json?.error ?? 'Plan generated, but the save to Meetings Log failed.');
        } else if (json?.data?.meeting?.id) {
          setSavedMeetingId(json.data.meeting.id);
        }
      } catch {
        setSaveError('Plan generated, but the save to Meetings Log failed (network).');
      }
    }
  }, [
    canSubmit,
    founderPass,
    meetingType,
    prospectName,
    prospectRole,
    prospectCompany,
    linkedInInfo,
    meetingContext,
    founderAsk,
  ]);

  const handleCopy = useCallback(async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(plan);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  }, [plan]);

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.print();
  }, []);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setPlan('');
    setError(null);
    setStreaming(false);
  }, []);

  return (
    <div className="meeting-prep-card">
      <div style={{ display: 'grid', gap: 12 }}>
        {/* Row 1 — meeting type + prospect header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          <FieldLabel icon={<Target size={12} />} label="Meeting type">
            <select
              value={meetingType}
              onChange={e => setMeetingType(e.target.value)}
              style={inputStyle}
            >
              {MEETING_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel icon={<User size={12} />} label="Prospect name (optional)">
            <input
              type="text"
              value={prospectName}
              onChange={e => setProspectName(e.target.value)}
              placeholder="e.g. Sarah Chen"
              maxLength={120}
              style={inputStyle}
            />
          </FieldLabel>
          <FieldLabel label="Role (optional)">
            <input
              type="text"
              value={prospectRole}
              onChange={e => setProspectRole(e.target.value)}
              placeholder="Chief Strategy Officer"
              maxLength={120}
              style={inputStyle}
            />
          </FieldLabel>
          <FieldLabel label="Company (optional)">
            <input
              type="text"
              value={prospectCompany}
              onChange={e => setProspectCompany(e.target.value)}
              placeholder="Acme Corp"
              maxLength={120}
              style={inputStyle}
            />
          </FieldLabel>
        </div>

        {/* Row 2 — LinkedIn info */}
        <FieldLabel
          icon={<FileText size={12} />}
          label="LinkedIn info / background"
          hint="Paste the profile summary, headline, recent posts, role history — whatever you already have. Sparse input = softer plan."
        >
          <textarea
            value={linkedInInfo}
            onChange={e => setLinkedInInfo(e.target.value)}
            rows={5}
            maxLength={8000}
            placeholder={
              'Paste the LinkedIn profile text, recent posts, or notes you have on this person. The richer the input, the sharper the plan.'
            }
            style={{ ...inputStyle, minHeight: 120, fontFamily: 'inherit' }}
          />
          <FieldFooter>
            {linkedInInfo.trim().length < 40
              ? `${40 - linkedInInfo.trim().length} more characters before we can generate`
              : `${linkedInInfo.length.toLocaleString()} / 8,000`}
          </FieldFooter>
        </FieldLabel>

        {/* Row 3 — context + ask, side by side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 10,
          }}
        >
          <FieldLabel
            label="Meeting context"
            hint="What is this meeting about, who initiated it, how did it come to be."
          >
            <textarea
              value={meetingContext}
              onChange={e => setMeetingContext(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={
                'e.g. Sarah replied to my cold email after seeing the WeWork case study on LinkedIn. She wants to understand how DI would audit an internal memo before a board meeting in 3 weeks.'
              }
              style={{ ...inputStyle, minHeight: 100, fontFamily: 'inherit' }}
            />
          </FieldLabel>
          <FieldLabel
            label="What a win looks like"
            hint="What do YOU want out of this meeting? We'll restate it in her language."
          >
            <textarea
              value={founderAsk}
              onChange={e => setFounderAsk(e.target.value)}
              rows={4}
              maxLength={1200}
              placeholder={
                'e.g. Sarah agrees to run one strategic memo through DI before her next board meeting, with me personally delivering the audit.'
              }
              style={{ ...inputStyle, minHeight: 100, fontFamily: 'inherit' }}
            />
          </FieldLabel>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Grounded in Decision Intel assets + Kahneman / Klein framing + Aristotle ethos / pathos
            / logos + Cialdini influence principles.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {plan && !streaming && (
              <button type="button" onClick={handleClear} style={secondaryBtn}>
                <RotateCcw size={13} /> New prep
              </button>
            )}
            <button
              type="button"
              onClick={generate}
              disabled={!canSubmit}
              style={{
                ...primaryBtn,
                opacity: !canSubmit ? 0.5 : 1,
                cursor: !canSubmit ? 'not-allowed' : 'pointer',
              }}
            >
              {streaming ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles size={13} /> Generate meeting plan
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '8px 12px',
              fontSize: 12,
              color: 'var(--error)',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        {/* Output */}
        {(plan || streaming) && (
          <div
            style={{
              marginTop: 6,
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              background: 'var(--bg-card)',
              overflow: 'hidden',
            }}
            className="meeting-prep-output-wrap"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
              }}
              className="no-print"
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-primary)',
                }}
              >
                Meeting plan · custom
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={handleCopy} disabled={!plan} style={chipBtn}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" onClick={handlePrint} disabled={!plan} style={chipBtn}>
                  <Printer size={12} />
                  Print
                </button>
              </div>
            </div>
            <div
              ref={outputRef}
              className="meeting-prep-output"
              style={{
                padding: '16px 18px',
                fontSize: 13.5,
                lineHeight: 1.65,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                maxHeight: 560,
                overflowY: 'auto',
                fontFamily: 'var(--font-sans, system-ui)',
              }}
            >
              {plan || (streaming ? 'Generating…' : '')}
            </div>

            {/* Save-to-log chip — appears once the plan has been
                persisted to /api/founder-hub/meetings. Clicking jumps
                to the Meetings Log tab via the founder-hub-navigate
                event; the tab loads the detail view keyed on id. */}
            {!streaming && (savedMeetingId || saveError) && (
              <div
                className="no-print"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 14px',
                  borderTop: '1px solid var(--border-color)',
                  background: saveError ? 'rgba(220,38,38,0.04)' : 'rgba(22,163,74,0.04)',
                  flexWrap: 'wrap',
                }}
              >
                {savedMeetingId ? (
                  <>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                      }}
                    >
                      <BookmarkCheck size={13} />
                      Saved to Meetings Log · add notes after the call
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window === 'undefined') return;
                        window.dispatchEvent(
                          new CustomEvent(FOUNDER_HUB_NAVIGATE_EVENT, {
                            detail: {
                              tabId: 'meetings_log',
                              anchor: savedMeetingId,
                            },
                          })
                        );
                      }}
                      style={{
                        ...chipBtn,
                        background: 'var(--accent-primary)',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      Open in Meetings Log <ArrowUpRight size={11} />
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: 'var(--error)',
                    }}
                  >
                    {saveError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @media print {
          .meeting-prep-card .no-print {
            display: none !important;
          }
          .meeting-prep-card .meeting-prep-output {
            max-height: none !important;
            overflow: visible !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
            color: #000 !important;
          }
          .meeting-prep-card .meeting-prep-output-wrap {
            border: none !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Small helpers ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  outline: 'none',
  resize: 'vertical',
};

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '9px 16px',
  fontSize: 13,
  fontWeight: 700,
  borderRadius: 999,
  border: 'none',
  background: 'var(--accent-primary)',
  color: '#fff',
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 999,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

const chipBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 999,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

function FieldLabel({
  icon,
  label,
  hint,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 5,
        }}
      >
        {icon}
        {label}
      </span>
      {children}
      {hint && (
        <span
          style={{
            display: 'block',
            fontSize: 10.5,
            color: 'var(--text-muted)',
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {hint}
        </span>
      )}
    </label>
  );
}

function FieldFooter({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'block', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
      {children}
    </span>
  );
}
