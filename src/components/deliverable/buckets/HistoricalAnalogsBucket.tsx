/**
 * HistoricalAnalogsBucket — Bucket 3 of the MECE structure.
 * "What the comparables say" — forgotten questions from the
 * reference-class corpus + the analog companies that raised them.
 *
 * The Klein-side R²F output. Each question is a row in the matrix:
 * question + analog + severity. Drawer opens to show the bias
 * guarded against + why the analog had to answer it.
 */

'use client';

import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import type {
  AnalogQuestion,
  HistoricalAnalogsBucket as HistoricalAnalogsBucketType,
} from '@/lib/deliverable/types';
import { ActionTitle } from '../ActionTitle';
import { ComparativeMatrix } from '../ComparativeMatrix';
import { ProgressiveDrawer } from '../ProgressiveDrawer';
import { ValueSuppressingPalette } from '../ValueSuppressingPalette';

interface HistoricalAnalogsBucketProps {
  bucket: HistoricalAnalogsBucketType;
  density?: 'standard' | 'dense';
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'var(--severity-critical, #b91c1c)',
  high: 'var(--severity-high, #ef4444)',
  medium: 'var(--warning, #d97706)',
  low: 'var(--success, #16a34a)',
};

export function HistoricalAnalogsBucket({
  bucket,
  density = 'standard',
}: HistoricalAnalogsBucketProps) {
  const [active, setActive] = useState<AnalogQuestion | null>(null);

  const columns = [
    { key: 'question', label: 'Forgotten question' },
    { key: 'analog', label: 'Analog', width: density === 'dense' ? '160px' : '180px' },
    { key: 'severity', label: 'Severity', width: '120px', align: 'center' as const },
  ];

  const rows = bucket.forgottenQuestions.map((q, idx) => ({
    id: `fq-${idx}`,
    severityColor: SEVERITY_COLORS[q.severity],
    onOpenDrawer: () => setActive(q),
    cells: {
      question: (
        <span style={{ color: 'var(--text-primary, #0F172A)', fontWeight: 600 }}>{q.question}</span>
      ),
      analog: q.analogCompany ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            color: 'var(--text-secondary, #475569)',
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <ScrollText size={11} />
          {q.analogCompany}
        </span>
      ) : (
        <span style={{ color: 'var(--text-muted, #64748B)' }}>—</span>
      ),
      severity: (
        <span
          style={{
            display: 'inline-block',
            padding: '3px 9px',
            borderRadius: 999,
            background: `${SEVERITY_COLORS[q.severity]}1A`,
            color: SEVERITY_COLORS[q.severity],
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {q.severity}
        </span>
      ),
    },
  }));

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ActionTitle
        eyebrow="What the comparables say"
        accessory={
          bucket.analogsUsed.length > 0 ? (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--text-muted, #64748B)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {bucket.analogsUsed.length} historical analogs cited
            </span>
          ) : null
        }
      >
        {bucket.actionTitle}
      </ActionTitle>

      <ComparativeMatrix
        columns={columns}
        rows={rows}
        density={density}
        emptyState="No forgotten questions surfaced — the memo addresses what comparable decisions answered."
      />

      {bucket.analogsUsed.length > 0 ? (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted, #64748B)',
            paddingLeft: 4,
          }}
        >
          Cases referenced:{' '}
          {bucket.analogsUsed.slice(0, 6).map((a, idx) => (
            <span key={a}>
              <strong style={{ color: 'var(--text-secondary, #475569)' }}>{a}</strong>
              {idx < Math.min(bucket.analogsUsed.length, 6) - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      ) : null}

      <ProgressiveDrawer
        open={active !== null}
        onClose={() => setActive(null)}
        eyebrow="Forgotten question"
        title={active?.question ?? ''}
      >
        {active ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <ValueSuppressingPalette
              chip={{
                severity: active.severity,
                band: 'High',
                pct: null,
              }}
            />
            <DrawerBlock label="Why it matters" body={active.whyItMatters} />
            {active.analogCompany ? (
              <DrawerBlock
                label="Historical analog"
                body={
                  <span style={{ fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                    {active.analogCompany}
                  </span>
                }
              />
            ) : null}
            <DrawerBlock
              label="Bias guarded against"
              body={
                <code
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12.5,
                    background: 'var(--bg-secondary, #F8FAFC)',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {active.biasGuarded}
                </code>
              }
            />
          </div>
        ) : null}
      </ProgressiveDrawer>
    </section>
  );
}

function DrawerBlock({ label, body }: { label: string; body: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted, #64748B)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--text-primary, #0F172A)', lineHeight: 1.6 }}>
        {body}
      </div>
    </div>
  );
}
