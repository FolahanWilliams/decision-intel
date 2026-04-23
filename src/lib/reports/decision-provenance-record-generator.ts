/**
 * Decision Provenance Record — PDF generator.
 *
 * Client-side jsPDF generator that emits a 4-page artifact the CSO's
 * General Counsel can hand to the audit committee, SEC, or plaintiff's
 * counsel — or more usefully, the record their AI-augmented
 * decision-making was always supposed to produce. Pages:
 *
 *   1. Cover + hashes — title, filename, input hash, prompt fingerprint,
 *      timestamp, reviewer signature block.
 *   2. Model lineage + judge variance — which model tier ran on which
 *      node; the noise score + meta-verdict; honest note about granular
 *      judge outputs.
 *   3. Academic citations + regulatory mapping — every detected bias
 *      with its APA citation and the frameworks (Basel III, EU AI Act,
 *      SEC Reg D, FCA Consumer Duty, SOX, GDPR Art 22, LPOA) it touches.
 *   4. Pipeline lineage + "What this record proves" GC-ready appendix.
 *
 * Honesty discipline: every page declares what's stored vs. what's
 * available on request. A GC reading this should never discover that a
 * claim was overstated when they ask for backup.
 */

import jsPDF, { GState } from 'jspdf';
import type { ProvenanceRecordData } from './provenance-record-data';

const MAX_TITLE_CHARS = 70;
const PAGE_W = 210; // A4 mm
const MARGIN_L = 20;
const MARGIN_R = 20;
const TEXT_W = PAGE_W - MARGIN_L - MARGIN_R;

function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

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
  public generate(data: ProvenanceRecordData, opts?: { watermark?: string }): jsPDF {
    this.drawPageOne(data);
    this.doc.addPage();
    this.drawPageTwo(data);
    this.doc.addPage();
    this.drawPageThree(data);
    this.doc.addPage();
    this.drawPageFour(data);
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

  // ─── Page 1: Cover + hashes ────────────────────────────────────────
  private drawPageOne(data: ProvenanceRecordData) {
    this.drawAccentBand();
    this.drawHeader('DECISION PROVENANCE RECORD');

    const title = truncate(data.meta.filename.replace(/\.[^.]+$/, ''), MAX_TITLE_CHARS);

    // Title
    this.doc.setTextColor(5, 5, 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    const titleLines = this.doc.splitTextToSize(title, TEXT_W);
    this.doc.text(titleLines, MARGIN_L, 34);
    let y = 34 + titleLines.length * 8 + 4;

    // R²F framework mark — names the category claim on the cover so the
    // reviewer sees it before anything else (CLAUDE.md 2026-04-22 lock).
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text('R²F · RECOGNITION-RIGOR FRAMEWORK', MARGIN_L, y);
    y += 6;

    // Purpose strap
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(10);
    this.doc.setTextColor(80, 80, 80);
    const purposeLines = this.doc.splitTextToSize(
      'Signed, hashed evidence record for this strategic memo\u2019s Decision Intel audit. ' +
        'Shareable with your audit committee, General Counsel, or regulator of record.',
      TEXT_W
    );
    this.doc.text(purposeLines, MARGIN_L, y);
    y += purposeLines.length * 5 + 8;

    // Integrity card
    this.drawSectionHeading('INTEGRITY FINGERPRINTS', y);
    y += 10;

    this.drawKvBox(
      [
        { k: 'Input document hash (SHA-256)', v: formatHashShort(data.inputHash) },
        { k: 'Prompt version fingerprint (SHA-256)', v: formatHashShort(data.promptFingerprint) },
        { k: 'Record schema version', v: `v${data.schemaVersion}` },
        {
          k: 'Server-side timestamp',
          v: data.generatedAt.toISOString() + ' (RFC 3161 TSA: deferred to v2)',
        },
      ],
      y
    );
    y += 42;

    // Audit summary
    this.drawSectionHeading('AUDIT SUMMARY', y);
    y += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(30, 30, 30);
    const summaryText = truncate(data.meta.summary || 'No summary generated.', 460);
    const summaryLines = this.doc.splitTextToSize(summaryText, TEXT_W);
    this.doc.text(summaryLines, MARGIN_L, y);
    y += summaryLines.length * 5 + 10;

    // Score + bias count strip
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text(
      `DQI ${Math.round(data.meta.overallScore)} / 100     \u00b7     Noise Score ${Math.round(
        data.meta.noiseScore
      )} / 100     \u00b7     ${data.meta.biasCount} biases detected`,
      MARGIN_L,
      y
    );
    y += 12;

    // Recommended next action — forward-looking remediation the GC or
    // audit committee can act on before signing. Pulled from the highest-
    // severity bias's mitigation suggestion. Falls back to an honest
    // pointer to page 3 when no mitigation text is available.
    this.drawSectionHeading('RECOMMENDED NEXT ACTION', y);
    y += 8;
    if (data.meta.topMitigation && data.meta.topMitigationFor) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(9);
      this.doc.setTextColor(22, 163, 74);
      this.doc.text(`Addresses: ${data.meta.topMitigationFor}`, MARGIN_L, y);
      y += 5;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);
      this.doc.setTextColor(30, 30, 30);
      const mitigationText = truncate(data.meta.topMitigation, 380);
      const mitigationLines = this.doc.splitTextToSize(mitigationText, TEXT_W);
      this.doc.text(mitigationLines, MARGIN_L, y);
      y += mitigationLines.length * 5 + 8;
    } else {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(9.5);
      this.doc.setTextColor(90, 90, 90);
      const noMitigationLines = this.doc.splitTextToSize(
        'No individual-bias mitigation exceeded the surfacing threshold for this audit. See Academic Citations and Regulatory Mapping (page 3) for framework-level remediation guidance.',
        TEXT_W
      );
      this.doc.text(noMitigationLines, MARGIN_L, y);
      y += noMitigationLines.length * 4.5 + 8;
    }

    // Reviewer signature block
    this.drawSectionHeading('REVIEWER COUNTER-SIGNATURE', y);
    y += 8;
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9);
    this.doc.setTextColor(90, 90, 90);
    this.doc.text(
      'For the CSO, General Counsel, or delegated reviewer to sign on receipt.',
      MARGIN_L,
      y
    );
    y += 10;
    this.drawSignatureLine('Reviewer name', y);
    y += 14;
    this.drawSignatureLine('Role / title', y);
    y += 14;
    this.drawSignatureLine('Signature, date', y);
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
}

function formatBiasKey(biasType: string): string {
  return biasType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
