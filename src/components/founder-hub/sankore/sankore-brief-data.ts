/**
 * Sankore Capability Brief — single source of truth.
 *
 * Every visualization on /dashboard/founder-hub/design-partners/sankore reads
 * from this file. Keeping it co-located + typed means the brief stays
 * accurate when capabilities ship: update one entry here, every panel
 * reflects it.
 *
 * The audit-time facts (status='shipped' rows) match what's actually live
 * on main as of commit 260dda0 (2026-04-25 enterprise pilot-readiness sprint).
 */

export type CapabilityStatus =
  | 'shipped' // live on main, working in production
  | 'scaffolded' // code shipped but not user-active (e.g. SAML pending Pro)
  | 'scheduled' // in the 12-week plan, week is known
  | 'deferred'; // acknowledged gap, deliberately not in current sprint

export const STATUS_DISPLAY: Record<
  CapabilityStatus,
  { label: string; tone: 'success' | 'amber' | 'info' | 'muted' }
> = {
  shipped: { label: 'Shipped', tone: 'success' },
  scaffolded: { label: 'Scaffolded', tone: 'info' },
  scheduled: { label: 'Scheduled', tone: 'amber' },
  deferred: { label: 'Acknowledged gap', tone: 'muted' },
};

// ─── 1. Three Shifts (Opus's meta-insight) ────────────────────────────────

export interface ShiftEntry {
  axis: string;
  beforeLabel: string;
  afterLabel: string;
  /** Concrete capabilities now shipped that prove the shift is real. */
  evidence: string[];
  status: CapabilityStatus;
}

export const THREE_SHIFTS: ShiftEntry[] = [
  {
    axis: 'Document → Decision',
    beforeLabel: 'One file at a time',
    afterLabel: 'A versioned audit chain',
    evidence: [
      'Document.parentDocumentId + versionNumber wired (parent links to chain root)',
      'VersionDeltaCard renders "DQI 42 → 71, sunk_cost resolved, anchoring emerged" automatically',
      '/api/documents/[id]/versions returns the full v1 → v3 chain with each fingerprint',
      '"Upload new version" button on every document detail page',
    ],
    status: 'shipped',
  },
  {
    axis: 'Solo → Collaborative',
    beforeLabel: 'A scanning machine',
    afterLabel: 'A team conversation surface',
    evidence: [
      'BiasComment threading on every BiasInstance with @-mention + Nudge fire',
      'BiasTask assignment with status (open / in-progress / resolved / dismissed)',
      'TeammatePicker resolves org members; @user@email parses + Nudges them',
      'Slack DM best-effort delivery via existing deliverSlackNudge when org is installed',
    ],
    status: 'shipped',
  },
  {
    axis: 'Report → Embedded',
    beforeLabel: 'Audit lives in a separate tab',
    afterLabel: 'Audit lives where the decision is made',
    evidence: [
      'Slack /di audit lightweight command — Chinedu killer ask',
      'Google Docs / Word inline annotation on the IC memo itself',
      'Calendar integration for decision-linked meetings',
    ],
    status: 'scheduled',
  },
];

// ─── 2. Hole-Closure Matrix (every Titi-flagged gap) ──────────────────────

export interface HoleEntry {
  /** Compact label shown in the matrix. */
  title: string;
  /** Who flagged this — Titi (real audit) / Titi sub-agent persona / Opus 4.6 panel / convergent. */
  flaggedBy: string;
  status: CapabilityStatus;
  /** When status === 'scheduled', the plan-week the work lands. */
  plannedWeek?: string;
  /** What we shipped — empty for scheduled / deferred items. */
  shipped: string;
  /** Where in the codebase (or product surface) the work lives. */
  surfaces: Array<{ label: string; href?: string; codePath?: string }>;
}

export const HOLE_MATRIX: HoleEntry[] = [
  {
    title: 'Zero Dalio framing in the product',
    flaggedBy: "Titi (real audit) — Sankore's entire intellectual anchor is Ray Dalio",
    status: 'shipped',
    shipped:
      'src/lib/constants/dalio-determinants.ts ships all 18 country rise/fall determinants with audit prompts. Structural-Assumptions Panel renders on every document Overview tab.',
    surfaces: [
      { label: 'dalio-determinants.ts', codePath: 'src/lib/constants/dalio-determinants.ts' },
      {
        label: '/api/analysis/[id]/structural-assumptions',
        codePath: 'src/app/api/analysis/[id]/structural-assumptions/route.ts',
      },
      {
        label: 'StructuralAssumptionsPanel',
        codePath: 'src/components/analysis/StructuralAssumptionsPanel.tsx',
      },
      { label: '/how-it-works (Dalio citation)', href: '/how-it-works' },
    ],
  },
  {
    title: 'Zero African case studies in the corpus',
    flaggedBy: 'Titi + convergent (both panels) — 85 US / 6 EU / 1 SA / 0 Africa baseline',
    status: 'shipped',
    shipped:
      '3 EM cases seeded with full preDecisionEvidence (Dangote pan-African expansion, MTN-NCC USSD dispute, Access/Diamond merger). DEMO_DANGOTE added to the paste-flow demo selector — visitors can run the audit on an African memo.',
    surfaces: [
      {
        label: 'emerging-markets-failures.ts',
        codePath: 'src/lib/data/case-studies/failures/emerging-markets-failures.ts',
      },
      { label: '/case-studies', href: '/case-studies' },
      { label: '/demo (DEMO_DANGOTE)', href: '/demo' },
      { label: '/bias-genome', href: '/bias-genome' },
    ],
  },
  {
    title: 'No African regulatory frameworks',
    flaggedBy: 'Titi — 7 G7 frameworks mapped, 0 for NDPR / CBN / WAEMU',
    status: 'shipped',
    shipped:
      '/security FRAMEWORKS extended 7 → 10. NDPR Art. 12 (Nigerian automated-decision rights), CBN AI Guidelines (draft 2024 model governance), WAEMU (cross-border data localisation). Bridge block on /regulatory/ai-verify explains the 11 AI Verify principles translate.',
    surfaces: [
      { label: '/security FRAMEWORKS', href: '/security' },
      { label: '/regulatory/ai-verify African bridge', href: '/regulatory/ai-verify' },
    ],
  },
  {
    title: 'No published Decision Provenance Record sample',
    flaggedBy: 'Convergent — Elena named it the single highest-leverage change; Titi looked for it',
    status: 'shipped',
    shipped:
      '2-page anonymised DPR PDF generated from the WeWork S-1 case via scripts/generate-legal-pdfs.mjs. Diagonal "SAMPLE" watermark, Art. 14 mapping, model lineage, judge variance, structural-assumptions block. Linked from /security DPR-export block + /pricing trust-band tile.',
    surfaces: [
      {
        label: 'public/dpr-sample-wework.pdf',
        href: '/dpr-sample-wework.pdf',
      },
      { label: 'Generator script', codePath: 'scripts/generate-legal-pdfs.mjs' },
      { label: '/security', href: '/security' },
      { label: '/regulatory/ai-verify', href: '/regulatory/ai-verify' },
    ],
  },
  {
    title: 'No publicly downloadable signed DPA template',
    flaggedBy: 'Marcus + Elena (procurement triage)',
    status: 'shipped',
    shipped:
      'GDPR Art. 28 template PDF — sub-processor list (Anthropic / Google / Supabase / Vercel / Resend), retention SLA, 30-day deletion path, SCC/IDTA reference. Linked from /security + /pricing trust-band.',
    surfaces: [
      { label: 'public/dpa-template.pdf', href: '/dpa-template.pdf' },
      { label: '/security DPR + DPA', href: '/security' },
    ],
  },
  {
    title: 'SOC 2 Type II claim conflated infra with product',
    flaggedBy: 'Elena — landing chip vs /security said different things',
    status: 'shipped',
    shipped:
      'Landing chip rewritten to "SOC 2 Type II infrastructure (Vercel + Supabase) · product audit scoped 2026". Same wording on the /decision-intel-for-boards FAQ row. /security stays the authoritative version.',
    surfaces: [
      { label: '/ landing chip', href: '/' },
      { label: '/decision-intel-for-boards', href: '/decision-intel-for-boards' },
      { label: '/security', href: '/security' },
    ],
  },
  {
    title: 'No per-tier retention SLA, no Delete UI',
    flaggedBy: 'Marcus + Elena + Chinedu (procurement) — verified: no Delete button anywhere',
    status: 'shipped',
    shipped:
      'Free 30d / Individual 90d / Strategy 365d / Enterprise 360d (configurable). Document.deletedAt soft-delete with 30-day grace before hard-purge via /api/cron/enforce-retention. Delete button on /documents/[id] AND on the InlineAnalysisResultCard. Audit-logged. /security#retention 4-tile grid + /pricing FAQ.',
    surfaces: [
      { label: '/security#retention', href: '/security#retention' },
      {
        label: '/api/cron/enforce-retention',
        codePath: 'src/app/api/cron/enforce-retention/route.ts',
      },
      {
        label: 'Delete UI on document detail',
        codePath: 'src/app/(platform)/documents/[id]/page.tsx',
      },
    ],
  },
  {
    title: 'Bias-level collaboration absent — "team adoption mechanism"',
    flaggedBy: 'Convergent — Opus recommended-first-move; Sankore + Marcus + Chinedu',
    status: 'shipped',
    shipped:
      "BiasComment threaded comments + BiasTask assignment per BiasInstance. @mentions parse against TeamMember roster, fire one Nudge per mentioned user. Task assignment also fires Slack DM via the org's monitoredChannels[0] (best-effort) (2.2 lean). DEEP: tiny safe markdown renderer (mentions + bold/italic/code/link/url, no dangerouslySetInnerHTML) on comment bodies + task descriptions. Email fallback on @mentions resolves to TeamMember.email + sends templated message via sendEmail. Task overdue chip — red OVERDUE label when dueAt is past + status not resolved/dismissed; amber when due within 48h (2.2 deep).",
    surfaces: [
      { label: 'BiasCollabPanel', codePath: 'src/components/analysis/BiasCollabPanel.tsx' },
      { label: 'Comment renderer', codePath: 'src/lib/utils/comment-render.ts' },
      { label: '/api/bias-comments', codePath: 'src/app/api/bias-comments/route.ts' },
    ],
  },
  {
    title: 'No document versioning or DQI delta loop',
    flaggedBy: 'Opus — "THE behavior-change loop"',
    status: 'shipped',
    shipped:
      'Document.parentDocumentId + versionNumber + Analysis.previousAnalysisId. VersionDeltaCard renders "DQI 42 → 71 (+29)" hero card; VersionHistoryStrip shows v1 → v2 → v3 chain (2.3 lean). DEEP: pure-JS Myers/LCS line-level memo diff (src/lib/utils/text-diff.ts) with collapseUnchanged caps at 2000 lines/side. /api/documents/[id]/diff?against=Y same-chain enforcement + visibility-aware on both sides. MemoDiffViewer with green/red gutters + +N/-M stats + 60vh scroll. VersionHistoryStrip extended: per-version "Compare" button toggles inline diff; owner-only inline version-label editor on current version (Pencil icon → textbox); non-current versions show italic label inline. New PATCH /api/documents/[id] for versionLabel updates (2.3 deep).',
    surfaces: [
      { label: 'VersionDeltaCard', codePath: 'src/components/analysis/VersionDeltaCard.tsx' },
      {
        label: 'VersionHistoryStrip + diff',
        codePath: 'src/components/analysis/VersionHistoryStrip.tsx',
      },
      { label: 'MemoDiffViewer', codePath: 'src/components/analysis/MemoDiffViewer.tsx' },
      { label: 'Diff helper', codePath: 'src/lib/utils/text-diff.ts' },
    ],
  },
  {
    title: 'Decision Provenance Record was a static 4-page PDF',
    flaggedBy: 'Procurement — "show the judge variance, prove convergence"',
    status: 'shipped',
    shipped:
      'DPR generator already shipped per-analysis 4-page PDF with hash chain + model lineage + regulatory mapping per bias (1.1 lean). DEEP: granular per-judge outputs captured during the pipeline run and persisted on Analysis.judgeOutputs (biasDetective.flagCount/severeFlagCount/biasTypes, noiseJudge.mean/stdDev/variance/sampleCount, factChecker stats, metaJudge.verdict, preMortem counts). PDF page 2 renders a PER-JUDGE CONVERGENCE block. New /api/analysis/[id]/provenance JSON endpoint + DprPreviewCard on document detail with eight-field collapsed chip; "Inspect" expands to show input hash / prompt fingerprint / pipeline node count / noise score / bias detective stats / fact checker stats / pre-mortem stats / meta verdict — without opening the PDF (1.1 deep).',
    surfaces: [
      { label: 'DprPreviewCard', codePath: 'src/components/analysis/DprPreviewCard.tsx' },
      {
        label: 'DPR PDF generator',
        codePath: 'src/lib/reports/decision-provenance-record-generator.ts',
      },
      { label: 'Provenance JSON API', codePath: 'src/app/api/analysis/[id]/provenance/route.ts' },
    ],
  },
  {
    title: 'Retention enforcement had no legal-hold register',
    flaggedBy: 'Procurement — "litigation-grade retention requires a hold register"',
    status: 'shipped',
    shipped:
      'Two-phase retention (soft-delete + hard-purge) with per-tier windows already in cron (2.1 lean). DEEP: cron honors Organization.retentionDaysOverride (per-org bulk-loaded). Both phases skip docs with active legalHoldId. NEW Phase 1.5 — pre-deletion warning email fired ~7 days before hard-purge; stamps deletionWarningSentAt to prevent double-send. POST /api/documents/[id]/restore — owner-only restore within grace window (410 past it). GET/POST/PATCH /api/legal-holds — list/create/release with reason (4-2000 chars) + optional holdUntil. LegalHoldStatusChip on document detail header — "No hold" or red "Legal hold" pill + place/release modal (2.1 deep).',
    surfaces: [
      {
        label: 'LegalHoldStatusChip',
        codePath: 'src/components/documents/LegalHoldStatusChip.tsx',
      },
      { label: '/api/legal-holds', codePath: 'src/app/api/legal-holds/route.ts' },
      {
        label: '/api/documents/[id]/restore',
        codePath: 'src/app/api/documents/[id]/restore/route.ts',
      },
      { label: 'Retention cron', codePath: 'src/app/api/cron/enforce-retention/route.ts' },
    ],
  },
  {
    title: 'Market-context-aware bias detection (35% CAGR false-positive)',
    flaggedBy: 'Titi sub-agent + Opus — bias detection applies a Western prior to EM growth',
    status: 'shipped',
    shipped:
      "Two layers shipped: (a) market-context auto-detection during the bias pass — emerging_market | developed_market | cross_border | unknown — with EM growth-rate priors so a Lagos memo's 35%+ CAGR claim is no longer auto-flagged as overconfidence (3.6 lean). (b) Owner override + structural-assumptions integration (3.6 deep) — Titi can flip the auto-detection from the chip and the Dalio audit re-runs against the overridden context. THREE Dalio determinants are persisted per audit (cycle / power / fundamentals / internal / external categories) and surfaced as an org-level structural-exposure heatmap on /dashboard/analytics with EM share per determinant. Persisted so cross-analysis reads pay zero LLM cost (1.3a deep).",
    surfaces: [
      {
        label: 'StructuralAssumptionsPanel',
        codePath: 'src/components/analysis/StructuralAssumptionsPanel.tsx',
      },
      {
        label: 'StructuralExposureCard (analytics)',
        codePath: 'src/components/analysis/StructuralExposureCard.tsx',
      },
      {
        label: 'MarketContextChip + override',
        codePath: 'src/components/analysis/MarketContextChip.tsx',
      },
    ],
  },
  {
    title: 'SAML SSO required by enterprise procurement',
    flaggedBy: 'Opus CSO panel — table-stakes enterprise requirement',
    status: 'scaffolded',
    plannedWeek: 'Activates on first paid Sankore design-partner upgrade to Supabase Pro',
    shipped:
      'Full code path shipped: SsoConfiguration Prisma model, /api/sso/initiate (login domain probe), /api/sso/admin/providers (admin UI registration), login page integration. Activation pending one-time Supabase Pro upgrade ($25/mo). /security claim softened to "(coming soon)" until then.',
    surfaces: [
      { label: '/dashboard/settings/sso', href: '/dashboard/settings/sso' },
      { label: '/api/sso/initiate', codePath: 'src/app/api/sso/initiate/route.ts' },
      { label: 'Login probe', codePath: 'src/app/login/page.tsx' },
    ],
  },
  {
    title: 'Decision Rooms is a 142-byte stub',
    flaggedBy: 'Opus — "visible-stub-level problem a serious buyer would find in minutes"',
    status: 'scheduled',
    plannedWeek: 'Weeks 9–10 (deep refactor)',
    shipped:
      'Per-room detail page + blind-prior survey + reveal flow planned. Marcus called this his "feature I\'d pay for immediately." Pre-IC blind-prior collection → unanimity score → DQI overlay.',
    surfaces: [{ label: 'Plan §4.1 (deep refactor in flight)' }],
  },
  {
    title: 'Deal-centric workflow (deal IS the organising unit)',
    flaggedBy: 'Opus M&A panel + Marcus — "Your Deals page and Audit page are two products"',
    status: 'shipped',
    shipped:
      'Per-deal page reworked to the atomic decision unit. Composite Deal DQI (equal-weighted mean across docs) + bias signature (per-bias doc count + top severity) (3.1 lean). DEEP: cross-document cross-reference agent — gemini-3-flash-preview run across every analyzed doc on the deal, surfaces 5 conflict types (numeric / assumption / timeline / risk_treatment / scope) with verbatim 2-side excerpts + whyItMatters + resolutionQuestion. Persisted on DealCrossReference table with auto-trigger when a 2nd doc analysis lands. THIS IS THE KILLER DEMO MOMENT for Sankore — pasting CIM + counsel memo + IC memo and watching the agent flag "CIM says 40% growth, model assumes 15%" is the most differentiated capability in the entire product (3.1 deep).',
    surfaces: [
      { label: 'DealCompositeHero', codePath: 'src/components/deals/DealCompositeHero.tsx' },
      { label: 'CrossReferenceCard', codePath: 'src/components/deals/CrossReferenceCard.tsx' },
      { label: 'Cross-ref agent', codePath: 'src/lib/agents/cross-reference.ts' },
    ],
  },
  {
    title: 'Document-level RBAC',
    flaggedBy: 'Opus CSO + Sankore — "analyst sees CEO board papers"',
    status: 'shipped',
    shipped:
      'Three-state visibility (private / team / specific) on Document, with DocumentAccess allowlist for "specific" mode (3.5 lean). DEEP: visibility resolver swept across 23 doc-touching endpoints (documents-list, v1-API, analyze, analyze/stream SSE pipeline, fingerprint/risk-score/structural-assumptions, share POST, decision-rooms POST, export, audit-packet, activity-feed, versions, pdf, provenance-record, decision-graph similar/counterfactual, search insights, chat pinned + cross-doc RAG, deals child docs). Owner-only PATCH /visibility fires Nudges to grantees + AuditLog rows for every visibility change + grant add/remove. Closes the security hole the lean ship left in the listing endpoints (3.5 deep).',
    surfaces: [
      {
        label: 'DocumentVisibilityModal',
        codePath: 'src/components/documents/DocumentVisibilityModal.tsx',
      },
      { label: 'document-access resolver', codePath: 'src/lib/utils/document-access.ts' },
    ],
  },
  {
    title: 'Redaction assistant on paste flow',
    flaggedBy: 'Marcus + Chinedu (confidentiality)',
    status: 'shipped',
    shipped:
      'Pre-submit scanner: emails, phones (US/UK/EU/Nigerian), SSN/UK NI, financial totals ≥1M ($/£/€/₦/¥), company entity suffixes, capitalised person-name pairs with deny-list filter. RedactionPreModal with per-hit checkboxes; stable [NAME_1] / [AMOUNT_2] placeholders so pipeline still parses structure (3.2 lean). DEEP: server-side AuditLog row on every redaction event with sha256 hashes of original + submitted (NEVER originals — those stay client-only) + category-counts + outcome action. Owner-only sessionStorage placeholder map for in-browser replay. RedactionTrailCard on document detail with category pill row + truncated hash evidence + owner-only "Reveal local map" button. Closes the procurement question "prove redaction happened before content left the browser" (3.2 deep).',
    surfaces: [
      { label: 'RedactionPreModal', codePath: 'src/components/ui/RedactionPreModal.tsx' },
      { label: 'RedactionTrailCard', codePath: 'src/components/analysis/RedactionTrailCard.tsx' },
      { label: 'Trail helper', codePath: 'src/lib/utils/redaction-trail.ts' },
    ],
  },
  {
    title: 'Board-member 24h view-only share links',
    flaggedBy: 'Marcus + Elena — "the board doesn\'t log into SaaS tools"',
    status: 'shipped',
    shipped:
      'ShareLink.expiresAt + 410-Gone gate + 1h/24h/7d/30d/never selector on the modal (3.3 lean). DEEP: third "Manage Links" tab on ShareModal (status-coded per-link cards + view counts + revoke). Public viewer carries a provenance watermark on every page ("Shared by {ownerEmail} · expires {timestamp}") that survives screenshots. Optional recipient-email gate (ShareLink.requireEmail) — captured email lands on ShareLinkAccess.viewerEmail for follow-up. New AuditLog actions SHARE_LINK_CREATED / _REVOKED / _VIEWED (3.3 deep).',
    surfaces: [
      { label: 'ShareModal Manage tab', codePath: 'src/components/ui/ShareModal.tsx' },
      { label: '/api/share', codePath: 'src/app/api/share/route.ts' },
    ],
  },
  {
    title: 'Plain-English portfolio insights (DKG opacity)',
    flaggedBy: 'Convergent — Elena + Titi sub-agent (MD\'s "what am I looking at?")',
    status: 'deferred',
    shipped:
      'Cross-org bias patterns + plain-English insight cards above the 3D DKG graph. Requires real cross-org consenting data — gated on first 3 paid pilots.',
    surfaces: [{ label: 'Plan §P2 polish' }],
  },
  {
    title: 'Regional / PPP-adjusted pricing',
    flaggedBy: 'Titi sub-agent — "Your pricing assumes US/UK purchasing power"',
    status: 'deferred',
    shipped:
      'Considered for Sankore design-partner offer specifically — handled outside list pricing.',
    surfaces: [{ label: 'Founder Hub → Sankore offer tab' }],
  },
  {
    title: 'WhatsApp / multi-language',
    flaggedBy: 'Titi sub-agent — Africa-specific',
    status: 'deferred',
    shipped:
      'Not in current 12-week plan. Slack /di audit (Week 9+) addresses workflow-embedding for the same use-case.',
    surfaces: [],
  },
];

// ─── 3. Dalio's 18 determinants (mirror — visualised) ─────────────────────

export interface DeterminantBrief {
  id: string;
  label: string;
  category: 'cycles' | 'power' | 'fundamentals' | 'internal' | 'external';
  oneLiner: string;
}

export const DALIO_BRIEF: DeterminantBrief[] = [
  {
    id: 'debt_cycle',
    label: 'Debt Cycle',
    category: 'cycles',
    oneLiner: 'Where the economy sits on the short + long debt cycles.',
  },
  {
    id: 'currency_cycle',
    label: 'Currency / Inflation',
    category: 'cycles',
    oneLiner: 'FX strength, inflation, devaluation. EM exposures live here.',
  },
  {
    id: 'reserve_currency_status',
    label: 'Reserve Currency',
    category: 'power',
    oneLiner: 'Continued USD/EUR/CNY dominance for settlement + reserves.',
  },
  {
    id: 'economic_output',
    label: 'Economic Output',
    category: 'power',
    oneLiner: 'Absolute + relative GDP — drives addressable-market size.',
  },
  {
    id: 'trade',
    label: 'Trade Share',
    category: 'power',
    oneLiner: 'Global-trade share, terms of trade, route dependencies.',
  },
  {
    id: 'military',
    label: 'Military / Geopolitical',
    category: 'power',
    oneLiner: 'Asset security, sanction risk, contract enforceability.',
  },
  {
    id: 'markets_financial_center',
    label: 'Financial Centres',
    category: 'power',
    oneLiner: 'Liquidity, exit-market depth, regulatory credibility.',
  },
  {
    id: 'education',
    label: 'Education',
    category: 'fundamentals',
    oneLiner: 'Human-capital quality + quantity for execution.',
  },
  {
    id: 'innovation',
    label: 'Innovation',
    category: 'fundamentals',
    oneLiner: 'Tech absorption rate, half-life of any technical moat.',
  },
  {
    id: 'productivity',
    label: 'Productivity',
    category: 'fundamentals',
    oneLiner: 'Total-factor productivity — the long-run output driver.',
  },
  {
    id: 'cost_competitiveness',
    label: 'Cost Competitiveness',
    category: 'fundamentals',
    oneLiner: 'Relative labour / capital / energy cost positions.',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    category: 'fundamentals',
    oneLiner: 'Power, ports, logistics, broadband, payment rails.',
  },
  {
    id: 'geology',
    label: 'Geology / Resources',
    category: 'external',
    oneLiner: 'Raw materials, water, arable land endowment.',
  },
  {
    id: 'acts_of_nature',
    label: 'Acts of Nature',
    category: 'external',
    oneLiner: 'Climate, pandemics, natural disasters as a 1st-order axis.',
  },
  {
    id: 'governance',
    label: 'Governance / Rule of Law',
    category: 'internal',
    oneLiner: 'Regulatory predictability, contract enforceability.',
  },
  {
    id: 'wealth_gaps',
    label: 'Wealth Gaps',
    category: 'internal',
    oneLiner: 'Internal inequality + values-conflict trajectory.',
  },
  {
    id: 'civility',
    label: 'Civility / Work Ethic',
    category: 'internal',
    oneLiner: 'Cultural determinants of collective output.',
  },
  {
    id: 'resource_allocation',
    label: 'Resource Allocation',
    category: 'internal',
    oneLiner: 'How efficiently capital + talent get to best opportunities.',
  },
];

export const CATEGORY_COLOURS: Record<DeterminantBrief['category'], string> = {
  cycles: '#16A34A', // green — Dalio's anchor
  power: '#2563EB', // blue — geopolitical
  fundamentals: '#7C3AED', // purple — long-run drivers
  internal: '#D97706', // amber — institutional
  external: '#DC2626', // red — exogenous shocks
};

export const CATEGORY_LABELS: Record<DeterminantBrief['category'], string> = {
  cycles: 'Cycles · debt + currency + inflation',
  power: 'Power · economic, trade, reserve currency',
  fundamentals: 'Fundamentals · education, innovation, infra',
  internal: 'Internal · governance, civility, wealth gaps',
  external: 'External · geology, acts of nature',
};

// ─── 4. Regulatory bridge (G7 → African) ──────────────────────────────────

export interface FrameworkBrief {
  code: string;
  name: string;
  region: 'g7' | 'africa';
  status: 'live' | 'enforceable_2026' | 'draft';
  enforcementDate?: string;
  /** What the DPR field-set covers for this framework. */
  dprCoverage: string;
}

export const FRAMEWORKS_BRIEF: FrameworkBrief[] = [
  // G7 — were already mapped
  {
    code: 'SOX §404',
    name: 'Sarbanes-Oxley',
    region: 'g7',
    status: 'live',
    dprCoverage: 'Material-statement controls log + signed reviewer trail.',
  },
  {
    code: 'GDPR Art. 22',
    name: 'EU GDPR',
    region: 'g7',
    status: 'live',
    dprCoverage: 'Meaningful information about the logic; per-bias evidence.',
  },
  {
    code: 'EU AI Act · Annex III',
    name: 'EU AI Act',
    region: 'g7',
    status: 'enforceable_2026',
    enforcementDate: '2026-08-02',
    dprCoverage: 'Art. 14 record-keeping, Art. 13 transparency, Art. 15 accuracy.',
  },
  {
    code: 'Basel III',
    name: 'Basel III · Pillar 2 ICAAP',
    region: 'g7',
    status: 'live',
    dprCoverage: 'Capital-decision documentation; provision attached on flagged biases.',
  },
  {
    code: 'FCA Consumer Duty',
    name: 'UK Financial Conduct Authority',
    region: 'g7',
    status: 'live',
    dprCoverage: 'UK financial-services decisioning evidence.',
  },
  {
    code: 'SEC Reg D',
    name: 'SEC Regulation D',
    region: 'g7',
    status: 'live',
    dprCoverage: 'Forward-looking statement / safe-harbour rigor.',
  },
  {
    code: 'LPOA',
    name: 'Limited Partnership Obligations',
    region: 'g7',
    status: 'live',
    dprCoverage: 'Fund-level fiduciary dissent + IC-meeting record.',
  },
  // African — 12 frameworks now registered (lean ship: 3; deep ship: +7; ISA Nigeria 2007 + 1 more added 2026-04-29 → 30). drift-tolerant — sankore-sprint count, not registry-driven.
  {
    code: 'NDPR Art. 12',
    name: 'Nigeria Data Protection Regulation',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'Automated-decision rights for Nigerian data subjects (GDPR-aligned). Art. 12 + Art. 13 mapped per bias.',
  },
  {
    code: 'CBN AI Guidelines',
    name: 'Central Bank of Nigeria',
    region: 'africa',
    status: 'draft',
    enforcementDate: 'Draft 2024',
    dprCoverage:
      'FS-sector model governance, explainability, consumer-protection duties. Para. 4.2 + 5.1 mapped per bias.',
  },
  {
    code: 'WAEMU',
    name: 'West African Economic & Monetary Union',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'Cross-border data localisation across 8 member states. Reg. R09 + BCEAO Circular 04-2017 mapped.',
  },
  {
    code: 'CMA Kenya',
    name: 'Capital Markets Authority (Kenya)',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'Listed-company material disclosure + Code of Corporate Governance s.2 — board decision-making evidence per bias.',
  },
  {
    code: 'BoG Cyber & ICT',
    name: 'Bank of Ghana',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'Directive 2018/05 (rev. 2023) §5 model & algorithmic governance for Ghanaian regulated FIs.',
  },
  {
    code: 'FRC Nigeria',
    name: 'Financial Reporting Council of Nigeria',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'Code of Corporate Governance Principles 1.1 + 11 — board-effectiveness + risk-management for public-interest entities.',
  },
  {
    code: 'CBE AI Guidelines',
    name: 'Central Bank of Egypt',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'CBE 2023 ICT Governance Framework §III — AI/ML model governance + explainability for Egyptian banks.',
  },
  {
    code: 'PoPIA §71',
    name: 'Protection of Personal Information Act (South Africa)',
    region: 'africa',
    status: 'live',
    dprCoverage: 'PoPIA s.71 automated-decision rights + s.24 quality-of-information duties.',
  },
  {
    code: 'SARB Model Risk',
    name: 'South African Reserve Bank',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'Directive D2/2022 + Joint Standard 2 of 2024 — model risk + AI governance for SA banks.',
  },
  {
    code: 'BoT FinTech',
    name: 'Bank of Tanzania — FinTech Sandbox',
    region: 'africa',
    status: 'live',
    dprCoverage:
      'BoT FinTech Sandbox Guidelines 2023 §V — AI/ML decisioning governance for sandbox-stage entities.',
  },
];

// ─── 5. Case-library geography (before / after) ───────────────────────────

export interface CaseGeographyBucket {
  region: string;
  before: number;
  after: number;
  examples: string[];
}

export const CASE_GEOGRAPHY: CaseGeographyBucket[] = [
  {
    region: 'United States',
    before: 85,
    after: 85,
    examples: ['Boeing 737 MAX', 'WeWork S-1', 'Microsoft–Nokia', 'Theranos', 'Quibi'],
  },
  {
    region: 'UK + EU',
    before: 6,
    after: 6,
    examples: ['Carillion', 'Nokia (FI)', 'Wirecard (DE)'],
  },
  {
    region: 'Other Western',
    before: 1,
    after: 1,
    examples: ['Steinhoff (ZA / NL)'],
  },
  {
    region: 'Sub-Saharan Africa',
    before: 0,
    after: 8,
    examples: [
      'Dangote Cement pan-African expansion',
      'MTN Nigeria · NCC USSD dispute',
      'Access Bank · Diamond merger',
      'Jumia Group IPO · Amazon-of-Africa narrative collapse',
      'Equity Group · DRC + Rwanda banking expansion',
      'Twiga Foods · Series E + Pan-African FMCG pivot',
      'MTN MoMo · 17-market single-rail thesis',
      'Naspers / Tencent · cross-border concentration cycle',
    ],
  },
];

// ─── 6. Sankore 5 Pillars fit map ─────────────────────────────────────────

export interface PillarFit {
  pillar: 'Capital' | 'Culture' | 'Credit' | 'City' | 'Community';
  oneLiner: string;
  /** Capabilities now live that map to this pillar. */
  capabilities: string[];
  fitGrade: 'A' | 'B' | 'C' | 'D';
  fitNote: string;
}

export const FIVE_PILLARS_FIT: PillarFit[] = [
  {
    pillar: 'Capital',
    oneLiner: 'Direct investments + Sankore Asset Management (PE / VC).',
    capabilities: [
      'IC-memo bias audit (cognitive + structural)',
      'Decision Provenance Record for every IC ratification',
      'Bias-level commenting + task assignment for deal-team review',
      'Document versioning + delta DQI (memo v1 → v2 → v3 chain)',
      'Dalio determinants modelling FX-repatriation, currency-cycle, governance exposures',
      'Three EM case studies seeded — Dangote / MTN / Access',
      'NDPR + CBN regulatory coverage on /security',
    ],
    fitGrade: 'A',
    fitNote: 'Closest fit. Every Capital-side workflow has a shipped Decision Intel surface today.',
  },
  {
    pillar: 'Credit',
    oneLiner: 'Lending + structured credit; CBN / Basel-regulated activity.',
    capabilities: [
      'Basel III · Pillar 2 ICAAP framework mapping on /security',
      'CBN AI Guidelines mapping (draft 2024)',
      'Structural-Assumptions audit explicitly models debt_cycle + currency_cycle',
      'Audit log + soft-delete grace window (procurement-grade)',
    ],
    fitGrade: 'B',
    fitNote:
      'Strong on regulatory mapping; needs structured credit-memo template (scheduled, Weeks 9–12) for full fit.',
  },
  {
    pillar: 'City',
    oneLiner: 'Real estate + infrastructure (long-horizon, FX-exposed projects).',
    capabilities: [
      'Dangote case study explicitly covers infrastructure / FX-repatriation pattern',
      'Acts of Nature + Geology determinants surface climate + resource exposures',
      'Document versioning supports multi-year iterating on the same plan',
    ],
    fitGrade: 'B',
    fitNote:
      'Indirect fit via the determinants. A first-class infrastructure-memo template is in the EM-template scheduling.',
  },
  {
    pillar: 'Culture',
    oneLiner: "Creative-industry investments — Sankore's soft-power thesis.",
    capabilities: [
      'Bias-comment threads turn cultural-frame disagreements into a structured surface',
      'Recognition-Primed Decision (RPD) node already detects creative-industry analogs',
    ],
    fitGrade: 'C',
    fitNote:
      'Marginal fit today. Creative-industry-specific case studies + IP-valuation framing would strengthen.',
  },
  {
    pillar: 'Community',
    oneLiner: 'Community development + sustainable impact thesis.',
    capabilities: [
      'Outcome flywheel + DQI recalibration captures realized impact over time',
      'Brier-score calibration — the discipline LP letters care about',
      'Audit log + tenant-isolation posture (procurement-grade evidence)',
    ],
    fitGrade: 'C',
    fitNote:
      'Marginal. Impact-measurement templates are a future capability — flag honestly during the Titi conversation.',
  },
];

// ─── 7. Capability surfaces (clickable destinations) ──────────────────────

export interface CapabilitySurface {
  title: string;
  oneLiner: string;
  /** Where it lives — internal route or external href. */
  href: string;
  internal: boolean;
  /** What to demo when walking Titi through it. */
  demoNote: string;
}

export const CAPABILITY_SURFACES: CapabilitySurface[] = [
  {
    title: 'DPR sample (anonymised WeWork)',
    oneLiner: 'Procurement-grade artifact. Hash, signature, Art. 14 mapping.',
    href: '/dpr-sample-wework.pdf',
    internal: false,
    demoNote: "Open in a new tab during the call — Titi's GC can review live.",
  },
  {
    title: 'DPA template',
    oneLiner: 'GDPR Art. 28 template. Sub-processors, retention SLA, deletion path.',
    href: '/dpa-template.pdf',
    internal: false,
    demoNote: 'Hand to procurement directly. No "email us" friction.',
  },
  {
    title: '/security · Retention SLA + frameworks',
    oneLiner:
      '12 African frameworks (incl. NDPR/CBN/WAEMU/ISA Nigeria 2007). Per-tier retention table.',
    href: '/security#retention',
    internal: false,
    demoNote: 'Scroll to Retention SLA + then to Frameworks. Both are live.',
  },
  {
    title: '/regulatory/ai-verify',
    oneLiner: '11 AI Verify principles · DPR mapping · African-bridge block.',
    href: '/regulatory/ai-verify',
    internal: false,
    demoNote: 'Procurement deep-dive. Bridge block sits above the CTA.',
  },
  {
    title: '/how-it-works · Kahneman + Klein + Dalio',
    oneLiner: 'Public R²F page now cites Ray Dalio explicitly.',
    href: '/how-it-works',
    internal: false,
    demoNote: 'Search for "Ray Dalio" — the Structural Assumptions feature is published.',
  },
  {
    title: '/demo · DEMO_DANGOTE',
    oneLiner: 'Pan-African expansion paste-flow audit. Real Dalio output.',
    href: '/demo',
    internal: false,
    demoNote: 'Click the Dangote chip — the audit runs live on an African memo.',
  },
  {
    title: '/case-studies (filter to EM)',
    oneLiner: 'Dangote / MTN / Access — full preDecisionEvidence.',
    href: '/case-studies',
    internal: false,
    demoNote: 'Each case has detectable red flags + hypothetical analysis.',
  },
  {
    title: '/dashboard/settings/sso · SAML admin',
    oneLiner: 'Full SAML registration UI. Activates on Pro upgrade.',
    href: '/dashboard/settings/sso',
    internal: true,
    demoNote: "Show the 5-step prerequisite strip — it's honest about Pro requirement.",
  },
  {
    title: 'Document detail · BiasCollabPanel',
    oneLiner: 'Open any document → expand a bias card → comments + assignable tasks.',
    href: '/dashboard/documents',
    internal: true,
    demoNote: 'Take Titi to a real audit and click into a bias.',
  },
  {
    title: 'Document detail · VersionDeltaCard',
    oneLiner: 'Upload v2 → DQI delta + biases resolved/emerged renders automatically.',
    href: '/dashboard/documents',
    internal: true,
    demoNote: 'Demo: upload a memo, edit it, "Upload new version" — show the delta.',
  },
  {
    title: 'Document detail · Structural Assumptions',
    oneLiner: '"Run structural audit" button → Dalio 18-determinant pass.',
    href: '/dashboard/documents',
    internal: true,
    demoNote: 'Click the button — output is the Dalio-as-second-lens proof.',
  },
];

// ─── 8. 15-minute walkthrough script (for the Titi meeting) ───────────────

export interface WalkthroughBeat {
  minute: string;
  title: string;
  what: string;
  link?: string;
}

export const WALKTHROUGH: WalkthroughBeat[] = [
  {
    minute: '0–2',
    title: 'Frame the meta-shift',
    what: '"Last time we spoke, the platform was a strong intellectual product. Since then, it has been wrapped to actually be useful inside a Sankore deal team. Three shifts: document → decision, solo → collaborative, report → embedded. Show the Three Shifts panel from this brief.',
  },
  {
    minute: '2–5',
    title: 'Dalio is now first-class',
    what: 'Open /how-it-works and search for "Ray Dalio". Then open any document audit + click "Run structural audit" — show the 18-determinant output. This is the gap she flagged on day one.',
    link: '/how-it-works',
  },
  {
    minute: '5–7',
    title: 'African memo runs through the audit',
    what: 'Open /demo, click the Dangote chip, run the audit live. Show the output recognising FX-repatriation + currency-cycle as load-bearing structural assumptions. This is the "it understands my market" proof.',
    link: '/demo',
  },
  {
    minute: '7–9',
    title: 'NDPR + CBN + WAEMU on /security',
    what: 'Scroll the Frameworks block. 7 → 10. Then download the DPR sample and the DPA template — both are live on the same page.',
    link: '/security',
  },
  {
    minute: '9–11',
    title: 'Team workflow inside an audit',
    what: 'Open any document detail page. Expand a bias card. Show the BiasCollabPanel: comment thread, @mention syntax, "Assign as task". Mention how a Sankore associate gets nudged in-app + Slack DM (when org\'s Slack is wired).',
  },
  {
    minute: '11–13',
    title: 'Versioned memos, delta DQI',
    what: 'On a doc that has a v2: show the VersionHistoryStrip + the VersionDeltaCard rendering "DQI 42 → 71, sunk_cost resolved, anchoring emerged". This is the iteration loop she\'ll demo to her associates.',
  },
  {
    minute: '13–15',
    title: 'Honest gaps + ask',
    what: 'Walk the Honest Gaps panel from this brief. Decision Rooms is scheduled (Weeks 9–10). Deal-centric workflow is scheduled (Weeks 5–8). RBAC + redaction-assistant + share-link expiry are all in the same window. Then ask: "Is there anything between Capital, Credit, City, Culture, Community where you want a custom case study seeded next?"',
  },
];

// ─── 9. Honest gaps (for transparency during the call) ────────────────────

export const HONEST_GAPS = [
  {
    title: 'Decision Rooms is still a redirect',
    detail:
      'The list page exists; per-room collaboration page is on the Week 9–10 deep-refactor plan. Marcus (M&A persona) called the blind-prior survey "the feature I\'d pay for immediately" — it\'s the highest-leverage thing left in the 12-week arc. Plan §4.1 deep covers full per-room state + survey distribution + anonymized reveal + Brier-per-participant.',
  },
  {
    title: 'SAML SSO requires Supabase Pro',
    detail:
      "Code path is shipped. Supabase Pro upgrade ($25/mo) flips the toggle. We're holding off until the first design partner asks — which is the right way to discover this with Sankore directly.",
  },
  {
    title: 'Real-time backend progress events',
    detail:
      "Audit progress UI is SSE-driven from real backend events (verified — claim was wrong in the original audit). What's NOT real: the per-stage progress is event-completion-driven, not percent-within-stage. For a 90-second audit it feels honest; for a 4-minute one we'd want finer granularity.",
  },
  {
    title: 'Slack /di slash-command + WhatsApp surface',
    detail:
      "Slack install + thread-monitoring exists; the in-channel /di audit slash-command is on the Week 9-12 deep plan. WhatsApp is deliberately deferred — Slack covers the corporate-strategy buyer; WhatsApp belongs to a different distribution playbook (consumer / SMB) we're not pursuing.",
  },
  {
    title: 'PPP / regional pricing remains a deal-by-deal handle',
    detail:
      'Not in list pricing. For Sankore specifically: founder-handled outside the standard tiers — pilot pricing reflected pan-African operating context. List pricing is otherwise developed-market-anchored by design.',
  },
  {
    title: 'Cross-org bias-genome insights gated on 3+ pilots',
    detail:
      'Plain-English portfolio insights above the DKG graph still need real cross-org consenting data before we can ship them honestly. The Bias Genome page already runs on real data when n is large enough; the cross-tenant aggregation activates at the third paid pilot.',
  },
];

// =========================================================================
// PARTNERSHIP SHAPE — what I get / what they get / how to frame it
// Locked 2026-05-21 after the TT-meeting reframe conversation. The
// engagement is NOT a £1,999/mo founding-pilot; it's a 12-week in-person
// embed at the London office where the trade is custom internal product
// in exchange for reference + access + network + retroactive calibration.
// =========================================================================

export interface PartnershipExchange {
  side: 'me' | 'them';
  ingredient: string;
  detail: string;
  /** Why this ingredient is unrepeatable for a competitor (the 5-ingredient
   *  bundle framing — see CLAUDE.md Defensibility lock + combination
   *  moat section). */
  unrepeatability: string;
}

export const PARTNERSHIP_SHAPE: ReadonlyArray<PartnershipExchange> = [
  {
    side: 'me',
    ingredient: 'Access to the 14-year decision archive',
    detail:
      'Investment committees, real-estate developments, fund launches, M&A (Diamond Capital, DBSL, Centurion), venture investments (5th Harvest, Wealth.ng, Saunders, Juno) — a decision-volume firm that has been building companies from minimal AUM since 2010.',
    unrepeatability:
      'A competitor with $20M of funding can rebuild the audit engine in 6 months. They cannot rebuild a 14-year archive of real Pan-African institutional decisions with known outcomes.',
  },
  {
    side: 'me',
    ingredient: 'Embedded use across 6+ business lines',
    detail:
      'Wealth Management (Private Banking as a Service), Fund Management (₦120B AUM), Real Estate (Lotus, Juno, Laird Place mixed-use), Brokerage, Trustee, Fintech (Wealth.ng / Kada / Astro / Ligare).',
    unrepeatability:
      'A 12-week multi-business-line embed produces calibration data + workflow integration data + persona-specific UX feedback no remote vendor can approximate. Linear time the competitor cannot compress.',
  },
  {
    side: 'me',
    ingredient: 'Retroactive Bias Genome seed (30-50 closed decisions)',
    detail:
      'Run DI against historical Sankore decisions where outcomes are known (Agriculture Fund 15-17% target vs actual; Real Wealth Fund track record; 2010-2023 acquisition outcomes). Compresses 12 months of forward calibration into 12 weeks of retroactive work.',
    unrepeatability:
      'The single highest-leverage moat-building move — produces a Brier-against-real-Sankore-outcomes claim no competitor can fabricate without an equivalent partner relationship.',
  },
  {
    side: 'me',
    ingredient: 'Founder-level relationship with TT',
    detail:
      'Harvard MBA, ex-Goldman Sachs (NY), ex-Zenith Capital (Head of Investment Strategy). Active angel investor. CPA Gold Award. FT 2023 fastest-growing recognition. Founded Sankore in 2010 during the global financial crisis.',
    unrepeatability:
      'Founder-level access at a firm of this calibre is the kind of relationship Mr. Reiner + Mr. Gabe spent careers building. Not transactional — a strategic relationship with someone who shapes Pan-African finance.',
  },
  {
    side: 'me',
    ingredient: 'Network access to her board',
    detail:
      'Tokunbo Ishmael (Alithia Capital, chair), Adia Sowho (Mines, ex-MTN), Ngozi Dozie (Carbon / Paylater), Bolaji Adeoye (Cardinal Stone), Bisola Fatokun (Standard Chartered), Tunde Sarumi, Gerri Lazarre. 6-7 board-level executives with their own networks across Pan-African capital markets.',
    unrepeatability:
      'Cold outreach to any one of these would take months. Warm intro via TT to all 6-7 is the wedge motion accelerator the GTM v3.5 Phase 1 → Phase 3 sequencing depends on.',
  },
  {
    side: 'me',
    ingredient: 'Pan-African regulatory ground-truth validation',
    detail:
      "Sankore holds 7 SEC Nigeria licenses (Investment Adviser, Portfolio Manager, Fund Manager, Broker/Dealer, Registrar, Issuing House, Trustee). Working inside that compliance posture validates DI's 19-framework registry against real regulated-entity operating context.",
    unrepeatability:
      'The 19-framework registry stops being theoretical and becomes "the framework Sankore Investments runs decisions through." Procurement-grade reference for every other Pan-African institutional buyer.',
  },
  {
    side: 'me',
    ingredient: 'The brand of being Sankore-embedded',
    detail:
      '"The platform Sankore Investments uses to audit its decisions" is an unrepeatable reference for the GTM v3.5 ceiling (cross-border M&A leaders at FTSE 250 / S&P 500). Sankore is the Pan-African anchor that makes the cross-border M&A wedge defensible.',
    unrepeatability:
      'Brand reference compounds with every other persona conversation. The Phase 3 mid-market warm-intro motion needs ONE reference customer; Sankore is structurally the right one.',
  },
  {
    side: 'them',
    ingredient: 'Custom-built internal decision-intelligence platform',
    detail:
      'Free for 12+ months. Built INTO their workflow across IC + Real Estate + Fund Management + Ventures + Wealth Management + Trustee. Not a generic SaaS install — a custom product line tuned to Sankore-specific decision classes.',
    unrepeatability:
      'No off-the-shelf vendor builds custom decision infrastructure for a single client without a 7-figure engagement contract. The founder embed is what makes the economics work — and Sankore becomes the design partner the next 10 customers inherit.',
  },
  {
    side: 'them',
    ingredient: 'A co-branded methodology ("Sankore Decision Standard")',
    detail:
      "Vector 4 (methodology-as-standard) applied to a single anchor partner. Sankore publicly owns the methodology alongside Decision Intel. Their clients see 'audited per the Sankore Decision Standard'. Their fund LPs see it on every IC artefact.",
    unrepeatability:
      "Standards compound through use. Sankore's clients adopting the Sankore Standard makes the standard the regional default — making Sankore the keeper of the Pan-African decision-quality standard, not just a wealth manager.",
  },
  {
    side: 'them',
    ingredient: 'Founder physically embedded in the London office',
    detail:
      '12 weeks. Not a remote vendor. In-person at the newly opened London office. Shadowing IC meetings, sitting in on portfolio reviews, joining real-estate development discussions. The product gets built next to the actual users.',
    unrepeatability:
      'Most enterprise software is built remotely and installed once. Decision Intel as built-with-Sankore by a founder who lives in the office for 12 weeks is structurally different — the product that emerges fits Sankore the way no vendor product does.',
  },
  {
    side: 'them',
    ingredient: 'Optional equity-warrant participation',
    detail:
      'Same structure as the existing £20-25K founding-pilot bundle (12-month commitment with optional warrant + outcome-share). For Sankore specifically: the bundle is the relationship + the access + the early position in DI as it grows.',
    unrepeatability:
      "TT is an active venture and angel investor. Taking an early position in a Pan-African-rooted decision-intelligence company they helped shape is structurally aligned with Sankore's existing investment thesis (Wealth.ng, Saunders, Juno — they build companies from scratch).",
  },
  {
    side: 'them',
    ingredient: 'Ligare integration roadmap (optional)',
    detail:
      "If TT is interested: prototype an API layer that wraps DI inside Sankore's Wealth-as-Service (Ligare) offering, so every downstream bank/fintech customer of Ligare gets audit-in-the-loop for their advisory recommendations.",
    unrepeatability:
      "Distribution moat through partnership. DI rides Sankore's existing B2B2C distribution to every Ligare customer. Sankore's Wealth-as-Service becomes structurally differentiated from generic wealth APIs.",
  },
];

// =========================================================================
// LONGITUDINAL GOALS — 12-week embed + 12-month outcome arc
// =========================================================================

export interface LongitudinalGoal {
  horizon: '12-week' | '6-month' | '12-month' | '24-month';
  goal: string;
  whyItMatters: string;
  successSignal: string;
}

export const LONGITUDINAL_GOALS: ReadonlyArray<LongitudinalGoal> = [
  {
    horizon: '12-week',
    goal: '30-50 retroactive Sankore decisions audited; Bias Genome populated with real Pan-African institutional data.',
    whyItMatters:
      'Compresses 12 months of forward-calibration accumulation into 12 weeks. By week 12, "Brier X against 50 closed Sankore decisions" is a procurement-grade claim.',
    successSignal:
      'A handoff document — Sankore-specific calibration baseline + per-bias outcome correlations + named pattern frequencies — that TT can show her board.',
  },
  {
    horizon: '12-week',
    goal: 'Custom decision-intelligence dashboard live across 6 Sankore business lines.',
    whyItMatters:
      "TT sees ALL active reasoning risks across IC + Real Estate + Fund Management + Ventures + Wealth Management + Trustee in one screen. CEO-grade view, not analyst tool. The genuinely-novel surface that doesn't exist anywhere else.",
    successSignal:
      'TT (or her COO) actually opens the dashboard 3× per week without prompting. Used in the Monday morning leadership meeting.',
  },
  {
    horizon: '12-week',
    goal: 'Stage-gated IC workflow installed and ENFORCED for one fund (smallest-stakes first).',
    whyItMatters:
      "V5 (rigid schema enforcement) goes from documented capability to running infrastructure. Sankore's IC literally cannot vote on a memo without the DI audit attached.",
    successSignal:
      "One closed IC decision made through the new workflow, with the DPR attached to Sankore's board package.",
  },
  {
    horizon: '6-month',
    goal: 'Sankore methodology co-branded and surfaced externally.',
    whyItMatters:
      'Vector 4 — Methodology-as-standard. Sankore website + investor letters + fund prospectuses cite the Sankore Decision Standard. Other Pan-African firms start asking what it is.',
    successSignal:
      "At least one of Sankore's clients or fund LPs asks for the same standard on their own decisions, opening the second pilot conversation.",
  },
  {
    horizon: '6-month',
    goal: 'V1 calibration loop validated against real Sankore IRR/MOIC outcomes.',
    whyItMatters:
      "Forced-at-vote 90-day operational proxies have been live for 12 weeks. Some have resolved. Brier scoring is now Sankore-specific, not synthetic. The procurement claim survives a sophisticated investor's diligence.",
    successSignal:
      'At least 5 closed proxies with Brier scores. The platform-baseline 0.258 becomes "0.X against the Sankore corpus" — the genuine flywheel signal.',
  },
  {
    horizon: '12-month',
    goal: 'Sankore network warm-intros activated → 3-5 second pilots in conversation.',
    whyItMatters:
      "Phase 3 of GTM v3.5 (mid-market warm-intro motion) activates. TT's network — and her board members' networks — provide the credibility ramp the founder cannot manufacture cold.",
    successSignal:
      '3-5 conversations active with Pan-African institutional firms TT introduced. At least 1 converts to a second paid pilot at the post-Sankore Phase 3 mid-market rate (£4,999/mo).',
  },
  {
    horizon: '12-month',
    goal: 'Ligare integration shipped (if TT opens that door).',
    whyItMatters:
      "DI becomes a layer in Sankore's existing distribution. Every Ligare downstream customer gets audit-in-the-loop. Distribution moat through partnership.",
    successSignal:
      'API layer live; 1-2 Ligare downstream customers using DI through Sankore branding.',
  },
  {
    horizon: '24-month',
    goal: 'Sankore-anchored Pan-African case library — 100+ closed decisions with outcomes.',
    whyItMatters:
      'By month 24, the Pan-African regulatory + Pan-African calibration data + Pan-African case corpus are the moat layer Cloverpop / Aera / IBM watsonx cannot match from the US. The cross-border M&A ceiling buyer recognizes the depth.',
    successSignal:
      'The first F500 cross-border M&A team buys DI specifically because of the Pan-African data depth. The ceiling unlocks.',
  },
];

// =========================================================================
// TT MEETING PREP — the tactical playbook
// =========================================================================

export interface MeetingOption {
  letter: 'A' | 'B' | 'C';
  duration: string;
  title: string;
  description: string;
  rationale: string;
  compoundsToward: string[];
}

export const TT_MEETING_OPTIONS: ReadonlyArray<MeetingOption> = [
  {
    letter: 'A',
    duration: '4 weeks',
    title: 'IC Decision Audit Installation',
    description:
      "Install DI as the audit layer on every IC memo Sankore's team produces, calibrated to their decision history. Forward-looking: every new IC vote runs through DI first.",
    rationale:
      'Fastest-to-value. Within 4 weeks every new Sankore IC decision is audited. The workflow integration is shallow but enforced — V5 (rigid schema) goes live in one fund. Best if TT wants concrete, immediate operational change.',
    compoundsToward: [
      '12-week: Stage-gated IC workflow installed and ENFORCED for one fund',
      '6-month: V1 calibration loop validated against real Sankore IRR/MOIC outcomes',
    ],
  },
  {
    letter: 'B',
    duration: '4 weeks',
    title: 'Retroactive Bias Genome Seed',
    description:
      "Run DI against 30-50 of Sankore's historical closed decisions where outcomes are known. Produces a Sankore-specific calibration baseline that becomes their reference framework going forward.",
    rationale:
      "Highest moat-building leverage. Compresses 12 months of forward calibration into 4 weeks. By the end, Brier-against-real-Sankore-outcomes is a procurement claim that survives diligence. Best if TT wants to understand DI's depth before committing to forward workflow change.",
    compoundsToward: [
      '12-week: 30-50 retroactive Sankore decisions audited',
      '6-month: Sankore methodology co-branded',
      '12-month: Sankore network warm-intros activated',
    ],
  },
  {
    letter: 'C',
    duration: '8 weeks',
    title: 'Cross-Business-Line Decision Dashboard',
    description:
      'Build a unified decision-intelligence view across IC + Real Estate + Fund Management + Ventures + Wealth Management + Trustee. CEO-grade dashboard of all active reasoning risks in one screen.',
    rationale:
      'Strongest strategic differentiation. The genuinely-novel surface — a multi-asset-class decision intelligence dashboard. Best if TT wants Sankore to have a structural differentiator nobody else has (and willing to invest 8 weeks of access, not 4).',
    compoundsToward: [
      '12-week: Custom dashboard live across 6 business lines',
      '6-month: Sankore methodology co-branded',
      '24-month: Sankore-anchored Pan-African case library',
    ],
  },
];

export interface StrongQuestion {
  question: string;
  whyItWorks: string;
  listenFor: string;
}

export const TT_STRONG_QUESTIONS: ReadonlyArray<StrongQuestion> = [
  {
    question:
      'Across the 14 years of building Sankore, which closed decision do you still think about — not because the outcome was bad, but because you suspect the reasoning was wrong even though it worked?',
    whyItWorks:
      'Earns a 30-minute conversation extension. Surfaces the deepest layer of decision-quality thinking — the right-for-the-wrong-reason category most founders never let themselves articulate. TT is sophisticated enough to have one of these stored away.',
    listenFor:
      'Whether the answer reveals an INDIVIDUAL bias (anchoring, sunk-cost) or an INSTITUTIONAL pattern (IC dynamics, board pressure). If institutional, the partnership shape leans toward Option C (dashboard); if individual, Option B (retroactive seed).',
  },
  {
    question:
      "When the FT named Sankore one of Africa's fastest-growing investment firms in 2023 — what decision in the prior 18 months made that recognition possible? And what decision almost prevented it?",
    whyItWorks:
      'Two-part question forces a contrast. Most founders only tell the success story; the "almost-prevented-it" angle surfaces the highest-stakes near-miss — exactly the decision-quality territory DI is built for.',
    listenFor:
      'The shape of the near-miss. If a capital-allocation call (fund launch, acquisition), Option A is the natural fit. If a strategic-positioning call, Option C. If an investment-thesis call, Option B.',
  },
  {
    question:
      'If you could go back to 2019 — when Sankore had ₦25B AUM — and add ONE structural process to how the firm makes its biggest decisions, what would it be? And what stopped you from adding it then?',
    whyItWorks:
      "Backward-projection elicits process-design intuition. 'What stopped you' surfaces the institutional constraints — politics, time, cost — that DI has to design around if it's going to be adopted.",
    listenFor:
      "The constraints she names are EXACTLY what DI's UX has to overcome. If 'time' — V5 stage-gates are the answer. If 'political will' — V2 mandatory dissent gate. If 'data infrastructure' — Option B (retroactive seed). Use her answer to validate which of the 3 options to lead with.",
  },
  {
    question:
      "Sankore's 5 Cs framework — Credit, Capital, Cities, Communities, Culture — was built to address Nigeria's specific structural gaps. If we were to add a 6th C — Cognition — what would the gap-it-addresses be?",
    whyItWorks:
      "Engages with her actual intellectual framework, not a generic pitch. Shows you've read deeply. Invites her to co-design the positioning. If she takes the question seriously, you're past vendor-evaluation and into partnership.",
    listenFor:
      "If she engages: foundation for the 'Sankore Decision Standard' methodology co-brand. If she deflects: don't push — the partnership is still possible but the co-brand piece is premature.",
  },
];

export const TT_MEETING_DISCIPLINE = {
  doDoList: [
    'Listen first. Ask about her hardest decision in the last 12 months. Let her talk for 10+ minutes before you say anything about DI.',
    'Show you have done the work — name the 5 Cs framework, the recent acquisitions (Diamond Capital, DBSL, Centurion), the Wealth.ng / Ligare / Kada architecture.',
    'Position yourself as someone who can extend Sankore reach — DI rides Sankore distribution, Sankore rides DI IP — not as a vendor selling them software.',
    'Bring a specimen audit relevant to her work. Dangote DPR (Pan-African industrial expansion) AND a fresh specimen audit of a recent Pan-African investment decision researched before the meeting.',
    'Have a specific 12-week plan ready. Not "I would love to work with you." A timeline. Concrete = serious.',
    'Be honest about what you do not know. You are 16. You have never worked inside a fund. Saying that explicitly + framing the 12 weeks as your apprenticeship + their custom product = builds trust faster than confidence ever could.',
  ],
  doNotList: [
    'Do NOT pitch the £249 individual tier. Wrong category — TT is not the persona this is built for.',
    'Do NOT pitch the £1,999/mo founding-pilot rate. Wrong shape — this engagement is bigger than a commercial pilot.',
    'Do NOT lead with the 60-second audit. She is not a cold-traffic visitor.',
    'Do NOT mention any other prospect by name. Confidentiality is procurement-grade.',
    'Do NOT lead with the agentic-shift defense / Cloverpop graveyard analysis. Too inside-baseball for first meeting.',
    'Do NOT ask for money. If she offers, take it. The relationship + embedded access is worth 100x any £1,999/mo line item over 12 months.',
  ],
  framing:
    'Reverse the dynamic. You are not selling. You are offering to spend 12 weeks at her firm at your own expense building something custom. She is evaluating whether you are worth the desk space + the access. The ask is implicit; the offer is explicit. First meeting is value-show + listen + see what happens. No commercial.',
};

// =========================================================================
// FIVE PRODUCT ADAPTATIONS — the roadmap to maximize Sankore leverage
// =========================================================================

export interface ProductAdaptation {
  n: number;
  title: string;
  description: string;
  whyForSankore: string;
  buildCost: string;
  status: 'queued' | 'in-progress' | 'shipped';
  disciplineNote: string;
  /** Optional live route — when the adaptation has shipped, link
   *  the founder straight to the surface from the brief. */
  liveRoute?: string;
}

export const FIVE_ADAPTATIONS: ReadonlyArray<ProductAdaptation> = [
  {
    n: 1,
    title: 'Retroactive audit mode',
    description:
      'Boolean flag (`isRetroactive`) on existing DecisionContainer composes with all 3 kinds. Bulk-upload entry at /dashboard/decisions/retroactive accepts up to 30 historical docs in one batch; pairing engine reconstructs memo+outcome pairs by entity overlap + temporal proximity + content similarity. Per-pair finalizer creates the container with isRetroactive=true + retroactiveMetadata + the DecisionContainerOutcome row in one transaction — no 90-day forward-calibration wait. Populates Bias Genome / Decision DNA / Knowledge Graph against REAL Sankore data immediately.',
    whyForSankore:
      "Sankore has 14 years of decisions. This is the single highest-leverage adaptation — compresses 12 months of forward calibration into 12 weeks of retroactive work. Also the foundation for the 'Brier-against-real-Sankore-outcomes' procurement claim.",
    buildCost:
      '~600 LOC shipped: Prisma migration + 2-tier outcome extractor (regex + deepseek-v4-flash) + pure pairing engine (49 vitest) + 2 routes (extract-outcome + bulk-upload) + 3 UI components (BulkUploadDropzone + RetroactivePairingReview + RetroactiveContainerForm) + 3-step wizard route at /dashboard/decisions/retroactive + container API extension.',
    status: 'shipped',
    liveRoute: '/dashboard/decisions/retroactive',
    disciplineNote:
      'SHIPPED 2026-05-21. Entry: /dashboard/decisions/retroactive. Extends Vector 1 (operational-proxy calibration loop, shipped 2026-05-17) by closing the loop on day one — the outcome row is created at container-create time, so when the memo is then attached and audited, recalibration grounds against KNOWN reality rather than forecasted priors.',
  },
  {
    n: 2,
    title: 'Fourth DecisionContainer mode: real_estate_development',
    description:
      'New container kind alongside investment / acquisition / strategic. Stage progression: site_acquisition → entitlement → financing → construction → leasing → stabilization. Required-doc gates: site analysis, financial pro forma, regulatory checklist, contractor selection.',
    whyForSankore:
      'Sankore has at least 3 active real-estate projects (Lotus, Juno, Laird Place mixed-use). The existing 3 container modes do not fit a mixed-use development proposal.',
    buildCost:
      '~800 LOC. New mode in CONTAINER_MODES + stage definitions + 4-5 new document subtypes + overlays. 2 sessions.',
    status: 'queued',
    disciplineNote:
      'Founder-gated per the CLAUDE.md "Modifying CONTAINER_MODES" cascade discipline.',
  },
  {
    n: 3,
    title: 'Fifth DecisionContainer mode: fund_launch',
    description:
      'New container kind for fund-launch decisions. Stage progression: thesis_development → target_market_sizing → fee_structure → anchor_LP_commitments → regulatory_filing → go_to_market. Document subtypes: thesis memo, fund prospectus, LP-ask deck, regulatory filing.',
    whyForSankore:
      'Sankore launches funds repeatedly (Agriculture Fund, Real Wealth Fund). Distinct decision class with its own bias patterns (overconfidence on AUM ramp, anchoring on prior-fund returns, confirmation bias on target sectors).',
    buildCost: '~700 LOC. Same cascade shape as adaptation #2. 2 sessions.',
    status: 'queued',
    disciplineNote: 'Same founder-gated cascade as adaptation #2.',
  },
  {
    n: 4,
    title: 'Pan-African regulatory deep-extension',
    description:
      'Extend the 19-framework registry with: SEC Nigeria Investment Adviser regulations (Sankore has the license), Lagos State property law for real-estate decisions, AML/KYC frameworks for client advisory, FATF Travel Rule for cross-border movements, Nigerian Investment & Securities Act 2007 for fund management.',
    whyForSankore:
      'Sankore holds 7 SEC Nigeria licenses. Working inside their compliance posture validates the 19-framework registry against real regulated-entity operating context. Pan-African moat becomes Sankore-validated, not theoretical.',
    buildCost:
      '~500 LOC + research time. 5-6 new framework entries with named provisions + per-decision-class regulatory checklists. 1-2 sessions.',
    status: 'queued',
    disciplineNote:
      'Follows the existing africa-frameworks.ts pattern. Framework count lifts; canonical-import discipline catches every consumer that uses getAllRegisteredFrameworks().length.',
  },
  {
    n: 5,
    title: 'Multi-decision-class portfolio dashboard',
    description:
      'New in-product view showing all active decisions across all 6 Sankore business lines in one dashboard. IC pipeline + real-estate development pipeline + fund-launch pipeline + venture investments + client advisory portfolio + trustee decisions. TT (or her COO) sees ALL active reasoning risks in one screen.',
    whyForSankore:
      "The genuinely-novel surface that does not exist anywhere else. CEO/CIO-grade dashboard, not an analyst tool. Makes DI structurally different for Sankore from any other vendor — and makes the 'Sankore Decision Standard' brand believable.",
    buildCost:
      '~1200 LOC. New /dashboard route + cross-container aggregation API + 6 business-line views + permissions model. 3-4 sessions.',
    status: 'queued',
    disciplineNote:
      'Built on top of adaptations #1-4. Sequence matters: cannot build the dashboard before the underlying container modes exist.',
  },
];
