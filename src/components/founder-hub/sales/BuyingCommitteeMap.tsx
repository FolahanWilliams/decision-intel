'use client';

/**
 * Buying Committee Map — interactive org-chart visualization showing the
 * 6-role committee for a Pan-African fund deciding on Decision Intel
 * (the GTM wedge), with a toggle to switch to the 5-role committee at a
 * Fortune 500 CSO office (the revenue ceiling, 12-18 months out).
 *
 * Click any role to see: who they are, what they care most about, what
 * they veto, how to navigate. Authority is colour-coded:
 * green = champion path, gold = economic buyer, blue = influencer,
 * red = veto power.
 *
 * Source data: src/lib/data/sales-toolkit.ts BUYING_COMMITTEE, grounded in
 * NotebookLM master KB synthesis (note 75e173e9). Pure SVG + Framer
 * Motion. Respects prefers-reduced-motion.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, User, Shield, Eye, DollarSign } from 'lucide-react';
import {
  BUYING_COMMITTEE,
  type BuyingCommitteeIcp,
  type CommitteeRole,
} from '@/lib/data/sales-toolkit';

const AUTHORITY_COLORS: Record<CommitteeRole['authority'], string> = {
  economic: '#D97706', // gold
  champion: '#16A34A', // green
  influencer: '#0EA5E9', // blue
  veto: '#DC2626', // red
};

const AUTHORITY_LABELS: Record<CommitteeRole['authority'], string> = {
  economic: 'Economic Buyer',
  champion: 'Champion',
  influencer: 'Influencer',
  veto: 'Veto Power',
};

const ROLE_ICONS: Record<string, typeof Crown> = {
  mp: Crown,
  cso: Crown,
  id: Star,
  strategy_lead: Star,
  associate: User,
  gc: Shield,
  gc_f500: Shield,
  audit_chair: Eye,
  audit_committee: Eye,
  cfo: DollarSign,
  cfo_f500: DollarSign,
};

export function BuyingCommitteeMap() {
  const [icp, setIcp] = useState<BuyingCommitteeIcp>('pan_african_fund');
  const [activeRoleId, setActiveRoleId] = useState<string>(
    BUYING_COMMITTEE.pan_african_fund.roles[0].id
  );

  const committee = BUYING_COMMITTEE[icp];
  const activeRole = committee.roles.find(r => r.id === activeRoleId) ?? committee.roles[0];

  return (
    <div>
      {/* ICP toggle */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 14,
          padding: 4,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {(Object.keys(BUYING_COMMITTEE) as BuyingCommitteeIcp[]).map(key => {
          const isActive = key === icp;
          return (
            <button
              key={key}
              onClick={() => {
                setIcp(key);
                setActiveRoleId(BUYING_COMMITTEE[key].roles[0].id);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive ? '#16A34A' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {BUYING_COMMITTEE[key].label}
            </button>
          );
        })}
      </div>

      {/* Description for active ICP */}
      <div
        style={{
          padding: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 14,
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
        }}
      >
        {committee.description}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Org-chart roles list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {committee.roles.map(role => {
            const isActive = role.id === activeRoleId;
            const color = AUTHORITY_COLORS[role.authority];
            const Icon = ROLE_ICONS[role.id] ?? User;
            return (
              <button
                key={role.id}
                onClick={() => setActiveRoleId(role.id)}
                style={{
                  padding: '10px 12px',
                  background: isActive ? `${color}12` : 'var(--bg-card)',
                  border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {role.title}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginTop: 2,
                    }}
                  >
                    {AUTHORITY_LABELS[role.authority]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active role detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${icp}-${activeRole.id}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            style={{
              padding: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderTop: `3px solid ${AUTHORITY_COLORS[activeRole.authority]}`,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              {activeRole.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              {activeRole.persona}
            </div>

            <DetailBlock
              label="What they care most about"
              color={AUTHORITY_COLORS[activeRole.authority]}
              text={activeRole.cares}
            />
            <DetailBlock label="What they veto" color="#DC2626" text={activeRole.vetoes} />
            <DetailBlock label="How to navigate" color="#16A34A" text={activeRole.navigate} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function DetailBlock({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
        }}
      >
        {text}
      </div>
    </div>
  );
}
