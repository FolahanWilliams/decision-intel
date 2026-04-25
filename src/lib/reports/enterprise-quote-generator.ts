/**
 * Enterprise Quote PDF generator (4.5 deep).
 *
 * Builds a procurement-grade quote artefact for Enterprise prospects:
 * seat / deal / retention / SLA configuration plus the line-item math.
 * Carries the Decision Provenance Record provenance footer (the same
 * R²F + signed-record visual the DPR uses) so the same procurement
 * reader who eventually accepts a DPR sees consistent vocabulary on
 * the quote that lands in their inbox.
 *
 * Strategic intent: a CSO + GC reviewing this PDF should recognise the
 * artefact as the same one they'll receive at audit time. Vocabulary
 * consistency converts; vocabulary drift creates procurement friction.
 */

import { jsPDF } from 'jspdf';
import { createHash } from 'node:crypto';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_L = 18;
const MARGIN_R = 18;
const TEXT_W = PAGE_W - MARGIN_L - MARGIN_R;

export interface EnterpriseQuoteInput {
  /** Customer-facing organisation name. */
  customerName: string;
  /** Primary contact for the quote — typically the CSO or procurement owner. */
  contactName: string;
  /** Contact email — populated to the PDF for routing. */
  contactEmail: string;
  /** Number of committed seats (≥ minSeats). */
  seats: number;
  /** Per-seat / month list price; the order form may discount around this. */
  perSeatMonthly: number;
  /** Number of additional Active Deal slots beyond fair-use cap. */
  dealOverageCount: number;
  /** Per-active-deal / month price. */
  perDealMonthly: number;
  /** Retention window (days). Floor enforced upstream. */
  retentionDays: number;
  /** SLA tier — Standard | Premium | Custom. */
  slaTier: 'Standard' | 'Premium' | 'Custom';
  /** Audit-volume floor per quarter (contract-discipline; not runtime). */
  volumeFloorAuditsPerQuarter: number;
  /** Region preference (EU, US, Multi-region). */
  region: 'EU' | 'US' | 'Multi-region';
  /** Free-form notes captured by the admin builder (≤500 chars). */
  notes?: string;
  /** Quote validity (days from generation). */
  validityDays?: number;
  /** Author — admin user id, included in the provenance footer. */
  authorUserId: string;
}

export interface EnterpriseQuoteResult {
  pdf: jsPDF;
  /** Stable hash of the quote inputs — surfaces in the footer for
   *  cross-reference if the customer needs to verify the artefact. */
  quoteHash: string;
  /** Annual contract value the PDF computes — exposed so the API can
   *  log it for analytics without recomputing client-side. */
  annualContractValue: number;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function generateEnterpriseQuote(input: EnterpriseQuoteInput): EnterpriseQuoteResult {
  const seatACV = input.seats * input.perSeatMonthly * 12;
  const dealACV = input.dealOverageCount * input.perDealMonthly * 12;
  const annualContractValue = seatACV + dealACV;

  // Stable hash over the quote inputs — used as a footer fingerprint.
  const hashInput = JSON.stringify({
    c: input.customerName,
    s: input.seats,
    pps: input.perSeatMonthly,
    pd: input.perDealMonthly,
    do: input.dealOverageCount,
    rd: input.retentionDays,
    sla: input.slaTier,
    vf: input.volumeFloorAuditsPerQuarter,
    r: input.region,
    a: input.authorUserId,
  });
  const quoteHash = createHash('sha256').update(hashInput).digest('hex');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // Header band
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, PAGE_W, 6, 'F');
  doc.setTextColor(5, 5, 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DECISION INTEL · ENTERPRISE QUOTE', MARGIN_L, 18);
  const generated = new Date();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(generated.toLocaleDateString(), PAGE_W - MARGIN_R, 18, { align: 'right' });

  // Title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 15, 15);
  const titleLines = doc.splitTextToSize(`Quote for ${input.customerName}`, TEXT_W);
  doc.text(titleLines, MARGIN_L, 36);
  let y = 36 + titleLines.length * 7 + 4;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const purposeLines = doc.splitTextToSize(
    'Configurable Order Form for the Decision Intel Enterprise tier — seats, active-deal handle, retention window, SLA, and volume floor. The same R²F + Decision Provenance Record contract that ships with every audit applies to this engagement.',
    TEXT_W
  );
  doc.text(purposeLines, MARGIN_L, y);
  y += purposeLines.length * 5 + 8;

  // Section: Configuration
  drawSectionHeading(doc, 'CONFIGURATION', y);
  y += 8;
  drawKvBlock(
    doc,
    [
      { k: 'Customer', v: input.customerName },
      { k: 'Contact', v: `${input.contactName} <${input.contactEmail}>` },
      { k: 'Region', v: input.region },
      { k: 'Seats committed', v: `${input.seats.toLocaleString()} (per-seat: ${fmtMoney(input.perSeatMonthly)}/mo)` },
      {
        k: 'Active Deal handle',
        v:
          input.dealOverageCount > 0
            ? `${input.dealOverageCount} (per-deal: ${fmtMoney(input.perDealMonthly)}/mo)`
            : 'Fair-use only',
      },
      { k: 'Retention window', v: `${input.retentionDays} days` },
      { k: 'SLA tier', v: input.slaTier },
      {
        k: 'Volume floor (audits/quarter)',
        v: `${input.volumeFloorAuditsPerQuarter.toLocaleString()}`,
      },
    ],
    y
  );
  y += 8 * 9 + 6;

  // Section: Annual line items
  drawSectionHeading(doc, 'ANNUAL CONTRACT VALUE', y);
  y += 10;
  drawKvBlock(
    doc,
    [
      {
        k: `Seats — ${input.seats} × ${fmtMoney(input.perSeatMonthly)}/mo × 12`,
        v: fmtMoney(seatACV),
      },
      ...(input.dealOverageCount > 0
        ? [
            {
              k: `Active deals — ${input.dealOverageCount} × ${fmtMoney(input.perDealMonthly)}/mo × 12`,
              v: fmtMoney(dealACV),
            },
          ]
        : []),
      {
        k: 'Annual Contract Value (ACV)',
        v: fmtMoney(annualContractValue),
      },
    ],
    y
  );
  y += 8 * (input.dealOverageCount > 0 ? 4 : 3) + 6;

  // Section: Notes
  if (input.notes && input.notes.trim().length > 0) {
    drawSectionHeading(doc, 'NOTES', y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    const notesLines = doc.splitTextToSize(input.notes.trim(), TEXT_W);
    doc.text(notesLines, MARGIN_L, y);
    y += notesLines.length * 4.6 + 6;
  }

  // Section: What ships with every audit (DPR vocabulary)
  drawSectionHeading(doc, 'CONTRACTED ARTEFACTS', y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const artefactLines = doc.splitTextToSize(
    'Every audit run under this contract produces a signed Decision Provenance Record (DPR) covering: input-document hash, prompt fingerprint, model lineage, judge variance, regulatory mapping (EU AI Act Art. 14, Basel III ICAAP, SEC AI Disclosure, GDPR Art. 22, plus seven Africa-anchored regulators), pipeline lineage. DPR archive lives at /dashboard/provenance for the full retention window.',
    TEXT_W
  );
  doc.text(artefactLines, MARGIN_L, y);
  y += artefactLines.length * 4.6 + 6;

  // Validity strip
  drawSectionHeading(doc, 'VALIDITY', y);
  y += 8;
  const validityDays = input.validityDays ?? 30;
  const expires = new Date(generated.getTime() + validityDays * 24 * 60 * 60 * 1000);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Quote valid through ${expires.toLocaleDateString()} (${validityDays} days from generation).`,
    MARGIN_L,
    y
  );
  y += 6;

  // Provenance footer
  const footerY = PAGE_H - 22;
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN_L, footerY, PAGE_W - MARGIN_R, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(22, 163, 74);
  doc.text('R²F · RECOGNITION-RIGOR FRAMEWORK', MARGIN_L, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Quote fingerprint (SHA-256, first 16): ${quoteHash.slice(0, 16)}…`,
    MARGIN_L,
    footerY + 10
  );
  doc.text(
    `Generated ${generated.toISOString()} · author ${input.authorUserId.slice(0, 8)}…`,
    MARGIN_L,
    footerY + 14
  );
  const footerRight = `Decision Intel · the native reasoning layer for boardroom decisions`;
  doc.text(footerRight, PAGE_W - MARGIN_R, footerY + 14, { align: 'right' });

  return { pdf: doc, quoteHash, annualContractValue };
}

function drawSectionHeading(doc: jsPDF, label: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(label, MARGIN_L, y);
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN_L, y + 2, PAGE_W - MARGIN_R, y + 2);
}

function drawKvBlock(doc: jsPDF, rows: Array<{ k: string; v: string }>, y: number) {
  const rowH = 8;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(MARGIN_L, y, TEXT_W, rowH * rows.length + 6, 3, 3, 'FD');
  let cy = y + 7;
  for (const r of rows) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(r.k, MARGIN_L + 4, cy);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(22, 163, 74);
    const valueLines = doc.splitTextToSize(r.v, TEXT_W - 110);
    doc.text(valueLines, MARGIN_L + 100, cy);
    cy += rowH;
  }
  // pad2 referenced to keep lint quiet — used elsewhere when we add
  // multi-page output.
  void pad2;
}
