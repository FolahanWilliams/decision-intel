import jsPDF from 'jspdf';
import { formatBiasName } from '@/lib/utils/labels';
import type { ReportAnalysisData, ReportBiasInstance, SimulationData } from './pdf-generator';

interface BoardReportData {
  filename: string;
  analysis: ReportAnalysisData & {
    mitigations?: Array<{ biasType?: string; recommendation?: string; suggestion?: string }>;
  };
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SEVERITY_RGB: Record<string, [number, number, number]> = {
  critical: [220, 38, 38],
  high: [234, 88, 12],
  medium: [234, 179, 8],
  low: [59, 130, 246],
};

const MAX_SUMMARY_CHARS = 500;
const MAX_EXCERPT_CHARS = 180;
const MAX_MITIGATION_CHARS = 400;
const MAX_TITLE_CHARS = 70;

function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

function gradeFromScore(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function interpretGrade(grade: string): string {
  switch (grade) {
    case 'A':
      return 'Board-ready. Strong reasoning across the stack.';
    case 'B':
      return 'Mostly solid. Address the flagged biases before the vote.';
    case 'C':
      return 'Mixed. Several reasoning gaps need explicit treatment.';
    case 'D':
      return 'Weak. Rework required before the committee reviews.';
    default:
      return 'Critical. Reset the memo before re-circulating.';
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export class BoardReportGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  public generateReport(data: BoardReportData) {
    const { filename, analysis } = data;
    const title = truncate(filename.replace(/\.[^.]+$/, ''), MAX_TITLE_CHARS);
    const topBiases = [...(analysis.biases || [])]
      .sort(
        (a, b) =>
          (SEVERITY_ORDER[a.severity?.toLowerCase()] ?? 4) -
          (SEVERITY_ORDER[b.severity?.toLowerCase()] ?? 4)
      )
      .slice(0, 3);

    this.drawPageOne({ title, analysis, topBiases });
    this.doc.addPage();
    this.drawPageTwo({ analysis, topBiases });
    this.drawFooter();

    this.doc.save(`board-report-${slugify(filename)}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private drawPageOne({
    title,
    analysis,
    topBiases,
  }: {
    title: string;
    analysis: ReportAnalysisData;
    topBiases: ReportBiasInstance[];
  }) {
    // Accent band
    this.doc.setFillColor(22, 163, 74);
    this.doc.rect(0, 0, 210, 6, 'F');

    // Header
    this.doc.setTextColor(5, 5, 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text('BOARD-READY DECISION AUDIT', 20, 18);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(new Date().toLocaleDateString(), 190, 18, { align: 'right' });

    // Title
    this.doc.setTextColor(5, 5, 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    const titleLines = this.doc.splitTextToSize(title, 170);
    this.doc.text(titleLines, 20, 32);
    const titleHeight = titleLines.length * 8;

    // DQI card
    const cardY = 32 + titleHeight + 4;
    const score = Math.round(analysis.overallScore || 0);
    const grade = gradeFromScore(score);
    this.drawDqiCard(cardY, score, grade);

    // Executive summary
    let yPos = cardY + 42;
    this.drawSectionHeading('EXECUTIVE SUMMARY', yPos);
    yPos += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(40, 40, 40);
    const summaryText = truncate(analysis.summary || 'No summary generated.', MAX_SUMMARY_CHARS);
    const summaryLines = this.doc.splitTextToSize(summaryText, 170);
    this.doc.text(summaryLines, 20, yPos);
    yPos += summaryLines.length * 5 + 8;

    // Top 3 biases
    this.drawSectionHeading('TOP 3 COGNITIVE RISKS', yPos);
    yPos += 8;
    if (topBiases.length === 0) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(10);
      this.doc.setTextColor(90, 130, 90);
      this.doc.text('No significant biases detected.', 20, yPos);
    } else {
      for (const bias of topBiases) {
        yPos = this.drawBiasRow(bias, yPos);
        if (yPos > 260) break;
      }
    }
  }

  private drawDqiCard(y: number, score: number, grade: string) {
    // Card background
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setFillColor(250, 250, 250);
    this.doc.roundedRect(20, y, 170, 34, 3, 3, 'FD');

    // Score
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(28);
    this.doc.setTextColor(22, 163, 74);
    this.doc.text(`${score}`, 30, y + 22);

    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('/100', 56, y + 22);

    // Grade pill
    this.doc.setFillColor(22, 163, 74);
    this.doc.roundedRect(75, y + 10, 18, 14, 2, 2, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text(grade, 84, y + 20, { align: 'center' });

    // Interpretation
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(60, 60, 60);
    this.doc.text('DECISION QUALITY INDEX', 100, y + 13);
    this.doc.setFontSize(9);
    this.doc.setTextColor(80, 80, 80);
    const interp = this.doc.splitTextToSize(interpretGrade(grade), 85);
    this.doc.text(interp, 100, y + 20);
  }

  private drawBiasRow(bias: ReportBiasInstance, startY: number): number {
    const severity = (bias.severity || 'medium').toLowerCase();
    const color = SEVERITY_RGB[severity] || [100, 100, 100];
    const name = formatBiasName(bias.biasType);
    const excerpt = truncate(bias.excerpt || bias.explanation || '', MAX_EXCERPT_CHARS);

    // Severity stripe
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.rect(20, startY - 4, 2, 22, 'F');

    // Name + severity
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(10, 10, 10);
    this.doc.text(name, 26, startY + 2);

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.text(severity.toUpperCase(), 190, startY + 2, { align: 'right' });

    // Excerpt
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(70, 70, 70);
    const excerptLines = this.doc.splitTextToSize(`"${excerpt}"`, 162);
    this.doc.text(excerptLines, 26, startY + 9);

    return startY + 9 + excerptLines.length * 4.5 + 6;
  }

  private drawPageTwo({
    analysis,
    topBiases,
  }: {
    analysis: BoardReportData['analysis'];
    topBiases: ReportBiasInstance[];
  }) {
    // Accent band
    this.doc.setFillColor(22, 163, 74);
    this.doc.rect(0, 0, 210, 6, 'F');

    this.doc.setTextColor(5, 5, 5);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.text('BOARD-READY DECISION AUDIT', 20, 18);

    // Simulated CEO question
    let yPos = 32;
    this.drawSectionHeading('SIMULATED CEO QUESTION', yPos);
    yPos += 8;
    const ceoQuestion = extractTopCeoQuestion(analysis.simulation);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(30, 30, 30);
    const ceoLines = this.doc.splitTextToSize(ceoQuestion, 170);
    this.doc.text(ceoLines, 20, yPos);
    yPos += ceoLines.length * 5.5 + 12;

    // Recommended mitigation
    this.drawSectionHeading('RECOMMENDED MITIGATION', yPos);
    yPos += 8;
    const mitigationText = extractTopMitigation(topBiases, analysis.mitigations);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10.5);
    this.doc.setTextColor(40, 40, 40);
    const mitigationLines = this.doc.splitTextToSize(
      truncate(mitigationText, MAX_MITIGATION_CHARS),
      170
    );
    this.doc.text(mitigationLines, 20, yPos);
  }

  private drawSectionHeading(label: string, y: number) {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(label, 20, y);
    this.doc.setDrawColor(220, 220, 220);
    this.doc.line(20, y + 2, 190, y + 2);
  }

  private drawFooter() {
    const pages = this.doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      this.doc.setPage(i);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(
        `Generated by Decision Intel · ${new Date().toLocaleDateString()} · Page ${i}/${pages}`,
        105,
        290,
        { align: 'center' }
      );
    }
  }
}

function extractTopCeoQuestion(simulation: SimulationData | undefined): string {
  if (!simulation?.twins || simulation.twins.length === 0) {
    return 'No simulated questions yet — re-run analysis to generate.';
  }
  // Pick the rationale from the twin with the lowest-confidence approval or a rejection.
  const sorted = [...simulation.twins].sort((a, b) => {
    const aScore = (a.vote === 'REJECT' ? 0 : 1) * 100 + a.confidence;
    const bScore = (b.vote === 'REJECT' ? 0 : 1) * 100 + b.confidence;
    return aScore - bScore;
  });
  const top = sorted[0];
  return `From ${top.name} (${top.role}): "${top.rationale}"`;
}

function extractTopMitigation(
  topBiases: ReportBiasInstance[],
  mitigations: BoardReportData['analysis']['mitigations']
): string {
  if (topBiases.length === 0) {
    return 'No material biases flagged. Proceed to the committee with the standard decision template.';
  }
  const primary = topBiases[0];
  if (mitigations && mitigations.length > 0) {
    const matched = mitigations.find(m => m.biasType === primary.biasType);
    const text = matched?.recommendation || matched?.suggestion;
    if (text) return text;
  }
  if (primary.suggestion) return primary.suggestion;
  if (primary.explanation) return primary.explanation;
  return `Address ${formatBiasName(primary.biasType)} directly before the vote — request an independent review of the reasoning chain and capture the dissent in the board packet.`;
}
