'use client';

/**
 * DesignPartnersTab — management UI for the 5-seat design-partner cohort.
 *
 * Lists inbound applications from /design-partner submissions, with
 * quick status transitions (applied → reviewing → scheduled_call →
 * accepted / declined / withdrawn), founder notes, and a capacity strip
 * showing how many of the 5 seats are filled.
 *
 * The 5-seat guard is enforced server-side (see
 * /api/founder-hub/design-partners/[id]/route.ts), so the UI surfaces
 * capacity honestly without being the authoritative gate.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Mail,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  Inbox,
  AlertCircle,
  Camera,
  Handshake,
} from 'lucide-react';
import { card, sectionTitle } from './shared-styles';
import { CohortGrid } from './design-partners/CohortGrid';
import { PartnerDetailView } from './design-partners/PartnerDetailView';
import type { Application, ApplicationStatus } from './design-partners/types';

interface Capacity {
  filled: number;
  total: number;
  open: number;
}

interface DesignPartnersTabProps {
  founderPass: string;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: '#3B82F6', // blue
  reviewing: '#F59E0B', // amber
  scheduled_call: '#8B5CF6', // violet
  accepted: '#16A34A', // green
  declined: '#64748B', // slate
  withdrawn: '#94A3B8', // slate lighter
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  reviewing: 'Reviewing',
  scheduled_call: 'Call scheduled',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};

const INDUSTRY_LABELS: Record<string, string> = {
  banking: 'Banking',
  insurance: 'Insurance',
  pharma: 'Pharma',
  aerospace: 'Aerospace',
  energy: 'Energy',
  mna: 'M&A / Corp Dev',
  other: 'Other',
};

export function DesignPartnersTab({ founderPass }: DesignPartnersTabProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [capacity, setCapacity] = useState<Capacity>({ filled: 0, total: 5, open: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [saveState, setSaveState] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
  // Which partner (if any) is open in the detail view. Null = cohort
  // grid + inbox list. String = per-partner rich profile view.
  const [openPartnerId, setOpenPartnerId] = useState<string | null>(null);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-founder-pass': founderPass,
    }),
    [founderPass]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/founder-hub/design-partners', { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load applications');
      setApplications(data.data?.applications ?? []);
      setCapacity(data.data?.capacity ?? { filled: 0, total: 5, open: 5 });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (founderPass) load();
  }, [founderPass, load]);

  const handleUpdate = async (id: string, patch: Partial<Application>) => {
    setSaveState(s => ({ ...s, [id]: 'saving' }));
    const prev = applications;
    setApplications(cur => cur.map(a => (a.id === id ? { ...a, ...patch } : a)));
    try {
      const res = await fetch(`/api/founder-hub/design-partners/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setApplications(prev);
        setError(data.error || 'Failed to update');
        setSaveState(s => ({ ...s, [id]: 'error' }));
        return;
      }
      setApplications(cur =>
        cur.map(a => (a.id === id ? (data.data.application as Application) : a))
      );
      setSaveState(s => ({ ...s, [id]: 'saved' }));
      // Refresh capacity since acceptance may have changed it
      if (patch.status === 'accepted' || patch.status === 'withdrawn') {
        const caps = await fetch('/api/founder-hub/design-partners', { headers: authHeaders() });
        const capsData = await caps.json();
        if (caps.ok) setCapacity(capsData.data.capacity);
      }
      setTimeout(() => setSaveState(s => ({ ...s, [id]: undefined as unknown as 'saved' })), 1800);
    } catch {
      setApplications(prev);
      setError('Network error');
      setSaveState(s => ({ ...s, [id]: 'error' }));
    }
  };

  const filtered = applications.filter(a => filter === 'all' || a.status === filter);

  const byStatus = applications.reduce(
    (acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }),
    {} as Record<ApplicationStatus, number>
  );

  // When a detail view is open, swap the whole tab body to the per-
  // partner page. Back action returns to the cohort + inbox view.
  const openPartner = applications.find(a => a.id === openPartnerId) ?? null;

  if (openPartner) {
    return (
      <div>
        <PartnerDetailView
          app={openPartner}
          founderPass={founderPass}
          onBack={() => setOpenPartnerId(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {/* 5-slot cohort grid — the primary entry point. Click a filled
          slot to open the rich per-partner detail view. Click an empty
          slot to focus the inbox filter (partners needing assignment). */}
      <CohortGrid applications={applications} onOpenPartner={id => setOpenPartnerId(id)} />

      {/* Pitch-deck capacity slide — deliberately formatted for screenshot
          + paste into deck slide 10. 16:9 frame, minimal chrome, ARR math
          spelled out, first-right-of-refusal note baked in. See
          CLAUDE.md positioning lock: "5 seats × $1,999/mo × 12 = $119,940
          ARR · first-right-of-refusal at list Year 2." Only renders
          inside the Hub; never ships to public marketing. */}
      <PitchDeckCapacitySlide capacity={capacity} />

      {/* Capacity strip */}
      <div
        style={{
          ...card,
          borderLeft: `3px solid ${capacity.open === 0 ? '#DC2626' : 'var(--accent-primary)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          {capacity.filled}
          <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>
            of {capacity.total} seats filled
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div
            style={{
              height: 8,
              background: 'var(--border-color)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(capacity.filled / capacity.total) * 100}%`,
                background: 'var(--accent-primary)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {capacity.open} {capacity.open === 1 ? 'seat' : 'seats'} open
        </div>
      </div>

      {/* Header + filter */}
      <div style={{ ...card }}>
        <div style={{ ...sectionTitle }}>
          <Inbox size={18} style={{ color: 'var(--accent-primary)', marginRight: 8 }} />
          Design Partner Applications
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
          Inbound from /design-partner. Status transitions are enforced by the 5-seat capacity guard
          server-side. Founder notes persist on save.
        </p>

        {/* Filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          <FilterChip
            label="All"
            count={applications.length}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {(
            [
              'applied',
              'reviewing',
              'scheduled_call',
              'accepted',
              'declined',
              'withdrawn',
            ] as ApplicationStatus[]
          ).map(s => (
            <FilterChip
              key={s}
              label={STATUS_LABELS[s]}
              count={byStatus[s] ?? 0}
              active={filter === s}
              color={STATUS_COLORS[s]}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 8,
              color: '#DC2626',
              fontSize: 12,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Loader2 size={16} className="animate-spin" />
            Loading applications&hellip;
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: 30,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              border: '1px dashed var(--border-color)',
              borderRadius: 10,
            }}
          >
            {applications.length === 0
              ? 'No applications yet. Warm-intro a CSO to /design-partner to seed the pipeline.'
              : 'No applications match this filter.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(app => (
              <ApplicationCard
                key={app.id}
                app={app}
                saveState={saveState[app.id]}
                onUpdate={patch => handleUpdate(app.id, patch)}
                onOpenDetail={() => setOpenPartnerId(app.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        border: `1px solid ${active ? color || 'var(--accent-primary)' : 'var(--border-color)'}`,
        background: active ? `${color || 'var(--accent-primary)'}1A` : 'transparent',
        color: active ? color || 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label}
      <span
        style={{
          fontSize: 11,
          padding: '1px 6px',
          borderRadius: 999,
          background: active ? 'rgba(255,255,255,0.18)' : 'var(--bg-card)',
          color: active ? color || 'var(--accent-primary)' : 'var(--text-muted)',
        }}
      >
        {count}
      </span>
    </button>
  );
}

function ApplicationCard({
  app,
  saveState,
  onUpdate,
  onOpenDetail,
}: {
  app: Application;
  saveState: 'saving' | 'saved' | 'error' | undefined;
  onUpdate: (patch: Partial<Application>) => void;
  onOpenDetail: () => void;
}) {
  const [notesValue, setNotesValue] = useState(app.founderNotes ?? '');
  const [notesExpanded, setNotesExpanded] = useState(false);
  // React 19 pattern for syncing state with changing props: track the
  // previous prop value and update during render when it changes. This
  // avoids the setState-in-effect cascading-render anti-pattern. When
  // the parent refetches the canonical row after a save, this picks up
  // the server-returned notes value without a redundant render cycle.
  const [lastSyncedNotes, setLastSyncedNotes] = useState(app.founderNotes ?? '');
  if ((app.founderNotes ?? '') !== lastSyncedNotes) {
    setLastSyncedNotes(app.founderNotes ?? '');
    setNotesValue(app.founderNotes ?? '');
  }

  const submitted = new Date(app.submittedAt);

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: `1px solid var(--border-color)`,
        background: 'var(--bg-card)',
        borderLeft: `3px solid ${STATUS_COLORS[app.status]}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 2,
            }}
          >
            {app.name}
            <span
              style={{
                marginLeft: 10,
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {app.role} · {app.company}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 4,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <Pill text={INDUSTRY_LABELS[app.industry] ?? app.industry} />
            <Pill text={`${app.teamSize} team`} />
            {app.source && <Pill text={app.source.replace(/-/g, ' ')} />}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {submitted.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
        <StatusBadge status={app.status} saveState={saveState} />
      </div>

      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          padding: '8px 10px',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            fontWeight: 700,
            display: 'block',
            marginBottom: 3,
          }}
        >
          Why now
        </span>
        {app.whyNow}
      </div>

      {(app.memoCadence || app.currentStack) && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 10,
            display: 'grid',
            gap: 4,
          }}
        >
          {app.memoCadence && (
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Cadence:</strong> {app.memoCadence}
            </div>
          )}
          {app.currentStack && (
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Stack:</strong> {app.currentStack}
            </div>
          )}
        </div>
      )}

      {/* Quick contact row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <a
          href={`mailto:${app.email}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--accent-primary)',
            textDecoration: 'none',
          }}
        >
          <Mail size={12} />
          {app.email}
        </a>
        {app.linkedInUrl && (
          <a
            href={app.linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} />
            LinkedIn
          </a>
        )}
      </div>

      {/* Status transition buttons + Open profile */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <button
          onClick={onOpenDetail}
          style={{
            padding: '6px 12px',
            fontSize: 11.5,
            fontWeight: 700,
            borderRadius: 999,
            border: '1px solid var(--accent-primary)',
            background: 'var(--accent-primary)',
            color: 'var(--text-on-accent, #fff)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          Open profile →
        </button>
        {nextStatuses(app.status).map(next => (
          <button
            key={next}
            onClick={() => onUpdate({ status: next })}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              border: `1px solid ${STATUS_COLORS[next]}`,
              background: `${STATUS_COLORS[next]}18`,
              color: STATUS_COLORS[next],
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {next === 'accepted' ? (
              <CheckCircle2 size={11} />
            ) : next === 'declined' || next === 'withdrawn' ? (
              <XCircle size={11} />
            ) : next === 'scheduled_call' ? (
              <Calendar size={11} />
            ) : (
              <FileText size={11} />
            )}
            {STATUS_LABELS[next]}
          </button>
        ))}
      </div>

      {/* Notes */}
      <div>
        <button
          onClick={() => setNotesExpanded(e => !e)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 6,
          }}
        >
          Founder notes {notesExpanded ? '▾' : '▸'}
          {app.founderNotes && !notesExpanded && (
            <span style={{ marginLeft: 8, color: 'var(--text-secondary)', textTransform: 'none' }}>
              ({app.founderNotes.length} chars)
            </span>
          )}
        </button>
        {notesExpanded && (
          <>
            <textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              onBlur={() => {
                if (notesValue !== (app.founderNotes ?? '')) {
                  onUpdate({ founderNotes: notesValue });
                }
              }}
              rows={3}
              placeholder="Triage notes, next actions, objections, references&hellip;"
              style={{
                width: '100%',
                padding: 10,
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginTop: 3,
                fontStyle: 'italic',
              }}
            >
              Saves on blur.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 7px',
        borderRadius: 999,
        border: '1px solid var(--border-color)',
        fontSize: 10.5,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'capitalize',
      }}
    >
      {text}
    </span>
  );
}

function StatusBadge({
  status,
  saveState,
}: {
  status: ApplicationStatus;
  saveState: 'saving' | 'saved' | 'error' | undefined;
}) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 999,
          background: `${STATUS_COLORS[status]}22`,
          color: STATUS_COLORS[status],
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {STATUS_LABELS[status]}
      </span>
      {saveState === 'saving' && (
        <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      )}
      {saveState === 'saved' && (
        <CheckCircle2 size={12} style={{ color: 'var(--accent-primary)' }} />
      )}
    </div>
  );
}

function nextStatuses(current: ApplicationStatus): ApplicationStatus[] {
  switch (current) {
    case 'applied':
      return ['reviewing', 'scheduled_call', 'declined', 'withdrawn'];
    case 'reviewing':
      return ['scheduled_call', 'accepted', 'declined', 'withdrawn'];
    case 'scheduled_call':
      return ['accepted', 'declined', 'withdrawn'];
    case 'accepted':
      return ['withdrawn'];
    case 'declined':
    case 'withdrawn':
      return ['reviewing'];
    default:
      return [];
  }
}

/** Pitch-deck-ready capacity slide (brainstorm item 10.1).
 *
 *  Sits at the top of DesignPartnersTab, above the ops capacity strip.
 *  The founder screenshots this and drops it into pitch deck slide 10
 *  ("Design Partner cohort") in place of the feature-chart slide.
 *
 *  Layout is deliberate:
 *   - 16:9-ish frame so the screenshot crops cleanly into 1920x1080
 *   - Headline sets the slide claim ("5 Fortune 500 seats, 12-month term")
 *   - Five seat pills (filled = green, open = outlined) sized big enough
 *     to count at speaker-view zoom
 *   - ARR math below ("$1,999 × 12 × 5 = $119,940 ARR")
 *   - First-right-of-refusal Year 2 footnote — the repeatable unit
 *     economic that makes this a slide 10, not a feature chart.
 *   - Small "Screenshot this" chip bottom-right marks the purpose without
 *     leaking into the screenshot if cropped.
 */
function PitchDeckCapacitySlide({ capacity }: { capacity: Capacity }) {
  const seats = Array.from({ length: capacity.total }, (_, i) => i < capacity.filled);
  const priceMonthly = 1999;
  const term = 12;
  const totalArr = priceMonthly * term * capacity.total;
  const bookedArr = priceMonthly * term * capacity.filled;
  const money = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`);

  return (
    <div
      style={{
        ...card,
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '3px solid #16A34A',
        background: 'linear-gradient(160deg, var(--bg-card) 0%, rgba(22,163,74,0.06) 100%)',
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#16A34A',
            background: 'rgba(22,163,74,0.10)',
            border: '1px solid rgba(22,163,74,0.28)',
            borderRadius: 9999,
          }}
        >
          <Handshake size={11} />
          Pitch deck · slide 10
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10.5,
            fontWeight: 600,
            color: 'var(--text-muted)',
          }}
        >
          <Camera size={11} />
          Screenshot this frame
        </div>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          marginBottom: 4,
        }}
      >
        5 Fortune 500 seats · 12-month term
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginBottom: 18,
        }}
      >
        Not a feature chart. Repeatable unit economics with a first-right-of-refusal at list price
        in Year 2.
      </div>

      {/* Seat pills — 5 big chips so the count is readable at 1920x1080 */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        {seats.map((filled, i) => (
          <div
            key={i}
            style={{
              flex: '1 1 120px',
              minWidth: 120,
              height: 72,
              borderRadius: 12,
              border: filled ? '2px solid #16A34A' : '2px dashed rgba(100,116,139,0.4)',
              background: filled ? 'rgba(22,163,74,0.12)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: filled ? '#16A34A' : 'var(--text-muted)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Seat {i + 1}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{filled ? 'Filled' : 'Open'}</div>
          </div>
        ))}
      </div>

      {/* ARR math */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '14px 16px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 10,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 2,
            }}
          >
            Cohort ARR at list
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {money(totalArr)}
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          $1,999/mo × 12 × {capacity.total} seats
        </div>
        <div style={{ flex: 1 }} />
        <div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 2,
            }}
          >
            Booked
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#16A34A',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {money(bookedArr)} · {capacity.filled}/{capacity.total}
          </div>
        </div>
      </div>

      {/* FRR footnote */}
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}
      >
        Year 2: first-right-of-refusal at list price. Design partners get the 20% discount locked
        for Year 1 only — the cohort is self-upgrading if the product compounds.
      </div>
    </div>
  );
}
