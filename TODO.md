# TODO — Decision Intel

Claude reads this file at the start of every session via the `@TODO.md` auto-include at the bottom of CLAUDE.md. Update it as tasks complete or new ones surface. **Discipline**: keep "Recently Completed" capped at ~7 days; older entries belong in git log, not here. Long-form ship-log prose belongs in `docs/CLAUDE-archive-2026-Q2.md`, not here.

## Active Priorities

- [ ] Land first paying design partner (outreach via advisor network)
- [ ] Post 1 case study per day on LinkedIn (use Content Studio → Generate LinkedIn Post, or wait for daily email from `/api/cron/daily-linkedin`)
- [ ] Pre-seed/seed fundraise: target first paying design partner + 2-3 reference logos before kickoff
- [ ] Find GTM / enterprise-sales co-founder or advisor
- [ ] **Founder-side: add "Recognition-Rigor Framework · Decision Intel" tagline under your Gmail signature** (small italic, below your name). Every email reply then carries the vocabulary. Vocabulary ownership by usage is the current trademark strategy.
- [ ] **Founder-side: rewrite slide 2 of the pitch deck as lineage, not list.** Current moat slide names six phrases: Four Moments · R²F · DPR · DQI · Bias Genome · Causal Learning. Investors hear "feature list." Rewrite as architecture: _"R²F is the pipeline → DPR is the signed artifact → DQI is the score → Bias Genome is the cross-org dataset → Causal Learning is how the DQI gets sharper over time."_ Each claim inherits from the last; investors hear architecture instead of features.
- [ ] **Founder-side: reuse the R²F "anatomy of a call" pentagon on pitch deck + LinkedIn.** Component lives at [src/components/marketing/AnatomyOfACallGraph.tsx](src/components/marketing/AnatomyOfACallGraph.tsx) and already renders on the landing overlay + /how-it-works. Pitch deck slide 2: screenshot at 2x pixel density, drop into the deck. LinkedIn static carousel: render `stage` 1→5 across 5 slides + 1 hero, caption each with the capability's `full` name. One visual, five surfaces, one brand moment.
- [ ] **Founder-decision: strip the dead `.dark` CSS layer (~800+ LOC in globals.css, scoped `.dark` overrides across ~30 components).** Light-theme-only is locked 2026-04-23. Keeping `.dark` costs near zero maintenance; stripping it buys a cleaner codebase but risks days of regression surface on a product with no pilot users to catch edge cases. **Do not rush** — revisit when (a) pre-seed closes and engineering bandwidth frees up, OR (b) a design partner explicitly asks for dark mode. Currently NOT shipping; listed here so context survives the freeze.

## Deferred Follow-ups

### Awaiting founder decision

- [ ] **Founder Hub tab navigation discoverability.** All 28 founder-hub tabs are reachable only via AI-chat dispatched events, not a direct UI rail. Sales Toolkit, Competitive Positioning, LRQA brief, Three Gaps Differentiator, Unicorn Roadmap — all production-ready, all hidden. Decision: either (a) add a collapsible left-rail tab list to `/dashboard/founder-hub/page.tsx` that renders each tab as a lazy-loaded panel, OR (b) keep the chat-only model and beef up chat suggestions ("Want to see your Sales Toolkit?").
- [ ] **CopilotChat + ResolveDecisionModal dark-theming verdict** — both components use `bg-zinc-900 / text-zinc-300` styling on a light-only platform per CLAUDE.md "locked light-theme-only 2026-04-23." Either (a) the chat surface is intentionally dark for contrast (Discord/Slack/Linear pattern), in which case document the exception in CLAUDE.md, OR (b) it's drift, in which case migrate to `var(--bg-card)` + `var(--text-primary)`.
- [ ] **Pricing Enterprise quote builder promotion** — `/pricing/quote` IS linked from the Enterprise card but as a small slate500 secondary text under the primary "Talk to the founder" CTA. Promote to a sibling CTA (two equal-weight buttons) so a procurement-led prospect who wants to self-serve a quote sees the path immediately? Or does self-serve quoting weaken the founder-conversation moat?

### Content + voice

- [ ] **Em-dash discipline sweep on marketing copy.** Em-dash count: landing 28, /security 14, /pricing + /privacy 11 each, /about 5. CLAUDE.md caps at 1 per page. Content-voice work, not a runtime bug. One sitting where the founder rewrites each marketing page replacing em dashes with commas / periods / parentheticals. Approx 1 hour total.
- [ ] **Two new specimen DPRs for ICP expansion.** Current: WeWork (US/global) + Dangote (Pan-African). Recommended next: (a) **TikTok Shop India market entry** — covers FEMA, MeitY tech policy velocity, sectoral caps; warms India PE + SG/India tech corp dev. (b) **Sub-Saharan bank digital-wallet acquisition** (KCB / Equity / I&M cross-border consolidation under CMA Kenya + CBK + AML/CFT) — warms African banking M&A advisors. Generated via `scripts/generate-legal-pdfs.mjs`. ~1 week each.

### Discoverability + UX

- [ ] **/demo unauth save-to-account hook timing** — when an unauth visitor pastes a memo and the audit completes, the conversion CTA sits below the fold. The actual conversion moment is the moment the visitor SEES their DQI grade — that's where the "Save this audit · 2 clicks · no card" chip should render, anchored to the ScoreReveal card itself.
- [ ] **Pre-filled "Compare Selected" hint on Documents browse** — when 2-3 docs are picked the "Compare Selected" button appears, but the empty-state of Documents browse doesn't surface that comparison-of-versions IS one of the moat features. Small "Pick 2-3 memos to compare" tooltip in the table header column.
- [ ] **Onboarding role enum cascade audit** — the 2026-04-25 pe_vc addition touched 8+ files. Worth one ~30min sweep: `rg -nP "Role\\s*=\\s*'(cso|ma|bizops|other)'" src/` and verify each call-site has been extended for pe_vc.
- [ ] **/security hero count derivation audit** — the hero subhead at `/security` reads "17 frameworks." Verify all sites that render a framework count derive from `getAllRegisteredFrameworks().length` (lines 463, 927, 999 in security/page.tsx already do; the hero subhead `<p>` should too).
- [ ] **MarketingNav + MeetingsLogTab style-block consolidation.** `MarketingNav.tsx` has 3 `<style>` blocks; `MeetingsLogTab.tsx` has 2. CLAUDE.md mobile-style discipline says one scoped block at component bottom is canonical. Mechanical refactor; ~30 min each.

### Larger builds (multi-day)

- [ ] **Chrome extension Google Docs right-rail.** When a user has a Google Doc open, persistent right-rail shows live DQI updates as they type (debounced 5s, only audits changed passages). Reuses `/api/passages/re-audit`. Scope: modify [extension/](extension/) to (a) detect Google Docs URLs, (b) extract editable text from the Docs DOM periodically, (c) post changed passages, (d) render a collapsible DQI chip in an iframe'd right-rail. Multi-day build (Google Docs' DOM is complex; extension-context auth is non-trivial).
- [ ] **Pre-commitment Decision Room weakest-claims UI.** The `decisionType: 'pre_commitment'` convention + entry point are shipped. Still missing: a dedicated room view that shows ONLY the analysis excerpts corresponding to the lowest-scoring DQI components, with invited teammates asked to attack them. Scope: compute bottom-2 DQI components from `Analysis.overallScore` breakdown, filter `biases` to just those tied to those components, render `PreCommitmentRoomView` with red-team framing. ~300 LOC.
- [ ] **HumanDecision lookup by analysisId.** The PhaseDuringPanel on `/documents/[id]?phase=during` currently always renders the "log a decision" stub. To surface the linked HumanDecision when one exists, `/api/human-decisions` needs to accept an `analysisId` or `documentId` query param.
- [ ] **Passage-level audit paid tier.** `/api/passages/re-audit` is currently free with a 20/hr user rate limit. Once Stripe product config is in place, gate beyond N passage audits/month behind the Strategy tier.
- [ ] **Simulate-CEO $29 one-off paywall.** The endpoint shipped 2026-04-23 is free with a 3/day/IP rate limit. Wire a Stripe one-off product + redirect flow so the 4th simulation per IP goes through checkout instead of rate-limiting out. LinkedIn-viral artifact — "I paid $29 to find out what my CEO would ask" — only works with actual $29 friction.

## Technical Debt

- [ ] Marketing pages use hardcoded color constants (`C.navy`, `C.green`) — this is intentional (light-theme-only pages), NOT a bug. Do not convert to CSS variables.
- [x] ~~`riskScorerNode` refactor into composable sub-functions~~ — SHIPPED 2026-05-20. Pure-math helpers + async loaders + Bayesian wrapper extracted to `src/lib/scoring/risk-compiler.ts` (28 unit tests). `riskScorerNode` is now a thin ~70-line orchestration shell. Score-neutral (held-out dqi-distribution-check byte-identical).
- [ ] **Dashboard three-view full refactor (B6-full)** — `src/app/(platform)/dashboard/page.tsx` is 2,200+ LOC with Upload (670 LOC, ~25 state deps) and Browse (440 LOC, ~15 state deps) views inlined. B6-lite (2026-04-15) extracted Analytics + wired `?view=` URL sync; still TODO: extract UploadView + BrowseView into `_views/` with either prop-drilling or a new DashboardContext. Dedicated 2-3h session; regression surface on the most-used page is high.
- [ ] **Design-system polish — remaining pages** — Phase 1-4 of the app-wide unification shipped 2026-04-15. Still TODO: page-level polish for Decision Journal, Playbooks, Settings, Team, Decision Rooms, Cognitive Audits, Outcome Flywheel, Decision Quality, Experiments, Meetings. Each needs: (a) audit of hardcoded off-palette hex/rgba accents, (b) page header aligned to the shared `.page-header` rhythm, (c) consistent widget stack rhythm via `mb-lg` wrappers. ~1.5-2h per page. Skip unless the page is on a demo path.

## Known Bugs

(none currently open — see git log for the running cleanup history)

## Feature Ideas (Backlog)

- [ ] Real-time meeting bias detection (Phase 1: prototype with simulated transcript feed) — saved in Founder Hub Tips Section 7
- [ ] WeWork S-1 excerpt as default demo document
- [ ] "Decision Score" — external-facing credit score for organizational decision quality
- [ ] Analyst certification program (revenue opportunity)
- [ ] CRM integration for auto-pulling deal outcomes (Salesforce, HubSpot)

## Recently Completed (2026-05-23)

**Retroactive audit mode — Adaptation #1, the Sankore-killer (founder-approved boil-the-ocean ship 2026-05-21; full prose in CLAUDE.md "Retroactive audit mode — Adaptation #1 lock 2026-05-21").**

- [x] Schema: additive Prisma migration `20260521120000_retroactive_audit_mode` adds `DecisionContainer.isRetroactive Boolean @default(false)` + `retroactiveMetadata Json?` + sparse index. Schema-drift-tolerant — pre-2026-05-21 rows default false + behave as forward containers.
- [x] Pure helpers: outcomeExtractor (12+ regex outcome patterns + METRIC_PATTERNS for IRR/MOIC/synergy/exit/write-down/fund-return/time-to-exit; verbatim-quote validation; `detectDocumentRole` classifier), entityExtractor (org/amount/codename regex + inferDocumentDate ranked ISO > month-year > quarter > bare-year), bulkPairing (confidence = 0.5×entity + 0.25×temporal + 0.25×content; greedy stable matching; mixed-role docs self-pair at 0.9). 49 vitest cases pass.
- [x] APIs: `/api/retroactive/extract-outcome` (Tier 1 regex always; Tier 2 deepseek-v4-flash via Vercel AI Gateway with verbatim-quote validation; Tier 1 verdict locked when confidence ≥0.6) + `/api/retroactive/bulk-upload` (multipart, 30 files / 50MB / 5 bulks/hr/user / 60s timeout; per-file parseFile → detectDocumentRole → extractEntities → inferDocumentDate → encrypted Document.create → pairBulkDocuments).
- [x] Container API extension: `/api/containers` POST accepts `isRetroactive` + `retroactiveMetadata` + `outcomeOnCreate`; integrity gate enforces metadata + summary; auto-creates `DecisionContainerOutcome` row in same flow; stamps historical `decidedAt`; recomputes container metrics on day one. New audit-log actions `CONTAINER_RETROACTIVE_CREATED` + `CONTAINER_RETROACTIVE_BULK_UPLOAD`.
- [x] UI (3-step wizard at `/dashboard/decisions/retroactive`): `BulkUploadDropzone` (drag-and-drop with caps mirrored from server) + `RetroactivePairingReview` (4 confidence bands with expandable signals + dismiss/create per pair) + `RetroactiveContainerForm` (modal with kind picker + dynamic metric fields from `mode.outcomeShape.fields` + outcomeDraft pre-fill).
- [x] Discoverability: "Backfill historical" sibling button on `/dashboard/decisions` header + CommandPalette `decisions-retroactive` entry + SankoreBrief `FiveAdaptations` live-route CTA via new optional `ProductAdaptation.liveRoute` field. Adaptation #1 status flipped `in-progress` → `shipped`.
- [x] Gates green: tsc clean · 1259/1259 vitest · 4 lints clean (positioning + silent-catches 195→198 +3 canonical body-parse class · counts 73 · canonical-imports) · prettier clean · slop-scan under 4.0 trip-wire.

**"No 90-day wait" property locked**: outcome row is created at container-create time, so when the memo is then attached + audited, the existing `/api/analyze/stream` recalibration trigger reads the outcome row + grounds recalibration against KNOWN reality. Vector 1 (operational-proxy calibration loop, shipped 2026-05-17) closes on day one for historical decisions — the proxy IS the outcome and it's already settled.

## Recently Completed (2026-05-20)

**Universal Audit Deliverable — McKinsey-grade interactive format across /demo + /documents/[id]** (founder-approved "boil the ocean" build after the Deep Research synthesis + NotebookLM master-KB query). Replaces the text-heavy stacked sections on /demo with a Pyramid-Principle / SCQA / MECE-bucket interactive deliverable: 5 buckets (reasoning risks → stress test → historical analogs → counterfactuals → provenance), each led by an action-titled headline and rendered through 8 universal components (ActionTitle, ValueSuppressingPalette, FindingCard, ProgressiveDrawer, ComparativeMatrix, ScenarioSlider, SourceLink, AccordionReasoning). Action titles are LLM-augmented via deepseek-v4-flash through Vercel AI Gateway (`/api/audit/action-titles`) with strict word-cap / digit / banned-vocab / count-drift validation + deterministic template fallback that ALWAYS produces a valid title. /documents/[id] gets the Executive view (deliverable) as default + Analyst view toggle preserving the legacy 5-tab layout — same underlying AnalysisResult feeds both. Optional ticket-size input on /demo turns abstract DQI-lift into honest per-finding exposure (`ticket × historical_base_rate_of_pattern`, no fabricated $). 27 vitest cases lock the composer + validator + value-at-stake math. Banned per Quantellia Trap: dense network graphs replaced with modular grids + side-drawer drill-down; per Choice Paradox: /demo uses a single primary CTA ("Audit your next memo with the team"). Forward-looking rule: when a new analysis-result field needs presentation, extend the composer in `buildAuditDeliverable.ts` to map it into the appropriate MECE bucket — never add a 6th bucket without re-validating the MECE invariant + extending action-title templates + validation in lockstep. Both views share the same component library; new universal primitives go under `src/components/deliverable/`.

`riskScorerNode` refactor — closes the canonical CLAUDE.md / TODO technical-debt item ("hard to test and debug today"). The ~370-line inline node was split into a new pure-math + Prisma-orchestration module at [src/lib/scoring/risk-compiler.ts](src/lib/scoring/risk-compiler.ts) with 28 vitest assertions ([risk-compiler.test.ts](src/lib/scoring/risk-compiler.test.ts)) locking the extracted helpers' math + clamp/round ordering + default-value semantics. `riskScorerNode` itself is now a ~70-line orchestration shell that pulls helpers via dynamic import. Score-neutral by design — held-out dqi-distribution-check byte-identical pre/post refactor (only timestamps differ), 170/170 scoring + agents tests pass. Calibration helpers (`buildCalibrationHeadline`, `buildCalibrationInsight`, `CALIBRATION_UNLOCK`) moved to the new module so the pipeline produces depth across 7 surfaces without a 1,200-line monolith. Forward-looking rule: when a future audit needs a riskScorerNode tweak, edit the pure helpers in `risk-compiler.ts` + extend the unit suite in lockstep; the orchestration shell composes them in a fixed 8-step sequence (severity weights → causal multipliers → compound deductions → Bayesian → pure penalties → feedback → compose → calibration), never reorder without a regression plan + a fresh dqi-distribution-check parity run.

**Deferred (founder decision):** Audit 1 #4 speculative pipeline execution (`gdprAnonymizer → [structurer, intelligenceGatherer] → 8 parallel` instead of `gdprAnonymizer → structurer → intelligenceGatherer → 8 parallel`). The refactor is score-neutral by `dqi-distribution-check` (synthetic memos through `computeDQI`), but a graph-topology change moves `intelligenceNode`'s LLM extraction from post-structurer text to post-anonymizer-but-pre-structurer text — a real behavioral change in LLM input that can't be validated by the synthetic check. Per the founder-gate on pipeline changes + META rule #8 (verify behavior, not structure), shipping that without held-out parity is a coin-flip. The ~4-8s /demo speedup is real but the DQI-drift risk isn't worth absorbing silently. Surface as a separate founder-routed decision when a real held-out parity run is feasible.

## Recently Completed (2026-05-19)

Meta Judge P0 + demo-hardening sweep (commits `2e570aa8` + `55420f24`): grounded+JSON-mime 400 on gemini-2.5-pro killed the metaJudge on every audit (masked by the 200+fallback) — fixed scoped, grep-verified zero-DQI. Plus scholar dead-time 25s→6s + retry-storm 3→1 + grounded+JSON-mime observability guard.

Onboarding access amendment (founder-directed, "boil the ocean") — full prose in CLAUDE.md "WelcomeModal v3.5 HXC-first merge → AMENDMENT 2026-05-19". `Other`/non-wedge sign-ups NO LONGER waitlisted: they get FULL platform access + a real generic-overview value-prop, via the SAME completion flow as HXC personas. `WelcomeModal` + legacy `Phase1PersonaModal` collapsed (deleted `handleOtherSubmit` / `other_thanks` step / `step` machine). `hxcEligible:false` tag UNCHANGED (cohort discriminator preserving Vohra ≥40%-HXC graduation integrity — access ≠ cohort; the strategy/wedge/Vohra gate are all unchanged). Lockstep cascade: icp.ts + onboarding-route comment + founder-context.ts (5 chat-coaching clauses) + CLAUDE.md (4 clause fixes + dated amendment) + audit-platform comment. No migration (plumbing was already correct). tsc clean.

## Recently Completed (2026-05-18)

Cognitive-entrenchment wedge asset — the one net-new signal extracted from the external Grok corp-dev/M&A market-research eval (its "evolve to Deal Lifecycle Orchestrator / narrowness is a weakness" headline was evaluated and rejected as the incumbent graveyard). Full prose in CLAUDE.md "Cognitive-entrenchment wedge asset (locked 2026-05-18)".

- [x] 5-surface founder-facing wedge cascade, NO pipeline/schema/taxonomy change: event-prep.ts BiasHook (GE–Alstom anchor) + discovery-pitch-toolkit.ts PitchTrigger + painSignalCue + sparring-room-data.ts midmarket_corp_dev objection scenario + education-room-data.ts bias_cognitive_entrenchment flashcard + founder-context.ts key-objection + routing rule.
- [x] Ego-threat discipline locked into every surface (never call the team biased; agree experience is real → name the pattern + cite Kahneman & Klein 2009 → flip to "the audit protects the experience").
- [x] NAMED_PATTERNS promotion deliberately deferred + surfaced as a founder-routed decision (pipeline-gated 10-surface cascade; already structurally caught by DI-B-022 + the Reference-Class Blindness toxic combo).
- [x] Gates green: tsc clean · 5 lint gates · slop-scan under trip-wire.

/demo cold-paste conversion-surface friction polish (the surface every wedge DM points a stranger at; no pipeline/copy-meaning/flow change).

- [x] Live word counter on the paste textarea + Run-button gate now mirrors the real /api/demo/run server bounds exactly (50–4000 words) — removes two silent post-round-trip dead-ends (a sub-50 400 and an over-4000 413) on the conversion surface; the client previously only gated `<15 chars`.
- [x] PasteAuditResults: Sparkles → trust icons (BookmarkPlus on the Save eyebrow, Swords on the hostile-objections section) per the locked Sparkles-discipline on the cold-conversion surface; local `titleCase` → canonical `formatBiasName` so wow-moment bias names match the taxonomy (drift-class fix, META #5).
- [x] CLAUDE.md C4 lock RE-CORRECTED: grep-proved DiscoveryGradeImpactCard is live on /demo:573 + /dashboard:1616 (the 2026-05-17 "ZERO mounts / dead code" claim was itself a false-negative grep — multi-line import evaded the single-line pattern). Forward rule sharpened to cover both directions + multi-line imports. decision-roi.ts:8 stale comment flagged for back-fill on next touch.
- [ ] Founder decision surfaced (not shipped): /demo hero subhead leads with DQI/Knowledge-Graph jargon on the coldest surface (violates the locked cold-context vocabulary rule); + the section-order tradeoff for DM-warmed traffic. See session notes.

## Recently Completed (2026-05-16)

Test-coverage cascade — full prose in CLAUDE.md "Coverage-gap cascade + threshold ratchet (locked 2026-05-16)".

- [x] Audited repo test coverage; identified the scoring engine / R²F detectors / outcome-recalibration flywheel / revenue+security gates as the high-risk untested layers.
- [x] Shipped 12 new suites, 122 tests (Tier 1 pure: compound-engine, weight-overrides, validity-classifier, reference-class-forecast, calibrated-rejection, decision-rubric, algorithm-aversion, redaction-scanner · Tier 2/3 Prisma-mocked: recalibration, outcome-gate, plan-limits, document-access). Full suite 1012 passing across 74 files.
- [x] Ratcheted vitest coverage thresholds 30 → 50/40/48/50 (stmts/branch/funcs/lines) against measured 53.08/43.30/51.23/53.67.
- [x] Gates green: tsc clean · lint:positioning/silent-catches(175)/counts(77)/canonical-imports all pass.

Older entries trimmed per the ~7-day discipline. Full prose lives in CLAUDE.md session locks + git log.
