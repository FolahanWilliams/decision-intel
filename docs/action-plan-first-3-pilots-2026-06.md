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
- **Stay in the DI lane:** you audit the _reasoning behind a strategic decision_ and call whether it hits its _own stated milestones_ — NOT a stock price. For SpaceX: audit the IPO thesis's reasoning + the risks management underweights, and call the specific promised milestones. Judgment quality, not equity research.

**Verify before locking:** pull the live S-1 / announcement specifics (valuation, date, the exact milestones) before timestamping a call. _(Web search was down 2026-06-21 at writing; confirm SpaceX/Starlink IPO specifics from the actual filing before call #1.)_

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

### Sources / lineage

- EU AI Act high-risk scope (Annex III) — corporate/M&A not in scope.
- Prospective validity / Brier track record — Good Judgment Project (Tetlock): superforecasters beat classified analysts ~30%, calibrated over many, wrong often.
- Structured Analytic Techniques + their manual cost — RAND assessment (the SAT/IC spine).
- Repo machinery cited: `operational-proxy-gate.ts`, `PriorsCaptureCard`, Retroactive audit mode (`/dashboard/decisions/retroactive`), `vohra-pmf.ts`, `dqi.ts` (7-component), the WedgeProspect conversion ledger.
- _SpaceX/Starlink IPO specifics: verify from the live filing before locking call #1 (web search unavailable at writing, 2026-06-21)._
