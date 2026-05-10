# Paper-Grounded Tier Plan — 2026-05-10

> **Session-handoff document.** Tomorrow's session reads this top-to-bottom before touching the product. Captures everything the founder approved, what shipped today, what's queued, and what's open.

## Source material

- **Paper #1** (2026-05-10 morning) — _"Reasoning In High-Stakes Corporate Development, M&A, and Venture Capital Decisions"_. 150+ sources. Mirror in NotebookLM master KB `809f5104` (auto-indexed). Drove the 2026-05-10 evening Constellation Next Move ship (commit `76c0d007`).
- **Paper #2** (2026-05-10 afternoon) — _"Structural Failure Analysis of Decision-Quality Interventions in Corporate Development and Mergers and Acquisitions"_. 150+ sources. Anchored on Kyle Price (Roblox) verbatim quotes from M&A Science podcast (NotebookLM source `1322d9ac-28f`). Mirror in NotebookLM master KB `809f5104`.
- **Memory permission saved**: Decision Intel may be named in future Deep Research prompts when it improves outcomes — see `feedback-mention-decision-intel-in-research-prompts.md`.
- **Memory saved**: Gemini Deep Research escalation flow — surface why → wait for go-ahead → generate prompt → user returns paper — see `feedback-gemini-deep-research-allowed.md`.

## What shipped 2026-05-10 (commit `76c0d007`, on `main`)

- Constellation Next Move recommendation engine (rule-based core + DeepSeek-v4-flash augmentation via Vercel AI Gateway)
- Pre-artefact priors capture (`PriorsCaptureCard` + `/api/decisions/[id]/priors`)
- Anti-Portfolio surface (`RejectedDecisionsTab` + `/api/rejected-decisions/[id]/outcome`)
- Cultural-pairing risk capture (`CulturalPairingRiskCard` + `/api/decisions/[id]/cultural-pairing`)
- 32-test vitest suite locking engine + persona framing
- Schema migration `20260510140000_constellation_priors_anti_portfolio_cultural_pairing`

## What shipped 2026-05-10 evening (Tier 2 + PMI Path B/C, all four in lockstep)

Founder-approved: "proceed fully with t2, and with the adaptation of di to consume pmi signals as well where applicable, but not as a new domain di sells into/focuses on."

- **T2.1 — User-adjustable DQI weights**: WEIGHTS_CANONICAL frozen baseline + validateUserAdjustableWeights + hashWeights helpers (`dqi.ts`); methodology version 2.3.0 stamped when user weights applied; computeDQI accepts `userAdjustableWeights` option that REPLACES canonical (not blends); per-component weights re-stamped post-resolution to fix the pre-T2.1 latent bug where breakdown weights showed canonical even after override. Resolution helper at `weight-overrides.ts`. API at `/api/dqi/weights` (GET/PATCH/DELETE with org-scope precedence). UI panel on Settings → Preferences with auto-rebalancing sliders + canonical-delta indicators + Dietvorst 2016 educational footer. 19 new vitest tests (75/75 dqi tests pass).
- **T2.2 — Ambient thesis-formation detection**: `ambient-thesis-detection.ts` service (deepseek-v4-flash classifier + Slack channel poller + idempotent persistence + 14d expiry); cron at `/api/cron/ambient-detection`; CRUD at `/api/ambient-signals` + `/api/ambient-signals/[id]`; consent endpoint at `/api/integrations/ambient-consent`. UI: `AmbientSignalBanner` on /dashboard + `AmbientCaptureConsentPanel` on Settings → Integrations. Privacy posture: default OFF, per-channel + per-folder scoping, raw content never persisted, 500-char excerpt cap. Drive ingestion is v1 metadata-only (full file-body classification queued for follow-up). Cost ceiling ≤ $0.05/user/day.
- **T2.3 — Earlier-than-DecisionFrame priors capture**: `draft-handoff.ts` helper (localStorage with 24h expiry + flushDraftPriorsToContainer); `PriorsCaptureCard` extended with `mode: 'persist' | 'draft'`; mounted on /dashboard/decisions/new above the path picker. Both document + manual paths flush draft priors on container creation.
- **PMI Path B + thin Path C**: `pmiSignals` JSON column on DecisionContainerOutcome (6 canonical signal keys); `/api/decisions/[id]/pmi-signals` (GET/POST/PATCH with per-signal Brier scoring); `PmiTrackerTab` mounted on /dashboard/decisions/[id] when `kind === 'acquisition' && analyzedDocCount > 0`; `pmi-outcome-inference.ts` pure-function helper (`inferOutcomeFromPmiSignals` + `pmiDirectionToAcquisitionVerdict`) with 13/13 vitest tests. NO project-management surfacing — claim/predicted/observed/Brier only. PMI is the TARGET of the audit, not a new product DI sells into.

Schema migration: `20260510230000_tier2_dqi_weights_ambient_pmi` (DqiWeightOverride + AmbientThesisSignal models + DecisionContainerOutcome.pmiSignals + SlackInstallation/GoogleDriveInstallation ambient consent flags).

Audit-log actions added: DQI_WEIGHTS_SET / DQI_WEIGHTS_RESET / AMBIENT_SIGNAL_DETECTED / AMBIENT_SIGNAL_CONFIRMED / AMBIENT_SIGNAL_DISMISSED / AMBIENT_CONSENT_TOGGLED / PMI_SIGNAL_RECORDED / PMI_SIGNAL_OBSERVED.

Open follow-ups: DPR cover weight-set surface · Drive file-body classification · post-upload priors variant on /dashboard · outcome-inference pipeline integration of inferOutcomeFromPmiSignals · IC-memo PMI auto-extraction · held-out-sample DQI distribution check (process step, founder-driven).

## Counter-intuitive findings from Paper #2 (the four that shape Tiers 1-3)

1. **Awareness does not reduce bias** — the Boomerang Effect paradoxically _increases_ overconfidence. Educating practitioners on biases makes them more vulnerable, not less. **Implication**: our bias-education-heavy marketing surfaces are a liability, not an asset.
2. **Red teams fail to scale because they're structurally antagonistic** — political/ego cost is unsustainable in high-velocity sponsor-driven deal environments. **Implication**: the "always-on red team" positioning claim _fails_ the paper's test. The category claim must shift to _"the antagonist that costs you no political capital"_.
3. **The "false precision" objection is mostly ego-defense, not strategic wisdom** — Meehl/Dawes/Grove evidence is overwhelmingly in favour of mechanical models, even with uniform/improper weights. Algorithm Aversion (Dietvorst, Simmons & Massey 2015) names the failure mode. **Dietvorst's 2016 fix**: people will use imperfect algorithms _if allowed to slightly modify the inputs or weights_.
4. **First-generation tooling failed because it optimised for data integration, not cognitive debiasing** — Cloverpop required secondary interface (rapid dis-adoption); Foundry conflated data integration with decision intelligence ($2M+ deployment cost); Aera/Peak.ai automated tasks instead of augmenting judgment.

## Wedge customer — empirically grounded (Paper #2 Ch 7)

> _"The wedge customer for Decision Intelligence is not the CEO executing a once-in-a-decade platform merger; it is the programmatic operator like Kyle Price."_

This isn't framing — it's a structural argument from validity-class theory. Tech tuck-ins are repeat-game high-validity environments where Meehl/Dawes mechanical-model evidence dominates. Platform M&A is low-validity single-N where intuition can plausibly win. **Our wedge is the validity class where the algorithmic edge is mathematically largest, not the validity class where headline failure rates are most dramatic.** GTM v3.5 already names mid-market corp dev head as Phase 1 HXC; the paper upgrades that from hypothesis to literature-supported structural reasoning.

## Five conditions for unlock (Paper #2 Ch 12 — the terminal answer)

For a continuous low-friction per-decision bias-audit layer to succeed where every prior intervention failed, all five must hold:

1. **AI-enabled friction collapse** — ambient operation, no separate destination.
2. **Tooling-cost asymmetry crossover** — sub-cent per render so the cost of _not_ auditing exceeds the cost of auditing.
3. **Offloading the political tax of dissent** — system absorbs the antagonist role; user becomes facilitator, not antagonist.
4. **Procurement-grade evidence + liability shift** — DPR + EU AI Act Art 14 + Basel III + AI Verify alignment make the audit artefact compulsory, not optional.
5. **Generational change in practitioner norms** — the next cohort, data-native and aware of catastrophic deal-fever costs, normalises algorithmic decision support. **The founder being 16 is a _narrative asset_, not a weakness — he IS the generational anchor.**

---

# Tier 1 — Surface changes that operationalise paper findings (SHIPPING THIS SESSION)

These are no-pipeline, no-schema-change copy + framing edits that land paper findings on existing surfaces. ~1-2 hours of work.

### T1.1 — Reframe IntelligentAntagonistPrompt copy

**File**: [src/components/recommendations/IntelligentAntagonistPrompt.tsx](../src/components/recommendations/IntelligentAntagonistPrompt.tsx)
**Paper anchor**: Ch 10 — _"By pointing to a structurally generated risk flag, the corporate development professional shifts from being an 'antagonist' to a 'facilitator' trying to solve a problem identified by the system."_
**Current body**: _"Naming your priority before seeing the algorithm's output is the discipline that protects you from automation bias. The gap between your read and the system's read is the recommendation's actual value."_
**Proposed body**: _"Naming your priority before seeing the algorithm's output is the discipline that protects you from automation bias. The gap between your read and the system's read is the recommendation's actual value — and the audit log shifts the political cost of dissent off you and onto the system."_

### T1.2 — Reframe persona-framing.ts ma voice from imperative to facilitator

**File**: [src/lib/recommendations/persona-framing.ts](../src/lib/recommendations/persona-framing.ts) `ma` block
**Paper anchor**: Ch 10 — political-capital savings. Ch 8 — sponsor-driven bottoms-up flows expose more bias surface than ICs; corp dev professional needs "air cover" to challenge a powerful product sponsor without expending personal political capital.
**Pattern**: imperative _"Resolve before IC"_ → facilitator _"Surface this to the deal sponsor before IC — the audit log carries the provenance"_.
Walk through all 6 category framings; preserve substitution slots (`{name}`, `{tNDays}`, etc.); keep the `tight` variant under 80 chars for strip rendering.

### T1.3 — Demote bias-education on first impressions

**Files**:

- [src/app/(marketing)/bias-genome/page.tsx](<../src/app/(marketing)/bias-genome/page.tsx>) — first-paragraph eyebrow + lead claim
- [src/app/(marketing)/how-it-works/HowItWorksClient.tsx](<../src/app/(marketing)/how-it-works/HowItWorksClient.tsx>) — first-paragraph claim

**Paper anchor**: Ch 1 Boomerang Effect (Pronin et al. 2002). Educating practitioners on biases makes them more confident they're not biased. Our bias-education-heavy first-impressions are a structural liability for the wedge customer.

**Reframe**:

- BEFORE: _"22 named cognitive biases the platform catches"_ / _"learn what biases corrupt strategic decisions"_
- AFTER: _"What the audit caught on this memo, before the IC voted"_ / _"The constraints that fire while the deal sponsor is still drafting the thesis — not after the memo lands"_

Keep the 22-bias taxonomy as DPR-methodology IP exhibit (procurement readers want to see the framework backbone). Do NOT delete bias-genome / taxonomy / education-room. Demote them from first-impression position.

### T1.4 — Validity-class argument added to wedge brief

**File**: [src/components/founder-hub/path-to-100m/data/role-playbooks.ts](../src/components/founder-hub/path-to-100m/data/role-playbooks.ts) `midmarket_corpdev_head` + `smallfund_gp` blocks
**Paper anchor**: Ch 7 — programmatic operators run repeat-game high-validity environments where mechanical models dominate per Meehl/Dawes/Grove. Headline 70-90% failure rate is platform-M&A skewed; tuck-ins fail differently (silent talent attrition + delayed roadmaps).
**What to add**: a "Why these personas, structurally" subsection citing the validity-class argument as the wedge thesis foundation — not the headline failure rate.

### T1.5 — CRM + M&M historical anchor for "Why Now"

**File**: [src/components/founder-hub/path-to-100m/data/category-pitch.ts](../src/components/founder-hub/path-to-100m/data/category-pitch.ts) `WHY_NOW_HISTORICAL_ANCHORS` (new export)
**Paper anchor**: Ch 9 — Aviation CRM's 1990 FAA Advanced Qualification Program transition; Surgical M&M conferences. Both crossed from "exercise" to "continuous practice" via three inflection conditions: liability shift, procedural integration, status reframing.
**What to add**: a structured exhibit table mapping the 3 inflection conditions onto Aviation CRM, Surgical M&M, and Corporate M&A (current state). Pitch deck slide 3 (Why Now) reads from this.

---

# Tier 2 — Product changes that unlock structural conditions (FOUNDER-APPROVED, OWN SESSIONS)

### T2.1 — User-adjustable DQI weights

**Status**: Founder-approved 2026-05-10. **Pipeline-modification scope** — needs regression-test plan + methodology version bump 2.2.0 → 2.3.0 + held-out-sample DQI distribution check before/after per CLAUDE.md "modifying the pipeline" rule.
**Paper anchor**: Ch 4 + Dietvorst 2016 follow-up — algorithm aversion drops dramatically when users can slightly modify weights. Most direct fix the paper names.
**Files to touch**:

- [src/lib/scoring/dqi.ts](../src/lib/scoring/dqi.ts) — replace `WEIGHTS` constant with a `getEffectiveWeights(orgId | userId)` function that reads user-overrides from a new Prisma model + falls back to canonical weights.
- New Prisma model `DqiWeightOverride` — userId / orgId / componentId / weight / setAt. Per-user OR per-org scoping.
- New API endpoint `/api/dqi/weights` (GET + PATCH) with audit-log entries on every weight change.
- New UI surface — slim "Adjust weights for your domain" panel on /dashboard/settings or on each DPR cover. Slider per component (biasLoad, evidenceQuality, processMaturity, complianceRisk, historicalAlignment, noiseLevel, compoundRisk) with constraint that all weights sum to 1.0 (auto-rebalance the others when the user drags one).
- DPR generator must surface the active weight set on every DPR cover so procurement readers see which weights produced this score.
- Methodology version bump: `METHODOLOGY_VERSION_2_3_0 = '2.3.0'`. Audits run with user-overridden weights stamp the version + the override hash.
- 18+ vitest tests locking the override + rebalance + fallback behaviour. Regression test: 5 sample memos audited with default weights AND with each persona's expected weight tuning, distribution shift documented.
- CLAUDE.md model-policy / methodology version line updates in lockstep.

**Why it matters**: this single UX move would dramatically reduce algorithm aversion among the wedge customer (Kyle-Price-class practitioners who currently reject "false precision" structured scorecards). Highest-leverage Tier 2 item.

**Failure mode to avoid**: weights that drift from canonical baselines by >0.15 should fire a soft warning ("you've shifted X significantly from the platform baseline of Y; the per-org Brier calibration starts diverging from the platform-wide 143-case corpus baseline"). Don't block — warn.

### T2.2 — Ambient capture from email + Slack threads

**Status**: Founder-approved 2026-05-10. Substantial ship — own session.
**Paper anchor**: Ch 12 condition #1 (friction collapse) + Ch 6 (audit must fire ex-ante before deal fever locks in). Cloverpop failed due to the system-of-record fallacy — manual data entry kills adoption.
**What it means in practice**: extend the existing `IntegrationMarketplace` Slack + Drive integration to ambient-parse incoming threads + new files for sponsor-driven deal-thesis signals (target name + decision frame + initial conviction language). Auto-create a `DecisionContainer` in `pre_thesis` state when ambient parsing detects a high-confidence sponsor-thesis-formation moment. Auto-populate `priors` JSON with the parsed conviction language; surface a "we detected you may be exploring this — confirm to start the audit" banner.

**Files to touch** (high-level):

- New Prisma stage: `pre_thesis` added to `CONTAINER_MODES[kind].stages` for all 3 kinds (investment, acquisition, strategic).
- New ingestion service `src/lib/integrations/ambient-thesis-detection.ts` that polls Slack channels + Drive on the existing 5-min cron + runs deepseek-v4-flash classification on new content (cost: ~$0.05/user/day at the highest reasonable polling rate).
- New ingestion event log `AmbientThesisSignal` Prisma model — userId / source (slack | drive | email) / sourceRef / detectedAt / confidence / extractedFields (Json) / autoContainerId (nullable).
- UI banner on /dashboard when ambient detection fires AND no container exists yet — _"We saw you discussing [target] in [thread]. Start an audit?"_
- Auto-archive ambient signals that don't get confirmed to a container within 14 days.
- Privacy posture: ambient parsing requires per-channel + per-folder explicit consent in IntegrationMarketplace. Default OFF.

**Why it matters**: Ch 6 of paper #2 says deal fever corrupts late-stage diligence; the audit must fire before the IC memo crystallises. Ambient capture is the only way to fire the audit before a `DecisionContainer` exists.

**Failure mode to avoid**: false-positive ambient detection that creates spurious containers. Confidence threshold ≥ 0.75 to fire the banner; ≥ 0.90 to auto-create. User can dismiss + train the classifier.

### T2.3 — Earlier-than-DecisionFrame priors capture

**Status**: Smaller scope than T2.2; can ship in one session.
**Paper anchor**: Ch 6 + Ch 11 (ex-post scorecards devolve into rationalisation theatre absent founder-dictator culture). Audit must fire before capital is allocated, not after.
**What it means**: extend `PriorsCaptureCard` to also surface from `/dashboard` home and `/dashboard/decisions/new` (Document path AND Manual path), not just the container-detail surface. Triggered at the moment the user uploads a doc or names a target — before container creation completes.
**Files**: [src/components/containers/PriorsCaptureCard.tsx](../src/components/containers/PriorsCaptureCard.tsx) + [src/app/(platform)/dashboard/decisions/new/page.tsx](<../src/app/(platform)/dashboard/decisions/new/page.tsx>) + [src/app/(platform)/dashboard/page.tsx](<../src/app/(platform)/dashboard/page.tsx>) post-upload reveal.
**Validation rule**: priors form gets pre-saved to `localStorage` keyed off the upload hash; flushed to `DecisionContainer.priors` once the container is created. Avoids double-capture.

---

# Tier 3 — Strategic shifts (FOUNDER-APPROVED, POSITIONING + FUNDRAISE)

### T3.1 — Refine category claim away from "always-on red team"

**Status**: Founder-approved 2026-05-10. Decision needs to be locked before next pitch / cold email batch.
**Paper anchor**: Ch 2 — red teams have structurally bad properties (political antagonism, deal-team-vs-red-team friction, ego cost) we'd inherit by claiming the category.
**Proposed alternatives** (founder picks):

- _"The antagonist that costs you no political capital"_ — most paper-aligned; emphasises Ch 10 finding directly.
- _"The audit that fires before the IC memo can hide it"_ — emphasises Ch 6 ex-ante finding.
- _"Continuous diligence at sub-cent per render"_ — emphasises Ch 12 condition #2 (cost asymmetry) but loses the political-capital angle.
- _"Mechanical constraint, not psychological exercise"_ — emphasises Ch 1 finding (awareness fails; mechanical wins) but is sharper for an academic audience than a practitioner.

**My recommendation**: option 1 + option 2 layered. H1 stays _"Decision Intel is the reasoning audit platform"_ (CLAUDE.md positioning lock). The contrast sub-head shifts to _"The antagonist that costs you no political capital — fires before the IC memo can hide what the deal sponsor doesn't want to see."_ This lands Ch 2 + Ch 6 + Ch 10 in one sentence.

**Files to touch**:

- [src/lib/constants/icp.ts](../src/lib/constants/icp.ts) — `POSITIONING_CONTRAST_SUBHEAD` + `BANNED_VOCABULARY` (ban "always-on red team" preemptively).
- Landing page first-impression copy.
- /how-it-works first-impression copy.
- All cold-context bridge sentences in `COLD_CONTEXT_ONRAMPS`.
- CLAUDE.md "Positioning & Vocabulary" section.
- founder-context.ts chat preamble.

### T3.2 — Generational-change narrative for fundraise

**Status**: Founder-approved 2026-05-10. Pitch language change.
**Paper anchor**: Ch 12 condition #5 — _"A new cohort, trained in data-native environments and painfully aware of the catastrophic costs of deal fever, must normalize algorithmic decision support not as an insult to their expertise, but as the foundational safety mechanism enabling high-velocity, programmatic growth."_
**The reframe**: founder being 16 is the strongest evidence for the generational-change condition. Reframe in:

- Pitch deck slide 1 (founder bio) — lead with "16-year-old solo founder; the data-native cohort the industry's structural unlock requires."
- Cold investor email opener — same positioning.
- Founder-Hub Path-to-100M tab — add a "Generational Change Anchor" card under the Honest Probability Path that names this finding from Paper #2 explicitly.
- LinkedIn headline — current "Building Decision Intel · 16-yo Lagos→London→SF" stays good; consider adding _"the generational change M&A's bias problem requires"_ as a tagline option.

**File**: [src/components/founder-hub/path-to-100m/data/honest-probability-data.ts](../src/components/founder-hub/path-to-100m/data/honest-probability-data.ts) — new section `GENERATIONAL_CHANGE_ANCHOR` rendered as a card in `HonestProbabilityPath`.

### T3.3 — Liability-shift compulsion framing on Why Now

**Status**: Currently the EU AI Act + Basel III + IIA Three Lines references are accessory. They should become a _primary_ axis of the Why Now slide — the artefact will be legally compulsory, not optional.
**Paper anchor**: Ch 12 condition #4 + Ch 9 historical analog (FAA AQP 1990 made CRM compulsory; that was the inflection). The pitch must emphasise compulsion timing — EU AI Act Art 14 enforceable Aug 2026; Basel III ICAAP live.
**Files**:

- Pitch deck slide 3 (Why Now) — restructure around the three inflection conditions from Ch 9 (liability shift in motion, friction collapse unlocked, status reframing in motion).
- [src/lib/constants/trust-copy.ts](../src/lib/constants/trust-copy.ts) — extend the regulatory-tailwind disclosures to include the compulsion-vs-optional framing.
- /security and /trust marketing pages — promote regulatory-tailwinds section to top half of the page.

---

# DQI Weight Adjustability (T2.1 dedicated section — own session)

This deserves a separate section because it's the highest-leverage product change in the entire plan.

**Why this gets its own session**: pipeline-modification rule per CLAUDE.md. DQI scoring affects every audit; every customer's DPR. Methodology version bump must be procurement-defensible. Regression-test plan + held-out-sample distribution check are non-negotiable. Cannot be bundled with Tier 1.

**Implementation sketch (full)**:

1. **Schema**: new Prisma model `DqiWeightOverride` with `id` / `scope` ('user' | 'org') / `userId` / `orgId` / `weights` (Json — Record<DQIComponentId, number>) / `setAt` / `setByUserId` / `methodologyVersion`. Migration adds the table + indexes on (userId), (orgId), (setAt).
2. **Scoring engine**: refactor `WEIGHTS` constant in [src/lib/scoring/dqi.ts](../src/lib/scoring/dqi.ts) into a `WEIGHTS_CANONICAL` baseline + a `getEffectiveWeights(input: DQIInput, orgId, userId)` function. Override resolution: org override > user override > canonical. Fallback to canonical when override absent.
3. **API**: `/api/dqi/weights` GET (returns active weights + canonical baseline + delta vs canonical) + PATCH (validates rebalance to 1.0 + persists). Audit log every change.
4. **UI**: panel on /dashboard/settings with sliders per component. Real-time auto-rebalance: dragging one component's weight causes proportional decrease across the others. Visual indicator: blue when within 0.05 of canonical, amber when 0.05-0.15, red when >0.15. Tooltip on each slider explains what the component measures (per existing `COMPONENT_META` in DqiBreakdownPanel).
5. **DPR cover surface**: weight set + delta vs canonical surfaced on every DPR header so procurement readers can see which weights produced this score. Hash of the weight vector included in the tamper-evident provenance.
6. **Methodology version**: `METHODOLOGY_VERSION = '2.3.0'` when override is active. Stamp `'2.3.0-org-override'` or `'2.3.0-user-override'` on the analysis. Versioning stays trichotomous: `'2.0.0-no-validity'` | `'2.1.0'` | `'2.2.0'` | `'2.3.0'`.
7. **Regression-test plan**: 5 sample memos × 4 weight configurations (canonical + 3 persona-tuned variants). Document DQI distribution shift; verify no overrides produce DQI > 100 or < 0; verify no overrides invert the grade-band ordering. Held-out-sample DQI baseline tracked for next 90 days; alert if mean shifts > 5 points per quarter.
8. **CLAUDE.md updates**: model-policy section updated to name the new methodology version. Counts ratchet at lint baseline + 0 (no new count literals). Silent-catch baseline likely +1 for the body-parse on the PATCH endpoint.
9. **Education Room flashcard**: new card explaining why DQI weights are user-adjustable + the Dietvorst 2016 evidence. Card teaches the practitioner why we're letting them adjust — _"this is not us conceding to false-precision; this is us using the literature's documented fix to algorithm aversion."_
10. **Marketing surface**: short module on /how-it-works explaining adjustable weights as a core platform feature. Position as evidence we trust the user; not as a cop-out from defending our scoring.

**Estimated scope**: 1-2 sessions at AI-pair-programming velocity. Full cascade across 9 surfaces.

---

# PMI strategic question (open — founder decision)

**The question**: should Decision Intel expand to Post-Merger Integration tooling, or adapt DI to help with PMI from the existing audit-platform shape?

**My read**:

PMI is where the largest pool of M&A value destruction actually fires (Daimler-Chrysler, HP-Autonomy, AOL-Time Warner failures all crystallised post-close, not at IC). Paper #2 Ch 7 names it explicitly: _"tuck-ins fail differently — they fail through silent talent attrition and delayed product roadmaps."_ The literature is clear that PMI is the value-destruction phase.

**Three paths**:

**Path A — Expand to dedicated PMI tooling**. Build out integration project management, synergy-realisation tracking, talent-retention monitoring, integration cost reconciliation. Compete with M&A Worx, Midaxo, DealRoom integration modules.

- _Why this is wrong now_: splits focus during pre-seed/seed phase; different sales motion (Heads of Integration / PMI offices, not corp dev); existing tooling crowded; PMI is execution-heavy, not reasoning-heavy — DI's audit IP doesn't translate cleanly.

**Path B — Adapt DI to feedback-loop PMI signals into the audit pipeline**. Don't compete with PMI tools; instead consume their data (or capture it directly via lightweight integration plan tracking) and use PMI signals to validate / invalidate the ex-ante audit. The Outcome Gate's intermediate-proxy predictions (synergy realisation, talent attrition, integration cost vs forecast) are already designed for this. Extend them.

- _Why this is right_: validates the ex-ante audit by closing the loop on what actually happens. Ch 11 of Paper #2 says ex-post scorecards devolve into rationalisation theatre absent founder-dictator culture; we counter that by making the ex-post comparison automatic + rule-based. PMI signals feed back into per-org Brier-scored calibration. Doesn't require new sales motion. Doesn't require new product surface.

**Path C — Add a thin PMI overlay specifically for `acquisition`-mode containers**. Post-close, surface a "PMI Tracker" tab on the container detail page with synergy-claim verification, talent-retention monitoring, integration-cost vs forecast tracking. Pulls signals via existing Drive / Slack integration. Doesn't try to be a full PMI tool — just close the audit loop on the signals the IC memo committed to.

- _Why this is interesting_: matches the tech tuck-in wedge customer (Kyle Price's Roblox profile is post-close talent attrition + roadmap delay); extends the existing audit IP without competing with PMI tools; creates natural expansion revenue (per-acquisition close-out audit).

**My recommendation**: Path B + a thin slice of Path C. Don't build full PMI tooling; do build the post-close audit-validation surface that completes the existing audit loop. Treat PMI as the _target_ of the audit (does the deal deliver what the IC memo claimed?), not a _new domain_ DI sells into. This stays true to the "reasoning audit platform" category claim while extending the value capture into the phase where most M&A failure actually fires.

**Sequencing**: queue Path B for AFTER T2.1 (DQI weight adjustability) and T2.2 (ambient capture). Both are higher-leverage; Path B's value depends on the existing audit loop being procurement-defensible first.

**Founder decision needed**: confirm Path B + thin Path C as the strategy, or push back on the framing.

---

# Cross-cutting open questions

1. **Buyer-research validation**. Paper #2 Ch 7 says the wedge is the programmatic operator. We have ONE practitioner data point (Kyle Price). A third Deep Research paper specifically on _"would the validity-class argument actually land with Roblox-class buyers, or is Price an outlier"_ could de-risk the wedge. **OR** founder runs 5-10 cold-context discovery DMs with Roblox-class buyers (mid-market corp dev heads at $200M-$5B revenue scale-ups) using the validity-class argument as the opener; pattern-match across the responses. Discovery > more synthesis at this point.
2. **Boomerang Effect mitigation on existing surfaces**. /bias-genome and /how-it-works first-paragraph reframes are in Tier 1, but the deeper bias-education surfaces (Education Room, Taxonomy, BiasDetailModal) need an audit. Are they currently _creating_ the bias blind spot the paper warns about? Or are they pure procurement-grade IP exhibits that don't fire the Boomerang? Worth a focused audit pass.
3. **Cross-paper synthesis**. Paper #1 (the 'how reasoning works in M&A' paper) and Paper #2 (the 'why hasn't it been solved' paper) are 50K + 50K words. NotebookLM master KB has both. A focused query on _"where do the two papers contradict each other"_ would surface tensions worth resolving in the next session.

---

## Session-handoff: refined plan for 2026-05-11 (REWRITTEN POST-TIER-2)

Tier 1 + Tier 2.1 + Tier 2.2 + Tier 2.3 + PMI Path B/C all shipped 2026-05-10 evening (commit `c2e6c1fb`). Plan refined with NotebookLM master-KB synthesis (notebook `809f5104`, conversation `9a90e1e8`).

### Top 4 deferred items, ranked by ROI for Strategy World London T-30d (June 9-10 BAFTA)

The single objective of the next 30 days is converting a 20-minute coffee with a Margaret-class CSO or Damien-class corp dev head into a £249/mo wedge pilot. Backend plumbing without buyer-conversion impact is explicitly deferred.

**P1 — T3.1: Refine category claim away from "always-on red team".** Paper anchor: Mercier & Sperber argumentative theory (humans evolved reasoning for social justification → red-team framing triggers ego threat). Replace with _"the antagonist that costs you no political capital — fires before the IC memo can hide what the deal sponsor doesn't want to see"_ as the contrast sub-head; H1 stays unchanged. Wedge personas served: fractional CSO + mid-market corp dev head. **Cost: low (copy + icp.ts BANNED_VOCABULARY).** Files: [src/lib/constants/icp.ts](../src/lib/constants/icp.ts) (POSITIONING_CONTRAST_SUBHEAD + extend BANNED_VOCABULARY with `always-on red team`), landing-page first-impression copy, /how-it-works first paragraph, COLD_CONTEXT_ONRAMPS, CLAUDE.md Positioning & Vocabulary section, founder-context.ts chat preamble. **Lowest-cost-highest-payoff move; ship first.**

**P2 — DPR cover weight-set surface.** Data flows already (`DQIResult.effectiveWeights` + `weightsHash` + `weightsSource` all returned by `computeDQI`). The cover-page renderer doesn't yet pull from them. When a GP sees the printed DPR with `Weights: hash d4a8c2e9b3f1 · user-adjusted (Δ 0.07 vs canonical)` stamped on page 1, it proves the engine is calibrated to their domain, not generic. Paper anchor: Kahneman & Klein 2009 first-condition + Dietvorst 2016 trust-via-adjustability. **Cost: medium ([src/app/dpr-render/dpr.css](../src/app/dpr-render/dpr.css) + [src/app/dpr-render/[type]/[id]/page.tsx](<../src/app/dpr-render/[type]/[id]/page.tsx>) + provenance-record-data assembler reads `analysis.judgeOutputs.weightsHash` if persisted, falls back to live compute).** Persist the hash on `Analysis.judgeOutputs.weightsResolution = { source, hash, methodologyVersion }` in [/api/analyze/stream](../src/app/api/analyze/stream/route.ts) at audit-completion time so the DPR can read the band the audit was originally scored against.

**P3 — T3.3: Liability-shift compulsion framing on Why Now slide.** Promote EU AI Act Art 14 (Aug 2026 enforceable) + Basel III ICAAP from accessory to primary axis. Pitch deck slide 3 restructured around the three inflection conditions from Paper #2 Ch 9 (liability shift in motion + friction collapse unlocked + status reframing). Wedge personas: mid-market corp dev head via their GC; PE-backed founder via legal-risk avoidance. **Cost: low (trust-copy.ts liability-shift block + /security + /trust + pitch deck slide 3 restructure).**

**P4 — Held-out-sample DQI distribution check.** Required process step before methodology 2.3.0 enables production. Run 5 sample memos × 4 weight configs (canonical + 3 persona-tuned), document distribution shift, verify no overrides produce DQI > 100 / < 0 / inverted grade-band ordering. **Cost: small script + founder-driven review.** Required for procurement defensibility when a GP asks "how do I know your score is accurate?" — the answer needs to point at a documented regression test, not just the test suite.

### 2 new high-leverage moves NotebookLM surfaced (not on prior list)

**N1 — Kyle-Price-overlay "Deal Fever" Boardroom Twin demo.** Kyle Price (Roblox Head of Corp Dev; master KB source #23, the canonical Paper #2 anchor quote) said on the M&A Science podcast that there is "no cure" for Deal Fever; the only effective countermeasure is "a red team exercise — somebody pitches the case for why this is a horrible idea." That's exactly the antagonist pattern T3.1 reframes politically. Ship: when a user uploads a CIM, the existing simulate-ceo route auto-fires a 1-click Deal-Fever pre-mortem with 3 brutal questions targeted at Deal Fever / Winner's Curse / Synergy Mirage. Wedge persona: mid-market corp dev head (Kyle's exact role). **Cost: medium — extend [/api/simulate-ceo](../src/app/api/simulate-ceo/route.ts) with a `mode: 'deal_fever_premortem'` flag + hardcoded prompt overlay; auto-trigger on CIM upload via the analyze/stream completion event; surface result as a header chip on the container detail page.**

**N2 — Deepen the Synergy Mirage filter to BCG procurement-grade.** The synergy_model parser already exists ([src/lib/parsers/synergy-model-parser.ts](../src/lib/parsers/synergy-model-parser.ts)) and Synergy Mirage already fires on the bias-detective. What's missing: explicit BCG-mandated check — every synergy claim must name (a) the operational mechanism, (b) the accountable executive owner, (c) the measurable 90-day milestone. If any are missing, the audit fires "Synergy Mirage · BCG-mandate failure" with verbatim citation. This proves to a PE-backed founder that the tool enforces elite operational hygiene, not just psychology. **Cost: low (extend [synergy-defensibility.ts](../src/lib/parsers/synergy-defensibility.ts) scorer with the 3-checks + extend `DOC_TYPE_OVERLAYS.synergy_model` in [investment-vertical.ts](../src/lib/prompts/investment-vertical.ts) to instruct the bias detective to flag missing mechanism/owner/milestone).**

### Items deferred from Strategy World prep — post-event polish

- **T3.2 generational-change narrative for fundraise** — post-seed-conversation positioning, not pre-pilot conversion. Ship when seed conversations open (per Mr. Gabe customers-before-investors rule).
- **Drive file-body classification** (T2.2 v1 is metadata-only). Retention feature, not conversion.
- **Post-upload priors variant on /dashboard**. Document-level priors are a different shape than container-level; not blocking the wedge motion.
- **Outcome-inference pipeline integration of `inferOutcomeFromPmiSignals`.** Helper is built + tested; wiring into the 1111-line outcome-inference module is post-pilot retention.
- **IC-memo PMI auto-extraction via deepseek-v4-flash.** Reduces friction post-purchase; pre-purchase, manual entry on the PMI Tracker is fine.

### NotebookLM caveat (founder action required before citing publicly)

The NotebookLM synthesis included a _"Fortis Advisors LLC v. Krafton Inc. (2026 Delaware Chancery)"_ case as an anti-provenance horror story for the liability-shift slide. Inspection of the citation chunks shows the cited sources are unrelated Definely-revenue snippets, NOT actual legal-case sources. **Treat this case as unverified — do NOT cite in pitch decks or public surfaces without independent confirmation.** Real Delaware Chancery decisions involving AI provenance / earnout disputes are public-record; verify before use. The general liability-shift argument stays valid via EU AI Act Art 14 + Basel III ICAAP (both independently verified). This is the "hallucinated case" failure mode CLAUDE.md positioning rule was written to catch — every citation on a marketing surface must trace to a real primary source.

### First-session-of-2026-05-11 checklist

1. `git fetch origin main && git rebase origin/main` before any work.
2. `NODE_OPTIONS='--max-old-space-size=3584' npx tsc --noEmit && npm run lint:positioning && npm run lint:silent-catches && npm run lint:counts && npm run lint:canonical-imports && npm run lint:doc-sync && npm run slop-scan` to confirm baseline matches `c2e6c1fb` (post Tier-2 + PMI ship).
3. `npx prisma migrate deploy` against production for migration `20260510230000_tier2_dqi_weights_ambient_pmi` if not yet deployed (DqiWeightOverride + AmbientThesisSignal tables + DecisionContainerOutcome.pmiSignals column + SlackInstallation/GoogleDriveInstallation consent flags).
4. Verify the consent toggles in Settings → Integrations render correctly for the founder's own Slack / Drive installations.
5. Ship P1 (T3.1 category claim) first — 20-minute editorial change with immediate compounding effect on every cold-context surface.
6. Then ship P2 (DPR cover weight-set surface) — needed to make the methodology 2.3.0 audit actually visible to procurement readers, otherwise the engine work shipped tonight is invisible on the leave-behind artefact.
7. Schedule P4 (held-out-sample DQI distribution check) for the same day as P2 — both need to land before any GP-facing demo with the new 2.3.0 methodology.
8. Then attack N1 (Kyle-Price Deal-Fever demo) — the highest-leverage NEW move for the Strategy World corp-dev-head conversation.
9. Re-read CLAUDE.md "Tier 2 + PMI Path B/C ship (locked 2026-05-10 evening)" lock for the v1 architecture context.

### Open strategic question for the founder

The plan above assumes the founder is attending Strategy World London June 9-10. If not — or if the 4 HXC personas in the founder's pre-booked 1:1 calendar shift — the ROI ranking flips. **P1 (category claim) is load-bearing regardless** — it's pure cold-context vocabulary discipline that compounds on every surface. P2 + N1 + N2 are most valuable when the founder has a CIM upload in front of a corp-dev-head buyer AT THE EVENT. P3 (liability shift) is the slide-3 move for the post-event follow-up email + the seed-conversation deck six months out. **Founder decision needed**: confirm Strategy World attendance + 1:1 calendar, OR redirect the plan toward the next-highest-signal channel.

# Files this doc references

- [src/components/recommendations/IntelligentAntagonistPrompt.tsx](../src/components/recommendations/IntelligentAntagonistPrompt.tsx)
- [src/lib/recommendations/persona-framing.ts](../src/lib/recommendations/persona-framing.ts)
- [src/app/(marketing)/bias-genome/page.tsx](<../src/app/(marketing)/bias-genome/page.tsx>)
- [src/app/(marketing)/how-it-works/HowItWorksClient.tsx](<../src/app/(marketing)/how-it-works/HowItWorksClient.tsx>)
- [src/components/founder-hub/path-to-100m/data/role-playbooks.ts](../src/components/founder-hub/path-to-100m/data/role-playbooks.ts)
- [src/components/founder-hub/path-to-100m/data/category-pitch.ts](../src/components/founder-hub/path-to-100m/data/category-pitch.ts)
- [src/lib/scoring/dqi.ts](../src/lib/scoring/dqi.ts)
- [src/components/dqi/DqiBreakdownPanel.tsx](../src/components/dqi/DqiBreakdownPanel.tsx)
- [src/lib/constants/icp.ts](../src/lib/constants/icp.ts)
- [src/lib/constants/trust-copy.ts](../src/lib/constants/trust-copy.ts)
- [src/components/founder-hub/path-to-100m/data/honest-probability-data.ts](../src/components/founder-hub/path-to-100m/data/honest-probability-data.ts)

# Memory references

- `feedback-gemini-deep-research-allowed.md`
- `feedback-mention-decision-intel-in-research-prompts.md`
- `project-youtube-corpdev-cognitive-bias-quote.md`
- `feedback-boil-the-ocean.md`
- `feedback-claude-timing-multiplier.md`
