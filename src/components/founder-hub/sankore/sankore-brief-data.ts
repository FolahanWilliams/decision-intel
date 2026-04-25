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
    flaggedBy: 'Titi (real audit) — Sankore\'s entire intellectual anchor is Ray Dalio',
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
      { label: '/api/cron/enforce-retention', codePath: 'src/app/api/cron/enforce-retention/route.ts' },
      { label: 'Delete UI on document detail', codePath: 'src/app/(platform)/documents/[id]/page.tsx' },
    ],
  },
  {
    title: 'Bias-level collaboration absent — "team adoption mechanism"',
    flaggedBy: 'Convergent — Opus recommended-first-move; Sankore + Marcus + Chinedu',
    status: 'shipped',
    shipped:
      'BiasComment threaded comments + BiasTask assignment per BiasInstance. @mentions parse against TeamMember roster, fire one Nudge per mentioned user. Task assignment also fires Slack DM via the org\'s monitoredChannels[0] (best-effort). Granular auth: author edits, anyone-with-access resolves, creator/assignee/admin task matrix.',
    surfaces: [
      { label: 'BiasCollabPanel', codePath: 'src/components/analysis/BiasCollabPanel.tsx' },
      { label: '/api/bias-comments', codePath: 'src/app/api/bias-comments/route.ts' },
      { label: '/api/bias-tasks', codePath: 'src/app/api/bias-tasks/route.ts' },
      { label: 'Wired into OverviewTab on every bias card' },
    ],
  },
  {
    title: 'No document versioning or DQI delta loop',
    flaggedBy: 'Opus — "THE behavior-change loop"',
    status: 'shipped',
    shipped:
      'Document.parentDocumentId + versionNumber + Analysis.previousAnalysisId. Upload route accepts versionOfDocumentId. Analyze stream auto-links the previous Analysis. VersionDeltaCard renders "DQI 42 → 71 (+29)" hero card; VersionHistoryStrip shows v1 → v2 → v3 chain. "Upload new version" button on every doc.',
    surfaces: [
      { label: 'VersionDeltaCard', codePath: 'src/components/analysis/VersionDeltaCard.tsx' },
      { label: 'VersionHistoryStrip', codePath: 'src/components/analysis/VersionHistoryStrip.tsx' },
      { label: 'computeVersionDelta', codePath: 'src/lib/utils/version-delta.ts' },
    ],
  },
  {
    title: 'Market-context-aware bias detection (35% CAGR false-positive)',
    flaggedBy: 'Titi sub-agent + Opus — bias detection applies a Western prior to EM growth',
    status: 'shipped',
    shipped:
      'Structural-Assumptions audit operates as a SECOND lens alongside cognitive bias. Dalio determinants (currency_cycle, debt_cycle, geology, governance, etc.) explicitly model emerging-market exposures. The Dangote case study explicitly references the FX-repatriation assumption that Western priors miss. Auto-detection flag is wired but the "tag this memo as emerging_market" UX is Week 5–8.',
    surfaces: [
      { label: 'StructuralAssumptionsPanel', codePath: 'src/components/analysis/StructuralAssumptionsPanel.tsx' },
      { label: 'Dangote DEMO showing EM priors', href: '/demo' },
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
    plannedWeek: 'Weeks 9–10',
    shipped:
      'Per-room detail page + blind-prior survey + reveal flow planned. Marcus called this his "feature I\'d pay for immediately." Pre-IC blind-prior collection → unanimity score → DQI overlay.',
    surfaces: [{ label: 'Plan §4.1' }],
  },
  {
    title: 'Deal-centric workflow (deal IS the organising unit)',
    flaggedBy: 'Opus M&A panel + Marcus — "Your Deals page and Audit page are two products"',
    status: 'scheduled',
    plannedWeek: 'Weeks 5–8',
    shipped:
      'Per-deal detail page with all docs + composite Deal DQI + bias-signature aggregation. Deal-scoped copilot RAG. Compare-deals side-by-side.',
    surfaces: [{ label: 'Plan §3.1' }],
  },
  {
    title: 'Document-level RBAC',
    flaggedBy: 'Opus CSO + Sankore — "analyst sees CEO board papers"',
    status: 'scheduled',
    plannedWeek: 'Weeks 5–8',
    shipped:
      'DocumentAccess Prisma model with private / team / specific-members visibility. Org admin can override per document.',
    surfaces: [{ label: 'Plan §3.5' }],
  },
  {
    title: 'Redaction assistant on paste flow',
    flaggedBy: 'Marcus + Chinedu (confidentiality)',
    status: 'scheduled',
    plannedWeek: 'Weeks 5–8',
    shipped:
      'Pre-submit scan flags emails / phones / financial totals / common entity-suffixes; one-click auto-redact. Avoids the memo touching cloud vendors with unredacted PII.',
    surfaces: [{ label: 'Plan §3.2' }],
  },
  {
    title: 'Board-member 24h view-only share links',
    flaggedBy: 'Marcus + Elena — "the board doesn\'t log into SaaS tools"',
    status: 'scheduled',
    plannedWeek: 'Weeks 5–8',
    shipped: 'ShareLink.expiresAt + 410-Gone gate + 1h/24h/7d/30d selector on the existing modal.',
    surfaces: [{ label: 'Plan §3.3' }],
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
    shipped: 'Considered for Sankore design-partner offer specifically — handled outside list pricing.',
    surfaces: [{ label: 'Founder Hub → Sankore offer tab' }],
  },
  {
    title: 'WhatsApp / multi-language',
    flaggedBy: 'Titi sub-agent — Africa-specific',
    status: 'deferred',
    shipped: 'Not in current 12-week plan. Slack /di audit (Week 9+) addresses workflow-embedding for the same use-case.',
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
  { id: 'debt_cycle', label: 'Debt Cycle', category: 'cycles', oneLiner: 'Where the economy sits on the short + long debt cycles.' },
  { id: 'currency_cycle', label: 'Currency / Inflation', category: 'cycles', oneLiner: 'FX strength, inflation, devaluation. EM exposures live here.' },
  { id: 'reserve_currency_status', label: 'Reserve Currency', category: 'power', oneLiner: 'Continued USD/EUR/CNY dominance for settlement + reserves.' },
  { id: 'economic_output', label: 'Economic Output', category: 'power', oneLiner: 'Absolute + relative GDP — drives addressable-market size.' },
  { id: 'trade', label: 'Trade Share', category: 'power', oneLiner: 'Global-trade share, terms of trade, route dependencies.' },
  { id: 'military', label: 'Military / Geopolitical', category: 'power', oneLiner: 'Asset security, sanction risk, contract enforceability.' },
  { id: 'markets_financial_center', label: 'Financial Centres', category: 'power', oneLiner: 'Liquidity, exit-market depth, regulatory credibility.' },
  { id: 'education', label: 'Education', category: 'fundamentals', oneLiner: 'Human-capital quality + quantity for execution.' },
  { id: 'innovation', label: 'Innovation', category: 'fundamentals', oneLiner: 'Tech absorption rate, half-life of any technical moat.' },
  { id: 'productivity', label: 'Productivity', category: 'fundamentals', oneLiner: 'Total-factor productivity — the long-run output driver.' },
  { id: 'cost_competitiveness', label: 'Cost Competitiveness', category: 'fundamentals', oneLiner: 'Relative labour / capital / energy cost positions.' },
  { id: 'infrastructure', label: 'Infrastructure', category: 'fundamentals', oneLiner: 'Power, ports, logistics, broadband, payment rails.' },
  { id: 'geology', label: 'Geology / Resources', category: 'external', oneLiner: 'Raw materials, water, arable land endowment.' },
  { id: 'acts_of_nature', label: 'Acts of Nature', category: 'external', oneLiner: 'Climate, pandemics, natural disasters as a 1st-order axis.' },
  { id: 'governance', label: 'Governance / Rule of Law', category: 'internal', oneLiner: 'Regulatory predictability, contract enforceability.' },
  { id: 'wealth_gaps', label: 'Wealth Gaps', category: 'internal', oneLiner: 'Internal inequality + values-conflict trajectory.' },
  { id: 'civility', label: 'Civility / Work Ethic', category: 'internal', oneLiner: 'Cultural determinants of collective output.' },
  { id: 'resource_allocation', label: 'Resource Allocation', category: 'internal', oneLiner: 'How efficiently capital + talent get to best opportunities.' },
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
  { code: 'SOX §404', name: 'Sarbanes-Oxley', region: 'g7', status: 'live', dprCoverage: 'Material-statement controls log + signed reviewer trail.' },
  { code: 'GDPR Art. 22', name: 'EU GDPR', region: 'g7', status: 'live', dprCoverage: 'Meaningful information about the logic; per-bias evidence.' },
  { code: 'EU AI Act · Annex III', name: 'EU AI Act', region: 'g7', status: 'enforceable_2026', enforcementDate: '2026-08-02', dprCoverage: 'Art. 14 record-keeping, Art. 13 transparency, Art. 15 accuracy.' },
  { code: 'Basel III', name: 'Basel III · Pillar 2 ICAAP', region: 'g7', status: 'live', dprCoverage: 'Capital-decision documentation; provision attached on flagged biases.' },
  { code: 'FCA Consumer Duty', name: 'UK Financial Conduct Authority', region: 'g7', status: 'live', dprCoverage: 'UK financial-services decisioning evidence.' },
  { code: 'SEC Reg D', name: 'SEC Regulation D', region: 'g7', status: 'live', dprCoverage: 'Forward-looking statement / safe-harbour rigor.' },
  { code: 'LPOA', name: 'Limited Partnership Obligations', region: 'g7', status: 'live', dprCoverage: 'Fund-level fiduciary dissent + IC-meeting record.' },
  // African — added in this sprint
  { code: 'NDPR Art. 12', name: 'Nigeria Data Protection Regulation', region: 'africa', status: 'live', dprCoverage: 'Automated-decision rights for Nigerian data subjects (GDPR-aligned).' },
  { code: 'CBN AI Guidelines', name: 'Central Bank of Nigeria', region: 'africa', status: 'draft', enforcementDate: 'Draft 2024', dprCoverage: 'FS-sector model governance, explainability, consumer-protection duties.' },
  { code: 'WAEMU', name: 'West African Economic & Monetary Union', region: 'africa', status: 'live', dprCoverage: 'Cross-border data localisation across 8 member states.' },
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
    after: 3,
    examples: ['Dangote Cement pan-African expansion', 'MTN Nigeria · NCC USSD dispute', 'Access Bank · Diamond merger'],
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
    fitNote:
      'Closest fit. Every Capital-side workflow has a shipped Decision Intel surface today.',
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
    oneLiner: 'Creative-industry investments — Sankore\'s soft-power thesis.',
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
    demoNote: 'Open in a new tab during the call — Titi\'s GC can review live.',
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
    oneLiner: '10 frameworks (incl. NDPR/CBN/WAEMU). Per-tier retention table.',
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
    demoNote: 'Show the 5-step prerequisite strip — it\'s honest about Pro requirement.',
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
    what:
      '"Last time we spoke, the platform was a strong intellectual product. Since then, it has been wrapped to actually be useful inside a Sankore deal team. Three shifts: document → decision, solo → collaborative, report → embedded. Show the Three Shifts panel from this brief.',
  },
  {
    minute: '2–5',
    title: 'Dalio is now first-class',
    what:
      'Open /how-it-works and search for "Ray Dalio". Then open any document audit + click "Run structural audit" — show the 18-determinant output. This is the gap she flagged on day one.',
    link: '/how-it-works',
  },
  {
    minute: '5–7',
    title: 'African memo runs through the audit',
    what:
      'Open /demo, click the Dangote chip, run the audit live. Show the output recognising FX-repatriation + currency-cycle as load-bearing structural assumptions. This is the "it understands my market" proof.',
    link: '/demo',
  },
  {
    minute: '7–9',
    title: 'NDPR + CBN + WAEMU on /security',
    what:
      'Scroll the Frameworks block. 7 → 10. Then download the DPR sample and the DPA template — both are live on the same page.',
    link: '/security',
  },
  {
    minute: '9–11',
    title: 'Team workflow inside an audit',
    what:
      'Open any document detail page. Expand a bias card. Show the BiasCollabPanel: comment thread, @mention syntax, "Assign as task". Mention how a Sankore associate gets nudged in-app + Slack DM (when org\'s Slack is wired).',
  },
  {
    minute: '11–13',
    title: 'Versioned memos, delta DQI',
    what:
      'On a doc that has a v2: show the VersionHistoryStrip + the VersionDeltaCard rendering "DQI 42 → 71, sunk_cost resolved, anchoring emerged". This is the iteration loop she\'ll demo to her associates.',
  },
  {
    minute: '13–15',
    title: 'Honest gaps + ask',
    what:
      'Walk the Honest Gaps panel from this brief. Decision Rooms is scheduled (Weeks 9–10). Deal-centric workflow is scheduled (Weeks 5–8). RBAC + redaction-assistant + share-link expiry are all in the same window. Then ask: "Is there anything between Capital, Credit, City, Culture, Community where you want a custom case study seeded next?"',
  },
];

// ─── 9. Honest gaps (for transparency during the call) ────────────────────

export const HONEST_GAPS = [
  {
    title: 'Decision Rooms is still a redirect',
    detail:
      'The list page exists; per-room collaboration page is on the Week 9–10 plan. Marcus (M&A persona) called the blind-prior survey "the feature I\'d pay for immediately" — it\'s the highest-leverage thing left.',
  },
  {
    title: 'Deal-centric workflow is scheduled, not shipped',
    detail:
      'Today, deals show document counts; uploading still starts from /dashboard. The per-deal page with composite Deal DQI + bias-signature aggregation is Weeks 5–8.',
  },
  {
    title: 'Document-level RBAC',
    detail:
      'Org admin / member roles exist. Per-document private / team / specific-members permissions ship Weeks 5–8. Confidential watermark on board reports today is cosmetic, not an access gate.',
  },
  {
    title: 'SAML SSO requires Supabase Pro',
    detail:
      'Code path is shipped. Supabase Pro upgrade ($25/mo) flips the toggle. We\'re holding off until the first design partner asks — which is the right way to discover this with Sankore directly.',
  },
  {
    title: 'Real-time backend progress events',
    detail:
      'Audit progress UI is SSE-driven from real backend events (verified — claim was wrong in the original audit). What\'s NOT real: the per-stage progress is event-completion-driven, not percent-within-stage. For a 90-second audit it feels honest; for a 4-minute one we\'d want finer granularity.',
  },
  {
    title: 'WhatsApp / multi-language / PPP pricing',
    detail:
      'Sankore-specific asks from the original Titi sub-agent. Not in the 12-week plan. Slack /di audit (Weeks 9–12) covers the workflow-embedding use-case for now.',
  },
];
