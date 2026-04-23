/**
 * Hallway Brief — one-page PDF a CSO hands the CEO in the hallway
 * before the board meeting. Sits between the full board report and the
 * DPR: the board report is the committee artifact, the DPR is the
 * regulator artifact, the Hallway Brief is the 90-second artifact.
 *
 * Shape:
 *   - Header strip: filename, DQI grade + score, R²F mark
 *   - Verdict line (one sentence pulled from metaVerdict or derived)
 *   - Top recommendation (one mitigation from the highest-severity bias)
 *   - Top 3 risks (sorted by severity → confidence)
 *   - One counterfactual: "address bias X → estimated DQI +Ypp"
 *   - Signed footer (reviewer block + R²F + date)
 *
 * Design note: the brief is intentionally austere. No cover art, no
 * banding. A CSO folding this into a manila folder doesn't want
 * infographic chrome; they want five pieces of information in a row.
 */

import jsPDF from 'jspdf';
import { formatBiasName } from '@/lib/utils/labels';

const PAGE_W = 210; // mm (A4)
const MARGIN_L = 18;
const MARGIN_R = 18;
const TEXT_W = PAGE_W - MARGIN_L - MARGIN_R;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_RGB: Record<string, [number, number, number]> = {
  critical: [220, 38, 38],
  high: [234, 88, 12],
  medium: [202, 138, 4],
  low: [37, 99, 235],
};

export interface HallwayBriefBias {
  biasType: string;
  severity?: string | null;
  confidence?: number | null;
  excerpt?: string | null;
  explanation?: string | null;
  suggestion?: string | null;
}

export interface HallwayBriefData {
  filename: string;
  overallScore: number;
  noiseScore?: number;
  summary?: string | null;
  metaVerdict?: string | null;
  biases: HallwayBriefBias[];
  generatedAt?: Date;
  reviewerName?: string | null;
}

function gradeFromScore(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function oneLineVerdict(score: number, metaVerdict: string | null | undefined): string {
  if (metaVerdict && metaVerdict.trim().length > 0) {
    const clean = metaVerdict.trim().replace(/\s+/g, ' ');
    return clean.length > 220 ? clean.slice(0, 219) + '…' : clean;
  }
  if (score >= 80) return 'Board-ready. Proceed to the committee with standard governance.';
  if (score >= 60) return 'Mixed. Address the flagged risks in sequence before the vote.';
  if (score >= 40) return 'Weak. Rework the reasoning chain before re-circulating.';
  return 'Critical. Reset the memo before any committee review.';
}

function truncate(text: string, max: number): string {
  const clean = (text ?? '').trim().replace(/\s+/g, ' ');
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + '…';
}

function severityRgb(sev: string | null | undefined): [number, number, number] {
  const key = (sev ?? 'medium').toLowerCase();
  return SEVERITY_RGB[key] ?? SEVERITY_RGB.medium;
}

function sortBiasesBySeverity(biases: HallwayBriefBias[]): HallwayBriefBias[] {
  return [...biases].sort((a, b) => {
    const aSev = SEVERITY_ORDER[(a.severity ?? 'medium').toLowerCase()] ?? 2;
    const bSev = SEVERITY_ORDER[(b.severity ?? 'medium').toLowerCase()] ?? 2;
    if (aSev !== bSev) return aSev - bSev;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });
}

function counterfactualLine(top: HallwayBriefBias, score: number): string {
  // Conservative, defensible heuristic: severity → DQI lift band. Keeps
  // the brief truthful without calling the counterfactual engine here.
  const sev = (top.severity ?? 'medium').toLowerCase();
  const lift = sev === 'critical' ? 14 : sev === 'high' ? 10 : sev === 'medium' ? 6 : 3;
  const projected = Math.min(100, Math.round(score) + lift);
  return `Address ${formatBiasName(top.biasType)} first — addressed rigorously, the memo moves toward DQI ${projected} (≈+${lift}pp).`;
}

export class HallwayBriefGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF({ format: 'a4' });
  }

  public generateAndDownload(data: HallwayBriefData): jsPDF {
    this.render(data);
    const slug = data.filename.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 40);
    const stamp = (data.generatedAt ?? new Date()).toISOString().slice(0, 10);
    this.doc.save(`hallway-brief-${slug}-${stamp}.pdf`);
    return this.doc;
  }

  public generate(data: HallwayBriefData): jsPDF {
    this.render(data);
    return this.doc;
  }

  private render(data: HallwayBriefData) {
    const topBiases = sortBiasesBySeverity(data.biases).slice(0, 3);
    const score = Math.round(data.overallScore);
    const grade = gradeFromScore(score);
    const verdict = oneLineVerdict(score, data.metaVerdict);
    const generatedAt = data.generatedAt ?? new Date();

    // Header band
    this.doc.setFillColor(22, 163, 74);
    this.doc.rect(0, 0, PAGE_W, 3, 'F');

    // Top strip: filename + grade
    this.doc.setTextColor(20, 20, 20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text('HALLWAY BRIEF', MARGIN_L, 16);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(90, 90, 90);
    this.doc.text(
      `Generated ${generatedAt.toISOString().slice(0, 10)}`,
      PAGE_W - MARGIN_R,
      16,
      { align: 'right' }
    );

    this.doc.setTextColor(22, 163, 74);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.text('R²F · RECOGNITION-RIGOR FRAMEWORK', MARGIN_L, 22);

    // Filename
    this.doc.setTextColor(5, 5, 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(15);
    const title = truncate(data.filename.replace(/\.[^.]+$/, ''), 72);
    this.doc.text(title, MARGIN_L, 32);

    // DQI card (right-aligned big number + grade)
    const cardRight = PAGE_W - MARGIN_R;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(30);
    this.doc.text(String(score), cardRight, 34, { align: 'right' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(110, 110, 110);
    this.doc.text(`DQI · Grade ${grade}`, cardRight, 40, { align: 'right' });

    let y = 46;

    // Verdict row
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
    y += 6;

    this.sectionLabel('VERDICT', y);
    y += 6;
    this.doc.setTextColor(20, 20, 20);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(11);
    const verdictLines = this.doc.splitTextToSize(verdict, TEXT_W);
    this.doc.text(verdictLines, MARGIN_L, y);
    y += verdictLines.length * 5 + 6;

    // Top recommendation
    const top = topBiases[0];
    if (top) {
      this.sectionLabel('TOP RECOMMENDATION', y);
      y += 6;
      const rec = top.suggestion ?? top.explanation ?? `Address ${formatBiasName(top.biasType)} before circulating.`;
      this.doc.setTextColor(20, 20, 20);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(11);
      const recLines = this.doc.splitTextToSize(truncate(rec, 340), TEXT_W);
      this.doc.text(recLines, MARGIN_L, y);
      y += recLines.length * 5 + 6;
    }

    // Top 3 risks
    this.sectionLabel('TOP RISKS', y);
    y += 6;
    if (topBiases.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10.5);
      this.doc.setTextColor(110, 110, 110);
      this.doc.text('No material biases flagged in this memo.', MARGIN_L, y);
      y += 8;
    } else {
      for (const b of topBiases) {
        const [r, g, bl] = severityRgb(b.severity);
        // Severity chip
        this.doc.setFillColor(r, g, bl);
        this.doc.roundedRect(MARGIN_L, y - 3, 22, 5, 1, 1, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(7);
        this.doc.text((b.severity ?? 'medium').toUpperCase(), MARGIN_L + 11, y + 0.5, {
          align: 'center',
        });

        // Bias name
        this.doc.setTextColor(20, 20, 20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(10.5);
        this.doc.text(formatBiasName(b.biasType), MARGIN_L + 26, y + 0.5);

        // Excerpt or explanation (one-liner)
        const detail = truncate(b.excerpt ?? b.explanation ?? '', 180);
        if (detail) {
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(9.5);
          this.doc.setTextColor(80, 80, 80);
          const detailLines = this.doc.splitTextToSize(detail, TEXT_W - 26);
          this.doc.text(detailLines, MARGIN_L + 26, y + 6);
          y += 6 + detailLines.length * 4.2 + 3;
        } else {
          y += 8;
        }
      }
    }

    // Counterfactual
    if (top) {
      y += 2;
      this.sectionLabel('IF ONE THING CHANGES', y);
      y += 6;
      this.doc.setTextColor(22, 163, 74);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(10.5);
      const cfLines = this.doc.splitTextToSize(counterfactualLine(top, score), TEXT_W);
      this.doc.text(cfLines, MARGIN_L, y);
      y += cfLines.length * 5 + 4;
      this.doc.setTextColor(110, 110, 110);
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.doc.text(
        'Projected lift is a defensible band based on severity; the live counterfactual engine',
        MARGIN_L,
        y
      );
      y += 4;
      this.doc.text(
        'runs the full scenario and produces the exact DQI delta — see the audit detail page.',
        MARGIN_L,
        y
      );
      y += 6;
    }

    // Signature block
    y = Math.max(y, 248);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y);
    y += 6;

    this.sectionLabel('REVIEWER COUNTER-SIGNATURE', y);
    y += 6;
    this.doc.setTextColor(90, 90, 90);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    const sigLine = data.reviewerName
      ? `${data.reviewerName} · signed ${generatedAt.toISOString().slice(0, 10)}`
      : 'Name · signed ______________________';
    this.doc.text(sigLine, MARGIN_L, y);
    y += 6;

    // Footer
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN_L, 282, PAGE_W - MARGIN_R, 282);
    this.doc.setTextColor(150, 150, 150);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.text(
      'Hallway Brief · R²F · Decision Intel',
      PAGE_W / 2,
      287,
      { align: 'center' }
    );
    this.doc.text(
      `DQI ${score} · Grade ${grade} · Biases ${data.biases.length}${typeof data.noiseScore === 'number' ? ` · Noise ${Math.round(data.noiseScore)}` : ''}`,
      PAGE_W / 2,
      291,
      { align: 'center' }
    );
  }

  private sectionLabel(label: string, y: number) {
    this.doc.setTextColor(110, 110, 110);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.text(label, MARGIN_L, y);
  }
}
