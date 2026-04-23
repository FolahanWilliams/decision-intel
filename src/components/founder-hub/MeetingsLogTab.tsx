'use client';

/**
 * MeetingsLogTab — persistent record of every prep'd meeting, with
 * editable post-call notes / learnings / outcome.
 *
 * Replaces the "notes scattered across Google Docs, Slack, Drive" split
 * the founder flagged: every meeting the MeetingPrepCard generates now
 * lands here, and every post-call learning lives alongside the original
 * prep plan + prospect info. The Founder AI chat reads from the same
 * table so the mentor knows "where he is right now."
 *
 * Layout:
 *   - Left: filter chips + chronological list of meetings
 *   - Right (or below on narrow viewports): selected meeting detail
 *     with Plan (read-only) + Notes / Learnings / Next steps (editable)
 *     + Outcome picker + Status + Delete
 *
 * Listens for the founder-hub-navigate event — if a MeetingPrepCard
 * chip dispatched `{ tabId: 'meetings_log', anchor: id }`, we auto-
 * select that meeting on mount.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  CalendarClock,
  User,
  Briefcase,
  Pencil,
  Save,
  AlertCircle,
  XCircle,
  TrendingUp,
  Presentation,
  ArrowLeft,
} from 'lucide-react';
import {
  FOUNDER_HUB_NAVIGATE_EVENT,
  type FounderHubNavigateDetail,
} from '@/lib/founder-hub/chat-nav';
import { card, sectionTitle } from './shared-styles';

interface Meeting {
  id: string;
  meetingType: string;
  prospectName: string | null;
  prospectRole: string | null;
  prospectCompany: string | null;
  /** Null for manual-log meetings (no prep plan generated). */
  linkedInInfo: string | null;
  meetingContext: string | null;
  founderAsk: string | null;
  prepPlan: string | null;
  scheduledAt: string | null;
  happenedAt: string | null;
  /** "What happened" — raw recap of the meeting. */
  notes: string | null;
  /** "Outcomes" — decisions, commitments, takeaways. Repurposed from the
   *  previous 'learnings' label. Same column, new semantics. */
  learnings: string | null;
  /** "The future" — follow-ups + next steps. */
  nextSteps: string | null;
  outcome: string | null;
  status: 'prep' | 'ready' | 'completed' | 'cancelled';
  /** 'prep' = generated via MeetingPrepCard. 'log' = manually logged. */
  source: 'prep' | 'log';
  createdAt: string;
  updatedAt: string;
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  cso_discovery: 'CSO discovery',
  vc_fundraise_first: 'VC first call',
  vc_pitch: 'VC partner pitch',
  advisor_intro: 'Advisor intro',
  design_partner_review: 'DP review',
  reference_call: 'Reference call',
  content_collab: 'Content collab',
  other: 'Other',
};

const STATUS_LABELS: Record<Meeting['status'], string> = {
  prep: 'Prep',
  ready: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<Meeting['status'], string> = {
  prep: '#F59E0B',
  ready: '#3B82F6',
  completed: '#16A34A',
  cancelled: '#64748B',
};

const OUTCOME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: '— not yet —' },
  { value: 'progressed', label: 'Progressed — next step agreed' },
  { value: 'stalled', label: 'Stalled — needs follow-up' },
  { value: 'closed_won', label: 'Closed won' },
  { value: 'closed_lost', label: 'Closed lost' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'no_show', label: 'No-show' },
  { value: 'other', label: 'Other' },
];

type FilterKey = 'all' | 'prep' | 'ready' | 'completed' | 'cancelled';

/** Payload for POST /api/founder-hub/meetings with mode='log'. */
interface LogFormInput {
  meetingType: string;
  prospectName: string;
  prospectRole: string;
  prospectCompany: string;
  happenedAt: string | null;
  notes: string;
  learnings: string;
  nextSteps: string;
  outcome: string;
}

/** Three-tab content inside MeetingDetail — user-facing labels. The
 *  underlying DB columns stay as notes/learnings/nextSteps for backward
 *  compatibility; this just remaps the semantics of each column in the
 *  UI + the Founder AI chat. */
type DetailTabKey = 'what_happened' | 'outcomes' | 'future';
const DETAIL_TABS: Array<{ key: DetailTabKey; label: string }> = [
  { key: 'what_happened', label: 'What happened' },
  { key: 'outcomes', label: 'Outcomes' },
  { key: 'future', label: 'The future' },
];

interface Props {
  founderPass: string;
}

export function MeetingsLogTab({ founderPass }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  /** Whether the "Log a past meeting" inline form is open. */
  const [logFormOpen, setLogFormOpen] = useState(false);

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', 'x-founder-pass': founderPass }),
    [founderPass]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder-hub/meetings', { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load meetings');
      setMeetings(json.data?.meetings ?? []);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (founderPass) load();
  }, [founderPass, load]);

  // Auto-select when the MeetingPrepCard dispatches
  // founder-hub-navigate with { tabId: 'meetings_log', anchor: id }
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<FounderHubNavigateDetail>).detail;
      if (detail?.tabId === 'meetings_log' && detail.anchor) {
        setSelectedId(detail.anchor);
        setMobileDetailOpen(true);
      }
    };
    window.addEventListener(FOUNDER_HUB_NAVIGATE_EVENT, handler);
    return () => window.removeEventListener(FOUNDER_HUB_NAVIGATE_EVENT, handler);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return meetings;
    return meetings.filter(m => m.status === filter);
  }, [meetings, filter]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: meetings.length,
      prep: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const m of meetings) c[m.status]++;
    return c;
  }, [meetings]);

  const selected = useMemo(
    () => meetings.find(m => m.id === selectedId) ?? null,
    [meetings, selectedId]
  );

  const handlePatch = useCallback(
    async (id: string, patch: Partial<Meeting>) => {
      const prev = meetings;
      setMeetings(cur => cur.map(m => (m.id === id ? ({ ...m, ...patch } as Meeting) : m)));
      try {
        const res = await fetch(`/api/founder-hub/meetings/${id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (!res.ok) {
          setMeetings(prev);
          return { ok: false, error: json.error || 'Update failed' };
        }
        if (json.data?.meeting) {
          setMeetings(cur => cur.map(m => (m.id === id ? (json.data.meeting as Meeting) : m)));
        }
        return { ok: true as const };
      } catch {
        setMeetings(prev);
        return { ok: false, error: 'Network error' };
      }
    },
    [meetings, authHeaders]
  );

  /** Create a new manual-log meeting via POST /api/founder-hub/meetings
   *  with mode='log'. Returns the created row on success so the parent
   *  can select it. */
  const handleCreateLog = useCallback(
    async (
      input: LogFormInput
    ): Promise<{ ok: true; meeting: Meeting } | { ok: false; error: string }> => {
      try {
        const res = await fetch('/api/founder-hub/meetings', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ mode: 'log', ...input }),
        });
        const json = await res.json();
        if (!res.ok) return { ok: false, error: json.error || 'Failed to log meeting' };
        const meeting = json.data?.meeting as Meeting;
        setMeetings(cur => [meeting, ...cur]);
        return { ok: true, meeting };
      } catch {
        return { ok: false, error: 'Network error' };
      }
    },
    [authHeaders]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Delete this meeting record? This cannot be undone.')) return;
      const prev = meetings;
      setMeetings(cur => cur.filter(m => m.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setMobileDetailOpen(false);
      }
      try {
        const res = await fetch(`/api/founder-hub/meetings/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!res.ok) setMeetings(prev);
      } catch {
        setMeetings(prev);
      }
    },
    [meetings, selectedId, authHeaders]
  );

  return (
    <div>
      <div style={{ ...card }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 4,
          }}
        >
          <div style={sectionTitle}>
            <Presentation size={18} style={{ color: 'var(--accent-primary)', marginRight: 8 }} />
            Meetings Log
          </div>
          <button
            type="button"
            onClick={() => setLogFormOpen(v => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 999,
              border: '1px solid var(--accent-primary)',
              background: logFormOpen ? 'transparent' : 'var(--accent-primary)',
              color: logFormOpen ? 'var(--accent-primary)' : 'var(--text-on-accent, #fff)',
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            {logFormOpen ? 'Close form' : 'Log a past meeting'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px' }}>
          Every meeting you have prepped or logged, in one place instead of scattered across Docs,
          Slack, and Drive. The Founder AI chat pulls from this log so the mentor knows where you
          are right now.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 0' }}>
          Generate a prep plan on Outreach Strategy for an upcoming meeting, or use &ldquo;Log a
          past meeting&rdquo; above to capture one that already happened.
        </p>
      </div>

      {logFormOpen && (
        <LogMeetingForm
          onCreate={handleCreateLog}
          onCancel={() => setLogFormOpen(false)}
          onCreated={m => {
            setSelectedId(m.id);
            setMobileDetailOpen(true);
            setLogFormOpen(false);
          }}
        />
      )}

      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 12,
        }}
      >
        {(['all', 'prep', 'ready', 'completed', 'cancelled'] as FilterKey[]).map(f => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 999,
                border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: active ? 'rgba(22,163,74,0.10)' : 'var(--bg-card)',
                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f as Meeting['status']]}
              <span style={{ opacity: 0.7 }}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {fetchError && (
        <div
          role="alert"
          style={{
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 12,
            color: 'var(--error)',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.22)',
            borderRadius: 8,
          }}
        >
          {fetchError}
        </div>
      )}

      {/* Two-column layout — list left, detail right. Stacks on narrow
          viewports via the CSS grid with `minmax(320px, 1fr)`. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selected ? 'minmax(280px, 340px) 1fr' : '1fr',
          gap: 16,
          alignItems: 'start',
        }}
        className="meetings-log-grid"
      >
        <div
          className="meetings-log-list"
          style={{
            ...card,
            padding: 0,
            overflow: 'hidden',
            display: mobileDetailOpen && selected ? 'none' : 'block',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              {meetings.length === 0 ? (
                <>
                  <Plus size={18} style={{ color: 'var(--accent-primary)', marginBottom: 6 }} />
                  <div>No meetings yet. Generate a prep plan on the Outreach Strategy tab.</div>
                </>
              ) : (
                'No meetings match this filter.'
              )}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filtered.map(m => (
                <MeetingListItem
                  key={m.id}
                  meeting={m}
                  active={m.id === selectedId}
                  onSelect={() => {
                    setSelectedId(m.id);
                    setMobileDetailOpen(true);
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div
            className="meetings-log-detail"
            style={{
              ...card,
              display: mobileDetailOpen ? 'block' : undefined,
            }}
          >
            {/* key={selected.id} forces the detail component to unmount
                + remount when the founder clicks a different meeting.
                Lazy useState initialisers inside MeetingDetail then
                rehydrate from props without needing an effect — avoids
                the react-hooks/set-state-in-effect lint error. */}
            <MeetingDetail
              key={selected.id}
              meeting={selected}
              onBack={() => {
                setMobileDetailOpen(false);
              }}
              onPatch={patch => handlePatch(selected.id, patch)}
              onDelete={() => handleDelete(selected.id)}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 880px) {
          .meetings-log-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── List item ─────────────────────────────────────────────────────────

function MeetingListItem({
  meeting,
  active,
  onSelect,
}: {
  meeting: Meeting;
  active: boolean;
  onSelect: () => void;
}) {
  const date = meeting.happenedAt ?? meeting.scheduledAt ?? meeting.createdAt;
  const when = new Date(date);
  const whenLabel = `${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  const header =
    meeting.prospectName ||
    [meeting.prospectRole, meeting.prospectCompany].filter(Boolean).join(' · ') ||
    MEETING_TYPE_LABELS[meeting.meetingType] ||
    'Meeting';
  const sub =
    [meeting.prospectRole, meeting.prospectCompany].filter(Boolean).join(' · ') ||
    meeting.meetingContext.slice(0, 60).trim() + (meeting.meetingContext.length > 60 ? '…' : '');

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '12px 14px',
          background: active ? 'rgba(22,163,74,0.08)' : 'transparent',
          borderBottom: '1px solid var(--border-color)',
          borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          cursor: 'pointer',
        }}
      >
        <StatusDot status={meeting.status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 6,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {header}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {whenLabel}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {MEETING_TYPE_LABELS[meeting.meetingType] || meeting.meetingType} · {sub}
          </div>
        </div>
      </button>
    </li>
  );
}

function StatusDot({ status }: { status: Meeting['status'] }) {
  return (
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        marginTop: 6,
        background: STATUS_COLORS[status],
        flexShrink: 0,
      }}
    />
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────

function MeetingDetail({
  meeting,
  onBack,
  onPatch,
  onDelete,
}: {
  meeting: Meeting;
  onBack: () => void;
  onPatch: (patch: Partial<Meeting>) => Promise<{ ok: boolean; error?: string }>;
  onDelete: () => void;
}) {
  // Lazy initialisers hydrate from the meeting prop on mount. Parent
  // passes key={meeting.id} so swapping meetings remounts the component
  // and these initialisers re-run — no useEffect setState cascade.
  const [notes, setNotes] = useState<string>(() => meeting.notes ?? '');
  const [learnings, setLearnings] = useState<string>(() => meeting.learnings ?? '');
  const [nextSteps, setNextSteps] = useState<string>(() => meeting.nextSteps ?? '');
  const [detailTab, setDetailTab] = useState<DetailTabKey>('what_happened');
  const [scheduledAt, setScheduledAt] = useState<string>(() => toLocalInput(meeting.scheduledAt));
  const [happenedAt, setHappenedAt] = useState<string>(() => toLocalInput(meeting.happenedAt));
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    (patch: Partial<Meeting>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveState('saving');
      debounceRef.current = setTimeout(async () => {
        const res = await onPatch(patch);
        if (res.ok) {
          setSaveState('saved');
          setSaveError(null);
          setTimeout(() => setSaveState('idle'), 1500);
        } else {
          setSaveState('error');
          setSaveError(res.error ?? 'Save failed');
        }
      }, 600);
    },
    [onPatch]
  );

  // Cancel pending debounce on unmount / meeting change.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleStatusChange = async (next: Meeting['status']) => {
    setSaveState('saving');
    const res = await onPatch({ status: next });
    setSaveState(res.ok ? 'saved' : 'error');
    if (!res.ok) setSaveError(res.error ?? 'Save failed');
    setTimeout(() => setSaveState('idle'), 1500);
  };

  const handleOutcomeChange = async (next: string) => {
    setSaveState('saving');
    const res = await onPatch({ outcome: next || null });
    setSaveState(res.ok ? 'saved' : 'error');
    if (!res.ok) setSaveError(res.error ?? 'Save failed');
    setTimeout(() => setSaveState('idle'), 1500);
  };

  const header =
    meeting.prospectName ||
    [meeting.prospectRole, meeting.prospectCompany].filter(Boolean).join(' · ') ||
    MEETING_TYPE_LABELS[meeting.meetingType] ||
    'Meeting';

  return (
    <div>
      {/* Mobile back + header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="meetings-log-back"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={12} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {MEETING_TYPE_LABELS[meeting.meetingType] || meeting.meetingType}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {header}
          </div>
        </div>
        <SaveIndicator state={saveState} error={saveError} />
      </div>

      {/* Status + outcome row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <FieldLabel icon={<CheckCircle2 size={11} />} label="Status">
          <select
            value={meeting.status}
            onChange={e => handleStatusChange(e.target.value as Meeting['status'])}
            style={inputStyle}
          >
            {(['prep', 'ready', 'completed', 'cancelled'] as const).map(s => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel icon={<TrendingUp size={11} />} label="Outcome">
          <select
            value={meeting.outcome ?? ''}
            onChange={e => handleOutcomeChange(e.target.value)}
            style={inputStyle}
          >
            {OUTCOME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FieldLabel>
      </div>

      {/* Date row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <FieldLabel icon={<CalendarClock size={11} />} label="Scheduled for">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => {
              setScheduledAt(e.target.value);
              scheduleSave({ scheduledAt: fromLocalInput(e.target.value) });
            }}
            style={inputStyle}
          />
        </FieldLabel>
        <FieldLabel icon={<Clock size={11} />} label="Happened at">
          <input
            type="datetime-local"
            value={happenedAt}
            onChange={e => {
              setHappenedAt(e.target.value);
              scheduleSave({ happenedAt: fromLocalInput(e.target.value) });
            }}
            style={inputStyle}
          />
        </FieldLabel>
      </div>

      {/* Prep-specific blocks — hidden on manual-log rows since those
          have no linkedInInfo / meetingContext / founderAsk / prepPlan
          by design. */}
      {meeting.source === 'prep' && (
        <>
          {/* Context (read-only) */}
          {(meeting.linkedInInfo || meeting.meetingContext || meeting.founderAsk) && (
            <CollapsibleReadOnly label="The inputs you prep'd with" icon={<User size={11} />}>
              {meeting.linkedInInfo && (
                <ReadOnlyField label="LinkedIn info" value={meeting.linkedInInfo} />
              )}
              {meeting.meetingContext && (
                <ReadOnlyField label="Meeting context" value={meeting.meetingContext} />
              )}
              {meeting.founderAsk && (
                <ReadOnlyField label="What a win looks like" value={meeting.founderAsk} />
              )}
            </CollapsibleReadOnly>
          )}

          {/* Prep plan (collapsible) */}
          {meeting.prepPlan && (
            <div style={{ marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setPlanOpen(v => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <Briefcase size={11} />
                {planOpen ? 'Hide prep plan' : 'Show prep plan'}
              </button>
              {planOpen && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '14px 16px',
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 420,
                    overflowY: 'auto',
                  }}
                >
                  {meeting.prepPlan}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {meeting.source === 'log' && (
        <div
          style={{
            padding: '10px 12px',
            marginBottom: 14,
            fontSize: 11.5,
            color: 'var(--text-muted)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            fontStyle: 'italic',
          }}
        >
          Logged manually (no prep plan generated). The three tabs below capture what happened, the
          outcomes, and the future — the Founder AI chat reads from all three as context.
        </div>
      )}

      {/* Three-tab post-meeting content. Column names stay as
          notes/learnings/nextSteps in the DB for backward compatibility;
          the user-facing labels are "What happened / Outcomes / The
          future." The Founder AI chat reads from the same columns via
          recent-meetings-context.ts. */}
      <DetailTabs
        active={detailTab}
        onChange={setDetailTab}
        whatHappened={notes}
        outcomes={learnings}
        future={nextSteps}
        onWhatHappenedChange={v => {
          setNotes(v);
          scheduleSave({ notes: v });
        }}
        onOutcomesChange={v => {
          setLearnings(v);
          scheduleSave({ learnings: v });
        }}
        onFutureChange={v => {
          setNextSteps(v);
          scheduleSave({ nextSteps: v });
        }}
      />

      {/* Delete */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 14,
          paddingTop: 14,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <button
          type="button"
          onClick={onDelete}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 8,
            border: '1px solid rgba(220,38,38,0.25)',
            background: 'rgba(220,38,38,0.06)',
            color: 'var(--error)',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={11} />
          Delete record
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 880px) {
          .meetings-log-back {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────

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

function FieldLabel({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
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
    </label>
  );
}

function CollapsibleReadOnly({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          borderRadius: 8,
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        {icon}
        {open ? `Hide ${label}` : `Show ${label}`}
      </button>
      {open && <div style={{ marginTop: 8 }}>{children}</div>}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '8px 10px',
          whiteSpace: 'pre-wrap',
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SaveIndicator({
  state,
  error,
}: {
  state: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
}) {
  if (state === 'idle') return null;
  const Icon = state === 'saving' ? Loader2 : state === 'saved' ? CheckCircle2 : XCircle;
  const color =
    state === 'saved'
      ? 'var(--accent-primary)'
      : state === 'error'
        ? 'var(--error)'
        : 'var(--text-muted)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color,
      }}
      title={state === 'error' ? (error ?? 'Save failed') : undefined}
    >
      <Icon size={12} className={state === 'saving' ? 'animate-spin' : undefined} />
      {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : 'Save failed'}
    </span>
  );
}

// ─── Date helpers ──────────────────────────────────────────────────────

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ─── DetailTabs — three-tab post-meeting content ───────────────────────

function DetailTabs({
  active,
  onChange,
  whatHappened,
  outcomes,
  future,
  onWhatHappenedChange,
  onOutcomesChange,
  onFutureChange,
}: {
  active: DetailTabKey;
  onChange: (k: DetailTabKey) => void;
  whatHappened: string;
  outcomes: string;
  future: string;
  onWhatHappenedChange: (v: string) => void;
  onOutcomesChange: (v: string) => void;
  onFutureChange: (v: string) => void;
}) {
  const counts: Record<DetailTabKey, number> = {
    what_happened: whatHappened.length,
    outcomes: outcomes.length,
    future: future.length,
  };

  const placeholders: Record<DetailTabKey, string> = {
    what_happened:
      'Raw recap while it is fresh — who attended, what they said, what you pushed back on, what surprised you, what you noticed about their tone or body language. Factual narrative.',
    outcomes:
      'What came out of the meeting — decisions made, commitments given, positions updated, pricing signals, objections surfaced. The durable substance the Founder AI chat and future you can reference.',
    future:
      'Specific follow-up actions + deadlines. The artifacts to send, the introductions to make, the calendar moves, the next-meeting ask, the Brier-calibrated probability that this progresses.',
  };

  const values: Record<DetailTabKey, string> = {
    what_happened: whatHappened,
    outcomes,
    future,
  };

  const setters: Record<DetailTabKey, (v: string) => void> = {
    what_happened: onWhatHappenedChange,
    outcomes: onOutcomesChange,
    future: onFutureChange,
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 10,
        }}
      >
        {DETAIL_TABS.map(tab => {
          const isActive = tab.key === active;
          const hasContent = counts[tab.key] > 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
                marginBottom: -1,
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
              {hasContent && (
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    opacity: isActive ? 1 : 0.6,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <textarea
        value={values[active]}
        onChange={e => setters[active](e.target.value)}
        rows={8}
        maxLength={10000}
        placeholder={placeholders[active]}
        style={{ ...inputStyle, minHeight: 180, fontFamily: 'inherit' }}
      />
      <div
        style={{
          fontSize: 10.5,
          color: 'var(--text-muted)',
          marginTop: 6,
          fontStyle: 'italic',
        }}
      >
        Saves automatically. The Founder AI chat reads &ldquo;
        {DETAIL_TABS.find(t => t.key === active)?.label}
        &rdquo; as context on every new chat so it knows where you are right now.
      </div>
    </div>
  );
}

// ─── LogMeetingForm — manual-log entry point ───────────────────────────

function LogMeetingForm({
  onCreate,
  onCancel,
  onCreated,
}: {
  onCreate: (
    input: LogFormInput
  ) => Promise<{ ok: true; meeting: Meeting } | { ok: false; error: string }>;
  onCancel: () => void;
  onCreated: (m: Meeting) => void;
}) {
  const [meetingType, setMeetingType] = useState<string>('other');
  const [prospectName, setProspectName] = useState('');
  const [prospectRole, setProspectRole] = useState('');
  const [prospectCompany, setProspectCompany] = useState('');
  const [happenedAt, setHappenedAt] = useState<string>(() =>
    toLocalInput(new Date().toISOString())
  );
  const [whatHappened, setWhatHappened] = useState('');
  const [outcomes, setOutcomes] = useState('');
  const [future, setFuture] = useState('');
  const [outcome, setOutcome] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formTab, setFormTab] = useState<DetailTabKey>('what_happened');
  const formValues: Record<DetailTabKey, string> = {
    what_happened: whatHappened,
    outcomes,
    future,
  };
  const formSetters: Record<DetailTabKey, (v: string) => void> = {
    what_happened: setWhatHappened,
    outcomes: setOutcomes,
    future: setFuture,
  };
  const formCounts: Record<DetailTabKey, number> = {
    what_happened: whatHappened.length,
    outcomes: outcomes.length,
    future: future.length,
  };
  const formPlaceholders: Record<DetailTabKey, string> = {
    what_happened:
      'Raw recap — who attended, what they said, what surprised you. Factual narrative while it is fresh.',
    outcomes:
      'What came out — decisions, commitments, pricing signals, objections surfaced. The durable substance.',
    future:
      'Specific follow-ups + deadlines. Artifacts to send, intros to make, next-meeting ask, calibrated probability.',
  };

  const submit = async () => {
    setError(null);
    if (!prospectName.trim() && !whatHappened.trim() && !outcomes.trim() && !future.trim()) {
      setError('Add a prospect name or fill at least one tab before saving.');
      return;
    }
    setSubmitting(true);
    const res = await onCreate({
      meetingType,
      prospectName: prospectName.trim(),
      prospectRole: prospectRole.trim(),
      prospectCompany: prospectCompany.trim(),
      happenedAt: fromLocalInput(happenedAt),
      notes: whatHappened.trim(),
      learnings: outcomes.trim(),
      nextSteps: future.trim(),
      outcome,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated(res.meeting);
  };

  return (
    <div
      style={{
        padding: 16,
        marginBottom: 14,
        border: '1px solid var(--accent-primary)',
        borderRadius: 10,
        background: 'var(--bg-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
          }}
        >
          Log a past meeting
        </div>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 11,
            padding: 4,
          }}
        >
          Cancel
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 10,
        }}
      >
        <FieldLabel label="Meeting type">
          <select
            value={meetingType}
            onChange={e => setMeetingType(e.target.value)}
            style={inputStyle}
          >
            {Object.entries(MEETING_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Happened at">
          <input
            type="datetime-local"
            value={happenedAt}
            onChange={e => setHappenedAt(e.target.value)}
            style={inputStyle}
          />
        </FieldLabel>
        <FieldLabel label="Outcome">
          <select value={outcome} onChange={e => setOutcome(e.target.value)} style={inputStyle}>
            {OUTCOME_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FieldLabel>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          marginBottom: 14,
        }}
      >
        <FieldLabel label="Prospect name">
          <input
            type="text"
            value={prospectName}
            onChange={e => setProspectName(e.target.value)}
            placeholder="e.g. Gabriel Osamor"
            style={inputStyle}
          />
        </FieldLabel>
        <FieldLabel label="Role">
          <input
            type="text"
            value={prospectRole}
            onChange={e => setProspectRole(e.target.value)}
            placeholder="e.g. CFO advisor"
            style={inputStyle}
          />
        </FieldLabel>
        <FieldLabel label="Company">
          <input
            type="text"
            value={prospectCompany}
            onChange={e => setProspectCompany(e.target.value)}
            placeholder="Optional"
            style={inputStyle}
          />
        </FieldLabel>
      </div>

      {/* Three-tab content, same structure as the detail panel so the
          founder uses identical muscle memory. */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 10,
        }}
      >
        {DETAIL_TABS.map(tab => {
          const isActive = tab.key === formTab;
          const hasContent = formCounts[tab.key] > 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFormTab(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
                marginBottom: -1,
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
              {hasContent && (
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    opacity: isActive ? 1 : 0.6,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <textarea
        value={formValues[formTab]}
        onChange={e => formSetters[formTab](e.target.value)}
        rows={6}
        maxLength={10000}
        placeholder={formPlaceholders[formTab]}
        style={{ ...inputStyle, minHeight: 140, fontFamily: 'inherit' }}
      />

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 10,
            padding: '8px 10px',
            fontSize: 12,
            color: 'var(--error)',
            background: 'rgba(220,38,38,0.08)',
            border: '1px solid rgba(220,38,38,0.22)',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 12,
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          style={{
            padding: '9px 18px',
            borderRadius: 999,
            border: 'none',
            background: submitting ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
            color: submitting ? 'var(--text-muted)' : 'var(--text-on-accent, #fff)',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? 'Saving…' : 'Save meeting log'}
        </button>
      </div>
    </div>
  );
}
