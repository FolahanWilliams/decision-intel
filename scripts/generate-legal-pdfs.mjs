#!/usr/bin/env node
/**
 * Generate the legal-grade PDFs published under /public:
 *
 *   public/dpa-template.pdf          — GDPR Art. 28 DPA template for procurement
 *   public/dpr-sample-wework.pdf     — anonymised DPR sample (US public-market)
 *   public/dpr-sample-dangote.pdf    — anonymised DPR sample (Pan-African
 *                                       industrial expansion; surfaces the
 *                                       Dalio structural-assumptions lens +
 *                                       NDPR / CBN / WAEMU regulatory mapping
 *                                       for the African design-partner cohort)
 *
 * Idempotent. Safe to re-run. Uses the jspdf already in the dependency tree —
 * no new packages.
 *
 * Usage:  node scripts/generate-legal-pdfs.mjs
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = dirname(dirname(__filename));
const PUBLIC_DIR = join(REPO_ROOT, 'public');

if (!existsSync(PUBLIC_DIR)) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function drawWatermark(doc, text) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(64);
    doc.setFont('helvetica', 'bold');
    // Diagonal watermark, centered
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.text(text, w / 2, h / 2, {
      align: 'center',
      angle: 35,
    });
    doc.restoreGraphicsState();
    doc.setTextColor(15, 23, 42); // navy restore
  }
}

function drawPageNumbers(doc, label) {
  const pages = doc.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.text(`${label}  ·  Page ${i} of ${pages}`, w / 2, h - 10, {
      align: 'center',
    });
  }
  doc.setTextColor(15, 23, 42);
}

function H1(doc, text, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text(text, 20, y);
  return y + 10;
}

function H2(doc, text, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(text, 20, y);
  return y + 6;
}

function P(doc, text, y, opts = {}) {
  const maxWidth = opts.maxWidth ?? 170;
  const size = opts.size ?? 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(30, 41, 59);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 20, y);
  return y + lines.length * (size * 0.42) + 3;
}

function Mono(doc, text, y, opts = {}) {
  const size = opts.size ?? 9;
  doc.setFont('courier', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(30, 41, 59);
  const lines = Array.isArray(text) ? text : [text];
  for (const line of lines) {
    doc.text(line, 20, y);
    y += size * 0.42 + 0.5;
  }
  return y + 2;
}

function Bullet(doc, items, y, opts = {}) {
  const maxWidth = opts.maxWidth ?? 165;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  for (const item of items) {
    const lines = doc.splitTextToSize(`•  ${item}`, maxWidth);
    doc.text(lines, 22, y);
    y += lines.length * 4.3 + 1.5;
  }
  return y + 2;
}

function pageIfNeeded(doc, y, threshold = 270) {
  if (y > threshold) {
    doc.addPage();
    return 25;
  }
  return y;
}

// ------------------------------------------------------------
// PDF 1 — DPA template
// ------------------------------------------------------------

function buildDpaTemplate() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 25;

  y = H1(doc, 'Data Processing Addendum', y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('Template for customers of Decision Intel (the "Processor")', 20, y);
  y += 9;

  y = P(
    doc,
    'This Data Processing Addendum ("DPA") supplements the Decision Intel Subscription Agreement between [CUSTOMER LEGAL NAME] ("Controller") and Decision Intel Ltd. ("Processor"). It governs the processing of Personal Data (as defined below) that Controller provides to Processor in connection with the Services. This DPA is aligned with Article 28 of Regulation (EU) 2016/679 (GDPR) and the UK GDPR.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '1. Definitions', y);
  y = P(
    doc,
    '"Personal Data" has the meaning given in GDPR Art. 4(1). "Processing" has the meaning given in GDPR Art. 4(2). "Sub-processor" means any third party engaged by Processor to process Personal Data on Controller\'s behalf. "Services" means the Decision Intel subscription services the Controller has contracted. All terms not defined in this DPA have the meaning given in the Subscription Agreement or GDPR.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '2. Subject-matter, duration, nature and purpose', y);
  y = P(
    doc,
    'Processor processes Personal Data solely to provide the Services — analysing strategic memos, board decks and related decision artefacts for cognitive biases, structural assumptions and decision-quality signals — and to produce the Decision Provenance Record (DPR) that documents that processing. Processing continues for the term of the Subscription Agreement unless terminated earlier in accordance with it.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '3. Sub-processors', y);
  y = P(doc, 'Controller authorises Processor to engage the following Sub-processors:', y);
  y = Bullet(
    doc,
    [
      'Google LLC (Gemini API) — LLM inference for bias and structural-assumption detection. Google commits not to use customer inputs or outputs to train its models under its Vertex AI terms.',
      'Anthropic PBC (Claude API) — fallback LLM inference when AI_FALLBACK_ENABLED is set. Anthropic commits not to use customer inputs or outputs to train its models under its commercial terms.',
      'Supabase Inc. — PostgreSQL database, authentication and file storage. SOC 2 Type II certified.',
      'Vercel Inc. — application hosting and edge compute. SOC 2 Type II certified.',
      'Resend (for transactional email) — notifications and session-management flows only.',
    ],
    y
  );
  y = P(
    doc,
    'Processor will notify Controller at least 30 days before adding or replacing a Sub-processor. Controller may object in writing; the parties will in good faith work to resolve the objection or, failing agreement, Controller may terminate the affected Services.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '4. Security measures', y);
  y = P(
    doc,
    'Processor maintains the following technical and organisational measures, commensurate with the state of the art:',
    y
  );
  y = Bullet(
    doc,
    [
      'Encryption at rest of document content using AES-256-GCM with key-version rotation (DOCUMENT_ENCRYPTION_KEY protocol).',
      'Encryption in transit via TLS 1.2 or higher on all public endpoints.',
      'A GDPR anonymizer node runs as the first stage of the analysis pipeline; no analysis model ever receives raw PII.',
      'Per-user and per-organisation access scoping with audit-log retention.',
      'Role-based access to production systems with SSO and least-privilege grants.',
      'Incident response plan with 72-hour notification commitment for confirmed Personal Data breaches.',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '5. Retention and deletion', y);
  y = P(
    doc,
    'Default retention windows by tier (subject to the Order Form):',
    y
  );
  y = Bullet(
    doc,
    [
      'Free tier: 30 days from upload.',
      'Individual tier: 90 days from upload.',
      'Strategy tier: 12 months from upload.',
      'Enterprise tier: configurable, 360-day default.',
    ],
    y
  );
  y = P(
    doc,
    'Controller may request deletion of any document at any time via the in-app Delete action or by written notice to privacy@decision-intel.com. Processor will soft-delete within 24 hours and permanently purge within 30 days, except where retention is required to comply with applicable law.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '6. Data subject rights', y);
  y = P(
    doc,
    'Processor will, at Controller\'s reasonable request and cost, assist Controller in responding to data-subject rights requests under GDPR Articles 15-22 (access, rectification, erasure, restriction, portability, objection, and automated-decision rights). The Decision Provenance Record serves as the meaningful-information-about-the-logic artefact required by Article 22.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '7. International transfers', y);
  y = P(
    doc,
    'Where Processing involves transfer of Personal Data outside the European Economic Area or the United Kingdom, the parties rely on the Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914) or the UK International Data Transfer Addendum, as applicable. These clauses are incorporated by reference.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '8. Audit rights', y);
  y = P(
    doc,
    'Processor will, on reasonable written request (not more than once per year, unless a breach is suspected), make available to Controller or its independent auditor (subject to reasonable confidentiality obligations) the information necessary to demonstrate compliance with this DPA. Processor shares current SOC 2 and third-party security reports on written request.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '9. Return or destruction of Personal Data', y);
  y = P(
    doc,
    'On termination of the Services, Controller may export its data for 30 days. After that window, Processor will delete Personal Data per Section 5, except where retention is required to comply with applicable law.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, '10. Governing law and notices', y);
  y = P(
    doc,
    'This DPA is governed by the law specified in the Subscription Agreement. Notices under this DPA are sent to the respective contacts listed in the Order Form. For Processor: privacy@decision-intel.com.',
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Signatures', y);
  y = P(
    doc,
    'Controller: _______________________________________   Date: _____________________',
    y,
    { size: 10 }
  );
  y = P(
    doc,
    'Name / Title: ____________________________________________________________________',
    y,
    { size: 10 }
  );
  y += 3;
  y = P(
    doc,
    'Processor (Decision Intel Ltd.): _________________________   Date: __________________',
    y,
    { size: 10 }
  );
  y = P(
    doc,
    'Name / Title: ____________________________________________________________________',
    y,
    { size: 10 }
  );
  y += 6;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This template is provided for evaluation by Controller procurement. Executed version is governed by the Order Form and any negotiated addenda.',
    20,
    y,
    { maxWidth: 170 }
  );

  drawPageNumbers(doc, 'Decision Intel · Data Processing Addendum (template)');

  const out = join(PUBLIC_DIR, 'dpa-template.pdf');
  writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
  console.log(`wrote ${out}`);
}

// ------------------------------------------------------------
// PDF 2 — DPR sample (anonymised WeWork S-1 audit)
// ------------------------------------------------------------

function buildDprSample() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 25;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('DECISION INTEL · Decision Provenance Record', 20, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('SAMPLE · for procurement evaluation', doc.internal.pageSize.getWidth() - 20, 10, {
    align: 'right',
  });

  y = 26;
  y = H1(doc, 'Audit of a private-market growth-company prospectus', y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Anonymised from a 2019 Form S-1 that was withdrawn 33 days after filing.',
    20,
    y
  );
  y += 8;

  y = H2(doc, 'Record identity', y);
  y = Mono(
    doc,
    [
      'record-id           dpr_sample_0001_anonymised',
      'audit-timestamp     2026-04-24T09:14:07Z',
      'pipeline-version    di-pipeline@v12.3.1',
      'input-hash          sha256:4a7f3d21c8e0…6f8e2d91 (sample)',
      'signature-algorithm Ed25519',
      'signer-fingerprint  4F:7A:CB:29:8E:11:D0:A2:…:7C:55',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Model lineage & prompt fingerprint', y);
  y = Mono(
    doc,
    [
      'primary-model       gemini-3-flash-preview',
      'fallback-model      claude-3.5-sonnet (not invoked on this run)',
      'judges              jury of 3 independent statistical judges',
      'prompt-hash         sha256:c90e2a14b7d3…2f0c77a1',
      'grounded-retrieval  135-case corpus · knowledge-graph edges 56,795',
      'temperature         bias=0.1  noise=0.0  structural=0.2',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Judge variance (noise stats)', y);
  y = Mono(
    doc,
    [
      'mean-score           24 / 100 (grade F)',
      'std-dev              3.1',
      'inter-judge variance 9.6 (low — judges converge)',
      'calibration-band     24 ± 4 at p=0.95',
    ],
    y
  );

  doc.addPage();
  y = 25;

  y = H2(doc, 'Cognitive biases flagged', y);
  y = P(
    doc,
    'Biases detected in the memo, each mapped to the audit-committee-ready hardening question a reviewer should be able to answer.',
    y,
    { size: 10 }
  );
  const biases = [
    {
      label: 'Narrative fallacy (critical)',
      quote:
        '"A revolution in the way people work" used as the economic-value driver; unit economics treated as a secondary exposition.',
      harden:
        'What specific unit of output does a single workspace produce, and at what gross margin net of community-contribution credits?',
    },
    {
      label: 'Founder halo (critical)',
      quote:
        'The Founder-CEO controls 20:1 supervoting shares with no independent-chair provision in the charter.',
      harden:
        'Under what conditions would the board have both the authority and the independence to remove the Founder-CEO without shareholder dispute?',
    },
    {
      label: 'Planning fallacy (high)',
      quote:
        'Twenty-three named target markets for geographic expansion within the five-year plan window.',
      harden:
        'Which markets are in the first wave, what is the per-market unit-economics gate, and what is the explicit decision to not launch the remaining markets if the first wave misses its gates?',
    },
    {
      label: 'Overconfidence on TAM (high)',
      quote:
        '$3 trillion total addressable market derived from aggregated knowledge-worker population.',
      harden:
        'What share of the target knowledge-worker population pays for a comparable service today, and what switching-cost evidence underwrites the assumed share-capture curve?',
    },
    {
      label: 'Escalation of commitment (medium)',
      quote:
        'Ongoing expansion capex in markets where the prior-year cohort has not yet reached breakeven on the disclosed membership metrics.',
      harden:
        'What is the explicit gate that would cause the committee to pause expansion capex in markets whose prior cohort is under-performing?',
    },
  ];
  for (const b of biases) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(b.label, 20, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const qLines = doc.splitTextToSize('Evidence: "' + b.quote + '"', 170);
    doc.text(qLines, 22, y);
    y += qLines.length * 4 + 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const hLines = doc.splitTextToSize('Harden with: ' + b.harden, 170);
    doc.text(hLines, 22, y);
    y += hLines.length * 4 + 4;
    y = pageIfNeeded(doc, y);
  }

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Structural assumptions (Dalio lens)', y);
  y = P(
    doc,
    'Three macro-structural determinants the memo implicitly depends on, flagged beside the cognitive biases above.',
    y,
    { size: 10 }
  );
  y = Bullet(
    doc,
    [
      'Debt cycle (high · unsupported): valuation model assumes continuation of the 2014-2019 private-market discount-rate regime. Harden with: what is the valuation floor under a public-market multiple-compression scenario of 50%?',
      'Governance (medium · partially-supported): the dual-class supervoting structure assumes regulatory tolerance of founder-controlled governance in regulated workspaces. Harden with: in which target markets does the governance structure itself create regulatory friction?',
      'Productivity (low · unsupported): plan depends on a productivity-gain thesis in knowledge-worker output that has not been substantiated with controlled comparison data.',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'EU AI Act Art. 14 mapping', y);
  y = Mono(
    doc,
    [
      'human-oversight       ≥ 1 designated reviewer (captured on record)',
      'explainability        per-bias evidence + hardening question (above)',
      'record-keeping        this DPR, hashed and signed, retained per DPA §5',
      'contestability        reviewer dissent logged before decision is ratified',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Signature block', y);
  y = Mono(
    doc,
    [
      'Signed by  di-signer-prod@decision-intel.com',
      'Public key 4F:7A:CB:29:8E:11:D0:A2:…:7C:55',
      'Signature  MEUCIQDoVqf4u…zX5c1wIhAPmLk…Bv8oK1z (truncated)',
      '',
      'Verification: https://www.decision-intel.com/regulatory/ai-verify',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This sample DPR is anonymised from a real 2019 Form S-1 audit run. Identifying text has been redacted; hashes, signatures and record-ids are sample values. The schema, field set, Art. 14 mapping and structural-assumptions lens are identical to the production artefact.',
    20,
    y,
    { maxWidth: 170 }
  );

  drawWatermark(doc, 'SAMPLE');
  drawPageNumbers(doc, 'Decision Intel · Decision Provenance Record (sample)');

  const out = join(PUBLIC_DIR, 'dpr-sample-wework.pdf');
  writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
  console.log(`wrote ${out}`);
}

// ------------------------------------------------------------
// PDF 3 — DPR sample (anonymised Pan-African industrial expansion audit)
//
// Built specifically for procurement-grade evaluation by funds operating
// in African markets. The structural-assumption block surfaces three
// Dalio determinants (currency cycle, trade share, governance), and the
// regulatory-mapping section names NDPR Art. 12, CBN AI Guidelines, and
// WAEMU alongside EU AI Act Art. 14 — so a Pan-African GC carries a
// single artefact home that satisfies both their regional regulators and
// any cross-border counterparty.
// ------------------------------------------------------------

function buildDprDangote() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 25;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('DECISION INTEL · Decision Provenance Record', 20, 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('SAMPLE · for procurement evaluation', doc.internal.pageSize.getWidth() - 20, 10, {
    align: 'right',
  });

  y = 26;
  y = H1(doc, 'Audit of a Pan-African industrial expansion thesis', y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Anonymised from a 2014 cement-sector pan-African expansion plan whose unit-economics thesis inverted between 2018-2021.',
    20,
    y,
    { maxWidth: 170 }
  );
  y += 12;

  y = H2(doc, 'Record identity', y);
  y = Mono(
    doc,
    [
      'record-id           dpr_sample_0002_em_anonymised',
      'audit-timestamp     2026-04-25T11:42:18Z',
      'pipeline-version    di-pipeline@v12.3.1',
      'input-hash          sha256:9c2e7b41a8d0…3f1a8e72 (sample)',
      'signature-algorithm Ed25519',
      'signer-fingerprint  4F:7A:CB:29:8E:11:D0:A2:…:7C:55',
      'market-context      emerging_market (auto-detected, owner-confirmed)',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Model lineage & prompt fingerprint', y);
  y = Mono(
    doc,
    [
      'primary-model       gemini-3-flash-preview',
      'fallback-model      claude-3.5-sonnet (not invoked on this run)',
      'judges              jury of 3 independent statistical judges',
      'prompt-hash         sha256:dc41f8a905e2…74b2e019',
      'grounded-retrieval  135-case corpus · knowledge-graph edges 56,795',
      'temperature         bias=0.1  noise=0.0  structural=0.2',
      'em-prior-overlay    applied — growth-rate thresholds adjusted for EM',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Judge variance (noise stats)', y);
  y = Mono(
    doc,
    [
      'mean-score           34 / 100 (grade F)',
      'std-dev              4.2',
      'inter-judge variance 17.8 (medium — judges diverge on the trade-share',
      '                     determinant; convergence on currency-cycle)',
      'calibration-band     34 ± 6 at p=0.95',
    ],
    y
  );

  doc.addPage();
  y = 25;

  y = H2(doc, 'Cognitive biases flagged', y);
  y = P(
    doc,
    'Biases detected in the memo, each mapped to the audit-committee-ready hardening question a reviewer should be able to answer before capital commitment.',
    y,
    { size: 10 }
  );
  const biases = [
    {
      label: 'Survivorship bias (critical)',
      quote:
        'EBITDA margins "converging toward Nigerian reference levels" used as the cross-market unit-economics anchor for ten target markets.',
      harden:
        'What share of the Nigerian margin advantage is attributable to dollar-linked cement pricing, protective trade measures, and concentrated market structure that do not exist uniformly across the ten target markets?',
    },
    {
      label: 'Overconfidence on capacity utilisation (critical)',
      quote:
        '70-80% capacity utilisation forecast within 24 months of plant commissioning, applied uniformly across ten distinct markets.',
      harden:
        'Which target markets have a verified prior of ≥70% utilisation for cement plants commissioned by external operators in the previous decade, and which assume convergence to that level on operational excellence alone?',
    },
    {
      label: 'Anchoring bias (high)',
      quote:
        'Uniform 5% country-risk premium applied across markets whose sovereign-credit spreads vary 3-5x.',
      harden:
        'What does a per-market discount-rate model produce when each market\'s sovereign-spread, FX-volatility, and repatriation-risk components are measured independently?',
    },
    {
      label: 'Availability heuristic (high)',
      quote:
        'African infrastructure-spend trajectory 2010-2014 used as the demand-projection baseline through the capex-amortisation window.',
      harden:
        'Which targeted markets\' infrastructure spend is cycle-dependent on Chinese commodity demand, and what is the plan if that cycle peaks before the Year-7 amortisation midpoint?',
    },
    {
      label: 'Planning fallacy (medium)',
      quote:
        '~$4B cumulative capex programme committed across ten markets without a per-market unit-economics gate before sequential commitments.',
      harden:
        'What is the explicit per-market gate that, if missed at the 18-month commissioning review, pauses subsequent-market capex rather than amortising the prior commitment?',
    },
  ];
  for (const b of biases) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(b.label, 20, y);
    y += 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const qLines = doc.splitTextToSize('Evidence: "' + b.quote + '"', 170);
    doc.text(qLines, 22, y);
    y += qLines.length * 4 + 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const hLines = doc.splitTextToSize('Harden with: ' + b.harden, 170);
    doc.text(hLines, 22, y);
    y += hLines.length * 4 + 4;
    y = pageIfNeeded(doc, y);
  }

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Structural assumptions (Dalio lens)', y);
  y = P(
    doc,
    'Three macro-structural determinants the memo implicitly depends on, surfaced by the structural-assumptions audit alongside the cognitive biases above. These do not appear in a Kahneman-only or Klein-only audit.',
    y,
    { size: 10 }
  );
  y = Bullet(
    doc,
    [
      'Currency cycle (high · unsupported): the dividend-repatriation logic of the cross-border return model assumes continued FX access in each target market. Harden with: what is the IRR floor if any of the top-3 destination markets imposes FX repatriation controls during the capex-amortisation window?',
      'Trade share (high · partially-supported): the export-distribution logic assumes regional cement trade flows that are themselves cycle-dependent on infrastructure spend (which is cycle-dependent on Chinese commodity demand). Harden with: what is the demand floor under a 30% commodity-cycle compression scenario?',
      'Governance (medium · partially-supported): the regulatory-stability logic assumes consistent treatment across ten jurisdictions. Harden with: what is the operational and capital plan in the worst-case bilateral-trade dispute or local-content-rule shift in any one of the top-5 markets?',
    ],
    y
  );

  doc.addPage();
  y = 25;

  y = H2(doc, 'EU AI Act Art. 14 mapping', y);
  y = Mono(
    doc,
    [
      'human-oversight       ≥ 1 designated reviewer (captured on record)',
      'explainability        per-bias evidence + hardening question (above)',
      'record-keeping        this DPR, hashed and signed, retained per DPA §5',
      'contestability        reviewer dissent logged before decision is ratified',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'African regulatory mapping', y);
  y = P(
    doc,
    'For Pan-African counterparties: the same DPR fields satisfy the emerging African regulatory framework stack. The cross-walk below is identical to the production /security mapping.',
    y,
    { size: 10 }
  );
  y = Mono(
    doc,
    [
      'NDPR Art. 12 (Nigeria)        automated-decision rights → DPR explainability',
      'CBN AI Guidelines (2024 draft)  model governance + explainability for FS',
      'WAEMU                          data-localisation + cross-border governance',
      'PoPIA s.71 (South Africa)      automated-decision data-subject rights',
      'CMA Kenya (2024 Conduct Reg.)  listed-company decision disclosure',
      'CBE ICT Risk (Egypt)           AI/ML model governance for banks',
      'Basel III · Pillar 2 ICAAP     internal capital-adequacy decision audit',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  y = H2(doc, 'Signature block', y);
  y = Mono(
    doc,
    [
      'Signed by  di-signer-prod@decision-intel.com',
      'Public key 4F:7A:CB:29:8E:11:D0:A2:…:7C:55',
      'Signature  MEUCIQDoVqf4u…zX5c1wIhAPmLk…Bv8oK1z (truncated)',
      '',
      'Verification: https://www.decision-intel.com/regulatory/ai-verify',
    ],
    y
  );

  y = pageIfNeeded(doc, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This sample DPR is anonymised from a real 2014 Pan-African expansion-plan audit run. Identifying text has been redacted; hashes, signatures and record-ids are sample values. The schema, field set, Art. 14 mapping, African regulatory cross-walk and structural-assumptions lens are identical to the production artefact.',
    20,
    y,
    { maxWidth: 170 }
  );

  drawWatermark(doc, 'SAMPLE');
  drawPageNumbers(doc, 'Decision Intel · Decision Provenance Record (sample · EM)');

  const out = join(PUBLIC_DIR, 'dpr-sample-dangote.pdf');
  writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
  console.log(`wrote ${out}`);
}

// ------------------------------------------------------------
// Run
// ------------------------------------------------------------

buildDpaTemplate();
buildDprSample();
buildDprDangote();
console.log('done.');
