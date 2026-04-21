'use client';

import type React from 'react';
import { Compass, Target, Shield, Rocket, Hammer, Wrench, Map, Flag } from 'lucide-react';

/**
 * Founder Tips — personalized strategic principles for the Decision Intel
 * founder to refer back to. Content is grounded in the founder's specific
 * position (16-year-old solo founder, Nigeria, corporate strategy/M&A wedge, Wiz advisor).
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
      "At ~90% blended gross margins (~$0.40-0.65 per audit, 17 LLM calls across the 12-node pipeline) against $249 Individual ($2,499 Strategy, Enterprise custom), you are a pre-seed investor's dream. Most AI startups at your stage are underwater on gross margin. You are not.",
    rationale:
      'Pre-seed investors have been burned by AI wrapper companies whose unit economics are terrible once you back out the API costs. Your unit economics are the opposite of that pattern, and you buried them on slide 8. Lead with ~90% blended (the defensible number), not 97% (the ghost-user number). The most durable thing you can show a skeptical investor in 2026 is that you will not run out of money and you do not need to raise again at any particular price. Gross margin is how you prove it without saying it.',
    action:
      'Move the gross margin slide to position 2 or 3 of the deck, right after the problem. Use "~90% blended" — defensible across usage patterns. Add a 12-month burn projection at 100 / 1000 / 10000 paying customers. Include the exact per-audit API cost breakdown. Investors will remember this slide for weeks.',
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
      'Plan for the day Gemini 3 or GPT-5 single-shots bias detection as well as your 12-node pipeline. That day is coming. Your long-term moat must not be the model.',
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
      'Week 1 action. Assign DI-B-001 through DI-B-020 to the 20 biases. Add a public page /taxonomy that lists each one with citation, academic grounding, and detection methodology. Include the taxonomy IDs in the Decision Provenance Record. Cite them in the "bias of the week" newsletter.',
  },
  {
    title: 'Build the Decision Incident Database — your Bloomberg Terminal seed',
    principle:
      'Curate an anonymized, searchable database of "decision → bias signature → outcome" triples. Turn this into your flagship content asset and a premium feature gated behind Pro+.',
    rationale:
      'You already have 135 case studies in src/lib/data/case-studies. That is the seed corpus for what could become the most valuable dataset in decision intelligence — the only one of its kind. Every real customer outcome that you can anonymize and aggregate adds density. The Incident Database becomes the marketing magnet (teaser on the marketing site), the research credential (academic collaborations), the sales demo ("here are 5 failed deals whose bias signature matched yours"), and the defensible dataset (nobody else has it). It is three products in one. Most founders underestimate how durable a proprietary dataset moat is — because they have never had one.',
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
      'Corporate strategy and M&A teams are the primary wedge — they have defined budgets, make high-frequency decisions, and the ego-threat problem is much lower than PE/VC. A VP of Strategy or Head of M&A can greenlight a pilot without LP politics. PE/VC sales cycles are 9-18 months, partners are culturally skeptical of tools, and they believe their edge IS judgment (bias audits threaten ego). Corporate teams are more receptive: they already use consultants for strategic reviews, so an AI audit layer is a natural evolution. Come back to PE/VC at Series A when you can afford a GTM hire who owns that relationship-driven motion.',
    action:
      'Rewrite the GTM section of the pitch deck around corporate strategy and M&A teams as the primary wedge. Keep PE/VC in an appendix slide as a secondary expansion motion. Ask the Wiz advisor for 5 specific warm intros to corporate strategy/M&A leaders this month and treat those 5 conversations as your north star.',
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
  {
    title: 'First paying customer is the only milestone before fundraise',
    principle:
      'Everything else is theater. Pricing is locked, margin is locked, product is locked. The fundraise is downstream of one logo. Every week ask: did I do something that moves that needle?',
    rationale:
      'Content generation, CLAUDE.md updates, auditing dashboards, feature polish — none of those move the milestone. Only conversations with Chief Strategy Officers do. When weeks pass without a CSO conversation, the real metric (time-to-first-check) stalls silently while internal metrics (commits shipped, features added) keep rising. The two diverge without anyone noticing, and by month four the fundraise is harder than it was at month one despite looking more polished. The only leading indicator for pre-revenue is CSO-conversations-per-week. Track that number and force yourself to look at it every Friday.',
    action:
      'Weekly Friday ritual: write down every CSO conversation had that week (name, company, stage, next step). If the list is empty or frozen from last week, flag it as the week\u2019s emergency and rebook before Monday. Put the list at the top of TODO.md so every session starts with it visible.',
  },
  {
    title: 'GTM co-founder is a 6-month recruiting project, not a 1-month one',
    principle:
      "Don't wait until the fundraise to start looking. Every CSO pitched is also a potential advisor / co-founder signal. The best GTM partner is someone who already loves the product but can't buy it yet.",
    rationale:
      'Technical founders almost universally wait until after their pre-seed to hire a GTM co-founder — and then discover the search takes 6 months of its own, extending the runway gap by exactly that much. The ones who compound fastest flip the order: they use the pre-revenue customer conversations as a live funnel for GTM talent. When a prospect says "I love this but I couldn\u2019t buy it right now," that\u2019s the exact signal of a potential GTM partner: they understand the buyer, they believe in the product, and they have zero political reason to block. Treat every positive-but-no-budget conversation as a candidate lead, not a dead deal.',
    action:
      'Maintain a private spreadsheet: name, company, role, date, signal strength (1-5). Every "interested but not now" conversation gets a row. Top 3 highest-signal contacts get a targeted re-engagement every 6 weeks with a specific ask ("4 hours a week for advisor equity" after 2-3 touchpoints). Review the sheet quarterly with the Wiz advisor.',
  },
];

// ─── Section 4 — Execution ────────────────────────────────────────────────

const SECTION_EXECUTION: Tip[] = [
  {
    title: 'Ship an eval harness this month — turn "trust us" into a public number',
    principle:
      'Build a golden dataset of 50 hand-labeled strategy and M&A memos with known biases. Run your pipeline against it in CI. Publish the accuracy number on your marketing site. Reran weekly.',
    rationale:
      'Right now the codebase has 586 tests but zero that measure end-to-end bias detection accuracy. That means every claim about precision is unfalsifiable — including claims to yourself. An eval harness gives you three things simultaneously: (1) a marketing asset ("72% precision on hand-labeled dataset, up from 58% last quarter"), (2) regression protection for prompt changes, and (3) the single most attractive thing you can show an ML engineer when you eventually hire one. Without an eval harness you cannot safely change a prompt, cannot prove improvement over time, and cannot recruit. With one, every prompt iteration becomes a measurable improvement.',
    action:
      'This week: create /evals/ directory with 10 seed memos (write them yourself, annotate biases manually). Add a Vitest integration test that runs the full pipeline against each, computes precision/recall against the labels, and fails CI if the number drops. Grow to 50 memos over the next month. Publish the current number on decisionintel.com/accuracy.',
  },
  {
    title: 'Build in public every week — changelog thread + screenshot + metric',
    principle:
      'For a solo teen founder, every week of public building is compounding credibility interest. For a solo teen founder who does not build in public, every week is a month of lost signal.',
    rationale:
      'You have 342+ commits and 199K lines of code and presumably zero Twitter following. That is career malpractice at your age. The founders who compound reputation fastest are the ones who turn private effort into public artifact. Every Friday: one screenshot, one metric, one sentence about what shipped. Thread it. Tag relevant people. Do not over-explain. The point is not virality — the point is that by the time you raise seed, 10,000 people in the right circles recognize your name, and half of GTM is already done. Geographic arbitrage compounds — the cost of maintaining this habit is 30 minutes a week.',
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

// ─── Section 5 — Refinement & Consolidation ─────────────────────────────

const SECTION_REFINEMENT: Tip[] = [
  {
    title: 'Your 40+ routes are a surface area liability, not a feature count asset',
    principle:
      'Every route a user never visits is a maintenance burden that slows you down and a cognitive burden that confuses them. Consolidation is not retreat, it is focus.',
    rationale:
      'You have 40+ dashboard routes, 16 Founder Hub tabs, 45+ visualization components, and 201 total components. At your stage, surface area works against you in three ways: (1) every route needs loading states, error handling, and responsive design maintained separately, (2) new users drown in options before they find the core value, and (3) every new feature you ship has to play nicely with 40 existing pages. The most successful B2B SaaS products at your stage have 5-7 core screens, not 40. The ones that survive past Series A are the ones that ruthlessly consolidated before scaling. Your analysis detail page, copilot, and dashboard are the core trio. Everything else should justify its existence by driving users to one of those three.',
    action:
      'Run your own analytics (or add them) to identify which routes get <5% of pageviews. For each, decide: merge into a parent page, gate behind a "power user" toggle, or delete. Target: reduce top-level sidebar items by 30% this quarter. Blog the process using Tip 14.',
  },
  {
    title: 'Polish the first 60 seconds, not the last 60 features',
    principle:
      'A demo that is flawless for the first 60 seconds and missing 10 features beats a demo that has every feature but stutters on the upload screen.',
    rationale:
      'You have a live pipeline graph, boardroom simulation, toxic combination detection, counterfactual analysis, decision rooms, calibration gamification, knowledge graphs, and a dozen more features. But the make-or-break moment for every prospect is: upload a document, see the DQI score, and feel the "oh wow" moment. If the upload is slow, the progress bar is confusing, or the score reveal is anticlimactic, nothing else matters. The best enterprise demos in the world (Figma, Linear, Wiz) nail the first 60 seconds so hard that the prospect forgets to ask about features. Your first 60 seconds should be: drag-drop upload, the live pipeline graph lighting up nodes in real time, score reveal with a pause for dramatic effect, and then the first bias excerpt with the exact quote highlighted. Polish that sequence until it is cinematic. Everything after that sells itself.',
    action:
      'Record yourself doing the demo 5 times. Watch each recording. Time the gap between "upload" and "score visible." If it is more than 15 seconds, optimize. Add a subtle sound or haptic on score reveal if the browser supports it. Test with 3 non-technical people and ask them what they remember. If they do not mention the score, the reveal needs work.',
  },
  {
    title: 'Your Founder Hub is your second brain, treat it like a product',
    principle:
      'The Founder Hub with 16 tabs, Content Studio, and AI chat is the most unusual and potentially most defensible internal tool in your stack. It is also the thing investors will screenshot and share.',
    rationale:
      'Most founders keep strategy in Notion, content in Google Docs, sales scripts in email drafts, and competitor intel in their head. You built a single integrated tool that connects your product knowledge, sales playbooks, research foundations, case studies, content generation, and strategic principles in one place, with an AI that has full context. This is not just an internal tool. It is a proof point for the product thesis: decision quality improves when context is structured, searchable, and augmented by AI. During a pitch, casually showing the Founder Hub as "how I use Decision Intel on my own company" is the most powerful demo you can give because it eliminates the "does the founder even use this?" question. Keep refining it. Consider eventually productizing the pattern as a "Strategy Hub" template for enterprise customers.',
    action:
      'Next investor call: share your screen on the Founder Hub for 30 seconds as a throwaway moment. Say "This is how I run my own strategy" and switch to the real demo. Watch their reaction. If they lean in, you have a second product line.',
  },
];

// ─── Section 6 — Phase Awareness ─────────────────────────────────────────

const SECTION_PHASE: Tip[] = [
  {
    title: 'You are in the "make it undeniable" phase — every feature should earn its screen space',
    principle:
      'Before you shipped 30 features, the risk was doing too little. Now the risk is doing too much. Every feature that stays should pass the test: "Would a prospect remember this from a 15-minute demo?"',
    rationale:
      'You have more features than most Series A companies. That is both an asset and a liability. The asset: you can demo anything a prospect asks about. The liability: you are spreading your own attention across surfaces that do not compound. At your stage, the highest-leverage move is not shipping feature 31 — it is making features 1 through 5 so polished, so fast, so visually compelling that nobody can look at a competitor and feel the same level of confidence. The companies that win at pre-seed are the ones that feel "finished" even though they are early. Linear felt finished at seed. Figma felt finished at seed. That feeling comes from relentless polish on the core loop, not from feature count.',
    action:
      'Walk through the entire app as if you are a first-time user with zero context. Time every interaction. Write down every moment of friction or confusion. Fix the top 5 friction points before building anything new. Repeat monthly.',
  },
  {
    title: 'Your Audit Log and Compare features are enterprise-closer gold — surface them in demos',
    principle:
      'The Audit Log (compliance tracking with CSV export) and Compare Analyses (side-by-side delta scoring) are exactly what enterprise buyers ask about in security reviews and POCs. They exist but are not in your pitch flow.',
    rationale:
      'Enterprise deals die in procurement, not in the demo. The features that close enterprise deals are not the flashy ones (pipeline visualization, boardroom simulation) but the boring ones (audit trails, export capabilities, comparison tools, SSO). You built the Audit Log and Compare features but they are buried in the nav. In your next enterprise conversation, when they ask "how do we track who accessed what," you should be able to show the Audit Log in under 3 seconds. When they ask "how do we measure improvement," the Compare tool is the answer. These are closing features, not discovery features. Sequence them accordingly in the demo.',
    action:
      'Add the Audit Log and Compare tools to the enterprise section of your demo script in the Sales Toolkit tab. When a prospect asks about compliance or SOC2, show the Audit Log immediately — do not explain it, just show it. The CSV export button is your closing argument.',
  },
  {
    title:
      'Consolidate before you fundraise — investors fund focused products, not feature catalogs',
    principle:
      'A product with 10 polished screens tells a clearer story than one with 40 functional screens. Investors evaluate clarity of vision, not completeness of backlog.',
    rationale:
      'When an investor opens your product, they form an opinion in 60 seconds. If they see a dense sidebar with 15+ items, the mental model they build is "this founder ships a lot but has not yet found focus." If they see 5-7 crisp sections that flow logically (Upload → Analyze → Review → Track → Improve), the mental model is "this founder knows exactly what the product is." Both impressions are formed before they read a single bias result. The sidebar IS the pitch. Consolidate analytics tabs into one, merge overlapping pages, and hide power-user features behind contextual actions rather than top-level nav items.',
    action:
      'Target: reduce sidebar nav items by 30% before the next investor conversation. Merge Trends & Insights, Decision Intelligence, and Explainability into the Analytics tab (which already exists). Move Calibration and Decision Rooms into a "Teams" section. Keep the core flow to 5 items: Dashboard, Analyze, History, Analytics, Settings.',
  },
];

// ─── Section 7 — Product Roadmap ─────────────────────────────────────────

const SECTION_ROADMAP: Tip[] = [
  {
    title: 'Real-time meeting bias detection is the ultimate shift-left play',
    principle:
      'You already support meeting transcript upload and post-hoc analysis. The next step: a meeting bot that joins calls and provides real-time bias nudges during the meeting, not after the document is written.',
    rationale:
      'The difference between post-hoc analysis and real-time coaching is the difference between a doctor reviewing your charts and a coach whispering in your ear during the game. Every PE partner who sees real-time bias detection during an IC meeting will immediately understand the value. The technical path is: Recall.ai or similar meeting bot SDK for meeting join, streaming transcription, lightweight bias signal detection (reuse existing client-bias-scanner.ts patterns), and in-meeting Slack DMs or overlay notifications. This is a 6-month engineering project but a 6-second sales pitch: "We detect groupthink forming in your IC meeting before the vote."',
    action:
      'Phase 1: Build a prototype that takes a live transcript feed (simulated from a recorded meeting) and detects bias signals in real-time with a 3-second delay. Show it at the next investor meeting as a vision slide. Phase 2: Integrate Recall.ai for actual meeting join. Phase 3: Build the in-meeting notification UX. Do not start Phase 2 until you have your first paying customer for the core document analysis product.',
  },
];

// ─── Section 8 — Fundraise Posture & Founder Discipline (locked 2026-04-23) ──

const SECTION_FUNDRAISE: Tip[] = [
  {
    title: 'The "16 hours" principle — turn the age into the thesis',
    principle:
      'Do not bury the fact that you shipped 200+ components and 70+ API routes in 16 hours a week while finishing school. Name it. "When I am full-time in San Francisco in 18 months, what do you expect the velocity to be?" That question, asked first, flips the age objection into the diligence item that sells the round.',
    rationale:
      'Every pre-seed investor who sees a 16-year-old solo founder is already running the age objection in their head — ignoring it does not make it go away, it just leaves them to resolve it privately with a discount to conviction. Naming it first, with a concrete velocity claim the investor can mentally extrapolate, converts the objection from a silent risk into a public thesis they have to reason against. The math is: 16-hours-a-week velocity × 5x full-time multiplier × 18-month horizon = the fastest-compounding technical founder they have met this year. That is the sentence. Once they are on that side of the argument, the rest of the pitch is downhill.',
    action:
      'Rewrite slide 2 of the deck. Replace any soft age framing with a three-line founder card: "16, solo technical founder. Built 200+ components and 70+ API routes in ~16 hours/week alongside secondary school. Moving full-time to San Francisco in 18 months." Then in the voiceover: "The velocity you see was part-time. Project forward." Practice saying it 10 times out loud before the next pitch.',
  },
  {
    title: 'Pick ONE CSO and commit to them for 90 days',
    principle:
      'The hit rate on one committed CSO relationship beats the hit rate on 100 cold DMs by more than the inverse ratio. Stop thinking in outreach volume. Start thinking in depth on a single targeted relationship.',
    rationale:
      'Solo founders underweight long-horizon 1:1 relationships because they do not produce daily dashboard metrics — no new responses, no new logos, no new numbers move for weeks. But pre-seed design partners are never won from the cold-DM layer; they are won from the "I have been watching you for three months and you showed up every single week" layer. The Wiz advisor network gives you direct access to exactly this kind of long-horizon relationship. Pick one specific CSO — the single most likely to become your first paying design partner — and commit: weekly email with one specific insight from their industry, monthly 30-minute call, quarterly in-person if the geography works. No pitching in weeks 1-6. Just value. The ask comes in week 8 and lands because they already know what you do.',
    action:
      'This week: rank every CSO the advisor has introduced or could introduce, score each on (a) likelihood of becoming design partner in 90 days, (b) fit of their industry to your 135-case corpus, (c) role authority to greenlight a $2,499/mo contract unilaterally. Pick the top one. Send email 1 on Friday ("one insight from your industry I think you will find useful"). Calendar the next 12 weekly Fridays. Do not skip.',
  },
  {
    title: 'The advisor is a door, not a verdict',
    principle:
      'Use the Wiz advisor for: warm intros, objection rehearsal on the one toughest investor question, final pitch-deck read before send. Do not wait on advisor sign-off to ship product decisions. Advisor round-trips cost 3-5 days of velocity each — too expensive at your cadence.',
    rationale:
      'The trap a first-time founder with a senior advisor falls into is treating every advisor call as a gate. "I will wait to ship this until the advisor weighs in on positioning." That sounds like diligence. It is actually displacement — you are outsourcing your own conviction to a proxy. The advisor has seen this pattern before and it is why the second-best thing they can do for you (after warm intros) is push back when you ask them to rule on things that are yours to decide. Use the advisor for the asks only they can fulfill: (1) warm intros to specific named CSOs in their network, (2) objection-handling rehearsal for the single toughest investor question you are dreading, (3) final read on the pitch deck before you send it to the first partner call. Everything else — product, pricing, positioning tweaks, route consolidation, feature kill decisions — you decide yourself, at your own velocity, and the advisor hears about it at the monthly sync.',
    action:
      'Write three lists today: (1) the five warm intros you will ask for this month (specific names, with a 2-sentence pitch the advisor can forward verbatim), (2) the one investor question you are most afraid of ("Why will a CSO trust a 16-year-old with their decision process?") and the answer you want to rehearse with the advisor, (3) the one version of the pitch deck you will ask them to read. Send all three as a single batched message. No other advisor asks this quarter.',
  },
  {
    title: 'Stop updating CLAUDE.md and TODO.md so often',
    principle:
      'You are averaging a positioning lock per 2 days. That is refactoring-as-anxiety-management — productive-feeling but displaced from the one metric that matters: CSO conversations. Force yourself to go 7 days without touching CLAUDE.md or TODO.md.',
    rationale:
      "The most dangerous form of founder productivity is the kind that looks identical to real work while producing zero movement on the pre-revenue milestone. Updating CLAUDE.md with today's positioning lock feels productive — it is productive — but the marginal return on the 14th positioning lock in a month is near zero. The marginal return on one CSO conversation is the whole game. The 7-day CLAUDE.md freeze is a forcing function: every time the reflex to update it kicks in, redirect that same 15 minutes to either a cold outbound email, a LinkedIn post, or a follow-up with the committed CSO from Tip 22. If at the end of Day 7 there genuinely is a CLAUDE.md update worth making, you will know it is real, not self-soothing. Most weeks, Day 7 comes and the list is empty — which is itself the lesson.",
    action:
      'Today: commit a calendar block called "CLAUDE.md freeze — do not touch until [date + 7]." In that 7-day window, every 15 minutes that would have gone to CLAUDE.md goes to one of three things: CSO cold outbound, one weekly LinkedIn post, or a follow-up to the committed CSO. Log those three numbers at the end of Day 7. If the numbers are zero, the freeze was the easiest part of the problem.',
  },
  {
    title: 'The fundraise is an interview, not a pitch',
    principle:
      'The real question a pre-seed investor asks is not "is the product good?" It is "will this founder still be alive in 18 months — emotionally, strategically, geographically?" At 16, solo, moving countries in 18 months, the answer to that question is your actual diligence item. Own it on slide 2, not in the Q&A.',
    rationale:
      'Investors do not decide on products; they decide on founders who happen to be working on products. When they look at you, the underwriting worry is not "can this product work" — your code, case studies, and pitch deck already answer that. The worry is: "can this specific founder sustain a 24-month pre-revenue slog, then move continents, then ramp a GTM team, all without the wheels coming off?" Owning that concern on slide 2 — three lines, calmly framed — preempts it from living in their head as a silent discount. "Solo, 16, Lagos → London → SF" is not a list of liabilities. Told correctly, it is a list of assets: (1) discipline no peer has, (2) transcontinental perspective that makes enterprise conversations sharper, (3) 18-month migration that is a built-in forcing function, not a risk. The investor will ask anyway. If you speak first, you own the frame.',
    action:
      'Add a "Founder" slide at position 2 of the deck. Three lines, no pictures, no theatrics. Line 1: "Folahan Williams, 16, solo technical founder. Lagos-raised, UK-resident, moving to San Francisco at 18." Line 2: "Shipped Decision Intel part-time while finishing secondary school. Advised by a senior Wiz operator." Line 3: "This arc — one continent per phase — is the thesis, not the risk." Rehearse the voiceover until it lands in 30 seconds flat.',
  },
  {
    title: 'One LinkedIn story per week, deeply edited — not one per day',
    principle:
      'The daily-linkedin cron optimizes for volume. Switch the mental model: one weekly post, 800+ words, one case study, personally signed. Less noise, more authority. Pre-seed investors stalk your LinkedIn. Five great posts beat thirty good ones.',
    rationale:
      'The daily cron is a compounding engine at low quality; the weekly deeply-edited post is a compounding engine at high authority. Both compound, but they compound different audiences. Daily-linkedin gets you coverage among strangers who scroll past. Weekly long-form gets you depth with the 30 people who will decide whether to fund you, intro you, or hire into you — specifically, corporate strategy leaders and pre-seed investors who value signal over frequency. The cron does not disappear; it becomes input. You let it draft Monday, then spend 2 hours Thursday editing the draft into a post with one case study, one sharp opinion, and one signed footer that says "Folahan Williams, founder, Decision Intel." The one-story-per-week discipline is also cheaper to sustain than daily posting — it survives the week you get sick, the week you have exams, the week you are moving flats. Habits that survive are the only habits that compound.',
    action:
      'This week: turn Thursday 19:00-21:00 into the weekly LinkedIn edit block on your calendar, recurring. Each Thursday: pull the cron draft from the daily-linkedin email, pick the single strongest case study, rewrite to 800+ words, add one signed opinion paragraph ("Here is what this means for you if you sit on a corporate board"), publish Friday morning. Do not break the streak. After 8 Fridays you will have a portfolio of depth posts to attach to any cold outbound; that is the moment the advisor intros start converting at 2-3x their current rate.',
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
          Twenty-nine principles grounded in your specific position: solo founder, 16, Nigeria,
          corporate strategy/M&amp;A wedge, Wiz advisor, ~90% blended gross margins, 199K+ LoC
          already shipped. Re-read when deciding what to build next, what to kill, what to say in a
          pitch, and what to ignore.
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
          <TipBlock key={t.title} t={t} idx={i + 13} />
        ))}
      </div>

      <div style={{ ...card, borderLeft: '3px solid #ec4899' }}>
        <div style={sectionTitle}>
          <Wrench size={18} style={{ color: '#ec4899' }} /> Section 5 — Refinement &amp;
          Consolidation
        </div>
        {SECTION_REFINEMENT.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 17} />
        ))}
      </div>

      <div style={{ ...card, borderLeft: '3px solid #06b6d4' }}>
        <div style={sectionTitle}>
          <Compass size={18} style={{ color: '#06b6d4' }} /> Section 6 — Phase Awareness
        </div>
        {SECTION_PHASE.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 20} />
        ))}
      </div>

      <div style={{ ...card, borderLeft: '3px solid #a855f7' }}>
        <div style={sectionTitle}>
          <Map size={18} style={{ color: '#a855f7' }} /> Section 7 — Product Roadmap
        </div>
        {SECTION_ROADMAP.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 23} />
        ))}
      </div>

      <div style={{ ...card, borderLeft: '3px solid #10b981' }}>
        <div style={sectionTitle}>
          <Flag size={18} style={{ color: '#10b981' }} /> Section 8 — Fundraise Posture &amp;
          Founder Discipline
        </div>
        {SECTION_FUNDRAISE.map((t, i) => (
          <TipBlock key={t.title} t={t} idx={i + 24} />
        ))}
      </div>
    </div>
  );
}
