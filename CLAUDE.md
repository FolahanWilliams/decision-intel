# CLAUDE.md — Decision Intel

## What This Project Is

Decision Intel is a decision intelligence platform for corporate strategy teams. Users upload strategic memos, board decks, and market-entry recommendations and get a 60-second audit that scores cognitive biases, predicts steering-committee objections, and adds every decision to a living Decision Knowledge Graph that compounds over time.

**Primary buyer: Chief Strategy Officer / Head of Corporate Strategy** (signs the contract, cares about compounding edge + board-ready evidence). Secondary: M&A teams. Tertiary: BizOps/FP&A, sales forecasting. PE/VC is NOT a target audience — budgets are small, buying is relationship-driven, and funds are skeptical of unknown tools.

**Current phase: Refinement & consolidation.** The product has 200+ components and 70+ API routes — more features than most Series A companies. The priority is polishing the core flow (upload → analyze → review → track outcomes) to attract pilot users and raise pre/seed funding. Push back on scope creep. If a change doesn't make the first 60 seconds of a demo better, it probably shouldn't be the priority.

## Positioning & Vocabulary (locked 2026-04-13)

**Core value proposition:** "The Four Moments We Catch What Others Miss" — a Decision Knowledge Graph as the foundation, with (1) the Graph itself, (2) predicting CEO/steering-committee questions, (3) auditing reasoning, and (4) closing the outcome loop via DQI.

**LinkedIn content → landing page bridge:** Bias case studies on famous corporate decisions (Kodak, Blockbuster, Nokia, etc.) warm up the traffic. The landing page says: "The same lens that exposed [X] now audits your strategic memos in 60 seconds."

**Native vocabulary to use:**

- "strategic memo" (primary artifact — the analog to "investment memo")
- "board deck" (the artifact that gets presented)
- "strategic recommendation" / "market-entry recommendation"
- "steering committee" / "executive review" / "board"
- "CEO, board, or parent company" (the stakeholders)
- "Decision Knowledge Graph" (always full name)
- "Decision Quality Index" / "DQI"
- "quarter after quarter" (cadence)
- "135 historical decisions" (benchmark number — defensible; deduped 2026-04-16 from 146)
- "30+ cognitive biases" (taxonomy scope)

**Vocabulary to AVOID:**

- "thesis" (PE/VC-coded)
- "investment memo" / "IC" / "investment committee" (PE-coded)
- "LP" / "fund" (PE-coded)
- "deal" as a headline term (too M&A-narrow; use "call" or "memo")
- "M&A documents" as primary artifact (use "strategic memo" first; M&A is secondary)
- "12-node pipeline" in headline positions (too technical for CSO buyer; fine as technical detail only)

**Tone:** Calm CSO 1:1 voice with manager-level pain included. Never critique the buyer's judgment. Frame as additive rigor, not a report card. Lead with gain, not deficit. Use em dashes sparingly (one or two for emphasis); prefer commas and sentence breaks.

## Founder Context

- Solo technical founder, 16 years old, based in Nigeria
- Advised by a senior consultant who helped take Wiz from startup to $32B
- The codebase IS the company — any senior full-stack engineer can onboard in weeks
- Pre-revenue; working toward first paid design partner before raising
- Per-audit API cost on Gemini paid tier 1: **~£0.30–0.50 (~$0.40–0.65)**, not the $0.03–0.07 previously claimed. Each audit fires ~17 LLM calls across 12 nodes. Cost-tier routing (Apr 2026) moved gdprAnonymizer/structurer/intelligenceGatherer to gemini-3.1-flash-lite for 15–25% savings. Pricing tiers (2026-04-15): Free (4/mo) → **Individual $249/mo** (15 audits) → Strategy $2,499/mo (fair-use 250 audits/mo + team) → Enterprise custom (volume floor + overage). **Honest margin math (2026-04-18 pricing hygiene pass):** Individual typical ~95% ($12/mo variable), Individual heavy (Drive + Content Studio daily) 78-86%. Strategy typical (5 users × 30 audits) ~95%, Strategy heavy (10 users × 50 audits) 85-88%. Enterprise (500 users × 20 audits) compresses to ~70% without a volume floor. **Use "~90% blended" in every outward-facing material** (pitch deck, investor Q&A, cold email) — "~97%" was ghost-user math and won't survive due diligence. Flywheel costs (daily-linkedin cron ~$4.50/mo fixed, Drive polling $1-5/user, outcome detection $2-3/user) are real and per-user-variable — factor into margin calcs at scale.
- **Hidden cost sources:** `WeeklyBrief` + `ContentOpportunities` in `ContentStudioTab` are user-triggered (button click, not mount) — **verified Apr 2026**, no longer an auto-fire concern. `daily-linkedin` cron was burning budget pre-error due to email-delivery failure — **re-enabled Apr 2026** with an early-bail guard ([daily-linkedin/route.ts:40](src/app/api/cron/daily-linkedin/route.ts#L40)): if `FOUNDER_EMAIL` or `RESEND_API_KEY` is missing, the route returns `{ skipped: true }` BEFORE touching Gemini, so it can never burn budget without a working delivery path. 6 files hardcode `gemini-2.0-flash` as fallback ([gemini.ts:50](src/lib/ai/providers/gemini.ts#L50) + content routes + outcome-inference) — this is why Gemini 2 Flash shows in usage charts even though the LangGraph pipeline uses gemini-3-flash-preview. Intentional for now; content-gen routes don't need Flash 3 preview.
- Uses Claude Code multiple times daily (4-5 sessions, 1-2 hours each). Context between sessions matters a lot.
- No running bug tracker — bugs surface in conversation or via CI/CD failures.
- Does NOT run `npm run build` locally — relies on Vercel CI to catch build errors. **Claude should always run `npm run build` or at minimum `npx tsc --noEmit` before pushing significant changes.**
- Was unaware of the Gemini pre-commit hook. It may fail or be slow — use `--no-verify` if it blocks and the changes are tested.
- No pilot users yet. Actively outreaching to corporate strategy and M&A teams via advisor network. PE/VC is a secondary expansion vertical.
- Raising pre-seed/seed in the next 6 months. Needs a GTM/enterprise-sales co-founder or advisor.
- No direct competitor in "decision quality auditing" — the closest is Cloverpop (decision management, not bias detection). The real competition is "do nothing" — teams don't audit their decision processes at all.
- Current priorities: (1) land first paying customer, (2) build brand visibility via Content Studio, (3) polish demo flow.
- All features should stay — nothing should be cut, but features should be consolidated and surfaced contextually rather than via separate nav items.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **Database:** PostgreSQL (Supabase) via Prisma 7.5
- **AI:** Google Gemini (primary), Anthropic Claude (fallback via AI_FALLBACK_ENABLED)
- **Pipeline:** LangGraph 12-node sequential+parallel agent pipeline
- **UI:** Tailwind CSS 4 + shadcn/ui + Lucide icons + Framer Motion
- **Auth:** Supabase Auth (Google OAuth)
- **Payments:** Stripe (subscriptions + per-deal audit pricing)
- **DNS + inbound email:** Cloudflare. Email Routing forwards every `*@decision-intel.com` address to the founder's personal Gmail (e.g. `security@decision-intel.com` → `folahanwilliams@gmail.com`).
- **Outbound SMTP:** Resend (`smtp.resend.com:465`, username `resend`, password = a Resend API key). Used by Supabase Auth for password-reset / magic-link / confirm emails, and by any Gmail "Send mail as" identity replying from `*@decision-intel.com`. Resend's `decision-intel.com` domain is verified with SPF + DKIM records living in Cloudflare DNS — when adding new DNS, leave those untouched.
- **Deployment:** Vercel (serverless)
- **Monitoring:** Sentry + custom AuditLog + structured logging

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (Next.js)
npm run lint         # ESLint
npm run test         # Vitest (unit tests, excludes e2e/)
npx playwright test  # E2E tests
npx prisma migrate dev  # Run pending migrations
npx prisma generate  # Regenerate Prisma client
```

**Pre-commit hook:** Runs `npm run audit:ai` (Gemini architectural audit). Can be bypassed with `--no-verify` but should generally be fixed instead.

## Project Structure

```
src/
├── app/
│   ├── (marketing)/     # Public pages: landing, case-studies, taxonomy, privacy, terms
│   ├── (platform)/      # Authenticated dashboard (all under /dashboard/*)
│   │   ├── dashboard/   # 25+ page routes
│   │   └── documents/   # Document detail page with analysis tabs
│   ├── api/             # 70+ API routes
│   ├── login/           # Auth
│   └── shared/          # Public share links
├── components/          # 200+ React components
│   ├── ui/              # Core design system (shadcn + custom)
│   ├── founder-hub/     # 16 tab components for Founder Hub
│   ├── analysis/        # Analysis display components
│   ├── settings/        # IntegrationMarketplace, AuditLogInline
│   └── ...              # Domain-grouped components
├── lib/
│   ├── agents/          # LangGraph pipeline (nodes.ts, graph.ts, prompts.ts)
│   ├── ai/              # Model router + Gemini/Claude providers
│   ├── compliance/      # 7 regulatory frameworks
│   ├── scoring/         # DQI computation (dqi.ts — 792 lines)
│   ├── learning/        # Causal learning, outcome scoring, bias genome
│   ├── replay/          # Score decomposition + counterfactual engine
│   ├── integrations/    # Slack, Google Drive, email, webhooks
│   ├── constants/       # Bias taxonomy (bias-education.ts), case studies
│   └── utils/           # Logger, cache, encryption, rate-limit, etc.
├── hooks/               # 20+ custom React hooks
├── types/               # TypeScript interfaces
└── middleware.ts        # CSRF, session management
```

## Critical Conventions — READ THESE

### Styling
- **Use CSS variables with fallbacks**, not hardcoded hex colors or dark-mode Tailwind classes:
  ```tsx
  // ✅ Correct
  style={{ color: 'var(--text-primary)', background: 'var(--bg-card)' }}

  // ❌ Wrong — breaks in light theme
  className="text-white bg-white/5 border-white/10"
  ```
- Full token system defined in `src/app/globals.css` (297 lines). Key tokens:
  - Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-card`, `--bg-elevated`
  - Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-highlight`
  - Accent: `--accent-primary` (#16A34A green), `--accent-secondary`, `--accent-tertiary`
  - Severity: `--success`, `--warning`, `--error`, `--info`, `--severity-high`, `--severity-critical`
  - Borders: `--border-color`, `--border-active`, `--border-hover`, `--border-primary` (alias for `--border-color`; used by ~114 refs across Founder Hub + analytics components — must stay defined in BOTH `:root` and `.dark` blocks, otherwise those components fall through to browser default #333 in light theme)
  - Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--liquid-shadow`
  - Radius: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-full` (9999px)
- Dark mode uses `.dark` class via next-themes. Both themes are fully supported.
- Inline `style={{}}` objects are the dominant pattern (not Tailwind utilities). Follow the existing pattern.

### Database
- **Document model uses `uploadedAt`**, NOT `createdAt`, for the creation timestamp. This has caused build errors multiple times — always double-check.
- **Analysis model uses `createdAt`** (standard Prisma).
- Always handle schema drift: wrap Prisma queries in try-catch, check for P2021/P2022 error codes.
- Use `onDelete: Cascade` or `onDelete: SetNull` on all new relations — never leave onDelete unspecified.
- The `recalibratedDqi` field on Analysis is a nullable JSON field (added April 2026).
- **Prisma JSON fields need explicit casting.** When writing objects to nullable JSON columns (e.g., `biasBriefing`, `recalibratedDqi`), arrays with inferred types cause `InputJsonValue` errors. Fix: cast with `as unknown as Record<string, unknown>`.

### Security
- **Always use `safeCompare` from `@/lib/utils/safe-compare`** for secret comparisons. Never write a local implementation — a buggy duplicate was the cause of a critical auth bypass that was fixed.
- CSRF protection is in middleware.ts. Slack/Stripe/cron paths are exempt.
- Document encryption uses AES-256-GCM via `DOCUMENT_ENCRYPTION_KEY`.
- Slack tokens encrypted with `SLACK_TOKEN_ENCRYPTION_KEY`.
- **Encryption key rotation** uses a `keyVersion` stamp on every encrypted row (`Document.contentKeyVersion`, `SlackInstallation.botTokenKeyVersion`). New keys are provisioned at `DOCUMENT_ENCRYPTION_KEY_V{N}` / `SLACK_TOKEN_ENCRYPTION_KEY_V{N}`; the active version comes from `*_VERSION` env vars (defaults to highest resolvable). Rotate with `npm run rotate:encryption-key -- --domain document --from 1 --to 2` — batched, idempotent, resumable. Legacy `DOCUMENT_ENCRYPTION_KEY` (un-suffixed) is treated as v1 for back-compat. Full protocol in `src/lib/utils/encryption.ts` header.

### Components & Patterns
- Lazy-load heavy components with `dynamic()` from `next/dynamic` (see Founder Hub page for pattern).
- Use `ErrorBoundary` wrapper on all page-level components.
- Use `EnhancedEmptyState` (not legacy `EmptyState`) for empty states. Always pass `showBrief` and `briefContext` for intelligence brief integration.
- Use `AnimatedNumber` from `@/components/ui/AnimatedNumber` for animating numeric values.
- Use `createLogger('ContextName')` for structured logging in API routes and lib code.
- **Fire-and-forget error handling:** Never swallow errors with `.catch(() => {})` on fire-and-forget operations that affect delivery, audit trails, or the learning flywheel (Slack/email nudges, audit-log writes, playbook usage counters, Nudge.deliveredAt stamps, `humanDecision` status transitions, graph edge-weight adjustments). Use `.catch(err => log.warn('specific context:', err))` at minimum. Silent catches ARE still acceptable for: in-memory cache cleanup, schema-drift tolerance (when commented as such), and `req.json().catch(() => null)` body parsing.
- Standardized API responses: use `apiSuccess()` and `apiError()` from `@/lib/utils/api-response.ts`.
- **Unused imports cause build failures.** Next.js strict mode treats them as errors. Always clean up imports after refactoring (e.g., removing `Suspense, lazy` when switching to `dynamic()`).
- **Founder Hub API calls require `founderPass` prop.** Any component calling `/api/founder-hub/*` must receive and pass the `founderPass` string via props from the hub page.
- **Case study slugs:** Use `getSlugForCase()` from `src/lib/data/case-studies/slugs.ts` for URL-safe slugs. Case study URLs: `/case-studies/{slug}`.
- **Landing page hero graph:** `src/components/marketing/HeroDecisionGraph.tsx` — interactive D3-like knowledge graph. The `CaseStudyBiasGraph` at `src/components/marketing/CaseStudyBiasGraph.tsx` is the simpler radial bias web used on case study cards and detail pages.
- **Section heading utility:** use `.section-heading` (globals.css) for inline subheadings inside `.card-body` — uppercase, tracking-widest, muted. Card titles stay as `.card-header h3`.
- **Board-ready PDF export:** `src/lib/reports/board-report-generator.ts` (`BoardReportGenerator`). 2-page client-side jsPDF export (exec summary ≤500 chars, DQI card, top-3 biases, simulated CEO question, top mitigation). Wired into `ShareModal` via the optional `onExportBoardReport` prop and triggerable from the Command Palette on any `/documents/:id` page via the `command-palette-export-board-report` window event.
- **Upload bias preview:** `getBiasPreview(filename, selectedDocType)` from `@/lib/utils/bias-preview` — pure client-side regex → likely biases. Prefer `selectedDocType` over filename when present.
- **Inline post-upload reveal:** After an upload completes on `/dashboard`, the hero zone renders [InlineAnalysisResultCard](src/components/analysis/InlineAnalysisResultCard.tsx) in place of the dropzone — DQI via [ScoreReveal](src/components/ui/ScoreReveal.tsx) (1.2s suspense + grade badge), noise score chip, top-3 biases sorted by severity, and a "Deep Dive" link to `/documents/[id]`. The dashboard accumulates detected biases in `detectedBiasesRef` from the `onBiasDetected` SSE callback and stores the snapshot in `lastCompletedAnalysis` state. Dismissing the card returns to the upload zone; starting a new upload resets the refs. **Do not navigate away from the dashboard on analysis-complete** — the inline reveal IS the wow moment; navigation to `/documents/[id]` only happens when the user opts in via Deep Dive or the notification.
- **Decision Log unification:** `/dashboard/decision-log` merges Journal (from `/api/journal`) + Cognitive Audits (via `useHumanDecisions` → `/api/human-decisions`) into one page with All / Journal / Audits chip filters and a pending / completed / dismissed status segmented control. Sub-routes `/dashboard/cognitive-audits/submit`, `/[id]`, `/effectiveness` untouched. Sidebar item "Decision Log" (pathname matches `/decision-log`, `/cognitive-audits`). Legacy `/dashboard/journal`, `/dashboard/experiments`, `/dashboard/search` redirects were **deleted** (2026-04-17, route consolidation pass) — any external bookmarks pointing to them now 404. `/dashboard/decision-rooms` was converted to a redirect → `/dashboard/meetings?tab=rooms` (the canonical home for the Rooms tab).
- **Compare multi-select:** Documents browse batch action bar shows a "Compare Selected" button when 2–3 docs are picked. Navigates to `/dashboard/compare?doc=id1,id2,id3`. The compare page parses comma-separated IDs (capped at 3).
- **IntelligenceBrief metrics prop:** pass `metrics={{ pendingOutcomes, loopClosureRate }}` for per-page numbers the org-level API doesn't expose. New `'outcomes'` context used on `/dashboard/outcome-flywheel`. The `'journal'` tip now pulls calibration info when `profile.avgDecisionQuality` is available.
- **Founder Hub layout:** left vertical rail (240px desktop, stacks to full-width block on <900px) replaces the horizontal tab strip. Groups (Product / Go-to-Market / Intelligence / Tools) render as section labels. Active tab uses `border-left: 3px solid var(--accent-primary)` + `bg-elevated`. Search box + AI chat widget unchanged.
- **Founder School curriculum:** 8 tracks × variable lessons (currently 58 total) in [src/lib/data/founder-school/lessons.ts](src/lib/data/founder-school/lessons.ts). Standard lesson shape: `insight` / `whyItMatters` / `action` / `reflection`. Optional fields: `sources` (primary-source references), `csoPitch`, `mnaPitch`, `corpStrategyPitch`, `vcPitch`. All four pitch fields render as discrete buyer-persona cards in [FounderSchoolTab](src/components/founder-hub/FounderSchoolTab.tsx) via the `PitchCard` helper — CSO (green), M&A (teal), Corp Strategy (purple), VC (slate). Include a pitch on a lesson only when you have something specific and defensible to say to that buyer; omit it otherwise. The **Platform Foundations** track is the methodology-consolidation curriculum (Kahneman-Tversky, Noise, DQI components, pre-mortems, Tetlock outcome loop, 20×20 matrix, 12-node pipeline, regulatory frameworks, 135-case library) and carries `sources` + CSO/VC pitches. **Enterprise Sales** lessons 1-3 (change-management framing, champion identification, economic-buyer vs. champion) now carry all four pitches so the founder can rehearse the dual-stream positioning (Individual CSO + Team M&A/Corp Strategy, plus VC) directly from the curriculum. Header count is dynamic via `TOTAL_LESSONS`, so adding lessons can't drift the display.
- **Founder-hub server auth:** [src/lib/utils/founder-auth.ts](src/lib/utils/founder-auth.ts) `verifyFounderPass` accepts EITHER `FOUNDER_HUB_PASS` (server-only, for CI/scripts) OR `NEXT_PUBLIC_FOUNDER_HUB_PASS` (the UI credential). Previously it did `serverPass || publicPass`, which locked the UI out once the two vars diverged. The Founder Hub page sits behind Supabase platform auth, so the public var is a second factor, not a bare-internet credential.
- **Document-detail View-as toggle:** 3-way segmented control at the top of `/documents/[id]` — **Analyst** (full detail), **CSO** (condensed — exec summary + recommendation + featured counterfactual), **Board** (inline 2-page preview that mirrors the exported board report PDF). State key: `'analyst' | 'cso' | 'board'`. Legacy `'focused'` / `'full'` values from the old toggle are mapped on load (`focused → cso`, `full → analyst`). Persists via `?view=` URL param + `localStorage['di-doc-view-mode']`. Default: CSO.
- **Board view:** [BoardReportView](src/app/(platform)/documents/[id]/tabs/BoardReportView.tsx) renders the same content the jsPDF generator produces — exec summary 500c, top-3 biases 180c excerpts each, CEO question, mitigation 400c. Keep the truncation constants in sync with [board-report-generator.ts](src/lib/reports/board-report-generator.ts) when either changes.
- **CounterfactualPanel featured variant:** `<CounterfactualPanel analysisId={...} variant="featured" />` renders a hero ROI card with the single highest-impact scenario. Used above the tabs on the document detail page in every view mode. Null when no positive scenario exists, so it never shows an empty or "would make things worse" message.
- **Marketing page `/proof`:** [src/app/(marketing)/proof/page.tsx](src/app/(marketing)/proof/page.tsx) (server — metadata + Suspense) + [ProofPageClient.tsx](src/app/(marketing)/proof/ProofPageClient.tsx) (client — `?case=<slug>` state). Renders all cases with `preDecisionEvidence` populated. Two-column split: [PreDecisionDocument](src/components/marketing/proof/PreDecisionDocument.tsx) paper-style memo on left, [FlaggedAnalysisPanel](src/components/marketing/proof/FlaggedAnalysisPanel.tsx) hypothetical-DQI + numbered flags on right, [OutcomeReveal](src/components/marketing/proof/OutcomeReveal.tsx) navy strip below. Flags are numbered markers (not substring highlights) so they stay accurate across the descriptive red-flag text.
- **Marketing page `/bias-genome`:** [src/app/(marketing)/bias-genome/page.tsx](src/app/(marketing)/bias-genome/page.tsx) (server — metadata + table rendered via [BiasGenomeClient.tsx](src/app/(marketing)/bias-genome/BiasGenomeClient.tsx)). Data comes from [src/lib/data/bias-genome-seed.ts](src/lib/data/bias-genome-seed.ts) — pure synchronous `computeGenomeFromSeed()` over `ALL_CASES`. Headline rankings require n≥5; dimmed rows with ⚠ flag n<3. "Failure lift" = bias failure rate / baseline failure rate. Never fabricate numbers — every metric traces to the underlying case-study records. When real customer data flows via `/api/intelligence/bias-genome` (≥3 consenting orgs), the page should be migrated to that source.
- **Marketing page `/how-it-works`:** [src/app/(marketing)/how-it-works/page.tsx](src/app/(marketing)/how-it-works/page.tsx) (server metadata + Suspense wrapper) + [HowItWorksClient.tsx](src/app/(marketing)/how-it-works/HowItWorksClient.tsx). Content sourced from [src/lib/data/pipeline-nodes.ts](src/lib/data/pipeline-nodes.ts) — the 12-node manifest. **Content discipline**: every factual claim mirrors `FOUNDER_CONTEXT` in `src/app/api/founder-hub/founder-context.ts` — if that changes (DQI weights, node count, grade scale), update this page. **Public-safety rule**: the page never surfaces prompts, the 20×20 interaction-matrix weights, per-org causal edges, model tier routing, or API cost math — only the *what* and *why*.
- **How-It-Works viz components** live under [src/components/marketing/how-it-works/](src/components/marketing/how-it-works/). `PipelineFlowDiagram` is the centerpiece (12-node SVG with zone-cycling highlight); `PipelineMiniatureViz` is the hero compact version; `DqiComponentBars` renders the 6 weighted bars + A–F grade scale; `NoiseDistributionViz` shows two bell-curve panels (low vs high noise); `BoardroomSimViz` shows 5 role-primed personas with vote chips; `PipelineNodeDetail` is the drawer that opens when any node is clicked. All pure SVG + Framer Motion. All respect `prefers-reduced-motion`. `PipelineLandingTeaser` (compact horizontal pipeline) + `OutcomeDetectionViz` (outcome-loop schematic, intentionally abstract — no fabricated numbers) are embedded on the landing page's "How It Works" section.
- **Marketing page `/privacy`:** [src/app/(marketing)/privacy/page.tsx](src/app/(marketing)/privacy/page.tsx) (server — metadata + static JSX) + [DataLifecycleViz](src/components/marketing/privacy/DataLifecycleViz.tsx) (client — animated 4-stage flow in the hero). Refactored April 2026 from a legal-only stub into a full marketing+legal page matching `/how-it-works` polish. Structure: Hero → Trust stack (5 guarantees) → Lifecycle (4 steps, "anonymization" highlighted) → What we collect (4 cards) → What we never do (red prohibition panel) → GDPR rights (5 cards) → Processors → Retention/Cookies/Changes/Contact. Any change to the security posture (encryption, retention window, processor list) must be reflected here.
- **Landing-page credibility trio:** [src/components/marketing/CredibilityTrio.tsx](src/components/marketing/CredibilityTrio.tsx) — the component still exists but is no longer rendered on the landing page (removed in the 2026-04-19 category-creator refactor). The three sub-pages it linked to (`/proof`, `/bias-genome`, `/privacy`) are now reached via the nav and footer instead. Keep the component until you're sure no one needs the thumbnails elsewhere.
- **Landing-page positioning lock (2026-04-19 refactor):** the landing page `/` has a locked 7-section IA: (1) Hero with [HeroCounterfactualTease](src/components/marketing/HeroCounterfactualTease.tsx) + [HeroDecisionGraph](src/components/marketing/HeroDecisionGraph.tsx), (2) compliance trust strip (no logos until a real pilot lands), (3) Four Moments rewritten gain-leading with moat eyebrows, (4) "What we replace" before/after panel, (5) reframed [CategoryGapShowcase](src/components/marketing/CategoryGapShowcase.tsx) as "the category we're defining" (four pillars: quality + governance + scalability + reliability), (6) Proof section (`/proof` + `/bias-genome` CTAs + [CaseStudyCarousel](src/components/marketing/CaseStudyCarousel.tsx)), (7) Pricing, (8) FAQ + CompetitorComparison, (9) final CTA + newsletter. **Do not re-add Stats bar, CredibilityTrio row, PipelineLandingTeaser, OutcomeDetectionViz, Features cards, or mid-page BookDemoCTA** — they were removed deliberately. Hero H1 ("The human-AI governance system for strategic decisions.") and subhead are the category thesis; treat them as canon, don't drift. All `agent` / `LangGraph` / `12-node` / `3 independent AI judges` language is banned from the landing surface; those details live on `/how-it-works` only.
- **`/demo` paste-first flow (2026-04-19):** the `/demo` page leads with [PasteAuditResults](src/components/marketing/demo/PasteAuditResults.tsx) flow — visitor pastes a memo, clicks "Run the audit", and the REAL 12-node pipeline runs via [/api/demo/run](src/app/api/demo/run/route.ts). Sample picker (Kodak/Blockbuster/Nokia) and video tour are both demoted below the paste hero. The old `scanForBiases()` regex path + the in-file `QuickScanResults` component were deleted in the refactor — if you need a fallback, use the real endpoint with a disabled flag rather than reintroducing a regex stub.

### Visualization Components (light-theme audit rule)
- Visualization cards (`ToxicCombinationCard`, `RiskHeatMap`, `GraphDetailPanel`, `DecisionTimeline`, `StakeholderMap`) keep dark-theme Tailwind classes **inside** their colored severity wrappers (`bg-red-950/40`, `bg-amber-950/20`) — that is correct, the interior is dark.
- The audit rule: check only the **outermost** heading and elements that sit directly on the page surface. Any `text-white` on a standalone heading outside a dark wrapper is a bug. Interiors on red/amber/yellow severity cards can stay dark.
- Same rule for `ActivityFeed` — rendered inside a platform `.card` (light), so its row content uses `var(--text-primary/secondary/muted)`, not `text-white` or `text-gray-400`.

### DQI Grade Boundaries (locked)
- Canonical grade scale: A 85+, B 70+, C 55+, D 40+, F 0+ — matches `src/lib/scoring/dqi.ts` → `GRADE_THRESHOLDS`.
- The JSDoc at the top of `dqi.ts` is the external reference. **Update both** the comment AND `GRADE_THRESHOLDS` when changing boundaries, or the published contract drifts from runtime.

### Bias Taxonomy
- 20 biases with stable taxonomy IDs: DI-B-001 through DI-B-020 (defined in `src/lib/constants/bias-education.ts`).
- These IDs are permanent and published at `/taxonomy`. Never renumber or reassign them.
- Biases are referenced by snake_case string keys (e.g., `confirmation_bias`, `anchoring_bias`).

### Plan Limits & Billing
- Free tier: 4 analyses/month (defined in `src/lib/stripe.ts` → `PLANS.free.analysesPerMonth`)
- Limit enforced by `checkAnalysisLimit()` in `src/lib/utils/plan-limits.ts`
- Stripe price IDs may not be configured yet. Upgrade buttons must fall back gracefully to `/#pricing` when `PLANS.pro.priceId` is empty.
- **Admin full-access bypass.** Supabase user IDs listed in `ADMIN_USER_IDS` (Vercel env var, comma-separated) resolve to the `enterprise` plan in `getUserPlan()` / `getOrgPlan()` / `/api/billing` — no Stripe subscription needed. Intended for founder dogfooding and end-to-end testing. Bootstrap: set `ADMIN_EMAILS` first, deploy, visit `/api/admin/whoami` to discover your Supabase UUID, then paste into `ADMIN_USER_IDS` and redeploy. Helper: `isAdminUserId(userId)` in `src/lib/utils/admin.ts`.

### Integrations
- **Slack:** 7 slash commands, thread monitoring, auto-creates CopilotSession + DecisionRoom after audits. Handler in `src/app/api/integrations/slack/events/route.ts`.
- **Google Drive:** OAuth + Changes API polling via cron. Dedup by `sourceRef` (Google file ID). Detects updated files by content hash comparison. 24h cooldown between re-analyses.
- **Email:** Unique address per user (`analyze+{token}@in.decision-intel.com`). Token-based auth.

## When to Push Back

Claude should push back on requests that:
1. **Add new top-level routes** — the sidebar already has 10 items and 25+ dashboard routes. Consolidate instead.
2. **Add features before the core flow is polished** — upload → analyze → review → track outcomes is the only flow that matters for pilot users.
3. **Skip error handling or schema drift protection** — every Prisma query in an API route needs a try-catch with P2021/P2022 fallback.
4. **Use hardcoded dark-mode colors** — always use CSS variables.
5. **Create duplicate utility functions** — check `src/lib/utils/` first. Especially `safe-compare.ts`, `cache.ts`, `rate-limit.ts`, `encryption.ts`.
6. **Make changes that break the build without testing** — run `npx tsc --noEmit` after significant changes.
7. **Add scope beyond what was asked** — the founder is in refinement phase. Don't add docstrings, comments, or refactoring that wasn't requested.

## When to Ask Questions

Claude should ask the founder before:
1. **Creating new database models or fields** — schema changes require migrations and affect production.
2. **Modifying the analysis pipeline** (`src/lib/agents/`) — this is the core product. Even small changes can affect DQI scores across all users.
3. **Changing pricing, plan limits, or billing logic** — revenue-sensitive.
4. **Deleting any route or component** — may have external links, bookmarks, or Slack deep links pointing to it.
5. **Making changes visible to end users** (copy, labels, flow changes) — the founder has specific positioning and language preferences.

## Session Workflow

Claude Code sessions should follow this pattern for best results:

0. **Read TODO.md first.** Check `TODO.md` at the start of every session for known bugs, active priorities, and pending tasks. Update it as tasks are completed or new issues are discovered.
1. **Start small.** One focused task per session beats a mega-batch across 20 files. Context quality degrades past ~15 file modifications.
2. **Build-check before pushing.** Always run `npx tsc --noEmit` (fast, type-errors only) or `npm run build` (full build) before committing. The founder doesn't run builds locally — Claude IS the local build check.
3. **Commit after each logical unit.** Don't batch 12 changes into one commit. Ship fix → commit → next fix → commit.
4. **Don't rediscover — read CLAUDE.md.** The conventions here (CSS variables, `uploadedAt` not `createdAt`, `safeCompare` import) have all been learned the hard way.
5. **Pre-commit hook note:** There is a Gemini AI audit hook in `.husky/pre-commit` that runs `npm run audit:ai`. It can be slow. If it blocks and the changes are reviewed, use `--no-verify`.
6. **Keep CLAUDE.md current — proactively, not at session end.** Whenever a change introduces a new convention, renames a field, adds a critical file, changes a workflow pattern, or discovers a gotcha that cost time — update CLAUDE.md **in the same commit** as that change. Don't wait until the session ends. Don't ask permission. Just include the CLAUDE.md edit alongside the code change. Examples: adding a new Prisma field → update the Database section. Creating a new shared utility → add it to Key Files. Discovering a build error caused by a naming convention → add it to Critical Conventions. The goal is that the next session (which has zero memory of this one) starts with every lesson already learned.

## Sub-Agent Strategy

Use the right model for the right job. Never use Opus for tasks Haiku can handle.

**Exploration (Haiku, 3 in parallel):**
Use Haiku sub-agents for all read-only codebase exploration — file reading, grep searches, structure mapping, "find all places X is used" pattern analysis. Haiku reads files and reports back just as accurately as Opus. Launch up to 3 in parallel for maximum speed. Always specify `model: "haiku"` and `subagent_type: "Explore"` for these.

**Planning (Opus, main thread):**
Do implementation planning in the main conversation thread, not in sub-agents. The main thread has the full conversation context, user intent, and prior decisions. Delegating planning to a sub-agent loses this context and produces generic results. The one exception: use a Plan sub-agent (Opus) for very complex multi-file architectural decisions where a fresh perspective helps.

**Implementation (Opus, main thread, direct edits):**
Never delegate code implementation to sub-agents. Always edit files directly in the main thread. The main thread has the conversation history, knows what was tried, and can make judgment calls. Sub-agents writing code produce lower-quality output because they lack this context.

**Verification (Sonnet or direct Bash):**
For mechanical checks — type-checking, test runs, build verification, counting occurrences — use direct Bash commands (preferred) or Sonnet sub-agents if parallel checking is needed. These tasks don't need Opus-level reasoning.

## Key Files Quick Reference

| Purpose | File |
|---------|------|
| Plan definitions & limits | `src/lib/stripe.ts` |
| Plan limit enforcement | `src/lib/utils/plan-limits.ts` |
| DQI scoring engine | `src/lib/scoring/dqi.ts` (792 lines) |
| Brier scoring (outcome calibration) | `src/lib/learning/brier-scoring.ts` (+ `.test.ts`, 20 tests) |
| Encryption + key rotation | `src/lib/utils/encryption.ts` |
| Analysis pipeline graph | `src/lib/agents/graph.ts` |
| Pipeline node implementations | `src/lib/agents/nodes.ts` (2,297 lines) |
| Pipeline prompts | `src/lib/agents/prompts.ts` |
| Bias taxonomy & education | `src/lib/constants/bias-education.ts` |
| Founder Hub AI context | `src/app/api/founder-hub/founder-context.ts` |
| CSS design tokens | `src/app/globals.css` |
| Sidebar navigation | `src/components/ui/Sidebar.tsx` |
| Command palette | `src/components/ui/CommandPalette.tsx` |
| Platform layout | `src/app/(platform)/layout.tsx` |
| Prisma schema | `prisma/schema.prisma` (1,487 lines, 61 models) |
| Middleware (CSRF, sessions) | `src/middleware.ts` |
| Document detail page | `src/app/(platform)/documents/[id]/page.tsx` |
| Settings page | `src/app/(platform)/dashboard/settings/SettingsForm.tsx` |
| Analytics page | `src/app/(platform)/dashboard/analytics/page.tsx` |
| Admin audit-log UI | `src/components/admin/AdminAuditLog.tsx` (+ `/api/admin/audit-log` + `/api/admin/audit-log/facets`) |
| `/security` marketing page | `src/app/(marketing)/security/page.tsx` (+ `EncryptionFlowViz`) |
| Landing-page category showcase | `src/components/marketing/CategoryGapShowcase.tsx` |
| Landing hero what-if chip | `src/components/marketing/HeroCounterfactualTease.tsx` |
| Demo paste-flow wow-sequence | `src/components/marketing/demo/PasteAuditResults.tsx` |
| Demo real-pipeline endpoint | `src/app/api/demo/run/route.ts` (requires `DEMO_USER_ID` env) |
| Booking CTA component | `src/components/marketing/BookDemoCTA.tsx` (3 variants) |

## Environment Variables

Required for development: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_API_KEY`.

Optional: `FOUNDER_EMAIL` (for daily LinkedIn post emails via `/api/cron/daily-linkedin`).

Conversion / admin: `NEXT_PUBLIC_DEMO_BOOKING_URL` (Calendly link the `BookDemoCTA` component points at; falls back to `/pricing#design-partner` if unset). `ADMIN_USER_IDS` and `ADMIN_EMAILS` gate the admin surfaces (`/dashboard/admin/audit-log`, `/dashboard/admin/monitoring`) and the enterprise-plan bypass.

Encryption + key rotation: `DOCUMENT_ENCRYPTION_KEY` and `SLACK_TOKEN_ENCRYPTION_KEY` (legacy / v1). When rotating, add `DOCUMENT_ENCRYPTION_KEY_V{N}` / `SLACK_TOKEN_ENCRYPTION_KEY_V{N}` and bump `DOCUMENT_ENCRYPTION_KEY_VERSION` / `SLACK_TOKEN_ENCRYPTION_KEY_VERSION` to the new active version. See `src/lib/utils/encryption.ts` header for the full protocol; rotate with `npm run rotate:encryption-key`.

Public demo: `DEMO_USER_ID` — deterministic UUID used as the Document owner for anonymous audits via `/api/demo/run`. MUST also be added to `ADMIN_USER_IDS` so the plan check resolves to enterprise. Rate limits: 1 audit / IP / 24h + 50 audits / day global (~$20/day ceiling). Leave unset to disable the demo endpoint; the UI surfaces a "temporarily unavailable" message.

See `.env.example` for the full list with descriptions.

## Git Workflow

- Branch naming: `feature/...`, `fix/...`, `audit/...`
- Commit style: conventional commits (`feat:`, `fix:`, `refactor:`)
- **Always rebase onto main before pushing:** `git fetch origin main && git rebase origin/main` before every push. This keeps history linear and PRs clean. Never push without rebasing first.
- Pre-commit hook runs AI audit (can be slow). Use `--no-verify` only when confident.
- Push with `-u origin <branch>` for new branches.
- CI/CD: GitHub Actions (`.github/workflows/ci-cd.yml`)

## MCP Tools: code-review-graph

This repo has a knowledge graph (~5K nodes / ~39K edges, embeddings built). **Always use the graph before Grep/Glob/Read for code exploration** — faster, cheaper, and returns callers/dependents/test coverage. Graph auto-updates on file changes via the PostToolUse hook. Tool cheatsheet + workflow live in `~/.claude/CLAUDE.md` → "Codebase Awareness".

**Project-specific cautions:**

- `get_architecture_overview` returns ~1.7MB on this repo — it exceeds the tool-result cap and dumps to a file. Start with `list_graph_stats` + `list_communities`; only call the overview if you truly need the full community map, and summarize it via an isolated Agent.
- `query_graph` / `semantic_search_nodes` — always pass `detail_level: "minimal"` and an explicit `limit`.
- General rule for any MCP tool: start with stats/summary, then drill down.
