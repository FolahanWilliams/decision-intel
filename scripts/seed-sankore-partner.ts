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

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────────────────
// Sankore record — edit these fields as the pilot evolves, then re-seed.
// ─────────────────────────────────────────────────────────────────────────

const SANKORE_EMAIL = 'sankore-pilot@decision-intel.com'; // placeholder key until the real contact confirms; the upsert matches on this string

const FOUNDER_NOTES = `
STATUS SNAPSHOT
First high-probability pilot. Meeting confirmed next week. Warm intro via family, not a cold lead. They are a licensed Nigerian investment and wealth management firm. Pitch target: £1,999/mo (first design-partner rate, 20 percent off £2,499 list). Target: signed LOI within 30 days of the meeting. This would be first paid customer and ~£24k ARR.

COMPANY — WHO THEY ARE
Sankore Investments (sankore.com). Lagos-based. Nigerian SEC-regulated across Investment Adviser, Portfolio Manager, Fund Manager, Broker/Dealer licences. Founded circa 2010. CEO Titi Odunfa Adeoye (Harvard Business School alum). Assets under management roughly 120 billion naira (about 70 to 80 million USD depending on FX). Team size: founder frames it as "around 10 people" for the pilot seat count, though public sources and LinkedIn show 30 to 66 — use the 10-seat frame for the quote, reconcile with actual usage pattern after onboarding.

What they do: tailor-made advisory and fund management, wealth and legacy planning, real estate and real assets, fintech / innovation arm, capacity building and financial consulting. Investment philosophy: "Credit, Capital, Cities, Communities, Culture." Track record includes acquisitions and building companies since 2010 (e.g., Diamond Capital). They emphasise technology in research, analysis, and decision-making — which is why the reasoning-layer pitch lands.

Naming cue: Sankore references the ancient University of Sankore at Timbuktu, a medieval centre of learning. Their heritage nod is intellectual rigor and knowledge. Use that framing in the opening 60 seconds — the product extends their own founding metaphor.

HOW THE INTRO HAPPENED
Distant friend of founder's father. Met at a casual get-together. Brief connection established. Meeting scheduled next week. Implication: warm but not deep — the meeting has to carry the relationship into pilot territory, not rely on pre-existing trust. Framing rule: respect the casual origin, do not lean on it. Lead with competence, not connection.

WHY DECISION INTEL FITS SANKORE (THE WEDGE)
Their workflows are decision-heavy in exactly the shapes Decision Intel is built for:

1. Investment committee / deal evaluation. Every portfolio allocation, every new fund launch, every acquisition decision runs through a committee with known bias exposure (anchoring on entry price, thesis confirmation, sunk cost, overconfidence, groupthink in a small committee). The 12-node pipeline audits the memo behind the decision.

2. Wealth / legacy planning. High-stakes, long-horizon decisions for HNW clients. Family dynamics, recency bias, narrative fallacy. The Recognition-Rigor Framework (R²F) separates Klein-style intuition from Kahneman-style debiasing in one pass.

3. Fintech arm. They build products for financial inclusion. Product decisions are decisions. DQI on product-strategy memos.

4. Regulatory posture. As a SEC-Nigeria licensed entity, they care about governance, auditability, and record-keeping. Decision Provenance Record (DPR) gives them a signed, hashed artifact on every audit — exactly the kind of document a regulator or board committee will ask for.

5. African / emerging-markets context. Their heritage framing ("Sankore University, centre of learning") aligns with our positioning ("native reasoning layer"). No competitor in their market is selling this category. First-mover advantage for both sides.

HOW I COME IN — POSITIONING FOR THIS MEETING
Category anchor: "native reasoning layer for every boardroom strategic decision." Do NOT open with bias-detection language — they will hear "AI tool" and mentally file alongside ChatGPT. Open with category, anchor with Kahneman × Klein (R²F), close with the regulatory calendar.

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

THE ASK
Specific small reciprocal. "Two things: one, send me one of your historical investment committee memos — redacted however you want — and I will run the full audit personally and deliver a Decision Provenance Record within 48 hours. Two, if the DPR is useful, we move to a 30-day pilot starting on the first of next month. You see the weekly audit cadence, I see which parts of the workflow need bespoke work. At 30 days we either sign a 12-month agreement at founding rate, or we part as friends with a case study. No lock-in during the pilot."

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
- Currency: they will likely pay in naira-equivalent. Confirm GBP or USD billing on the LOI. Naira volatility could distort the pilot economics if we let them pay local.
- Decision cycle: even as a small firm, they have internal governance. Budget holder may not be in the meeting. Ask early: "Who else needs to sign off on a 2k/month tool?"
- Scope creep: they may want bespoke Nigerian-market case studies in the corpus. That is fine as a roadmap item but not a pilot deliverable — hold the line.
- Over-reliance on family intro: the intro is warm, not influential. The meeting stands or falls on the product.

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
