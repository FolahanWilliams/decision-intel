'use client';

/**
 * Enterprise Friction Matrix — the 5 specific friction points enterprise
 * buyers (M&A teams, GCs, fund partners, F500 CSOs) will surface during
 * procurement. Each card shows: how the friction surfaces, the pre-baked
 * verbal response, the underlying product status (shipped / partial /
 * gap / roadmap), and the severity.
 *
 * Source data: src/lib/data/sales-toolkit.ts ENTERPRISE_FRICTION_MATRIX,
 * grounded in NotebookLM master KB synthesis.
 *
 * The visual: 5 selectable friction cards in a grid; click any to expand
 * a detail panel showing the response script + the product status badge.
 * Status badges use CSS-variable severity colours so the founder can see
 * at-a-glance which frictions point at real product gaps to fix.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  Building2,
  Briefcase,
  Shield,
  TrendingUp,
} from 'lucide-react';
import {
  ENTERPRISE_FRICTION_MATRIX,
  type EnterpriseFriction,
  type FrictionStatus,
} from '@/lib/data/sales-toolkit';

const STATUS_META: Record<
  FrictionStatus,
  { label: string; color: string; bg: string; Icon: typeof CheckCircle }
> = {
  shipped: { label: 'Shipped', color: '#16A34A', bg: 'rgba(22,163,74,0.10)', Icon: CheckCircle },
  partial: { label: 'Partial', color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)', Icon: Sparkles },
  roadmap: { label: 'Roadmap', color: '#D97706', bg: 'rgba(217,119,6,0.10)', Icon: Clock },
  gap: { label: 'Gap (fix)', color: '#DC2626', bg: 'rgba(220,38,38,0.10)', Icon: XCircle },
};

const SEGMENT_ICONS: Record<EnterpriseFriction['buyerSegment'], typeof Building2> = {
  'F500 CSO': Building2,
  'M&A / Corp Dev': Briefcase,
  'Fund Partner': TrendingUp,
  'GC / Compliance': Shield,
  'All': AlertTriangle,
};

const SEVERITY_COLORS: Record<EnterpriseFriction['severity'], string> = {
  critical: '#DC2626',
  high: '#D97706',
  medium: '#0EA5E9',
};

export function EnterpriseFrictionMatrix() {
  const [activeId, setActiveId] = useState<string>(ENTERPRISE_FRICTION_MATRIX[0].id);
  const active = ENTERPRISE_FRICTION_MATRIX.find(f => f.id === activeId)!;

  // Per-status counters for the legend
  const statusCounts = ENTERPRISE_FRICTION_MATRIX.reduce<Record<FrictionStatus, number>>(
    (acc, f) => {
      acc[f.productStatus] = (acc[f.productStatus] || 0) + 1;
      return acc;
    },
    { shipped: 0, partial: 0, gap: 0, roadmap: 0 }
  );

  return (
    <div>
      {/* Status legend strip */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 14,
          padding: '8px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          flexWrap: 'wrap',
          fontSize: 11,
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Product status across 5 frictions:</span>
        {(Object.keys(STATUS_META) as FrictionStatus[]).map(s => {
          const m = STATUS_META[s];
          const count = statusCounts[s];
          return (
            <span
              key={s}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: m.color,
                fontWeight: 700,
              }}
            >
              <m.Icon size={12} />
              {m.label} {count}
            </span>
          );
        })}
      </div>

      {/* Friction cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {ENTERPRISE_FRICTION_MATRIX.map(f => {
          const isActive = f.id === activeId;
          const status = STATUS_META[f.productStatus];
          const SegmentIcon = SEGMENT_ICONS[f.buyerSegment];
          const severityColor = SEVERITY_COLORS[f.severity];
          return (
            <button
              key={f.id}
              onClick={() => setActiveId(f.id)}
              style={{
                padding: 12,
                background: isActive ? `${severityColor}10` : 'var(--bg-card)',
                border: `1px solid ${isActive ? severityColor : 'var(--border-color)'}`,
                borderTop: `3px solid ${severityColor}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 9,
                  fontWeight: 800,
                  color: severityColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <SegmentIcon size={11} />
                {f.buyerSegment} · {f.severity}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  lineHeight: 1.3,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  alignSelf: 'flex-start',
                  fontSize: 10,
                  fontWeight: 700,
                  color: status.color,
                  background: status.bg,
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                <status.Icon size={10} />
                {status.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            padding: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${SEVERITY_COLORS[active.severity]}`,
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            {active.title}
          </div>

          <DetailRow
            label="How the buyer surfaces it"
            color="#64748B"
            text={active.surfacedAs}
            italic
          />
          <DetailRow
            label="Pre-baked response (Folahan literally says)"
            color="#16A34A"
            text={active.preBakedResponse}
            italic
          />
          <DetailRow
            label={`Product status — ${STATUS_META[active.productStatus].label}`}
            color={STATUS_META[active.productStatus].color}
            text={active.statusDetail}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DetailRow({
  label,
  color,
  text,
  italic = false,
}: {
  label: string;
  color: string;
  text: string;
  italic?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
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
          fontStyle: italic ? 'italic' : 'normal',
        }}
      >
        {text}
      </div>
    </div>
  );
}
