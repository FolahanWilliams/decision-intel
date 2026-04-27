'use client';

/**
 * Deal-level counterfactual ROI card (P2 capability — Marcus's audit
 * ask: "If we resolve all 5 cross-ref conflicts and the top-3 biases,
 * IRR moves from 21% to 27%, +£N protected.")
 *
 * Aggregates per-analysis counterfactuals across the deal's documents
 * via /api/deals/[id]/counterfactual and renders the combined
 * expected-improvement statement + the 3 highest-impact bias-removal
 * scenarios deal-wide.
 *
 * Renders nothing when:
 *   - The deal has fewer than 2 analyzed docs (single-doc deals already
 *     have CounterfactualPanel on the document page).
 *   - The aggregate improvement is ≤ 0 (don't show "would make it
 *     worse" — same null-render rule as CounterfactualPanel).
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Loader2, TrendingUp } from 'lucide-react';
import { confidenceColor as getConfidenceColor } from '@/lib/utils/confidence';

interface DealCounterfactualScenario {
  biasRemoved: string;
  expectedImprovement: number;
  confidence: number;
  estimatedMonetaryImpact: number | null;
  currency: string;
  documentCount: number;
}

interface DealCounterfactualResponse {
  dealId: string;
  analyzedDocCount: number;
  dealAggregateImprovement: number;
  dealAggregateMonetaryImpact: number | null;
  currency: string;
  topScenarios: DealCounterfactualScenario[];
  perAnalysis: Array<{
    analysisId: string;
    documentId: string;
    documentName: string;
    weightedImprovement: number;
    scenarioCount: number;
  }>;
  dataAsOf: string;
}

function formatBiasName(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function currencySymbol(c: string): string {
  if (c === 'GBP') return '£';
  if (c === 'EUR') return '€';
  if (c === 'USD') return '$';
  return c;
}

interface Props {
  dealId: string;
}

export function DealCounterfactualHero({ dealId }: Props) {
  const [data, setData] = useState<DealCounterfactualResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/deals/${dealId}/counterfactual`);
        if (!res.ok) return;
        const json = (await res.json()) as DealCounterfactualResponse;
        if (!cancelled) setData(json);
      } catch {
        /* network errors swallow — the card just doesn't render */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dealId]);

  if (loading) {
    return (
      <div
        style={{
          padding: '12px 16px',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Loader2 size={13} className="animate-spin" />
        Computing deal-level counterfactual…
      </div>
    );
  }

  if (!data || data.analyzedDocCount < 2 || data.dealAggregateImprovement <= 0) return null;

  const sym = currencySymbol(data.currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card liquid-glass-premium"
      style={{
        borderLeft: '3px solid var(--accent-primary)',
        marginBottom: 'var(--spacing-lg)',
      }}
    >
      <div className="card-body" style={{ padding: '20px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(22,163,74,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: 4,
              }}
            >
              Deal counterfactual · what-if across all {data.analyzedDocCount} docs
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.35,
                marginBottom: 6,
              }}
            >
              Resolving the top biases across this deal lifts composite DQI by{' '}
              <span style={{ color: 'var(--accent-primary)' }}>
                +{data.dealAggregateImprovement.toFixed(1)}pp
              </span>
              {data.dealAggregateMonetaryImpact != null && data.dealAggregateMonetaryImpact > 0 && (
                <>
                  {' '}
                  — roughly{' '}
                  <span style={{ color: 'var(--accent-primary)' }}>
                    {sym}
                    {Math.round(data.dealAggregateMonetaryImpact / 1000).toLocaleString()}K
                  </span>{' '}
                  in protected expected value
                </>
              )}
              .
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              Aggregated across {data.analyzedDocCount} analyzed{' '}
              {data.analyzedDocCount === 1 ? 'document' : 'documents'} on this deal. Each scenario
              rolls up the per-analysis counterfactual using the same historical-outcome priors that
              drive the document-level panels.
            </p>
          </div>
        </div>

        {data.topScenarios.length > 0 && (
          <div
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 10,
            }}
          >
            {data.topScenarios.map(s => (
              <div
                key={s.biasRemoved}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                  }}
                >
                  <GitBranch size={11} />
                  Resolve · {formatBiasName(s.biasRemoved)}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                  }}
                >
                  +{s.expectedImprovement.toFixed(1)}pp
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {s.documentCount} doc{s.documentCount === 1 ? '' : 's'} · confidence{' '}
                  <span
                    style={{
                      color: getConfidenceColor(s.confidence),
                      fontWeight: 700,
                    }}
                  >
                    {(s.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                {s.estimatedMonetaryImpact != null && s.estimatedMonetaryImpact > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    ~{currencySymbol(s.currency)}
                    {Math.round(s.estimatedMonetaryImpact / 1000).toLocaleString()}K protected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
