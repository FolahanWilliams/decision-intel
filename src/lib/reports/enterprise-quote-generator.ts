/**
 * Enterprise Quote PDF generator (4.5 deep).
 *
 * Builds a procurement-grade quote artefact for Enterprise prospects:
 * seat / deal / retention / SLA configuration plus the line-item math.
 * Carries the Decision Provenance Record provenance footer (the same
 * R²F + hashed-record visual the DPR uses) so the same procurement
 * reader who eventually accepts a DPR sees consistent vocabulary on
 * the quote that lands in their inbox.
 *
 * Indicative-only discipline (locked 2026-04-26 after the persona
 * audit): the public quote endpoint generates this PDF without
 * authentication, which under common-law contract principles (UCC +
 * Restatement 2nd of Contracts) could create offer-acceptance liability
 * if a counterparty purports to "accept" a dated price quote with a
 * named offeree. Page 1 carries a non-binding disclaimer; page 2
 * carries the Enterprise terms appendix (indemnification, SLA, data
 * portability, audit rights, exit assistance, sub-processor change
 * notice, governing law). Do NOT remove either; both are load-bearing.
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

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * SLA uptime targets per tier — drives the operative clause text on the
 * Enterprise terms appendix page. When a tier's uptime commitment
 * changes, update HERE so the appendix and any downstream Order Form
 * generator stay aligned.
 *
 * Aligned 2026-05-02 to /terms §10C SLA tier commitments — Standard now
 * mirrors Strategy-tier (99.5% / RTO 4h / RPO 15min) and Premium mirrors
 * Enterprise-tier (99.9% / RTO 4h / RPO 15min). The prior values
 * (99.0% no RTO / 99.5% sub-12h) drifted from /terms, which the persona
 * audit flagged as a procurement-grade inconsistency a James-class GC
 * catches in <30 seconds when reading both surfaces.
 */
const SLA_TIER_UPTIME: Record<'Standard' | 'Premium' | 'Custom', string> = {
  Standard:
    '99.5% monthly availability for the document analysis pipeline. Recovery time objective (RTO) under 4 hours; recovery point objective (RPO) under 15 minutes. Matches the Strategy tier commitment in our published Terms §10C.',
  Premium:
    '99.9% monthly availability for the document analysis pipeline. Recovery time objective (RTO) under 4 hours; recovery point objective (RPO) under 15 minutes. Matches the Enterprise tier commitment in our published Terms §10C.',
  Custom: 'as separately agreed in the executed Order Form.',
};

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
  const generated = new Date();

  // ─── PAGE 1: Configuration + ACV + Indicative validity + non-binding disclaimer ───
  drawHeaderBand(doc, 'DECISION INTEL · ENTERPRISE QUOTE', generated);

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
    'Indicative configuration for the Decision Intel Enterprise tier — seats, active-deal handle, retention window, SLA, and volume floor. The R²F + Decision Provenance Record contract that ships with every audit applies to any executed engagement under this configuration.',
    TEXT_W
  );
  doc.text(purposeLines, MARGIN_L, y);
  y += purposeLines.length * 5 + 6;

  // ─── Non-binding disclaimer (amber-banded, prominent, page 1) ───
  y = drawNonBindingDisclaimer(doc, y);

  // Section: Configuration
  drawSectionHeading(doc, 'CONFIGURATION', y);
  y += 8;
  const regionLabel =
    input.region === 'US'
      ? 'US (production today)'
      : `${input.region} (Enterprise-conversation residency, not production today)`;

  drawKvBlock(
    doc,
    [
      { k: 'Customer', v: input.customerName },
      { k: 'Contact', v: `${input.contactName} <${input.contactEmail}>` },
      { k: 'Region', v: regionLabel },
      {
        k: 'Seats committed',
        v: `${input.seats.toLocaleString()} (per-seat: ${fmtMoney(input.perSeatMonthly)}/mo)`,
      },
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
  drawSectionHeading(doc, 'ANNUAL CONTRACT VALUE (INDICATIVE)', y);
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
        k: 'Annual Contract Value (ACV) — indicative',
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

  // Section: Contracted artefacts
  drawSectionHeading(doc, 'CONTRACTED ARTEFACTS', y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const artefactLines = doc.splitTextToSize(
    'Every audit run under any executed engagement produces a hashed, tamper-evident Decision Provenance Record (DPR) covering: input-document SHA-256 hash, prompt fingerprint, model lineage, judge variance, regulatory mapping (EU AI Act Art. 14, Basel III ICAAP, SEC AI Disclosure, GDPR Art. 22, plus eight Africa-anchored regulators), pipeline lineage. DPR archive lives at /dashboard/provenance for the full retention window. See appendix on page 2 for the operative Enterprise terms.',
    TEXT_W
  );
  doc.text(artefactLines, MARGIN_L, y);
  y += artefactLines.length * 4.6 + 6;

  // Region-specific clarifier — surfaces when the selected region is
  // not the US production tier so the GC reading the PDF doesn't infer
  // a residency commitment that isn't yet provisioned.
  if (input.region !== 'US') {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14); // amber-800
    const regionNoteLines = doc.splitTextToSize(
      `Note on hosting region: production today runs on Vercel + Supabase US. ${input.region} residency is available on Enterprise design-partner configurations and is confirmed during the Order Form discussion. The "Region" line above records the stated preference; it is not a representation that ${input.region} hosting is provisioned today.`,
      TEXT_W
    );
    doc.text(regionNoteLines, MARGIN_L, y);
    y += regionNoteLines.length * 4.4 + 6;
  }

  // Indicative validity strip
  drawSectionHeading(doc, 'INDICATIVE VALIDITY', y);
  y += 8;
  const validityDays = input.validityDays ?? 30;
  const expires = new Date(generated.getTime() + validityDays * 24 * 60 * 60 * 1000);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(
    `Pricing herein remains indicative through ${expires.toLocaleDateString()} (${validityDays} days from generation), after which it is subject to refresh. This document is not a binding offer — see disclaimer above and Enterprise Terms Appendix on page 2.`,
    MARGIN_L,
    y,
    { maxWidth: TEXT_W }
  );
  y += 14;

  drawProvenanceFooter(doc, quoteHash, generated, input.authorUserId, 'Page 1 of 2');

  // ─── PAGE 2: Enterprise Terms Appendix ───
  doc.addPage();
  drawHeaderBand(doc, 'ENTERPRISE TERMS APPENDIX · INDICATIVE', generated);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 15, 15);
  doc.text('Enterprise Terms Appendix', MARGIN_L, 36);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  const appendixLeadLines = doc.splitTextToSize(
    'The provisions below describe the operative Enterprise terms that will be incorporated into any Order Form executed under this configuration. They are reproduced here so a procurement reviewer or General Counsel sees the contract shape before the engagement is opened. Final binding text is the executed Order Form + Master Services Agreement.',
    TEXT_W
  );
  doc.text(appendixLeadLines, MARGIN_L, 44);
  let py = 44 + appendixLeadLines.length * 4.6 + 4;

  const provisions: Array<{ label: string; clause: string }> = [
    {
      label: '1. Indemnification',
      clause:
        'Decision Intel will defend the customer against third-party claims that the service infringes a US patent, copyright, or trade secret. The customer will defend Decision Intel against third-party claims arising from the customer’s use of the service in violation of law or this agreement. Each party’s aggregate liability under this clause is capped at the fees paid by the customer in the twelve (12) months preceding the claim, except for breaches of confidentiality, indemnification obligations, or wilful misconduct.',
    },
    {
      label: `2. Service Level (${input.slaTier} tier)`,
      clause: `Target uptime: ${SLA_TIER_UPTIME[input.slaTier]}. Service credits accrue against the next monthly invoice when measured uptime falls below the tier target, calculated on a per-percentage-point basis up to a cap of 30% of the monthly fee. Scheduled maintenance and force-majeure events are excluded from availability calculations and are notified in advance where practicable.`,
    },
    {
      label: '3. Data portability on termination',
      clause:
        'Upon any termination, the customer may request a machine-readable export of all Analyses, Decision Provenance Records, and associated metadata in JSON + PDF format. Decision Intel will fulfil the request within fourteen (14) calendar days. Production data is preserved against deletion during any active export request window (up to thirty days post-termination) before the standard 30-day permanent purge runs.',
    },
    {
      label: '4. Exit assistance',
      clause:
        'For thirty (30) calendar days following termination, the customer retains read-only access to the dashboard archive (no new audits) for the express purpose of completing the export above. No additional fee applies. After that window the account is permanently disabled and content purged on the standard schedule.',
    },
    {
      label: '5. Security-incident notification',
      clause:
        'Decision Intel will notify the customer of any confirmed security incident affecting the customer’s data within twenty-four (24) hours of confirmation, with a follow-up written report within seventy-two (72) hours describing the scope, root cause, and remediation. Where a regulator (EU AI Act, GDPR, NDPR, PoPIA, Basel III, SEC) requires a separate notification, Decision Intel will support the customer’s response.',
    },
    {
      label: '6. Sub-processor change notification',
      clause:
        'Decision Intel maintains the public sub-processor list at /security and /privacy. Any addition of a new sub-processor that processes customer data is preceded by thirty (30) calendar days’ written notice, during which the customer may object on reasonable grounds. The current list is the operative one as of the Order Form effective date.',
    },
    {
      label: '7. Audit rights',
      clause:
        'Once per calendar year, on reasonable notice, the customer may request the most recent SOC 2 Type II report (or equivalent attestation) covering Decision Intel’s production environment. While Decision Intel’s own product-level SOC 2 Type I report is in progress (targeted Q4 2026), customers receive on request the underlying SOC 2 Type II reports of Vercel and Supabase, the production-tier infrastructure providers, plus an executive summary of in-flight controls. Customer-led on-site audits are by mutual agreement and at customer cost.',
    },
    {
      label: '8. Governing law',
      clause:
        'This agreement is governed by the laws of the State of Delaware, USA, excluding its choice-of-law provisions. For customers in the European Economic Area or the United Kingdom, the foregoing does not affect any mandatory rights under applicable EU or UK data-protection law (including GDPR and UK GDPR), which prevail over any conflicting term and may be exercised before a Member State or UK supervisory authority.',
    },
  ];

  for (const p of provisions) {
    if (py > PAGE_H - 38) {
      // Defensive — layout calibrated to fit on one page; bail rather than overflow.
      break;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(p.label, MARGIN_L, py);
    py += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    const clauseLines = doc.splitTextToSize(p.clause, TEXT_W);
    doc.text(clauseLines, MARGIN_L, py);
    py += clauseLines.length * 4 + 4;
  }

  drawProvenanceFooter(doc, quoteHash, generated, input.authorUserId, 'Page 2 of 2');

  return { pdf: doc, quoteHash, annualContractValue };
}

function drawHeaderBand(doc: jsPDF, label: string, generated: Date) {
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, PAGE_W, 6, 'F');
  doc.setTextColor(5, 5, 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(label, MARGIN_L, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(generated.toLocaleDateString(), PAGE_W - MARGIN_R, 18, { align: 'right' });
}

function drawNonBindingDisclaimer(doc: jsPDF, y: number): number {
  // Amber-tinted, full-width band sitting under the title block. Sized
  // so a procurement reader can't visually skip it without reading at
  // least the heading.
  const lines = [
    'NOT A BINDING OFFER · INDICATIVE PRICING ONLY',
    'This document is an indicative configuration, not an offer or contract. It does not bind Decision Intel or the recipient. A binding engagement requires (i) a mutually executed Order Form, and (ii) a Master Services Agreement signed by an authorised representative of Decision Intel. Pricing herein is subject to refresh; volume, scope, and SLA terms are subject to negotiation.',
  ];
  // Background panel
  const panelH = 26;
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.roundedRect(MARGIN_L, y, TEXT_W, panelH, 2, 2, 'FD');
  doc.setTextColor(146, 64, 14); // amber-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(lines[0], MARGIN_L + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15); // amber-900
  const wrapped = doc.splitTextToSize(lines[1], TEXT_W - 8);
  doc.text(wrapped, MARGIN_L + 4, y + 11);
  return y + panelH + 6;
}

function drawProvenanceFooter(
  doc: jsPDF,
  quoteHash: string,
  generated: Date,
  authorUserId: string,
  pageLabel: string
) {
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
    `Generated ${generated.toISOString()} · author ${authorUserId.slice(0, 8)}… · ${pageLabel}`,
    MARGIN_L,
    footerY + 14
  );
  const footerRight = `Decision Intel · the native reasoning layer for boardroom decisions`;
  doc.text(footerRight, PAGE_W - MARGIN_R, footerY + 14, { align: 'right' });
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
}
