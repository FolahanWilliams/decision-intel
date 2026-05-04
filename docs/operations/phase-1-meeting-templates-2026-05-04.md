# Phase 1 meeting templates — Calendly + LinkedIn DM scripts

**Locked 2026-05-04** alongside GTM v3.5 RATIFIED. These templates execute the Phase 1 wedge motion (5-10 personalised LinkedIn DMs/week + 2 London events/month) against the four buyer-class-continuous personas (fractional CSO, mid-market Head of Corp Dev, smaller-fund GP, PE-backed founder).

The discipline: every meeting prep prompt forces the prospect to bring a SPECIFIC artefact (the last memo / IC deck / strategic recommendation they actually wrote) so the founder can run the 20-minute audit on real material. Without that artefact in the room, the conversion mechanic doesn't fire.

NotebookLM Q2 finding (2026-05-04) was load-bearing: the 4-page DPR is procurement-grade for Phase 4 F500 GCs, NOT for a fractional CSO in a 20-minute coffee chat. The Discovery-Grade synthesis line ("X flags caught · ~£Y of decision risk · 60-second audit") is the visceral hook that fires BEFORE the DPR, on the post-upload reveal — that's already shipped on `/demo` + `/dashboard`. These templates make sure the founder ARRIVES at the audit with the right input.

---

## Calendly meeting templates

### Template A — generic Phase 1 discovery (15 min)

**Calendar event title:** "Decision Intel — 15-min audit demo with [First Name]"

**Pre-meeting prompt (Calendly description field):**

> Thanks for booking — see you in 15 minutes.
>
> To make the most of our time, please bring **one strategic memo, IC deck, board paper, or M&A recommendation you wrote in the past 6 months — specifically the one whose toughest part you dreaded defending.**
>
> Doesn't matter if the deal closed, fell through, or sits in the pipeline. We'll run a 60-second audit on it together. You'll see what bias patterns it carries, what questions a CEO / IC / board would have raised first, and roughly what the cost-of-getting-it-wrong looks like.
>
> Confidentiality: redaction is on by default — entity names, amounts, and people's names get replaced with placeholders before any AI sees the document. Original is encrypted at rest, deleted on request.
>
> If you don't have a memo handy, no problem — we can run on a public S-1 or strategic announcement (WeWork 2019, Dangote 2014 Pan-African expansion) and you'll see how the audit reads.

### Template B — fractional CSO 1:1 (30 min)

**Calendar event title:** "Audit demo for fractional clients — [First Name]"

**Pre-meeting prompt:**

> Looking forward to chatting in 30 minutes.
>
> Could you bring **one client memo from the past quarter — the one where the audit committee or PE sponsor pushed back hardest**? We'll run a 60-second audit on it together; you'll see the bias patterns, the predicted committee reactions, and the rough decision-risk anchor.
>
> If 3-5 of your fractional engagements have similar memo flow, the £249/mo Individual tier is the right entry point — you absorb the audit cost into your existing client retainer billing without procurement.
>
> Redaction is auto-on for the Individual tier; entity names + amounts get placeholders before AI touches the doc. Originals encrypted, deleted on request.

### Template C — mid-market Head of Corp Dev / GP (30 min)

**Calendar event title:** "Pre-IC audit demo with [First Name]"

**Pre-meeting prompt:**

> Looking forward to the call in 30 minutes.
>
> To get the most out of our time, please bring **one IC memo or board paper from your past 12 months of deal flow — the one where the toughest pushback came up.** Could be a deal you closed, walked away from, or one still in pipeline — what matters is it's a real artefact your team actually used.
>
> We'll run the 60-second audit live. You'll see the bias patterns the engine flags, which committee-pushback questions it predicts, and roughly what the cost-of-getting-it-wrong anchors at given the deal size.
>
> Redaction defaults on; entity names + financial amounts + people's names get replaced with placeholders before any AI processes the doc. Original encrypted, deleted on request. If you'd rather run on a public artefact (WeWork S-1, Dangote 2014 Pan-African expansion), we have anonymised specimens ready.

---

## LinkedIn DM scripts (5-10 per week to the 4 personas)

### Discipline (per GTM v3.5 §2 Phase 1 motion)

- **5-10 DMs per week — not more.** Quality over volume. Each DM takes 5-10 minutes of personalisation; total weekly time ~1 hour.
- **Lead with a specific bias from the 143-case library that matches their industry or recent deal pattern** — NEVER lead with "I'd love to chat about Decision Intel."
- **Offer a free 60-second audit on their next memo** — that's the call to action. Not a meeting first; the audit IS the meeting.
- **Track every DM in the founder-hub Outreach Hub** — sent, replied, audit booked, audit completed, conversion to £249/mo.

### Template D — fractional CSO

> Hi [First Name],
>
> I read your post on [their specific recent topic — e.g. "the strategy-bandwidth gap for CSOs" / "scenario planning under tariff volatility"]. The one Kahneman called *illusion of validity* lands hardest in that exact context — confident strategic narratives that look coherent but aren't backed by base rates from comparable situations. Most fractional CSOs catch this in their clients' memos; far fewer catch it in their own.
>
> I run a small platform that audits strategic memos for these patterns in 60 seconds. Most fractional CSOs run 3-5 client engagements at any time; the Individual tier (£249/mo) tends to absorb into existing retainer billing without procurement.
>
> Would you be up for a 15-minute demo where I run the audit on one of your recent client memos? Worst case you see what 14+ bias patterns + cost-of-getting-it-wrong look like in your own work. Calendly: [link].
>
> Folahan

### Template E — mid-market Head of Corp Dev / M&A

> Hi [First Name],
>
> I noticed [their firm] just announced [recent acquisition / strategic move]. The bias pattern Lovallo & Kahneman called *inside-view dominance* — projecting forward without grounded comparables from a reference class — shows up in 60-70% of mid-market M&A memos in our 143-case library. Even when the deal is right, the case for it usually isn't built the way the audit committee will eventually want to see.
>
> I run a platform that audits IC memos for these patterns in 60 seconds, surfaces the predicted committee pushback questions, and lays out the rough cost-of-getting-it-wrong against deals of comparable size. Most Heads of Corp Dev at $50M-$500M revenue scale-ups are running on personal-card budget for tooling like this — the Individual tier (£249/mo) sits below most procurement gates.
>
> 15-minute demo on one of your past memos? You'd see the audit live, the predicted committee reactions, and the redacted DPR your audit committee could rely on. Calendly: [link].
>
> Folahan

### Template F — GP at smaller fund

> Hi [First Name],
>
> [Their fund]'s recent thesis on [their portfolio focus — e.g. African fintech / mid-market healthcare / Pan-African industrials] caught my attention. The pattern that breaks most IC votes in low-validity environments isn't bias presence — it's the inability to detect when narrative coherence isn't backed by reference-class base rates. Even strong partners hit this.
>
> I run a platform that audits IC memos for these patterns in 60 seconds. We've got a Pan-African specimen DPR (Dangote 2014 expansion) and a US/global specimen (WeWork 2019 S-1) you can read end-to-end before the call. Most GPs at £5M-£100M AUM funds run on personal-decisive budget for this kind of tooling; £249/mo Individual sits well below the LP-reportable threshold.
>
> 15-minute demo on one of your past IC memos? You'd see the bias surfacing, the Brier-scored calibration of the audit's predictions, and the redacted DPR your LPs could rely on. Calendly: [link].
>
> Folahan

### Template G — PE-backed founder / CEO

> Hi [First Name],
>
> Saw your most recent investor letter / strategic update on [topic]. The pattern most PE-backed founders run into when the board reviews strategic plays is *coherent confidence* — overconfident narratives that look airtight but skip the base rates from comparable strategic moves. Doesn't mean the play is wrong; it means the case for it usually doesn't survive the toughest board question.
>
> I run a platform that audits strategic memos for exactly this in 60 seconds. The Individual tier (£249/mo) sits on personal-card budget — well below board reporting thresholds. Useful before the next quarterly board meeting or any major capital-allocation review.
>
> 15-minute demo on one of your past board papers? You'd see the audit live, the predicted board reactions, and the redacted DPR your audit committee could rely on. Calendly: [link].
>
> Folahan

---

## Post-meeting follow-up template (every meeting, within 12 hours)

> Hi [First Name],
>
> Thanks for the conversation today. Quick recap so it's all in one place:
>
> - Memo audited: [name / type]
> - DQI: [score]/100 ([grade]) · [N] biases flagged · ~[£X] decision risk anchor
> - Top three biases: [list with one-line each]
> - Predicted committee pushback questions: [2-3 from the audit]
> - Suggested fix sequence: [the top remediation from the audit]
>
> If this is useful for your next [memo / IC / board paper], the Individual tier ([£249/mo](https://app.decision-intel.com/pricing)) gets you 15 audits a month on the same engine. Auto-redaction is on by default, so you can run it on confidential client / portfolio / board material without raising IT or procurement flags.
>
> Two questions, no obligation:
>
> 1. What part of today's audit did you find most useful — bias surfacing, predicted committee questions, or the cost-of-ignoring anchor? (helps me tune the tool to your work)
> 2. Is there anyone in your network — peer fractional CSO, peer Corp Dev head, peer GP — who'd find a 15-minute demo on one of their memos useful?
>
> Either way, looking forward to staying in touch.
>
> Folahan

---

## What to track per meeting (founder-hub Outreach Hub)

- Source: LinkedIn DM / Strategy World London / AI in Business Conference / warm intro from [name]
- Persona: fractional_cso / midmarket_corp_dev / smaller_fund_gp / pe_backed_founder
- Stage: DM-sent / replied / meeting-booked / meeting-held / audit-completed / sign-up / Vohra-survey-completed
- DQI of the audited memo (and the persona-specific reaction)
- Cost-of-ignoring anchor that landed (or didn't)
- 90-day retention check (calendar gate set on signup)
- Referral generated yes/no — if yes, intro target persona + name

The metrics dashboard in the founder hub Phase 1 metrics card aggregates these for the kill-criterion / graduation review at month 4 (calendar-gated, locked v3.5).
