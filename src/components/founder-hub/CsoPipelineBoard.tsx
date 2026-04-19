'use client';

/**
 * CSO Pipeline Board — the "first thing under the header" pipeline
 * widget on the Founder Hub landing view.
 *
 * Surfaces FounderProspect rows grouped into the three pipeline stages
 * that map to the current outbound reality:
 *   - Reached Out     (status === 'cold')   — outreach sent, awaiting reply
 *   - Demo Scheduled  (status === 'warm')   — responded / engaging
 *   - Pilot Active    (status === 'active' or 'converted')
 *
 * Empty state is intentionally visible: if all three columns are zero,
 * that IS the week's work. The widget frames that explicitly rather
 * than hiding behind a polished shell.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Mail, Users, Rocket, ArrowRight, AlertCircle } from 'lucide-react';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CsoPipelineBoard');

interface FounderProspect {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  linkedInUrl: string | null;
  intent: string;
  status: string;
  outreachDate: string;
  lastContact: string | null;
  followUpDue: string | null;
  notes: string | null;
}

interface ColumnConfig {
  id: 'reached_out' | 'demo_scheduled' | 'pilot_active';
  label: string;
  Icon: typeof Mail;
  iconColor: string;
  statuses: string[];
  emptyHint: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'reached_out',
    label: 'Reached Out',
    Icon: Mail,
    iconColor: 'var(--info, #0EA5E9)',
    statuses: ['cold'],
    emptyHint: 'Send the week\u2019s first three outreach messages.',
  },
  {
    id: 'demo_scheduled',
    label: 'Demo Scheduled',
    Icon: Users,
    iconColor: 'var(--warning, #D97706)',
    statuses: ['warm'],
    emptyHint: 'Turn a "cold" reply into a 30-minute call this week.',
  },
  {
    id: 'pilot_active',
    label: 'Pilot Active',
    Icon: Rocket,
    iconColor: 'var(--accent-primary, #16A34A)',
    statuses: ['active', 'converted'],
    emptyHint: 'One signed design partner changes the fundraise story.',
  },
];

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function isFollowUpOverdue(iso: string | null): boolean {
  if (!iso) return false;
  try {
    return new Date(iso).getTime() < Date.now();
  } catch {
    return false;
  }
}

export function CsoPipelineBoard({ founderPass }: { founderPass: string }) {
  const [prospects, setProspects] = useState<FounderProspect[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchProspects() {
      try {
        const res = await fetch('/api/founder-hub/prospects', {
          headers: { 'x-founder-pass': founderPass },
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.success) {
          if (!cancelled) setError(body?.error || 'Failed to load prospects');
          return;
        }
        if (!cancelled) setProspects(body.data?.prospects ?? []);
      } catch (err) {
        log.warn('CsoPipelineBoard fetch failed:', err);
        if (!cancelled) setError('Network error loading prospects.');
      }
    }
    fetchProspects();
    return () => {
      cancelled = true;
    };
  }, [founderPass]);

  const grouped: Record<ColumnConfig['id'], FounderProspect[]> = {
    reached_out: [],
    demo_scheduled: [],
    pilot_active: [],
  };
  if (prospects) {
    for (const p of prospects) {
      const col = COLUMNS.find(c => c.statuses.includes(p.status));
      if (col) grouped[col.id].push(p);
    }
  }

  const totalActive =
    grouped.reached_out.length + grouped.demo_scheduled.length + grouped.pilot_active.length;
  const pilotCount = grouped.pilot_active.length;

  const isEmpty = prospects !== null && totalActive === 0;

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '18px 20px',
        marginBottom: 20,
      }}
      aria-label="Design-partner pipeline"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(22, 163, 74, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Rocket size={14} style={{ color: 'var(--accent-primary, #16A34A)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--accent-primary, #16A34A)',
                marginBottom: 2,
              }}
            >
              This week\u2019s mission
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
              }}
            >
              Design-partner pipeline &middot;{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                {pilotCount === 0
                  ? 'No pilot yet \u2014 that\u2019s the goal'
                  : `${pilotCount} pilot${pilotCount === 1 ? '' : 's'} active`}
              </span>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/founder-hub?tab=outreach_cmd"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent-primary, #16A34A)',
            textDecoration: 'none',
            padding: '6px 10px',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            background: 'var(--bg-card)',
            whiteSpace: 'nowrap',
          }}
        >
          Open Outreach Command Center <ArrowRight size={12} />
        </Link>
      </div>

      {/* Loading state */}
      {prospects === null && !error && (
        <div
          style={{
            padding: '28px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <Loader2 size={14} className="animate-spin" />
          Loading pipeline\u2026
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(var(--error-rgb, 220,38,38), 0.08)',
            border: '1px solid rgba(var(--error-rgb, 220,38,38), 0.25)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--error, #DC2626)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Empty state — the "that IS the week's work" moment */}
      {isEmpty && (
        <div
          style={{
            padding: '22px 20px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            No live pipeline. That IS the week\u2019s work.
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              maxWidth: 520,
              margin: '0 auto 14px',
            }}
          >
            First paying design partner is the one milestone before raise. Start three outreach
            conversations this week, track them here, and the pipeline becomes visible every time
            you open the hub.
          </div>
          <Link
            href="/dashboard/founder-hub?tab=outreach_cmd"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-on-accent, #fff)',
              background: 'var(--accent-primary, #16A34A)',
              padding: '9px 16px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Generate first outreach <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* 3-column board */}
      {prospects && totalActive > 0 && (
        <div
          className="cso-pipeline-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          {COLUMNS.map(col => {
            const items = grouped[col.id];
            const topThree = items.slice(0, 3);
            return (
              <div
                key={col.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '12px 12px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 120,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <col.Icon size={13} style={{ color: col.iconColor, flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      background: 'var(--bg-card)',
                      padding: '2px 7px',
                      borderRadius: 999,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {col.emptyHint}
                  </div>
                ) : (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {topThree.map(p => {
                      const overdue = col.id === 'reached_out' && isFollowUpOverdue(p.followUpDue);
                      return (
                        <li
                          key={p.id}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              {p.name}
                            </span>
                            {p.linkedInUrl && (
                              <a
                                href={p.linkedInUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: 'var(--text-muted)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  flexShrink: 0,
                                }}
                                aria-label={`Open ${p.name}'s LinkedIn`}
                              >
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.35,
                            }}
                          >
                            {p.company || p.role || p.intent}
                          </div>
                          {overdue && (
                            <div
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: 'var(--error, #DC2626)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                marginTop: 2,
                              }}
                            >
                              Follow-up overdue ({formatDate(p.followUpDue)})
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {items.length > topThree.length && (
                      <li
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          padding: '4px 2px 0',
                        }}
                      >
                        +{items.length - topThree.length} more
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 780px) {
          :global(.cso-pipeline-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
