/**
 * DPR Page Engagement Appendix — fractional CSO persona only.
 *
 * Locked 2026-05-10 (Item 3 of the 2,3,4 wedge ship). When the audit's
 * user is a Phase 1 HXC fractional CSO running 3-5 client engagements,
 * this appendix surfaces (a) per-engagement aggregates so the audit
 * lands in the context of THE CLIENT (not just the document), and (b)
 * an anonymized cohort comparison so the CSO sees how this client's
 * account stacks against their other engagements.
 *
 * Persona-gated: rendered only when ProvenanceRecordData.engagementAppendix
 * is non-undefined. Every other audit shape gets undefined and the
 * dpr-render route skips the page entirely. The cover totalPages reflects
 * conditional rendering.
 *
 * Why targetCompany as the engagement key: existing free-text field on
 * Container — no schema migration needed for the Phase 1 wedge.
 *
 * Visual discipline: same DprPageShell + DprSection + DprStatGrid pattern
 * as the rest of the DPR. Severity-led palette per CLAUDE.md DPR colour
 * lock (bright red for critical, bright blue for high, amber for medium,
 * restrained green for low). Cohort comparison uses anonymous "Engagement
 * A / B / C" labels so the appendix can travel to the client without
 * leaking other client identities.
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprStatCard, DprStatGrid } from '../primitives/DprStatCard';
import type { EngagementAppendix } from '@/lib/reports/provenance-record-data';

export interface DprPageEngagementAppendixProps {
  appendix: EngagementAppendix;
  pageNumber: number;
  totalPages: number;
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  auditTimestamp: string;
  footerTitle?: string;
}

const SEVERITY_LABEL: Record<EngagementAppendix['recurringBiases'][number]['severity'], string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const SEVERITY_TONE: Record<EngagementAppendix['recurringBiases'][number]['severity'], string> = {
  critical: 'var(--dpr-severity-critical)',
  high: 'var(--dpr-severity-high)',
  medium: 'var(--dpr-severity-medium)',
  low: 'var(--dpr-severity-low)',
};

const BENCHMARK_COPY: Record<
  EngagementAppendix['cohortComparison']['benchmarkLabel'],
  { label: string; description: string }
> = {
  above: {
    label: 'Above your other engagements',
    description:
      "This client's average DQI is at least 5 points above the average of your other active engagements.",
  },
  in_line: {
    label: 'In line with your other engagements',
    description:
      "This client's average DQI is within 5 points of your other engagements — typical for your practice.",
  },
  below: {
    label: 'Below your other engagements',
    description:
      "This client's average DQI is at least 5 points below your other engagements — surface this in the next quarterly review.",
  },
  cannot_assess: {
    label: 'No cohort yet',
    description:
      "We don't have enough closed audits across your other engagements to benchmark this one yet.",
  },
};

export function DprPageEngagementAppendix(props: DprPageEngagementAppendixProps) {
  const {
    appendix,
    pageNumber,
    totalPages,
    classification = 'confidential',
    auditTimestamp,
    footerTitle = 'Decision Provenance Record',
  } = props;

  const dqiDisplay = appendix.averageDqi != null ? Math.round(appendix.averageDqi).toString() : '—';
  const dqiBandDisplay = appendix.averageDqiBand ?? '—';
  const cohortDqiDisplay =
    appendix.cohortComparison.averageDqiAcrossOtherEngagements != null
      ? Math.round(appendix.cohortComparison.averageDqiAcrossOtherEngagements).toString()
      : '—';
  const benchmark = BENCHMARK_COPY[appendix.cohortComparison.benchmarkLabel];
  const timespanText =
    appendix.timespanDays != null
      ? appendix.timespanDays === 0
        ? 'Single decision'
        : `${appendix.timespanDays}-day arc`
      : '—';

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      <DprSection
        marker="§8"
        eyebrow="Engagement appendix"
        title={`This audit in the context of your ${appendix.engagementName} engagement`}
        strap="Per-engagement aggregates and an anonymized cohort comparison against your other active engagements. Surfaced because your account is configured as a fractional Chief Strategy Officer running multiple client engagements; the appendix lets the audit land in the context of THE CLIENT, not just this document."
      >
        <DprStatGrid layout="four">
          <DprStatCard
            label="Decisions in engagement"
            value={appendix.decisionCount.toString()}
            foot={
              appendix.analyzedDecisionCount > 0
                ? `${appendix.analyzedDecisionCount} fully audited`
                : 'No audits yet'
            }
          />
          <DprStatCard
            label="Average DQI"
            value={dqiDisplay}
            foot={`Grade band ${dqiBandDisplay}`}
          />
          <DprStatCard
            label="Engagement timespan"
            value={timespanText}
            text
            foot={
              appendix.timespanDays != null && appendix.timespanDays >= 90
                ? 'Multi-quarter relationship'
                : 'Recent engagement'
            }
          />
          <DprStatCard
            label="Cohort benchmark"
            value={benchmark.label}
            text
            foot={`Cohort avg ${cohortDqiDisplay} across ${appendix.cohortComparison.otherEngagementCount} other engagement${
              appendix.cohortComparison.otherEngagementCount === 1 ? '' : 's'
            }`}
          />
        </DprStatGrid>
      </DprSection>

      {appendix.recurringBiases.length > 0 && (
        <DprSection
          marker="§8.1"
          eyebrow="Recurring biases on this account"
          title="What's repeating across this client's decisions"
          strap="The biases that fired on more than one decision in this engagement. Bring these to the client's quarterly review — these are the patterns the platform expects to keep firing on this account unless the underlying process changes."
        >
          <table className="dpr-engagement-bias-table">
            <thead>
              <tr>
                <th>Bias pattern</th>
                <th>Severity</th>
                <th>Documents</th>
                <th>Total occurrences</th>
              </tr>
            </thead>
            <tbody>
              {appendix.recurringBiases.map(b => (
                <tr key={b.biasType}>
                  <td className="dpr-engagement-bias-table-name">{b.biasLabel}</td>
                  <td>
                    <span
                      className="dpr-engagement-bias-table-pill"
                      style={{ background: SEVERITY_TONE[b.severity] }}
                    >
                      {SEVERITY_LABEL[b.severity]}
                    </span>
                  </td>
                  <td className="dpr-mono">{b.documentCount}</td>
                  <td className="dpr-mono">{b.occurrenceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DprSection>
      )}

      <DprSection
        marker="§8.2"
        eyebrow="Cohort comparison"
        title="How this engagement stacks against your other clients"
        strap={benchmark.description}
      >
        {appendix.cohortComparison.anonymizedTopOthers.length > 0 ? (
          <table className="dpr-engagement-cohort-table">
            <thead>
              <tr>
                <th>Engagement</th>
                <th>Decisions</th>
                <th>Average DQI</th>
              </tr>
            </thead>
            <tbody>
              <tr className="dpr-engagement-cohort-self">
                <td>
                  <strong>This engagement</strong>{' '}
                  <span className="dpr-engagement-cohort-self-name">
                    ({appendix.engagementName})
                  </span>
                </td>
                <td className="dpr-mono">{appendix.decisionCount}</td>
                <td className="dpr-mono">{dqiDisplay}</td>
              </tr>
              {appendix.cohortComparison.anonymizedTopOthers.map(other => (
                <tr key={other.label}>
                  <td>{other.label}</td>
                  <td className="dpr-mono">{other.decisionCount}</td>
                  <td className="dpr-mono">
                    {other.averageDqi != null ? Math.round(other.averageDqi).toString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="dpr-engagement-cohort-empty">
            You don&rsquo;t have other engagements on file yet. The cohort comparison fills in once
            you have at least one other client with at least one analyzed decision.
          </p>
        )}
      </DprSection>

      <p className="dpr-engagement-footnote">
        Generated for: fractional Chief Strategy Officer (Phase 1 HXC persona). Cohort labels
        anonymized so this appendix can travel to the client without disclosing the identity of your
        other engagements. Engagement key: <code>Container.targetCompany</code>. Audit timestamp:{' '}
        {auditTimestamp.slice(0, 19).replace('T', ' ')} UTC.
      </p>
    </DprPageShell>
  );
}
