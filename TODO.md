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
- [ ] `riskScorerNode` in `src/lib/agents/nodes.ts` is ~1,200 lines and does six separate jobs (compound scoring, Bayesian priors, outcome feedback, calibration, report assembly, causal weights). Refactor into composable sub-functions — hard to test and debug today.
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

## Recently Completed (2026-05-16)

Test-coverage cascade — full prose in CLAUDE.md "Coverage-gap cascade + threshold ratchet (locked 2026-05-16)".

- [x] Audited repo test coverage; identified the scoring engine / R²F detectors / outcome-recalibration flywheel / revenue+security gates as the high-risk untested layers.
- [x] Shipped 12 new suites, 122 tests (Tier 1 pure: compound-engine, weight-overrides, validity-classifier, reference-class-forecast, calibrated-rejection, decision-rubric, algorithm-aversion, redaction-scanner · Tier 2/3 Prisma-mocked: recalibration, outcome-gate, plan-limits, document-access). Full suite 1012 passing across 74 files.
- [x] Ratcheted vitest coverage thresholds 30 → 50/40/48/50 (stmts/branch/funcs/lines) against measured 53.08/43.30/51.23/53.67.
- [x] Gates green: tsc clean · lint:positioning/silent-catches(175)/counts(77)/canonical-imports all pass.

## Recently Completed (2026-05-11)

Six commits in one session — full prose lives in CLAUDE.md "Session locks 2026-05-11" + `docs/CLAUDE-archive-2026-Q2.md` (when split).

- [x] `1a752cb7` — shortcuts fix (?-gating to non-input contexts) + constellation band-label-clipping fix
- [x] `ac8e74e3` — Constellation SVG viz retired + Decisions page refactor (PortfolioVerdictBand + PortfolioSignalTiles + NextMoveContainer canonical-antagonist promotion)
- [x] `9c22ffc7` — DQI gauge needle math fix + /terms refresh + /about "What you get" tiles + NewDecisionModal refresh + audit-platform.mjs script shipped
- [x] `4f39a0a9` — /onepager Arden-style artifact + /proof ROI banner + per-case ROI callout + footer 3-column split (Platform/Proof/Trust) + modal Dialog migration (6 modals)
- [x] `74861f3d` — dark-mode token sweep (72→0) + ExperimentsContent.tsx deletion + /pricing count-drift fix
- [x] `9ddf13f6` — CLAUDE.md updated with 14 numbered locks from the session

Audit-platform.mjs state post-session: CRITICAL 2 (admin-tolerated) · MODAL 0 · VISUAL 766 (low-severity hex) · STALE 2 (legitimate historical refs). Quality gates: tsc + 5 lints + 793/793 vitest + slop-scan all clean.
