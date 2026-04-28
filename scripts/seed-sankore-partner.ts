/**
 * Seed Script: Sankore Investments — first design partner / pilot prospect.
 *
 * Default mode: CREATE-ONLY. If the row already exists (matched by email),
 * this is a no-op. That way, every Vercel deploy safely runs this seed
 * without ever overwriting edits the founder made to founderNotes via the
 * Design Partners tab textarea.
 *
 * Force mode: set FORCE_SEED_SANKORE=1 to overwrite the existing row with
 * the values in this file. Use when iterating on positioning in Git and
 * you want to push fresh notes to the UI.
 *
 * Usage (manual):
 *   DATABASE_URL=<prod-url> npx tsx scripts/seed-sankore-partner.ts
 *   DATABASE_URL=<prod-url> FORCE_SEED_SANKORE=1 npx tsx scripts/seed-sankore-partner.ts
 *
 * Runs automatically on every Vercel deploy via scripts/seed-business-data.mjs.
 */

import { Prisma } from '@prisma/client';
import type { PartnerRichProfile } from '../src/types/partner-profile';
import { createSeedPrismaClient } from './seed-prisma-client';

const { prisma, pool } = createSeedPrismaClient();

// ─────────────────────────────────────────────────────────────────────────
// Sankore record — edit these fields as the pilot evolves, then re-seed.
// ─────────────────────────────────────────────────────────────────────────

const SANKORE_EMAIL = 'sankore-pilot@decision-intel.com'; // placeholder key until the real contact confirms; the upsert matches on this string

// ─────────────────────────────────────────────────────────────────────────
// Titi Odunfa Adeoye — the specific contact the founder is meeting with.
// Populates the Contacts & Meeting Prep tab on the Sankore detail page
// ready for the founder to click "Generate meeting prep" and get a
// tailored plan grounded in Sankore's rich profile + Titi's LinkedIn.
// ─────────────────────────────────────────────────────────────────────────

const TITI_CONTACT = {
  name: 'Titi Odunfa Adeoye',
  role: 'Founder & Chief Investment Officer · Sankore Investments',
  linkedInUrl: 'https://www.linkedin.com/in/titioadeoye/',
  linkedInInfo: `LinkedIn headline: "Investment Strategist | Entrepreneur | Alternative Investments."

About: Titi Odunfa Adeoye is the Founder and Chief Investment Officer of Sankore Investments.

Experience:
• Founder / Chief Investment Officer at Sankore Investments (Sep 2009 – Present, 16+ years). Lagos, Nigeria. Built Sankore from inception through acquisitions (e.g. Diamond Capital) into a SEC-Nigeria licensed investment and wealth management firm spanning Investment Adviser, Portfolio Manager, Fund Manager, and Broker / Dealer licences. AUM ~₦120B (≈ $70–80M USD).
• Board Chair at ToNote (Jan 2021 – Present, 5+ years). Lagos, Nigeria. ToNote is a fintech / product leadership company (CEO Fikayo Durosinmi-Etti, per the profile). Board Chair role signals Titi's active role in fintech product-strategy decisions, not only investment-committee decisions.
• Board Member at FCMB Pensions Limited (May 2020 – Present, 6 years). Part-time. Signals regulated-entity board experience and pensions / long-horizon capital allocation expertise.

Education: Harvard Business School alum.

Profile signals:
• Location: Lagos State, Nigeria.
• 500+ connections, 1,931 followers — established reputation in the Nigerian investment / alternative-investments community.
• Recent LinkedIn activity: positive, mentorship-oriented (congratulations posts on peers' milestones: "Beautiful work. So proud of you!", "I'm super proud of you and look forward to seeing all you will do!", "Huge congratulations Kemi Ojenike"). Signals a senior operator who invests in others' success — the internship offer to the founder fits the pattern.

Shared connection with founder: Titi knows the founder's mother personally (same Lagos social circle). Not a cold lead. Titi has already offered the founder an internship at Sankore.

What to emphasise with her in-meeting:
• The HBS + "Investment Strategist" self-framing tells us she responds to intellectual rigor and alternative-investment vocabulary. Lead with the Kahneman-Klein anchor and the regulatory-tailwind framing.
• The Board Chair of ToNote signals fintech product-decision interest — the "DQI on product-strategy memos" wedge is legitimate here, not just investment memos.
• The Board Member of FCMB Pensions signals regulated-entity thinking. The Decision Provenance Record maps onto Basel III Pillar 2 and SEC AI Disclosure language by design; this will land.`,
  meetingContext: `Next-week meeting with Titi Odunfa Adeoye at Sankore Investments. Warm intro through the founder's mother (same Lagos social circle). Titi has already offered the founder an internship at Sankore. The meeting is the conversion conversation: turn the internship offer into an integrated Decision Intel product engagement rather than a generic internship.

The meeting is not a cold pitch. The relationship is already established; the product demonstration is what carries the conversation from "intern who happens to have built something" to "Decision Intel integrated into Sankore's investment-committee workflow."`,
  founderAsk: `Three-step conversion, structured so Titi never takes a risky step without seeing value first:

Step 1 (confirm in the room): accept the internship with Decision Intel explicitly scoped as a project deliverable — run Decision Provenance Record audits on a set of Sankore's historical or in-progress investment-committee memos during the internship.

Step 2 (weeks 1 to 8 of the internship): deliver DPRs on real memos, integrate with the investment-committee workflow, capture before-and-after data for a Sankore-specific case study.

Step 3 (month 3 of the internship, roughly): convert to a 12-month design-partner pilot at £1,999/mo founding rate with Year-2 first-right-of-refusal at list.

The paid commercial conversation happens only after she has seen DPRs land on her own desk. Zero cold-procurement friction. Full proof of value before a single invoice.`,
};

// ─────────────────────────────────────────────────────────────────────────
// Structured rich profile — rendered by the Design Partners detail view
// as the per-partner briefing. Sourced from blending Grok's external
// analysis of Sankore (sankore.com) with the founder's earlier
// positioning work. Every claim is defensible — if a fact is invented
// it is tagged as such, because this data will drive the pitch in the
// room.
// ─────────────────────────────────────────────────────────────────────────

const SANKORE_RICH_PROFILE: PartnerRichProfile = {
  whatTheyDo: {
    summary:
      'Licensed Nigerian investment and wealth management firm, SEC-Nigeria registered across Investment Adviser, Portfolio Manager, Fund Manager, and Broker/Dealer. Founded circa 2010, Lagos-based. Tailor-made advisory, fund management, wealth and legacy planning, real estate / real assets, fintech innovation, and capacity building — aimed at individuals, corporations, and public/private sectors in Nigeria. Growing from near-zero AUM by acquiring and building entities (e.g., Diamond Capital) plus launching fintech brands under the group.',
    services: [
      {
        title: 'Tailor-made advisory & fund management',
        description:
          'Bespoke investment advice and actively-managed fund strategies for HNW individuals and institutional clients.',
      },
      {
        title: 'Wealth creation and preservation, including legacy planning',
        description:
          'Long-horizon wealth-management decisions tied to family dynamics, intergenerational transfer, and estate rigor.',
      },
      {
        title: 'Real estate and real assets',
        description:
          'Capital allocation into property, infrastructure, and alternative real-asset exposures.',
      },
      {
        title: 'Fintech innovation arm',
        description:
          'Building fintech brands and products for alternative investments and financial inclusion across Nigeria.',
      },
      {
        title: 'Capacity building and consulting',
        description:
          'Financial consulting and capacity-building mandates for corporates and public-sector clients.',
      },
    ],
    philosophy: 'Credit | Capital | Cities | Communities | Culture',
    heritage:
      'Named after the 13th-century University of Sankore in Timbuktu — one of the oldest centres of scholarly rigor on the African continent. The name is a heritage marker for intellectual seriousness; they market themselves as closing the "people-information-wealth" gap, which maps directly onto a reasoning-layer positioning.',
    scale: {
      aum: '~₦120B AUM (roughly $70–80M USD depending on FX)',
      teamSize:
        '30–66 on LinkedIn; founder frames ~10 seats for the pilot quote — reconcile with actual usage pattern after onboarding.',
      founded: '2010',
      licenses: ['Investment Adviser', 'Portfolio Manager', 'Fund Manager', 'Broker / Dealer'],
      regulator: 'SEC Nigeria',
      headquarters: 'Lagos, Nigeria',
    },
    keyPeople: [
      {
        name: 'Titi Odunfa Adeoye',
        role: 'Founder & Chief Investment Officer',
        note: "LinkedIn headline 'Investment Strategist | Entrepreneur | Alternative Investments.' Harvard Business School alum. Founder/CIO of Sankore since September 2009 (16+ years). Board Chair of ToNote (a fintech product / digital note-taking platform) since January 2021. Board Member of FCMB Pensions Limited (part-time, since May 2020). 1,931 LinkedIn followers, 500+ connections. Lagos State, Nigeria. She is the primary contact for this pilot — she knows the founder's mother personally and has already offered an internship at Sankore. Intellectual-rigor framing will land with her directly; she picks her public vocabulary carefully (Sankore, Alternative Investments, Investment Strategist). LinkedIn: linkedin.com/in/titioadeoye/",
      },
    ],
  },

  wedges: [
    {
      title: 'Investment committee & deal evaluation',
      description:
        'Every portfolio allocation, new fund launch, and acquisition decision runs through a committee with known bias exposure — anchoring on entry price, thesis confirmation, sunk cost on prior positions, overconfidence, and groupthink in a small deal team.',
      diIntersect:
        '12-node pipeline audits the memo behind every committee vote. Decision Provenance Record gives them a regulator-grade, signed-and-hashed artifact on each audit — exactly the document a regulator, auditor, or LP will eventually demand.',
    },
    {
      title: 'Wealth & legacy planning',
      description:
        'High-stakes, long-horizon decisions for HNW clients. Family dynamics, recency bias, narrative fallacy, and anchoring on a single scenario dominate this workflow.',
      diIntersect:
        'Recognition-Rigor Framework (Kahneman rigor + Klein recognition arbitrated in one pipeline) is the only architecture in market that combines both traditions. No competitor in the legacy-planning tooling space touches both sides of the Kahneman-Klein synthesis.',
    },
    {
      title: 'Fintech-arm product decisions',
      description:
        'They build fintech products for financial inclusion. Every product bet, feature prioritisation, and go-to-market call is a strategic decision with the same bias exposure as an allocation memo.',
      diIntersect:
        'Decision Quality Index applies to product-strategy memos identically. Same audit, same artifact, same compounding Decision Knowledge Graph — their fintech arm and their investment arm both feed one org-level learning loop.',
    },
    {
      title: 'Regulatory posture & AI governance',
      description:
        'As a SEC-Nigeria licensed entity, they care about governance, auditability, and record-keeping. AI governance is the next regulatory wave and they are already thinking about it.',
      diIntersect:
        'DPR maps onto EU AI Act Article 14 (human oversight), SEC AI Disclosure language, Basel III · Pillar 2 ICAAP qualitative-decision documentation, and GDPR Art. 22 by design. The phrase to use: "the record your AI-augmented decision-making is already supposed to produce."',
    },
    {
      title: 'African / emerging-markets frontier positioning',
      description:
        'Sankore frames itself as a knowledge-forward, tech-forward Lagos-based firm. No local competitor is selling a reasoning-layer category. First-mover advantage is real on both sides — us for credibility, them for narrative.',
      diIntersect:
        'First design partner on the continent running a reasoning-layer audit gives them a differentiated narrative in their own market. Gives Decision Intel a defensible "already shaping R²F with a SEC-regulated African investment firm" line for the next VC round and the next CSO conversation.',
    },
  ],

  offerSpec: {
    pricing: {
      rate: '£1,999 / month',
      label: 'Founding Design Partner rate',
      delta: '20% off the £2,499 list price',
      floor: '£1,499 / month absolute floor — below this the product stops being premium.',
      fallbackOffer:
        '3-month pilot at £1,499 stepping to £1,999 from month 4. Only if they push back hard on the opening number.',
      hardNo:
        'Never free. A paying pilot is stickier, produces better case-study material, and will not anchor Year-2 expectations below market.',
    },
    inclusions: [
      'Unlimited audits during the pilot window',
      'Bespoke remote onboarding session (~2 hours) with the founder',
      'Monthly co-design call for 6 months',
      'First right of refusal on Year-2 pricing',
      'Priority roadmap input on the investment-committee and portfolio workflow',
      'Sankore-specific Decision Provenance Record template + African / EM case inclusions in the corpus',
      'Security one-pager + DPA ready for their GC on day one',
    ],
    ask: {
      short:
        'Accept the internship. Integrate Decision Intel as an internship deliverable on real Sankore memos. Convert to paid pilot at month 3 if the value is obvious.',
      long: "Three-step ask, structured so she never has to take a risky step without seeing value first. Step 1 (confirm today): accept the internship she has already offered, with Decision Intel as an explicit project deliverable — I run audits on a set of Sankore's historical or in-progress investment-committee memos during the internship. Step 2 (weeks 1 to 8 of the internship): deliver Decision Provenance Records on real memos, integrate with the investment-committee workflow, capture a bank of before-and-after data for a Sankore case study. Step 3 (month 3 of the internship, roughly): convert to a 12-month design-partner pilot at the £1,999/mo founding rate with Year-2 first-right-of-refusal at list. The entire arc is designed so the paid conversation happens only after she has seen DPRs land on her own desk. Zero cold-procurement friction. Full proof of value before a single invoice.",
    },
  },

  positioning: {
    categoryAnchor: 'The native reasoning layer for every high-stakes call',
    avoidFraming: [
      "'AI bias detection tool' — positions Decision Intel in the ChatGPT bucket in their mental model.",
      "'Decision intelligence platform' — Gartner-crowded, competes with Cloverpop / Peak.ai / Quantellia.",
      "'AI-powered' as a solo modifier — meaningless; cut it wherever it appears.",
      "'Human-AI governance system' — retired positioning; do not use.",
    ],
    openingLine:
      'Sankore takes its name from a 13th-century university in Mali — the oldest centre of scholarly rigor on the continent. Decision Intel is the native reasoning layer for the exact thing that university was built to test: can the argument on the page survive scrutiny. I have built it so every one of your investment-committee memos gets the scrutiny a regulator, a board, and a future LP will eventually demand — before they ask.',
    ethosAnchors: [
      'Wiz advisor (senior operator who took Wiz from startup to $32B)',
      '135-case annotated corpus across 11 industries',
      'Peer-reviewed anchor: Kahneman & Klein (2009), "Conditions for Intuitive Expertise"',
      'Shipped codebase: 200+ components, 70+ API routes, SOC 2 Type II infrastructure posture',
    ],
    pathosCurrents: [
      {
        label: 'Pride of rigor',
        moveIn:
          'Decision Intel does not replace your judgment. It audits the reasoning behind it — the way a good Harvard case discussion does, except every time, on every memo, with a traceable record.',
      },
      {
        label: 'Quiet anxiety about AI governance',
        moveIn:
          'You will be asked for this artifact. Better to be three years ahead of the ask than three weeks behind.',
      },
      {
        label: 'Frontier ambition',
        moveIn:
          'You would be the first investment firm on the continent running this — not as a vendor, as a design partner. Your workflow shapes the category.',
      },
    ],
    logosMoves: [
      {
        claim:
          'Each audit runs your memo through 12 specialised reasoning nodes, scoring 30+ cognitive biases against 135 annotated real-world decisions with known outcomes. The output is a Decision Quality Index, a Decision Provenance Record, and a boardroom simulation of how a CEO, CFO, and audit chair would push back on the memo.',
        followUp:
          'When was the last time your investment-committee memo was tested against 135 prior decisions with known outcomes before the call was made?',
      },
      {
        claim:
          "Recognition-Rigor Framework, or R²F, is Kahneman's rigor and Klein's recognition arbitrated in one pipeline. The only version of this architecture in market. Anchor citation: the 2009 Kahneman-Klein paper 'Conditions for Intuitive Expertise: a failure to disagree.'",
        followUp:
          'Which of your current tools combines both behavioural-science traditions in one pass?',
      },
      {
        claim:
          'We are running a five-seat design-partner cohort. Four seats remain. The design-partner rate is £1,999 per month — about 20 percent off the £2,499 list — with first right of refusal on Year-2 pricing. You would be the founding African member of the cohort, which is both a commercial and a narrative win for both sides.',
        followUp:
          'If I sent a Decision Provenance Record specimen and three financial-services case studies from the 135-case corpus, would you be in a position to commit to the first audit by end of next week?',
      },
    ],
  },

  introContext: {
    source:
      "Family intro — Titi knows the founder's mother personally; same Lagos social circle. Not a cold lead, not a forced intro.",
    venue:
      'Casual get-together in Lagos; Titi and the founder briefly connected. She has since offered an internship at Sankore, which is the immediate foothold for this conversation.',
    depth:
      'Warmer than a typical first-call. She already believes enough in the founder to open the door to an internship. The meeting is about converting that open door into an integrated product engagement — internship first, pilot second.',
    rule: 'Respect the relationship without leaning on it. Lead with competence and the product; the family connection is air cover, not the pitch. The internship offer is the reciprocity loop she has already opened; match it by proposing Decision Intel as an internship deliverable rather than asking for a cold paid pilot on day one.',
  },

  risks: [
    {
      title: 'Currency / FX',
      detail:
        'They will likely want to settle in naira-equivalent. Confirm GBP or USD billing on the LOI. Naira volatility would otherwise distort pilot economics — do not let them pay local.',
    },
    {
      title: 'Internal decision cycle',
      detail:
        'Even at 10–50 people, they have internal governance. The budget holder may not be in the meeting. Ask early: "Who else needs to sign off on a tool at this price point?"',
    },
    {
      title: 'Scope creep',
      detail:
        'They may want bespoke Nigerian / African case studies in the corpus. That is a legitimate roadmap item — it is not a pilot deliverable. Hold the line; promise it for Q2 of the pilot year, not week one.',
    },
    {
      title: 'Intro over-reliance',
      detail:
        "The intro through Titi knowing the founder's mother is warm, and she has already opened the internship door — but the commercial conversation still stands or falls on the product and the DPR specimen. Mother-connection gets a fair first hearing; it does not buy a second chance if the demo falls flat.",
    },
    {
      title: 'Internship structure',
      detail:
        'Clarify the internship shape before the meeting ends: remote vs Lagos on-site, paid vs stipend vs equity, duration, reporting line (to Titi directly, or to a deputy). A remote internship with direct access to Titi is ideal; anything that puts the founder two reports away from her kills the product-feedback loop.',
    },
    {
      title: 'Dual-role conflict',
      detail:
        'The founder will simultaneously be an intern at Sankore AND the CEO of the vendor Sankore is piloting. Flag this in-meeting with a simple separation-of-concerns frame: internship = operational contribution; Decision Intel = product engagement with an arms-length LOI. Offer to sign a conflicts-of-interest acknowledgement the GC can keep on file.',
    },
    {
      title: 'Regulatory sensitivity on data handling',
      detail:
        'As a licensed entity, they will push on data privacy and AI explainability. Lead with the DPA, the SHA-256 input hashing, the AES-256-GCM document encryption, and the fact that we never serialise prompts or per-org weights. Security one-pager ready to send same-day.',
    },
  ],

  strategic: {
    arr: '~£24k ARR on a £1,999/mo retainer (pilot kicks in at internship month 3, so ARR effectively starts Q3 of the internship calendar)',
    cohortConversion: 'Converts the five-seat design-partner cohort from 0-of-5 to 1-of-5.',
    socialProof:
      'Unlocks "already shaping R²F with a SEC-regulated investment firm" as a defensible social-proof line in VC conversations + subsequent CSO outreach. The internship-first pathway also becomes a replicable playbook for converting warm intros into design partnerships at other regulated firms.',
    narrativeShift:
      "Pre-seed / seed narrative changes from 'pre-revenue' to 'embedded in Sankore's investment-committee workflow, paid pilot converting in month 3.' That is the difference between a term sheet and a maybe. The internship also gives the founder 8 weeks of unambiguous domain experience inside a live investment committee — invaluable for product depth and for future CSO conversations.",
  },
};

const FOUNDER_NOTES = `
STATUS SNAPSHOT
First high-probability pilot. Meeting confirmed next week. Warm intro via family, not a cold lead. They are a licensed Nigerian investment and wealth management firm. Pitch target: £1,999/mo (first design-partner rate, 20 percent off £2,499 list). Target: signed LOI within 30 days of the meeting. This would be first paid customer and ~£24k ARR.

COMPANY — WHO THEY ARE
Sankore Investments (sankore.com). Lagos-based. Nigerian SEC-regulated across Investment Adviser, Portfolio Manager, Fund Manager, Broker/Dealer licences. Founded circa 2010. CEO Titi Odunfa Adeoye (Harvard Business School alum). Assets under management roughly 120 billion naira (about 70 to 80 million USD depending on FX). Team size: founder frames it as "around 10 people" for the pilot seat count, though public sources and LinkedIn show 30 to 66 — use the 10-seat frame for the quote, reconcile with actual usage pattern after onboarding.

What they do: tailor-made advisory and fund management, wealth and legacy planning, real estate and real assets, fintech / innovation arm, capacity building and financial consulting. Investment philosophy: "Credit, Capital, Cities, Communities, Culture." Track record includes acquisitions and building companies since 2010 (e.g., Diamond Capital). They emphasise technology in research, analysis, and decision-making — which is why the reasoning-layer pitch lands.

Naming cue: Sankore references the ancient University of Sankore at Timbuktu, a medieval centre of learning. Their heritage nod is intellectual rigor and knowledge. Use that framing in the opening 60 seconds — the product extends their own founding metaphor.

HOW THE INTRO HAPPENED
Titi Odunfa Adeoye (Founder & CIO of Sankore) knows the founder's mother personally — same Lagos social circle, not a cold lead. Met at a casual get-together; brief connection established. Since then Titi has already offered the founder an internship at Sankore, which changes the shape of the meeting entirely. This is no longer a cold commercial pitch converting a distant acquaintance into a paid pilot. It is converting an already-opened internship door into an integrated product engagement. Framing rule: respect the relationship without leaning on it. The internship offer is her reciprocity move; match it by proposing Decision Intel as an internship deliverable, not by asking for a paid pilot on day one.

WHY DECISION INTEL FITS SANKORE (THE WEDGE)
Their workflows are decision-heavy in exactly the shapes Decision Intel is built for:

1. Investment committee / deal evaluation. Every portfolio allocation, every new fund launch, every acquisition decision runs through a committee with known bias exposure (anchoring on entry price, thesis confirmation, sunk cost, overconfidence, groupthink in a small committee). The 12-node pipeline audits the memo behind the decision.

2. Wealth / legacy planning. High-stakes, long-horizon decisions for HNW clients. Family dynamics, recency bias, narrative fallacy. The Recognition-Rigor Framework (R²F) separates Klein-style intuition from Kahneman-style debiasing in one pass.

3. Fintech arm. They build products for financial inclusion. Product decisions are decisions. DQI on product-strategy memos.

4. Regulatory posture. As a SEC-Nigeria licensed entity, they care about governance, auditability, and record-keeping. Decision Provenance Record (DPR) gives them a signed, hashed artifact on every audit — exactly the kind of document a regulator or board committee will ask for.

5. African / emerging-markets context. Their heritage framing ("Sankore University, centre of learning") aligns with our positioning ("native reasoning layer"). No competitor in their market is selling this category. First-mover advantage for both sides.

HOW I COME IN — POSITIONING FOR THIS MEETING
Category anchor: "native reasoning layer for every high-stakes call." Do NOT open with bias-detection language — they will hear "AI tool" and mentally file alongside ChatGPT. Open with category, anchor with Kahneman × Klein (R²F), close with the regulatory calendar.

THE OPENING 60 SECONDS (ETHOS)
"Sankore takes its name from a 13th-century university in Mali — the oldest centre of scholarly rigor in the continent. Decision Intel is the native reasoning layer for the exact thing that university was built to test: can the argument on the page survive scrutiny. I've built it so every one of your investment committee memos gets the scrutiny a regulator, a board, and a future LP will eventually demand — before they ask."

Why this ethos anchor: they will recognise the Sankore reference and feel respected. They are a heritage-conscious firm. Then the regulatory sentence positions the product as a procurement asset, not a novelty tool.

PATHOS MOVES (emotional currents to meet them in)

1. Pride of rigor. They style themselves as intellectually serious. Meet them there: "Decision Intel doesn't replace your judgment; it audits the reasoning behind it — the way a good Harvard case discussion does, except every time, on every memo, with a traceable record."

2. Quiet anxiety about AI governance. Every regulated firm's GC is reading the EU AI Act and wondering what the Nigerian equivalent will look like. Meet it: "You will be asked for this artifact. Better to be three years ahead of the ask than three weeks behind."

3. Ambition to be seen as frontier. They already market themselves as tech-forward. Meet it: "You would be the first investment firm on the continent running this — not as a vendor, as a design partner. Your workflow shapes the category."

LOGOS MOVES (ranked easiest to hardest to defend)

1. "Each audit runs your memo through 12 specialised reasoning nodes scoring 30+ cognitive biases against 135 annotated real-world decisions with known outcomes. It produces a Decision Quality Index, a Decision Provenance Record, and a boardroom simulation of how a CEO, CFO, and audit chair would push back."
Follow-up: "When was the last time your investment committee's memo was tested against 135 prior decisions with known outcomes before the call was made?"

2. "The Recognition-Rigor Framework — Kahneman's rigor and Klein's recognition arbitrated in one pipeline — is the only version of this architecture in market. It's the slide-2 claim on our pitch deck. The paper behind it is Kahneman and Klein's 2009 'Conditions for Intuitive Expertise.'"
Follow-up: "Which of your current tools combines both traditions in one pass?"

3. "We are running a five-seat design-partner cohort. Four seats remain. The design-partner rate is 1,999 GBP per month — about 20 percent off the 2,499 list price — and includes first right of refusal on year-two pricing. You would be the founding African member of the cohort, which is both a commercial and a narrative win for both sides." (Scarcity + social proof + first-mover framing.)
Follow-up: "If I sent a Decision Provenance Record specimen and three financial-services case studies from the 135-case corpus, would you be in a position to commit to the first audit by end of next week?"

THREE QUESTIONS THEY WILL LIKELY ASK

1. "How do we know this works?" Answer: walk them through one case from the 135-case corpus that maps to their world — a financial-services decision with a known outcome where the pre-decision memo carried the exact biases the pipeline catches. Offer to run one of their historical deal memos (anonymised) through the pipeline during the meeting as proof. Cialdini: reciprocity + commitment.

2. "What about data privacy and regulation — we cannot put client data into an AI tool." Answer: Decision Provenance Record is signed and hashed. AES-256-GCM document encryption. GDPR-compliant anonymizer runs as node 1 of the pipeline BEFORE any content reaches the LLM. SOC 2 Type II infrastructure. EU AI Act Article 14 record-keeping is what the DPR is built to produce by design. Offer a Security one-pager as a follow-up artifact. Cialdini: authority.

3. "Is this a real company, or is it a side project?" — the unasked question behind "how big is your team." Answer: own it. "I'm a solo technical founder, 16, advised by a senior operator who took Wiz from startup to a 32-billion-dollar exit. The product has 200+ components and 70+ API routes shipped. The codebase is the company — any senior full-stack engineer can onboard in weeks. I am the velocity thesis. What do you expect the velocity to be when I'm full-time in SF in 18 months?" Flip the age question into a bet on compounding. Cialdini: authority + consistency.

PRICING POSITION
Open: £1,999/month, framed as "Founding Design Partner rate — 20 percent off the £2,499 list." Not a discount — a recognition of their design-partner role. Includes: unlimited audits during pilot, bespoke onboarding session, monthly co-design call, first right of refusal on year-two pricing, priority roadmap input on their M&A / portfolio workflow.
Fallback if they push back: 3-month pilot at £1,499, steps to £1,999 from month 4. Never go below £1,499 — that is the floor where the product stops being premium.
Hard no: free. They do not need free. A paying pilot is stickier and better for the case study.

THE ASK (INTERNSHIP-FIRST, REVISED 2026-04-24)
The internship offer she has already opened is the reciprocity loop; match it, do not replace it with a paid-pilot pitch on day one. Structure the ask in three steps so she never takes a risky step without seeing value first.

Step 1 (confirm today, in the room): accept the internship with Decision Intel explicitly scoped as a project deliverable — "I will run Decision Provenance Record audits on a set of Sankore's historical or in-progress investment-committee memos during the internship." Tangible, measurable, low-risk, already aligned with what she has offered.

Step 2 (weeks 1 to 8 of the internship): deliver DPRs on real memos. Integrate with the investment-committee workflow. Capture before-and-after data for a Sankore-specific case study (with consent). No invoice, no procurement friction, no GC review required during the internship phase.

Step 3 (month 3 of the internship, roughly): convert to a 12-month design-partner pilot at the £1,999/mo founding rate. Year-2 first-right-of-refusal at list price. The LOI is drafted on the back of real Sankore DPRs and a real Sankore-specific case study, so the commercial decision is made with evidence, not imagination.

The in-room scripted version: "Thank you for the internship offer. I'd like to accept it on one condition — that I get to use it as the chance to integrate Decision Intel into your investment-committee workflow. In the first eight weeks I'll deliver Decision Provenance Records on a set of your memos. If the output is useful, we convert to a 12-month design-partner pilot at the founding rate at month three. If it isn't useful, I finish the internship on whatever other project you want me on and we part as friends with a case study. Zero cold-procurement friction. Full proof of value before a single invoice."

PRE-MEETING PREP (20 MINUTES, THE MORNING OF)
1. Open the Design Partners tab in the Founder Hub — this card is where the notes live.
2. Re-read the 2009 Kahneman-Klein paper abstract.
3. Pull one financial-services case from the 135-case corpus (Lehman, LTCM, or a mid-cap M&A with pre-decision memo) as the go-to example.
4. Practice the age-framing line five times out loud.
5. Have the /how-it-works page open in a tab so the 12-node pipeline is one click away.
6. Have the DPR specimen PDF ready to screen-share.
7. Have the Security one-pager ready to send as follow-up.
8. Breathe, walk around the block, arrive calm.

THE CLOSE
"I'll send the follow-up note by end of day tomorrow with the DPR specimen, the security one-pager, and three financial-services case studies from the 135-case corpus. Does Friday at 10 AM work to hear your reaction and confirm the pilot start date?" Never leave the close open-ended. Specific artifact, specific calendar move, specific next step.

AFTER THE MEETING (within 90 minutes)
1. Email them the follow-up with the three artifacts attached.
2. Log the meeting in the Decision Log (Founder Hub → Decision Log) with Brier-calibrated prediction: "Will this progress to signed LOI in 30 days? My estimate: [X] percent." Calibrate our own Brier score. We eat our own dogfood.
3. Update this founderNotes field with what was learned — specifically any objections that were NOT anticipated above. Re-run the seed script to persist.

RISKS / WATCH-OUTS
- Internship structure: clarify shape before the meeting ends. Remote vs Lagos on-site, paid vs stipend vs equity, duration, reporting line (direct to Titi is ideal; anything that puts you two reports away from her kills the feedback loop). Push for remote + direct access + 10-12 week duration minimum.
- Dual-role conflict: you are simultaneously the intern at Sankore AND the CEO of the vendor Sankore is piloting. Pre-empt this: separate the concerns in-room, offer a written conflicts-of-interest acknowledgement for the GC. Frame internship = operational contribution, Decision Intel = arms-length product engagement.
- Currency: when the pilot LOI comes in month 3, they will likely want to settle in naira-equivalent. Confirm GBP or USD billing up-front so naira volatility does not distort pilot economics.
- Decision cycle: even at Sankore's scale, budget-holder approvals matter. Titi is Founder/CIO so the budget sign-off probably IS her, but confirm in the room before moving to Step 3.
- Scope creep: they may want bespoke Nigerian-market case studies in the corpus. Legitimate roadmap item — NOT an internship-phase deliverable. Hold the line; promise Q2 of the pilot year, not week one.
- Over-reliance on the mother connection: Titi already offered the internship, which is warm, but the pilot conversion at month 3 stands or falls on the product and the DPRs delivered during the internship. Do the work; the connection does not pay the invoice.

WHY THIS MATTERS FOR DECISION INTEL
First paid customer. ~£24k ARR. Converts the five-seat cohort from theoretical to 1-of-5. Unlocks the "already shaping R²F with a SEC-regulated investment firm" social-proof line for VC conversations. Unlocks the African / emerging-markets credibility angle for when we go to US corp-strategy buyers. Most importantly: the pre-seed narrative changes from "pre-revenue" to "paid pilot, expanding." That is the difference between a term sheet and a maybe.
`.trim();

async function main() {
  console.log('\n🌅 Seeding Sankore Investments as first design-partner prospect...\n');

  const existing = await prisma.designPartnerApplication.findFirst({
    where: { email: SANKORE_EMAIL },
  });

  const baseData = {
    name: 'Sankore Investments — pilot contact',
    email: SANKORE_EMAIL,
    company: 'Sankore Investments',
    role: 'CEO / Investment Committee (warm family intro, contact name TBC)',
    linkedInUrl: 'https://sankore.com',
    industry: 'mna', // closest match in the DP enum; their workflow IS investment committee / deal evaluation
    teamSize: '6-15', // pricing quote is for ~10 seats; public sources show 30-66, reconcile post-onboarding
    memoCadence:
      'Estimated 3-8 investment committee memos per month across portfolio + new-fund decisions (confirm in meeting)',
    currentStack:
      'Unknown. Likely Excel + internal memos + Bloomberg/S&P for market data. Part of discovery.',
    whyNow:
      'First high-probability paid pilot. Warm family intro. SEC-Nigeria licensed investment and wealth management firm with 120B naira AUM. Regulatory posture + investment committee cadence + heritage-of-rigor framing make them an ideal design-partner fit. Targeting £1,999/mo founding-partner rate.',
    source: 'warm-intro',
    status: 'scheduled_call' as const,
    founderNotes: FOUNDER_NOTES,
    callScheduledAt: null, // set to the exact meeting datetime once confirmed
    slotOrder: 1, // first of the five cohort seats
    richProfile: SANKORE_RICH_PROFILE as unknown as Prisma.InputJsonValue,
  };

  const force = process.env.FORCE_SEED_SANKORE === '1';

  if (existing && !force) {
    console.log(
      `  ⏭️  Sankore record already exists (id: ${existing.id}). Skipping. ` +
        `Set FORCE_SEED_SANKORE=1 to overwrite.`
    );
  } else if (existing && force) {
    await prisma.designPartnerApplication.update({
      where: { id: existing.id },
      data: {
        ...baseData,
        reviewedAt: new Date(),
      },
    });
    console.log(`  ✏️  Force-refreshed Sankore record (id: ${existing.id})`);
  } else {
    const created = await prisma.designPartnerApplication.create({
      data: baseData,
    });
    console.log(`  ✅ Created Sankore record (id: ${created.id})`);
  }

  // ─── Seed Titi Odunfa Adeoye as a PartnerContact ──────────────────
  // Create-only by default so UI edits / re-generated prep plans never
  // get clobbered. FORCE_SEED_SANKORE=1 refreshes the row from this
  // file (handy when the founder wants to push updated LinkedIn info
  // or meeting-context copy from Git).
  const partnerId = (
    await prisma.designPartnerApplication.findFirst({
      where: { email: SANKORE_EMAIL },
      select: { id: true },
    })
  )?.id;

  if (partnerId) {
    const existingContact = await prisma.partnerContact.findFirst({
      where: { partnerAppId: partnerId, name: TITI_CONTACT.name },
      select: { id: true },
    });

    if (existingContact && !force) {
      console.log(
        `  ⏭️  Titi contact already exists (id: ${existingContact.id}). Skipping. ` +
          `Set FORCE_SEED_SANKORE=1 to refresh.`
      );
    } else if (existingContact && force) {
      await prisma.partnerContact.update({
        where: { id: existingContact.id },
        data: {
          name: TITI_CONTACT.name,
          role: TITI_CONTACT.role,
          linkedInUrl: TITI_CONTACT.linkedInUrl,
          linkedInInfo: TITI_CONTACT.linkedInInfo,
          meetingContext: TITI_CONTACT.meetingContext,
          founderAsk: TITI_CONTACT.founderAsk,
          // Intentionally do NOT touch generatedPrep — if the founder
          // has already generated and refined a plan in the UI, we keep
          // it. Re-generation on refreshed inputs is explicit via the
          // UI button, not implicit via re-seed.
        },
      });
      console.log(`  ✏️  Force-refreshed Titi contact (id: ${existingContact.id})`);
    } else {
      const created = await prisma.partnerContact.create({
        data: {
          partnerAppId: partnerId,
          ...TITI_CONTACT,
        },
      });
      console.log(`  ✅ Created Titi contact (id: ${created.id})`);
    }
  }

  const capacity = await prisma.designPartnerApplication.count({
    where: { status: 'accepted' },
  });

  console.log(`\n📊 Cohort status: ${capacity} of 5 seats accepted.`);
  console.log(
    `   Sankore is in "scheduled_call" — move to "accepted" in the Founder Hub UI after signed LOI.\n`
  );
}

main()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
