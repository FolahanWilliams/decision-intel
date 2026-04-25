'use client';

/**
 * PartnerDetailView — full-page view for a single design-partner slot.
 *
 * Top bar: back button + company name + slot + status chip.
 * Body: 4 sub-tabs — Overview / Fit Thesis / My Offer / Contacts & Prep.
 * Notes tab is deliberately kept on the existing application-triage UI
 * (textarea on the card in the Inbox view) since founder-notes editing
 * is already well-served there and every partner has one.
 *
 * This view is mounted by DesignPartnersTab when the user clicks a
 * filled slot in the CohortGrid; clicking the back arrow returns to
 * the grid.
 */

import { useState } from 'react';
import { ArrowLeft, Building2, Target, HandCoins, Users, BookOpen } from 'lucide-react';
import type { Application, ApplicationStatus } from './types';
import { PartnerOverviewTab } from './tabs/PartnerOverviewTab';
import { PartnerFitTab } from './tabs/PartnerFitTab';
import { PartnerOfferTab } from './tabs/PartnerOfferTab';
import { PartnerContactsTab } from './tabs/PartnerContactsTab';

type DetailTab = 'overview' | 'fit' | 'offer' | 'contacts';

const TABS: Array<{ key: DetailTab; label: string; icon: React.ComponentType<{ size?: number }> }> =
  [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'fit', label: 'Fit Thesis', icon: Target },
    { key: 'offer', label: 'My Offer', icon: HandCoins },
    { key: 'contacts', label: 'Contacts & Prep', icon: Users },
  ];

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
  app: Application;
  founderPass: string;
  onBack: () => void;
}

export function PartnerDetailView({ app, founderPass, onBack }: Props) {
  const [tab, setTab] = useState<DetailTab>('overview');
  const statusColor = STATUS_COLORS[app.status];
  const isSankore = app.company.toLowerCase().includes('sankore');

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 999,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={13} />
          Cohort
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            Slot {app.slotOrder ?? '—'} · {app.industry}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginTop: 2,
            }}
          >
            {app.company}
          </div>
        </div>
        {isSankore && (
          <a
            href="/dashboard/founder-hub/design-partners/sankore"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 11px',
              borderRadius: 999,
              background: 'rgba(22,163,74,0.10)',
              border: '1px solid rgba(22,163,74,0.30)',
              color: 'var(--accent-primary)',
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <BookOpen size={11} />
            Capability brief
            <span style={{ opacity: 0.7 }}>→</span>
          </a>
        )}
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: 999,
            background: `${statusColor}18`,
            color: statusColor,
            border: `1px solid ${statusColor}40`,
          }}
        >
          {STATUS_LABELS[app.status]}
        </span>
      </div>

      {/* Sub-tab strip */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 20,
          overflowX: 'auto',
        }}
      >
        {TABS.map(t => {
          const active = t.key === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                border: 'none',
                background: 'transparent',
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontSize: 12.5,
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                marginBottom: -1,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div>
        {tab === 'overview' && <PartnerOverviewTab app={app} />}
        {tab === 'fit' && <PartnerFitTab app={app} />}
        {tab === 'offer' && <PartnerOfferTab app={app} />}
        {tab === 'contacts' && <PartnerContactsTab app={app} founderPass={founderPass} />}
      </div>
    </div>
  );
}
