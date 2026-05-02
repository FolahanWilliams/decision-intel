# Agentic-Shift Investigation · Q2 2026

**Status:** scaffolded 2026-05-02 · 30-day parallel investigation per GTM v3.3 §5
**Deliverable:** one-page synthesis memo by end of June 2026
**Owner:** Folahan (founder)
**Inputs:** 10 prospect conversations via Mr. Reiner + Mr. Gabe warm-intro networks
**Anchor citation:** GTM v3.3 §5 (Agentic-shift defensive acceleration) + CLAUDE.md External Attack Vector #3

---

## Why this investigation, why now

The v3.1 plan held the audit-layer-for-agents pivot "in reserve for Q3 2026 evaluation." v3.2 moved it forward to a 30-day parallel investigation. The investigation runs alongside the wedge motion, NOT as a replacement — the operational outcome is one of three branching paths chosen on evidence, not a forced pivot.

The trigger is structural, not speculative:

| Signal | Evidence | Implication |
| --- | --- | --- |
| **WEF Future of Jobs 2030 scenarios** | 92M global jobs eliminated by 2030 across information-intensive sectors; 170M new roles requiring hyper-specialized human-AI collaboration | Cognitive labor is the next automation wave, not physical labor. Strategic memos sit squarely in the displaced quadrant. |
| **British Standards Institution seven-economy study** | 31% of organizations evaluate AI solutions before considering hiring; 41% of leaders confirm AI is actively reducing headcount; 25% believe most entry-level cognitive tasks can be done by AI today | Buyer-side adoption curve is steeper than expected. The CFO + procurement gatekeepers are signing off on agent-led workflows now, not "considering" them. |
| **Agentic Task Exposure (ATE) framework** | 93.2% of analyzed occupations across information-intensive sectors (finance, law, healthcare support, sales, administration) cross moderate-to-high displacement risk over the 2025-2030 horizon | The categories DI sells into (corporate strategy, M&A, GC) are inside the high-exposure band, not adjacent to it. |
| **LeCun / Meta AMI World Models (JEPA architecture)** | Joint Embedding Predictive Architecture moves from next-token prediction (LLMs) to latent-state causal prediction. Mass commercialization of agentic systems on this architecture forecast 2026-2030. | The next AI generation reasons causally, not just linguistically. Agent-authored memos won't read like GPT outputs do today — they'll be structurally different artefacts. |
| **Competitor positioning in market** | Palantir Agentic AI Hives, Databricks Unity Catalog as agent control tower, Aera Technology autonomous supply-chain agents, Snowflake Agentic Enterprise launches | The "agent stack" platform play is consolidating now. DI's positioning question (audit layer above OR adjacent to these) needs to be locked before the platforms formalize their own audit layers. |

**The fatal-threat framing (per CLAUDE.md External Attack Vector #3):** if the volume of human-authored 40-page strategy memos plummets, DI is "the ultimate spell-checker for a document format the enterprise is actively trying to automate away."

The investigation answers one binary question: **is the human-authored strategic memo declining FAST enough that the audit-layer-for-agents pivot needs to ship in 2026, or slow enough that the wedge motion holds through 2027?**

## What's already structurally protective in the product (do not over-rotate)

Three load-bearing properties of the existing R²F + DPR stack mean the agentic shift is not a binary product crisis. Even before any pivot, DI's defensive posture is stronger than the External Attack Vector framing suggests:

1. **Authorship-agnostic bias detection.** The 22-bias DI-B-001 → DI-B-022 taxonomy fires on reasoning patterns inside artefacts, not on artefact format. DI-B-021 (illusion_of_validity, Kahneman & Klein 2009) detects narrative coherence not backed by base rates. This pattern appears in agent outputs the SAME way it appears in human memos — arguably more cleanly, because LLM auto-regression prioritizes coherence by construction. As agent-authored strategic artefacts proliferate, R²F detection becomes MORE valuable, not less. DI-B-022 (inside_view_dominance, Kahneman & Lovallo 2003) detects projections without grounded comparables — agent-authored memos lacking explicit reference-class anchors will trigger this detector at higher rates than human memos.

2. **DPR is the contractual artefact, regardless of input source.** EU AI Act Article 14 (human oversight + record-keeping), Basel III Pillar 2 ICAAP (qualitative-decision documentation), and SEC AI disclosure rules require auditable records for HIGH-STAKES decisions, not for human-authored decisions specifically. The DPR's hashed + tamper-evident provenance — model lineage, judge variance, six R²F cover signals, regulatory mapping across 19 frameworks — is the contractual answer the F500 GC needs whether the input was a 40-page memo or an agent decision-chain log. The artefact lock is on what gets PRESERVED, not what gets AUDITED.

3. **The pipeline accepts structured artefacts, not just memos.** The structurer node already normalizes input shape before downstream nodes fire. Extending the input schema from "uploaded document" to "agent decision-chain log" or "agent system prompt + output trace" is an INPUT-LAYER change, not a pipeline rewrite. The 12-node pipeline + the 20×20 toxic-combinations matrix + the 143-case reference-class engine all work the same way once the input is structured.

The implication: **DI's moat is in the audit layer, not the input format.** The wedge motion (human-authored memos to Individual buyers) is the right go-to-market sequence today. The investigation establishes whether the input layer needs to expand to agent artefacts in 2026, 2027, or later.

## Discovery protocol

### The question (per GTM v3.3 §5 + §7 hybrid motion)

> *"How are your strategic acquisition memos and IC decks being authored today — fully human, AI-assisted, or agent-generated?"*

Asked AFTER the four §7 discovery questions and BEFORE any tailored pitch (per the hybrid discipline locked 2026-05-01). Discovery comes first within each conversation; this question slots in as the fifth, when the prospect is already talking about their workflow.

### Variants by persona

Adapt the noun phrase to what the prospect actually authors:

| Persona | Adapted question |
| --- | --- |
| F500 CSO | "How are your division-level strategic memos and board prep materials being authored today — fully human, AI-assisted, or agent-generated?" |
| Mid-market PE Head of M&A | "How are your IC memos and screening notes being authored today — fully human, AI-assisted, or agent-generated?" |
| Pan-African / EM fund partner | "How are your IC memos, LP briefings, and deal screening notes being authored today — fully human, AI-assisted, or agent-generated?" |
| Senior corp-dev analyst | "How are the memos you draft for the corp-dev committee being authored today — fully human, AI-assisted, or agent-generated?" |
| F500 General Counsel | "When you review strategic recommendations from corp dev or strategy, how are those memos being authored today — fully human, AI-assisted, or agent-generated?" |

### Probe ladder (for each of the three answers)

If they say **fully human:**
- "What's the typical length and time-to-draft?"
- "Has that changed in the past 12 months?"
- "What's pushing back against AI assistance — risk, audit committee, IP, or just preference?"

If they say **AI-assisted:**
- "Which tools? (LLM via ChatGPT / Copilot / internal model?)"
- "Which sections does AI draft? (Exec summary, financials, risk register, all?)"
- "Who reviews? Is there an explicit human sign-off step?"
- "Has audit committee or GC pushed back on AI-assisted drafting?"

If they say **agent-generated:**
- "Which agentic platform? (Palantir, Databricks, internal, vendor-specific?)"
- "What's the human-in-the-loop pattern? (Approve/reject, edit, none?)"
- "How is the output recorded for audit / regulator / IC?"
- "Who owns the decision when the agent's recommendation lands?"

## Forward paths (decision tree)

The investigation produces evidence that maps onto one of three branching paths. Lock the path on June 30, 2026 evidence — not before, not after.

### Path A · Human-authored memos still dominant (>70% of sample)

**Implication:** the wedge motion holds. The "shrinking middle ground" framing is premature for the 2026-2027 sales cycle. F500 + Pan-African fund + corp-dev sample reads as 1-3 years from agent-led memo authorship.

**Action:**
- Wedge motion ships unchanged through Q1 2027.
- Audit-layer-for-agents stays as a Q3 2026 reserve item, with a follow-up sample of 10 prospects in Q1 2027 to detect the inflection.
- No product changes in 2026 H2.

### Path B · AI-assisted authorship dominant (40-70% of sample)

**Implication:** the input format isn't dying, but its provenance shape is changing. AI-assisted memos carry specific bias signatures (per the structural-protective property #1 above) — the wedge motion holds AND R²F's value sharpens because AI-assisted memos exhibit illusion_of_validity + inside_view_dominance at higher rates.

**Action:**
- Wedge motion ships unchanged.
- Add a new R²F paper application: AI-assistance signature detector. Treat as DI-B-023 candidate (or as a derived signal on existing DI-B-021 / DI-B-022 detectors). Defer to the next R²F paper-application sprint; rank against the queued #1 / #4 / #7 / #10.
- Update the InlineAnalysisResultCard to surface "AI-assisted authorship signature detected" as a new procurement-grade signal when bias load weights heavily on illusion_of_validity + inside_view_dominance.
- Add an item to the GC + audit committee DPR cover: "AI-assistance signature: detected / not detected / inconclusive" — gives the GC a clean signal for the EU AI Act Art 14 record-keeping requirement.

### Path C · Agent-generated artefacts present (>30% of sample)

**Implication:** the agentic shift is materializing inside the F500 + corp-dev sample faster than the External Attack Vector pre-mortem assumed. The "audit layer for agents" pivot needs to ship in 2026 H2, not 2027.

**Action:**
- Extend the structurer node to accept agent decision-chain logs as input alongside uploaded documents. INPUT-LAYER change, not a pipeline rewrite (per structural-protective property #3).
- Ship a "agent decision audit" surface — same 12-node pipeline, same R²F + DPR, different input schema.
- Update positioning: DI is the audit layer for STRATEGIC DECISIONS, regardless of whether the input was a human-authored memo or an agent-generated artefact. R²F applies identically.
- This does NOT require abandoning the human-authored memo path. It widens the input layer.
- Sequencing: ship Path C input layer for Strategy + Enterprise tier customers first; Individual tier stays on document-uploaded shape until usage data justifies expansion.
- Reframe the wedge: human-authored memos at Individual £249/mo remain the wedge through Q4 2026 because individual buyers don't have agentic systems yet (they're buying as personal-card / t-card budget). Path C surfaces only on team / enterprise tiers where agentic systems are already in production.

## 10-prospect sample — discovery log

Track each conversation in this table. Discovery answers, NOT pitches, are the data — pitches happen after the discovery completes per the §7 hybrid motion.

| # | Date | Persona archetype | Source (Mr. Reiner / Mr. Gabe / event / cold) | Authorship pattern (Human / AI-assisted / Agent / Mixed) | Tooling named | HITL pattern | Audit posture | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |
| 6 | | | | | | | | |
| 7 | | | | | | | | |
| 8 | | | | | | | | |
| 9 | | | | | | | | |
| 10 | | | | | | | | |

### Sample-quality discipline

- **Persona diversity:** at least one each from F500 CSO, mid-market PE M&A, Pan-African fund partner, F500 GC, corp-dev analyst per the audit's PERSONA_ARCHETYPES. Avoid clustering 5+ prospects in the same buyer org.
- **Discovery before pitch:** all four §7 discovery questions land BEFORE the agentic-shift question + ANY tailored pitch. Pitching first poisons the data.
- **No leading questions:** the question is a how, not a should. Don't anchor the prospect by suggesting a "right" answer.
- **4-line follow-up to the introducer** after every conversation per the GTM v3.3 §8 connection-leverage motion.

## Output: end-of-June 2026 synthesis memo

One-page memo. Three sections:

1. **Sample summary** — 10-row table with persona / authorship pattern / tooling / HITL pattern. No commentary.
2. **The pattern** — 3-5 bullet observations grounded in the sample. Where the data clusters, where it surprises, where it splits. NO speculation beyond the sample.
3. **Path lock** — explicit choice between Path A / Path B / Path C with the evidence threshold satisfied. If the sample is mixed, the founder picks the most-protective path and names the trigger that would shift to a different path in Q1 2027.

The synthesis goes into the master KB notebook (`809f5104`), CLAUDE.md External Attack Vector #3 gets updated with the locked path, and the founder-context.ts chat preamble propagates so the AI chat coaches the founder on the new posture.

## Companion changes (lock-step)

When the path is chosen, three lock-step propagations:

1. **CLAUDE.md** External Attack Vector #3 updates "How to apply" with the locked path + explicit kill-criterion / inflection-trigger.
2. **founder-context.ts** chat preamble updates so chat coaching reflects the new posture (per CLAUDE.md F1 lock).
3. **GTM v3.3 §5** updates with the locked path + the Q1 2027 follow-up sample protocol if Path A or Path B is chosen.

## What this investigation is NOT

- NOT a market-sizing exercise. Sample is qualitative (10 prospects), not statistically representative.
- NOT a kill-or-pivot decision. All three forward paths are LIVE strategies; the question is which one fits the evidence.
- NOT a substitute for ongoing wedge-motion outreach. The 10 conversations happen alongside the §7 discovery + tailored-pitch motion that funds the company.
- NOT a unilateral founder decision after one bad week. The path lock requires 10 conversations and end-of-June evidence. Don't pre-commit to Path C just because one prospect uses Palantir.

---

## Provenance + change log

- **2026-05-02 · scaffolded.** Per CLAUDE.md External Attack Vector #3 + GTM v3.3 §5, this memo replaces the prior un-scaffolded state flagged by the 2026-05-02 nightly audit Section 9 #3.
- **2026-06-30 (target) · synthesis lock.** Founder writes one-page memo + chooses Path A / B / C.
- **Companion KB note:** master notebook `809f5104` will hold a mirror copy with the locked path called out in its title.
