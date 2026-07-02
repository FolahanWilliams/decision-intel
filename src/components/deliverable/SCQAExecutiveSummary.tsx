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

import { EyeOff, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { SCQAExecutiveSummary as SCQAType } from '@/lib/deliverable/types';
import type { QuantifiedExposure } from '@/lib/deliverable/quantified-exposure';
import { formatExposureLabel } from '@/lib/deliverable/valueAtStake';
import type { StructuralFragility } from '@/lib/deliverable/fragility-index';
import { FRAGILITY_BAND_LABEL } from '@/lib/deliverable/fragility-index';
import { RESILIENCE_DIMENSION_LABEL } from '@/lib/deliverable/resilience-signature';
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

      {/* Blind-audit badge (2026-07-02) — the credibility marker for retros.
          The HONEST claim, verbatim from the lock: live retrieval was
          disabled and every finding derives from this document alone —
          never "the model could not have known". */}
      {cover.blindAudit ? <BlindAuditBadge /> : null}

      {/* Degraded-run honesty strip (2026-07-02) — a detector ERRORED this
          run; the outage must never read as a clean result. */}
      {cover.degradedNodes && cover.degradedNodes.length > 0 ? (
        <DegradedRunStrip nodes={cover.degradedNodes} />
      ) : null}

      {/* Actuarial top-line — what this audit is worth. The value statement
          that makes a buyer bite: ~$X exposure surfaced, the derivation, the
          precedent. Honest — deal size × a cited base rate, never "we saved you". */}
      {cover.quantifiedExposure ? (
        <QuantifiedExposureBanner exposure={cover.quantifiedExposure} />
      ) : null}

      {/* Structural fragility — the SECOND AXIS (2026-07-02). The DQI says how
          BOLD this is (risk density); this says whether the boldness CASCADES
          or is ABSORBED. The risk × fragility framing is the discrimination a
          single score can't produce. Display-only — never feeds the DQI. */}
      {cover.structuralFragility ? (
        <StructuralFragilityBanner
          fragility={cover.structuralFragility}
          dqiScore={cover.dqi.score}
        />
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

/**
 * The tiny blind-audit credibility card (2026-07-02, founder-requested).
 * Sent alongside the deliverable, this is the evidence marker that the
 * engine found what it found from the document alone. The wording is the
 * locked honesty boundary verbatim: "live retrieval disabled", never
 * "the model could not have known" (training memory can't be switched off).
 */
function BlindAuditBadge() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid color-mix(in srgb, var(--info, #4F46E5) 30%, transparent)',
        background: 'color-mix(in srgb, var(--info, #4F46E5) 6%, transparent)',
      }}
    >
      <EyeOff size={15} style={{ color: 'var(--info, #4F46E5)', flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary, #475569)' }}>
        <strong style={{ color: 'var(--info, #4F46E5)' }}>Blind audit.</strong> Live retrieval
        (news, market data, web search, price feeds) was disabled for this run. Every finding
        derives from this document&apos;s own language and pre-existing decision-science patterns —
        no post-dated information was retrievable.
      </div>
    </div>
  );
}

/** A load-bearing detector ERRORED this run — surface it on the cover so
 *  the outage can never read as a clean result (2026-07-02). */
function DegradedRunStrip({ nodes }: { nodes: string[] }) {
  const NODE_LABEL: Record<string, string> = {
    biasDetective: 'bias detection',
    verification: 'claim verification',
  };
  const labels = nodes.map(n => NODE_LABEL[n] ?? n).join(' + ');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid color-mix(in srgb, var(--warning, #d97706) 35%, transparent)',
        background: 'color-mix(in srgb, var(--warning, #d97706) 7%, transparent)',
      }}
    >
      <TriangleAlert
        size={15}
        style={{ color: 'var(--warning, #d97706)', flexShrink: 0, marginTop: 1 }}
      />
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary, #475569)' }}>
        <strong style={{ color: 'var(--warning, #d97706)' }}>Partial coverage:</strong> {labels} was
        unavailable this run due to a model-provider error. Findings from the other modules are
        unaffected. Re-run the audit for full coverage.
      </div>
    </div>
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

const FRAGILITY_ACCENT: Record<
  StructuralFragility['band'],
  { bg: string; fg: string; border: string }
> = {
  absorbing: { bg: '#F0FDF4', fg: '#15803D', border: '#BBF7D0' },
  mixed: { bg: '#FEFCE8', fg: '#A16207', border: '#FDE68A' },
  fragile: { bg: '#FFF7ED', fg: '#C2410C', border: '#FED7AA' },
  avalanche_zone: { bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA' },
};

/**
 * Structural fragility — the SECOND AXIS (2026-07-02). The DQI measures risk
 * density (how bold); this measures whether a shock CASCADES or is ABSORBED.
 * Credits the resilience the engine used to ignore (staging, reserves, exits)
 * and names the missing circuit-breakers as the actionable "make it survivable".
 * Honest boundary: it reads the STRUCTURE (snowpack), never the TRIGGER
 * (snowflake — execution / an exogenous shock no ex-ante audit can see).
 */
function StructuralFragilityBanner({
  fragility,
  dqiScore,
}: {
  fragility: StructuralFragility;
  dqiScore: number;
}) {
  const c = FRAGILITY_ACCENT[fragility.band] ?? FRAGILITY_ACCENT.mixed;
  const bold = dqiScore < 55; // a low DQI = high risk density (a bold bet)
  const missing = fragility.missingResilience.slice(0, 4);
  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        background: c.bg,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: c.fg,
          }}
        >
          Structural fragility
        </span>
        <span style={{ fontSize: 19, fontWeight: 800, color: c.fg }}>
          {FRAGILITY_BAND_LABEL[fragility.band]}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted, #64748B)' }}>
          · {fragility.index}/100
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--text-secondary, #475569)',
        }}
      >
        {fragility.headline}
      </p>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--text-muted, #64748B)' }}>
        The DQI measures <strong>risk density</strong> — how bold and unvalidated this bet is. This
        second axis measures whether a shock would <strong>cascade or be absorbed</strong>.
        {bold
          ? ' A bold bet is not the danger; a bold bet with no staging, reserve, or exit is.'
          : ''}{' '}
        We read the structure (the snowpack), not the trigger (the snowflake — execution or an
        exogenous shift no ex-ante audit can see).
      </p>
      {fragility.resilienceMarkers.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', fontWeight: 700 }}>
            Absorbs shocks:
          </span>
          {fragility.resilienceMarkers.map(m => (
            <span
              key={m.id}
              title={m.absorbs}
              style={{
                fontSize: 11,
                padding: '2px 9px',
                borderRadius: 999,
                background: '#F0FDF4',
                color: '#15803D',
                border: '1px solid #BBF7D0',
              }}
            >
              {m.label}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 11, color: '#B91C1C', margin: 0 }}>
          <strong>Absorbs shocks:</strong> None detected — no staging, kill-trigger, reserve, or
          disconfirmation loop. Confidence is not a circuit-breaker.
        </p>
      )}
      {missing.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted, #64748B)', fontWeight: 700 }}>
            Would make it survivable:
          </span>
          {missing.map(d => (
            <span
              key={d}
              style={{
                fontSize: 11,
                padding: '2px 9px',
                borderRadius: 999,
                background: 'var(--bg-secondary, #F8FAFC)',
                color: 'var(--text-secondary, #475569)',
                border: '1px dashed var(--border-color, #E2E8F0)',
              }}
            >
              {RESILIENCE_DIMENSION_LABEL[d]}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
