/**
 * DemoDeliverableHost — /demo-specific wrapper around AuditDeliverable.
 *
 * Renders the interactive McKinsey-grade deliverable on /demo with:
 *   - SCQA cover (Pyramid apex) + 5 MECE buckets
 *   - Single primary CTA pinned to the cover (DR Choice Paradox)
 *   - Async LLM-action-title fetch with deterministic fallback always
 *     visible immediately
 *   - "This audit expires in 24h" loss-aversion strap below the
 *     deliverable for the warm-DM-traffic conversion ask
 *
 * The deliverable composes from the typed AnalysisResult via the pure
 * buildAuditDeliverable function. LLM titles arrive (when they arrive)
 * via the /api/audit/action-titles endpoint and re-compose the
 * deliverable in-place. Templates ALWAYS render first; LLM variation
 * is icing.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, BookmarkPlus, ArrowRight } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { AuditDeliverable } from '@/components/deliverable/AuditDeliverable';
import { buildAuditDeliverable } from '@/lib/deliverable/buildAuditDeliverable';
import { buildSaveAuditHref } from '@/lib/utils/demo-claim-url';
import { trackEvent } from '@/lib/analytics/track';
import { ReferralAffordanceCard } from '@/components/referral/ReferralAffordanceCard';

interface DemoDeliverableHostProps {
  documentId: string;
  analysisId: string | null;
  result: AnalysisResult;
  ticket?: { amount: number; currency: 'USD' | 'GBP' | 'EUR' };
}

interface ActionTitleResponse {
  cover: string;
  reasoningRisks: string;
  stressTest: string;
  historicalAnalogs: string;
  counterfactuals: string;
  provenance: string;
  source?: Record<string, 'llm' | 'template'>;
}

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate200: '#E2E8F0',
  slate500: '#64748B',
  slate600: '#475569',
  slate900: '#0F172A',
  green: '#16A34A',
  amber: '#D97706',
};

export function DemoDeliverableHost({
  documentId,
  analysisId,
  result,
  ticket,
}: DemoDeliverableHostProps) {
  const [llmTitles, setLlmTitles] = useState<Partial<ActionTitleResponse> | null>(null);

  // Stabilise the ticket so the LLM-title effect below keys on its VALUE, not
  // its identity. The parent passes a fresh `{ amount, currency }` literal every
  // render; without this, supplying a ticket re-fires the effect → setLlmTitles →
  // re-render → new ticket object → infinite refetch of /api/audit/action-titles
  // (until it 429s) + action-title flicker. Reconstructed from primitives so the
  // memo + the effect deps stay exhaustive-deps-clean.
  const ticketAmount = ticket?.amount ?? null;
  const ticketCurrency = ticket?.currency ?? null;
  const stableTicket = useMemo(
    () =>
      ticketAmount !== null && ticketCurrency
        ? { amount: ticketAmount, currency: ticketCurrency }
        : undefined,
    [ticketAmount, ticketCurrency]
  );

  // Compose deliverable WITH the LLM titles when available; otherwise
  // the deterministic templates render. The composer falls back per-key
  // when an action-title is missing — guaranteed always valid.
  const deliverable = buildAuditDeliverable(result, {
    documentId,
    analysisId,
    ticket: stableTicket,
    actionTitles: llmTitles ?? undefined,
  });

  // Async LLM augmentation. Falls back silently on any failure.
  useEffect(() => {
    let cancelled = false;
    async function fetchTitles() {
      try {
        const res = await fetch('/api/audit/action-titles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result, documentId, analysisId, ticket: stableTicket }),
        });
        if (!res.ok) return;
        // canonical res.json() body-parse exception class — falls back to templates
        const data = (await res.json().catch(() => null)) as ActionTitleResponse | null;
        if (!cancelled && data) setLlmTitles(data);
      } catch {
        // canonical fire-and-forget exception class — templates already render
      }
    }
    fetchTitles();
    return () => {
      cancelled = true;
    };
  }, [result, documentId, analysisId, stableTicket]);

  const saveAuditHref = buildSaveAuditHref({ analysisId, documentId });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <AuditDeliverable
        deliverable={deliverable}
        mode="demo"
        primaryCta={{
          label: 'Audit your next memo with the team',
          onClick: () => {
            trackEvent('demo_primary_cta_clicked', {
              analysisId: analysisId ?? undefined,
              documentId,
              placement: 'deliverable_cover',
              cta: 'book_call',
            });
            // Canonical booking destination (mirrors BookDemoCTA): Calendly when
            // configured, else the design-partner pricing anchor. The prior
            // '/contact' target was a 404 — a dead primary CTA at peak intent.
            window.open(
              process.env.NEXT_PUBLIC_DEMO_BOOKING_URL ?? '/pricing#design-partner',
              '_blank',
              'noopener,noreferrer'
            );
          },
        }}
      />

      {/* Save-audit loss-aversion strap — the secondary path for visitors
          who came in cold + want to keep the audit in their own account
          instead of booking a call. Lives below the deliverable so the
          single primary CTA on the cover stays uncontested per DR §9. */}
      <section
        style={{
          background: C.white,
          border: `1px solid ${C.slate200}`,
          borderRadius: 12,
          padding: '18px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: '1 1 280px' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={15} style={{ color: C.amber }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.slate900,
                lineHeight: 1.4,
                marginBottom: 2,
              }}
            >
              This audit expires in 24 hours
            </div>
            <div style={{ fontSize: 12, color: C.slate500, lineHeight: 1.5 }}>
              Free account keeps the deliverable + unlocks the Analyst view, every drill-down, and
              the full DPR PDF.
            </div>
          </div>
        </div>
        <Link
          href={saveAuditHref}
          onClick={() =>
            trackEvent('demo_save_audit_clicked', {
              analysisId: analysisId ?? undefined,
              documentId,
              claimFlow: 'enabled',
              placement: 'deliverable_save_strap',
            })
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 13.5,
            fontWeight: 700,
            background: C.slate900,
            color: C.white,
            padding: '10px 18px',
            borderRadius: 10,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <BookmarkPlus size={14} /> Save this audit
          <ArrowRight size={14} />
        </Link>
      </section>

      {/* Referral affordance — anonymous visitors get a copy-share-link
          flow for forwarding the demo to a colleague. Unchanged from
          the legacy PasteAuditResults flow. */}
      <ReferralAffordanceCard
        userId={null}
        analysisId={analysisId}
        source="demo_deliverable_post_reveal"
      />
    </div>
  );
}
