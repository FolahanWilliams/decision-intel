/**
 * Seed Script: Gabriel Osamor (CFO Strategy Call) — 2026-04-23.
 *
 * Create-only. A FounderMeeting row is inserted once with full three-tab
 * content (what happened / outcomes / the future) drawn from the Gemini
 * transcript notes of the call. Re-runs are no-ops so the founder's
 * edits via the Meetings Log UI are never clobbered.
 *
 * Usage (manual):
 *   DATABASE_URL=<prod-url> npx tsx scripts/seed-gabe-meeting.ts
 *
 * Autonomous: invoked on every Vercel deploy via scripts/seed-business-data.mjs.
 *
 * Idempotency key: (prospectName + meetingType + scheduledAt-or-happenedAt
 * within ±1 day). Not bulletproof, but the founder can delete and re-run
 * if they want to regenerate.
 */

import { createSeedPrismaClient } from './seed-prisma-client';

const { prisma } = createSeedPrismaClient();

const HAPPENED_AT = new Date('2026-04-23T15:37:00Z'); // 16:37 BST = 15:37 UTC

const GABE_MEETING = {
  meetingType: 'advisor_intro', // closest match — Gabe is a CFO-level advisor
  prospectName: 'Gabriel Osamor',
  prospectRole: 'CFO advisor',
  prospectCompany: null,
  happenedAt: HAPPENED_AT,
  status: 'completed',
  source: 'log', // manually logged past meeting
  outcome: 'progressed', // clear agreement on next steps

  whatHappened: `Strategy call with Gabriel Osamor on 2026-04-23 (16:37 BST). Walked him through Decision Intel end to end: the category positioning as the native reasoning layer for corporate strategy teams, the causal-reasoning engine that addresses the correlational limitation of current AI, the full pipeline (document ingestion, encryption, bias detection, systemic noise measurement, Decision Quality Index), the Kahneman + Klein synthesis as the proprietary moat, and the automated outcome-detection pipeline that pulls from Slack / Drive / Docs to continuously train on the org's specific intuition and biases.

Market sizing landed: decision intelligence market at ~$15B today, projected ~$55B by 2030. Pricing architecture explained: $100k/year enterprise contract vs ~$2M McKinsey consulting equivalent, or $2,500/mo for mid-size corporate-strategy teams, with a 20% founding-design-partner discount bringing the pilot rate to $1,999/mo (note: the Gemini transcript mis-transcribed this as "$19.99" — the actual pricing is $1,999/mo per CLAUDE.md pricing lock).

Competitive framing landed: closest adjacent is Palantir (outcome tracking but no AI-native bias auditing, no deep institutional memory, no compliance mapping). No direct competitor in "decision quality auditing" today — real competition is "do nothing."

Current status I shared: two institutions in discussions (Sankore + one other warm), MVP live, no signed pilots yet, UK customers first for close collaboration before US move for university.

Technical stack confirmed: LangGraph pipeline, Gemini 3 Flash primary, Claude Opus 4.6/4.7 planned for fallback. Part-time build cadence (~1h during school, 3-4h every night).

Gabe's tone through the call: engaged, practical, repeatedly pulled me back from product-depth into commercial focus. Said success hinges more on customers' willingness to use the product than on the product itself — a direct way of saying "stop polishing, start selling."`,

  outcomes: `Gabe's three core recommendations, in order of emphasis:

1. FIRST PAID CUSTOMERS OVER EVERYTHING ELSE. The single biggest lever right now is proving someone will actually pay for the product and use it. Product-market fit is established by willingness-to-pay + willingness-to-use, not by feature depth. Target: secure the first 5 pilot customers as the next milestone.

2. BUILD A WAITLIST AS A CREDIBLE ASSET. Even non-converting interested parties should go onto a waitlist. The waitlist becomes a credible asset for investor conversations later (demand indicator) and a conversion pipeline as the product matures. Talk to interested people even when they are not ready to buy, to collect honest feedback and generate stories for concept development.

3. LINKEDIN FOR OUTREACH + STORYTELLING. Use LinkedIn as the primary distribution channel for reaching corporate-strategy and M&A prospects. Post specific case studies over time (not generic thought leadership). Collect feedback from conversations and convert into storytelling content.

4. COMPANY REGISTRATION DEFERRED IS THE RIGHT CALL. Using the first one or two pilot customers' revenue to cover formal company registration costs is strategically correct. Do not register an entity before there is paying-customer proof of concept — it pre-empties the runway unnecessarily. Gabe explicitly affirmed this sequencing.

5. PROOF OF CONCEPT BEFORE INVESTORS. Focus order is: paying customers → case-study evidence → investor conversation. Do not flip this. Investors meeting a pre-revenue founder with no design-partner signal is a much weaker conversation than a founder with one or two paid pilots and a waitlist.

Side takeaways:
- The transcript mis-captured "$1,999" as "$19.99" and "Design Foundation" should read "Design Partner cohort" — correcting these in my own notes and the pitch deck.
- Pricing structure validated: premium positioning ($1,999/mo) with a clear discount for founding partners works. Do not anchor lower.
- The Kahneman + Klein synthesis framing landed specifically — Gabe picked up on the "causal reasoning vs correlational AI" angle as the defensible moat.`,

  theFuture: `Immediate (this week):
1. Post the LinkedIn introduction (first post). Draft ready; posting today.
2. Build a simple waitlist capture surface on decision-intel.com/waitlist or an inline module on the landing page. Target: one-sentence reason for interest + email. Hook it into the existing cron or use a dedicated marketing form.
3. Sankore meeting next week (Titi Odunfa Adeoye) — the conversion conversation for first pilot + internship. Already scoped internship-first, pilot at month 3.
4. Identify 2-3 additional UK-based corporate-strategy / M&A contacts to approach via LinkedIn. Target 5 design-partner conversations open by end of next week.

Medium-term (next 30 days):
5. Land 5 pilot customers — the explicit milestone Gabe named. Sankore is #1 likely. Need 4 more in the funnel.
6. Begin LinkedIn case-study series (first post lands this week). One post per week minimum, each on a specific famous corporate decision audited retrospectively.
7. Convert the first pilot revenue (~£1,999 or £1,499 floor) into UK company registration + initial legal setup. Gabe confirmed this sequencing is correct.

Longer-term (post-customer-proof):
8. Begin pre-seed conversations ONLY after 1-2 paid pilots are signed. Gabe explicitly cautioned against investor conversations before the customer signal is real.
9. Keep Gabe in the loop — both agreed to stay in touch. Likely a monthly cadence check-in call from my side; send the first paid-pilot news the moment it signs.

Brier-calibrated predictions:
- P(first paid pilot signed within 30 days) = 65% (Sankore internship-first path de-risks this materially)
- P(3+ signed pilots within 60 days) = 35% (harder — requires active LinkedIn outreach producing compounding warm leads)
- P(Gabe becomes an active advisor or investor) = 40% (he engaged deeply; signal is there, but he did not offer. Wait for the first pilot to come back with it.)

Log all three in the Decision Log with today's date so the calibration compounds.`,
};

// Error codes we treat as "settle-on-next-deploy" rather than hard
// failures. P1001 = connection error (DB waking). P2021 = table missing
// (migration pending). P2022 = column missing (schema drift between
// generated client and deployed DB). In all three cases we log and exit
// 0 — the seed is not build-critical and will apply on a subsequent
// deploy once the DB side is caught up.
const TOLERABLE_PRISMA_CODES = new Set(['P1001', 'P2021', 'P2022']);

async function main() {
  console.log('\n🤝 Seeding Gabriel Osamor CFO strategy call...\n');

  try {
    const existing = await prisma.founderMeeting.findFirst({
      where: {
        prospectName: GABE_MEETING.prospectName,
        meetingType: GABE_MEETING.meetingType,
        happenedAt: {
          gte: new Date(HAPPENED_AT.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(HAPPENED_AT.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: { id: true },
    });

    if (existing) {
      console.log(`  ⏭️  Gabe meeting already exists (id: ${existing.id}). Skipping.`);
      return;
    }

    const created = await prisma.founderMeeting.create({
      data: {
        meetingType: GABE_MEETING.meetingType,
        prospectName: GABE_MEETING.prospectName,
        prospectRole: GABE_MEETING.prospectRole,
        prospectCompany: GABE_MEETING.prospectCompany,
        // Prep fields intentionally null — this is a manually-logged past meeting
        linkedInInfo: null,
        meetingContext: null,
        founderAsk: null,
        prepPlan: null,
        // Three-tab content maps onto notes / learnings / nextSteps columns
        notes: GABE_MEETING.whatHappened,
        learnings: GABE_MEETING.outcomes,
        nextSteps: GABE_MEETING.theFuture,
        outcome: GABE_MEETING.outcome,
        scheduledAt: null,
        happenedAt: GABE_MEETING.happenedAt,
        status: GABE_MEETING.status,
        source: GABE_MEETING.source,
      },
    });

    console.log(`  ✅ Created Gabe meeting (id: ${created.id})`);
    console.log(`     The Founder AI chat will now reference this call automatically.`);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code && TOLERABLE_PRISMA_CODES.has(code)) {
      console.warn(
        `  ⚠️  Seed hit Prisma ${code} (schema still settling or DB asleep). ` +
          `Will retry on next deploy once migrations are caught up.`
      );
      return;
    }
    // Surface the full error object so the Vercel build log shows the
    // actual cause (the wrapper will flag this as a seed failure but
    // won't block the build).
    console.error('❌ Gabe seed failed with unexpected error:', err);
    throw err;
  }
}

main()
  .catch(err => {
    console.error('❌ Seed failed (outer):', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
