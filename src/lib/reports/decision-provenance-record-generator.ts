/**
 * Decision Provenance Record — PDF generator.
 *
 * Client-side jsPDF generator that emits a procurement-grade artifact
 * the CSO's General Counsel can hand to the audit committee, regulator,
 * LP, assurance partner (LRQA / Bureau Veritas / SGS / DNV), or
 * plaintiff's counsel — or more usefully, the record their AI-augmented
 * decision-making was always supposed to produce.
 *
 * Page sequence (DPR schema v2, locked 2026-04-26 from NotebookLM
 * "highest-ROI DPR additions" synthesis):
 *
 *   1. Cover + hashes + verification block + audit summary + score
 *      strip + org-calibration strip (Cloverpop defense) + counterfactual
 *      impact block (top-3 scenarios) + recommended next action.
 *   2. Model lineage + judge variance — which model tier ran on which
 *      node; the noise score + meta-verdict; per-judge convergence.
 *   3. Academic citations + regulatory mapping — every detected bias
 *      with APA citation and the 17-framework regulatory map it touches.
 *   4. Pipeline lineage + "What this record proves" GC-ready appendix.
 *   5. Reviewer Decisions (when populated) — HITL / EU AI Act Art 14
 *      record: accepted mitigations, dismissed flags, dissent log,
 *      reviewer counter-signature.
 *   6. Pre-IC blind-prior aggregations (when present).
 *   7. Decision Package or Deal members (when applicable).
 *   8. Data Lifecycle / Retention / Sub-Processors — ALWAYS the last
 *      page; the procurement-grade contractual statement of how the
 *      source document, audit, and DPR are stored, retained, destroyed.
 *
 * Honesty discipline: every page declares what's stored vs. what's
 * available on request. A GC reading this should never discover that a
 * claim was overstated when they ask for backup.
 *
 * IP-PROTECTION RULES — do not break: never serialise prompt content
 * (only the SHA-256 fingerprint), never serialise the 20×20 toxic-
 * combination weight matrix, never serialise per-org causal edges or
 * learned bias-genome values. Per-node input/output hashing is deferred
 * to record schema v3 (requires instrumentation in nodes.ts).
 */

import jsPDF, { GState } from 'jspdf';
import type { ProvenanceRecordData } from './provenance-record-data';
import { truncate } from '@/lib/utils/string';

const MAX_TITLE_CHARS = 70;
const PAGE_W = 210; // A4 mm
const MARGIN_L = 20;
const MARGIN_R = 20;
const TEXT_W = PAGE_W - MARGIN_L - MARGIN_R;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function formatHashShort(hash: string): string {
  if (!hash || hash === 'UNAVAILABLE' || hash === 'FILE_NOT_AVAILABLE') {
    return hash || 'UNAVAILABLE';
  }
  return `${hash.slice(0, 12)}…${hash.slice(-8)}`;
}

export class DecisionProvenanceRecordGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  /** Generate and trigger a client-side download of the record PDF. */
  public generateAndDownload(data: ProvenanceRecordData) {
    this.generate(data);
    const stamp = data.generatedAt.toISOString().slice(0, 10);
    this.doc.save(`decision-provenance-record-${slugify(data.meta.filename)}-${stamp}.pdf`);
  }

  /** Return the PDF as a Blob (useful for server-side generation or
   *  attaching to emails). */
  public generateAsBlob(data: ProvenanceRecordData): Blob {
    this.generate(data);
    return this.doc.output('blob');
  }

  /** Assemble every page and return the raw jsPDF instance. Callers that
   *  need bytes (server-side streaming, buffer hashing) should use this
   *  and call `.output('arraybuffer')` themselves.
   *
   *  `watermark` draws a diagonal banner on every page — used for the
   *  public sample DPR so a GC can't mistake the specimen for a real
   *  audit record. Leave undefined for authenticated exports. */
  public generate(
    data: ProvenanceRecordData,
    opts?: { watermark?: string; clientSafe?: boolean }
  ): jsPDF {
    // Client-Safe Export Mode (DPR v2 #5) — when enabled, the meta strip
    // + summary + reviewer notes are run through the entity / amount /
    // person-name placeholder masker before any text hits the page.
    // We mutate a shallow-copied data object so the caller's input is
    // untouched.
    const renderData = opts?.clientSafe ? applyClientSafeScrub(data) : data;
    this.drawPageOne(renderData);
    this.doc.addPage();
    this.drawPageTwo(renderData);
    this.doc.addPage();
    this.drawPageThree(renderData);
    this.doc.addPage();
    this.drawPageFour(renderData);
    if (renderData.reviewerDecisions && renderData.reviewerDecisions.reviewedAt) {
      this.doc.addPage();
      this.drawPageReviewerDecisions(renderData);
    }
    if (renderData.blindPriorAggregates && renderData.blindPriorAggregates.length > 0) {
      this.doc.addPage();
      this.drawPageFiveBlindPriors(renderData);
    }
    if (renderData.packageContext) {
      this.doc.addPage();
      this.drawPagePackageMembers(renderData);
    }
    if (renderData.dealContext) {
      this.doc.addPage();
      this.drawPageDealMembers(renderData);
    }
    // Data lifecycle footer page is ALWAYS the last page — it's the
    // procurement-grade contractual statement every reader (GC, audit
    // committee, regulator, LP) needs to trust before signing.
    this.doc.addPage();
    this.drawPageDataLifecycle(renderData);
    this.drawFooterAllPages();
    if (opts?.watermark) this.drawWatermarkAllPages(opts.watermark);
    return this.doc;
  }

  /** Diagonal watermark across every page. Intentionally large and
   *  tinted so it survives being printed or screenshotted. */
  private drawWatermarkAllPages(label: string) {
    const pages = this.doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      this.doc.setPage(i);
      this.doc.saveGraphicsState();
      this.doc.setGState(new GState({ opacity: 0.08 }));
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(88);
      this.doc.setTextColor(22, 163, 74);
      this.doc.text(label, 105, 160, { align: 'center', angle: -28 });
      this.doc.restoreGraphicsState();
    }
  }

  // ─── Page 1: Cover + hashes + verification + impact + calibration ─
  // Restructured 2026-04-26 (DPR v2) to fit the new Verification Block,
  // Counterfactual Impact Block, and Org Calibration strip alongside
  // the existing integrity fingerprints + audit summary + recommended
  // action. Reviewer signature moved off the cover onto its dedicated
  // Reviewer Decisions page when populated; otherwise inline appendix
  // on page 4.
  private drawPageOne(data: ProvenanceRecordData) {
    this.drawAccentBand();
    this.drawHeader('DECISION PROVENANCE RECORD');

    const title = truncate(data.meta.filename.replace(/\.[^.]+$/, ''), MAX_TITLE_CHARS);

    // Title
    this.doc.setTextColor(5, 5, 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(17);
    const titleLines = this.doc.splitTextToSize(title, TEXT_W);
    this.doc.text(titleLines, MARGIN_L, 34);
    let y = 34 + titleLines.length * 7.5 + 3;

    // R²F framework mark — names the category claim on the cover so the
    // reviewer sees it before anything else (CLAUDE.md 2026-04-22 lock).
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text('R²F · RECOGNITION-RIGOR FRAMEWORK', MARGIN_L, y);
    if (data.clientSafe?.enabled) {
      this.doc.setFillColor(217, 119, 6);
      this.doc.roundedRect(PAGE_W - MARGIN_R - 56, y - 4, 56, 6, 1, 1, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(7.5);
      this.doc.text('CLIENT-SAFE EXPORT', PAGE_W - MARGIN_R - 28, y, { align: 'center' });
    }
    y += 6;

    // Purpose strap (vocabulary lock — "hashed + tamper-evident", per
    // trust-copy.ts; restored from the prior overclaim "signed, hashed").
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(80, 80, 80);
    const purposeLines = this.doc.splitTextToSize(
      'Hashed and tamper-evident evidence record for this strategic memo\u2019s Decision Intel audit. ' +
        'Shareable with your audit committee, General Counsel, regulator of record, or assurance partner.',
      TEXT_W
    );
    this.doc.text(purposeLines, MARGIN_L, y);
    y += purposeLines.length * 4.6 + 5;

    // Integrity card
    this.drawSectionHeading('INTEGRITY FINGERPRINTS', y);
    y += 9;

    this.drawKvBox(
      [
        { k: 'Input document hash (SHA-256)', v: formatHashShort(data.inputHash) },
        { k: 'Prompt version fingerprint (SHA-256)', v: formatHashShort(data.promptFingerprint) },
        { k: 'Record schema version', v: `v${data.schemaVersion}` },
        { k: 'Generated (ISO-8601, server time)', v: data.generatedAt.toISOString() },
      ],
      y
    );
    y += 42;

    // Verification block — DPR v2 #1. Tells the reader exactly how to
    // independently verify each hash. Replaces the prior implicit
    // "trust the hash" framing with an explicit re-verification path.
    this.drawSectionHeading('HOW TO VERIFY THIS RECORD', y);
    y += 7;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(60, 60, 60);
    const verificationLines = this.doc.splitTextToSize(
      'Re-hash the source memo with SHA-256 and compare to the input-document hash above. The prompt fingerprint is the SHA-256 of the prompt version active at audit time \u2014 a divergent hash on a re-run proves the prompts evolved between audits. Tamper-evidence today: SHA-256 over canonicalised inputs. Private-key signing of the record itself is on the published roadmap (Q3 2026); the schema is forward-compatible.',
      TEXT_W
    );
    this.doc.text(verificationLines, MARGIN_L, y);
    y += verificationLines.length * 4 + 4;

    // Audit summary
    this.drawSectionHeading('AUDIT SUMMARY', y);
    y += 7;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(30, 30, 30);
    const summaryText = truncate(data.meta.summary || 'No summary generated.', 320);
    const summaryLines = this.doc.splitTextToSize(summaryText, TEXT_W);
    this.doc.text(summaryLines, MARGIN_L, y);
    y += summaryLines.length * 4.5 + 4;

    // Score + bias count strip
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text(
      `DQI ${Math.round(data.meta.overallScore)} / 100     \u00b7     Noise ${Math.round(
        data.meta.noiseScore
      )} / 100     \u00b7     ${data.meta.biasCount} biases detected`,
      MARGIN_L,
      y
    );
    y += 7;

    // Org calibration strip — DPR v2 #6. Cloverpop-defense move: proves
    // the DQI shown is calibrated against THIS org's outcome history.
    if (data.orgCalibration) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(80, 80, 80);
      const cal = data.orgCalibration;
      const calStrip = cal.recalibratedFromOriginal
        ? `Calibrated against ${cal.decisionsTracked} closed decisions for this organisation \u00b7 mean Brier ${cal.meanBrierScore?.toFixed(3) ?? '\u2014'} (${cal.brierCategory ?? 'unscored'}) \u00b7 recalibrated ${cal.recalibratedFromOriginal.delta >= 0 ? '+' : ''}${cal.recalibratedFromOriginal.delta} from absolute`
        : `Calibration baseline: ${cal.decisionsTracked} closed decisions, mean Brier ${cal.meanBrierScore?.toFixed(3) ?? '\u2014'} (${cal.brierCategory ?? 'unscored'}) \u00b7 absolute DQI shown until per-org statistical floor`;
      const calLines = this.doc.splitTextToSize(calStrip, TEXT_W);
      this.doc.text(calLines, MARGIN_L, y);
      y += calLines.length * 4 + 4;
    }

    // Counterfactual Impact Block — DPR v2 #2. Top-3 bias scenarios with
    // expected improvement %, sample size + Wilson confidence, monetary
    // anchor where the analysis carries a DecisionFrame value.
    if (data.counterfactualImpact && data.counterfactualImpact.scenarios.length > 0) {
      this.drawSectionHeading('COUNTERFACTUAL IMPACT \u00b7 IF FLAGGED BIASES WERE ADDRESSED', y);
      y += 7;
      const ci = data.counterfactualImpact;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(60, 60, 60);
      for (const s of ci.scenarios.slice(0, 3)) {
        if (y > 248) break;
        const monetary =
          s.estimatedMonetaryImpact != null
            ? `~ ${s.currency} ${formatMoney(s.estimatedMonetaryImpact)}`
            : 'monetary anchor unavailable';
        const conf = `${(s.confidence * 100).toFixed(0)}% confidence \u00b7 n=${s.historicalSampleSize}`;
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(15, 15, 15);
        this.doc.text(s.biasLabel, MARGIN_L, y);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(22, 163, 74);
        this.doc.text(`+${s.expectedImprovementPct.toFixed(1)} pts success rate`, MARGIN_L + 60, y);
        this.doc.setTextColor(80, 80, 80);
        this.doc.text(monetary, MARGIN_L + 110, y);
        y += 4;
        this.doc.setFont('helvetica', 'italic');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(120, 120, 120);
        this.doc.text(conf, MARGIN_L + 4, y);
        y += 5;
        this.doc.setFontSize(8.5);
      }
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(22, 163, 74);
      this.doc.text(
        `Aggregate (independence-assumed): +${ci.aggregateImprovementPct.toFixed(1)} pts \u00b7 confidence-weighted: +${ci.weightedImprovementPct.toFixed(1)} pts`,
        MARGIN_L,
        y
      );
      y += 4.5;
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(120, 120, 120);
      const methLines = this.doc.splitTextToSize(ci.methodologyNote, TEXT_W);
      this.doc.text(methLines, MARGIN_L, y);
      y += methLines.length * 3.5 + 3;
    }

    // Recommended next action — forward-looking remediation the GC or
    // audit committee can act on before signing.
    if (y > 268) return;
    this.drawSectionHeading('RECOMMENDED NEXT ACTION', y);
    y += 7;
    if (data.meta.topMitigation && data.meta.topMitigationFor) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.doc.setTextColor(22, 163, 74);
      this.doc.text(`Addresses: ${data.meta.topMitigationFor}`, MARGIN_L, y);
      y += 4;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(30, 30, 30);
      const mitigationText = truncate(data.meta.topMitigation, 280);
      const mitigationLines = this.doc.splitTextToSize(mitigationText, TEXT_W);
      this.doc.text(mitigationLines, MARGIN_L, y);
      y += mitigationLines.length * 4.5 + 3;
    } else {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(9);
      this.doc.setTextColor(90, 90, 90);
      const noMitigationLines = this.doc.splitTextToSize(
        'No individual-bias mitigation exceeded the surfacing threshold for this audit. See Academic Citations and Regulatory Mapping (page 3) for framework-level remediation guidance.',
        TEXT_W
      );
      this.doc.text(noMitigationLines, MARGIN_L, y);
      y += noMitigationLines.length * 4 + 3;
    }
  }

  // ─── Page 2: Model lineage + judge variance ───────────────────────
  private drawPageTwo(data: ProvenanceRecordData) {
    this.drawAccentBand();
    this.drawHeader('MODEL LINEAGE & JUDGE VARIANCE');

    let y = 34;
    this.drawSectionHeading('MODEL ROUTING (PER NODE)', y);
    y += 8;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    const noteLines = this.doc.splitTextToSize(data.modelLineage.note, TEXT_W);
    this.doc.text(noteLines, MARGIN_L, y);
    y += noteLines.length * 4.5 + 6;

    // Lineage table
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(110, 110, 110);
    this.doc.text('NODE', MARGIN_L, y);
    this.doc.text('MODEL', MARGIN_L + 60, y);
    this.doc.text('TEMP', MARGIN_L + 130, y);
    this.doc.text('TOP-P', MARGIN_L + 155, y);
    y += 3;
    this.doc.setDrawColor(220, 220, 220);
    this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
    y += 5;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(40, 40, 40);
    const lineageEntries = Object.entries(data.modelLineage.nodes);
    let lineageRowsDrawn = 0;
    for (const [nodeId, cfg] of lineageEntries) {
      if (y > 240) break;
      this.doc.text(nodeId, MARGIN_L, y);
      this.doc.text(cfg.model, MARGIN_L + 60, y);
      this.doc.text(cfg.temperature.toFixed(2), MARGIN_L + 130, y);
      this.doc.text(cfg.topP.toFixed(2), MARGIN_L + 155, y);
      y += 5;
      lineageRowsDrawn++;
    }
    if (lineageRowsDrawn < lineageEntries.length) {
      const remaining = lineageEntries.length - lineageRowsDrawn;
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(
        `… ${remaining} additional node${remaining === 1 ? '' : 's'} — full table available on request under the DPA.`,
        MARGIN_L,
        y + 1
      );
      y += 6;
    }

    y += 8;
    this.drawSectionHeading('JUDGE VARIANCE', y);
    y += 8;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text(`Noise Score: ${Math.round(data.judgeVariance.noiseScore)} / 100`, MARGIN_L, y);
    y += 8;

    if (data.judgeVariance.metaVerdict) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(40, 40, 40);
      const verdictLines = this.doc.splitTextToSize(
        `Meta verdict: "${truncate(data.judgeVariance.metaVerdict, 440)}"`,
        TEXT_W
      );
      this.doc.text(verdictLines, MARGIN_L, y);
      y += verdictLines.length * 5 + 6;
    }

    // 1.1 deep — granular per-judge convergence summary. Each judge
    // runs independently; the metrics below show the convergence call.
    const g = data.judgeVariance.granular;
    if (g) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(40, 40, 40);
      this.doc.text('PER-JUDGE CONVERGENCE', MARGIN_L, y);
      y += 6;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(60, 60, 60);
      const lines: string[] = [];
      if (g.biasDetective) {
        lines.push(
          `Bias Detective: ${g.biasDetective.flagCount} flag${g.biasDetective.flagCount === 1 ? '' : 's'} (${g.biasDetective.severeFlagCount} high/critical) across ${g.biasDetective.biasTypes.length} distinct bias type${g.biasDetective.biasTypes.length === 1 ? '' : 's'}.`
        );
      }
      if (g.noiseJudge) {
        const stdDev = g.noiseJudge.stdDev != null ? g.noiseJudge.stdDev.toFixed(2) : '—';
        const mean = g.noiseJudge.mean != null ? g.noiseJudge.mean.toFixed(1) : '—';
        const sample = g.noiseJudge.sampleCount ?? '—';
        lines.push(
          `Noise Judge: mean ${mean}, stdDev ${stdDev}, samples ${sample}. Lower stdDev = stronger inter-rater agreement on noise.`
        );
      }
      if (g.factChecker) {
        lines.push(
          `Fact Checker: ${g.factChecker.verified ?? 0}/${g.factChecker.totalClaims ?? 0} claims verified · ${g.factChecker.contradicted ?? 0} contradicted.`
        );
      }
      if (g.preMortem) {
        lines.push(
          `Pre-mortem: ${g.preMortem.failureScenarioCount} failure scenarios · ${g.preMortem.redTeamCount} red-team objections · ${g.preMortem.inversionCount} Munger inversions.`
        );
      }
      for (const ln of lines) {
        const wrapped = this.doc.splitTextToSize(`• ${ln}`, TEXT_W - 4);
        this.doc.text(wrapped, MARGIN_L + 2, y);
        y += wrapped.length * 4.6 + 1.5;
      }
      y += 3;
    }

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(90, 90, 90);
    const jvNoteLines = this.doc.splitTextToSize(data.judgeVariance.note, TEXT_W);
    this.doc.text(jvNoteLines, MARGIN_L, y);
  }

  // ─── Page 3: Citations + regulatory mapping ────────────────────────
  private drawPageThree(data: ProvenanceRecordData) {
    this.drawAccentBand();
    this.drawHeader('ACADEMIC CITATIONS & REGULATORY MAPPING');

    let y = 34;
    this.drawSectionHeading('ACADEMIC CITATIONS', y);
    y += 8;

    if (data.citations.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(90, 130, 90);
      this.doc.text('No biases flagged. No citations attached.', MARGIN_L, y);
      y += 8;
    } else {
      for (const c of data.citations) {
        if (y > 215) {
          this.doc.addPage();
          this.drawAccentBand();
          this.drawHeader('ACADEMIC CITATIONS & REGULATORY MAPPING (cont.)');
          y = 34;
        }
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10);
        this.doc.setTextColor(15, 15, 15);
        const header = c.taxonomyId ? `${c.biasLabel} · ${c.taxonomyId}` : c.biasLabel;
        this.doc.text(header, MARGIN_L, y);
        y += 5;

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(60, 60, 60);
        const citationText = c.citation ?? 'Citation unavailable for this bias key.';
        const citationLines = this.doc.splitTextToSize(citationText, TEXT_W);
        this.doc.text(citationLines, MARGIN_L, y);
        y += citationLines.length * 4.5;

        if (c.doi) {
          this.doc.setFont('helvetica', 'italic');
          this.doc.setFontSize(8.5);
          this.doc.setTextColor(22, 163, 74);
          this.doc.text(`DOI: ${c.doi}`, MARGIN_L, y + 3);
          y += 6;
        }
        y += 4;
      }
    }

    y += 4;
    if (y > 200) {
      this.doc.addPage();
      this.drawAccentBand();
      this.drawHeader('ACADEMIC CITATIONS & REGULATORY MAPPING (cont.)');
      y = 34;
    }
    this.drawSectionHeading('REGULATORY MAPPING', y);
    y += 8;

    if (data.regulatoryMapping.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(90, 130, 90);
      this.doc.text(
        'No biases flagged — no cross-framework regulatory exposure identified.',
        MARGIN_L,
        y
      );
    } else {
      for (const r of data.regulatoryMapping) {
        // Estimate block height and paginate when it wouldn't fit —
        // dropping biases from a regulator-facing record is not OK.
        const estHeight =
          5 +
          (r.frameworks.length === 0
            ? 5
            : r.frameworks.reduce(
                (acc, fw) =>
                  acc +
                  4.5 +
                  Math.max(Math.min(fw.provisions.length, 4), 1) * 4 +
                  (fw.provisions.length > 4 ? 4 : 0),
                0
              )) +
          4;
        if (y + estHeight > 265) {
          this.doc.addPage();
          this.drawAccentBand();
          this.drawHeader('ACADEMIC CITATIONS & REGULATORY MAPPING (cont.)');
          y = 34;
          this.drawSectionHeading('REGULATORY MAPPING (cont.)', y);
          y += 8;
        }
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10);
        this.doc.setTextColor(15, 15, 15);
        this.doc.text(
          `${formatBiasKey(r.biasType)}     ·     agg. risk ${r.aggregateRiskScore}/100`,
          MARGIN_L,
          y
        );
        y += 5;

        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(60, 60, 60);
        if (r.frameworks.length === 0) {
          this.doc.text('No framework mappings present.', MARGIN_L + 4, y);
          y += 5;
        } else {
          for (const fw of r.frameworks) {
            this.doc.text(`${fw.name}`, MARGIN_L + 4, y);
            y += 4.5;
            const visibleProvisions = fw.provisions.slice(0, 4);
            for (const prov of visibleProvisions) {
              const provLines = this.doc.splitTextToSize(`  \u2022 ${prov}`, TEXT_W - 8);
              this.doc.text(provLines, MARGIN_L + 4, y);
              y += provLines.length * 4;
            }
            if (fw.provisions.length > visibleProvisions.length) {
              const extra = fw.provisions.length - visibleProvisions.length;
              this.doc.setFont('helvetica', 'italic');
              this.doc.setFontSize(8.5);
              this.doc.setTextColor(120, 120, 120);
              this.doc.text(
                `    ${extra} additional provision${extra === 1 ? '' : 's'} available under the DPA.`,
                MARGIN_L + 4,
                y
              );
              y += 4;
              this.doc.setFont('helvetica', 'normal');
              this.doc.setFontSize(9);
              this.doc.setTextColor(60, 60, 60);
            }
          }
        }
        y += 4;
      }
    }
  }

  // ─── Page 4: Pipeline lineage + appendix ───────────────────────────
  private drawPageFour(data: ProvenanceRecordData) {
    this.drawAccentBand();
    this.drawHeader('PIPELINE LINEAGE & APPENDIX');

    let y = 34;
    this.drawSectionHeading('PIPELINE EXECUTION ORDER', y);
    y += 8;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    const intro = this.doc.splitTextToSize(
      'Nodes executed in this order for every audit. Per-node input/output hashing is deferred to record schema v2; this v1 record declares the order + each node\u2019s academic anchor.',
      TEXT_W
    );
    this.doc.text(intro, MARGIN_L, y);
    y += intro.length * 4.5 + 4;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(40, 40, 40);
    let nodesDrawn = 0;
    for (const n of data.pipelineLineage) {
      if (y > 225) break;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(15, 15, 15);
      this.doc.text(`${n.order.toString().padStart(2, '0')}. ${n.label} (${n.zone})`, MARGIN_L, y);
      y += 4.5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(80, 80, 80);
      const anchorLines = this.doc.splitTextToSize(n.academicAnchor, TEXT_W - 8);
      this.doc.text(anchorLines, MARGIN_L + 4, y);
      y += anchorLines.length * 4 + 3;
      nodesDrawn++;
    }
    if (nodesDrawn < data.pipelineLineage.length) {
      const remaining = data.pipelineLineage.length - nodesDrawn;
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(
        `… ${remaining} additional node${remaining === 1 ? '' : 's'} — full lineage available on request under the DPA.`,
        MARGIN_L,
        y + 1
      );
      y += 6;
    }

    // Bottom appendix
    y = Math.max(y, 238);
    this.drawSectionHeading('WHAT THIS RECORD PROVES', y);
    y += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(40, 40, 40);
    const apx = this.doc.splitTextToSize(
      'This record is the verifiable provenance trail for a Decision Intel analysis. The ' +
        'input-document hash proves the audit targeted this exact memo, not a later edit. The ' +
        'prompt fingerprint proves which prompt version produced the analysis. The model-routing ' +
        'table discloses which model tier ran on which pipeline node at audit time. Every ' +
        'detected bias carries its taxonomy ID, primary academic reference, and the regulatory ' +
        'provisions it intersects (Basel III, EU AI Act Art 14, SEC Reg D, FCA Consumer Duty, ' +
        'SOX §404, GDPR Article 22, LPOA). The record deliberately omits prompt content, ' +
        'toxic-combination weights, and per-org causal edges to protect platform IP; full ' +
        'internal audit logs with per-judge granular outputs are available on request under a ' +
        'data-processing addendum.',
      TEXT_W
    );
    this.doc.text(apx, MARGIN_L, y);
  }

  // ─── Page 5: Pre-IC blind-prior aggregations (4.1 deep) ────────────
  private drawPageFiveBlindPriors(data: ProvenanceRecordData) {
    this.drawAccentBand();
    this.drawHeader('PRE-IC BLIND-PRIOR AGGREGATIONS');

    let y = 34;
    this.drawSectionHeading('GOVERNANCE EVIDENCE', y);
    y += 8;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    const intro = this.doc.splitTextToSize(
      'Before the committee met, every voter submitted their probability + top-3 risks blind. ' +
        'The aggregate below shows the anonymised distribution alongside the calibration ' +
        '(Brier score per participant) once the actual outcome was reported. Maps onto Basel III ' +
        'Pillar 2 ICAAP qualitative-decision documentation, EU AI Act Art. 14 human-oversight ' +
        'records, and African board-effectiveness regimes (FRC Nigeria 1.1, CMA Kenya §2).',
      TEXT_W
    );
    this.doc.text(intro, MARGIN_L, y);
    y += intro.length * 4.5 + 6;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(40, 40, 40);

    for (const room of data.blindPriorAggregates) {
      if (y > 260) break;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(15, 15, 15);
      const titleLines = this.doc.splitTextToSize(`Room: ${room.roomTitle}`, TEXT_W);
      this.doc.text(titleLines, MARGIN_L, y);
      y += titleLines.length * 5;

      if (room.outcomeFrame) {
        this.doc.setFont('helvetica', 'italic');
        this.doc.setFontSize(9);
        this.doc.setTextColor(80, 80, 80);
        const frameLines = this.doc.splitTextToSize(`Frame: ${room.outcomeFrame}`, TEXT_W);
        this.doc.text(frameLines, MARGIN_L, y);
        y += frameLines.length * 4.5 + 1;
      }

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(60, 60, 60);
      const meta: string[] = [
        `Voters: ${room.participantCount}`,
        `Mean confidence: ${room.meanConfidence}%`,
        `Median: ${room.medianConfidence}%`,
        `σ: ${room.stdDevConfidence}pt`,
        `Risk overlap: ${(room.topRisksAgreement * 100).toFixed(0)}%`,
      ];
      if (room.meanBrier !== null) {
        meta.push(`Mean Brier: ${room.meanBrier.toFixed(3)}`);
      }
      this.doc.text(meta.join('   ·   '), MARGIN_L, y);
      y += 5;

      if (room.bestCalibrated) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(22, 163, 74);
        const bc = room.bestCalibrated;
        const bcLine = `Best-calibrated voter: ${
          bc.name ?? 'anonymous'
        } · prior ${bc.confidencePercent}% · Brier ${bc.brierScore.toFixed(3)} (${
          bc.brierCategory ?? 'unscored'
        })`;
        this.doc.text(this.doc.splitTextToSize(bcLine, TEXT_W), MARGIN_L, y);
        y += 5;
      }

      if (room.topRisks.length > 0) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(120, 120, 120);
        this.doc.text('TOP RISKS', MARGIN_L, y);
        y += 4;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8.5);
        this.doc.setTextColor(60, 60, 60);
        for (const risk of room.topRisks.slice(0, 5)) {
          if (y > 275) break;
          const line = `· ${risk.risk} (×${risk.count}${
            risk.attributedTo.length > 0 ? ` — ${risk.attributedTo.join(', ')}` : ''
          })`;
          const wrapped = this.doc.splitTextToSize(line, TEXT_W - 4);
          this.doc.text(wrapped, MARGIN_L + 2, y);
          y += wrapped.length * 4;
        }
      }

      this.doc.setDrawColor(220, 220, 220);
      this.doc.line(MARGIN_L, y + 1, PAGE_W - MARGIN_R, y + 1);
      y += 5;
    }

    if (data.blindPriorAggregates.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(9);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text('No pre-IC blind-prior survey was attached to this analysis.', MARGIN_L, y);
    }
  }

  // ─── Page 6 (or 5 when no blind-priors): Decision Package members ──
  private drawPagePackageMembers(data: ProvenanceRecordData) {
    const ctx = data.packageContext;
    if (!ctx) return;
    this.drawAccentBand();
    this.drawHeader('DECISION PACKAGE · MEMBERS');

    let y = 34;
    this.drawSectionHeading('PACKAGE CONTEXT', y);
    y += 8;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(15, 15, 15);
    const titleLines = this.doc.splitTextToSize(ctx.packageName, TEXT_W);
    this.doc.text(titleLines, MARGIN_L, y);
    y += titleLines.length * 6;

    if (ctx.decisionFrame) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(80, 80, 80);
      const frameLines = this.doc.splitTextToSize(ctx.decisionFrame, TEXT_W);
      this.doc.text(frameLines, MARGIN_L, y);
      y += frameLines.length * 4.8 + 2;
    }

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(60, 60, 60);
    const meta: string[] = [`Status: ${ctx.status}`, `Members: ${ctx.members.length}`];
    if (ctx.compositeDqi != null) {
      meta.push(
        `Composite DQI: ${Math.round(ctx.compositeDqi)}${ctx.compositeGrade ? ` (${ctx.compositeGrade})` : ''}`
      );
    }
    if (ctx.decidedAt) {
      meta.push(`Decided: ${new Date(ctx.decidedAt).toLocaleDateString()}`);
    }
    this.doc.text(meta.join('   ·   '), MARGIN_L, y);
    y += 6;

    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text(`Package input hash: ${ctx.packageInputHash.slice(0, 32)}…`, MARGIN_L, y);
    y += 8;

    // Members table
    this.drawSectionHeading('MEMBER DOCUMENTS', y);
    y += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(40, 40, 40);
    for (const m of ctx.members) {
      if (y > 250) break;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(15, 15, 15);
      const filenameLines = this.doc.splitTextToSize(
        `${m.role ? `[${m.role}] ` : ''}${m.filename}`,
        TEXT_W
      );
      this.doc.text(filenameLines, MARGIN_L, y);
      y += filenameLines.length * 4.5;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(80, 80, 80);
      const stats: string[] = [];
      if (m.overallScore != null) stats.push(`DQI ${Math.round(m.overallScore)}/100`);
      else stats.push('Not analyzed');
      stats.push(`${m.biasCount} bias${m.biasCount === 1 ? '' : 'es'}`);
      this.doc.text(stats.join('  ·  '), MARGIN_L + 4, y);
      y += 4;

      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(`Input hash: ${m.inputHash.slice(0, 24)}…`, MARGIN_L + 4, y);
      y += 6;
    }

    if (ctx.crossReference) {
      this.doc.setDrawColor(220, 220, 220);
      this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
      y += 6;
      this.drawSectionHeading('CROSS-REFERENCE FINDINGS', y);
      y += 8;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(40, 40, 40);
      const xrefLines = this.doc.splitTextToSize(
        `${ctx.crossReference.conflictCount} conflict${ctx.crossReference.conflictCount === 1 ? '' : 's'} flagged on ${new Date(ctx.crossReference.runAt).toLocaleDateString()} (${ctx.crossReference.highSeverityCount} high-severity).`,
        TEXT_W
      );
      this.doc.text(xrefLines, MARGIN_L, y);
      y += xrefLines.length * 4.5 + 2;
      if (ctx.crossReference.summary) {
        this.doc.setFont('helvetica', 'italic');
        this.doc.setFontSize(9);
        this.doc.setTextColor(80, 80, 80);
        const summaryLines = this.doc.splitTextToSize(ctx.crossReference.summary, TEXT_W);
        this.doc.text(summaryLines, MARGIN_L, y);
        y += summaryLines.length * 4.5 + 2;
      }
    }

    if (ctx.outcome && y < 260) {
      this.doc.setDrawColor(220, 220, 220);
      this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
      y += 6;
      this.drawSectionHeading('OUTCOME REPORTED', y);
      y += 8;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(40, 40, 40);
      const outcomeLines = this.doc.splitTextToSize(ctx.outcome.summary, TEXT_W);
      this.doc.text(outcomeLines, MARGIN_L, y);
      y += outcomeLines.length * 4.8;
      if (ctx.outcome.realisedDqi != null) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(22, 163, 74);
        this.doc.text(`Realised DQI: ${Math.round(ctx.outcome.realisedDqi)}/100`, MARGIN_L, y + 4);
      }
    }
  }

  // ─── Deal members page (3.1 deep, 2026-04-26 P1 #19) ──────────────
  // Mirrors drawPagePackageMembers but with deal-native fields. The
  // shape contract is "what an M&A audit committee or post-close-inquiry
  // GC reads to reconstruct the decision": deal identity (target / fund /
  // vintage), composite DQI across CIM + model + counsel + IC deck,
  // per-doc lineage with input hashes, cross-reference findings, and the
  // realised IRR/MOIC outcome where the deal has closed.
  private drawPageDealMembers(data: ProvenanceRecordData) {
    const ctx = data.dealContext;
    if (!ctx) return;
    this.drawAccentBand();
    this.drawHeader('DEAL · MEMBERS');

    let y = 34;
    this.drawSectionHeading('DEAL CONTEXT', y);
    y += 8;

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(15, 15, 15);
    const titleLines = this.doc.splitTextToSize(ctx.dealName, TEXT_W);
    this.doc.text(titleLines, MARGIN_L, y);
    y += titleLines.length * 6;

    if (ctx.targetCompany) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(80, 80, 80);
      this.doc.text(`Target: ${ctx.targetCompany}`, MARGIN_L, y);
      y += 5;
    }

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(60, 60, 60);
    const meta: string[] = [
      `Type: ${ctx.dealType}`,
      `Stage: ${ctx.stage}`,
      `Members: ${ctx.members.length}`,
    ];
    if (ctx.fundName)
      meta.push(`Fund: ${ctx.fundName}${ctx.vintage ? ` (${ctx.vintage} vintage)` : ''}`);
    if (ctx.sector) meta.push(`Sector: ${ctx.sector}`);
    if (ctx.ticketSize != null) {
      meta.push(`Ticket: ${ctx.currency} ${ctx.ticketSize.toLocaleString('en-US')}`);
    }
    if (ctx.compositeDqi != null) {
      meta.push(
        `Composite DQI: ${Math.round(ctx.compositeDqi)}${ctx.compositeGrade ? ` (${ctx.compositeGrade})` : ''}`
      );
    }
    if (ctx.exitDate) {
      meta.push(`Exited: ${new Date(ctx.exitDate).toLocaleDateString()}`);
    }
    const metaLines = this.doc.splitTextToSize(meta.join('   ·   '), TEXT_W);
    this.doc.text(metaLines, MARGIN_L, y);
    y += metaLines.length * 4.6 + 2;

    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text(`Deal input hash: ${ctx.dealInputHash.slice(0, 32)}…`, MARGIN_L, y);
    y += 8;

    // Members table — same visual shape as package members so a reader
    // who's seen one DPR understands both. Role column carries the
    // documentType (cim / financial_model / counsel_memo / ic_deck) when
    // present.
    this.drawSectionHeading('MEMBER DOCUMENTS', y);
    y += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(40, 40, 40);
    for (const m of ctx.members) {
      if (y > 245) break;
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(15, 15, 15);
      const filenameLines = this.doc.splitTextToSize(
        `${m.role ? `[${m.role}] ` : ''}${m.filename}`,
        TEXT_W
      );
      this.doc.text(filenameLines, MARGIN_L, y);
      y += filenameLines.length * 4.5;

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(80, 80, 80);
      const stats: string[] = [];
      if (m.overallScore != null) stats.push(`DQI ${Math.round(m.overallScore)}/100`);
      else stats.push('Not analyzed');
      stats.push(`${m.biasCount} bias${m.biasCount === 1 ? '' : 'es'}`);
      this.doc.text(stats.join('  ·  '), MARGIN_L + 4, y);
      y += 4;

      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(`Input hash: ${m.inputHash.slice(0, 24)}…`, MARGIN_L + 4, y);
      y += 6;
    }

    if (ctx.crossReference) {
      this.doc.setDrawColor(220, 220, 220);
      this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
      y += 6;
      this.drawSectionHeading('CROSS-REFERENCE FINDINGS', y);
      y += 8;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(40, 40, 40);
      const xrefLines = this.doc.splitTextToSize(
        `${ctx.crossReference.conflictCount} conflict${ctx.crossReference.conflictCount === 1 ? '' : 's'} flagged on ${new Date(ctx.crossReference.runAt).toLocaleDateString()} (${ctx.crossReference.highSeverityCount} high-severity).`,
        TEXT_W
      );
      this.doc.text(xrefLines, MARGIN_L, y);
      y += xrefLines.length * 4.5 + 2;
      if (ctx.crossReference.summary) {
        this.doc.setFont('helvetica', 'italic');
        this.doc.setFontSize(9);
        this.doc.setTextColor(80, 80, 80);
        const summaryLines = this.doc.splitTextToSize(ctx.crossReference.summary, TEXT_W);
        this.doc.text(summaryLines, MARGIN_L, y);
        y += summaryLines.length * 4.5 + 2;
      }
    }

    if (ctx.outcome && y < 255) {
      this.doc.setDrawColor(220, 220, 220);
      this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
      y += 6;
      this.drawSectionHeading('REALISED OUTCOME', y);
      y += 8;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(40, 40, 40);
      const outcomeBits: string[] = [];
      if (ctx.outcome.exitType) outcomeBits.push(`Exit: ${ctx.outcome.exitType}`);
      if (ctx.outcome.irr != null) outcomeBits.push(`IRR ${(ctx.outcome.irr * 100).toFixed(1)}%`);
      if (ctx.outcome.moic != null) outcomeBits.push(`MOIC ${ctx.outcome.moic.toFixed(2)}×`);
      if (ctx.outcome.exitValue != null)
        outcomeBits.push(`Value ${ctx.currency} ${ctx.outcome.exitValue.toLocaleString('en-US')}`);
      if (ctx.outcome.holdPeriodMonths != null)
        outcomeBits.push(`Hold ${ctx.outcome.holdPeriodMonths} mo`);
      if (outcomeBits.length > 0) {
        const outcomeLines = this.doc.splitTextToSize(outcomeBits.join('   ·   '), TEXT_W);
        this.doc.text(outcomeLines, MARGIN_L, y);
        y += outcomeLines.length * 4.8;
      }
      if (ctx.outcome.notes) {
        this.doc.setFont('helvetica', 'italic');
        this.doc.setTextColor(80, 80, 80);
        const noteLines = this.doc.splitTextToSize(ctx.outcome.notes, TEXT_W);
        this.doc.text(noteLines, MARGIN_L, y);
        y += noteLines.length * 4.5;
      }
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────
  private drawAccentBand() {
    this.doc.setFillColor(22, 163, 74);
    this.doc.rect(0, 0, PAGE_W, 6, 'F');
  }

  private drawHeader(label: string) {
    this.doc.setTextColor(5, 5, 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text(label, MARGIN_L, 18);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(new Date().toLocaleDateString(), PAGE_W - MARGIN_R, 18, { align: 'right' });
  }

  private drawSectionHeading(label: string, y: number) {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(label, MARGIN_L, y);
    this.doc.setDrawColor(220, 220, 220);
    this.doc.line(MARGIN_L, y + 2, PAGE_W - MARGIN_R, y + 2);
  }

  private drawKvBox(rows: Array<{ k: string; v: string }>, y: number) {
    const rowH = 9;
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setFillColor(250, 250, 250);
    this.doc.roundedRect(MARGIN_L, y, TEXT_W, rowH * rows.length + 6, 3, 3, 'FD');
    let cy = y + 8;
    for (const r of rows) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(r.k, MARGIN_L + 4, cy);
      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(22, 163, 74);
      this.doc.text(r.v, MARGIN_L + 90, cy);
      cy += rowH;
    }
  }

  private drawSignatureLine(label: string, y: number) {
    this.doc.setDrawColor(180, 180, 180);
    this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(label, MARGIN_L, y + 4);
  }

  private drawFooterAllPages() {
    const pages = this.doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      this.doc.setPage(i);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(
        `Decision Provenance Record · R²F · Decision Intel · Page ${i} of ${pages}`,
        PAGE_W / 2,
        290,
        { align: 'center' }
      );
    }
  }

  // ─── Reviewer Decisions page (DPR v2 #3) ──────────────────────────
  // Renders the human-in-the-loop / EU AI Act Art. 14 oversight record:
  // accepted mitigations, dismissed flags (with reasons), dissent log,
  // and the final reviewer sign-off + counter-signature lines. Only
  // rendered when reviewerDecisions.reviewedAt is non-null — the
  // "a human acted on this audit" discriminator.
  private drawPageReviewerDecisions(data: ProvenanceRecordData) {
    const r = data.reviewerDecisions;
    if (!r || !r.reviewedAt) return;
    this.drawAccentBand();
    this.drawHeader('REVIEWER DECISIONS · HUMAN OVERSIGHT RECORD');

    let y = 34;
    this.drawSectionHeading('REVIEWER IDENTITY', y);
    y += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(40, 40, 40);
    const idLines: string[] = [];
    if (r.reviewerName) idLines.push(`Name: ${r.reviewerName}`);
    if (r.reviewerRole) idLines.push(`Role: ${r.reviewerRole}`);
    idLines.push(`Reviewed at: ${r.reviewedAt}`);
    if (r.finalSignOff) idLines.push(`Final sign-off: ${r.finalSignOff.replace(/_/g, ' ')}`);
    for (const ln of idLines) {
      this.doc.text(ln, MARGIN_L, y);
      y += 5;
    }
    y += 4;

    if (r.acceptedMitigations.length > 0) {
      this.drawSectionHeading('ACCEPTED MITIGATIONS', y);
      y += 7;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(40, 40, 40);
      for (const m of r.acceptedMitigations) {
        if (y > 245) break;
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(15, 15, 15);
        this.doc.text(`• ${m.biasLabel}`, MARGIN_L, y);
        y += 4.5;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(60, 60, 60);
        const wrapped = this.doc.splitTextToSize(m.mitigation, TEXT_W - 6);
        this.doc.text(wrapped, MARGIN_L + 6, y);
        y += wrapped.length * 4.5 + 2;
      }
      y += 3;
    }

    if (r.dismissedFlags.length > 0) {
      if (y > 245) {
        this.doc.addPage();
        this.drawAccentBand();
        this.drawHeader('REVIEWER DECISIONS (cont.)');
        y = 34;
      }
      this.drawSectionHeading('DISMISSED FLAGS · REASONED REJECTIONS', y);
      y += 7;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(40, 40, 40);
      for (const d of r.dismissedFlags) {
        if (y > 250) break;
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(180, 80, 30);
        this.doc.text(`• ${d.biasLabel}`, MARGIN_L, y);
        y += 4.5;
        this.doc.setFont('helvetica', 'italic');
        this.doc.setTextColor(60, 60, 60);
        const wrapped = this.doc.splitTextToSize(`Reason: ${d.reason}`, TEXT_W - 6);
        this.doc.text(wrapped, MARGIN_L + 6, y);
        y += wrapped.length * 4.5 + 2;
      }
      y += 3;
    }

    if (r.dissentLog.length > 0) {
      if (y > 245) {
        this.doc.addPage();
        this.drawAccentBand();
        this.drawHeader('REVIEWER DECISIONS (cont.)');
        y = 34;
      }
      this.drawSectionHeading('DISSENT LOG · OBJECTIONS RAISED + RESOLUTIONS', y);
      y += 7;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(40, 40, 40);
      for (const d of r.dissentLog) {
        if (y > 250) break;
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(15, 15, 15);
        this.doc.text(`• ${d.source}`, MARGIN_L, y);
        y += 4.5;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(60, 60, 60);
        const obj = this.doc.splitTextToSize(`Objection: ${d.objection}`, TEXT_W - 6);
        this.doc.text(obj, MARGIN_L + 6, y);
        y += obj.length * 4.5;
        if (d.resolution) {
          this.doc.setTextColor(22, 163, 74);
          const res = this.doc.splitTextToSize(`Resolution: ${d.resolution}`, TEXT_W - 6);
          this.doc.text(res, MARGIN_L + 6, y);
          y += res.length * 4.5;
        }
        y += 2;
      }
      y += 3;
    }

    if (r.signOffNote) {
      if (y > 250) {
        this.doc.addPage();
        this.drawAccentBand();
        this.drawHeader('REVIEWER DECISIONS (cont.)');
        y = 34;
      }
      this.drawSectionHeading('SIGN-OFF NOTE', y);
      y += 7;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(40, 40, 40);
      const noteLines = this.doc.splitTextToSize(r.signOffNote, TEXT_W);
      this.doc.text(noteLines, MARGIN_L, y);
      y += noteLines.length * 4.6 + 4;
    }

    // Counter-signature lines (always rendered — give the reader a
    // physical signing surface even when the digital record is complete).
    if (y > 245) {
      this.doc.addPage();
      this.drawAccentBand();
      this.drawHeader('REVIEWER DECISIONS (cont.)');
      y = 34;
    }
    this.drawSectionHeading('REVIEWER COUNTER-SIGNATURE', y);
    y += 8;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(90, 90, 90);
    this.doc.text(
      'For the CSO, General Counsel, or delegated reviewer to counter-sign on print.',
      MARGIN_L,
      y
    );
    y += 8;
    this.drawSignatureLine('Reviewer name', y);
    y += 12;
    this.drawSignatureLine('Role / title', y);
    y += 12;
    this.drawSignatureLine('Signature, date', y);
  }

  // ─── Data Lifecycle / Retention Policy footer (DPR v2 #4) ─────────
  // Always the LAST page of every DPR. The procurement-grade contractual
  // statement of what happens to the source document, the audit, and the
  // DPR itself once the artefact leaves the platform. Pulled from
  // plan-tier defaults + trust-copy + company-info.
  private drawPageDataLifecycle(data: ProvenanceRecordData) {
    const dl = data.dataLifecycle;
    this.drawAccentBand();
    this.drawHeader('DATA LIFECYCLE · RETENTION · SUB-PROCESSORS');

    let y = 34;
    this.drawSectionHeading('DOCUMENT · AUDIT · DPR LIFECYCLE', y);
    y += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(40, 40, 40);
    const intro = this.doc.splitTextToSize(
      'Procurement-grade statement of how the source document, the audit record, and this Decision Provenance Record are stored, encrypted, retained, and destroyed. Every Fortune 500 vendor-risk register asks these questions; the answers are below in writing.',
      TEXT_W
    );
    this.doc.text(intro, MARGIN_L, y);
    y += intro.length * 4.5 + 5;

    this.drawKvBox(
      [
        {
          k: 'Retention window (this account tier)',
          v: `${dl.retentionDays} days · ${dl.retentionTier}`,
        },
        { k: 'Encryption at rest', v: dl.encryptionAtRest },
        { k: 'Encryption in transit', v: dl.encryptionInTransit },
        {
          k: 'Legal hold available',
          v: dl.legalHoldAvailable ? 'Yes (Enterprise + on-request)' : 'No',
        },
        { k: 'Right to erasure', v: dl.rightToErasure },
        { k: 'Production region', v: dl.productionRegion },
      ],
      y
    );
    y += 60;

    this.drawSectionHeading('SUB-PROCESSORS', y);
    y += 7;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(40, 40, 40);
    for (const sp of dl.subProcessors) {
      this.doc.text(`• ${sp}`, MARGIN_L, y);
      y += 4.5;
    }
    y += 4;

    this.drawSectionHeading('ON THE PUBLISHED ROADMAP', y);
    y += 7;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(60, 60, 60);
    for (const r of dl.roadmap) {
      const wrapped = this.doc.splitTextToSize(`• ${r}`, TEXT_W - 4);
      this.doc.text(wrapped, MARGIN_L, y);
      y += wrapped.length * 4 + 1;
    }
    y += 4;

    this.drawSectionHeading('CONTRACTUAL CONTACT', y);
    y += 7;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text(
      `Retention, erasure, legal hold, and sub-processor change notifications: ${dl.retentionContact}`,
      MARGIN_L,
      y
    );
    y += 8;

    if (data.clientSafe?.enabled) {
      this.drawSectionHeading('CLIENT-SAFE EXPORT · SCRUB SUMMARY', y);
      y += 7;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(40, 40, 40);
      const cs = data.clientSafe;
      this.doc.text(
        `Entities masked: ${cs.entitiesMasked}  ·  Amounts masked: ${cs.amountsMasked}  ·  Person names masked: ${cs.namesMasked}`,
        MARGIN_L,
        y
      );
      y += 5;
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 120, 120);
      const csNote = this.doc.splitTextToSize(
        'Original entities and amounts available to authorised reviewers in the source platform under access controls. Placeholder map is held server-side; this exported PDF carries no reverse-lookup table.',
        TEXT_W
      );
      this.doc.text(csNote, MARGIN_L, y);
      y += csNote.length * 4 + 4;
    }
  }
}

function formatBiasKey(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Money formatter (Counterfactual Impact, Page 1) ───────────────
// Compact representation: 1.2M, 850K, 1.4B. No currency symbol — that
// goes alongside in the rendering call so different currencies pair
// cleanly with their numerical magnitude.
function formatMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toFixed(0);
}

// ─── Client-Safe scrub (DPR v2 #5) ─────────────────────────────────
// Replaces entity names, amounts, and person names in the meta strip
// + summary + reviewer notes with stable placeholders. Uses the SAME
// regex patterns as src/lib/utils/redaction-scanner.ts for parity, but
// inlined here to keep the generator client-side and zero-dep.
const CS_ENTITY_RE =
  /\b((?:[A-Z][A-Za-z0-9&'.-]+(?:\s+(?:&\s+|of\s+|the\s+)?)?){1,5}),?\s+(?:Inc|LLC|L\.L\.C\.|Ltd|Limited|GmbH|Pty|Plc|PLC|AG|SA|N\.V\.|NV|Corp|Corporation|Co\.|Company|S\.A\.|S\.A\.R\.L|S\.r\.l|S\.p\.A|BV|B\.V\.|AB|AS|ApS|Oy|S\.L\.|S\.L|Pvt|Pvt\.|Holdings|Group|Trust|Fund|Capital|Partners|Ventures|Bank|Limited\.)(?=[\s.,;:!?\]\)\}'"]|$)/g;
const CS_AMOUNT_RE =
  /(?:[$£€₦¥]|USD|GBP|EUR|NGN|JPY)\s?\d+(?:[.,]\d+)?\s?(?:million|billion|trillion|m|bn?|tn?|k)\b|(?:[$£€₦¥]|USD|GBP|EUR|NGN|JPY)\s?\d{1,3}(?:,\d{3}){2,}(?:\.\d+)?|\b\d+(?:[.,]\d+)?\s?(?:million|billion|trillion)\b/gi;
const CS_NAME_RE = /\b([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,20})\b/g;

const CS_NAME_DENYLIST = new Set(
  [
    'Decision Intel',
    'Decision Quality',
    'Bias Genome',
    'Recognition Rigor',
    'European Union',
    'United Kingdom',
    'United States',
    'South Africa',
    'New York',
    'San Francisco',
    'Cape Town',
    'Annual Report',
    'Board Members',
    'Audit Committee',
    'Steering Committee',
    'Investment Committee',
    'EU AI',
    'UK White',
    'SEC Reg',
    'Basel III',
    'Reserve Bank',
    'Central Bank',
    'National Bank',
    'General Partner',
    'Limited Partner',
  ].map(s => s.toLowerCase())
);

function applyClientSafeScrub(data: ProvenanceRecordData): ProvenanceRecordData {
  let entities = 0;
  let amounts = 0;
  let names = 0;

  const scrub = (text: string | null | undefined): string => {
    if (!text) return text ?? '';
    let out = text;
    // Entities first (longer matches) so person-name regex doesn't cannibalise them.
    let eIdx = 0;
    out = out.replace(CS_ENTITY_RE, () => {
      eIdx += 1;
      entities += 1;
      return `[ENTITY_${eIdx}]`;
    });
    let aIdx = 0;
    out = out.replace(CS_AMOUNT_RE, () => {
      aIdx += 1;
      amounts += 1;
      return `[AMOUNT_${aIdx}]`;
    });
    let nIdx = 0;
    out = out.replace(CS_NAME_RE, (m, first: string, last: string) => {
      const key = `${first} ${last}`.toLowerCase();
      if (CS_NAME_DENYLIST.has(key)) return m;
      nIdx += 1;
      names += 1;
      return `[NAME_${nIdx}]`;
    });
    return out;
  };

  const scrubbedFilename = scrub(data.meta.filename);
  const scrubbedSummary = scrub(data.meta.summary);
  const scrubbedMetaVerdict = data.meta.metaVerdict ? scrub(data.meta.metaVerdict) : null;
  const scrubbedTopMitigation = data.meta.topMitigation ? scrub(data.meta.topMitigation) : null;

  const scrubbedReviewer = data.reviewerDecisions
    ? {
        ...data.reviewerDecisions,
        signOffNote: data.reviewerDecisions.signOffNote
          ? scrub(data.reviewerDecisions.signOffNote)
          : null,
        acceptedMitigations: data.reviewerDecisions.acceptedMitigations.map(m => ({
          ...m,
          mitigation: scrub(m.mitigation),
        })),
        dismissedFlags: data.reviewerDecisions.dismissedFlags.map(d => ({
          ...d,
          reason: scrub(d.reason),
        })),
        dissentLog: data.reviewerDecisions.dissentLog.map(d => ({
          ...d,
          objection: scrub(d.objection),
          resolution: d.resolution ? scrub(d.resolution) : null,
        })),
      }
    : undefined;

  return {
    ...data,
    meta: {
      ...data.meta,
      filename: scrubbedFilename,
      summary: scrubbedSummary,
      metaVerdict: scrubbedMetaVerdict,
      topMitigation: scrubbedTopMitigation,
    },
    reviewerDecisions: scrubbedReviewer,
    clientSafe: {
      enabled: true,
      entitiesMasked: entities,
      amountsMasked: amounts,
      namesMasked: names,
      scrubAppliedAt: new Date().toISOString(),
    },
  };
}
