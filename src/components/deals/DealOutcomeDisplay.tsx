'use client';

import { TrendingUp, TrendingDown, Clock, ArrowUpRight } from 'lucide-react';
import { type DealOutcome, getExitTypeLabel } from '@/types/deals';

interface DealOutcomeDisplayProps {
  outcome: DealOutcome;
  currency?: string;
}

function getIrrColor(irr: number): string {
  if (irr >= 20) return '#10b981';
  if (irr >= 10) return '#f59e0b';
  if (irr >= 0) return 'var(--text-muted)';
  return '#ef4444';
}

function getMoicColor(moic: number): string {
  if (moic >= 3) return '#10b981';
  if (moic >= 2) return '#f59e0b';
  if (moic >= 1) return 'var(--text-muted)';
  return '#ef4444';
}

const cardStyle: React.CSSProperties = {
  padding: '16px 20px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

export function DealOutcomeDisplay({ outcome, currency = 'USD' }: DealOutcomeDisplayProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
      }}
    >
      {/* IRR */}
      {outcome.irr != null && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {outcome.irr >= 0 ? (
              <TrendingUp size={14} style={{ color: getIrrColor(outcome.irr) }} />
            ) : (
              <TrendingDown size={14} style={{ color: getIrrColor(outcome.irr) }} />
            )}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>IRR</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: getIrrColor(outcome.irr) }}>
            {outcome.irr > 0 ? '+' : ''}
            {outcome.irr.toFixed(1)}%
          </div>
        </div>
      )}

      {/* MOIC */}
      {outcome.moic != null && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpRight size={14} style={{ color: getMoicColor(outcome.moic) }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>MOIC</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: getMoicColor(outcome.moic) }}>
            {outcome.moic.toFixed(1)}x
          </div>
        </div>
      )}

      {/* Exit Type */}
      {outcome.exitType && (
        <div style={cardStyle}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            Exit Type
          </span>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {getExitTypeLabel(outcome.exitType)}
          </div>
        </div>
      )}

      {/* Exit Value */}
      {outcome.exitValue != null && (
        <div style={cardStyle}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            Exit Value
          </span>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {currency}{' '}
            {outcome.exitValue >= 1_000_000
              ? `${(Number(outcome.exitValue) / 1_000_000).toFixed(1)}M`
              : Number(outcome.exitValue).toLocaleString()}
          </div>
        </div>
      )}

      {/* Hold Period */}
      {outcome.holdPeriod != null && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              Hold Period
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {outcome.holdPeriod < 12
              ? `${outcome.holdPeriod}mo`
              : `${(outcome.holdPeriod / 12).toFixed(1)}yr`}
          </div>
        </div>
      )}
    </div>
  );
}
