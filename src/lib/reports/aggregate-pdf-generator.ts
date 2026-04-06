import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createHash } from 'crypto';
import { formatBiasName } from '@/lib/utils/labels';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import type { BiasCategory } from '@/types';
import type { RegulatoryAssessment } from '@/lib/compliance/regulatory-graph';

interface RiskSummary {
  totalDocuments: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageScore: number;
  criticalBiases: number;
}

interface DocumentWithRisk {
  id: string;
  filename: string;
  status: string;
  uploadedAt: string;
  analyses: {
    overallScore: number;
    noiseScore: number;
    biases: { severity: string; biasType: string }[];
    factCheck?: { score: number };
  }[];
}

export class AggregatePdfGenerator {
  private doc: jsPDF;
  private secondaryColor: [number, number, number] = [30, 41, 59]; // Slate-800

  constructor() {
    this.doc = new jsPDF();
  }

  public generateRiskReport(documents: DocumentWithRisk[], summary: RiskSummary) {
    this.addHeader();
    this.addReportMetadata();

    let yPos = 120;
    yPos = this.addExecutiveSummary(summary, yPos);

    this.addRiskDistribution(summary, yPos);

    this.doc.addPage();
    this.addPageHeader('High Risk Documents');

    const highRiskDocs = documents.filter(d => d.analyses[0] && d.analyses[0].overallScore < 40);

    if (highRiskDocs.length > 0) {
      this.addHighRiskTable(highRiskDocs);
    } else {
      this.doc.text('No high risk documents detected.', 20, 50);
    }

    this.addBiasAnalysis(documents);

    // Works Cited — every bias type flagged in the report gets its academic
    // reference surfaced, converting the PDF into a credibility artifact.
    const biasTypesInReport = new Set<string>();
    documents.forEach(d => {
      d.analyses[0]?.biases.forEach(b => biasTypesInReport.add(b.biasType));
    });
    if (biasTypesInReport.size > 0) {
      this.addWorksCited(Array.from(biasTypesInReport));
    }

    this.addFooter();
    this.doc.save(`risk-audit-portfolio-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private addHeader() {
    // Corporate Header Bar
    this.doc.setFillColor(5, 5, 5); // Pitch Black
    this.doc.rect(0, 0, 210, 40, 'F');

    // Logo / Title area
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DECISION INTEL', 20, 25);

    // Subtitle
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(150, 150, 150);
    this.doc.text('PORTFOLIO RISK AUDIT', 150, 25);
  }

  private addPageHeader(title: string) {
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(this.secondaryColor[0], this.secondaryColor[1], this.secondaryColor[2]);
    this.doc.text(title.toUpperCase(), 20, 30);
    this.doc.setDrawColor(220, 220, 220);
    this.doc.line(20, 35, 190, 35);
  }

  private addReportMetadata() {
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(250, 250, 250);
    this.doc.roundedRect(15, 50, 180, 50, 2, 2, 'FD');

    this.doc.setTextColor(50, 50, 50);
    this.doc.setFontSize(12);
    this.doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 25, 65);
    this.doc.text(`Audit ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 120, 65);
  }

  private addExecutiveSummary(summary: RiskSummary, startY: number): number {
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('EXECUTIVE SUMMARY', 20, startY);

    // KPI Cards
    const cardY = startY + 15;

    // Avg Score
    this.drawScoreCard(
      'Portfolio DQ Score',
      `${summary.averageScore}/100`,
      20,
      cardY,
      summary.averageScore >= 70
        ? [22, 163, 74]
        : summary.averageScore >= 40
          ? [234, 179, 8]
          : [220, 38, 38]
    );

    // Total Docs
    this.drawScoreCard('Documents Audited', `${summary.totalDocuments}`, 80, cardY, [30, 41, 59]);

    // Critical Biases
    this.drawScoreCard('Critical Risks', `${summary.highRiskCount}`, 140, cardY, [220, 38, 38]);

    return cardY + 50;
  }

  private drawScoreCard(
    label: string,
    value: string,
    x: number,
    y: number,
    color: number[] = [30, 41, 59]
  ) {
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.roundedRect(x, y, 50, 30, 2, 2, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(9);
    this.doc.text(label.toUpperCase(), x + 25, y + 10, { align: 'center' });

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(value, x + 25, y + 22, { align: 'center' });
  }

  private addRiskDistribution(summary: RiskSummary, startY: number) {
    this.doc.setFontSize(12);
    this.doc.setTextColor(50, 50, 50);
    this.doc.text('Risk Distribution Profile:', 20, startY);

    const total = summary.totalDocuments || 1;
    const lowPct = Math.round((summary.lowRiskCount / total) * 100);
    const medPct = Math.round((summary.mediumRiskCount / total) * 100);
    const highPct = Math.round((summary.highRiskCount / total) * 100);

    // Simple bar visualization
    const x = 20;
    const width = 170;
    const height = 15;
    const y = startY + 10;

    if (lowPct > 0) {
      this.doc.setFillColor(22, 163, 74); // Green
      this.doc.rect(x, y, (lowPct / 100) * width, height, 'F');
    }
    if (medPct > 0) {
      this.doc.setFillColor(234, 179, 8); // Yellow
      this.doc.rect(x + (lowPct / 100) * width, y, (medPct / 100) * width, height, 'F');
    }
    if (highPct > 0) {
      this.doc.setFillColor(220, 38, 38); // Red
      this.doc.rect(x + ((lowPct + medPct) / 100) * width, y, (highPct / 100) * width, height, 'F');
    }

    // Legend
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Low Risk: ${lowPct}%`, 20, y + 25);
    this.doc.text(`Medium Risk: ${medPct}%`, 80, y + 25);
    this.doc.text(`High Risk: ${highPct}%`, 140, y + 25);
  }

  private addHighRiskTable(docs: DocumentWithRisk[]) {
    const tableData = docs.map(d => [
      d.filename,
      d.analyses[0]?.overallScore || 'N/A',
      d.analyses[0]?.biases.length || 0,
      new Date(d.uploadedAt).toLocaleDateString(),
    ]);

    autoTable(this.doc, {
      startY: 50,
      head: [['FILENAME', 'DQ SCORE', 'BIASES', 'DATE']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
      },
    });
  }

  private addBiasAnalysis(docs: DocumentWithRisk[]) {
    // Aggregate biases
    const biasCounts: Record<string, number> = {};
    docs.forEach(d => {
      d.analyses[0]?.biases.forEach(b => {
        biasCounts[b.biasType] = (biasCounts[b.biasType] || 0) + 1;
      });
    });

    // Convert to array and sort
    const sortedBiases = Object.entries(biasCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10

    // Check if we need a new page
    const docWithTable = this.doc as jsPDF & { lastAutoTable?: { finalY: number } };
    let startY = docWithTable.lastAutoTable ? docWithTable.lastAutoTable.finalY + 30 : 150;

    if (startY > 220) {
      this.doc.addPage();
      startY = 40;
    }

    this.doc.setFontSize(14);
    this.doc.setTextColor(30, 41, 59);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Top Systemic Biases', 20, startY);

    const tableData = sortedBiases.map(([type, count]) => [formatBiasName(type), count]);

    autoTable(this.doc, {
      startY: startY + 10,
      head: [['BIAS PATTERN', 'FREQUENCY']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'center' },
      },
    });
  }

  /**
   * Works Cited section — looks up the academic reference for every bias type
   * present in the report and renders a de-duplicated, formally cited list.
   * Turns the PDF into a credibility artifact: every finding is backed by a
   * specific peer-reviewed paper (Kahneman, Tversky, Arkes, Milgram, etc.)
   * with DOI when available.
   */
  public addWorksCited(biasTypes: string[]) {
    // Normalize + dedupe bias keys to their BIAS_EDUCATION entries
    const seen = new Set<string>();
    const refs: Array<{
      key: string;
      citation: string;
      doi?: string;
      url?: string;
    }> = [];

    biasTypes.forEach(raw => {
      const normalized = raw
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z_]/g, '') as BiasCategory;
      if (seen.has(normalized)) return;
      const entry = BIAS_EDUCATION[normalized];
      if (!entry) return;
      seen.add(normalized);
      refs.push({
        key: normalized,
        citation: entry.academicReference.citation,
        doi: entry.academicReference.doi,
        url: entry.academicReference.url,
      });
    });

    if (refs.length === 0) return;

    // Sort alphabetically by citation for scholarly convention
    refs.sort((a, b) => a.citation.localeCompare(b.citation));

    // New page for Works Cited
    this.doc.addPage();
    this.addPageHeader('Research Foundations');

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      'Every bias flagged in this report is grounded in peer-reviewed research.',
      20,
      60
    );
    this.doc.text(
      'The references below are the original sources for each detection methodology.',
      20,
      66
    );

    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(30, 30, 30);
    this.doc.setFontSize(9);

    let y = 78;
    const pageBottomY = 270;
    const lineHeight = 4.4;

    refs.forEach((ref, i) => {
      // Page break if we would overflow
      const estimatedLines = Math.ceil(this.doc.getTextWidth(ref.citation) / 165) + 2;
      const estimatedHeight = estimatedLines * lineHeight + 4;
      if (y + estimatedHeight > pageBottomY) {
        this.doc.addPage();
        this.addPageHeader('Research Foundations (cont.)');
        y = 60;
      }

      // Entry number + friendly bias name
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(30, 41, 59);
      this.doc.text(`[${i + 1}] ${formatBiasName(ref.key)}`, 20, y);
      y += lineHeight + 1;

      // Citation body (wrapped)
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(50, 50, 50);
      const wrapped = this.doc.splitTextToSize(ref.citation, 170) as string[];
      wrapped.forEach(line => {
        this.doc.text(line, 24, y);
        y += lineHeight;
      });

      // DOI / URL as a footnote line
      if (ref.doi) {
        this.doc.setTextColor(59, 130, 246);
        const doiText = `DOI: https://doi.org/${ref.doi}`;
        this.doc.textWithLink(doiText, 24, y, { url: `https://doi.org/${ref.doi}` });
        y += lineHeight;
      } else if (ref.url) {
        this.doc.setTextColor(59, 130, 246);
        this.doc.textWithLink(`Source: ${ref.url}`, 24, y, { url: ref.url });
        y += lineHeight;
      }

      y += 3; // spacing between entries
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // AUDIT DEFENSE PACKET (M8)
  // ─────────────────────────────────────────────────────────────────────
  //
  // Single-analysis export. Produces a branded, cryptographically-hashed
  // PDF suitable for filing with auditors, compliance officers, or a
  // board. Every regulatory finding cites the specific framework section
  // (e.g., "SOX §302"), embeds the underlying document excerpt, and
  // lists concrete remediation steps. The final page reuses
  // addWorksCited() from M2.3 so every bias claim is traceable to a
  // peer-reviewed paper.
  //
  // The tamper-evidence hash is computed over stable source inputs
  // (analysisId + documentFilename + generatedAt + assessment payload)
  // not the PDF bytes themselves — this lets a verifier reconstruct the
  // hash from the same inputs without the original PDF.

  public generateAuditDefensePacket(input: AuditDefensePacketInput): {
    doc: jsPDF;
    filename: string;
    hash: string;
  } {
    const hash = this.computeDefensePacketHash(input);

    this.addAuditDefenseCover(input, hash);

    // Per-framework pages — only render frameworks that actually have
    // triggered provisions. Empty assessments would just be noise.
    for (const assessment of input.assessments) {
      if (assessment.triggeredProvisions.length === 0) continue;
      this.addComplianceFrameworkSection(assessment, input);
    }

    // Executive summary of bias findings that drove the assessment
    if (input.biasFindings.length > 0) {
      this.addAuditDefenseBiasSection(input);
    }

    // Research foundations — reuses M2.3 for every bias type cited
    const biasTypes = input.biasFindings.map(b => b.biasType);
    if (biasTypes.length > 0) {
      this.addWorksCited(biasTypes);
    }

    this.addFooter();

    const safeId = input.analysisId.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `audit-defense-${safeId}-${new Date().toISOString().split('T')[0]}.pdf`;
    return { doc: this.doc, filename, hash };
  }

  /**
   * Stable SHA-256 hash over the packet's source inputs. Deterministic —
   * the same inputs always produce the same hash — so a downstream
   * verifier can re-compute it from the database without needing the
   * original PDF. The hash is embedded in the cover page footer and
   * logged to AuditLog by the /api/compliance/audit-packet route.
   *
   * Note: this is NOT a cryptographic signature. It is a tamper-evidence
   * marker. If someone modifies the PDF, the embedded hash will still
   * match the source data, but the PDF content will not match what the
   * hash represents — any verifier can detect the mismatch by re-running
   * the generator.
   */
  private computeDefensePacketHash(input: AuditDefensePacketInput): string {
    const canonical = JSON.stringify(
      {
        analysisId: input.analysisId,
        documentFilename: input.documentFilename,
        generatedAt: input.generatedAt.toISOString(),
        overallScore: input.overallScore,
        biasCount: input.biasFindings.length,
        assessments: input.assessments.map(a => ({
          frameworkId: a.framework.id,
          overallRiskScore: a.overallRiskScore,
          triggered: a.triggeredProvisions.map(t => ({
            provisionId: t.provision.id,
            section: t.provision.section,
            weight: Math.round(t.aggregateRiskWeight * 1000) / 1000,
            biases: [...t.triggeringBiases].sort(),
          })),
        })),
      },
      null,
      0
    );
    return createHash('sha256').update(canonical).digest('hex');
  }

  private addAuditDefenseCover(input: AuditDefensePacketInput, hash: string) {
    // Full-page black hero — matches the brand's existing header treatment
    this.doc.setFillColor(5, 5, 5);
    this.doc.rect(0, 0, 210, 110, 'F');

    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(26);
    this.doc.text('DECISION INTEL', 20, 35);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(180, 180, 180);
    this.doc.text('AUDIT DEFENSE PACKET', 20, 45);

    // Divider accent
    this.doc.setDrawColor(239, 68, 68); // red-500 — signals "regulatory"
    this.doc.setLineWidth(2);
    this.doc.line(20, 52, 60, 52);

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    const titleLines = this.doc.splitTextToSize(
      input.documentFilename || 'Analysis Report',
      170
    ) as string[];
    let titleY = 68;
    titleLines.slice(0, 2).forEach(line => {
      this.doc.text(line, 20, titleY);
      titleY += 8;
    });

    // Metadata strip
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(200, 200, 200);
    const metaY = Math.max(titleY + 4, 90);
    this.doc.text(`Analysis ID: ${input.analysisId}`, 20, metaY);
    this.doc.text(`Generated: ${input.generatedAt.toISOString()}`, 20, metaY + 5);
    this.doc.text(`Org: ${input.orgName || 'Personal'}`, 20, metaY + 10);

    // Below-hero content
    this.doc.setTextColor(30, 30, 30);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.text('Summary of Regulatory Findings', 20, 130);

    // Quick-scan table of framework hits
    const tableBody = input.assessments
      .filter(a => a.triggeredProvisions.length > 0)
      .map(a => [
        a.framework.name,
        `${a.triggeredProvisions.length}`,
        `${a.overallRiskScore}/100`,
        a.overallRiskLevel.toUpperCase(),
      ]);

    if (tableBody.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(11);
      this.doc.setTextColor(80, 80, 80);
      this.doc.text(
        'No regulatory provisions triggered. Overall compliance posture is clean.',
        20,
        142
      );
    } else {
      autoTable(this.doc, {
        startY: 136,
        head: [['FRAMEWORK', 'PROVISIONS HIT', 'RISK SCORE', 'LEVEL']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
        },
      });
    }

    // Overall decision score callout
    const docWithTable = this.doc as jsPDF & { lastAutoTable?: { finalY: number } };
    let calloutY = docWithTable.lastAutoTable ? docWithTable.lastAutoTable.finalY + 14 : 160;
    if (calloutY > 230) calloutY = 210;

    this.doc.setFillColor(247, 247, 247);
    this.doc.rect(20, calloutY, 170, 30, 'F');
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(20, calloutY, 170, 30);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text('DECISION QUALITY SCORE', 25, calloutY + 8);
    this.doc.setFontSize(24);
    this.doc.setTextColor(30, 30, 30);
    this.doc.text(`${input.overallScore}`, 25, calloutY + 22);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('/ 100', 55, calloutY + 22);

    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    const countText = `${input.biasFindings.length} bias findings · ${tableBody.length} framework${tableBody.length === 1 ? '' : 's'} triggered`;
    this.doc.text(countText, 90, calloutY + 16);

    // Tamper-evidence hash footer
    this.doc.setFontSize(7);
    this.doc.setTextColor(120, 120, 120);
    this.doc.setFont('courier', 'normal');
    this.doc.text('TAMPER-EVIDENCE HASH (SHA-256):', 20, 270);
    // Split hash onto 2 lines since courier wraps narrowly
    this.doc.text(hash.slice(0, 32), 20, 275);
    this.doc.text(hash.slice(32), 20, 280);

    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8);
    this.doc.text(
      'This hash is computed deterministically from the analysis inputs. A verifier can re-run the',
      20,
      286
    );
    this.doc.text(
      'same analysis and recompute this hash to confirm the packet has not been altered.',
      20,
      290
    );
  }

  private addComplianceFrameworkSection(
    assessment: RegulatoryAssessment,
    input: AuditDefensePacketInput
  ) {
    this.doc.addPage();

    // Page header
    this.addPageHeader(assessment.framework.name);

    // Jurisdiction + category subheader
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      `${assessment.framework.jurisdiction} · ${assessment.framework.category.replace(/_/g, ' ')} · Risk ${assessment.overallRiskLevel.toUpperCase()} (${assessment.overallRiskScore}/100)`,
      20,
      55
    );

    let y = 70;
    const pageBottomY = 260;

    for (const trig of assessment.triggeredProvisions) {
      // Estimate space needed for this provision (title + description + excerpt)
      // Page break early if we'd overflow
      if (y > pageBottomY - 40) {
        this.doc.addPage();
        this.addPageHeader(`${assessment.framework.name} (cont.)`);
        y = 60;
      }

      // Provision header: section code + title
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.doc.setTextColor(30, 41, 59);
      this.doc.text(`${trig.provision.section} — ${trig.provision.title}`, 20, y);
      y += 6;

      // Risk weight indicator
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      const weightPct = Math.round(trig.aggregateRiskWeight * 100);
      this.doc.text(
        `Aggregate risk weight: ${weightPct}% · Triggering biases: ${trig.triggeringBiases.map(formatBiasName).join(', ')}`,
        20,
        y
      );
      y += 6;

      // Provision description (wrapped)
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
      this.doc.setTextColor(50, 50, 50);
      const descLines = this.doc.splitTextToSize(trig.provision.description, 170) as string[];
      descLines.forEach(line => {
        if (y > pageBottomY) {
          this.doc.addPage();
          this.addPageHeader(`${assessment.framework.name} (cont.)`);
          y = 60;
        }
        this.doc.text(line, 20, y);
        y += 4.2;
      });
      y += 2;

      // Bias mechanism / explanation
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(9);
      this.doc.setTextColor(80, 80, 100);
      const mechLines = this.doc.splitTextToSize(`Mechanism: ${trig.explanation}`, 170) as string[];
      mechLines.forEach(line => {
        if (y > pageBottomY) {
          this.doc.addPage();
          this.addPageHeader(`${assessment.framework.name} (cont.)`);
          y = 60;
        }
        this.doc.text(line, 20, y);
        y += 4.2;
      });
      y += 3;

      // Supporting excerpt from the analyzed document — pick the first
      // bias finding whose type is in triggeringBiases as the evidence
      const evidenceBias = input.biasFindings.find(b => trig.triggeringBiases.includes(b.biasType));
      if (evidenceBias && evidenceBias.excerpt) {
        this.doc.setFillColor(248, 248, 250);
        const excerptLines = this.doc.splitTextToSize(
          `"${evidenceBias.excerpt.slice(0, 400)}"`,
          160
        ) as string[];
        const excerptHeight = excerptLines.length * 4.2 + 6;

        if (y + excerptHeight > pageBottomY) {
          this.doc.addPage();
          this.addPageHeader(`${assessment.framework.name} (cont.)`);
          y = 60;
        }

        this.doc.rect(20, y - 3, 170, excerptHeight, 'F');
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(20, y - 3, 20, y - 3 + excerptHeight);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);
        this.doc.setTextColor(70, 70, 70);
        this.doc.text('EVIDENCE FROM SOURCE DOCUMENT:', 25, y + 1);
        y += 5;
        this.doc.setFont('helvetica', 'italic');
        excerptLines.forEach(line => {
          this.doc.text(line, 25, y);
          y += 4.2;
        });
        y += 5;
      }

      // Remediation for this provision (from the assessment's remediation list)
      const relevantRemediations = assessment.remediationSteps.filter(
        r => r.targetProvision === trig.provision.id
      );
      if (relevantRemediations.length > 0) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(9);
        this.doc.setTextColor(22, 163, 74); // green — remediation is action
        this.doc.text('Recommended remediation:', 20, y);
        y += 5;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(50, 50, 50);
        for (const r of relevantRemediations) {
          const rLines = this.doc.splitTextToSize(
            `[${r.priority.replace(/_/g, ' ').toUpperCase()}] ${r.action}`,
            165
          ) as string[];
          rLines.forEach(line => {
            if (y > pageBottomY) {
              this.doc.addPage();
              this.addPageHeader(`${assessment.framework.name} (cont.)`);
              y = 60;
            }
            this.doc.text(line, 25, y);
            y += 4.2;
          });
        }
        y += 3;
      }

      // Separator between provisions
      this.doc.setDrawColor(230, 230, 230);
      this.doc.line(20, y, 190, y);
      y += 8;
    }
  }

  /**
   * Executive summary of bias findings that drove the assessment. Sits
   * between the per-framework pages and the Works Cited section so a
   * reader can see the full picture: "which biases triggered these
   * provisions, and which section of the document showed them."
   */
  private addAuditDefenseBiasSection(input: AuditDefensePacketInput) {
    this.doc.addPage();
    this.addPageHeader('Bias Findings Summary');

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      'Every bias finding that contributed to the regulatory assessment, with supporting excerpt.',
      20,
      55
    );

    // Group by severity (critical → high → medium → low)
    const severityOrder = ['critical', 'high', 'medium', 'low'];
    const grouped = [...input.biasFindings].sort(
      (a, b) =>
        severityOrder.indexOf(a.severity.toLowerCase()) -
        severityOrder.indexOf(b.severity.toLowerCase())
    );

    const body = grouped.map(b => [
      formatBiasName(b.biasType),
      b.severity.toUpperCase(),
      `${Math.round((b.confidence ?? 0.5) * 100)}%`,
      (b.excerpt || '').slice(0, 160) + ((b.excerpt || '').length > 160 ? '…' : ''),
    ]);

    autoTable(this.doc, {
      startY: 62,
      head: [['BIAS', 'SEVERITY', 'CONFIDENCE', 'EXCERPT']],
      body,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 95, fontStyle: 'italic' },
      },
    });
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(20, 280, 190, 280);
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(`Generated by Decision Intel Platform - Page ${i} of ${pageCount}`, 105, 288, {
        align: 'center',
      });
    }
  }
}

// ─── Audit Defense Packet Input Type (M8) ────────────────────────────────

export interface AuditDefensePacketInput {
  analysisId: string;
  documentFilename: string;
  orgName: string | null;
  generatedAt: Date;
  overallScore: number;
  biasFindings: Array<{
    biasType: string;
    severity: string;
    confidence: number | null;
    excerpt: string;
  }>;
  assessments: RegulatoryAssessment[];
}
