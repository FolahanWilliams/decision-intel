'use client';

/**
 * RetroactivePairingReview — renders the BulkPairingResult returned by
 * /api/retroactive/bulk-upload, grouped by confidence band, and lets
 * the founder confirm / edit / dismiss each pair before creating a
 * retroactive DecisionContainer. Locked 2026-05-21 (Adaptation #1).
 *
 * Confidence bands (from PAIRING_CONFIDENCE_THRESHOLDS):
 *   - auto_high   (≥ 0.75): one-click confirm
 *   - auto_medium (≥ 0.50): review signals + confirm
 *   - auto_low    (≥ 0.25): mostly manual triage
 *   - unpaired    (< 0.25): memo with no outcome → fill outcome by hand
 */

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AccentCard } from '@/components/ui/AccentCard';
import type { BulkPair, BulkPairingResult, UploadedHistoricalDoc } from '@/lib/retroactive/types';

const BAND_META: Record<
  BulkPair['band'],
  { label: string; color: string; accent: 'primary' | 'info' | 'warning' | 'muted' }
> = {
  auto_high: { label: 'High-confidence pairs', color: 'var(--success)', accent: 'primary' },
  auto_medium: { label: 'Review pairs', color: 'var(--info)', accent: 'info' },
  auto_low: { label: 'Low-confidence pairs', color: 'var(--warning)', accent: 'warning' },
  unpaired: { label: 'Unpaired (manual outcome)', color: 'var(--text-muted)', accent: 'muted' },
};

const DIRECTION_META: Record<string, { label: string; color: string; icon: typeof TrendingUp }> = {
  positive: { label: 'Value created', color: 'var(--success)', icon: TrendingUp },
  negative: { label: 'Value destroyed', color: 'var(--error)', icon: TrendingDown },
  mixed: { label: 'Mixed outcome', color: 'var(--warning)', icon: TrendingUp },
  too_early: { label: 'Too early to tell', color: 'var(--text-muted)', icon: TrendingUp },
};

export interface RetroactivePairingReviewProps {
  result: BulkPairingResult;
  /** Fires when the user clicks the create-container action on a pair. */
  onCreatePair: (pair: BulkPair) => void;
  /** Fires when the user wants to dismiss a pair entirely. */
  onDismissPair: (pairId: string) => void;
  /** Pair ids the user has already confirmed (so they fall to the
   *  bottom + show a check mark). Caller manages this set. */
  confirmedPairIds: Set<string>;
}

function PairCard({
  pair,
  onCreate,
  onDismiss,
  confirmed,
}: {
  pair: BulkPair;
  onCreate: () => void;
  onDismiss: () => void;
  confirmed: boolean;
}) {
  const [expanded, setExpanded] = useState(pair.band === 'auto_medium');
  const bandMeta = BAND_META[pair.band];

  const dir = pair.outcomeDraft?.direction;
  const directionMeta = dir ? DIRECTION_META[dir] : null;
  const DirectionIcon = directionMeta?.icon ?? Sparkles;

  return (
    <div
      style={{
        border: `1px solid var(--border-color)`,
        borderLeft: `3px solid ${bandMeta.color}`,
        borderRadius: 'var(--radius-md)',
        background: confirmed
          ? 'color-mix(in srgb, var(--success) 6%, var(--bg-card))'
          : 'var(--bg-card)',
        padding: 14,
        opacity: confirmed ? 0.75 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              fontSize: 12,
              fontWeight: 600,
              color: bandMeta.color,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            }}
          >
            {confirmed && <CheckCircle2 size={14} color="var(--success)" />}
            <span>
              {bandMeta.label} · {Math.round(pair.confidence * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
                flex: 1,
              }}
            >
              <FileText size={13} color="var(--text-muted)" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pair.memoDoc.filename}
              </span>
            </span>
            {pair.outcomeDoc && (
              <>
                <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <FileText size={13} color="var(--text-muted)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pair.outcomeDoc.filename}
                  </span>
                </span>
              </>
            )}
            {!pair.outcomeDoc && (
              <>
                <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap',
                  }}
                >
                  outcome filled by hand
                </span>
              </>
            )}
          </div>

          {directionMeta && pair.outcomeDraft && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                fontSize: 12,
                fontWeight: 500,
                color: directionMeta.color,
                background: `color-mix(in srgb, ${directionMeta.color} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${directionMeta.color} 25%, transparent)`,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <DirectionIcon size={11} />
              <span>{directionMeta.label}</span>
              <span style={{ opacity: 0.7, marginLeft: 4 }}>
                · confidence {Math.round(pair.outcomeDraft.extractionConfidence * 100)}%
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Entity overlap
              </div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                {Math.round(pair.signals.entityOverlap * 100)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Time gap
              </div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                {pair.signals.temporalProximityDays != null
                  ? `${pair.signals.temporalProximityDays} days`
                  : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Content similarity
              </div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                {Math.round(pair.signals.contentSimilarity * 100)}%
              </div>
            </div>
          </div>

          {pair.outcomeDraft?.draftNarrative && (
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                Draft outcome narrative
              </div>
              <div style={{ color: 'var(--text-primary)' }}>{pair.outcomeDraft.draftNarrative}</div>
            </div>
          )}
        </div>
      )}

      {!confirmed && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onCreate}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Create container →
          </button>
        </div>
      )}
    </div>
  );
}

function UnclassifiedDocCard({ doc }: { doc: UploadedHistoricalDoc }) {
  return (
    <div
      style={{
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: 10,
        fontSize: 13,
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <FileText size={13} color="var(--text-muted)" />
      <span
        style={{
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }}
      >
        {doc.filename}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
        role: {doc.detectedRole}
      </span>
    </div>
  );
}

export function RetroactivePairingReview({
  result,
  onCreatePair,
  onDismissPair,
  confirmedPairIds,
}: RetroactivePairingReviewProps) {
  const groups = useMemo(() => {
    const buckets: Record<BulkPair['band'], BulkPair[]> = {
      auto_high: [],
      auto_medium: [],
      auto_low: [],
      unpaired: [],
    };
    for (const p of result.pairs) buckets[p.band].push(p);
    return buckets;
  }, [result.pairs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AccentCard accent="info">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          <Stat
            label="Total uploaded"
            value={result.totalDocs}
            sub={`${result.memoCount} memo · ${result.outcomeCount} outcome`}
          />
          <Stat
            label="High-confidence pairs"
            value={groups.auto_high.length}
            sub="≥ 75% confidence"
          />
          <Stat
            label="Review pairs"
            value={groups.auto_medium.length + groups.auto_low.length}
            sub="50–75% confidence"
          />
          <Stat label="Unpaired" value={groups.unpaired.length} sub="manual outcome" />
        </div>
      </AccentCard>

      {(['auto_high', 'auto_medium', 'auto_low', 'unpaired'] as const).map(band => {
        const list = groups[band];
        if (list.length === 0) return null;
        const meta = BAND_META[band];
        return (
          <div key={band}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: meta.color,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              {meta.label} · {list.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(pair => (
                <PairCard
                  key={pair.pairId}
                  pair={pair}
                  onCreate={() => onCreatePair(pair)}
                  onDismiss={() => onDismissPair(pair.pairId)}
                  confirmed={confirmedPairIds.has(pair.pairId)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {result.unclassified.length > 0 && (
        <AccentCard
          accent="muted"
          title={
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Unclassified documents · {result.unclassified.length}
            </span>
          }
        >
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            These files didn&apos;t look like a memo or an outcome doc. Upload them again later with
            clearer filenames, or attach them manually to an existing container.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.unclassified.map(doc => (
              <UnclassifiedDocCard key={doc.documentId} doc={doc} />
            ))}
          </div>
        </AccentCard>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}
