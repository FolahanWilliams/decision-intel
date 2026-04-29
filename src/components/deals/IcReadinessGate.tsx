'use client';

/**
 * IcReadinessGate — A2/S7 lock 2026-04-29.
 *
 * Computes a per-deal "IC readiness" score from the existing deal-detail
 * payload and renders five binary gates plus an aggregate readiness %.
 * The gates map to the dimensions an M&A persona (Adaeze) said justify
 * the subscription on their own:
 *
 *   1. Required documents present (CIM + financial model + IC memo + DD
 *      report). Configurable per dealType — VC deals don't always carry
 *      a CIM; secondary deals don't carry a DD report.
 *   2. All documents analyzed (status === 'analyzed', no failures).
 *   3. Composite DQI ≥ 60 (the canonical D/C grade boundary in
 *      src/lib/scoring/dqi.ts → GRADE_THRESHOLDS).
 *   4. Cross-reference run completed without unresolved high-severity
 *      conflicts.
 *   5. IC date set (Deal.icDate populated — added in this same batch).
 *
 * The aggregate is the unweighted percentage of gates passed (0/5 = 0%,
 * 5/5 = 100%). The gate is INFORMATIONAL — it doesn't BLOCK uploading
 * to the IC, just surfaces what's missing so a deal team doesn't walk
 * in unprepared.
 *
 * Forward-looking rule: when a new dimension matters (e.g. blind-prior
 * vote complete, counterfactual ROI computed), add a new GATES entry
 * + bump the description in the lock entry above. Don't over-fit the
 * gate to a single deal type — keep the dimensions universal.
 */

import { CheckCircle2, Circle, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import type { DealDetail } from '@/types/deals';
import { extractCrossReferenceFindings } from '@/lib/utils/deal-cross-reference';

interface IcReadinessGateProps {
  deal: DealDetail;
}

interface Gate {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  /** Short hint when the gate is failing — what to do to clear it. */
  remediation?: string;
}

// Per-deal-type required document set. The intersection of "what
// every IC for this deal type needs in writing" — kept conservative
// so the gate doesn't yell at users for missing docs they don't need.
//
// `ic_memo` is required for every deal type — that's the artefact the
// IC actually reads. Other types vary: a secondary's IC doesn't need
// a CIM (already-public asset); a venture deal's IC doesn't always
// carry a financial model.
const REQUIRED_DOCS_BY_DEAL_TYPE: Record<string, string[]> = {
  buyout: ['ic_memo', 'cim', 'due_diligence'],
  growth_equity: ['ic_memo', 'cim', 'due_diligence'],
  venture: ['ic_memo', 'pitch_deck'],
  secondary: ['ic_memo', 'term_sheet'],
  add_on: ['ic_memo', 'due_diligence'],
  recapitalization: ['ic_memo', 'due_diligence'],
};

const DOC_TYPE_LABELS: Record<string, string> = {
  ic_memo: 'IC memo',
  cim: 'CIM / target profile',
  pitch_deck: 'Pitch deck',
  term_sheet: 'Term sheet',
  due_diligence: 'DD report',
  board_memo: 'Board memo',
};

function computeGates(deal: DealDetail): Gate[] {
  const documents = deal.documents ?? [];
  const docTypes = new Set(
    documents.map(d => d.documentType).filter((t): t is string => !!t)
  );

  // Gate 1: required document set for this deal type
  const requiredDocs = REQUIRED_DOCS_BY_DEAL_TYPE[deal.dealType] ?? ['ic_memo'];
  const missingDocs = requiredDocs.filter(t => !docTypes.has(t));
  const docsPassed = missingDocs.length === 0;

  // Gate 2: every document analyzed (no failures, none pending)
  const allAnalyzed =
    documents.length > 0 && documents.every(d => d.status === 'analyzed');

  // Gate 3: composite DQI clears the C-grade threshold (55+).
  const composite = deal.aggregation?.compositeDqi ?? null;
  const dqiPassed = composite !== null && composite >= 55;

  // Gate 4: cross-reference complete + no unresolved high-severity findings
  const findings = extractCrossReferenceFindings(deal.crossReference);
  const highSeverityUnresolved = findings.filter(
    f => f.severity === 'high' || f.severity === 'critical'
  ).length;
  const crossRefPassed =
    deal.crossReference?.status === 'complete' && highSeverityUnresolved === 0;

  // Gate 5: IC date scheduled
  const icDatePassed = !!deal.icDate;

  return [
    {
      id: 'required_docs',
      label: 'Required documents present',
      description: docsPassed
        ? `${requiredDocs.length} of ${requiredDocs.length} required document types uploaded`
        : `Missing: ${missingDocs.map(t => DOC_TYPE_LABELS[t] ?? t).join(', ')}`,
      passed: docsPassed,
      remediation: docsPassed
        ? undefined
        : 'Upload and tag the missing types from the deal page.',
    },
    {
      id: 'all_analyzed',
      label: 'Every document analyzed',
      description:
        documents.length === 0
          ? 'No documents uploaded yet'
          : allAnalyzed
            ? `All ${documents.length} documents have a completed analysis`
            : `${documents.filter(d => d.status === 'analyzed').length} of ${documents.length} analyzed; the rest are pending or failed`,
      passed: allAnalyzed,
      remediation: allAnalyzed
        ? undefined
        : 'Re-run analysis on pending or failed documents.',
    },
    {
      id: 'dqi_threshold',
      label: 'Composite DQI ≥ 55 (C grade)',
      description:
        composite === null
          ? 'No composite DQI computed yet'
          : `Composite DQI ${Math.round(composite)} ${
              dqiPassed ? '· clears the C-grade threshold' : '· below the C-grade threshold'
            }`,
      passed: dqiPassed,
      remediation: dqiPassed
        ? undefined
        : 'Address the highest-severity biases on the lowest-scoring documents.',
    },
    {
      id: 'cross_reference',
      label: 'Cross-doc conflicts resolved',
      description:
        deal.crossReference?.status === 'complete'
          ? highSeverityUnresolved === 0
            ? `Cross-reference clean (${findings.length} finding${findings.length === 1 ? '' : 's'} reviewed)`
            : `${highSeverityUnresolved} high-severity finding${highSeverityUnresolved === 1 ? '' : 's'} unresolved`
          : 'Cross-reference scan not yet run',
      passed: crossRefPassed,
      remediation: crossRefPassed
        ? undefined
        : 'Run the cross-reference scan and resolve high-severity findings.',
    },
    {
      id: 'ic_date',
      label: 'IC review date scheduled',
      description: deal.icDate
        ? `IC review on ${new Date(deal.icDate).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}`
        : 'No IC date on the deal',
      passed: icDatePassed,
      remediation: icDatePassed
        ? undefined
        : 'Set an IC review date so the platform can sequence the readiness countdown.',
    },
  ];
}

export function IcReadinessGate({ deal }: IcReadinessGateProps) {
  const gates = computeGates(deal);
  const passedCount = gates.filter(g => g.passed).length;
  const readinessPct = Math.round((passedCount / gates.length) * 100);

  // Bar accent + headline by readiness band — mirrors the DQI grade
  // colour scale so users read the gate consistently with other surfaces.
  const accent =
    readinessPct >= 80
      ? 'var(--success)'
      : readinessPct >= 60
        ? 'var(--info)'
        : readinessPct >= 40
          ? 'var(--warning)'
          : 'var(--error)';
  const headline =
    readinessPct >= 80
      ? 'IC-ready'
      : readinessPct >= 60
        ? 'Mostly ready · address the gaps'
        : readinessPct >= 40
          ? 'Not yet ready · several gates open'
          : 'Early stage · most gates open';

  // IC countdown — only shown when an icDate is set; mirrors the
  // kanban-card chip vocabulary so the language is consistent.
  let countdown: string | null = null;
  if (deal.icDate) {
    const target = new Date(deal.icDate);
    if (!Number.isNaN(target.getTime())) {
      const dayMs = 24 * 60 * 60 * 1000;
      const targetDay = new Date(
        target.getFullYear(),
        target.getMonth(),
        target.getDate()
      ).getTime();
      const now = new Date();
      const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const days = Math.round((targetDay - todayDay) / dayMs);
      if (days === 0) countdown = 'IC today';
      else if (days === 1) countdown = 'IC tomorrow';
      else if (days > 0) countdown = `${days} days until IC`;
      else countdown = `${Math.abs(days)} days post-IC`;
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: 16,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: accent,
            }}
          >
            IC Readiness · {readinessPct}%
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{headline}</span>
        </div>
        {countdown && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <Calendar size={11} />
            {countdown}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          background: 'var(--bg-secondary)',
          borderRadius: 2,
          overflow: 'hidden',
          margin: '6px 0 12px 0',
        }}
      >
        <div
          style={{
            width: `${readinessPct}%`,
            height: '100%',
            background: accent,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Gate list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {gates.map(gate => (
          <div
            key={gate.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '6px 0',
            }}
          >
            <span
              style={{
                color: gate.passed ? 'var(--success)' : 'var(--text-muted)',
                marginTop: 2,
                flexShrink: 0,
              }}
            >
              {gate.passed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: gate.passed ? 'var(--text-primary)' : 'var(--text-primary)',
                }}
              >
                {gate.label}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginTop: 1,
                }}
              >
                {gate.description}
              </div>
              {!gate.passed && gate.remediation && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: accent,
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  <ChevronRight size={11} />
                  {gate.remediation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {readinessPct < 100 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            padding: '8px 10px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <AlertCircle size={11} style={{ color: 'var(--text-muted)' }} />
          Gates are advisory — they don&rsquo;t block IC submission, just surface what a
          procurement-grade reader would catch.
        </div>
      )}
    </div>
  );
}
