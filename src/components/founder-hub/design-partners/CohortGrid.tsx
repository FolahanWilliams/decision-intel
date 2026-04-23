'use client';

/**
 * 5-slot cohort grid for the Design Partners tab.
 *
 * Each slot renders either:
 *   - A filled card showing company + status + scale chip + quick stats
 *     (when an Application has slotOrder === N)
 *   - An empty slot placeholder with "Assign a partner" hint
 *
 * Clicking a filled slot fires onOpenPartner(app.id). The parent is
 * responsible for swapping the tab body to PartnerDetailView.
 *
 * Visual grammar: card-body with accent-left-border on the partner's
 * status colour. Empty slots are dashed outlines so they read as holding
 * space, not as failed state.
 */

import { ArrowUpRight, Plus } from 'lucide-react';
import { card } from '../shared-styles';
import type { Application, ApplicationStatus } from './types';
import { MAX_SEATS } from './types';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: '#3B82F6',
  reviewing: '#F59E0B',
  scheduled_call: '#8B5CF6',
  accepted: '#16A34A',
  declined: '#64748B',
  withdrawn: '#94A3B8',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  reviewing: 'Reviewing',
  scheduled_call: 'Call scheduled',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};

interface Props {
  applications: Application[];
  onOpenPartner: (id: string) => void;
  onAssignSlot?: (slot: number) => void;
}

export function CohortGrid({ applications, onOpenPartner, onAssignSlot }: Props) {
  const bySlot = new Map<number, Application>();
  for (const app of applications) {
    if (app.slotOrder && app.slotOrder >= 1 && app.slotOrder <= MAX_SEATS) {
      bySlot.set(app.slotOrder, app);
    }
  }

  const slots = Array.from({ length: MAX_SEATS }, (_, i) => i + 1);

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 10,
        }}
      >
        The Cohort · 5 seats
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {slots.map(slot => {
          const app = bySlot.get(slot);
          if (!app) {
            return (
              <EmptySlotCard
                key={slot}
                slot={slot}
                onClick={onAssignSlot ? () => onAssignSlot(slot) : undefined}
              />
            );
          }
          return <FilledSlotCard key={slot} app={app} onClick={() => onOpenPartner(app.id)} />;
        })}
      </div>
    </div>
  );
}

function FilledSlotCard({ app, onClick }: { app: Application; onClick: () => void }) {
  const statusColor = STATUS_COLORS[app.status];
  const scale = app.richProfile?.whatTheyDo?.scale;
  const teamSize = scale?.teamSize ?? app.teamSize;

  return (
    <button
      onClick={onClick}
      style={{
        ...card,
        textAlign: 'left',
        cursor: 'pointer',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${statusColor}`,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'transform 0.15s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 6px 16px rgba(0,0,0,0.08))';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Slot {app.slotOrder}
        </span>
        <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        {app.company}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: `${statusColor}18`,
            color: statusColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {STATUS_LABELS[app.status]}
        </span>
        {teamSize && (
          <span
            style={{
              fontSize: 10.5,
              color: 'var(--text-muted)',
              padding: '2px 6px',
            }}
          >
            · {teamSize}
          </span>
        )}
      </div>
      {app.richProfile?.whatTheyDo?.summary && (
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {app.richProfile.whatTheyDo.summary}
        </p>
      )}
      {app.richProfile?.offerSpec?.pricing?.rate && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--accent-primary)',
            fontWeight: 700,
            marginTop: 'auto',
          }}
        >
          {app.richProfile.offerSpec.pricing.rate}
          {app.richProfile.offerSpec.pricing.label && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              {' · '}
              {app.richProfile.offerSpec.pricing.label}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function EmptySlotCard({ slot, onClick }: { slot: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{
        border: '1.5px dashed var(--border-color)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: 18,
        background: 'transparent',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 170,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.background = 'rgba(22,163,74,0.03)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Slot {slot}
      </span>
      <Plus size={18} style={{ opacity: 0.55 }} />
      <span style={{ fontSize: 11.5, textAlign: 'center', maxWidth: 180, lineHeight: 1.45 }}>
        Empty. Promote a partner from the inbox to this seat.
      </span>
    </button>
  );
}
