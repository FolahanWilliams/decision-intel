'use client';

/**
 * VoiceActivityTab — Founder Hub cross-tracking dashboard for voice
 * mode tool calls. Shows what the voice agent created, looked up,
 * and tracked during recent voice sessions.
 *
 * Data flow:
 *   Voice agent fires tool → /api/founder-hub/voice-tools writes
 *   VoiceSessionEvent row → this tab reads /api/founder-hub/voice-activity
 *   GET to display summary cards + per-event detail.
 *
 * Three views:
 *   - Summary cards (per eventType count for the chosen window)
 *   - Demo conversion tracker (filtered to eventType=demo_conversion,
 *     grouped by prospect with status timeline)
 *   - Activity feed (chronological, all event types, filterable)
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Mic,
  CheckSquare,
  TrendingUp,
  Search,
  Lightbulb,
  RefreshCw,
  Activity as ActivityIcon,
  Loader2,
  Handshake,
  Calendar,
  Presentation,
  GraduationCap,
  FileText,
  Bookmark,
} from 'lucide-react';

interface VoiceSessionEvent {
  id: string;
  sessionId: string;
  eventType: string;
  payload: {
    tool?: string;
    args?: Record<string, unknown>;
    result?: unknown;
    handlerError?: string | null;
  };
  personaId: string | null;
  userId: string | null;
  createdAt: string;
}

interface VoiceActivityResponse {
  events: VoiceSessionEvent[];
  summary: Record<string, number>;
  filters: { eventType: string | null; sessionId: string | null; personaId: string | null; limit: number };
}

interface Props {
  founderPass: string;
}

const EVENT_TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number }>; color: string }> = {
  // Write actions
  todo_created: { label: 'Todos created', icon: CheckSquare, color: '#16A34A' },
  demo_conversion: { label: 'Demo conversions', icon: TrendingUp, color: '#0EA5E9' },
  positioning_note: { label: 'Positioning notes', icon: Lightbulb, color: '#F59E0B' },
  outreach_event: { label: 'Outreach events', icon: Handshake, color: '#0EA5E9' },
  meeting_logged: { label: 'Meetings logged', icon: Presentation, color: '#16A34A' },
  lesson_learned: { label: 'Lessons learned', icon: GraduationCap, color: '#A78BFA' },
  followup_scheduled: { label: 'Follow-ups scheduled', icon: Calendar, color: '#16A34A' },
  // Captured ideas — the autonomous output of the IDEATION_PROTOCOL in
  // thinking-partners.ts. Reviewed by the founder for reintegration into
  // Decision Intel as features / new bias detectors / positioning shifts.
  idea_captured: { label: 'Ideas captured', icon: Bookmark, color: '#A78BFA' },
  // Read actions (lookups)
  decision_lookup: { label: 'Decision-log lookups', icon: Search, color: '#7C3AED' },
  meeting_lookup: { label: 'Meeting lookups', icon: Search, color: '#7C3AED' },
  design_partner_lookup: { label: 'Design-partner lookups', icon: Search, color: '#7C3AED' },
  outreach_lookup: { label: 'Outreach lookups', icon: Search, color: '#7C3AED' },
  sparring_lookup: { label: 'Sparring lookups', icon: Search, color: '#7C3AED' },
  audit_lookup: { label: 'Audit lookups', icon: FileText, color: '#7C3AED' },
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

function summariseEvent(ev: VoiceSessionEvent): string {
  const args = (ev.payload?.args ?? {}) as Record<string, unknown>;
  switch (ev.eventType) {
    case 'todo_created':
      return typeof args.title === 'string' ? args.title : 'Todo';
    case 'demo_conversion':
      return `${args.prospectName ?? 'Unknown'} → ${args.status ?? 'unknown'}${args.note ? ` · ${String(args.note).slice(0, 80)}` : ''}`;
    case 'positioning_note':
      return typeof args.articulation === 'string' ? args.articulation : 'Positioning note';
    case 'outreach_event':
      return `${args.personName ?? 'Unknown'} → ${args.eventType ?? 'note'}${args.note ? ` · ${String(args.note).slice(0, 80)}` : ''}`;
    case 'meeting_logged':
      return `${args.title ?? 'Meeting'}${Array.isArray(args.attendees) && args.attendees.length > 0 ? ` · ${args.attendees.length} attendee(s)` : ''}`;
    case 'lesson_learned':
      return `[${args.category ?? 'general'}] ${typeof args.learning === 'string' ? args.learning.slice(0, 100) : 'Lesson'}`;
    case 'followup_scheduled':
      return `Follow up with ${args.personName ?? 'someone'} on ${args.dueDate ?? '(no date)'}`;
    case 'idea_captured': {
      const title = typeof args.title === 'string' ? args.title : 'Idea';
      const verdict = typeof args.reintegrationVerdict === 'string' ? args.reintegrationVerdict.replace(/_/g, ' ') : 'review';
      const mechanism = typeof args.mechanism === 'string' ? ` · ${args.mechanism.slice(0, 100)}` : '';
      return `${title} [${verdict}]${mechanism}`;
    }
    case 'decision_lookup':
      return `Searched decisions: "${args.query ?? '(no query)'}"`;
    case 'meeting_lookup':
      return `Looked up recent meetings (limit ${args.limit ?? 5})`;
    case 'design_partner_lookup':
      return `Checked design-partner pipeline`;
    case 'outreach_lookup':
      return `Checked outreach: ${args.personName ?? 'all'} (last ${args.lookbackDays ?? 30}d)`;
    case 'sparring_lookup':
      return `Checked sparring history (limit ${args.limit ?? 5})`;
    case 'audit_lookup':
      return `Checked recent audits (limit ${args.limit ?? 5})`;
    default:
      return ev.eventType;
  }
}

export function VoiceActivityTab({ founderPass }: Props) {
  const [data, setData] = useState<VoiceActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterType
        ? `/api/founder-hub/voice-activity?eventType=${encodeURIComponent(filterType)}&limit=100`
        : '/api/founder-hub/voice-activity?limit=100';
      const res = await fetch(url, { headers: { 'x-founder-pass': founderPass } });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, founderPass]);

  // Build the demo-conversion view: events of type demo_conversion grouped
  // by prospect name, showing status history per prospect.
  const demoConversions = useMemo(() => {
    if (!data) return [];
    const byProspect = new Map<string, VoiceSessionEvent[]>();
    for (const ev of data.events) {
      if (ev.eventType !== 'demo_conversion') continue;
      const name =
        typeof ev.payload?.args?.prospectName === 'string'
          ? ev.payload.args.prospectName
          : 'Unknown';
      const existing = byProspect.get(name) ?? [];
      existing.push(ev);
      byProspect.set(name, existing);
    }
    return Array.from(byProspect.entries())
      .map(([prospect, events]) => ({
        prospect,
        events: events.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        latestStatus: events[0]?.payload?.args?.status ?? 'unknown',
        latestAt: events[0]?.createdAt ?? '',
      }))
      .sort((a, b) => b.latestAt.localeCompare(a.latestAt));
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Voice Activity
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            What the voice agent created, looked up, and tracked during recent voice sessions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchData()}
          disabled={loading}
          title="Refresh"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 12,
            border: '1px solid var(--error)',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: 8,
            color: 'var(--error)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* Summary cards */}
      {data && Object.keys(data.summary).length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}
        >
          {Object.entries(data.summary).map(([type, count]) => {
            const meta = EVENT_TYPE_META[type] ?? { label: type, icon: ActivityIcon, color: '#6B7280' };
            const Icon = meta.icon;
            const active = filterType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(active ? null : type)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: 14,
                  border: `1px solid ${active ? meta.color : 'var(--border-color)'}`,
                  borderRadius: 10,
                  background: active ? `${meta.color}14` : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                title={active ? 'Click to clear filter' : `Click to filter to ${meta.label.toLowerCase()}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={14} />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {meta.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: meta.color,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Demo conversion tracker — only renders if there's data */}
      {!filterType && demoConversions.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-muted)',
            }}
          >
            Demo Conversion Tracker
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {demoConversions.map(({ prospect, events, latestStatus, latestAt }) => (
              <div
                key={prospect}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr auto',
                  gap: 12,
                  padding: '10px 14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  background: 'var(--bg-card)',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prospect}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {events.length} event{events.length === 1 ? '' : 's'} · last: {String(latestStatus)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatRelative(latestAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity feed */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Activity Feed
          {filterType && (
            <button
              type="button"
              onClick={() => setFilterType(null)}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              filter: {filterType} ✕
            </button>
          )}
        </h3>
        {!data || data.events.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              border: '1px dashed var(--border-color)',
              borderRadius: 8,
            }}
          >
            <Mic size={20} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div>No voice activity yet.</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              Voice agent tool calls (todos, demo conversions, lookups) appear here as you use voice mode.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.events.map(ev => {
              const meta = EVENT_TYPE_META[ev.eventType] ?? {
                label: ev.eventType,
                icon: ActivityIcon,
                color: '#6B7280',
              };
              const Icon = meta.icon;
              return (
                <div
                  key={ev.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr auto',
                    gap: 12,
                    padding: '10px 14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    background: 'var(--bg-card)',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ marginTop: 2 }}>
                    <Icon size={14} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{summariseEvent(ev)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {meta.label.toLowerCase()}
                      {ev.personaId ? ` · ${ev.personaId}` : ''}
                      {ev.payload?.handlerError ? ' · ⚠ error' : ''}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatRelative(ev.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
