# TODO — Decision Intel

Claude reads this file at the start of every session. Update it as tasks are completed or new ones are discovered.

## Active Priorities
- [ ] Land first paying design partner (outreach via advisor network)
- [ ] Post 1 case study per day on LinkedIn (use Content Studio → Generate LinkedIn Post, or wait for daily email from `/api/cron/daily-linkedin`)
- [x] Polish the first 60 seconds of the demo (upload → pipeline animation → score reveal)
- [ ] Set `FOUNDER_EMAIL` env var on Vercel to activate daily LinkedIn post emails
- [ ] Pre-seed/seed fundraise: target first paying design partner + 2-3 reference logos before kickoff
- [ ] Find GTM / enterprise-sales co-founder or advisor

## Known Bugs
- [ ] Decision Graph on `/dashboard/decision-graph` — verify D3 rendering works correctly after recent layout changes
- [ ] Test Outcome Gate flow end-to-end (submit outcome → recalibrated DQI appears on analysis detail page)
- [ ] Verify Google Drive auto-compare works with updated files (24h cooldown + content hash comparison)
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
