# TODO — Decision Intel

Claude reads this file at the start of every session. Update it as tasks are completed or new ones are discovered.

## Active Priorities
- [ ] Land first paying design partner (outreach via advisor network)
- [ ] Post 1 case study per day on LinkedIn (use Content Studio → Generate LinkedIn Post, or wait for daily email from `/api/cron/daily-linkedin`)
- [x] Polish the first 60 seconds of the demo (upload → pipeline animation → score reveal)
- [x] Re-enable `/api/cron/daily-linkedin` in dispatcher with early-bail guard for missing `FOUNDER_EMAIL` / `RESEND_API_KEY` (prevents future Gemini budget burn — the original April 2026 incident). Founder still needs to verify `RESEND_API_KEY` is set on Vercel AND that the `EMAIL_FROM` sender domain is verified inside Resend, otherwise emails will short-circuit with `result='dry_run'` or `result='failed'` instead of landing in the inbox.
- [ ] Pre-seed/seed fundraise: target first paying design partner + 2-3 reference logos before kickoff
- [ ] Find GTM / enterprise-sales co-founder or advisor

## Known Bugs
- [x] Decision Graph on `/dashboard/decision-graph` — verified Apr 2026; `minHeight: 560` + `flex-1` on the graph container prevents the "width:0 on first mount" class of regression after recent layout changes. No active bugs.
- [ ] Test Outcome Gate flow end-to-end (submit outcome → recalibrated DQI appears on analysis detail page)
- [x] Google Drive auto-compare fixed Apr 2026: `contentHash` was being computed but never persisted on create, so subsequent syncs compared against null and re-ingested forever. Also, updated files mutated `sourceRef` to `${fileId}:${timestamp}`, which orphaned every update and silently broke the 24h cooldown query. Fix: compute hash unconditionally, save `contentHash` on create, keep `sourceRef` stable at `file.id`, added P2002 handling for cross-org hash collisions. ([google-drive-sync/route.ts:100-180](src/app/api/cron/google-drive-sync/route.ts#L100-L180))
- [x] `DealAuditPurchase.dealId` missing FK — fixed with `onDelete: Cascade` relation + `db push` (2026-04-12)
- [x] `/api/analyze/stream` and `/api/upload` don't share the `checkAnalysisLimit` guard — fixed: guard now lives in `analyzeDocument()` in `src/lib/analysis/analyzer.ts`, covers all callers (Slack, Drive, email, extension, bulk upload) (2026-04-12)
- [x] Plan-limit `biasTypes` gating (Free=5, Pro=20) is declared in `src/lib/stripe.ts` but not actually enforced anywhere — fixed: enforcement wired into `analyzer.ts` via `getBiasTypeLimit()`, truncates to plan limit keeping most severe biases (2026-04-13)
- [x] `Analysis` is queried by `document.userId` for plan limits but only indexed on `[documentId, createdAt]` — fixed: added `@@index([outcomeStatus, outcomeDueAt])` for outcome gate queries (2026-04-13)
- [x] Slack command rate limiting uses an in-memory `Map` — fixed: replaced with Postgres-backed `checkRateLimit` utility with `failMode: 'open'` for Slack UX (2026-04-13)
- [ ] Encryption keys (DOCUMENT_ENCRYPTION_KEY, SLACK_TOKEN_ENCRYPTION_KEY) have no rotation scheme — rotating them today would brick all existing encrypted rows. Add a `keyVersion` field to encrypted records.

## Technical Debt
- [ ] Marketing pages use hardcoded color constants (`C.navy`, `C.green`) — this is intentional (light-theme-only pages), NOT a bug. Do not convert to CSS variables.
- [ ] `riskScorerNode` in `src/lib/agents/nodes.ts` is ~1,200 lines and does six separate jobs (compound scoring, Bayesian priors, outcome feedback, calibration, report assembly, causal weights). Refactor into composable sub-functions — hard to test and debug today.
- [ ] **Dashboard three-view full refactor (B6-full)** — `src/app/(platform)/dashboard/page.tsx` is 2,200+ LOC with Upload (670 LOC, ~25 state deps) and Browse (440 LOC, ~15 state deps) views inlined. B6-lite (2026-04-15) extracted Analytics + wired `?view=` URL sync; still TODO: extract UploadView + BrowseView into `_views/` with either prop-drilling or a new DashboardContext. Bundle win is modest (heavy deps already `dynamic()`), main benefit is readability. Dedicated 2-3h session; regression surface on the most-used page is high.
- [ ] **Decision Alpha Index — backend pipeline (A1-full)** — `/decision-alpha` marketing page shipped 2026-04-15 with static `QUARTER = 'Q2 2026'` sector data and a historical leaderboard wired by hand. For quarterly auto-publication: (1) add `DecisionAlphaSnapshot` Prisma model (sector, dqi, delta, volatility, biasProfile, quarter, publishedAt), (2) build earnings-call scraper that pulls SEC EDGAR 10-Q narrative sections, (3) run the Decision Intel pipeline against scraped text to compute sector-level DQI, (4) add cron that publishes a new snapshot once per quarter, (5) replace the static SECTOR_INDEX array with a server component that reads from DB. Full build ~1-2 days. Marketing MVP works without it.
- [ ] **Design-system polish — remaining pages** — Phase 1-4 of the app-wide unification shipped 2026-04-15 (globals.css tokens + primitives, Dashboard, Projects, AI Copilot). Every page now inherits solid white cards, hairline borders, calibrated shadows, and brand-green primary buttons. Still TODO: page-level polish for Decision Journal, Playbooks, Settings, Team, Decision Rooms, Cognitive Audits, Outcome Flywheel, Decision Quality, Experiments, Meetings. Each needs: (a) audit of hardcoded off-palette hex/rgba accents (hunt for `#a78bfa`, `#06b6d4`, `rgba(168, 85, 247...`, `bg-blue-X`, `text-blue-X`), (b) page header aligned to the shared `.page-header` rhythm from Dashboard/Projects, (c) consistent widget stack rhythm via `mb-lg` wrappers. Dedicated session — ~1.5-2h. Skip unless the page is on a demo path.
- [x] Bias-insight cache in `src/lib/utils/cache.ts` is keyed on `bias_insight:${biasType}` with no `orgId` prefix — fixed: cache keys now scoped as `bias_insight:{orgId}:{biasType}`, callers in `nodes.ts` updated (2026-04-13)
- [ ] Hardcoded `bg-white/X`, `text-white`, `border-white/X` still lurk in: `SalesToolkitTab` (intentional light-only?), `ExperimentsContent`, `meetings/[id]`, `cognitive-audits/effectiveness`, several dashboard pages. Sweep with codemod.

## Recently Completed (fire-and-forget + light-theme + orphan-nav sweep, 2026-04-18)
- [x] **Silent .catch(() => {}) sweep across API + pipeline**: fixed 9 silent-swallow sites that violated the CLAUDE.md fire-and-forget discipline (audit-log writes, humanDecision/Meeting status='error' transitions, webhookSubscription delivery-status updates). Files: `api/human-decisions/[id]/route.ts` (GET + DELETE audit writes), `api/human-decisions/simulate/route.ts` (simulate audit write), `api/journal/[id]/convert/route.ts` (submit-audit write + two schema-drift/error status transitions), `api/meetings/upload/route.ts` (upload audit write + cleanup delete), `api/copilot/sessions/[id]/resolve/route.ts` (session_resolved audit write), `lib/meetings/process.ts` (transcribe audit write + processing-failure + updateStatus), `lib/integrations/webhooks/engine.ts` (failCount reset on success). All now use `.catch(err => log.warn('specific context:', err))`.
- [x] **Light-theme sweep — `compare/page.tsx` + `RootCauseSection`**: Compare Analyses page had 12 hardcoded `text-gray-300/400/500` + `text-zinc-400` tokens rendering near-invisibly on the white platform surface (title subtitle, loading states, empty states, table headers + row labels, bias list items, "No biases detected" placeholder, the Minus icon in the scoreDelta helper). RootCauseSection had two instances (loading label + evidence row). Migrated to `var(--text-muted)` / `var(--text-secondary)` while preserving severity-color Tailwind chips inside colored wrappers.
- [x] **Orphaned `/decision-alpha` marketing page wired into nav**: `CaseStudyNav` gains a Decision Alpha link (after Bias Genome), landing-page footer Product column adds Decision Alpha between Bias Genome and Pricing. Page was previously only reachable via Command Palette / direct URL.
- [x] **Founder-context update — April 2026 realities**: added `RECENTLY SHIPPED` entries for Inline Post-Upload Reveal (the actual wow-moment demo mechanic), Admin Full-Access Bypass (ADMIN_USER_IDS), Command Palette new actions, Cost-Tier Model Routing (gemini-3.1-flash-lite for low-judgment nodes), daily-linkedin early-bail guard, Google Drive contentHash persistence fix. New `FIRE-AND-FORGET DISCIPLINE` section documents the .catch pattern rule.

## Recently Completed (how-it-works sprint, 2026-04-17)
- [x] **`/how-it-works` — new credibility page at landing-page polish level**. Eight sections: hero (with animated `PipelineMiniatureViz`) → full 12-node `PipelineFlowDiagram` with clickable `PipelineNodeDetail` drawer → bias detection (6 `FeaturedBiasCard`s linking to `/taxonomy#<bias>`) → toxic combinations (reuses `ToxicNetworkGraph`) → DQI (new `DqiComponentBars` + 3 sample scores) → noise + boardroom parallel viz (`NoiseDistributionViz` + `BoardroomSimViz`) → academic foundation (6 `ResearchCitationCard`s) → security + privacy callout → CTA. All 7 new components under [src/components/marketing/how-it-works/](src/components/marketing/how-it-works/), data in [src/lib/data/pipeline-nodes.ts](src/lib/data/pipeline-nodes.ts). Pure SVG, Framer Motion, light-theme-only, `prefers-reduced-motion` respected on every animation. Nav updated in `CaseStudyNav`, landing footer gains the link, existing landing "How It Works" section now has a "See the full 12-node breakdown →" chip pointing here. **Content discipline**: every stat matches `FOUNDER_CONTEXT` (DQI 28/18/18/13/13/10, 12 nodes, 30+ biases, A–F grade scale). No prompts, no weights, no tier assignments leaked.

## Recently Completed (marketing visualization sprint, 2026-04-16 night)
- [x] **/proof — DecisionTimeline**: hero bubble-chart replaces-and-complements the chip selector. X=year of decision, Y=impactScore, radius=impact magnitude, color=outcome severity. Clicking a bubble drives `?case=<slug>`. Pure SVG, responsive viewBox, Framer Motion entrance, hover labels. Company labels surface on hover and for the active case. Sits between hero and sticky chip selector.
- [x] **/proof — CaseBiasWeb**: radial bias-network viz for the featured case. Primary bias at top (red), other flaggable biases around the circle (slate), curved red edges for every toxic-pair match (Echo Chamber, Sunk Ship, Blind Sprint, etc.). Center node represents the decision at risk. Pattern chips below list active toxic patterns. New dedicated section after the outcome reveal.
- [x] **/bias-genome — RiskLandscape**: category-defining 2D scatter between headline cards and leaderboard. X=prevalence, Y=failure lift. Bubble size = sample size, color = quadrant (Common & Dangerous red, Rare but Deadly amber, Common Containable violet, Low Concern green). Quadrant thresholds at prevalence/2 and 1.0x baseline lift. Top-right quadrant labels always visible (the story biases); others surface on hover with exact n + lift.
- [x] **/bias-genome — ToxicNetworkGraph**: hub-and-spoke network graph placed above the toxic combo cards. 4 highest-participation biases sit on an inner ring (slate hub nodes with participation count); periphery biases on an outer ring. Edge color = pattern name. Legend chips let you isolate a pattern's edges via hover. Every pattern gets its own color (Echo Chamber red, Sunk Ship orange, Blind Sprint amber, Yes Committee violet, Optimism Trap pink, Status Quo Lock blue, Doubling Down emerald).

All four pure SVG (no charting libraries, no WebGL) — build-time-safe, zero bundle cost beyond Framer Motion already in use.

## Recently Completed (marketing pages sprint, 2026-04-16 later)
- [x] **A2 — `/proof` (Pre-Decision Evidence Explorer)**: new landing-page-grade route surfacing all cases that have `preDecisionEvidence`. Split layout: paper-style pre-decision document (left) + numbered red flags + hypothetical DQI + flaggable-bias pills + quoted hypothetical analysis (right). Navy "What actually happened" outcome reveal below. Sticky case selector with chronological chip order. Honest methodology card + industry coverage strip + CTA. Links: nav (Case Studies nav gains a Proof link) + landing footer. Metadata + OG tags + Suspense-wrapped client for `?case=<slug>` state. New components under [src/components/marketing/proof/](src/components/marketing/proof/).
- [x] **A1 — `/bias-genome` (Public Bias Genome)**: new landing-page-grade route publishing which biases predict failure by industry. Data computed purely client-side from the 33 seed case studies via new [src/lib/data/bias-genome-seed.ts](src/lib/data/bias-genome-seed.ts) — no DB, no LLM, fully deterministic. Hero + 4 headline stat cards (n≥5 gated) + sortable leaderboard with industry filter + toxic combinations grid (7 patterns) + honest methodology panel + CTA. Every metric has its n= visible; n<3 rows dimmed with ⚠. New components under [src/components/marketing/genome/](src/components/marketing/genome/). Migration path documented — swap seed for `/api/intelligence/bias-genome` once ≥3 consenting orgs have reported outcomes.
- [x] Nav wiring: [CaseStudyNav](src/app/(marketing)/case-studies/CaseStudyNav.tsx) gains Proof + Bias Genome links. Landing footer gains both in the Product column.

## Recently Completed (demo-polish sprint, 2026-04-16 late)
- [x] **A6 — Featured Counterfactual at top of analysis**: added `variant="featured"` to `CounterfactualPanel`. Hero card renders above the view toggle on `/documents/[id]`, showing the single highest-impact scenario: "Remove {bias} → +N.Npp success lift · M similar decisions · C% confidence" + optional monetary impact pill. Null when no positive scenario exists, so it never shows an empty state. Visible in every view (Analyst / CSO / Board).
- [x] **A4 — View-as toggle (Analyst / CSO / Board)**: replaced the binary Focused/Full toggle on `/documents/[id]` with a 3-way segmented control. Analyst = full detail, CSO = exec summary + recommendation + featured counterfactual, Board = inline 2-page preview that mirrors the exported board report PDF (same truncation limits: exec 500c, excerpts 180c, mitigation 400c). New [BoardReportView](src/app/(platform)/documents/[id]/tabs/BoardReportView.tsx) component with its own Export PDF button that drives `handleBoardReportExport`. Persistence: `?view=` URL param + `localStorage['di-doc-view-mode']`. Legacy `?view=focused` → CSO, `?view=full` → Analyst so prior bookmarks keep working. Default: CSO.

## Recently Completed (consolidation sprint, 2026-04-16 pm)
- [x] **B1 — Decision Log merge**: new unified page at `/dashboard/decision-log` merges journal entries + cognitive audits into one dated feed. Segmented chip filter (All / Journal / Audits) + status segmented control (All / Pending / Completed / Dismissed). Inline journal quick-add form, audit summary cards when the Audits filter is active, DQI score + biases count per audit row, convert action per journal row, delete modal for audits, and preserved links to `/cognitive-audits/submit` + `/effectiveness` via header buttons. `/dashboard/journal` now redirects to `/dashboard/decision-log?view=journal`. Sidebar item "Decision Journal" → "Decision Log" with active-state match on all three old routes. Command Palette entry renamed. Visual grammar follows `.page-header`, `.card`, CSS variables, and the existing chip pattern used across Browse and Journal — no new tokens introduced.
- [x] **B2 — Compare Selected in browse**: "Compare Selected" button appears in the Documents multi-select bar when 2-3 rows are picked. Routes to `/dashboard/compare?doc=id1,id2,id3`. The compare page was extended to parse comma-separated IDs (capped at 3). When 4+ are selected, the button hides and a "Select 2-3 to compare" hint is shown.
- [x] **B5 — Contextualized Intelligence Brief**: added `'outcomes'` context + optional `metrics` prop (`pendingOutcomes`, `loopClosureRate`) so per-page numbers can be passed in. `/dashboard/outcome-flywheel` now renders a brief above the content that reads "N decisions awaiting outcome reports. Each one you close recalibrates the DQI signal…". `journal` context now surfaces calibration info when `profile.avgDecisionQuality` is populated.
- [x] **B6 — Founder Hub layout**: horizontal tab strip → vertical left rail. 240px sticky rail on desktop (≥900px), stacked full-width block on narrower screens. 4 groups (Product / Go-to-Market / Intelligence / Tools) render as uppercase muted section labels. Active tab: `border-left: 3px solid var(--accent-primary)` + `bg-elevated`. Design grammar mirrored from main `Sidebar.tsx`. Search box, ⌘K shortcut, and `FounderChatWidget` unchanged.

## Recently Completed (refinement sprint, 2026-04-16)
- [x] **D1 — Board-Ready Export**: new `BoardReportGenerator` at `src/lib/reports/board-report-generator.ts`. 2-page PDF (exec summary ≤500 chars, DQI card, top-3 biases with severity stripes, simulated CEO question, top mitigation). Wired into ShareModal as a prominent green-accented tile above the full PDF export. Also triggerable via ⌘K → "Export Board Report" on document detail pages.
- [x] **C2 — Upload bias preview hint**: new helper `src/lib/utils/bias-preview.ts` maps filename regex + `selectedDocType` → likely biases. Renders a green-tinted hint in the upload confirmation dialog ("Looks like an M&A memo — we'll check for sunk cost + overconfidence first."). Zero backend calls.
- [x] **C3 — `.section-heading` utility**: new class in `globals.css` (uppercase, tracking-widest, text-muted). Applied to `OverviewTab` subheadings (Recognition Cues, Narrative Pre-Mortem) and `ActionableNudges` Top Actionable Findings heading.
- [x] **C4 — liquid-glass on nested bias cards**: the per-bias detail cards inside OverviewTab's Bias Details card now carry `.liquid-glass` so they read as translucent children inside an opaque parent card. Page-level banners (ToxicAlertBanner, ActionableNudges) left alone since they aren't card-nested.
- [x] **C5 — Sidebar plan chip + compact UsageMeter**: extended `UsageMeter` with a `variant: 'full' | 'compact'` prop. Compact version (plan chip + N/M audits + 3px progress bar) rendered in sidebar above theme/signout. Top-bar usage meter kept. Onboarding anchor `#onborda-usage-meter` preserved on the top-bar instance.
- [x] **C7 — Command Palette new actions**: added Start a Decision Room, Report an Outcome, Open Last Analysis, and (context-aware) Export Board Report. Upload Document was already present. Export board report dispatches a `command-palette-export-board-report` window event which the document detail page listens for.
- [x] **E3 + E7 — Founder Tips**: two new GTM tips added to `FounderTipsTab` (First paying customer is the only milestone before fundraise / GTM co-founder is a 6-month recruiting project) and mirrored into `founder-context.ts` so the Founder Hub AI chat surfaces them proactively.

## Recently Completed (audit sweep, 2026-04-11)
- [x] Fixed `causal-learning.ts` — replaced stale `prisma.outcomeRecord` cast with `prisma.decisionOutcome`, fixed bias iteration to use `BiasInstance[]` array shape. This moat feature was silently broken in production.
- [x] Fixed DQI synthetic weights drift — `computeSyntheticDQI` now derives from canonical `WEIGHTS` constant (renormalised without historicalAlignment).
- [x] Added P2021/P2022 specific handling to 3 schema-drift catch blocks in `nodes.ts` (boardroomPersona, decisionPrior, decisionOutcome count).
- [x] Added rate limiting + metric whitelist + value clamping to `/api/admin/vitals` (was unauthenticated fire-and-forget).
- [x] Fixed `/api/integrations/email/inbound` to deny requests when `RESEND_WEBHOOK_SECRET` is missing in production.
- [x] Fixed Founder Hub default tab from `meeting_prep` (stale) to `overview`.
- [x] Fixed Slack HumanDecision dedup race condition — rely on `contentHash @unique` via create + P2002 catch instead of check-then-insert.
- [x] Fixed `QuickScanModal` stable keys — was using index, now uses `${type}-${i}`.
- [x] Lazy-loaded `IntegrationMarketplace` (1,715 LOC) on `/dashboard/settings/integrations`.
- [x] Migrated `RootCauseSection`, `RelatedDecisions`, `DecisionTriageWidget`, `EnhancedToast` off hardcoded `bg-white/5`, `text-white`, `border-white/10` — now use CSS variables via new utility classes (`toast-action-btn`, `related-decisions-*`) in `globals.css`.
- [x] Updated `founder-context.ts` with: raising timeline, AI infrastructure stack, engineering lessons learned, explicit "no direct competitor / real competition is 'do nothing'" framing, and scale reality (200+ components, 70+ routes, 61 models).

## Feature Ideas (Backlog)
- [ ] E3: Real-time meeting bias detection (Phase 1: prototype with simulated transcript feed) — saved in Founder Hub Tips Section 7
- [ ] WeWork S-1 excerpt as default demo document
- [ ] "Decision Score" — external-facing credit score for organizational decision quality
- [ ] Analyst certification program (revenue opportunity)
- [ ] CRM integration for auto-pulling deal outcomes (Salesforce, HubSpot)

## Recently Completed (audit sweep, 2026-04-16)
- [x] DQI docstring drift — `src/lib/scoring/dqi.ts` JSDoc said A 80+, `GRADE_THRESHOLDS` enforced 85+. Updated doc to canonical A 85+/B 70+/C 55+/D 40+/F 0+ matching CLAUDE.md + founder-context.
- [x] `ToxicCombinationCard.tsx:142` — header `text-white` on standalone surface (outside dark severity wrapper) invisible in light theme. Fixed to `var(--text-primary)`. Internals on dark severity cards left intact.
- [x] `ActivityFeed.tsx` — rendered inside platform `.card` (light surface) but titles used `text-white`, descriptions used `text-gray-400/500`, hover used `bg-white/5`. Every row was effectively invisible on Browse view of dashboard. Migrated to CSS tokens (`var(--text-primary/secondary/muted)` + JS-driven hover).
- [x] CLAUDE.md + founder-context.ts — added "Visualization Components (light-theme audit rule)" note so interior dark classes on severity cards aren't re-flagged as bugs in future sweeps. Added "DQI Grade Boundaries (locked)" block warning that both the JSDoc + constant must be updated together.

## Recently Completed (polish sweep, 2026-04-13/14)
- [x] Usage meter light-theme, `/pricing` destination, Pro-tier "Go Strategy" copy at ≥80%, paired with "THIS MONTH" caption
- [x] Funnel audit: 3 stale `/#pricing` anchors → `/pricing`, self-serve "Create a free account" link added to case-study CTA
- [x] Onboarding unified: `WelcomeModal` + `OnboardingGuide` now share `decision-intel-onboarding-completed` localStorage key; vocabulary updated to locked positioning (30+ biases, strategic memo, CEO/board/parent-company, DQI)
- [x] Mobile polish: platform padding moved to globals.css, landing hero uses `clamp(30px, 5.5vw, 48px)`, pricing comparison table wrapped in horizontal-scroll container, onboarding stepper stacks vertically ≤600px
- [x] Upload zone animated green conic-gradient halo on hover/dragover
- [x] All 5 reagraph canvases switched to white background + light-theme tokens + `shininess={90}` + `specular="#FFFFFF"` materials
- [x] Shared `src/components/visualizations/reagraph-helpers.tsx` with `SlowOrbit` (5°/sec, 1.5s start delay, 3.5s user-pause) + `ResetViewButton` (RotateCcw icon). Applied to all 5 canvases.
- [x] Hero WeWork graph expanded to 21 nodes / 34 edges (6 decisions, 10 biases, 6 outcomes + 4 toxic combos + outcome cascade chain). "SAMPLE OUTPUT" badge + explanatory copy added.
- [x] `fitNodesInView` retry chain extended to 6 attempts through 3.8s on all graphs (fixes the black-canvas failure on denser layouts)
- [x] Scroll-reveal: new `useScrollReveal` hook + `Reveal` wrapper; Four-Moments, How-It-Works, Features, and FAQ sections fade in on scroll. Respects `prefers-reduced-motion`.
- [x] `.hover-card` CSS class on CaseStudyGrid cards; content-card border-radius standardized to 16px
- [x] KG merge consent flow: schema (`TeamMember.kgMergeConsent`, `kgMergeDecidedAt`), API route, modal shipped. Background worker still stubbed — see memory `kg-merge-worker-pending.md`

## Recently Completed

- [x] TODO.md created + `.claude/settings.json` with type-check hook
- [x] Daily LinkedIn post cron (`/api/cron/daily-linkedin`) — auto-generates and emails case study posts
- [x] Legacy `EmptyState` migrated to `EnhancedEmptyState` on dashboard page
- [x] Missing `onDelete: SetNull` added to `Nudge.humanDecision` relation
- [x] Composite indexes added: `Meeting[userId, status]`, `HumanDecision[userId, createdAt]`, `JournalEntry[userId, createdAt]`
- [x] LinkedIn post generator in Content Studio
- [x] Interactive knowledge graphs on all case study pages
- [x] Decision Graph clipping fixed on landing page
- [x] Sidebar consolidation (10 items, 3 groups)
- [x] Score reveal animation with grade badge
- [x] Free tier raised to 4 analyses/month
- [x] Upgrade button fixed (fallback to /#pricing)
- [x] Settings page streamlined (6 tabs)
- [x] Decision Quality inlined into Analytics
- [x] Decision Replay with outcome reveal
- [x] Bias taxonomy published (DI-B-001 through DI-B-020)
- [x] Compliance posture page (SOC2, ISO 27001, GDPR, EU AI Act)
- [x] Slack → Decision Room auto-bridge
- [x] Outcome → DQI recalibration loop
- [x] Google Drive auto-compare with content hash detection
- [x] CLAUDE.md created with full project context + sub-agent strategy
