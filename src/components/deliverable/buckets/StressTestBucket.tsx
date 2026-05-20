/**
 * StressTestBucket — Bucket 2 of the MECE structure.
 * "How the room will react" — boardroom personas + red team objections.
 *
 * Renders as a ComparativeMatrix (Tegus pattern, locked from DR §7)
 * with persona / vote / objection columns. Each row opens a drawer
 * with the full reasoning + verbatim claim targeting.
 *
 * Per DR §2 IC-memo dialectic finding: adversarial elements are
 * elevated to PRIMARY structural pillars (mandatory in 95% of formal
 * IC memos). The verdict ratio chip leads the bucket header.
 */

'use client';

import { useState } from 'react';
import { Gavel } from 'lucide-react';
import type {
  StressTestBucket as StressTestBucketType,
  StressTestObjection,
} from '@/lib/deliverable/types';
import { ActionTitle } from '../ActionTitle';
import { ComparativeMatrix } from '../ComparativeMatrix';
import { ProgressiveDrawer } from '../ProgressiveDrawer';
import { BoardroomVerdictChart } from '../charts/BoardroomVerdictChart';

interface StressTestBucketProps {
  bucket: StressTestBucketType;
  /** When 'dense', the comparative grid switches to compact rows. */
  density?: 'standard' | 'dense';
}

const VOTE_COLORS: Record<string, string> = {
  APPROVE: 'var(--success, #16a34a)',
  REJECT: 'var(--severity-critical, #b91c1c)',
  REVISE: 'var(--warning, #d97706)',
};

export function StressTestBucket({ bucket, density = 'standard' }: StressTestBucketProps) {
  const [active, setActive] = useState<StressTestObjection | null>(null);

  const columns = [
    { key: 'persona', label: 'Reviewer', width: density === 'dense' ? '180px' : '200px' },
    { key: 'role', label: 'Role', width: density === 'dense' ? '160px' : '180px' },
    { key: 'vote', label: 'Verdict', width: '100px', align: 'center' as const },
    { key: 'objection', label: 'Key concern' },
  ];

  const rows = bucket.objections.map((obj, idx) => ({
    id: `${obj.kind}-${idx}`,
    onOpenDrawer: () => setActive(obj),
    severityColor:
      obj.kind === 'red_team'
        ? 'var(--severity-high, #ef4444)'
        : obj.vote
          ? VOTE_COLORS[obj.vote]
          : undefined,
    cells: {
      persona: (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
            {obj.persona}
          </div>
          {obj.kind === 'red_team' ? (
            <div style={{ fontSize: 11, color: 'var(--severity-high, #ef4444)', fontWeight: 700 }}>
              Adversarial reviewer
            </div>
          ) : null}
        </div>
      ),
      role: (
        <span style={{ color: 'var(--text-secondary, #475569)', fontSize: 12.5 }}>{obj.role}</span>
      ),
      vote: obj.vote ? (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 9px',
            borderRadius: 999,
            background: `${VOTE_COLORS[obj.vote]}1A`,
            color: VOTE_COLORS[obj.vote],
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {obj.vote}
        </span>
      ) : (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 9px',
            borderRadius: 999,
            background: 'rgba(239,68,68,0.10)',
            color: 'var(--severity-high, #ef4444)',
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          RED TEAM
        </span>
      ),
      objection: (
        <span style={{ color: 'var(--text-primary, #0F172A)', fontSize: 13 }}>
          {obj.objection || obj.reasoning?.slice(0, 110) || '—'}
        </span>
      ),
    },
  }));

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ActionTitle eyebrow="How the room will react" accessory={<VerdictStrip bucket={bucket} />}>
        {bucket.actionTitle}
      </ActionTitle>

      {/* Visual: donut of vote distribution + red-team load side panel. */}
      <BoardroomVerdictChart counts={bucket.counts} overallVerdict={bucket.overallVerdict} />

      <ComparativeMatrix
        columns={columns}
        rows={rows}
        density={density}
        emptyState="The simulated boardroom + red team produced no objections for this memo."
      />

      <ProgressiveDrawer
        open={active !== null}
        onClose={() => setActive(null)}
        eyebrow={active?.kind === 'red_team' ? 'Red-team objection' : 'Boardroom reviewer'}
        title={active ? `${active.persona} · ${active.role}` : ''}
      >
        {active ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {active.vote ? (
              <div>
                <DrawerLabel>Verdict</DrawerLabel>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: `${VOTE_COLORS[active.vote]}1A`,
                    color: VOTE_COLORS[active.vote],
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {active.vote}
                </span>
              </div>
            ) : null}
            <div>
              <DrawerLabel>Key concern</DrawerLabel>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 14,
                  color: 'var(--text-primary, #0F172A)',
                  lineHeight: 1.6,
                  fontWeight: 600,
                }}
              >
                {active.objection}
              </p>
            </div>
            {active.targetClaim ? (
              <div>
                <DrawerLabel>Target claim</DrawerLabel>
                <blockquote
                  style={{
                    margin: '6px 0 0',
                    paddingLeft: 12,
                    borderLeft: '3px solid var(--severity-high, #ef4444)55',
                    fontStyle: 'italic',
                    color: 'var(--text-secondary, #475569)',
                    lineHeight: 1.55,
                  }}
                >
                  &ldquo;{active.targetClaim}&rdquo;
                </blockquote>
              </div>
            ) : null}
            {active.reasoning ? (
              <div>
                <DrawerLabel>Reasoning chain</DrawerLabel>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13.5,
                    color: 'var(--text-secondary, #475569)',
                    lineHeight: 1.65,
                  }}
                >
                  {active.reasoning}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </ProgressiveDrawer>
    </section>
  );
}

function VerdictStrip({ bucket }: { bucket: StressTestBucketType }) {
  const total = bucket.counts.approve + bucket.counts.reject + bucket.counts.revise;
  if (total === 0 && bucket.counts.redTeam === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {bucket.counts.approve > 0 ? (
        <VotePill color={VOTE_COLORS.APPROVE} count={bucket.counts.approve} label="approve" />
      ) : null}
      {bucket.counts.revise > 0 ? (
        <VotePill color={VOTE_COLORS.REVISE} count={bucket.counts.revise} label="revise" />
      ) : null}
      {bucket.counts.reject > 0 ? (
        <VotePill color={VOTE_COLORS.REJECT} count={bucket.counts.reject} label="reject" />
      ) : null}
      {bucket.counts.redTeam > 0 ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            background: 'rgba(239,68,68,0.10)',
            color: 'var(--severity-high, #ef4444)',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <Gavel size={11} />
          {bucket.counts.redTeam} red-team
        </span>
      ) : null}
    </div>
  );
}

function VotePill({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        background: `${color}1A`,
        color,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {count} {label}
    </span>
  );
}

function DrawerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text-muted, #64748B)',
      }}
    >
      {children}
    </div>
  );
}
