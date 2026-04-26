'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
  Send,
  Mail,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ArrowRight,
  FileText,
  Sparkles,
  Shield,
} from 'lucide-react';
import { BlindPriorAggregateView } from './BlindPriorAggregateView';
import type { BlindPriorAggregate } from '@/lib/learning/blind-prior-aggregate';
import { useToast } from '@/components/ui/EnhancedToast';

interface InitialOutcome {
  outcome: string;
  notes: string | null;
  impactScore: number | null;
  reportedAt: string;
}

export interface DecisionRoomDetailInitial {
  id: string;
  title: string;
  decisionType: string | null;
  status: string;
  analysisId: string | null;
  documentId: string | null;
  isCreator: boolean;
  deadline: string | null;
  revealedAt: string | null;
  outcomeFrame: string | null;
  outcomeId: string | null;
  outcome: InitialOutcome | null;
  myInviteToken: string | null;
  myPrior: { submittedAt: string; confidencePercent: number; topRisks: string[] } | null;
}

interface RosterEntry {
  id: string;
  displayName: string | null;
  recipientType: 'platform_user' | 'external';
  role: string;
  submitted: boolean;
  sentAt: string;
  remindedAt: string | null;
  tokenExpiresAt: string;
}

interface AggregateResponse {
  ok: true;
  room: {
    id: string;
    title: string;
    outcomeFrame: string | null;
    deadline: string | null;
    revealedAt: string | null;
    outcomeId: string | null;
  };
  phase: 'collecting' | 'revealed' | 'outcome_logged';
  aggregate: BlindPriorAggregate;
  roster: {
    invites: RosterEntry[];
    nonVoterCount: number;
    voterCount: number;
  };
}

interface CollectingResponse {
  ok: true;
  phase: 'collecting';
  revealed: false;
  deadline: string | null;
  mySubmission: { submittedAt: string } | null;
  waitingOn: undefined;
}

type AggregateResp = AggregateResponse | CollectingResponse;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function timeUntil(iso: string | null): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'past deadline';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours >= 1) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const PHASE_COPY: Record<
  'collecting' | 'revealed' | 'outcome_logged',
  { label: string; tint: string; description: string }
> = {
  collecting: {
    label: 'Collecting',
    tint: '#eab308',
    description:
      'Survey is live. Participants submit independently; nobody sees the aggregate until reveal.',
  },
  revealed: {
    label: 'Revealed',
    tint: '#16A34A',
    description:
      'Aggregate is visible to every invitee. Outcome calibration runs once the actual outcome is logged.',
  },
  outcome_logged: {
    label: 'Outcome logged',
    tint: '#3b82f6',
    description:
      'Brier score per participant is calibrated against the actual outcome.',
  },
};

interface Props {
  roomId: string;
  initialRoom: DecisionRoomDetailInitial;
}

export function DecisionRoomDetailClient({ roomId, initialRoom }: Props) {
  const [room, setRoom] = useState(initialRoom);
  const [aggregate, setAggregate] = useState<AggregateResp | null>(null);
  const [aggError, setAggError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  // Replaces native alert() on reveal failure 2026-04-26 (Marcus persona
  // finding) — alert() at the highest-stakes moment of the room
  // (blind-prior reveal) reads "broken" to a procurement-stage demo
  // viewer and disrupts the modal stack on Safari.
  const { showToast } = useToast();

  const phase: 'collecting' | 'revealed' | 'outcome_logged' = useMemo(() => {
    if (room.outcomeId) return 'outcome_logged';
    if (room.revealedAt) return 'revealed';
    return 'collecting';
  }, [room.outcomeId, room.revealedAt]);

  const fetchAggregate = useCallback(async () => {
    try {
      const res = await fetch(`/api/decision-rooms/${roomId}/blind-priors/aggregate`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Failed (${res.status})`);
      }
      const data = (await res.json()) as AggregateResp;
      setAggregate(data);
      setAggError(null);
    } catch (err) {
      setAggError(err instanceof Error ? err.message : 'Could not load aggregate.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void fetchAggregate();
    if (phase === 'collecting') {
      const tick = setInterval(fetchAggregate, 30_000);
      return () => clearInterval(tick);
    }
    return undefined;
  }, [fetchAggregate, phase]);

  const onReveal = useCallback(
    async (force: boolean) => {
      setRevealing(true);
      try {
        const res = await fetch(`/api/decision-rooms/${roomId}/blind-priors/reveal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; revealedAt?: string };
        if (!res.ok) {
          showToast(data.error ?? 'Could not reveal the aggregate.', 'error');
          return;
        }
        if (data.revealedAt) {
          setRoom(prev => ({ ...prev, revealedAt: data.revealedAt! }));
        }
        await fetchAggregate();
      } finally {
        setRevealing(false);
      }
    },
    [fetchAggregate, roomId, showToast]
  );

  const phaseMeta = PHASE_COPY[phase];

  return (
    <div style={{ padding: 'var(--spacing-xl)', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <Link
          href="/dashboard/meetings?tab=rooms"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            fontSize: 12,
            textDecoration: 'none',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={14} /> Back to rooms
        </Link>
      </div>

      {/* Header strip */}
      <div
        className="card mb-md"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}
      >
        <div className="card-body" style={{ padding: 'var(--spacing-lg)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 280 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: `${phaseMeta.tint}1f`,
                  border: `1px solid ${phaseMeta.tint}66`,
                  color: phaseMeta.tint,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                <Sparkles size={11} /> {phaseMeta.label}
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {room.title}
              </h1>
              {room.outcomeFrame && (
                <p
                  style={{
                    margin: '10px 0 0',
                    color: 'var(--text-secondary)',
                    fontSize: 15,
                    lineHeight: 1.5,
                    maxWidth: 680,
                  }}
                >
                  {room.outcomeFrame}
                </p>
              )}
              <p
                style={{
                  margin: '8px 0 0',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  maxWidth: 720,
                }}
              >
                {phaseMeta.description}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
              }}
            >
              {room.analysisId && (
                <Link
                  href={`/documents/${room.documentId ?? room.analysisId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <FileText size={13} /> Linked memo
                </Link>
              )}
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
            }}
          >
            <StatTile
              icon={<Clock size={14} />}
              label="Deadline"
              value={room.deadline ? timeUntil(room.deadline) : 'Not set'}
              hint={room.deadline ? formatDate(room.deadline) : '—'}
            />
            <StatTile
              icon={<Users size={14} />}
              label="Submitted"
              value={
                aggregate && 'roster' in aggregate
                  ? `${aggregate.roster.voterCount - aggregate.roster.nonVoterCount}/${aggregate.roster.voterCount}`
                  : '—'
              }
              hint={
                aggregate && 'roster' in aggregate && aggregate.roster.nonVoterCount > 0
                  ? `${aggregate.roster.nonVoterCount} pending`
                  : 'All voters in'
              }
            />
            <StatTile
              icon={<Eye size={14} />}
              label="Revealed"
              value={room.revealedAt ? formatDate(room.revealedAt) : 'Not yet'}
              hint={room.revealedAt ? '' : 'Aggregate hidden until reveal'}
            />
            {room.outcomeId && room.outcome && (
              <StatTile
                icon={<Shield size={14} />}
                label="Outcome"
                value={room.outcome.outcome.replace('_', ' ')}
                hint={`Reported ${formatDate(room.outcome.reportedAt)}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Phase-specific surfaces */}
      {loading ? (
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
          }}
        >
          <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 13 }}>
            Loading aggregate…
          </p>
        </div>
      ) : aggError ? (
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            padding: 'var(--spacing-md)',
            color: 'var(--severity-high)',
          }}
        >
          <AlertTriangle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          {aggError}
        </div>
      ) : phase === 'collecting' ? (
        <CollectingPanel
          roomId={roomId}
          isCreator={room.isCreator}
          deadline={room.deadline}
          aggregate={aggregate}
          onAfterDistribute={fetchAggregate}
          onReveal={() => onReveal(false)}
          onForceReveal={() => onReveal(true)}
          revealing={revealing}
          showInviteForm={showInviteForm}
          setShowInviteForm={setShowInviteForm}
          myInviteToken={room.myInviteToken}
          myPrior={room.myPrior}
        />
      ) : 'aggregate' in (aggregate ?? {}) ? (
        <RevealedPanel
          response={aggregate as AggregateResponse}
          phase={phase}
          isCreator={room.isCreator}
          outcome={room.outcome}
          analysisId={room.analysisId}
        />
      ) : (
        <div
          className="card"
          style={{ background: 'var(--bg-card)', padding: 'var(--spacing-md)' }}
        >
          Aggregate unavailable.
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-muted)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 700,
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: 4,
          textTransform: 'capitalize',
        }}
      >
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>
      )}
    </div>
  );
}

function CollectingPanel({
  roomId,
  isCreator,
  deadline,
  aggregate,
  onAfterDistribute,
  onReveal,
  onForceReveal,
  revealing,
  showInviteForm,
  setShowInviteForm,
  myInviteToken,
  myPrior,
}: {
  roomId: string;
  isCreator: boolean;
  deadline: string | null;
  aggregate: AggregateResp | null;
  onAfterDistribute: () => void;
  onReveal: () => void;
  onForceReveal: () => void;
  revealing: boolean;
  showInviteForm: boolean;
  setShowInviteForm: (v: boolean) => void;
  myInviteToken: string | null;
  myPrior: { submittedAt: string; confidencePercent: number; topRisks: string[] } | null;
}) {
  const roster = aggregate && 'roster' in aggregate ? aggregate.roster.invites : [];
  const submitted = roster.filter(r => r.submitted).length;
  const total = roster.length;
  const allSubmitted = total > 0 && submitted === total;
  // Track wall-clock so `deadlinePassed` updates on a 30s tick without
  // calling impure Date.now() during render. Mirrors the pattern in
  // NotificationCenter.tsx for react-hooks/purity. `now` starts at 0 to
  // avoid hydration mismatch — the first interval tick stamps the real
  // time. Until then deadlinePassed reads false (we err on the side of
  // hiding the force-reveal button rather than flashing it on mount).
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    // Stamp real time on the next microtask (zero-delay timeout) so the
    // first read happens AFTER mount — keeps the effect body free of
    // a synchronous setState call (react-hooks/set-state-in-effect).
    const seed = setTimeout(() => setNow(Date.now()), 0);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearTimeout(seed);
      clearInterval(tick);
    };
  }, []);
  const deadlineMs = deadline ? new Date(deadline).getTime() : null;
  const deadlinePassed = deadlineMs !== null && now > 0 && deadlineMs <= now;

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', alignItems: 'start' }}>
      {/* My prior strip — visible regardless of role, since participants want to know if they've submitted */}
      {myInviteToken && (
        <div
          className="card"
          style={{
            background: myPrior ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-card)',
            borderColor: myPrior ? 'rgba(22,163,74,0.3)' : 'var(--border-color)',
          }}
        >
          <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
            {myPrior ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    You submitted on {formatDate(myPrior.submittedAt)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    Confidence {myPrior.confidencePercent}%, {myPrior.topRisks.length} top risk
                    {myPrior.topRisks.length === 1 ? '' : 's'}.
                  </div>
                </div>
                {myInviteToken && (
                  <Link
                    href={`/shared/blind-prior/${encodeURIComponent(myInviteToken)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Edit
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <EyeOff size={18} color="#eab308" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    You haven&rsquo;t submitted yet.
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    The aggregate stays hidden until everyone votes or the room owner reveals.
                  </div>
                </div>
                {myInviteToken && (
                  <Link
                    href={`/shared/blind-prior/${encodeURIComponent(myInviteToken)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Submit prior <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roster + creator controls */}
      <div className="card" style={{ background: 'var(--bg-card)' }}>
        <div
          className="card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>
              Participants
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12 }}>
              {submitted} of {total} have submitted.
            </p>
          </div>
          {isCreator && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Send size={13} /> {showInviteForm ? 'Hide' : 'Distribute survey'}
              </button>
              <button
                onClick={onReveal}
                disabled={revealing || (!allSubmitted && !deadlinePassed)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: allSubmitted || deadlinePassed ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  border: `1px solid ${allSubmitted || deadlinePassed ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  color: allSubmitted || deadlinePassed ? '#fff' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: revealing ? 'wait' : 'pointer',
                  opacity: revealing ? 0.6 : 1,
                }}
              >
                {revealing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                Reveal aggregate
              </button>
            </div>
          )}
        </div>
        <div className="card-body">
          {showInviteForm && isCreator && (
            <DistributeForm
              roomId={roomId}
              currentDeadline={deadline}
              onAfterDistribute={() => {
                setShowInviteForm(false);
                onAfterDistribute();
              }}
            />
          )}

          {roster.length === 0 ? (
            <div
              style={{
                padding: 'var(--spacing-md)',
                color: 'var(--text-muted)',
                fontSize: 13,
                textAlign: 'center',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No participants invited yet.
              {isCreator
                ? ' Click "Distribute survey" to send magic-link invitations.'
                : ' The room owner has not distributed the survey yet.'}
            </div>
          ) : (
            <div style={{ marginTop: showInviteForm ? 16 : 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Participant</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Channel</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '8px 10px' }}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map(r => (
                    <tr
                      key={r.id}
                      style={{ borderTop: '1px solid var(--border-color)', fontSize: 13 }}
                    >
                      <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {r.displayName || (r.recipientType === 'platform_user' ? 'Platform user' : 'External invitee')}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {r.recipientType === 'platform_user' ? 'In-app + email' : 'Email'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{r.role}</td>
                      <td style={{ padding: '10px' }}>
                        {r.submitted ? (
                          <span style={{ color: '#16A34A', fontWeight: 700 }}>Submitted</span>
                        ) : (
                          <span style={{ color: '#eab308', fontWeight: 700 }}>Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {formatDate(r.sentAt)}
                        {r.remindedAt ? (
                          <span
                            style={{
                              display: 'inline-block',
                              marginLeft: 6,
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              background: 'rgba(234,179,8,0.15)',
                              color: '#eab308',
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            REMINDED
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isCreator && !allSubmitted && !deadlinePassed && (
            <div
              style={{
                marginTop: 16,
                padding: '10px 12px',
                background: 'rgba(234,179,8,0.08)',
                border: '1px solid rgba(234,179,8,0.25)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: 12,
              }}
            >
              You can&rsquo;t reveal yet — wait for everyone to submit, or for the deadline.
              <button
                onClick={onForceReveal}
                disabled={revealing}
                style={{
                  marginLeft: 12,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 700,
                  textDecoration: 'underline',
                }}
              >
                Force reveal anyway
              </button>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                (audit-logged as forced)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DistributeForm({
  roomId,
  currentDeadline,
  onAfterDistribute,
}: {
  roomId: string;
  currentDeadline: string | null;
  onAfterDistribute: () => void;
}) {
  // Default: 24h from now if no deadline yet, else preserve existing.
  const defaultDeadline = useMemo(() => {
    const dt = currentDeadline
      ? new Date(currentDeadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  }, [currentDeadline]);

  const [deadline, setDeadline] = useState(defaultDeadline);
  const [outcomeFrame, setOutcomeFrame] = useState('');
  const [inviteText, setInviteText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const invitees = inviteText
        .split(/\n|,|;/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(line => {
          // Format: "Display Name <email@example.com>" or just "email"
          const match = line.match(/^(.*?)\s*<\s*(.+)\s*>\s*$/);
          if (match) {
            return { email: match[2], displayName: match[1] };
          }
          if (/.+@.+\..+/.test(line)) return { email: line };
          return { displayName: line };
        })
        .filter(i => i.email);
      if (invitees.length === 0) {
        setError('Add at least one email (one per line, or "Name <email>" format).');
        setSubmitting(false);
        return;
      }
      const isoDeadline = new Date(deadline).toISOString();
      const res = await fetch(`/api/decision-rooms/${roomId}/blind-priors/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deadline: isoDeadline,
          outcomeFrame: outcomeFrame.trim() || undefined,
          invitees,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'Distribution failed.');
        return;
      }
      onAfterDistribute();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Decision frame (optional)
          </label>
          <input
            type="text"
            value={outcomeFrame}
            onChange={e => setOutcomeFrame(e.target.value)}
            placeholder="Should we approve Project Atlas at $40M?"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 14,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Deadline
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{
              padding: '8px 10px',
              fontSize: 14,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Invitees (one per line — &ldquo;Name &lt;email&rdquo;&gt; or just email)
          </label>
          <textarea
            value={inviteText}
            onChange={e => setInviteText(e.target.value)}
            placeholder={'Sarah Adekunle <sarah@sankore.com>\ndavid@example.com'}
            rows={5}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 13,
              fontFamily: 'inherit',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              resize: 'vertical',
            }}
          />
        </div>
        {error && (
          <div
            style={{
              color: 'var(--severity-high)',
              fontSize: 12,
              padding: '6px 10px',
              background: 'rgba(239,68,68,0.08)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onSubmit}
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
            Send invites
          </button>
        </div>
      </div>
    </div>
  );
}

function RevealedPanel({
  response,
  phase,
  isCreator,
  outcome,
  analysisId,
}: {
  response: AggregateResponse;
  phase: 'revealed' | 'outcome_logged' | 'collecting';
  isCreator: boolean;
  outcome: InitialOutcome | null;
  analysisId: string | null;
}) {
  const { aggregate, roster } = response;
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <BlindPriorAggregateView
        aggregate={aggregate}
        phase={phase as 'revealed' | 'outcome_logged'}
      />

      {phase === 'outcome_logged' && outcome && (
        <div
          className="card"
          style={{
            background: 'rgba(59,130,246,0.08)',
            borderColor: 'rgba(59,130,246,0.25)',
          }}
        >
          <div className="card-body" style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: 14 }}>
              Outcome reported
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              <strong style={{ color: 'var(--text-primary)' }}>
                {outcome.outcome.replace('_', ' ')}
              </strong>
              {outcome.impactScore != null && (
                <span style={{ marginLeft: 10 }}>impact {outcome.impactScore}/10</span>
              )}
            </div>
            {outcome.notes && (
              <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                {outcome.notes}
              </p>
            )}
            {analysisId && (
              <Link
                href={`/documents/${analysisId}`}
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  color: 'var(--accent-primary)',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                View recalibrated DQI →
              </Link>
            )}
          </div>
        </div>
      )}

      {isCreator && (
        <div
          className="card"
          style={{ background: 'var(--bg-card)' }}
        >
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14 }}>
              Roster · post-reveal
            </h3>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Participant</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.invites.map(r => (
                  <tr
                    key={r.id}
                    style={{ borderTop: '1px solid var(--border-color)', fontSize: 13 }}
                  >
                    <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {r.displayName || 'Unnamed invitee'}
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{r.role}</td>
                    <td style={{ padding: '10px' }}>
                      {r.submitted ? (
                        <span style={{ color: '#16A34A', fontWeight: 700 }}>Submitted</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Did not vote</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
