# AI-Native / Ex-Ante / Bias-Noise / Time-Saving Reframe — Research + Adversarial Synthesis (2026-05-29)

**Status:** integrated. The narration cascade shipped 2026-05-29 (see CLAUDE.md "AI-Native Ex-Ante-Additive Reframe"). This file is the durable record of (1) the research prompt, (2) the report, (3) the adversarial verdict, and (4) what was acted on vs rejected.

---

## 0. Origin

After seeing Wealor (YC P26) and other "true AI-native" platforms, the founder asked:

> "Just having a great product isn't enough … they are building true AI-native platforms. What can we change to be a truly novel platform? How did you know AI-native? We also need to move toward how we actually save the user time and make them more efficient — still from the unique angle of bias & noise. Maybe not even just automatically running it on their audits but helping them even make the audit in the first place."

Decision before researching: generate a deep, thorough Gemini Deep Research prompt that unifies **AI-native + saves-time + bias + noise + ex-ante (help build the audit, not just run it)** + where biases are most prevalent/costly and how DI uniquely solves that. Then integrate the rich output rigorously.

---

## 1. The research prompt (as issued to Gemini Deep Research)

> Investigate the epistemic architecture of high-stakes strategic decision-making (corporate development / M&A / VC / corporate strategy). Four unified threads:
>
> 1. **AI-native vs AI-powered.** What structurally distinguishes a platform where AI operates on the user's behalf (initiates, runs ambient, supervises) from one where the user operates a request→response tool? Map the spectrum with named examples.
> 2. **Where in the decision lifecycle do bias and noise actually form and do the most damage** — ex-ante (before the artefact), at-artefact, or ex-post? Cite the formation-vs-rationalization literature (Mitchell/Russo/Pennington prospective hindsight; Kahneman & Lovallo reference-class forecasting; the IC-memo-as-post-hoc-rationalization finding).
> 3. **Noise specifically** (not just bias): the Kahneman/Sibony/Sunstein _Noise_ framework, the Mediating Assessments Protocol, mechanical aggregation (Meehl 1954 / Dawes 1979 / Grove et al. 2000). How would a reasoning-audit platform operationalize noise reduction it doesn't already?
> 4. **Time-saving / efficiency** from the unique bias-and-noise angle: how does a reasoning-hygiene layer make the operator faster, not add a step? What is the additive (not corrective) framing?
>
> For each, name where Decision Intel (a reasoning-audit platform: 22-bias R²F taxonomy, 12-node pipeline, DQI, DPR, 143-case library) could move upstream to help BUILD the reasoning, not just audit the finished memo — without drifting into a horizontal decision-authoring tool.

(Report returned: **"The Epistemic Architecture of Strategic Decision-Making."**)

---

## 2. Adversarial pressure-test (8-agent workflow, code-verified against shipped surfaces)

The report's recommendations were not taken at face value. An adversarial workflow verified each claim against the actual codebase. Findings:

### ~70% of the report re-described surfaces DI already ships

Every "this is what AI-native would look like" surface already exists:

| Report framing ("DI should…")          | Already shipped                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| capture reasoning before the memo      | `PriorsCaptureCard`                                                                         |
| surface dissent without political cost | Intelligent Antagonist / Constellation Next Move                                            |
| anchor to the outside view             | reference-class forecast detector                                                           |
| run a structured pre-mortem            | Deal Fever pre-mortem                                                                       |
| force falsifiable predictions          | forced ≤90-day operational proxies (V1)                                                     |
| operate ambiently across the toolchain | ambient capture (Slack full + Drive file-body; opt-in / 500-char / 14-day / no-raw-persist) |
| compound a proprietary dataset         | per-org Brier + cross-org Bias Genome                                                       |

**The real gap was NARRATION, not capability** — the pitch led with the ex-post audit and buried the upstream co-creation.

### The one genuinely net-new idea: MAP

**Mediating Assessments Protocol** (Kahneman / Lovallo / Sibony, HBR 2019 / _Noise_ 2021): decompose into independent attributes → blind-score each on objective criteria BEFORE holistic discussion → delay the global verdict. Noise-side complement to the bias-heavy R²F stack; defeats the halo/coherence cascade (DI-B-021 illusion_of_validity); grounded in mechanical-aggregation literature (Meehl 1954 / Dawes 1979 / Grove et al. 2000).

**UNSHIPPED.** The current noise jury is decorrelated FRAMES (analyst-skeptical / regulator-hostile / contrarian-strategist) = framing-variance, not attribute-decomposition-with-blind-scoring. MAP is the **queued next R²F detector**; the engine is a founder-gated pipeline change (methodology 2.4.0 → 2.5.0 + held-out parity run), **deferred post-first-customer**. Roadmap only — never claim it's live.

### Recommendations REJECTED

- **R2 — ship a Word / Google-Docs co-authoring extension.** Redundant (ambient Drive path already ingests file bodies), IT-blocked at the procurement buyer, privacy-posture violation. Rejected.
- **R4 — abandon the DQI score + the ex-post memo audit; pivot to a co-creation tool.** Moat-suicide: the DPR is the EU AI Act Art 14 contractual artefact; the DQI is the scalar the per-org Bias Genome scores against. Also self-contradicts the report's own R5 (data-flywheel) recommendation. Rejected.

### Synthesis directive

> KEEP everything. ADD MAP (post-customer, founder-gated). REFRAME the narration now (zero build cost). The cheapest, highest-value, BAFTA-window move is the narration reframe.

---

## 3. DO-NOT-QUOTE (confabulated figures)

Same discipline as Brier 0.258 / ~90% margin. Use to shape conviction, never cite:

- "~30 hours saved per deal"
- "+30% failure-cause identification"
- "55% of decision variance is noise"

---

## 4. What was acted on (the 2026-05-29 narration cascade)

Zero changes to `src/lib/agents/` or the DQI engine. NARRATION surfaces only:

- **`src/lib/constants/icp.ts`** — `POSITIONING_EX_ANTE_FRAME` + `POSITIONING_TIME_SAVING_FRAME` constants; `BANNED_VOCABULARY` += `auto-draft the memo` + `decision co-creation platform` (horizontal Quantellia/Aera/Wealor guard); a cold-context onramp; `buildPositioningPromptBlock()` ex-ante-additive narration block (lead ex-ante, narrowness guard, KEEP DQI/DPR, DQI rebuttal, MAP roadmap, do-not-quote).
- **`src/app/api/founder-hub/founder-context.ts`** — chat-coaching block (ex-ante narration + MAP roadmap + DQI rebuttal + do-not-quote).
- **Education Room** — MAP flashcard (`r2f_framework` deck) + ex-ante-narration flashcard (`founder_oneliners` deck).
- **Sparring Room** — ex-ante-timing objection scenario (midmarket_corp_dev) + DQI black-box-grade objection scenario (f500_cso).
- **Pricing FAQ** — "Is the DQI just a black-box grade?" rebuttal (per-component breakdown + user-adjustable weights / Dietvorst 2016 + tamper-evident DPR hash).
- **CLAUDE.md** — "AI-Native Ex-Ante-Additive Reframe" lock.

## 5. Deferred (post-first-customer, founder-gated — recorded scope boundaries, not omissions)

- **MAP pipeline engine** (methodology 2.5.0 bump + held-out parity + bias-taxonomy/noise-jury cascade).
- **"Produce the middle" surfaces** — auto-reference-class + auto-pre-mortem fired off the priors surface before the memo exists (co-create the reasoning, never the deliverable).
- **Ambient email ingestion** (the 3rd ambient source after Slack + Drive).
- Any Word/Docs co-authoring extension (R2) — rejected, not deferred.

**Forward-looking:** the next Deep Research pass mirrors into NotebookLM master KB `809f5104` and gets its own dated record here; do not overwrite this one.
