# Decision Intel · Discovery + Tailored-Pitch Card · v2 · 2026-05-08

**Print, phone-screenshot, or laminate. Read in the Uber. Do not skip steps.**

Your one job: find out if their pain is real. Discovery questions ALL FOUR before any pitch. Then pivot with tailored language keyed to what they revealed.

**v2 changes (2026-05-08):** the 4 personas are re-aligned to the locked v3.5 HXC wedge (fractional CSO / mid-mkt corp dev / smaller-fund GP / PE-backed founder). Each persona now carries a SHARPER discovery question + pain-cue + bridge sentence (NotebookLM master-KB synthesis). The pain framing is **"capital eroded by unaudited reasoning in strategic decisions"** — see `src/lib/constants/icp.ts` POSITIONING_PAIN_FRAMING for the canonical phrasing.

---

## What you say if asked what you do (deflection script)

> *"I'm researching whether a problem in strategic decision-making is real before I show anyone what I've built. Could I ask you 15 minutes about your work?"*

**Don't extend. Don't elaborate.** Don't mention DPR, DQI, R²F, "reasoning layer," "60-second audit," or the URL. Don't hand out a card with decision-intel.com on it. Give personal email instead.

---

## The opener · pick the persona before the conversation

| HXC persona | Archetype | Opener (cold-context) |
| --- | --- | --- |
| **Fractional CSO / strategy consultant** | Marcus | *"I'm researching how strategic memos get reviewed before the room sees them. Could I ask you about the last one you put together for a client?"* |
| **Head of Corp Dev / M&A at scale-up** | Damien | *"I'm researching how mid-market deal teams audit IC packs pre-vote. Could I ask you about the last diligence process you ran?"* |
| **GP / principal at smaller fund** | Aisha | *"I'm researching how smaller-fund GPs document conviction for their LPs. Could I ask you about your last contrarian investment?"* — never name a specific fund (Sankore or any prospect) aloud, keep "smaller-fund GPs" / "your fund" / "LP-governance pressure" abstract |
| **PE-backed founder / CEO** | Henrik | *"I'm researching how PE-backed CEOs prep board decks. Could I ask you about your last major strategic pivot — what the sponsor pushed back on?"* |

---

## The sharpened discovery question (lead-in, per persona)

After the opener, lead with the persona-specific question below. Only AFTER this answer, move into the 4 fixed Mom-Test questions in order.

| HXC persona | Sharpened discovery question | Listen for | Bridge sentence (if cue fires) |
| --- | --- | --- | --- |
| **Fractional CSO** | *"Walk me through your last client strategy deliverable. When the board reviewed it, what was the one question that surprised you?"* | "They challenged our base assumptions" / "They asked for comparables we didn't have" | *"Based on what you said about the board catching that blind spot, we run reasoning audits on strategic memos before the room sees them — the technical name is a reasoning layer, scored as a Decision Quality Index."* |
| **Head of Corp Dev / M&A** | *"In your last M&A diligence process, how did you formally document the deal team's dissenting views before the investment committee vote?"* | "We didn't really" / "Everyone just nodded along once the sponsor liked it" | *"Because you mentioned the team acting like an echo chamber, we run reasoning audits on M&A diligence packs to formalize that dissent — the technical name is a reasoning layer, scored as a Decision Quality Index."* |
| **Smaller-fund GP** | *"When you make a contrarian investment, how do you document your conviction so LPs see institutional rigor rather than just your gut feel?"* | "LPs are demanding more process" / "It's hard to put the narrative on paper" | *"Because LPs are demanding that verifiable process to back up your intuition, we run reasoning audits on investment memos — the technical name is a reasoning layer, scored as a Decision Quality Index."* |
| **PE-backed founder** | *"Think about your last major strategic pivot. What was the one underlying assumption the PE board tore apart that you didn't see coming?"* | "Market sizing" / "We were too optimistic on the timeline" | *"Since you mentioned the board tearing apart that timeline assumption, we run reasoning audits on board decks to catch those gaps first — the technical name is a reasoning layer, scored as a Decision Quality Index."* |

**Master-KB anchors:** Mercier & Sperber argumentative theory · Kahneman & Lovallo 2003 "Delusions of Success" + Planning Fallacy · Klein 1995 pre-mortem framework · 143-case library WeWork "Echo Chamber" + Nokia "Yes Committee" failure patterns · Deep Research PMF findings on LP governance pressure on smaller-fund GPs.

---

## The 4 questions, in order

### Q1 — last instance + dread point

> *"Walk me through the last strategic memo, IC deck, or board paper you put together. What was the part you dreaded?"*

**Watch for:**
- Where the pain physically lived (Slack threads / Google Doc / Confluence / four-tool graveyard)
- Whether the pain was about authoring or about reviewing
- Energy shift — when they lean in vs. lean back tells you what is real
- The 5 words they actually use for the pain (write them verbatim)

### Q2 — the surprise question

> *"When the CEO, partners, or board pushed back, what was the one question that surprised you?"*

**Watch for:**
- Category of surprise (regulatory? competitive? unit economics? FX / sovereign? operational?)
- Whether they noticed in hindsight or are still defending the original framing
- How recent (last quarter = warm; last year = cold)

### Q3 — past-purchase behaviour

> *"What's the last thing you bought or paid for to make that part less painful — and did it actually work?"*

**Watch for:**
- Did they pay? (yes → fundable; no → not fundable yet, get them on free tier)
- What did they pay for? (consultant time / Cloverpop / McKinsey / internal analyst / nothing)
- Did it work? (no → genuine gap, fundable by definition)
- Price band — anchors your real ARR ceiling

### Q4 — the intro ask

> *"Who else is researching this space? Who should I talk to next?"*

**Watch for:**
- 0 names = cold; 1 = polite; 2+ = genuinely engaged
- Whether they offer to make the intro themselves
- Whether the names are in your ICP

---

## The pivot · only AFTER all four discovery questions

> *"Based on what you said about [their specific pain in their words], I think I have something you should see."*

Then the tailored pitch keyed to the signal.

---

## Tailored-pitch playbook · what to say keyed off what they revealed

### If they revealed: "the reasoning trail dies in Slack threads / Google Docs / four-tool graveyard"

**Pitch:**
> *"Decision Intel is the system of record for that reasoning trail — every flag carries an excerpt + a regulatory citation; decision history survives team transitions; audit-committee Q&A pulls reasoning in 60 seconds. The artefact is the Decision Provenance Record — hashed and tamper-evident, signed at audit time."*

**Avoid:** R²F or 12-node pipeline. They revealed an ARTEFACT pain — pitch the artefact answer.

### If they revealed: "we almost missed [a specific bias / blind spot] in the last memo"

**Pitch:**
> *"The platform runs three professional lenses on every memo — equity-research skeptical, regulator-hostile, contrarian-strategist — and surfaces the bias each lens flags. Your memo would have caught [their blind spot] before the room did, with the academic citation underneath each flag."*

**Avoid:** the 22-bias taxonomy count. They revealed a SPECIFIC failure mode — pitch the lens answer.

### If they revealed: "we can't get the reasoning back when audit committee asks 6 months later"

**Pitch:**
> *"The Decision Provenance Record is the artefact for exactly that moment — hashed and tamper-evident, EU AI Act Article 14 aligned, regulator-grade. Your audit committee gets the full reasoning trail in one PDF. SOX retention, audit-committee-ready cover page, every flag traced to its source."*

**Avoid:** regulatory tailwinds globally. They revealed a SPECIFIC audit-committee Q&A pain — pitch the DPR artefact answer.

### If they revealed: "we're staring down a cross-border deal and the regulatory regime is a mess"

**Pitch:**
> *"That's the cross-border M&A differentiator. The platform maps [their regions] flag-by-flag — NDPR if Nigeria, PoPIA if South Africa, WAEMU if Côte d'Ivoire — alongside EU AI Act + Basel III. Your GC carries one artefact home for the regional + cross-border counterparty review. The Dangote DPR specimen is the artefact to share — anonymised, public."*

**Avoid:** all 19 frameworks. Pitch the SPECIFIC regimes they named.

### If they revealed: "we've never paid for anything to fix this" (Q3 negative)

**Pitch:**
> *"There's a free audit anyone can run on a memo at decision-intel.com — no login, 60 seconds. Want me to walk you through one on the memo you just described, no commitment? See if it surfaces anything you didn't catch first."*

**Avoid:** asking for paid pilot. The pain is not fundable yet — get them on the free tier and let usage convert. Asking for £249/mo here breaks rapport.

### If they revealed: "we pay [Cloverpop / McKinsey-grade consultant / internal analyst] for it" (Q3 positive)

**Pitch:**
> *"You're paying for [X]. Decision Intel runs the same kind of audit on a memo in 60 seconds at £249 a month, with the regulatory provenance artefact your GC needs. The structural difference is logging vs. auditing — Cloverpop logs decisions; we audit them with three professional lenses + 19-framework regulatory mapping. Want to see it run on the memo you just described?"*

**Avoid:** denying the alternative is good — they're already a believer. Convert by showing speed + provenance + price differential.

### If they revealed: "memos are AI-assisted today (the founder writes, AI fills gaps)"

**Pitch:**
> *"That sharpens the positioning. Decision Intel audits the human-AI co-authored artefact — the same biases, the same regulatory exposure, the same procurement-grade DPR. The audit layer doesn't care whether a human or an AI drafted the language; it cares whether the reasoning survives three professional lenses."*

**Avoid:** pitching as a replacement for their AI assistant — pitch as the audit layer ON TOP of it.

### If they revealed: "memos are agent-generated today (full agentic execution)"

**Pitch:**
> *"Decision Intel audits the reasoning, whether a human or an agent produced it. Same R²F architecture, same DPR output. The 12-node pipeline accepts any structured artefact — agent prompts + outputs map onto the same audit shape. This is where we're heading; if your team is already there, you're the design partner conversation I want to have."*

**Avoid:** underselling the architectural fit — agent-generated memos ARE in scope.

---

## What you do NOT do at any point

- Pitch in Q1 / Q2 / Q3 (only after Q4 + the pivot sentence).
- Talk for more than 25% of the conversation. You are listening.
- Ask "would you pay for X?" — always "what have you paid for to fix this?" (Q3).
- Hand out decision-intel.com. Personal email only.
- Mention DPR / DQI / R²F / "reasoning layer" / "60-second audit" before the pivot.
- Ask "would you be a pilot?" The pilot ask happens at conversation 31, after pattern-matching across 30.

---

## Within 12 hours · 4-line follow-up email

```
Subject: Thanks for [time / context / intro]

[Name],

Quick thanks for the [15 minutes / intro to X / context on Y]. The thing
that landed hardest for me was [one sentence in their words, not yours].

Based on it, I'm going to [one specific thing — sharpen the audit prompt
for X persona / write up the regulatory-mapping decision tree / share the
WeWork DPR with Y].

If you want a free 60-second audit on any memo of your own, the link is
decision-intel.com — no login, no gate. And I'd love to share what I
learn from the next [10 / 30] conversations once the pattern's visible.

— Folahan
```

---

## After 30 conversations · what you will have

- The 5 words buyers use for the pain (your real marketing copy, not a guess).
- The price band buyers have already paid for adjacent tools (your real ARR ceiling, not the fantasy 25% conversion).
- The surprise-question signal across personas (which biases / blind spots are most-cited; sharpens the pitch).
- 3-5 of the 30 warm enough to come back to with the tailored-pitch second meeting.
- A real conversion rate (5-8% baseline; if higher, the wedge is unusually warm; if lower, the wedge is wrong).

Pattern-match across 10+ before declaring the motion working. If the pattern does not converge, the wedge is wrong, not the questions.

---

## The discipline reminder

You will be tempted at every conversation to describe what you've built before all 4 discovery questions land. The temptation is the signal you're about to corrupt the data. The conversations where you held the line and listened first are the ones that produce honest signal AND the warmest tailored pitch. The conversations where you broke and pitched in Q1-Q2 are the ones that produce false-positive enthusiasm and waste 4 months of runway.

**Hold the line through Q4. Then pivot. Then pitch tailored to what they said.**

*Source-of-truth: [src/lib/data/discovery-pitch-toolkit.ts](../src/lib/data/discovery-pitch-toolkit.ts). When the motion changes, edit the data file; this card regenerates from it.*
