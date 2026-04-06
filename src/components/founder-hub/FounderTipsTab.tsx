'use client';

import type React from 'react';
import { Compass, Target, Shield, Rocket, Hammer } from 'lucide-react';

/**
 * Founder Tips — personalized strategic principles for the Decision Intel
 * founder to refer back to. Content is grounded in the founder's specific
 * position (16-year-old solo founder, Nigeria, PE/VC wedge, Wiz advisor).
 */

const card: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  background: 'var(--bg-secondary, #111)',
  border: '1px solid var(--border-primary, #222)',
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-primary, #fff)',
  marginBottom: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const subLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  color: 'var(--text-muted, #71717a)',
  marginBottom: 4,
  marginTop: 10,
};

const bodyText: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary, #b4b4bc)',
  lineHeight: 1.65,
  marginBottom: 4,
};

const tipTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--text-primary, #fff)',
  marginBottom: 6,
};

type Tip = {
  title: string;
  principle: string;
  rationale: string;
  action: string;
};

function TipBlock({ t, idx }: { t: Tip; idx: number }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        background: 'var(--bg-tertiary, #0a0a0a)',
        border: '1px solid var(--border-primary, #222)',
        marginBottom: 12,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 14,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-muted, #71717a)',
          letterSpacing: '0.5px',
        }}
      >
        TIP {String(idx).padStart(2, '0')}
      </div>
      <div style={tipTitle}>{t.title}</div>
      <div style={{ ...bodyText, fontStyle: 'italic', color: 'var(--text-primary, #fff)' }}>
        {t.principle}
      </div>
      <div style={subLabel}>Why it matters</div>
      <div style={bodyText}>{t.rationale}</div>
      <div style={subLabel}>Concrete action</div>
      <div style={{ ...bodyText, marginBottom: 0 }}>{t.action}</div>
    </div>
  );
}

// ─── Section 1 — Narrative & Positioning ──────────────────────────────────

const SECTION_NARRATIVE: Tip[] = [
  {
    title: 'Your age is the lede, not the footnote',
    principle:
      'Lead every second meeting with the product. Let the founder story close the deal, not open it.',
    rationale:
      'The arc that converts is: they sign up because the demo is sharp, THEN discover a 16-year-old built it, THEN buy because now they have to know what they are missing. If you lead with the age, it becomes a novelty story and the product has to fight an uphill battle. If you lead with the product and reveal the age on the second call, it is a closing weapon. Save the asymmetry for the moment of maximum leverage.',
    action:
      'Audit every cold-outbound asset (pitch deck, website, cold emails). Make sure the first 10 seconds are about bias detection, not about you. Put the age + Wiz-advisor story on slide 3 of the deck, not slide 1. Never lead with it in first contact.',
  },
  {
    title: 'Your gross-margin slide is your best slide — stop burying it',
    principle:
      "At ~97% gross margins with $0.03–0.07 API cost against $129 Pro pricing, you are a pre-seed investor's dream. Most AI startups at your stage are underwater on gross margin. You are not.",
    rationale:
      'Pre-seed investors have been burned by AI wrapper companies whose unit economics are terrible once you back out the API costs. Your unit economics are the opposite of that pattern, and you buried them on slide 8. The most durable thing you can show a skeptical investor in 2026 is that you will not run out of money and you do not need to raise again at any particular price. Gross margin is how you prove it without saying it.',
    action:
      'Move the 97% gross margin unit economics slide to position 2 or 3 of the deck, right after the problem. Add a 12-month burn projection at 100 / 1000 / 10000 paying customers. Include the exact API cost breakdown. Investors will remember this slide for weeks.',
  },
  {
    title: 'Reframe the product around calibrated intuition, not bias elimination',
    principle:
      '"We find biases" positions you as a critic. "We calibrate your intuition against your own historical outcomes" positions you as a coach. Senior decision-makers buy coaches, not critics.',
    rationale:
      'Every experienced PE partner and IC member knows that biases are sometimes protective — pattern recognition earned from 20 years of decisions is not a bug. Telling them they have biases makes them defensive. Telling them you will help them separate the biases that cost them money from the intuitions that made them money flips the frame. You already have the underlying code for this — beneficial-patterns.ts detects when compound biases HELP in specific contexts. Nobody else is doing this, and nobody else is even talking about it. Own the narrative.',
    action:
      'Rewrite the homepage headline test: "The memo reviewer that catches what your partners will not challenge you on" or "Calibrate your intuition against your own deal history, not industry averages." A/B test against "AI-powered cognitive bias audit engine." Watch conversion, not ego.',
  },
];

// ─── Section 2 — Moat Discipline ──────────────────────────────────────────

const SECTION_MOAT: Tip[] = [
  {
    title: 'Your moat dies the day a better prompt outperforms your pipeline',
    principle:
      'Plan for the day Gemini 3 or GPT-5 single-shots bias detection as well as your 11-node pipeline. That day is coming. Your long-term moat must not be the model.',
    rationale:
      'Every AI startup that positions its moat around "we use a better prompt" gets flattened the moment the underlying foundation model catches up. The prompt engineering corpus is a Day-1 moat — real, valuable, and temporary. The enduring moat is (a) the outcome data you alone are collecting, (b) the compliance framework mapping competitors cannot ship without legal review, and (c) the behavioral-change loop (nudges + playbooks) that turns detection into retention. Start migrating the pitch from "better AI" to "proprietary data" within six months, before a competitor built on a frontier model catches up on the pure-analysis axis.',
    action:
      'Put a calendar reminder for six months out: audit the pitch deck. Any slide whose moat claim depends on "our pipeline is more sophisticated" must be rewritten to depend on "we have data nobody else can get." Start now — rewrite slide 10 of the deck this quarter.',
  },
  {
    title: 'The compounding data is the real long-term moat — start collecting properly on day one',
    principle:
      'Every analysis, every outcome, every bias-thumbs-down, every playbook invocation should land in a clean, immutable, ML-ready event log. Two days of schema work now saves six months in year two.',
    rationale:
      'The existing codebase audit flagged JSON denormalization in the Analysis model and schema drift risk. At your current scale it does not matter. At 1000 paying customers it matters catastrophically — every data science question will require a painful ETL pass, and every question you cannot answer quickly is a competitor who gets there first. The fix is cheap right now and impossible later. Also: make sure every outcome confirmation, every thumbs-down, and every playbook effectiveness rating flows into a single event table with orgId, userId, event-type, and a structured payload. This is the foundation of every future ML feature.',
    action:
      'This sprint: add a DecisionEvent model to Prisma with columns (id, orgId, userId, eventType, subjectType, subjectId, payload JSONB, occurredAt). Hook every meaningful user action into it. The ML engineer you hire in 18 months will thank you.',
  },
  {
    title: 'Publish a stable Bias Taxonomy with permanent IDs (DI-B-001 through DI-B-020)',
    principle:
      'Give every bias in your ontology a stable, citable identifier like a CWE for cognitive biases. Let other tools, researchers, and journalists reference them by ID.',
    rationale:
      'Owning a taxonomy in a category is one of the most durable and cheapest moats in software. Once your bias IDs are cited in academic papers, trade publications, and compliance documents, you own the vocabulary of the space. Every time someone writes "DI-B-007 (Echo Chamber)" you get free authority and SEO. This takes maybe two days of work and has a 10-year payoff. The biases are already defined in src/lib/constants/bias-education.ts — all you need to do is assign stable IDs, publish them at decisionintel.com/taxonomy, and start citing them yourself in every research-footnote and PDF export.',
    action:
      'Week 1 action. Assign DI-B-001 through DI-B-020 to the 20 biases. Add a public page /taxonomy that lists each one with citation, academic grounding, and detection methodology. Include the taxonomy IDs in the M8 Audit Defense Packet. Cite them in the "bias of the week" newsletter.',
  },
  {
    title: 'Build the Decision Incident Database — your Bloomberg Terminal seed',
    principle:
      'Curate an anonymized, searchable database of "decision → bias signature → outcome" triples. Turn this into your flagship content asset and a premium feature gated behind Pro+.',
    rationale:
      'You already have 146 case studies in src/lib/data/case-studies.ts. That is the seed corpus for what could become the most valuable dataset in decision intelligence — the only one of its kind. Every real customer outcome that you can anonymize and aggregate adds density. The Incident Database becomes the marketing magnet (teaser on the marketing site), the research credential (academic collaborations), the sales demo ("here are 5 failed deals whose bias signature matched yours"), and the defensible dataset (nobody else has it). It is three products in one. Most founders underestimate how durable a proprietary dataset moat is — because they have never had one.',
    action:
      'Put the consent checkbox for anonymized outcome aggregation in onboarding NOW, while you have ~0 customers. Retroactive consent at 100 customers is legally painful and morally ugly. Build a public teaser page showing 10 anonymized incidents. Gate the full searchable database behind Pro+.',
  },
];

// ─── Section 3 — GTM & Wedge ──────────────────────────────────────────────

const SECTION_GTM: Tip[] = [
  {
    title: 'Pick one vertical, dominate it, then expand — not three at once',
    principle:
      'At your stage, three wedges means three fractional wedges means zero traction. Use the warmest door, not the best-looking ICP.',
    rationale:
      'The pitch deck lists tech → PE/VC → risk firms as the sequence. That is three wedges dressed as one. PE/VC is romantic because of the "Every IC memo has 3-5 hidden biases" story, but PE/VC sales cycles are 9-18 months, partners are culturally skeptical of tools, and they LOVE being the smartest person in the room (bias audits threaten ego). Meanwhile you have a Wiz-connected advisor who opens doors into pre-IPO tech strategy/risk teams in one phone call. That is the warmest wedge by far. Wedge selection is about relationship temperature, not ICP quality on paper. Come back to PE/VC at Series A when you can afford a GTM hire who owns that motion.',
    action:
      'Rewrite the GTM section of the pitch deck around pre-IPO tech strategy/risk teams, not PE/VC. Keep PE/VC in an appendix slide as a secondary expansion motion. Ask the Wiz advisor for 5 specific warm intros this month and treat those 5 conversations as your north star.',
  },
  {
    title: 'Use the Wiz advisor network as your warmest wedge — ask for specific names',
    principle:
      'Generic "intro me to anyone who might buy this" asks get generic responses. Specific asks get specific introductions. Your advisor is a senior industry figure; respect their time with precision.',
    rationale:
      'When asking an advisor for intros, "anyone you think would find this interesting" returns 0 intros per month because the ask requires the advisor to do the targeting work. "Can you introduce me to Jane Smith, VP of Strategy at [Company], because I read her interview about strategic risk and think she would find the compliance audit angle specifically useful" returns one intro per ask because all the work is done except the forwarding. Make it impossible for the advisor to say no by making the ask surgical.',
    action:
      'This week: write 10 specific named asks. For each, include (1) the person, (2) the specific piece of public content or role that made them relevant, (3) a 2-sentence pitch the advisor can copy-paste, (4) the single ask ("15 minutes to show a 3-minute demo"). Send to the advisor as one batched message. Repeat monthly.',
  },
  {
    title: 'Lock one paid design partner before you raise — logo > claim',
    principle:
      'One paying customer with a named logo and a quotable testimonial is worth more at the pitch-deck stage than 10 "interested" LOIs.',
    rationale:
      'Pre-seed investors have seen every permutation of "product has strong positive reception" and they discount it to zero because that phrase is unfalsifiable. One paying design partner — even at a steeply discounted rate — is a different category of signal entirely. It says "someone wrote a check, not just said nice things." Offer the first design partner a year of Team tier free in exchange for (1) using the product on ≥3 real decisions, (2) providing monthly feedback, (3) letting you use the logo and quote a named person. That trade is overwhelmingly in your favor — you get the moat signal, they get free enterprise software.',
    action:
      'Identify 3 candidate design partners from warm intros. Pitch each with the explicit deal: 12 months free Team tier in exchange for logo + quote + quarterly case study. Close one before the next pitch meeting. If none bite after 5 conversations, rethink the wedge, not the offer.',
  },
];

// ─── Section 4 — Execution ────────────────────────────────────────────────

const SECTION_EXECUTION: Tip[] = [
  {
    title: 'Ship an eval harness this month — turn "trust us" into a public number',
    principle:
      'Build a golden dataset of 50 hand-labeled IC memos with known biases. Run your pipeline against it in CI. Publish the accuracy number on your marketing site. Reran weekly.',
    rationale:
      'Right now the codebase has 233 tests but zero that measure end-to-end bias detection accuracy. That means every claim about precision is unfalsifiable — including claims to yourself. An eval harness gives you three things simultaneously: (1) a marketing asset ("72% precision on hand-labeled dataset, up from 58% last quarter"), (2) regression protection for prompt changes, and (3) the single most attractive thing you can show an ML engineer when you eventually hire one. Without an eval harness you cannot safely change a prompt, cannot prove improvement over time, and cannot recruit. With one, every prompt iteration becomes a measurable improvement.',
    action:
      'This week: create /evals/ directory with 10 seed memos (write them yourself, annotate biases manually). Add a Vitest integration test that runs the full pipeline against each, computes precision/recall against the labels, and fails CI if the number drops. Grow to 50 memos over the next month. Publish the current number on decisionintel.com/accuracy.',
  },
  {
    title: 'Build in public every week — changelog thread + screenshot + metric',
    principle:
      'For a solo teen founder, every week of public building is compounding credibility interest. For a solo teen founder who does not build in public, every week is a month of lost signal.',
    rationale:
      'You have 342+ commits and 183K lines of code and presumably zero Twitter following. That is career malpractice at your age. The founders who compound reputation fastest are the ones who turn private effort into public artifact. Every Friday: one screenshot, one metric, one sentence about what shipped. Thread it. Tag relevant people. Do not over-explain. The point is not virality — the point is that by the time you raise seed, 10,000 people in the right circles recognize your name, and half of GTM is already done. Geographic arbitrage compounds — the cost of maintaining this habit is 30 minutes a week.',
    action:
      'Set a recurring Friday calendar block: 30 minutes for "this week shipped." Post to X, LinkedIn, and an email newsletter (Substack or Beehiiv). First post this Friday. Do not break the streak. The thing that kills solo-founder momentum is the week you skip because nothing felt shippable — that week always has something shippable.',
  },
  {
    title: 'No new backend model without its UI surface — break the invisible-progress trap',
    principle:
      'The codebase has a consistent pattern: complete schemas, complete APIs, complete business logic, missing UI. Invisible progress feels like progress but compounds to nothing. Stop letting yourself ship backends without frontends.',
    rationale:
      'You have BlindPrior schemas without the voting UI, TeamCognitiveProfile tables without a dedicated page, ToxicCombination records not rendered on analysis detail, PlaybookInvocation planned but no button, and outcome-inference.ts writing DraftOutcomes that users may never see surfaced properly. Every one of these is 100-300 lines of React away from becoming a visible product feature. This is the classic technical-founder trap: backend feels like "hard work" and frontend feels like "polish," so the hard work never ships as product value. Invert the rule: any backend change must be merged in the same PR as its minimal UI. Your sales pipeline depends on visible features, not invisible ones.',
    action:
      'Add a self-enforced rule to your PR template: "Does this PR add or modify a backend model or API route? If yes, is there a UI surface in the same PR that uses it? If no, explain why in the description." The explanation step is enough friction that you will default to including UI. Trust the rule, not your willpower.',
  },
  {
    title: 'Delete features your users do not use — publicly, with a blog post',
    principle:
      'The most on-brand thing the founder of a bias-audit company can do is publicly audit their own product for the sunk-cost fallacy and kill features. Do it. Screenshot the before-after.',
    rationale:
      'The dashboard has 30+ top-level routes. Many are thin, some are redundant, a few are orphaned. You will feel the sunk-cost fallacy when consolidating them. But the entire product hypothesis of Decision Intel is that sunk cost destroys decision quality. Living that principle publicly is a) the strongest content marketing asset you will ever create and b) a weekly forcing function to audit your own product scope. The post writes itself: "This week I used my own tool on my own dashboard. It flagged sunk cost + IKEA effect on 14 pages I had grown attached to. Here is what I deleted and why." This is the highest-ROI content marketing act you can perform, and it only works once per company.',
    action:
      'After M3.1 and M3.3 ship (the Ask consolidation and shim cleanup), write the blog post. Include before/after screenshots of the sidebar. Quote your own product telling you to delete things. Publish on the company blog, X, and LinkedIn. One post, massive asymmetric return.',
  },
];

export function FounderTipsTab() {
  return (
    <div>
      <div style={{ ...card, borderTop: '3px solid #00d2ff' }}>
        <div style={sectionTitle}>
          <Compass size={18} style={{ color: '#00d2ff' }} /> Founder Tips — Strategic Principles To
          Refer Back To
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary, #b4b4bc)',
            lineHeight: 1.6,
            marginBottom: 0,
          }}
        >
          Fourteen principles grounded in your specific position: solo founder, 16, Nigeria, PE/VC
          wedge, Wiz advisor, 97% gross margins, 183K LoC already shipped. Re-read when deciding
          what to build next, what to kill, what to say in a pitch, and what to ignore.
        </p>
      </div>

      <div style={{ ...card, borderLeft: '3px solid #3b82f6' }}>
        <div style={sectionTitle}>
          <Target size={18} style={{ color: '#3b82f6' }} /> Section 1 — Narrative & Positioning
        </div>
        {SECTION_NARRATIVE.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 1} />
        ))}
      </div>

      <div style={{ ...card, borderLeft: '3px solid #8b5cf6' }}>
        <div style={sectionTitle}>
          <Shield size={18} style={{ color: '#8b5cf6' }} /> Section 2 — Moat Discipline
        </div>
        {SECTION_MOAT.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 4} />
        ))}
      </div>

      <div style={{ ...card, borderLeft: '3px solid #22c55e' }}>
        <div style={sectionTitle}>
          <Rocket size={18} style={{ color: '#22c55e' }} /> Section 3 — GTM &amp; Wedge
        </div>
        {SECTION_GTM.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 8} />
        ))}
      </div>

      <div style={{ ...card, borderLeft: '3px solid #f59e0b' }}>
        <div style={sectionTitle}>
          <Hammer size={18} style={{ color: '#f59e0b' }} /> Section 4 — Execution
        </div>
        {SECTION_EXECUTION.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 11} />
        ))}
      </div>
    </div>
  );
}
