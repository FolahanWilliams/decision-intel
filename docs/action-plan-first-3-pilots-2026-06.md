# Decision Intel — Action Plan: first 3 paid pilots → fundable

_Canonical, repo-grounded plan. Built from Rob's VC pass, the Cowork re-foundation + action plan, the external "Frontier Briefing" (a competitive battlecard — mine its facts, ignore its framing), and Claude Code's repo view. Created 2026-06-21._

_The thesis in one line: **this is re-alignment to the wedge you already chose in v3.5, not re-invention.** Land 3 paid pilots, manufacture an unfakeable PUBLIC prospective track record on the side (mostly with tools already shipped), fix the cheap drift, and real funding is on the table._

---

## Part 0 — The repo-grounded insight the strategy docs can't have

The other docs are right on strategy but can't see the codebase. Here's what the repo changes about the plan:

**The "public prospective track record" play needs almost no new product — it's already built.** Walk the machine that's shipped:

- **Run a public thesis through the audit** → the analyze pipeline. Paste SpaceX's S-1 / any public strategic decision. ✅ shipped.
- **Capture the prior BEFORE the algorithm reveals its read** → `PriorsCaptureCard` + the Intelligent Antagonist (the prior is captured first; the gap is the signal). ✅ shipped.
- **Lock a timestamped, falsifiable forward call** → the Vector-1 forced **≤90-day operational-proxy gate** (`operational-proxy-gate.ts`): you cannot log an outcome until a falsifiable ≤90-day proxy is on record. That IS a locked, dated prediction. ✅ shipped 2026-05-17.
- **Score it over time** → Brier scoring + per-analysis recalibration. ✅ shipped.
- **Retroactive forensic mode for the cold-open** → `/dashboard/decisions/retroactive` runs the audit on closed decisions with known outcomes. ✅ shipped.
- **Graduation signal** → the Vohra ≥40%-HXC gate (`vohra-pmf.ts`). ✅ shipped.

**What's actually missing is ONE surface: a public ledger** that displays a locked forward call + its timestamp + (later) its scored outcome. And you don't even need that for call #1 — you can run the audit in-product, lock the proxy (timestamped in the DB), export the DPR, and publish it as a LinkedIn post / a simple public page **this week**. The public-ledger surface is a fast-follow once you have 2–3 calls to show.

So the moat machine isn't a TODO you have to build — it's **a shipped machine with no fuel in it.** The fuel is real users + public calls. That reframes the whole plan from "build the moat" to "feed the machine."

---

## Part 1 — The diagnosis, settled (stop re-litigating; act)

1. **Hindsight trap is real — with one exception.** WeWork-in-hindsight proves nothing about prediction; the 143 cases are a teaching aid, never validity proof. **The exception:** the **retro cold-open** ("run it on a deal you've already closed, one good + one that went sideways") is legitimate — forensic on the prospect's _own_ outcome, ego-safe, mints a logo. The discipline: **retro opens the door; it NEVER poses as proof you predict.** Validity is earned forward (Brier, on unknown outcomes). Label retro "illustrative" first, every time — saying it first IS the rebuttal.

2. **Confidentiality wall closes F500 live M&A in 2026.** No GC uploads a live deal to an unaccredited solo-founder tool with no track record. That's the **ceiling, not the entry.**

3. **EU AI Act does not apply to a human M&A decision.** Annex III high-risk scope = AI _systems_ in 8 defined areas (biometrics, employment, credit, law enforcement…). Corporate strategy / M&A aren't in it; it governs systems, not judgment. Leading the wedge with it = borrowed authority, and it costs credibility with the exact sophisticated readers you need. Legitimate ONLY at the bank ceiling. **Cut it from every wedge surface.**

4. **The moat is the prospective per-org calibration dataset — and the machine for it is shipped but unfed.** Not the cases/prompts/vocabulary (all copyable). Paired decision + reasoning + real outcome, Brier-scored over time. Downstream of traction. Don't claim it; feed it.

5. **The substance has a spine you're underusing: automated Structured Analytic Techniques.** Pre-mortem, red-team, reference-class, devil's advocate — the intelligence community has run these BY HAND for decades because the manual version is slow + expensive (RAND documents the cost). That lineage is the single biggest fix to "the deck reads like Claude wrote it." Keep "the reasoning audit platform" as the cold-buyer noun; put the SAT/IC lineage UNDER it as the substance. Provenance, not category-invention.

**Bottom line:** strategy was right; the deck drifted to the ceiling; Rob is proof of the drift. The job now is one paying customer, not one more slide.

---

## Part 2 — The three paid pilots (who · why · how · price · success)

Four gates for every target: **owns the data · provable in one session · trust barrier low (an aid, not a firm-wide bet) · frequent enough to calibrate.** F500 confidential M&A fails three of four. These three pass all four. They are exactly the v3.5 HXC personas — this is the plan you already wrote.

### Pilot 1 — Solo GP / small-fund principal / active angel _(best wedge)_

- **Who:** individual running their own deal flow at a £5–100M fund, a syndicate lead, or a serious angel who writes/approves investment memos and owns the decision.
- **Why best first buyer:** owns data outright (no GC, no procurement); investment bias is the most-documented domain on earth; enough decisions to calibrate; pays from a personal/fund card; reputation rides on judgment, so a private red-team is valuable to _them_.
- **How to reach:** **Rob Steel's Hustle Fund / Angel Squad network is a direct line to exactly this person** (he just engaged with you — ask). Mr. Gabe's investor network. Targeted LinkedIn DMs. **Open with the retro:** "Send me one deal you passed on that you regret and one you did that went sideways. I'll run our audit and show you what the reasoning looked like in hindsight. 20 min, no pitch."
- **Pilot shape:** retro on 2 closed decisions → audit the next 3–5 _live_ memos, logging the predicted outcome + flagged risks via the operational-proxy gate (timestamped). 60–90 days.
- **Price:** £249–499/mo, or flat £750 for a 3-month pilot. The cheque existing matters more than the number.
- **Success:** pays · keeps pasting memos · ≥1 live decision's outcome tracked · gives a quotable sentence.

### Pilot 2 — Fractional CSO / independent strategy consultant

- **Who:** runs 3–5 client engagements, produces strategy memos + board recommendations for a living.
- **Why:** their product IS judgment quality; name on every memo; owns the workflow; personal budget; constant memo flow. Catching what the client's board will catch _before_ delivery is directly in their self-interest.
- **How to reach:** LinkedIn (findable + active); retro cold-open on a past (anonymised) engagement; Strategy World London / conference 1:1s.
- **Pilot shape:** audit next client memos pre-delivery; value = "don't get caught flat-footed in the board Q&A." Log which flagged risks the board actually raised. 60–90 days.
- **Price:** £249–999/mo (they bill clients thousands — cheap insurance).
- **Success:** pays · repeat use · testimonial · ideally brings it into a client engagement.

### Pilot 3 — Mid-market Head of Corp Dev / PE-backed founder (paying personally)

- **Who:** Head of Corp Dev at a $50–500M-revenue scale-up, or a PE-backed founder/CEO with personal-decisive budget, 1–3 deals/year.
- **Why:** high-stakes, personal budget pre-team, owns their own deal memos. NOT the F500 GC (closed) — the individual operator who can just buy it for their own work.
- **How to reach:** Mr. Reiner's network (US); warm intros; retro cold-open on a closed deal.
- **Pilot shape:** retro on a closed deal → audit the next live deal memo + IC prep; track the outcome.
- **Price:** £499–999/mo or a per-deal fee.
- **Success:** pays · uses on a real deal · reference.

### In parallel — Sankore as the bridge (not one of the 3 cheques)

The 12-week embed is the highest-value relationship: first reference-grade **real-outcome calibration data** (retroactive Bias Genome seed over 30–50 closed Sankore decisions — the highest-leverage moat move), 3 anonymised DPR specimens, a logo. Per the locked Sankore brief: lead with the relationship/embed, NOT the £1,999/mo line; take money if offered, but access + data is the prize.

**Why three, not one:** one pilot is an anecdote; three across two persona types is a _pattern_ you show an investor ("here's who buys, why, and a repeatable acquisition motion"). The pattern is what converts "impressive 16-year-old" into "fundable company."

---

## Part 3 — Build trust on the side (run in parallel with outreach)

### 3a. The public prospective track record — "Decision Intel, in the open" ⭐ highest-leverage credibility move

The answer to "no one trusts a tool like this until it's been used for years." You manufacture the track record IN PUBLIC, before customers, on data nobody can call confidential. **And the machine is already shipped (Part 0).**

The loop:

1. Pick a **live, public, high-stakes strategic decision whose outcome is unknown** — a just-IPO'd company's stated thesis (SpaceX's IPO thesis/S-1 is the founder's own example and a perfect one), a freshly announced acquisition, a public market-entry or capital-allocation bet.
2. Run the DI audit on the _reasoning_ in the public document. Flag the biases, name the reference-class risks, capture your prior, **lock a timestamped falsifiable call via the operational-proxy gate**: at 3 / 6 / 12 months, does the stated thesis hit its OWN stated milestones, or do the flagged risks materialise? Export the DPR. Publish (LinkedIn long-form + a public ledger page).
3. **Track it. Brier-score it. Publish the result — win OR lose.**

Why it works, against each objection:

- **Kills the hindsight objection** — forward, dated, public, falsifiable. The opposite of WeWork-in-hindsight.
- **Seeds the moat in public** — every locked call is one more prospective, outcome-scored data point. 1–2/month for 6–12 months = a track record no other pre-seed founder has.
- **It's your best content** — a public scorecard feeds the build-in-public motion and is the most credible content imaginable.
- **No confidentiality wall, no cost** — all public data.

**Discipline (load-bearing):**

- Only **locked-forward** calls count as track record; retro analyses are always labelled illustrative.
- You **WILL** be wrong on individual calls — fine and expected. Calibration across many beats being right once (Tetlock's superforecasters are wrong constantly and still beat classified analysts ~30% because they're _calibrated_). Publish losses; the honesty is itself the moat against "you cherry-pick."
- **Stay in the DI lane — and score the FLAG, not the FORECAST (load-bearing; see Part 7.1 + Appendix A).** You audit the _reasoning_ in a public decision and flag a specific reasoning-risk (timeline optimism, inside-view dominance, narrative coherence). What gets Brier-scored is **whether the flagged risk materialised**, NOT whether you predicted the outcome or the stock price. "Will SpaceX hit its milestone?" is a _forecast_ — that puts you in a ring with every analyst and superforecaster, where the pipeline is mediocre by design. "Did the reasoning-risk we named actually bite, vs. base rate?" is a claim about your own _detection quality_ — which is exactly what the product is (`POSITIONING_EPISTEMIC_HONESTY`: correlated risk indicators, not causation, not price). Publish the false positives too (risk flagged, didn't bite); the false-positive/true-positive profile over N calls IS the moat artifact.

**Verified 2026-06-21 (this session, web search restored):** SpaceX IPO'd on Nasdaq (ticker **SPCX**) — priced **June 11 2026 at $135/share / ~$1.77T**, debuted June 12 closing **$161 (+19%)**, ~$75B raised (largest US IPO ever); public S-1 filed May 20 2026. The thesis, its reasoning-risks, the locked falsifiable proxies, and the exact "score the flag not the forecast" scoring are worked end-to-end in **Appendix A** — **call #1 is ready to lock.**

### 3b. The one product proof — DI vs a plain GPT prompt _(Claude Code's job — hand it a memo)_

Take one real memo (yours, a shareable sample, or a consented design-partner one) and show a **non-obvious catch the pipeline makes that a plain GPT prompt misses** — a compound/toxic combination, an inside-view/reference-class miss (DI-B-021/022), a validity-aware downgrade. THE rebuttal to "the product seems light," and it outweighs the whole deck. Make it **repeatable** (a recurring "what we caught that GPT missed" post), not a one-off.

### 3c. Cheap, load-bearing cleanups (mostly code — Claude Code's job)

Free credibility; exactly what a skeptic circles in red.

- **SAFE — enforce existing locks (Claude Code ships immediately):**
  - DQI "**six components**" → "**seven**" on `/how-it-works` (`HowItWorksClient.tsx`) — the engine is 7 (compoundRisk, locked 2026-05-09).
  - "**Thirty-plus / 30+ cognitive biases**" → **22** on `/how-it-works`, `/decision-intel-for-boards`, `/regulatory/ai-verify` (CR-3 deprecated "30+" 2026-05-13; these evaded the count-lint because the number isn't digit-adjacent to "biases").
- **NEEDS FOUNDER SIGN-OFF — touches locked positioning (Claude Code proposes wording, founder approves):**
  - **EU AI Act secondary H1** (`icp.ts` `POSITIONING_HERO_SECONDARY`): "The reasoning audit platform the Fortune 500 needs before EU AI Act enforcement begins August 2026." → drop the EU-AI-Act clause from the wedge; reserve regulatory framing for the bank-ceiling context only.
  - **SOC 2 homepage badge:** "SOC 2 Type II infrastructure" → "Runs on SOC 2 Type II infrastructure (Vercel + Supabase); our own SOC 2 Type I is targeted Q4 2026." (Matches what `/security` already says straight; removes the "borrowed certificate" read.)
  - **`/regulatory/ai-verify`** line tying the bias taxonomy to "EU AI Act high-risk fairness provisions" — keep on the regulatory/ceiling page, but reword so it doesn't imply the M&A/strategy wedge is EU-AI-Act-regulated.
- **Add the SAT/IC lineage** as the substance beneath the category noun wherever you describe what it is.

### 3d. Keep building the ceiling's furniture — just don't lead with it

DPA, 7-year retention, liability caps, 19-framework map, SOC 2 path: NOT costume — institutional furniture built early (a legitimate strategy). Keep building quietly. The only error was making it the first thing a solo GP sees. Keep it on `/security`/`/trust` for when procurement surfaces; off the wedge surfaces.

---

## Part 4 — The sequence (order matters; don't jump ahead)

**Weeks 1–2 — clear the deck, load the gun.**

- Ship the SAFE cleanups (3c). Park the pitch deck — it's not the blocker.
- Build the one product proof (3b).
- Publish public prospective **call #1** (SpaceX thesis or a fresh announced deal). Lock + timestamp via the proxy gate.

**Weeks 2–8 — first cheque.**

- Retro-cold-open outreach to Pilots 1–3. 5–10 personalised conversations/week (v3.5 cadence; log every one in the WedgeProspect ledger — the empty ledger IS the displacement signal).
- Scope the Sankore embed in parallel.
- Publish call #2.
- **Target: one signed paid pilot.**

**Months 2–4 — the pattern.**

- Land all **three paid pilots**; run the prospective loop on each.
- Sankore embed running; start the retroactive calibration seed.
- 1–2 public calls/month; the first approach their 3-month mark.

**Months 4–6 — proof compounds.**

- First closed outcomes → first real (small-N) calibration data → the moat starts existing.
- 3 pilots with sustained usage + ≥1 quotable reference.
- Run the Vohra survey on the cohort (graduation signal).

**Months 6–12 — fundable.**

- Convert pilots to retained subs; Sankore reference + DPR specimens published.
- Public track record N≥10 calls + a first honest Brier readout.
- **Now** open the seed conversation — customers before investors (Mr. Gabe rule), exactly as v3.5 says.

---

## Part 5 — Why funding is genuinely on the table after this (and not before)

A pre-seed investor underwrites a team that's clearly going to win OR evidence the dog eats the food. Today you have the first, none of the second. After this plan:

- **3 paying customers across a repeatable acquisition motion** (pattern, not anecdote).
- **A signed design-partner reference** (Sankore) with real-outcome calibration data.
- **A public, timestamped, Brier-scored prediction track record** — the thing _no other pre-seed founder has_, and the only honest answer to "how do I know it works." It directly neutralises every line in Rob's email.
- **A product proof** the depth is real, not a GPT wrapper.

That's a fundable company. The ambition was never the question; the sequence was inverted. This is the right order.

---

## Part 6 — Guardrails (tape to the wall)

- Retro opens the door; **prospective Brier earns belief.** Never blur them.
- You **will** be wrong on public calls. Calibration over many beats being right once. Publish losses.
- **Don't claim the moat before it exists** — it's a shipped machine you're feeding, not an asset you have.
- **Don't lead the wedge with regulation, security theatre, or F500 framing.** Lead with: "here's a real decision, here's the non-obvious thing we caught, here's our public track record."
- **Stop polishing the deck.** One paying customer > any slide.
- **Fill the WedgeProspect ledger.** An empty ledger means the motion isn't running.

---

## Part 7 — Three refinements from the 2026-06-21 review (sharpens the plan, doesn't replace it)

The plan above is right. Three things the consensus (Rob + Cowork + the first repo pass) under-weighted, in priority order:

**7.1 — Score the flag, not the forecast (the most important fix to the whole track-record play).** The public track record must Brier-score _whether the reasoning-risk DI flagged actually materialised_, NOT whether DI predicted the outcome or the price. The difference is the difference between two businesses: scoring outcomes makes you a _forecaster_ (you compete with Tetlock, Good Judgment, and every equity analyst — where the pipeline is mediocre by design, because it isn't a forecasting engine); scoring whether your flagged risks bite makes you a _bias-auditor whose detection is calibrated_ — which is the actual product, and the only claim `POSITIONING_EPISTEMIC_HONESTY` lets you make ("risk indicators correlated with poor outcomes; not causation; not price"). For SpaceX the two nearly coincide (the flag _is_ "the Starship timeline slips"), but the **framing of what you publish and score is everything**: "we flagged timeline-optimism gated on a 5/25-flight base rate; here's the dated falsifiable proxy; we score whether the risk bit, and we publish false positives." Worked in Appendix A.

**7.2 — Sankore is not "the bridge." It is the single most important asset in this plan.** The 3 individual pilots prove **demand**; only an embedded relationship realistically produces **real calibration data inside 12 months**. Individuals are the _least_ likely cohort to log honest 90-day outcomes — that is the Cloverpop manual-logging trap CLAUDE.md already names, and outcome-logging is the _exact_ behaviour the moat depends on. Sankore's contractual outcome-gate + the retroactive seed over 30–50 already-closed decisions gives real outcome data on **day one**, not in a year. If you could keep only one workstream, keep Sankore. Treat it as **P0, starting week 1** — not "in parallel, later."

**7.3 — Re-rank the credibility assets; "3 paid pilots" is the weakest of the four — don't make it the headline.** Three individuals at £249–999/mo reads as _lifestyle SaaS_ to a skeptical seed investor — CLAUDE.md's own "£300K/yr lifestyle utility, not the data asset" warning. The cheques prove willingness-to-pay (necessary, hard, real). But the assets that prove the _product works_ and actually move a seed check rank: **(1) the public Brier track record** (the thing no other pre-seed founder has) → **(2) the Sankore real-outcome reference** → **(3) the GPT-vs-pipeline depth proof** → **(4) the 3 paid cheques.** All four matter; lead the _investor_ story with 1–3 and use 4 as the "dog eats the food" floor. Practically: 3a (public track record) and Sankore start **week 1**, because they are the longest-pole, highest-value assets — not things that wait for the pilots to land.

---

## Appendix A — SpaceX (SPCX): public call #1, worked end-to-end

_The concrete instantiation of §3a + §7.1. Every figure verified 2026-06-21 from the S-1 + IPO coverage (sources below). This is a template, not just one call — the structure repeats for every public decision you audit._

**The decision audited:** SpaceX's S-1 IPO thesis — the reasoning the ~$1.77T valuation rests on. Public document, no confidentiality wall, outcome unknown, debuted 9 days before this audit. Perfectly in-bounds.

**What the S-1 argues (the thesis):**

- Reusable rockets cut launch cost ~$18,500/kg → ~$1,400/kg, unlocking Starlink → orbital AI → lunar → Mars ("railroad infrastructure for space").
- ~$1.77T ≈ **60–70× forward revenue** on ~$25B 2026E revenue — coverage is explicit that this "prices 2030 outcomes": _Starlink at ~$40B revenue, Starship reusable at scale, and at least one of orbital-AI-compute or Mars optionality printing real numbers._
- Starlink: **10.3M subscribers** (Mar 2026), doubled YoY; illustrative 30–50M scenarios.
- Starship: stated near-term milestone is **first commercial payloads in H2 2026.**

**What DI's pipeline flags (reasoning-risks, in-lane — not a valuation opinion):**

1. **Inside-view dominance (DI-B-022).** Coverage frames the ask as "conviction that Musk delivers a 2030 set of milestones the market has never priced for any single CEO" — the literal _this one is special, comparables don't apply_. The reference class (60–70× forward revenue for outcomes 4 years out; one CEO across SpaceX + Tesla + xAI + X) is unfavourable.
2. **Planning-fallacy / timeline optimism — the load-bearing, checkable flag.** The entire downstream thesis (V3 Starlink capacity, orbital AI, lunar, Mars) is gated on Starship at commercial scale. Base rate: **Starship flew 5 times in 2025 against a 25-flight target — 20% of plan.** Stated milestone: first commercial payload H2 2026.
3. **Narrative coherence / illusion of validity (DI-B-021).** "$1.77T → 7th-biggest US company, above Tesla" is internally coherent (cheap launch → broadband → AI → Mars), and the coherence is manufacturing confidence the base rates don't support.
4. **Reference-class / competition under-weighting.** Starlink ARPU fell $99 (2023) → $66 (Q1 2026); Amazon's Kuiper/Leo hit enterprise beta Apr 2026. The 30–50M-sub scenarios under-weight deceleration + price competition.

**The locked, falsifiable call (the FLAG, dated — not a price target):**

> _"DI flags that the SPCX valuation thesis is gated on a Starship timeline the reference class says is optimistic (5 of 25 planned flights in 2025). **Falsifiable proxy, locked 2026-06-21:** does the first commercial Starship payload fly by **Dec 31 2026** (the S-1's own 'H2 2026' milestone)? The reference-class base rate says it slips. Tracking it, win or lose."_

- **3-month proxy (~Sep 2026):** does SpaceX's first post-IPO reporting reaffirm or quietly soften "H2 2026 commercial payload"? Is the test-flight cadence an H2 commercial debut requires actually happening?
- **6-month proxy (Dec 31 2026):** did the first commercial Starship payload fly? _(primary)_ Secondary: did Starlink net-adds decelerate / ARPU keep falling?
- **12-month (Jun 2027):** is the "2030-milestones-priced-today" gap narrowing or widening?

**How it's scored — and why this is the entire point (§7.1 made concrete):**

- DI is **not** predicting SPCX's share price. The stock could rip on Starlink alone _while_ the Starship timeline slips — and DI's flag would **still be validated**, because the flag was about the reasoning-risk, not the price.
- Scored unit: **did the flagged risk materialise?** Starship commercial debut slips past Dec 31 2026 → flag confirmed. It flies on time → flag was a **false positive, publish it.** Across 10–15 calls you get an honest true-positive/false-positive profile on DI's detection — the only thing that answers "does it actually work," and the thing no other pre-seed founder can show.

**Framing guardrail:** publish as _method_, never a hit-piece — "watch a locked, dated, falsifiable reasoning-audit play out in public," not "SpaceX is overvalued." DI admires the company and audits the _reasoning_, not the rocket. And because call #1 is N=1 with no track-record buffer (and SpaceX is the most-watched company on earth), **pair it with 1–2 lower-profile public calls** so the early record isn't all-in on a single hyped name — the calibration story needs N≥10 before any individual miss is just noise.

---

### Sources / lineage

- EU AI Act high-risk scope (Annex III) — corporate/M&A not in scope.
- Prospective validity / Brier track record — Good Judgment Project (Tetlock): superforecasters beat classified analysts ~30%, calibrated over many, wrong often.
- Structured Analytic Techniques + their manual cost — RAND assessment (the SAT/IC spine).
- Repo machinery cited: `operational-proxy-gate.ts`, `PriorsCaptureCard`, Retroactive audit mode (`/dashboard/decisions/retroactive`), `vohra-pmf.ts`, `dqi.ts` (7-component), the WedgeProspect conversion ledger.
- SpaceX IPO specifics (verified 2026-06-21): priced $135 / ~$1.77T (June 11), debuted $161 / +19% (June 12), ticker SPCX, public S-1 May 20 2026 — [CNBC: $135 target / $1.77T](https://www.cnbc.com/2026/06/03/spacex-ipo-stock-price-roadshow-musk.html) · [CNBC: SPCX closes $161, +19%](https://www.cnbc.com/2026/06/12/spacex-ipo-spcx-live-updates.html) · [S-1 (SEC EDGAR)](https://www.sec.gov/Archives/edgar/data/1181412/000162828026036936/spaceexplorationtechnologi.htm) · [mostlymetrics S-1 breakdown](https://www.mostlymetrics.com/p/spacex-ipo-s1-breakdown).
- Starship base rate (5 flights in 2025 vs 25-flight target) + Starlink ARPU $99→$66 + Kuiper competition — [TheNextWeb: Starlink growth maths](https://thenextweb.com/news/starlink-is-spacexs-cash-machine-but-the-maths-is-getting-harder) · [SpaceX IPO risk tracker](https://newmarketpitch.com/blogs/news/space-economy-spacex-ipo-risks).
