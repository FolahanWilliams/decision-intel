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

# Session-handoff: what to do first when reopening

1. Read this doc top to bottom.
2. Confirm the PMI Path B + thin Path C recommendation, or push back.
3. Confirm T3.1 category-claim reframe (option 1 + 2 layered) or pick a different shape.
4. Decide whether to ship T2.1 (DQI weight adjustability) or T2.2 (ambient capture) first. My recommendation: T2.1 — single-session, lower regression risk, higher per-customer behaviour-change. T2.2 is the bigger ship.
5. Run `npm run lint:positioning && npm run lint:silent-catches && npm run lint:counts && npm run lint:canonical-imports && npm run lint:doc-sync && NODE_OPTIONS='--max-old-space-size=3584' npx tsc --noEmit && npm run slop-scan` to confirm baseline state matches the post-shipping-Tier-1 state in commit `[hash to fill in after Tier 1 ship]`.
6. Pull from origin/main (`git fetch origin main && git rebase origin/main`) before any work.
7. Re-read CLAUDE.md "Constellation Next Move + Paper-Grounded Reasoning Surfaces" lock for the v1 architecture; the new session needs that context.

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
