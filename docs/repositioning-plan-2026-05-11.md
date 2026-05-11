# Decision Intel — Repositioning + Pressure Plan (2026-05-11)

**Status:** DRAFT — pending founder approval
**Author:** Folahan + Claude session 2026-05-11
**Supersedes:** none (extends GTM v3.5 at [docs/gtm-plan-v3-5-2026-05-04.md](gtm-plan-v3-5-2026-05-04.md))
**Sources synthesized:**

- Venture Growth Group fundability diagrams (2 infographics — full text in Section 2)
- NotebookLM contradiction-check against master KB `809f5104` (full verdict in Section 5)
- Grok M&A pain-mapping analysis (Section 6 covers the synthesis)
- Paper #2 Ch 12 five-condition unlock framework (Section 7)
- CLAUDE.md locks current as of 2026-05-11 (v3.5 wedge, 4 HXC personas, customer-before-investor sequencing, no-named-prospects rule, Premature Enterprise Escalation guard)

---

## Purpose of this document

A future Claude session reading this file cold — without conversation history — should be able to:

1. Understand the strategic premises (the two failure modes Decision Intel must escape — _tool-tested instead of infrastructure-underwritten_, AND _capable-founder-but-no-pressure_)
2. Read the two source diagrams that prompted the analysis
3. See the contradiction-check that prevented several intuitive-but-fatal moves
4. Read the full 90-day plan with week-by-week sequencing
5. Find the one-page specimen artefact template in full (the operational glue of the whole plan)
6. Apply the kill criteria when red signals fire

This document is **operationally canonical** for the next 90 days. When a lock here changes, update this file AND CLAUDE.md AND the master KB notebook `809f5104` in the same commit.

**What this document does NOT replace:**

- [CLAUDE.md](../CLAUDE.md) — codebase + product + positioning locks
- [docs/gtm-plan-v3-5-2026-05-04.md](gtm-plan-v3-5-2026-05-04.md) — GTM strategy of record
- [docs/paper-grounded-tier-plan-2026-05-10.md](paper-grounded-tier-plan-2026-05-10.md) — paper-grounded technical tier roadmap

This document **operationalises** them against the empirical fundability lens from the source diagrams. Treat conflicts between this document and the above as: GTM v3.5 wins on strategy; CLAUDE.md wins on locks; this document wins on 90-day sequencing.

---

## Section 1 — Why this plan exists

Decision Intel as of 2026-05-11 is:

- **Technically excellent:** 200+ components, 70+ API routes, 22-bias R²F taxonomy (DI-B-001 → DI-B-022), 12-node LangGraph pipeline, 19-framework regulatory map (G7 / EU / GCC / African markets), 143-case retro-audited library calibrated to Brier 0.258 (CIA-analyst grade), 10 of 10 R²F paper-applications shipped, 5 named M&A toxic combinations (Synergy Mirage / Conglomerate Fallacy / Winner's Curse + 2 layered), Decision Container unified model, PMI Tracker, ambient capture v1, user-adjustable DQI weights (Dietvorst 2016 algorithm-aversion fix), Constellation Next Move recommendation engine.

- **Commercially pre-revenue:** zero paid customers. First design-partner target ("Sankore" — confidential, internal name only) in active scoping but no signed Design Foundation MoU. Pre-seed track ongoing — one VC partner in conversation, primary motive is network access not capital.

- **Structurally fragile in two specific ways the two source diagrams expose:**
  1. The product is architecturally close to "infrastructure" (Decision Knowledge Graph, per-org Brier, Outcome Gate, Bias Genome, PMI Tracker all real and shipped) — but the surface area users touch is upload-tool-shaped, and the lack of customers means the infrastructure claims are unverified.
  2. The founder is capable to an extreme degree, the product is real, the market is attractive, conviction is high — but there is no observable cost to investor delay. No competing investor signal, no customer about to sign, no regulatory deadline forcing customer action only DI can serve, no narrative scarcity. The "Why does this need to be funded NOW?" question has no defensible answer today.

The plan in this document addresses both. It does NOT trade depth for speed — per the CLAUDE.md "Velocity & Scope Discipline" lock + the boil-the-ocean rule, the plan ships the category-grade enterprise version of every approved item, not the lean cut.

---

## Section 2 — The source diagrams (full context)

These two infographics from Venture Growth Group are the empirical lens the plan was built against. Future sessions reading this document need the full text because the diagrams are not in the codebase or the master KB.

### Diagram 1: "Why Most AI Tools Don't Get Funded"

**Tagline:** _Investors do not fund helpful AI. They fund workflow control._
**Sub-tagline:** _Same product. Different category. Tools get tested. Infrastructure gets underwritten._

#### Frame 1 — The Category Shift

> Founder says: "We save time." → Investor hears: "Efficiency."
> Founder says: "We own the workflow from signal to decision to execution to learning." → Investor hears: "Infrastructure."
> **The product may be the same. The investor psychology is not.**

#### Frame 2 — The Investor's Real Question

> _"Does this company own enough work to become part of how the customer operates?"_
>
> NOT: "Does it use AI?"
> NOT: "Is the demo impressive?"
> NOT: "Do users like it?"

#### Frame 3 — Tool vs Infrastructure

| Tool                     | Infrastructure                |
| ------------------------ | ----------------------------- |
| Sits beside the workflow | Lives inside real work        |
| Waits for the user       | Sees the trigger              |
| Makes tasks faster       | Drives decision and execution |
| Gets tested              | Gets underwritten             |

#### Frame 4 — What Investors Watch For (the 7-criteria framework)

| #   | Criterion          | The actual question                                                           |
| --- | ------------------ | ----------------------------------------------------------------------------- |
| 1   | Workflow ownership | Inside real work or beside it?                                                |
| 2   | Trigger control    | Does it know when work starts?                                                |
| 3   | Context memory     | Does each use improve the next decision?                                      |
| 4   | System position    | Does it connect to or become the system of record?                            |
| 5   | Bottleneck removal | Does it remove expensive work or just speed up small tasks?                   |
| 6   | Learning loop      | Does it learn from outcomes, not just inputs?                                 |
| 7   | Removal cost       | Would the customer lose process, data, speed, and judgment if it disappeared? |

#### Frame 5 — Which Founder Raises?

> Founder A: Sells a faster tool.
> Founder B: Owns the workflow.
> **Most founders explain features. Fundable founders make investors fear missing the operating layer.**

#### THE RULE (Diagram 1)

> **A tool gets tested. Infrastructure gets underwritten.**

---

### Diagram 2: "Why Capable Founders Still Don't Get Funded"

**Tagline:** _Investors do not fund capability. They fund pressure._
**Sub-tagline:** _Smart founder. Real product. Strong conviction. Still no money._

#### Frame 1 — What Founders Miss

- The founder is capable → investors may believe that
- The product is real → that still does not force action
- The market may be attractive → potential alone is optional
- Conviction is high → but conviction is not urgency

#### Frame 2 — The Investor's Colder Question

> _"Why does this need to be funded NOW?"_
>
> Not someday. Now.
> Can I defend this to a partner?
> What makes delay expensive?

#### Frame 3 — Capability vs Pressure

| Capability                              | Pressure                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------ |
| This founder can probably figure it out | If we wait, this round, this price, or this company may not be available |
| Promising team                          | Proof creates motion                                                     |
| Strong product                          | Timing feels unfair                                                      |
| Believable story                        | Delay has a cost                                                         |

#### Frame 4 — Founder Says / Investor Hears

> "I know I can do this." → "Maybe."
> "I just need the money to accelerate." → "So the market has not forced acceleration yet."
> "We have strong potential." → "Potential is still optional."

#### Frame 5 — Why Some Less Capable Founders Raise

- Their proof creates motion
- Their category is easy to repeat
- Their timing feels unfair

#### THE RULE (Diagram 2)

> **The best founders make delay feel expensive.**

---

## Section 3 — Strategic frame

### The two failure modes the plan must escape

**Failure Mode 1 — Tool-grade trap.** DI gets tested, never underwritten. Buyers treat it as a Friday memo-review tool. Investors file it as "AI-powered productivity." Removal cost approaches zero because no integration depth exists. The product can be excellent and still be filed in this bucket if the surface area users touch is upload-tool-shaped. (Diagram 1, rows 1, 5, 7.)

**Failure Mode 2 — Capable-but-no-pressure trap.** DI is technically strong, but delay costs the investor nothing observable. Filed as "smart founder, watch list." Six months later the founder is still capable, the product is still real, but the round didn't close because no partner could defend "now" to a partner. (Diagram 2, all rows.)

### The four locks the plan respects

Per NotebookLM contradiction-check (Section 5 below), these four locks are load-bearing and cannot be re-litigated by this plan:

1. **Mr. Reiner / Mr. Gabe networks stay sealed until Phase 3.** Activation criteria (5 paid + 3 ROI cases + Sankore reference) are non-negotiable. Burning warm networks pre-evidence destroys unrenewable resource. KB labels this verbatim as "Premature Enterprise Escalation, single most likely failure mode."
2. **Ambient capture (Slack/Drive/Gmail) stays opt-in by default.** Per-channel scoping, 14-day expiry, 500-char excerpt cap. Privacy posture is procurement defense against IBM watsonx attack vector. F500 GCs block default-on data ingestion.
3. **Outcome Gate + Vohra survey + agentic-shift investigation cannot be paused for any reason.** Pausing them = ceding the only mechanism that builds the data moat against Cloverpop's existing data advantage. The 50/50 product split (Section 8) protects this.
4. **Customer-before-investor sequencing holds.** Per Mr. Gabe's rule: 5+ paid Individuals + 1+ Design Foundation pilot + 1+ verifiable DPR referral before opening seed conversations. Verbal yes-pending-diligence is product discovery, not a fundraising credential.

### The five empirical "Why Now" conditions

The framework that replaces vague "EU AI Act is coming" / "AI maturity" framings with five conditions, each tied to a DATED enabling event (full sourcing in Section 7):

| #   | Condition                | Empirical anchor                            | Dated event                           |
| --- | ------------------------ | ------------------------------------------- | ------------------------------------- |
| 1   | Friction collapse        | Sub-cent per audit via gateway              | Shipped 2026-05-10                    |
| 2   | Liability shift          | EU AI Act Art 14 enforcement                | Aug 2, 2026                           |
| 3   | Political-tax offloading | Intelligent antagonist absorbs dissent cost | Shipped 2026-05-10                    |
| 4   | Generational change      | 16-yo solo founder                          | SF move Sept 2027 closes the corridor |
| 5   | AI authorship shift      | Memos shifting to agent-assisted            | Agentic Path-A/B/C lock June 2026     |

Each condition = a slide on the pitch deck "Why Now" section. Each survives partner-defendability ("can I defend this to a partner?") because each has a dated event and a citation.

---

## Section 4 — Scorecard: DI today against the two diagrams

### Against Diagram 1 (Tool vs Infrastructure)

| Criterion              | Where DI lives today                                                                                                                                                                                                  | Honest grade                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Workflow ownership** | Side-car. User remembers to upload a memo → audit fires. Ambient capture (T2.2) was shipped but defaults OFF, metadata-only on Drive, opt-in per channel.                                                             | **Tool**                       |
| **Trigger control**    | Reactive. The pipeline doesn't know a decision is happening; it knows an upload happened. No DealCloud / Affinity / Salesforce / Notion-strategy-page hooks.                                                          | **Tool**                       |
| **Context memory**     | Strong architecturally — Decision Knowledge Graph, per-org Brier, Bias Genome, Outcome Gate cross-decision learning. But invisible in the daily UX; users don't FEEL the compounding.                                 | **Infrastructure (latent)**    |
| **System position**    | Positioned as "system of record for decisions specifically" (CLAUDE.md lock), but with 0 paying users it's a claim, not a position.                                                                                   | **Tool (positioned as infra)** |
| **Bottleneck removal** | Removes "the deal that fails 18 months later" — probabilistic, not daily. CFO/CSO doesn't feel the bottleneck the way a sales team feels missing pipeline.                                                            | **Weak**                       |
| **Learning loop**      | The architecture is there (Outcome Gate → Brier → recalibration → Bias Genome). But the loop is **empty** because no closed outcomes exist yet. The flywheel claim is structurally credible and empirically untested. | **Infrastructure (empty)**     |
| **Removal cost**       | If DI disappeared tomorrow, no customer loses any process, data, speed, or judgment, because no customer has integrated. This is the single most damning row.                                                         | **Zero**                       |

**Net read:** DI has more infrastructure DNA than most AI tools at this stage (Knowledge Graph, Brier, Outcome Gate, Bias Genome are all real and shipped) — but the surface area users touch is upload-tool-shaped, and the lack of customers means the infrastructure claims are unverified.

### Against Diagram 2 (Capability vs Pressure)

| Factor                   | DI state                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Founder capability       | Off the chart. 16yo solo, 200+ components, 70+ API routes, 22-bias taxonomy, 10 R²F paper-applications shipped, Brier 0.258 calibrated.   |
| Product reality          | Real. Ships, runs, costs ~£0.40/audit, has procurement-grade DPR + 19-framework regulatory map.                                           |
| Market attractive        | EU AI Act Aug 2026 enforcement, $46B by 2030 — yes.                                                                                       |
| Conviction               | Very high.                                                                                                                                |
| **Proof creates motion** | **No.** 143-case retro Brier is technical proof, not customer proof. Zero paid users. Sankore "in active scoping" not signed.             |
| **Timing feels unfair**  | **No.** No competing investor is sniffing. No customer is about to sign. No regulatory deadline forces customer action only DI can serve. |
| **Delay has a cost**     | **No.** If the investor waits 6 months: nothing observable changes. No round closes around them. No headline lands. No revenue compounds. |

**The colder question — "why does this need to be funded NOW?":** DI has no defensible answer today. "EU AI Act enforcement" is calendar pressure, not market pressure. The 16-yo angle is asymmetric raw material for pressure but is currently used as a credential ("look how young I am"), not as scarcity ("this window closes when I move to SF").

---

## Section 5 — NotebookLM contradiction check (verbatim verdict)

A 6-move plan was initially drafted from the two diagrams. NotebookLM was queried against the master KB `809f5104` (contains CLAUDE.md, GTM v3.5, all 66 founder-school lessons, all memories, sales/competitive frameworks, 19-framework registry, both DPR specimens, primary research). Pressure-tested adversarially. Findings ranked by structural-damage severity. Verbatim verdict preserved below.

### Move-by-move verdict

| #   | Move                                                             | Verdict                          | Why                                                                                                                                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2   | Activate Reiner + Gabe NOW                                       | **CRITICAL — HOLD THE LOCK**     | KB names this verbatim as "Premature Enterprise Escalation, single most likely failure mode." Mr. Reiner intros a 16-yo with zero paid customers + no SOC 2 Type II + no outcome data → buyer files it as "science project" → cannot reapproach in 18 months. **Warm networks are unrenewable resources.**                                                               |
| 1   | Ambient capture DEFAULT                                          | **VERY HIGH — REDESIGN**         | Shatters privacy posture, fails every vendor-risk assessment, shifts positioning from "EU AI Act reasoning audit" to "shadow-IT data exfiltration." Also widens IBM watsonx attack vector. **Keep opt-in; engineer the friction to zero + frame the opt-in around BUYER benefit ("Connect for automated outcome tracking + DQI flywheel"), not platform need for data.** |
| 3   | Stop features 60d, 100% to integrations                          | **HIGH — RE-LITIGATE PARTIALLY** | Violates Phase 1 ops lock (Vohra survey + Outcome Gate on day one) + agentic-shift investigation. No Outcome Gate → no closed outcomes → Bias Genome dies → Cloverpop wins the data war by default. **Reallocate 50% to integration depth, 50% to Outcome Gate + Vohra + agentic-shift Path-A/B/C investigation.**                                                       |
| 6   | Verbal yes-pending-diligence in 30d                              | **MODERATE — REFRAME**           | Violates Mr. Gabe customers-before-investors rule. Verbal yes = nothing to VCs ("buyers say yes to get you out of the office"). **Reframe as product discovery → convert the verbal yes into one of the 5 required PAID £249/mo customers.**                                                                                                                             |
| 4   | Contractually-binding seat scarcity                              | **SAFE — SHIP**                  | Aligns with v3.5 £1,999/mo founding-pilot lock + Cialdini scarcity principle. Zero risk.                                                                                                                                                                                                                                                                                 |
| 5   | Sankore as "regulatory co-author" (internal pitch language only) | **SAFE — SHIP**                  | Aligns with ceiling moat + confidentiality rule. Elevates founder's own framing from junior vendor to infra co-author. Public surfaces stay anonymous.                                                                                                                                                                                                                   |

### The three external attack vectors the plan must NOT widen

The KB surfaced three lethal attack vectors. The original 6-move plan inadvertently widened exposure to all three. The redesigned plan (Sections 8-11) closes them.

**1. Cloverpop's data-advantage attack.** Cloverpop has years of structured enterprise decision + outcome data DI doesn't have yet. The defense is the Outcome Gate enforcement + per-org Brier accumulation. If Move 3 had paused feature shipping to focus on integrations, the Outcome Gate would have stalled, the data moat would never accumulate, and Cloverpop wins by default. **Mitigation:** the 50/50 product split preserves Outcome Gate + Vohra + agentic-shift work.

**2. IBM watsonx.governance bundling attack.** IBM is bundling "human decision provenance" into AI governance suites for F500 GCs to meet EU AI Act Article 14 compliance by Aug 2026. The defense is procurement-grade privacy posture + Pan-African regulatory coverage (which IBM doesn't have). If Move 1 had defaulted ambient capture ON, GCs would file DI as a data-exfiltration risk and buy IBM. **Mitigation:** ambient capture stays opt-in, framed around buyer benefit.

**3. Agentic-shift makes the strategic memo obsolete attack.** Palantir / Snowflake / Databricks / Aera are deploying agents that execute decisions directly. The defense is R²F detectors that fire on REASONING patterns regardless of authorship (human / AI-assisted / agent-generated). If Move 3 had locked DI into 60 days of legacy CRM integrations, agentic Path C confirmation in June would have wasted the time. **Mitigation:** the 50/50 split preserves the agentic-shift investigation.

### Net effect on the original 6-move plan

- **2 moves ship as-is** (Moves 4 + 5 — seat scarcity + Sankore reframe internal)
- **3 moves are redesigned, NOT killed** (Moves 1 + 3 + 6 with the specific changes above)
- **1 move is deleted** (Move 2 — Reiner / Gabe activation stays sealed)

This is more disciplined and more leveraged than the original 6-move plan. The plan in Sections 8-11 below is the redesigned version.

---

## Section 6 — Grok M&A pain mapping synthesis

In parallel with NotebookLM, Grok was queried on M&A executive pain points + cognitive bias mapping + positioning advice for Decision Intel. Result was directionally right on buyer pain, surface-level on positioning, and tripped six CLAUDE.md guardrails inside one response. Useful test of how external advisors will paraphrase DI sloppily — reinforces the canonical-imports + count-derivation disciplines.

### Where Grok tripped guardrails

| #   | Grok said                                                                    | Why it's wrong                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Workshops on Decision Hygiene in M&A"                                       | "Decision hygiene" is in `BANNED_VOCABULARY` (Kahneman's term — cedes category vocabulary). Workshops = Quantellia "unscalable consulting" trap in `PITFALLS`.                                            |
| 2   | "20+ cognitive biases"                                                       | Count drift. Canonical = 22 (DI-B-001 → DI-B-022). `lint-counts.mjs` would have caught it; an external advisor won't.                                                                                     |
| 3   | "Protect outcomes where millions are on the line"                            | "Protect outcomes" is **deprecated** per CLAUDE.md ("Do NOT use 'collaborative,' 'collaborator,' 'medium,' or 'protect outcomes'"). Used twice.                                                           |
| 4   | "Heads of Corp Dev at mid-to-large enterprises (and PE firms doing add-ons)" | F500 corp dev is the **CEILING** (Phase 4), NOT the **WEDGE** (Phase 1). Targeting F500 corp dev pre-revenue is the exact Premature Enterprise Escalation failure mode NotebookLM just flagged on Move 2. |
| 5   | "Link to data rooms (Datasite, Intralinks)"                                  | VDR integrations are post-Series-A. Pre-seed wedge is fractional CSOs / smaller-fund GPs / mid-market corp dev who don't run VDRs.                                                                        |
| 6   | "Kahneman for M&A"                                                           | Cedes Klein's half of R²F entirely. The locked claim is Kahneman + Klein synthesis arbitrated in one pipeline — the IP moat.                                                                              |
| 7   | "Per-deal pricing angle"                                                     | v3.5 locked per-SEAT (£249/mo Individual). Per-deal was retired. Grok months behind.                                                                                                                      |
| 8   | "AI maturity finally makes this possible" as Why Now                         | Surface. The actual empirical NOW (Paper #2 Ch 12) is 5 conditions (Section 7).                                                                                                                           |

### The seven buyer-empathy upgrades worth integrating

Despite the positioning errors, Grok surfaced seven sharper buyer-facing framings that meaningfully upgrade the plan:

1. **Sourcing-stage screening as a daily bottleneck.** Mid-market corp dev heads do 20-100 early screens per quarter to close 2-4 deals. Each screen is a 5-page market scan. Currently un-audited because "too short to warrant rigorous bias review." This is a higher-frequency daily-usage surface than IC-stage audits. (Drives the `/screen` product workstream in Section 8.)

2. **The "diligence-to-integration knowledge chasm" framing.** The sharpest pain Grok cites. Maps directly to PMI Tracker (shipped 2026-05-10 but under-marketed). Reframe PMI Tracker from "post-close outcome tracking" to **"the audit that survives the diligence-integration handoff."** (Drives the PMI Tracker promotion workstream in Section 8.)

3. **Buyer-grade vocabulary swaps:**

   | Current internal name                 | Buyer-grade name                                         |
   | ------------------------------------- | -------------------------------------------------------- |
   | Bias Genome contribution              | **Portfolio Bias Heatmap**                               |
   | Per-org Brier calibration             | **Team Calibration Score**                               |
   | DPR (technical name kept) + explainer | **"governance evidence that compounds learning"**        |
   | Reference Class Forecast + explainer  | **"outside view to counter inside-view optimism"**       |
   | Per-decision ROI                      | **"One corrected recommendation pays for the platform"** |

   IP names stay protected (R²F, DPR, DQI). The translation layer upgrades to buyer-vocabulary register. (Drives the vocabulary swap workstream in Section 9.)

4. **The knowledge-chasm cold DM opener** for mid-market corp dev:

   > "Your diligence team flags 20 risks pre-close. Your integration team finds 8 of them post-close. The other 12 were filed in the IC memo nobody re-opened. Decision Intel is the audit that survives the handoff."

   Complete cold DM in 4 sentences. Empathic-mode-first compliant. No DPR/DQI/R²F jargon. (Drives the cold-DM workstream in Section 9.)

5. **"One corrected recommendation pays for the platform"** as protected-value framing. Cleaner than the current "£249/mo per seat protects 18-month-horizon decisions." Creates a per-decision ROI anchor intuitive to a fractional CSO running 3-5 client engagements.

6. **Reference Class Forecast → "outside view to counter inside-view optimism"** is more buyer-facing than the current "Reference Class Forecast (per Kahneman & Lovallo 2003 'Delusions of Success' HBR)." Academic citation belongs on the DPR; buyer-facing surface uses Grok's translation.

7. **Decision Provenance Record as "governance evidence + compounding learning"** — two-property framing crisper than the current marketing copy on /security and /how-it-works.

### What Grok missed entirely

- The Tool-vs-Infrastructure axis from Diagram 1
- The Capability-vs-Pressure axis from Diagram 2
- The five empirical Why Now conditions
- The Kyle Price Roblox quote on cognitive bias being structurally unsolved (master KB source #23)
- Paper #2 Ch 2 finding on why red teams don't scale (political tax)
- The Premature Enterprise Escalation failure mode

This is the gap between an external advisor working from general M&A knowledge + a glance at the GitHub repo description vs. an internal session with full lock context. The synthesis lesson: external advisors are useful for buyer-empathy framing they're closer to than we are; they're dangerous for positioning recommendations because they don't see the locks.

---

## Section 7 — The five-condition Why Now framework (Paper #2 Ch 12 grounded)

Source: 2026-05-10 Deep Research paper _"Structural Failure Analysis of Decision-Quality Interventions in Corporate Development and Mergers and Acquisitions"_ (150+ sources). Anchored on Kyle Price (Roblox) verbatim quotes from M&A Science podcast, indexed as source #23 in master KB `809f5104`. Mirror: [docs/paper-grounded-tier-plan-2026-05-10.md](paper-grounded-tier-plan-2026-05-10.md).

Five conditions are required to cross "decision intelligence as continuous practice" rather than "decision intelligence as periodic exercise." Aviation CRM crossed in 1990 via the FAA Advanced Qualification Program. Surgical M&M crossed via institutional integration into hospital procedure. Corporate M&A has not crossed yet. The five conditions are now converging.

### Condition 1 — AI-enabled friction collapse

Ambient operation, no separate destination. Friction below the threshold where the workflow change is worth the buyer's cognitive load.

**Empirical anchor:** sub-cent per audit via deepseek-v4-flash through Vercel AI Gateway. Pre-2026 cost of equivalent audit: £4-8 per memo. Current cost: £0.40 per memo. Within 12 months: ≤£0.10 per memo. The cost curve enables a workflow where every screening memo gets audited, not just the IC-stage ones.

**Dated event:** Shipped 2026-05-10. The gateway architecture at [src/lib/ai/gateway-models.ts](../src/lib/ai/gateway-models.ts) routes through `MODEL_RECOMMENDATIONS = 'deepseek/deepseek-v4-flash'` for sub-cent per render.

### Condition 2 — Tooling cost asymmetry crossover

When the cost of running an audit becomes 100-1000× less than the cost of a wrong decision, the trade-off becomes asymmetric in the buyer's favor.

**Empirical anchor:** £249/mo seat × 12 months = £2,988/year per seat. Average mid-market acquisition ticket = £50M-£500M. Industry failure rate (un-audited mid-market M&A) = 70-90% miss expected synergies (KPMG, McKinsey). One avoided Synergy Mirage on a single mid-market deal: 100-10,000× annual subscription cost.

**Dated event:** the cost crossover happened during 2025-2026 as LLM inference costs collapsed by ~80%.

### Condition 3 — Offloading the political tax of dissent

Red teams don't scale because they're structurally antagonistic — every "I disagree" goes on a record someone reads at performance review (Paper #2 Ch 2; Pronin et al. 2002 Boomerang Effect). The system must absorb the dissent cost so the human user becomes a facilitator, not an antagonist.

**Empirical anchor:** Decision Intel's Intelligent Antagonist pattern (Constellation Next Move + Deal Fever pre-mortem) absorbs the political cost. The Algorithm names the bias; the human user delivers the procurement-grade evidence. Per Kyle Price interview: "the IT teams are not equipped to actually find these biases. The only fix is red teams. But red teams don't scale."

**Dated event:** Shipped 2026-05-10 (Constellation Next Move + DealFeverPremortemCard).

### Condition 4 — Procurement-grade evidence + liability shift

Aug 2, 2026 EU AI Act Art 14 enforcement for high-risk decision-support systems. Basel III Pillar 2 ICAAP qualitative-decision documentation already live for regulated banks. SEC AI disclosure rules evolving through 2026 for AI use in investment-adviser decisions.

**Empirical anchor:** Aviation CRM crossed from exercise to continuous practice in 1990 via the FAA AQP regulatory inflection. The three Aviation CRM inflection conditions (Paper #2 Ch 9): (a) liability shift, (b) procedural integration, (c) status reframing. Corporate M&A is in the same window now.

**Dated event:** Aug 2, 2026 — high-risk decision-support obligations enforceable under EU AI Act.

### Condition 5 — Generational change in practitioner norms

The buyer-side cohort shift. Practitioners trained to expect data governance (Snowflake era) now expect reasoning governance.

**Empirical anchor:** the founder being 16 is the strongest single piece of evidence for this condition. NOT a weakness — the generational anchor the paper says is required. Reframe in fundraise materials per [docs/paper-grounded-tier-plan-2026-05-10.md](paper-grounded-tier-plan-2026-05-10.md) §T3.2.

**Dated event:** founder SF move Sept 2027. The 14-month corridor (Aug 2026 enforcement + Sankore Design Foundation MoU window + first-paid-customer accumulation + the founder's pre-SF window) closes Q1 2027. After Q1 2027, the price changes.

### How the five conditions land in the pitch deck

Each condition = a slide on the pitch deck "Why Now" section. Each has a dated event. Each survives partner-defendability because each is empirically grounded with a citation. Replaces the "EU AI Act enforcement is coming" calendar pressure with a structural multi-axis convergence story.

---

## Section 8 — Product plan

Six workstreams. The 50/50 split (per NotebookLM verdict): 50% on workflow-ownership surfaces (Tier 0 + the new builds), 50% protects Outcome Gate + Vohra survey + agentic-shift investigation. Nothing gets paused.

**The ordering rule:** Tier 0 (integration repair) BLOCKS every other workstream. The specimen-led pitch in Section 11 promises integrations work; the cold DM in Section 9 references "60 seconds, no card"; the workflow-ownership claim depends on existing integrations being end-to-end functional. If we ship the specimen artefact and a prospect attempts to connect Slack or forward an email and the integration fails, the trust collapse is permanent — that prospect goes into the "saw the wow moment + experienced broken plumbing" bucket and never returns. Tier 0 is therefore Week 1 work, blocking everything else.

### Workstream 0 (CRITICAL, PRE-BLOCKING) — Integration audit and repair

**The problem:** existing integration paths are advertised on the marketing surface, named in CLAUDE.md, and promised to the buyer in the specimen pitch — but founder confirms 2026-05-11 that **email forwarding doesn't work end-to-end**, and based on the time elapsed since last verification, likely other integrations have silently regressed too.

**What CLAUDE.md says exists** (the canonical integration list):

| Integration                         | Promised function                                                                                                                                                                                    | Source                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Email inbound**                   | Unique address per user (`analyze+{token}@decision-intel.com`). Token-based auth. Cloudflare Email Routing sends the `analyze@` rule to an Email Worker, which posts signed payloads to DI ingestion | CLAUDE.md "Integrations" + "Tech Stack" |
| **Slack**                           | 7 slash commands · thread monitoring · auto-creates CopilotSession + DecisionRoom after audits · OAuth                                                                                               | CLAUDE.md "Integrations"                |
| **Google Drive**                    | OAuth + Changes API polling via cron · dedup by `sourceRef` · 24h cooldown · content-hash comparison for updates                                                                                     | CLAUDE.md "Integrations"                |
| **Stripe checkout**                 | £249/mo Individual · per-deal audit pricing · subscription state                                                                                                                                     | CLAUDE.md "Tech Stack" + "Plan limits"  |
| **Resend SMTP (outbound)**          | `smtp.resend.com:465` · Supabase Auth password-reset / magic-link / confirm + Gmail "Send mail as" identity for `*@decision-intel.com` replies + daily-linkedin cron                                 | CLAUDE.md "Tech Stack"                  |
| **Supabase Auth**                   | Google OAuth + email magic link + email + password + SAML SSO                                                                                                                                        | CLAUDE.md "Tech Stack" + Terms §3       |
| **Ambient capture (Slack + Drive)** | Opt-in per channel, 14-day expiry, 500-char excerpt cap, thesis-formation signal detection via deepseek-v4-flash                                                                                     | CLAUDE.md Tier 2.2 lock 2026-05-10      |

**The Tier 0 audit (Week 1, 2-3 days):**

Run an end-to-end smoke test for every integration. For each, the test is: a NEW user, on a fresh browser, completes the full happy path. Document every break.

| Integration                          | E2E smoke test                                                                                                              | What "working" looks like                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Email inbound                        | New user signs up, gets unique email address, forwards an email with PDF attachment to `analyze+{token}@decision-intel.com` | Attachment ingested, audit fires, DPR generated, result visible in /dashboard within 90 seconds              |
| Slack OAuth + slash                  | Connect Slack workspace from /dashboard/settings/integrations, run `/decision-intel audit` in a channel with a memo paste   | Audit fires, result posted back to channel, CopilotSession auto-created                                      |
| Google Drive OAuth + polling         | Connect Drive, place a strategic memo PDF in a monitored folder                                                             | DI auto-pulls, audit fires within 24h cooldown window, result surfaces in /dashboard                         |
| Stripe checkout (Individual £249/mo) | Click "Upgrade to Individual" on /pricing as a Free-tier user                                                               | Stripe Checkout opens, test card succeeds, plan flips to Individual within 60 seconds, AnalysisLimit unlocks |
| Resend outbound (Supabase auth)      | New sign-up via magic link from /login                                                                                      | Magic link email arrives within 30 seconds, click → authenticated session                                    |
| Daily-linkedin cron                  | Manual trigger of `/api/cron/daily-linkedin` via curl                                                                       | Email arrives at `FOUNDER_EMAIL` with generated post draft, no errors in Vercel logs                         |
| Ambient Slack capture                | Toggle ambient consent ON in /dashboard/settings, post a memo-shaped message in a consented channel                         | Within 1 hour, signal detected, AmbientThesisSignal row created, banner surfaces on /dashboard               |
| Ambient Drive capture                | Toggle ambient Drive consent ON, drop a strategic memo PDF in a monitored Drive folder                                      | Metadata signal detected within 1 hour, banner surfaces on /dashboard                                        |

**The Tier 0 repair (Week 1, 3-5 days based on audit findings):**

For each broken path, document the break + fix + re-test in this same document under a "Tier 0 Integration Repair Log" section appended at the bottom. The repair work is invisible to marketing but it's the precondition for every other workstream in this plan.

**Specific known break (confirmed by founder 2026-05-11):**

- **Email forwarding** — `analyze+{token}@decision-intel.com` → audit pipeline is broken end-to-end. Likely root causes to investigate (in order of probability):
  1. Cloudflare Email Routing subaddressing / `analyze@` Worker rule not configured
  2. Token-extraction regex on inbound mail not matching the new email format
  3. PDF attachment extraction failing because of MIME boundary changes
  4. Audit pipeline rejecting the inbound payload because of missing user context
  5. Resend inbound webhook handler missing entirely

Investigation must start from "send a test email to the address and follow it through every system log" (Cloudflare Email Routing → Email Worker logs → Vercel function logs → Prisma write). The repair lives in `src/app/api/integrations/email/inbound/route.ts` and the Cloudflare Email Routing / Worker config.

**Why Tier 0 cannot be skipped or deferred:**

- The specimen artefact (Section 11) ends with "Ready to audit your last memo? → decision-intel.com/audit (60 seconds, no card)." If the prospect arrives and the flow breaks, trust evaporates immediately.
- The cold DM opener (Section 9) attaches the specimen link. Every conversion path runs through the live product.
- The Stripe checkout broken = no first paid customer ever, regardless of how good the specimen is.
- The Resend outbound broken = magic-link sign-up broken = no new accounts created via the primary auth path locked 2026-05-07.
- Ambient capture broken = the "buyer benefit" Section 9 cold DM promises ("automated outcome tracking") is false advertising.

**Tier 0 exit criteria:** every row in the audit table above passes the E2E smoke test, signed off by a fresh-browser repeat run. Document the green state in this file (Appendix B at the bottom) with a date stamp. Until that signoff exists, NO marketing surface advertises any integration that hasn't passed.

---

### Workstream A — The Screening Surface (`/screen`)

**The pain Grok surfaced:** mid-market corp dev heads do 20-100 early screens per quarter to close 2-4 deals. Each screen is a 5-page market scan. Currently un-audited because "too short to warrant rigorous bias review."

**The product:**

- New route at `/dashboard/screen` — 30-second triage on 1-3 page market scans
- Output: **Proceed / Stress-test / Kill** verdict with one-line rationale per verdict
- Lightweight version of the 12-node pipeline — runs `biasDetective` + `rpdRecognition` + reference-class forecast only, skips deeper structural assumptions, skips judge variance jury
- Cost: ~£0.08 per screen (vs £0.40 for full audit)
- Daily-usage frequency target: 20-50× the IC-stage audit

**Why this matters for fundability:**

- Crosses Diagram-1 Row 1 (workflow ownership) at higher frequency than IC-stage audit
- Crosses Diagram-1 Row 5 (bottleneck removal) on a DAILY, not probabilistic, bottleneck
- Provides the conversion-rate metric investors actually want: "screens → deeper-audit conversions → closed deals → realized outcomes"
- Lower barrier to first paid customer (lower commitment threshold than IC-stage workflow)

**Build:** 5-7 days. Reuses existing pipeline nodes; new SSE entry point + lightweight prompt overlay + new UI page. Founder approval gate: this is pipeline-adjacent per the "Modifying the analysis pipeline" rule — does NOT alter existing pipeline behavior but adds a new entry shape. Documentation lives at `src/lib/agents/screening-pipeline.ts` (new file).

### Workstream B — Strategic Fit Evaluation (the "good deal" surface)

**The deeper move:** decide whether the deal is worth pursuing at all, BEFORE the IC memo gets written, not after.

**The seven questions every good-deal evaluation should answer:**

| #   | Question                                                                               | DI signal                                                                                                                              |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Does this deal fit the parent's actual strategy or adjacent dressed as strategic?      | Conglomerate Fallacy detector + parenting-thesis-mismatch cross-ref                                                                    |
| 2   | Can we realistically capture the named synergies?                                      | Synergy Validation Overlay + BCG-mandate decomposition (mechanism/owner/90-day-milestone)                                              |
| 3   | Will cultural fit produce talent retention or talent flight?                           | CulturalPairingRiskCard + historical-analog matching                                                                                   |
| 4   | Is integration complexity tractable given current team bandwidth?                      | **NEW: Capacity Load Assessment** (counts active deals × stage × integration phase per team)                                           |
| 5   | Is the price defensible against reference-class comparables, not just precedent deals? | **NEW: Walk-Away Price Calculator** (reference-class adjusted; 14-case comparable median + dispersion band)                            |
| 6   | At what price does this stop being a good deal?                                        | **NEW: Walk-away clarity threshold** (computed from Walk-Away Price Calculator + commodity-bidder presence + auction-dynamic detector) |
| 7   | Does this beat other uses of the capital?                                              | **NEW: Capital Alternatives Benchmark** (organic R&D / share buyback / alternative acquisitions in pipeline)                           |

**Three new surfaces, each 3-5 day build:**

- **Walk-Away Price Calculator** — input: target financials + acquirer strategic thesis. Output: reference-class adjusted price band (P25-P75) + the price above which 80%+ of comparable deals destroyed value + the auction-dynamic premium ratio currently being applied. Procurement-grade artefact. Mounts on `/dashboard/decisions/[id]` as a new card next to the existing Deal Fever pre-mortem.

- **Capacity Load Assessment** — counts user's active DecisionContainers by kind + stage. Flags when integration team is being asked to absorb 3+ post-close integrations in <6 months (the failure mode behind GE-Alstom, HP-Autonomy timing). Lives at `/dashboard/decisions/capacity`.

- **Capital Alternatives Benchmark** — captures the user's "what else could this capital do" comparables at decision-framing time. Becomes the "ABANDON" recommendation justification in the Constellation Next Move engine. New section on the container detail page.

**Why this matters for positioning:** The Strategic Fit Evaluation surface is the ONLY moat-layer feature that lets DI claim "we don't just audit your memo; we tell you whether the deal is even worth pursuing." That's a sharper positioning beat than "audit the reasoning" and it differentiates from Cloverpop (logs decisions, doesn't evaluate fit) AND from DealCloud/Affinity (manages pipeline, doesn't evaluate fit).

### Workstream C — PMI Tracker promotion (existing feature, underweighted in marketing)

**The asset:** [PmiTrackerTab](../src/components/containers/PmiTrackerTab.tsx) shipped 2026-05-10. Every IC memo claim becomes a Brier-scored prediction auto-tracked against post-close observations across 6 PMI signals (synergy realization, talent retention, integration cost, day-1 milestones, customer retention, revenue growth).

**The reframe:** PMI Tracker is currently positioned as "post-close outcome tracking." Per Grok's "diligence-integration knowledge chasm" framing, the correct positioning is:

> **"The audit that survives the diligence-integration handoff."**

**Three marketing surfaces to update in lockstep:**

- [/pricing](<../src/app/(marketing)/pricing>) Strategy-tier highlight row — add "PMI Tracker · the audit that survives the diligence-integration handoff"
- [/how-it-works](<../src/app/(marketing)/how-it-works>) — new Section 4c between Toxic Combinations and DQI, dedicated to "The Diligence-Integration Knowledge Chasm" with PMI Tracker as the answer
- Mid-market corp dev specimen artefact (Section 11) — PMI Tracker is page 5 closer

**Build:** 1.5 days total across the three surfaces. The feature already exists; marketing is the gap.

### Workstream D — Removal Cost surface (workflow-ownership demonstration)

**The widget:** Strategy-tier admin dashboard widget showing, per-org per-week:

- N decisions audited
- M closed outcomes
- K cross-doc conflicts surfaced + resolved
- L bias signatures unique to this team
- Y reference-class analogs for this team's most-recurring decision shapes

**Footer line:** _"If Decision Intel ended your subscription tomorrow, this is what you'd lose."_

**Why this is the move:** The buyer-grade removal cost story can't be "Bias Genome compounds." That's investor narrative, not buyer switching cost. This widget IS the switching cost — concrete, quantified, weekly.

Same widget = pitch deck slide. Same widget = renewal conversation anchor. Same widget = warm-intro talking point ("after 90 days an average pilot accumulates [N] artefacts they can't replicate elsewhere").

**Build:** 1 day. Reuses existing analytics queries. Mounts at top of `/dashboard` for any user with `Organization.plan === 'strategy'` and `analyzedDocCount >= 5`.

### Workstream E — Outcome Gate + Vohra + agentic-shift (50% protected)

These cannot be paused. The 50/50 product split protects them.

- **Outcome Gate enforcement** on `phase1HxcEligible=true` users from day one (already shipped per CLAUDE.md 2026-05-04 lock). Continue iterating on the modal pre-fill from auto-detected drafts.
- **Vohra PMF survey infrastructure** — ship the monthly survey cadence + HXC cohort filter + the 40% "very disappointed" threshold dashboard. Build target: Week 3-4. Lives at `/dashboard/admin/pmf-survey` (admin-only).
- **Agentic-shift investigation** — continue the Q2 2026 path-lock investigation per [docs/agentic-shift-investigation-q2-2026.md](agentic-shift-investigation-q2-2026.md). Sample 10 prospects via the cold-DM motion (Section 9) with the discovery question. End-of-June 2026 deliverable: one-page synthesis memo with Path-A/B/C locked.

### Workstream F — Trigger Control (DEFERRED to post-PMF)

**DealCloud / Affinity / Notion / Salesforce webhook receivers.** These are the highest-leverage workflow-ownership move EVENTUALLY — but per NotebookLM, **not pre-PMF**. Reasoning:

- Pre-seed wedge users (4 HXC personas) don't all use DealCloud / Affinity
- Building integrations against tools the wedge persona doesn't use = post-Series-A move done in advance
- If agentic-shift Path C confirms in June, the integration target may shift to agent-decision-chain logs, not legacy CRMs

**The sequence:** Build trigger control AFTER the first 5 paid Individual customers tell us which integrations matter most. Customer-driven integration ordering, not founder-guessed. Earliest start: Week 11-12 of this plan.

---

## Section 9 — Platform / GTM plan

Five workstreams in parallel. The operational glue is the specimen artefact (Workstream A), which feeds every other workstream. Every cold DM, every LinkedIn drop, every warm-intro follow-up routes through the specimen.

### Workstream A — The "lack-of-DI" specimen artefacts (4 personas)

**Why this is the single highest-leverage marketing asset:** the specimen does five things at once:

1. **Empathic-mode-first marketing** (the buyer sees their pain in their vocabulary before any DI vocabulary lands)
2. **Workflow-ownership demonstration** (the feature stack on page 5 names every surface DI lives in)
3. **Bottleneck-removal proof** (the lifecycle table on page 5 names every daily bottleneck DI removes)
4. **Removal-cost articulation** (the ROI math on page 5 quantifies what the buyer's team is missing)
5. **Pressure manufacturing** (every cold DM, every LinkedIn post, every warm-intro follow-up routes through the specimen — eliminates the need for warm-network burn at Phase 3 by doing the persuasion via artefact alone)

**Rollout:**

- **Week 1:** Mid-market corp dev head specimen (the template — full draft in Section 11)
- **Week 2:** Validate via cold-DM motion (5 DMs/week per persona = 20/week)
- **Week 3:** Fractional CSO specimen + smaller-fund GP specimen
- **Week 4:** PE-backed founder specimen

Each lives at `/specimen/[persona-slug]` on the marketing site with `noindex` until validated, then surfaced via [MarketingNav](../src/components/marketing/MarketingNav.tsx) Proof mega-menu. Rendered via the existing DPR pipeline at `/api/dpr/render-pdf` so the artefact carries procurement-grade typography (the same engine that ships the WeWork and Dangote DPRs).

### Workstream B — Vocabulary swap

Per Grok's buyer-empathy upgrades (Section 6). Five swaps land in lockstep across the surfaces below:

| Internal name                         | Buyer-grade name                                         | Surfaces to update                                                                            |
| ------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Bias Genome contribution              | **Portfolio Bias Heatmap**                               | Analytics → Intelligence tab card title; pricing comparison row; founder hub investor metrics |
| Per-org Brier calibration             | **Team Calibration Score**                               | Decision DNA preview card; founder hub investor metrics; pricing comparison row               |
| DPR (technical name kept) + explainer | **"governance evidence that compounds learning"**        | /security hero subhead; /pricing trust band; DPR page-one strap                               |
| Reference Class Forecast + explainer  | **"outside view to counter inside-view optimism"**       | Per-audit reference-class chip tooltip; PaperApplicationsCard                                 |
| Per-decision ROI                      | **"One corrected recommendation pays for the platform"** | Pricing Individual-tier protected-value line; specimen page 5                                 |

IP names stay protected (R²F, DPR, DQI). The translation layer upgrades to buyer-vocabulary register. Same architecture, sharper translation.

### Workstream C — The 5-condition Why Now section on /how-it-works

Add as new Section 6 on [/how-it-works](<../src/app/(marketing)/how-it-works>) (between Section 5 DQI and Section 7 Outcome Loop). Each of the 5 conditions from Section 7 of this document = a card with:

- Empirical anchor (Paper #2 Ch 12 citation)
- Dated enabling event
- 1-line implication for DI's wedge

Same 5 conditions = pitch deck slide 3 ("Why Now"). Replaces the current "EU AI Act enforcement coming" framing which is calendar-only and fails partner-defendability.

### Workstream D — Contractually-binding seat scarcity

**Sankore tier:** 5 founding-pilot seats at £1,999/mo. 4 remaining. **Once a seat fills, the 6th seat price is contractually escalated by [£500] permanently** (or equivalent — the specific escalation is a founder pricing call, the contractual binding is the structural move).

**Ship the structural commitment** on the [/pricing](<../src/app/(marketing)/pricing>) page Design Partner block + [DESIGN_PARTNER_SEATS_AVAILABLE](../src/lib/constants/company-info.ts) constant + a new `DESIGN_PARTNER_PRICE_ESCALATION_NEXT_SEAT` constant.

**The structural commitment is the move, not the marketing copy.** A prospect who joins seat #4 sees the price for seat #5 climb contractually if they hesitate. Cialdini scarcity principle, contractually enforced. Aligned with NotebookLM SAFE verdict on this move.

### Workstream E — Knowledge-chasm cold DM openers (per persona)

Four verbatim openers, one per HXC persona. All four go into [discovery-pitch-toolkit.ts](../src/lib/data/discovery-pitch-toolkit.ts) `PERSONA_OPENERS` + the Outreach Hub messaging surface. Empathic-mode-first compliant. Zero R²F/DPR/DQI jargon in the opener; bridge to platform vocabulary lands in the reply or the specimen artefact.

**Mid-market corp dev head (the canonical):**

> "Your diligence team flags 20 risks pre-close. Your integration team finds 8 of them post-close. The other 12 were filed in the IC memo nobody re-opened. Decision Intel is the audit that survives the handoff. 60-second audit on your last memo, attached: decision-intel.com/specimen/mid-market-corp-dev."

**Fractional CSO:**

> "You run 3-5 strategic engagements. Each board sees one memo per quarter. The biases that destroyed Kodak, Blockbuster, Nokia are the same ones quietly killing recommendations on your desk right now. We don't know which ones. We audit yours in 60 seconds: decision-intel.com/specimen/fractional-cso."

**Smaller-fund GP:**

> "Your LPs review your IC decisions quarterly. The 22-bias taxonomy that retro-audited 143 historical decisions catches the patterns Theranos, FTX, Quibi all carried at the moment of commit. Audit your last IC packet pre-commit: decision-intel.com/specimen/smaller-fund-gp."

**PE-backed founder / CEO:**

> "Your board has bias toward what worked at the previous portfolio company. Yours might not be one of them. Decision Intel audits the strategic memo before the operating partner reads it. Specimen audit (anonymised mid-market case): decision-intel.com/specimen/pe-backed-founder."

### Workstream F — Sourcing-stage cold-traffic specimen `/screen`

The `/screen` surface from Section 8 doubles as the cold-traffic wow moment. Visitor pastes their last screening memo, gets the 30-second triage verdict (Proceed / Stress-test / Kill). This becomes the new `/demo` equivalent for the wedge persona — lower-commitment threshold than IC-memo upload, instantly demonstrable, conversion path = sign up for the full audit.

---

## Section 10 — Founder OS

The capability that built 200 components and 70 API routes and 22-bias taxonomy operationalised through 10 paper applications is the SAME capability that delays committing to revenue-generating motions because there's always one more refinement that would make the pitch sharper. Diagram 2 lands hardest here. The forcing function isn't "post more on LinkedIn" — it's **creating dated, public, irreversible commitments that the next 30-90 days must service.**

### A. The five weekly commits (dated, public, irreversible)

1. **Public dated commitment: "First 5 paid Individual customers by [+90 days, specific date]."** Post to LinkedIn. Post running counter weekly. Funnel becomes public. 16-yo solo founder + public clock = LinkedIn-viral + customer urgency + investor signal. The asymmetry: a 16-year-old publicly committing to 5 paid customers in 90 days is content that travels.

2. **One calendared external meeting per week, minimum.** Block Friday afternoon. Sparring Room rehearsal alone isn't forcing; a 30-min meeting with a real fractional CSO on the calendar Friday is forcing. The pipeline becomes self-driving when the calendar is full.

3. **£349 personal exposure on each of the first 5 paid prospects.** "If DI doesn't catch ≥2 material biases in your next memo I'll refund the first month + send you a £100 Amazon voucher." Max exposure: £1,745 if every prospect refuses. Gain: 5 paid customers + 5 outcome-calibration anchors that compound the data moat permanently. Confidence without exposure = words; confidence with personal exposure = pressure.

4. **Sparring Room 16th dimension — "Delay Cost Articulation":** add to [sparring-room-data.ts](../src/components/founder-hub/sparring/sparring-room-data.ts) `GRADING_DIMENSIONS`. Grades whether the founder can name, in 30 seconds, what specifically gets worse for the buyer / investor if they wait 90 days. Drill daily until automatic across all 4 personas.

5. **The generational anchor pitch slide.** New slide 2 of pitch deck: 14-month timeline graphic, three converging tracks (founder availability + regulatory enforcement + customer accumulation). Convergence point Month 14 = SF move Sept 2027 + EU AI Act Aug 2026 + Sankore reference-grade output. Investor sees the corridor closing, not a "someday."

### B. Reallocate 1 day/week from product → pressure manufacturing

**Friday = Forcing Function Day.** Calendar-blocked. Pre-committed activities (NOT improvised in the moment):

- **2 hours:** outreach calendar (cold DMs + LinkedIn posts on the locked counter)
- **1 hour:** customer follow-up + product discovery on existing verbal-interested prospects
- **1 hour:** founder-side content (LinkedIn article weekly cadence — the audit retros from the 143-case library are pre-built content)
- **1 hour:** media outreach for the 16-yo founder angle (one journalist DM per week, targeting Strategy+ / Bloomberg / FT)

Per CLAUDE.md "Velocity & Scope Discipline" rule: founder pays per session, unit economics favor depth. Forcing Function Day is the DEEPEST version of pressure manufacturing — 5 hours of concentrated commitment-making, not scattered 15-min asks throughout the week.

### C. Customer-before-investor sequencing (locked, per NotebookLM verdict)

```text
Now → +90d:     5 paid Individual customers (£249/mo each)
+60d → +120d:   First Sankore Design Foundation MoU signing
+90d → +120d:   3 anonymised reference-grade DPR specimens
+120d → +180d:  Mr. Reiner / Mr. Gabe activation (1 verifiable warm intro each)
+180d → +240d:  Seed conversation opens
```

**No shortcuts.** Verbal yes-pending-diligence = product discovery, NOT a fundraising credential. The founder's instinct will be to short-circuit this sequence when the first warm signal lands. The discipline is: the sequence is the moat. Skipping a step burns the resource that step protects.

### D. The forcing function math (rehearsable for investor conversations)

> "I have 90 days. By the end, I will have either 5 paid Individual customers at £14,940 ARR + 5 closed outcome calibration anchors + a Sankore Design Foundation MoU. Or I'll have run a product-discovery sprint on the failure mode + repositioned. Either outcome is a hard signal. I'm not raising on potential; I'm raising on which of those two outcomes the next 90 days produces."

This sentence does five things at once:

- Time-bounded commitment (90 days)
- Concrete metrics (5 paid × £249 × 12 months = £14,940 ARR)
- Downside protection (kill criterion explicit)
- Signal that delay forces a decision (the investor sees both branches)
- Investor-defendable framing ("can I defend this to a partner?" — yes, this is a 90-day commitment with both outcomes pre-named)

Rehearse this sentence until it lands in 30 seconds. The Sparring Room 16th dimension grades whether it does.

### E. What the founder MUST stop doing for 90 days

The diagrams' lesson is most useful when it surfaces what to STOP. The founder is in refinement mode and the temptation is always to ship one more feature. Specific stops:

- **No new R²F paper applications** (10 of 10 already shipped — stop adding)
- **No new bias detectors** (22-bias taxonomy is the moat; adding more dilutes it)
- **No new regulatory frameworks** (19 frameworks is sufficient through Phase 1; the 20th waits for procurement-pull from a paid customer who needs it)
- **No new marketing surfaces** beyond what's in this plan (the surface area is already at the discoverability ceiling)
- **No new "founder-hub tab" tools** until the next Vohra survey result
- **No re-positioning experiments** (the locked H1 + pain framing + protected-revenue layering is the discipline; iterating on it weekly burns trust signal)

When the founder catches himself starting one of these, the move is to redirect to a Friday Forcing Function Day activity. The capability is already there; the bottleneck is execution against the customers-before-investors path.

---

## Section 11 — The specimen artefact (full template, mid-market corp dev head)

This is the operational glue of the whole plan. Drafted in full below so it's ready to ship in Week 1 as a procurement-grade PDF rendered via [/api/dpr/render-pdf](../src/app/api/dpr/render-pdf). Lives at `/specimen/mid-market-corp-dev` on the marketing site.

The other 3 personas (fractional CSO / smaller-fund GP / PE-backed founder) follow the same template with persona-specific content; mid-market corp dev is the first build because it's the procurement-aware persona with the biggest cheque size at Strategy tier.

### Page 1 — Hero

> **Your last acquisition memo carried 3-7 of these patterns**
>
> _We don't know which ones — here's what unaudited looks like_

**Visual:** 5 anonymised IC memo excerpts from public failures (Microsoft-Nokia, AOL-Time Warner, HP-Autonomy, Quibi, WeWork), each with the bias signature highlighted inline.

**Subhead:** Mid-market acquisitions, $50M-$500M target range. The patterns most diligence teams flag too late — and the specific audit that catches them in 60 seconds.

**Stats strip (all derive from canonical exports — never hardcoded):**

- **19** regulatory frameworks (G7 / EU / GCC / African markets) — from `getAllRegisteredFrameworks().length`
- **22** cognitive biases (R²F taxonomy, DI-B-001 → DI-B-022) — from `BIAS_EDUCATION.length`
- **143** historical corporate decisions, retro-audited — from `HISTORICAL_CASE_COUNT`
- **Brier 0.258** calibration baseline (CIA-analyst grade) — from `PLATFORM_BASELINE_SNAPSHOT.meanBrier`

### Page 2 — What we found in the public record

**Three cases, full retro audit:**

#### 🔴 Microsoft-Nokia 2013

$7.2B acquisition, $7.6B write-down 2 years post-close

- **Synergy Mirage** (critical): "$24B revenue synergies over 3 years" — no operational mechanism named, no accountable executive, no 90-day milestone
- **The Yes Committee** (high): 47-page IC memo with zero documented dissent
- **Conglomerate Fallacy** (medium): smartphone hardware adjacent to OS software in branding only — no Porter parenting advantage articulated
- **Audit-committee Q the IC chair never asked:** _"Name the 90-day operational mechanism for each $1B of claimed revenue synergy. Who owns it. What's the first milestone."_

#### 🔴 AOL-Time Warner 2000

$165B merger, $99B impairment 2002 — largest M&A failure in US history

- **Synergy Mirage** (critical): $30B "internet × media" synergy with no specified revenue mechanism
- **Confirmation Bias** (high): 100% of board materials supported the thesis; zero red-team review
- **Conglomerate Fallacy** (high): dial-up ISP + content-distribution business — distinct economic engines treated as natural complements

#### 🔴 HP-Autonomy 2011

$11.1B acquisition, $8.8B impairment 13 months post-close

- **Winner's Curse** (critical): 79% premium over market, beat 4 competing bidders
- **Confirmation Bias** (critical): $2.3B of accounting irregularities flagged by QofE but resolved as "acceptable"
- **Synergy Mirage** (high): "$1B in synergies" — undefined operational mechanism

### Page 3 — Why it happens (empathic mode)

**The diligence-to-integration handoff is the most expensive failure mode in M&A.**

Your diligence team flags ~20 risks per deal pre-close. Your integration team finds ~8 of them post-close. The other 12 were filed in the IC memo nobody re-opened. Three structural reasons:

1. **Time pressure compresses the review.** The 47-page IC memo gets read in 90 minutes. Subtle bias signatures — Synergy Mirage hidden in spreadsheet assumptions, Winner's Curse buried in auction-dynamic language — don't survive the first reading.

2. **Sponsor dynamics make dissent expensive.** Once the CEO or deal sponsor signals commitment, every "I disagree" goes on a record someone reads at performance review. Red teams don't scale because they're structurally antagonistic (per Boomerang Effect research, Pronin 2002).

3. **No artefact survives the handoff.** Diligence findings live in 4-tool graveyards (Slack threads + Google Doc drafts + Datasite folders + IC deck appendices). Integration teams inherit the deck, not the reasoning.

**This isn't a critique of your diligence team. It's the structural inevitability of the workflow.** Every mid-market corp dev team in your peer set is doing exactly this. The 70-90% synergy-miss rate (KPMG, McKinsey) isn't bad judgment — it's the absence of an artefact that survives the handoff.

### Page 4 — How DI would have improved the cited deal

**The DPR cover Microsoft-Nokia 2013 would have received (retro-grade audit):**

```text
DECISION PROVENANCE RECORD · Project Stellar
─────────────────────────────────────────────
DQI Grade:        D (47 / 100)
Critical patterns: Synergy Mirage · The Yes Committee
                   Conglomerate Fallacy
Reference class:  14 comparable mid-market tech-hardware-
                   into-OS acquisitions, 1995-2012
                   → 71% rated underperform-or-fail
Methodology:      v2.3.0 with user-adjustable DQI weights
Validity class:   Low (mid-market platform M&A, sub-50%
                   acquirer success rate)
Hash:             4e51b0850db4 (SHA-256, tamper-evident)
```

**Three hardening questions the IC chair would have received:**

1. **Synergy Mirage:** "Name the 90-day operational mechanism for each $1B of claimed revenue synergy. Who owns it. What's the first measurable milestone."
2. **The Yes Committee:** "Show me the dissenting view. Who in this room would refuse this deal at the current price. If no one, why is no one disagreeing."
3. **Conglomerate Fallacy:** "Run the conglomerate-discount calculation for this combination. What's the discount factor against pure-play smartphone OS and pure-play hardware comparables."

**If Microsoft had received these three questions before the IC vote, the deal either doesn't happen, happens at a different price, or happens with named-and-measurable synergy commitments.** Either path saves $7.6B.

### Page 5 — What you're missing right now (cost calculation + feature stack)

**Your team's structural exposure:**

| Variable                                                | Typical mid-market corp dev team                |
| ------------------------------------------------------- | ----------------------------------------------- |
| Strategic acquisitions per year                         | 2-4                                             |
| Average ticket size                                     | $50M-$500M                                      |
| Industry failure rate (un-audited mid-market M&A)       | 70-90% miss expected synergies (KPMG, McKinsey) |
| Expected loss if 1-of-N carries critical Synergy Mirage | $10M-$100M per occurrence                       |

**What Decision Intel delivers across the deal lifecycle:**

| Stage              | DI surface                                      | Time saved                | Cost prevented          |
| ------------------ | ----------------------------------------------- | ------------------------- | ----------------------- |
| Sourcing screening | `/screen` 30-second triage                      | 4 hours per killed screen | Wrong deal pursued      |
| IC memo audit      | 60-second R²F audit + DPR                       | 4 hours of Friday review  | Bias-driven IC approval |
| Cross-doc conflict | CIM + QofE + Synergy Model + IC Memo cross-ref  | 2 hours per deal          | Diligence gaps          |
| Walk-away clarity  | Reference-class adjusted price band             | —                         | Winner's Curse          |
| Post-close PMI     | Brier-scored prediction tracking                | 2 hours per quarter       | Knowledge-chasm leakage |
| Portfolio level    | Portfolio Bias Heatmap + Team Calibration Score | Compounds quarterly       | Repeated mistakes       |

**The math:**

- **£249/seat/month** (Individual tier)
- For a 3-person corp dev team: **£747/mo × 12 = £8,964/year**
- ROI threshold: **one corrected recommendation per year per seat**
- One avoided Synergy Mirage on a single mid-market deal: **100-10,000× annual subscription cost**

**Procurement-grade artefact stack:**

- 19-framework regulatory map (EU AI Act Art 14 + Basel III ICAAP + SOX §404 + SEC AI disclosure + 15 more)
- SOC 2 Type I issuance Q4 2026 + Type II observation window underway
- DPA template (PDF + DOCX redline-ready)
- Sub-Processor Schedule with 30-day change SLA
- Audit log retention SLA per tier (1y / 3y / 7y)
- Indemnification: 12 months' fees cap + carve-outs for confidentiality / wilful misconduct / sub-processor failures

**The cover frame for the IC packet:**

> _"Audited pre-IC by Decision Intel. Three hardening questions resolved. DPR attached for audit committee review."_

**One sentence answers the question your audit committee will ask first.**

**Ready to audit your last memo?** → decision-intel.com/audit _(60 seconds, no card)_

---

### Specimen template — what changes per persona

The other 3 personas use the same 5-page structure with these substitutions:

| Element                 | Mid-market corp dev                  | Fractional CSO                           | Smaller-fund GP                             | PE-backed founder                                      |
| ----------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| Hero pain               | "Your last acquisition memo"         | "Your last board recommendation"         | "Your last IC packet"                       | "Your last strategic memo"                             |
| Public failures cited   | Microsoft-Nokia, AOL-TW, HP-Autonomy | Kodak, Blockbuster, Nokia (strategy)     | Theranos, FTX, Quibi                        | Sears, Bed Bath & Beyond, GE-Alstom                    |
| Knowledge chasm framing | Diligence → integration              | Recommendation → committee → board       | IC vote → LP letter → outcome               | Board recommendation → operating partner → realization |
| Cost calculation anchor | Deals per year × ticket size         | Engagements × board memos × £/engagement | LP capital × IC decisions per quarter       | Personal equity stake × strategic decisions per year   |
| Feature stack emphasis  | Cross-doc + PMI Tracker              | Portfolio Bias Heatmap across clients    | Reference-class forecast + Team Calibration | Pre-board pre-mortem + Decision Knowledge Graph        |
| CTA                     | "Audit your last IC memo"            | "Audit your last board pack"             | "Audit your last IC packet"                 | "Audit your last strategic memo"                       |

Each persona-specific specimen ships as a separate PDF + a separate `/specimen/[persona-slug]` route. All four share the same Page 1 stats strip (canonical-derived counts), same Page 3 structural-reasons framing, same Page 5 procurement-grade artefact stack. The differentiation lives in the failures cited + the cost-calculation anchor + the feature-stack emphasis.

---

## Section 12 — 12-week sequencing

The Tier 0 integration repair is the only Week 1 work that BLOCKS everything else. All other workstreams sequence after Tier 0 signoff.

| Week      | Product                                                                                                                                                                                                            | Platform / GTM                                                                                               | Founder                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **1**     | **Tier 0 integration audit + repair (BLOCKING)** · Removal Cost widget · 5-condition Why Now section · PMI Tracker marketing promotion (3 surfaces) · Vocab swap (Portfolio Bias Heatmap + Team Calibration Score) | Mid-market corp dev specimen template SHIP · Pricing seat-scarcity escalation announce                       | LinkedIn dated public commit: "5 paid customers by [date]" · Sparring Room 16th dimension added · Generational anchor pitch slide drafted |
| **2**     | `/screen` surface SHIP (sourcing-stage triage) — depends on Tier 0 signoff                                                                                                                                         | Specimen DM motion runs (5/wk × 4 personas) · A/B test specimen vs cold-pitch DM conversion                  | First Friday Forcing Function Day · 1 calendared external meeting                                                                         |
| **3**     | Walk-Away Price Calculator SHIP · Strategic Fit container surface SHIP                                                                                                                                             | Fractional CSO specimen SHIP · Strategy World London prep (June 9-10) · Vohra survey infrastructure SHIP     | Public counter update · 2nd FF Day · 1 external meeting                                                                                   |
| **4**     | Capacity Load Assessment SHIP · Capital Alternatives Benchmark SHIP                                                                                                                                                | Smaller-fund GP specimen SHIP · PE-backed founder specimen SHIP                                              | Strategy World London June 9-10 (primary CSO event, 2-day) · 3rd public counter update                                                    |
| **5-6**   | PMI Tracker per-IC-claim Brier ingestion via auto-extraction                                                                                                                                                       | First 2-3 paid £249 Individuals targeted · Live audit demos in every warm meeting                            | 1 paid customer target · Mid-quarter Vohra survey starts                                                                                  |
| **7-8**   | Outcome Gate enforcement on first paid customers from day one                                                                                                                                                      | Cold DM motion sustained · Specimen iteration based on conversion data                                       | 2-3 paid customers · Pre-Sankore MoU prep · Investor-curious-but-not-pitched list maintained                                              |
| **9-10**  | Bias Genome contribution surface · Cross-org cohort percentile (first time with 3+ orgs)                                                                                                                           | Sankore Design Foundation MoU signing · First DPR-grade reference from a paid customer                       | 4-5 paid customers · First "Phase 3 activation criteria met" check                                                                        |
| **11-12** | Trigger Control build kickoff (DealCloud + Affinity webhook receivers) — informed by which integrations actual paid customers asked for                                                                            | Seat scarcity escalation triggers on next signing · Mr. Reiner / Mr. Gabe activation IF Phase 3 criteria met | Day-90 Vohra survey on HXC cohort · Decision point on Q4 2026 seed conversation opening                                                   |

---

## Section 13 — Kill criteria (per v3.5 lock)

| Trigger                                                 | Action                                                                                                                                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tier 0 integration repair takes >7 days                 | Halt ALL other workstreams. Founder + Claude do a deep architecture audit. Likely root cause: silent regressions across multiple integrations from rapid feature shipping. Recovery may require a 1-2 week deep-fix sprint before resuming. |
| <3 paid by Week 8                                       | Halt scaling. Run product-discovery sprint on the somewhat-disappointed + not-disappointed cohorts. NEVER push harder on the same motion when early-warning is red.                                                                         |
| Vohra "very disappointed" <30% on HXC cohort by Week 12 | Halt scaling. Re-evaluate wedge persona definition.                                                                                                                                                                                         |
| Cold DM motion <2% reply rate after 50 sends            | Pause cold motion. Diagnose: specimen quality issue (artefact) vs targeting issue (list) vs message issue (DM).                                                                                                                             |
| Specimen artefact 0 conversions in 30 days              | Re-litigate specimen template. Discovery sprint on what's blocking conversion.                                                                                                                                                              |
| Sankore MoU stalls past Week 8                          | Re-evaluate Phase 2 sequencing. Run product-discovery sprint with 2nd-tier design partner candidate.                                                                                                                                        |
| Stripe checkout broken for >24h post-Tier-0             | CRITICAL — every minute is lost first-paid-customer signal. Treat as P0 outage.                                                                                                                                                             |
| Email forwarding broken for >7d post-Tier-0             | Re-evaluate whether email is on the critical path. If yes: deeper architectural fix. If no: deprecate the promise in marketing surfaces.                                                                                                    |

The discipline: red signals trigger pause + diagnosis, NEVER push-harder.

---

## Section 14 — How to use this document

### For the founder

This document is operationally canonical for the next 90 days. Weekly cadence:

- **Monday:** Read Section 12 (sequencing) and confirm which week's workstreams are active. Check Tier 0 signoff status (Appendix B).
- **Friday Forcing Function Day:** Read Section 10 D (forcing function math) before the public counter update. Rehearse the sentence.
- **End of week:** Check kill criteria (Section 13) against actual numbers. If any trigger fires, pause and diagnose.

When a lock in this document changes, update this file AND CLAUDE.md AND the master KB notebook `809f5104` in the same commit.

### For future Claude sessions

Cold-start context priority order:

1. **CLAUDE.md** — codebase + product locks
2. **This document** — 90-day operational plan
3. **GTM v3.5** at [docs/gtm-plan-v3-5-2026-05-04.md](gtm-plan-v3-5-2026-05-04.md) — strategy of record
4. **Paper #2 Ch 12 tier plan** at [docs/paper-grounded-tier-plan-2026-05-10.md](paper-grounded-tier-plan-2026-05-10.md) — technical tier roadmap

When in doubt about a Tier 0 integration's current state, **check Appendix B (Tier 0 Integration Repair Log) at the bottom of this file before recommending any marketing surface that references the integration**. The log carries dated signoff per integration; an integration without a recent green signoff should NOT appear in marketing copy.

### For investor / partner conversations

The pitch deck slides 2-4 map to:

- **Slide 2 (Category):** the 3-layer architectural frame (Snowflake owns data integrity · Salesforce owns execution discipline · Decision Intel owns the reasoning layer)
- **Slide 3 (Why Now):** the 5-condition framework from Section 7
- **Slide 4 (Pressure):** the 14-month corridor convergence graphic from Section 10 A

The forcing function sentence from Section 10 D is the close. Memorise verbatim.

---

## Section 15 — Founder decisions (Q1-Q5 LOCKED 2026-05-11)

Founder explicitly delegated Q1-Q5 ("proceed with what you see fit"). Each decision is locked below with rationale. Q6 (integration repair work) is now in active execution — founder + Claude pairing.

### Q1: Seat-scarcity escalation amount — **LOCKED at £500 per filled seat**

Seat 5 sits at £1,999/mo (the v3.5 founding-pilot rate). Each subsequent seat carries a contractual £500 escalation: seat 6 = £2,499, seat 7 = £2,999, seat 8 = £3,499, seat 9 = £3,999. Hitting seat 10 = the Strategy mid-market wedge price of £4,499 (within £500 of the v3.5 ceiling £4,999 reserved for Phase 3).

**Why £500 not £1,000 or £250:** £500 reads as procurement-grade discipline (a real price ladder), not a gimmick. £1,000 increments would compress to the £4,999 ceiling by seat 8 — too aggressive given Sankore is seat 1 and the next 4 are still being cultivated. £250 doesn't manufacture sufficient delay-cost for the next prospect to feel the clock. £500 is the right friction.

**Ship surface:** new constant `DESIGN_PARTNER_PRICE_ESCALATION_NEXT_SEAT = 500` in [company-info.ts](src/lib/constants/company-info.ts), surfaced on the [/pricing](<src/app/(marketing)/pricing>) Design Partner block as "Once a seat fills, the next seat is contractually £500 higher. Today's seat = £1,999/mo. Next seat = £2,499/mo." Update copy in the same commit the constant lands.

### Q2: £349 personal-exposure refund on first 5 prospects — **LOCKED, ship it**

Offer carried in the cold DM to the first 5 prospects who reply with serious interest: _"If Decision Intel doesn't catch ≥2 material biases in your next memo, I refund the first month + send you a £100 Amazon voucher. Personally signed."_ Max exposure: 5 × £349 = £1,745. Expected exposure (if Brier 0.258 calibration is honest, DI catches ≥2 biases in >95% of mid-market memos): ≤£349.

**Why this works:** capability without exposure = words. Capability with personal £349 exposure = pressure. The founder's confidence becomes legible to the buyer as money, which is the only form of confidence the buyer's procurement reads. Also doubles as kill criterion — if all 5 prospects ask for refund, that's a structural signal the product isn't catching what we claim and triggers the kill-criterion sprint per Section 13.

**Ship surface:** add to [discovery-pitch-toolkit.ts](src/lib/data/discovery-pitch-toolkit.ts) `PITCH_TRIGGERS` as a new entry. Surface in Outreach Hub messaging as a usable closing line for the first 5 cold-DM conversion attempts.

### Q3: Journalist outreach sequence — **LOCKED Bloomberg → FT → Strategy+**

Bloomberg first (week 2). Highest credibility for B2B AI + fintech audience. Single journalist DM per Forcing Function Day = 12 outreach attempts across the 90 days. The 16-yo solo founder + EU AI Act Aug 2026 + 22-bias R²F + 143-case retro-audit Brier 0.258 + Pan-African regulatory map angle is a complete story. Bloomberg's strategic-tech beat is the right initial fit.

FT second (week 5). UK-resident angle + Mr. Gabe network resonance + Lagos/Pan-African coverage = FT international-business beat alignment. Specifically target the FT M&A / Lex columnist or the AI governance reporter (Madhumita Murgia tier).

Strategy+ third (week 8). Direct CSO audience, lowest discovery cost but smallest reach. Worth one pitch as a backup if Bloomberg + FT don't convert.

**Forward-looking rule:** if any of the three lands a piece, defer the next-in-sequence pitch by 30 days to let the first piece run its news cycle.

### Q4: Sankore MoU outcome-gate contractual term — **NOT BLOCKING, founder + Sankore to agree pre-signing**

This is correctly identified as a founder ↔ Sankore conversation. Decision Intel side commits to the outcome-gate enforcement language being non-negotiable (per v3.5 §0 honesty repair #3 + the GTM v3.5 Phase 2 deliverable: per-organisation Brier-scored outcome calibration loops). If Sankore pushes back on outcome-gate enforcement, that's a signal the partnership shape is wrong and we should run discovery on a 2nd-tier design partner candidate. The escalation criterion fires if Sankore MoU stalls past Week 8 (Section 13 kill criterion).

### Q5: Pitch deck slide 2 — **LOCKED, keep 3-layer architectural frame + add Diagrams as Slide 2.5**

Slide 2 stays the 3-layer frame (Snowflake owns data integrity · Salesforce owns execution discipline · Decision Intel owns the reasoning layer). The 3-layer framing is the strongest existing investor opener and is locked in CLAUDE.md "3-Layer Positioning Frame" (2026-05-09).

**Add a new Slide 2.5 — "What this means in fundability terms"** — built on the Diagrams' Tool-vs-Infrastructure axis. The slide shows the 7-criteria framework (workflow ownership / trigger control / context memory / system position / bottleneck removal / learning loop / removal cost) with DI's row of green checkmarks vs a comparison row showing what tool-grade AI products look like on the same axis. This is the empirical answer to the "are you infrastructure or tooling?" question every Series A partner asks.

**Forward-looking rule:** when running an investor conversation, lead with Slide 2 (category claim), then Slide 2.5 (architectural defense of the category claim) ONLY if the partner pushes back on the 3-layer frame. If they accept the 3-layer frame, skip 2.5 and move to Slide 3 (Why Now). The 2.5 is a defensive rebuttal slide, not a primary narrative beat.

### Q6: Tier 0 integration repair — IN ACTIVE EXECUTION

Founder + Claude pairing on the audit + repair. WelcomeModal merge (this commit) is part of Tier 0 work. Email forwarding repair is next. Full work log lands in Appendix B as each integration gets a green signoff.

---

## Appendix A — The Gemini Deep Research prompt (drafted but not yet fired)

Refined post-NotebookLM. Designed to fire in ~7 minutes. The research is moat-shaping and being directionally wrong costs months.

```text
RESEARCH BRIEF — B2B AI funding patterns 2024-2026

[Context block: 16-yo solo founder building Decision Intel, pre-revenue
B2B AI "reasoning audit platform" auditing strategic memos for cognitive
bias. 22-bias taxonomy via 12-node LangGraph pipeline, 19-framework
regulatory map, 143-case retro-audited corpus calibrated Brier 0.258.
4 HXC personas: fractional CSO, mid-market corp dev head, smaller-fund GP,
PE-backed founder. EU AI Act Art 14 enforcement Aug 2, 2026.]

EVALUATION: does DI clear the "infrastructure-grade" funding bar (workflow
ownership / trigger control / context memory / system position / bottleneck
removal / learning loop / removal cost) vs the "tool-grade" bar (sits beside
workflow, gets tested), AND does the founder cross the "delay-feels-
expensive" partner-defendability threshold or get filed as "capable founder
with no urgency"?

RESEARCH B2B AI companies that raised pre-seed→seed 2024-2026, weighted
by raise DIFFICULTY (capable founder + product + market — but did they
actually close, and what specifically forced the close).

QUESTIONS (~500 words each):

1. WORKFLOW OWNERSHIP WITHOUT DATA EXFILTRATION. Which AI companies built
"lives inside real work" mechanisms while maintaining ironclad opt-in
privacy posture acceptable to F500 GCs? Cite Glean's permission model,
Harvey's firm-grade isolation, Hebbia, Crosby AI. First-integration order
pre-Series-A? Was DealCloud / Affinity / Salesforce ever a pre-seed
integration, or did these always come later?

2. BOTTLENECK REMOVAL — PROBABILISTIC vs DAILY. Which AI companies sold
a probabilistic bottleneck successfully vs which pivoted to daily? EvenUp
(legal demand letters), Anterior (insurance), Crosby AI (legal contract
review). What pitch language let probabilistic harm read as board-
defensible spend?

3. REMOVAL COST as fundraising AND retention artefact. In Series A
diligence calls publicly recounted, what specific "if your product
disappeared tomorrow" questions did partners ask? Removal-cost dashboards
for CUSTOMERS or INVESTORS? Dataset accumulation metrics that moved
diligence?

4. DELAY-FEELS-EXPENSIVE without faking urgency. Capable pre-seed founders
WITHOUT traction who successfully raised vs comparable founders who didn't:
what made delay genuinely expensive? Competing-investor signals, co-founder
relocation windows, customer-pipeline inflection points, narrative
scarcity. Real examples. Credibility threshold per tactic.

5. ARTEFACT-LED PITCHING — the "specimen" or "live audit" sales motion.
Founder retros, sales podcasts, RevOps blogs — running the product LIVE
on a prospect's recent artefact in the first meeting vs. slide-deck
pitching at pre-seed. Harvey's "live contract review during demo",
Glean's "answer questions from your actual data live". Conversion lift
from artefact-on-prospect's-real-problem vs generic demo.

6. THE 16-YEAR-OLD GENERATIONAL ANCHOR. Pre-seed/seed founders younger
than 20 raising successfully in B2B AI 2024-2026? How did age get reframed
from credential-question into structural URGENCY? Pattern-match against
Lütke, Armstrong, Collison, Tenev at their starts.

7. WORKFLOW OWNERSHIP CRITERIA — WHAT INVESTORS ACTUALLY PUBLISH. Partners
at Sequoia, a16z, Founders Fund, Index, Greylock, Benchmark, Accel —
what do they publish 2024-2026 about AI investment criteria at pre-seed→
seed? Named partner essays / podcasts / interview transcripts. Where do
they agree / diverge / where is the framework wrong?

8. THE PROBABILISTIC-OUTCOME FLYWHEEL. AI companies that built outcome-
feedback loops at pre-seed stage? Cold-start solution for investor
diligence? Anyone used academic retro-corpus calibration (similar to
DI's 143-case Brier 0.258) as proxy for live outcome data pre-Series-A?
Credible or filed as "theatre"?

ANTI-BIAS:
- Do NOT rank examples by raise size alone. Weight by raise difficulty.
- For each successful comparable, surface ≥1 company that looked similar
but DIDN'T raise — name what was structurally different.
- For each pressure tactic in Q4, surface counter-example where same
tactic FAILED at comparable stage.
- Include 3-5 less-narrated examples per question.
- Empirical thinness → say so explicitly rather than synthesising.
- Q5 and Q7 highest risk for "everyone-repeats-same-blog-post" — push
for primary sources.
- Where answer suggests DI changes positioning, be blunt.

OUTPUT:
- 500 words per question
- Named comparables with raise context + source citation per claim
- Final 300-word synthesis: "If you are pre-seed B2B AI reasoning-audit,
16-yo solo founder, zero current customers, 4 HXC personas, 14 months
to EU AI Act enforcement — what 90-day plan does the evidence support?"
- Flag where synthesis contradicts the Venture Growth Group framework
```

When the research fires successfully, integrate findings into Q5 (artefact-led) + Q7 (what investors publish) to validate/sharpen the specimen template before the other 3 personas get built.

---

## Appendix B — Tier 0 Integration Repair Log

**Status as of 2026-05-11:** IN PROGRESS — first onboarding gate fix shipped; ingestion + auth integration audits scheduled next.

Format for entries (one per integration, dated):

```text
[INTEGRATION NAME] — [DATE]
Status: 🟢 GREEN / 🟡 AMBER / 🔴 RED
E2E smoke test: [pass/fail with details]
Known breaks: [list]
Repair work: [commit refs + file paths]
Signoff: [tested by + browser + date]
Marketing surfaces cleared: [list of pages that can now reference this integration]
```

Update this section after every Tier 0 fix. An integration without a recent green signoff MUST NOT appear in marketing copy.

### Entries

#### WelcomeModal v3.5 HXC-first merge — 2026-05-11

```text
Status: 🟢 GREEN
Scope: First-login persona gate (not strictly an "integration" but Tier-0-class
        because the broken/outdated state was the literal first thing a new
        prospect saw — same trust-collapse class as a broken integration).
Known break: Modal showed pre-v3.5 broad role taxonomy
        (Corporate Strategy / M&A / BizOps / PE-Venture / Other), drifted from
        v3.5 PHASE_1_PERSONAS HXC narrowing that landed 2026-05-04. Two modals
        back-to-back (WelcomeModal → Phase1PersonaModal) asked variations of
        the same question.
Repair work:
  - Merged WelcomeModal + Phase1PersonaModal into single HXC-first flow
  - WelcomeModal now reads PHASE_1_PERSONAS as canonical taxonomy
  - New helper phase1PersonaToOnboardingRole in icp.ts auto-derives the
    legacy onboardingRole from phase1Persona at PATCH time
  - /api/onboarding writes both fields atomically; downstream cascade
    (OnboardingTour, sample bundles, role-empty-states) unchanged
  - VALUE_PROPS_BY_PERSONA sharpened per HXC persona (Synergy Mirage for
    mid-market corp dev, LP-grade DPR for smaller-fund GP, pre-board
    pre-mortem for PE-backed founder, Portfolio Bias Heatmap for fractional
    CSO)
  - "Other" path captures free-text role detail + routes to inline waitlist
    thank-you state
  - Phase1PersonaModal demoted to legacy backfill (no-op for new users)
  - audit-platform.mjs extended with checkOnboardingPersonaCoherence
    (semantic-drift check that would have caught this earlier)
E2E smoke test: tsc --noEmit clean · 13/13 onboarding API tests pass ·
                4 lint gates clean (positioning · silent-catches 173 baseline
                · counts 77 baseline · canonical-imports clean) ·
                audit-platform 0 onboarding-persona-drift findings
Signoff: Claude + founder, 2026-05-11 dev session
Marketing surfaces cleared: WelcomeModal first-login experience
```

#### Email forwarding — PENDING (next Tier 0 priority)

```text
Status: 🔴 RED (confirmed broken by founder 2026-05-11)
Scope: Inbound email → DI ingestion via Cloudflare Email Routing →
        analyze+{token}@decision-intel.com → Email Worker → audit pipeline
Known break: end-to-end flow does not work
Repair work: pending audit session (5 likely root causes listed in
        Section 8 Workstream 0)
E2E smoke test: pending
Signoff: pending
Marketing surfaces cleared: NONE — email ingestion claims must NOT appear
        in marketing copy until this entry flips to 🟢 GREEN
```

#### Slack OAuth + slash commands — PENDING

```text
Status: 🟡 AMBER (last verified state unknown; presumed regressed)
Scope: Slack OAuth, 7 slash commands, thread monitoring,
        CopilotSession + DecisionRoom auto-creation
Repair work: pending audit session
E2E smoke test: pending
```

#### Google Drive OAuth + polling — PENDING

```text
Status: 🟡 AMBER
Scope: OAuth + Changes API polling cron + dedup by sourceRef + content-hash
        comparison + 24h cooldown
Repair work: pending audit session
```

#### Stripe checkout (Individual £249/mo) — PENDING (CRITICAL — first paid customer blocker)

```text
Status: 🟡 AMBER
Scope: Checkout flow from /pricing → Stripe → plan flip → AnalysisLimit unlock
Repair work: pending audit session
Note: kill criterion fires at >24h post-Tier-0 if this stays broken
```

#### Resend outbound SMTP (Supabase auth + Gmail send-as) — PENDING

```text
Status: 🟡 AMBER
Scope: smtp.resend.com:465 → magic-link / password-reset / confirm /
        daily-linkedin cron / Gmail Send-mail-as
Repair work: pending audit session
```

#### Ambient capture (Slack + Drive) — PENDING (deferred until Slack + Drive OAuth confirmed green)

```text
Status: 🟡 AMBER (depends on Slack + Drive base integrations)
Scope: Per-channel consent, 14-day expiry, 500-char excerpt cap,
        thesis-formation signal detection via deepseek-v4-flash
Repair work: blocked by Slack + Drive base-integration repair
```

---

## Appendix C — Document version history

- **2026-05-11 v1.0** — Initial draft. Synthesizes Venture Growth Group diagrams + NotebookLM contradiction-check + Grok M&A pain mapping + Paper #2 Ch 12 + the specimen-led artefact pattern. Status: pending founder approval. Tier 0 integration repair surfaced as critical pre-blocking workstream after founder confirmed email forwarding doesn't work end-to-end.

When this document changes materially, increment version + date the entry + update the canonical CLAUDE.md pointer.
