/**
 * DPR Page Findings — per-bias finding cards.
 *
 * Locked 2026-05-05 (Phase 3). Each flagged bias renders as a card on its
 * own with the structural pattern from CLAUDE.md DPR architecture lock:
 *
 *   - Severity meter (5-segment) + taxonomy ID + bias label
 *   - EVIDENCE: verbatim excerpt from the source memo
 *   - HARDEN WITH: audit-committee-ready hardening question + rationale
 *   - REGULATORY: framework mapping (which regulators name this bias)
 *   - MITIGATION: recommended action
 *   - FOOT: counterfactual ROI estimate + sample size + academic anchor
 *
 * Cards are sorted by severity descending, confidence descending. The
 * findings array comes from deriveDprFindings() which joins citations +
 * regulatory mapping + counterfactual scenarios + the hardening template
 * library + (optionally) per-bias evidence/mitigation augmentation
 * supplied by the data source.
 *
 * Each card has `break-inside: avoid` so a finding never splits across
 * sheet boundaries.
 */

import { DprPageShell } from '../primitives/DprPageShell';
import { DprSection } from '../primitives/DprSection';
import { DprSeverityMeter } from '../primitives/DprSeverityMeter';
import { DprNotice } from '../primitives/DprNotice';
import type { DprFinding } from '@/lib/reports/dpr-findings';
import { scrubClientSafe } from '@/lib/reports/client-safe-scrub';
import {
  STRATEGIC_NODE_CLASS_LABEL,
  type DetectedStrategicNode,
  type StrategicNodeClass,
} from '@/lib/deliverable/strategic-nodes';

export interface DprPageFindingsProps {
  findings: DprFinding[];
  pageNumber: number;
  totalPages: number;
  classification?: 'sample' | 'specimen' | 'confidential' | 'client-safe-export';
  auditTimestamp: string;
  footerTitle?: string;
  /**
   * When true, per-bias evidence quotes get the same client-safe scrub
   * (entity / amount / person-name placeholders) the legacy PDF generator
   * applies to the meta strip + summary. Forwarded by /dpr-render/[type]/[id]
   * when the URL carries `?clientSafe=1`.
   */
  clientSafe?: boolean;
  /**
   * The cross-class attack path — structural / execution / information
   * conditions that multiply the biases into the outcome. Rendered as a
   * §5b section below the findings. Omitted when empty.
   */
  strategicExposure?: DetectedStrategicNode[];
}

export function DprPageFindings(props: DprPageFindingsProps) {
  const {
    findings,
    pageNumber,
    totalPages,
    classification = 'confidential',
    auditTimestamp,
    footerTitle = 'Decision Provenance Record',
    clientSafe = false,
    strategicExposure,
  } = props;

  const attackPath =
    strategicExposure && strategicExposure.length > 0 ? (
      <StrategicExposureSection nodes={strategicExposure} />
    ) : null;

  if (findings.length === 0) {
    return (
      <DprPageShell
        pageNumber={pageNumber}
        totalPages={totalPages}
        classification={classification}
        documentTitle={footerTitle}
        auditTimestamp={auditTimestamp}
      >
        <DprSection
          marker="§5"
          eyebrow="Findings"
          title="No biases flagged on this audit"
          strap="The audit pipeline did not flag a bias above the platform's confidence threshold on this memo. Note this is not the same as 'the memo is correct' — see §4 above for the methodological reasoning the audit relies on."
        >
          <DprNotice mark="On absence of findings">
            An audit with zero flagged biases is not the same as an audit with high confidence in
            the recommendation. The reviewer should still cross-check the memo against the
            reference-class forecast (§4.2) and the validity classification (§4.1) above.
          </DprNotice>
        </DprSection>
        {attackPath}
      </DprPageShell>
    );
  }

  return (
    <DprPageShell
      pageNumber={pageNumber}
      totalPages={totalPages}
      classification={classification}
      documentTitle={footerTitle}
      auditTimestamp={auditTimestamp}
    >
      <DprSection
        marker="§5"
        eyebrow="Findings"
        title={`${findings.length} bias${findings.length === 1 ? '' : 'es'} flagged · sorted by severity`}
        strap="Each finding below carries the verbatim evidence the audit pipeline isolated, an audit-committee-ready hardening question the reviewer can take into the next IC, the regulatory frameworks that name this bias as material, and a concrete mitigation. The reviewer's discipline is to answer every hardening question before capital commitment."
      >
        <div className="dpr-findings-stream">
          {findings.map(f => (
            <FindingCard key={f.biasType} finding={f} clientSafe={clientSafe} />
          ))}
        </div>
      </DprSection>
      {attackPath}
    </DprPageShell>
  );
}

/**
 * The cross-class attack path (§5b) — the differentiator: not just the biases,
 * but the governance STRUCTURE, deal EXECUTION pressure, and INFORMATION gaps
 * that multiplied them into the outcome, plus what the process CONCEALED from
 * the room. Ego-safe: the structure is the villain, not the person. Reuses the
 * proven dpr-finding block/label primitives so it renders on-brand.
 */
function StrategicExposureSection({ nodes }: { nodes: DetectedStrategicNode[] }) {
  const order: StrategicNodeClass[] = ['structural', 'execution', 'informational'];
  const groups = order
    .map(cls => ({ cls, items: nodes.filter(n => n.class === cls) }))
    .filter(g => g.items.length > 0);
  const concealed = nodes.filter(n => n.conceals);

  return (
    <DprSection
      marker="§5b"
      eyebrow="Strategic exposure"
      title="How these risks multiply — the attack path"
      strap="Each finding above is survivable on its own. Together with the governance, execution, and information conditions below, they form the path that turns a normal bias into a write-down — and it is the structure, not the people, that lets them compound."
    >
      <div
        className="dpr-attack-path"
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {groups.map(({ cls, items }) => (
          <div key={cls} className="dpr-finding-block">
            <div className="dpr-finding-block-label">
              <span className="dpr-finding-block-rule" />
              <span>{STRATEGIC_NODE_CLASS_LABEL[cls]}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {items.map(n => (
                <div key={n.id} style={{ breakInside: 'avoid' }}>
                  <p style={{ margin: 0 }}>
                    <strong>{n.label}.</strong> {n.amplifies}
                  </p>
                  {n.evidence ? (
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontStyle: 'italic',
                        opacity: 0.72,
                        fontSize: '0.9em',
                      }}
                    >
                      &ldquo;{n.evidence}&rdquo;
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {concealed.length > 0 ? (
        <DprNotice mark="What your process may have concealed from the room">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {concealed.slice(0, 5).map(n => (
              <li key={n.id}>{n.conceals}</li>
            ))}
          </ul>
        </DprNotice>
      ) : null}
    </DprSection>
  );
}

function FindingCard({ finding, clientSafe }: { finding: DprFinding; clientSafe: boolean }) {
  // Per-call scrub — no shared counter, since the McKinsey-grade DPR
  // doesn't surface the {entitiesMasked, amountsMasked, namesMasked}
  // telemetry block the legacy PDF generator carries (the classification
  // banner already signals "this artefact is redacted").
  const evidence = finding.evidenceQuote
    ? clientSafe
      ? scrubClientSafe(finding.evidenceQuote)
      : finding.evidenceQuote
    : null;
  const mitigation = finding.mitigation
    ? clientSafe
      ? scrubClientSafe(finding.mitigation)
      : finding.mitigation
    : null;
  return (
    <article className={`dpr-finding dpr-finding--${finding.severity}`}>
      <header className="dpr-finding-head">
        <div className="dpr-finding-head-left">
          {finding.taxonomyId && <div className="dpr-finding-taxonomy">{finding.taxonomyId}</div>}
          <h3 className="dpr-finding-title dpr-display">{finding.biasLabel}</h3>
        </div>
        <DprSeverityMeter severity={finding.severity} confidence={finding.confidence} />
      </header>

      {evidence && (
        <div className="dpr-finding-block">
          <div className="dpr-finding-block-label">
            <span className="dpr-finding-block-rule" />
            <span>Evidence from the memo</span>
          </div>
          <blockquote className="dpr-finding-evidence">&ldquo;{evidence}&rdquo;</blockquote>
        </div>
      )}

      <div className="dpr-finding-block">
        <div className="dpr-finding-block-label">
          <span className="dpr-finding-block-rule" />
          <span>Harden with</span>
        </div>
        <div className="dpr-finding-harden">
          <p className="dpr-finding-harden-question">{finding.hardenWithQuestion}</p>
          <p className="dpr-finding-harden-rationale">{finding.hardenWithRationale}</p>
        </div>
      </div>

      {finding.frameworks.length > 0 && (
        <div className="dpr-finding-block">
          <div className="dpr-finding-block-label">
            <span className="dpr-finding-block-rule" />
            <span>Regulatory mapping</span>
          </div>
          <div className="dpr-finding-regulatory">
            {finding.frameworks.map(fw => (
              <div key={fw.id} className="dpr-finding-framework">
                <span className="dpr-finding-framework-name">{fw.name}</span>
                <span className="dpr-finding-framework-provisions">
                  {fw.provisions.join(' · ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mitigation && (
        <div className="dpr-finding-block">
          <div className="dpr-finding-block-label">
            <span className="dpr-finding-block-rule" />
            <span>Mitigation</span>
          </div>
          <div className="dpr-finding-mitigation">{mitigation}</div>
        </div>
      )}

      <div className="dpr-finding-foot">
        <span>
          {finding.expectedImprovementPct != null && (
            <>
              <span className="dpr-finding-foot-key">Counterfactual:</span> +
              {finding.expectedImprovementPct.toFixed(1)}% verdict if addressed
              {finding.counterfactualSampleSize != null && (
                <> · n={finding.counterfactualSampleSize}</>
              )}
            </>
          )}
        </span>
        <span style={{ textAlign: 'right', flex: 1 }}>
          {finding.taxonomyId && (
            <>
              <span className="dpr-finding-foot-key">Taxonomy:</span> {finding.taxonomyId}
            </>
          )}
        </span>
      </div>

      {finding.academicAnchor && (
        <p className="dpr-finding-citation" style={{ marginTop: 8 }}>
          {finding.academicAnchor}
          {finding.doi && ` · doi:${finding.doi}`}
        </p>
      )}
    </article>
  );
}
