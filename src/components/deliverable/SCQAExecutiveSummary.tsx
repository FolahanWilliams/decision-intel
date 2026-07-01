/**
 * SCQAExecutiveSummary — the deliverable's apex cover.
 * Locked 2026-05-20 from DR §5 (Pyramid Principle, SCQA narrative
 * framework — Situation → Complication → Question → Answer).
 *
 * This is the strongest sentence in the artefact. The action title
 * sits at the very top. SCQA fields render below in a compact 2-col
 * grid. The DQI gauge anchors the right column with the grade band.
 *
 * Procurement-grade signal: every fact on this surface is anchored to
 * a real underlying field. No fabrication. No vague metrics.
 */

'use client';

import { ShieldCheck } from 'lucide-react';
import type { SCQAExecutiveSummary as SCQAType } from '@/lib/deliverable/types';
import type { QuantifiedExposure } from '@/lib/deliverable/quantified-exposure';
import { formatExposureLabel } from '@/lib/deliverable/valueAtStake';
import { ActionTitle } from './ActionTitle';
import { DqiRadialGauge } from './charts/DqiRadialGauge';

interface SCQAExecutiveSummaryProps {
  cover: SCQAType;
  /** Optional primary CTA pinned to the cover. The DR §9
   *  single-CTA discipline applies on /demo; can be omitted on
   *  in-product surfaces. */
  primaryCta?: { label: string; onClick: () => void };
  /** Optional eyebrow above the action title (e.g. "AUDIT DELIVERABLE"). */
  eyebrow?: string;
}

export function SCQAExecutiveSummary({
  cover,
  primaryCta,
  eyebrow = 'Audit deliverable',
}: SCQAExecutiveSummaryProps) {
  return (
    <section
      style={{
        background: 'var(--bg-card, #FFFFFF)',
        border: '1px solid var(--border-color, #E2E8F0)',
        borderRadius: 16,
        padding: '24px 28px 22px',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Top row — action title + real radial DQI gauge */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 24,
          alignItems: 'center',
        }}
        className="scqa-top-row"
      >
        <ActionTitle variant="cover" eyebrow={eyebrow}>
          {cover.actionTitle}
        </ActionTitle>

        {/* Real radial-arc DQI gauge — score plotted along a 270° arc
            with severity bands as the track background. Replaces the
            prior circle-with-a-number per the 2026-05-20 visual rebuild. */}
        <DqiRadialGauge score={cover.dqi.score} size={180} />
      </div>

      {/* Actuarial top-line — what this audit is worth. The value statement
          that makes a buyer bite: ~$X exposure surfaced, the derivation, the
          precedent. Honest — deal size × a cited base rate, never "we saved you". */}
      {cover.quantifiedExposure ? (
        <QuantifiedExposureBanner exposure={cover.quantifiedExposure} />
      ) : null}

      {/* SCQA 4-line grid — the Pyramid apex narrative */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          rowGap: 8,
          columnGap: 14,
          alignItems: 'baseline',
          fontSize: 13.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary, #475569)',
          padding: '14px 16px',
          background: 'var(--bg-secondary, #F8FAFC)',
          borderRadius: 10,
          border: '1px solid var(--border-color, #E2E8F0)',
        }}
      >
        <SCQALabel>Situation</SCQALabel>
        <div>{cover.situation}</div>
        <SCQALabel>Complication</SCQALabel>
        <div>{cover.complication}</div>
        <SCQALabel>Question</SCQALabel>
        <div>{cover.question}</div>
        <SCQALabel emphasis>Answer</SCQALabel>
        <div style={{ color: 'var(--text-primary, #0F172A)', fontWeight: 600 }}>{cover.answer}</div>
      </div>

      {/* Optional single CTA — DR Choice Paradox discipline (one
          conversion path per surface). The in-product views may omit
          this entirely. */}
      {primaryCta ? (
        <button
          type="button"
          onClick={primaryCta.onClick}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 22px',
            background: 'var(--accent-primary, #16A34A)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            fontSize: 14.5,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
          }}
        >
          <ShieldCheck size={16} />
          {primaryCta.label}
        </button>
      ) : null}
    </section>
  );
}

function SCQALabel({
  children,
  emphasis = false,
}: {
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: emphasis ? 'var(--accent-primary, #16A34A)' : 'var(--text-muted, #64748B)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

/**
 * The actuarial top-line — the Taktile "here is what this audit is worth"
 * statement. Honest by construction: deal size × a CITED base rate; framed as
 * "exposure surfaced / the committee would carry uncaught", never "we saved you
 * $X" (a causal overclaim). Null-safe — only renders when a ticket is present.
 */
function QuantifiedExposureBanner({ exposure }: { exposure: QuantifiedExposure }) {
  const money = (amount: number) =>
    formatExposureLabel({
      exposureAmount: amount,
      ticketAmount: exposure.ticketAmount,
      ticketCurrency: exposure.currency,
      baseRateSource: exposure.baseRateSource,
    });
  const p = exposure.precedent;
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--border-color, #E2E8F0)',
        borderLeft: '4px solid var(--severity-high, #ef4444)',
        background: 'var(--bg-secondary, #F8FAFC)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted, #64748B)',
        }}
      >
        What this audit surfaces
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: 'var(--severity-high, #ef4444)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          ~{money(exposure.exposureAmount)}
        </span>
        <span style={{ fontSize: 13.5, color: 'var(--text-secondary, #475569)' }}>
          of capital exposure the committee would otherwise carry, uncaught.
        </span>
      </div>
      <p
        style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted, #64748B)', lineHeight: 1.5 }}
      >
        On this {money(exposure.ticketAmount)} decision, the{' '}
        <strong style={{ color: 'var(--text-primary, #0F172A)' }}>{exposure.drivingLabel}</strong>{' '}
        pattern this audit flagged carries an ~{exposure.baseRatePct}% historical miss rate across
        comparable decisions ({exposure.baseRateSource}).
        {p ? (
          <>
            {' '}
            Precedent: <strong>{p.company}</strong> ({p.year}) · {p.estimatedImpact}.
          </>
        ) : null}
      </p>
    </div>
  );
}
