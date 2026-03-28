/**
 * Seed Script: Creates demo case studies for the public case study gallery.
 *
 * Creates realistic anonymized analyses with bias patterns, outcomes,
 * and ShareLinks marked as case studies. Essential for cold-start —
 * the gallery will be empty until real pilots generate data.
 *
 * Usage: npx tsx scripts/seed-case-studies.ts
 * Requires: DATABASE_URL environment variable
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Seed Data Definitions ──────────────────────────────────────────────────

const SEED_USER_ID = 'seed_case_study_user';
const SEED_ORG_ID = 'seed_case_study_org';

interface CaseStudyDef {
  dealName: string;
  dealType: string;
  sector: string;
  stage: string;
  ticketSize: number;
  overallScore: number;
  noiseScore: number;
  summary: string;
  biases: { biasType: string; severity: string; excerpt: string; explanation: string; suggestion: string }[];
  outcome: {
    outcome: string;
    impactScore: number;
    confirmedBiases: string[];
    falsPositiveBiases: string[];
    notes: string;
  };
  dealOutcome?: {
    irr: number;
    moic: number;
    exitType: string;
    holdPeriod: number;
  };
}

const CASE_STUDIES: CaseStudyDef[] = [
  {
    dealName: 'Mid-Market SaaS Buyout',
    dealType: 'buyout',
    sector: 'technology',
    stage: 'exited',
    ticketSize: 45_000_000,
    overallScore: 42,
    noiseScore: 68,
    summary:
      'IC memo for a $45M buyout of a mid-market SaaS platform showed significant anchoring to management-projected ARR growth (48% YoY) despite decelerating net retention. Confirmation bias in customer reference checks — all references were hand-selected by the target. The analysis flagged 3 high-severity biases that were later confirmed when the company missed its Year 1 revenue target by 31%.',
    biases: [
      {
        biasType: 'Anchoring Bias',
        severity: 'high',
        excerpt: 'Management projects 48% ARR growth based on current pipeline...',
        explanation:
          'The memo anchors heavily to management projections without independently modeling growth from cohort retention data. Historical net retention has declined from 118% to 104% over 3 quarters.',
        suggestion:
          'Build a bottom-up ARR model from cohort-level retention and expansion data. Stress-test with 90th percentile downside on net retention.',
      },
      {
        biasType: 'Confirmation Bias',
        severity: 'high',
        excerpt: 'Customer interviews confirm strong product-market fit...',
        explanation:
          'All 6 customer references were provided by management. No independent reference checks or churned-customer interviews were conducted.',
        suggestion:
          'Conduct blind reference checks including 2-3 churned customers and 2-3 prospects who chose a competitor.',
      },
      {
        biasType: 'Overconfidence',
        severity: 'high',
        excerpt: 'Base case IRR of 28% with significant upside to 35%+...',
        explanation:
          'Return projections assume successful cross-sell into adjacent verticals with no execution risk discount. No bear case is presented in the memo.',
        suggestion:
          'Include explicit bear, base, and bull cases with probability weightings. Apply execution risk discount of 15-25% for unproven cross-sell.',
      },
      {
        biasType: 'Survivorship Bias',
        severity: 'medium',
        excerpt: 'Comparable exits in SaaS buyouts show median 3.2x MOIC...',
        explanation:
          'Comparable set only includes successful exits, excluding 4 known SaaS buyout write-downs in the same vintage range.',
        suggestion:
          'Include failed/impaired outcomes in the comparable set to get a realistic distribution of buyout outcomes.',
      },
    ],
    outcome: {
      outcome: 'failure',
      impactScore: 85,
      confirmedBiases: ['Anchoring Bias', 'Confirmation Bias', 'Overconfidence'],
      falsPositiveBiases: [],
      notes:
        'Company missed Y1 revenue target by 31%. Net retention continued declining to 96%. Cross-sell initiative failed to gain traction. Deal ultimately restructured at 0.7x MOIC.',
    },
    dealOutcome: {
      irr: -8.2,
      moic: 0.7,
      exitType: 'write_off',
      holdPeriod: 36,
    },
  },
  {
    dealName: 'Series B FinTech Growth',
    dealType: 'growth_equity',
    sector: 'financial_services',
    stage: 'portfolio',
    ticketSize: 25_000_000,
    overallScore: 71,
    noiseScore: 35,
    summary:
      'Growth equity IC memo for a $25M Series B in a payments infrastructure company. Analysis detected moderate anchoring to TAM estimates and mild authority bias toward a well-known co-investor. However, the core thesis around regulatory tailwinds was well-supported with evidence. Post-investment, the company exceeded revenue targets by 18% and secured a strategic partnership.',
    biases: [
      {
        biasType: 'Anchoring Bias',
        severity: 'medium',
        excerpt: 'TAM estimated at $47B based on industry report...',
        explanation:
          'TAM figure sourced from a single industry report commissioned by a competitor. No independent bottoms-up market sizing performed.',
        suggestion:
          'Conduct bottoms-up TAM analysis from payment volume data and regulatory filing counts.',
      },
      {
        biasType: 'Authority Bias',
        severity: 'low',
        excerpt: 'Co-investment alongside [Top-Tier Fund] validates thesis...',
        explanation:
          'The memo gives disproportionate weight to the co-investor brand rather than the independent merits of the investment thesis.',
        suggestion:
          'Evaluate the thesis on its own merits. Note the co-investor as context but not as primary evidence.',
      },
    ],
    outcome: {
      outcome: 'success',
      impactScore: 45,
      confirmedBiases: ['Anchoring Bias'],
      falsPositiveBiases: ['Authority Bias'],
      notes:
        'Company exceeded Y1 revenue target by 18%. Regulatory tailwind thesis played out as predicted. Strategic partnership with major bank announced. Authority bias flag was a false positive — co-investor added genuine operational value.',
    },
    dealOutcome: {
      irr: 34.5,
      moic: 2.1,
      exitType: 'secondary',
      holdPeriod: 24,
    },
  },
  {
    dealName: 'Healthcare Platform Add-On',
    dealType: 'add_on',
    sector: 'healthcare',
    stage: 'portfolio',
    ticketSize: 12_000_000,
    overallScore: 58,
    noiseScore: 52,
    summary:
      'Add-on acquisition IC memo for a $12M healthcare data platform to bolt onto an existing portfolio company. Analysis detected significant planning fallacy in integration timeline estimates and sunk cost bias from prior platform investments. Integration took 14 months vs. the projected 6 months, but ultimately delivered the expected synergies.',
    biases: [
      {
        biasType: 'Planning Fallacy',
        severity: 'high',
        excerpt: 'Integration expected to complete within 6 months...',
        explanation:
          'Integration timeline of 6 months has no historical basis. The portfolio company last integration took 11 months. Healthcare data integrations average 9-14 months per industry benchmarks.',
        suggestion:
          'Use reference class forecasting: benchmark against 3+ comparable healthcare data integrations. Apply 1.5-2x multiplier to internal estimates.',
      },
      {
        biasType: 'Sunk Cost Bias',
        severity: 'medium',
        excerpt: 'Builds on our $8M investment in the data layer...',
        explanation:
          'The memo justifies the acquisition partly by the prior investment in the data layer. This prior spend should not factor into the go/no-go decision.',
        suggestion:
          'Evaluate the add-on purely on forward-looking ROI. Run a separate analysis assuming the data layer investment was zero.',
      },
      {
        biasType: 'Groupthink',
        severity: 'medium',
        excerpt: 'The deal team unanimously recommends proceeding...',
        explanation:
          'No dissenting views are presented in the memo. All 4 deal team members reached the same conclusion, suggesting insufficient devil advocacy.',
        suggestion:
          'Assign a formal devil advocate role. Include a "reasons to pass" section in the memo with genuine counterarguments.',
      },
    ],
    outcome: {
      outcome: 'partial_success',
      impactScore: 62,
      confirmedBiases: ['Planning Fallacy', 'Groupthink'],
      falsPositiveBiases: [],
      notes:
        'Integration took 14 months vs. 6-month projection (planning fallacy confirmed). Synergies eventually materialized but 8 months late. Devil advocacy would have surfaced the integration risk earlier.',
    },
  },
  {
    dealName: 'Consumer Brand Recapitalization',
    dealType: 'recapitalization',
    sector: 'consumer',
    stage: 'exited',
    ticketSize: 80_000_000,
    overallScore: 35,
    noiseScore: 74,
    summary:
      'Recapitalization IC memo for an $80M consumer brand showed severe narrative bias — the memo told a compelling turnaround story but the numbers told a different one. Availability bias from a recent successful consumer turnaround in the portfolio led to over-extrapolation. The analysis flagged 5 biases; 4 were later confirmed when the brand failed to reverse its declining trajectory.',
    biases: [
      {
        biasType: 'Narrative Bias',
        severity: 'high',
        excerpt: 'The brand is at an inflection point with new management...',
        explanation:
          'The memo constructs a compelling turnaround narrative around new management, but quantitative data shows continued deterioration: same-store sales -7%, brand sentiment declining, and market share loss accelerating.',
        suggestion:
          'Separate the narrative from the data. Create a data-only summary and evaluate the investment thesis without the management story.',
      },
      {
        biasType: 'Availability Bias',
        severity: 'high',
        excerpt: 'Similar to our successful turnaround of [Portfolio Co X]...',
        explanation:
          'Direct comparison to a recent successful turnaround is misleading — that company operated in a growing category while this brand faces secular decline.',
        suggestion:
          'Use a broader reference class of consumer brand turnarounds, not just the one success in the current portfolio.',
      },
      {
        biasType: 'Anchoring Bias',
        severity: 'high',
        excerpt: 'At 0.8x revenue, this represents a historic discount...',
        explanation:
          'Valuation is anchored to historical multiples for the brand category (1.5-2.0x). The current discount may reflect structural impairment, not a buying opportunity.',
        suggestion:
          'Model intrinsic value from DCF with realistic assumptions rather than anchoring to peer multiples that may not apply.',
      },
      {
        biasType: 'Overconfidence',
        severity: 'medium',
        excerpt: 'Management has high confidence in the 18-month turnaround plan...',
        explanation:
          'Management expresses certainty without acknowledging significant execution risks. Consumer turnarounds have a ~30% success rate per industry data.',
        suggestion:
          'Explicitly state the base rate for consumer turnaround success and calibrate expectations accordingly.',
      },
      {
        biasType: 'Commitment Escalation',
        severity: 'medium',
        excerpt: 'Having supported this brand through two prior rounds...',
        explanation:
          'Prior investment history is creating escalation of commitment. The memo treats this as "doubling down on conviction" rather than objectively reassessing.',
        suggestion:
          'Apply a clean-slate test: would you invest at this price if you had no prior relationship? If not, the commitment escalation is driving the decision.',
      },
    ],
    outcome: {
      outcome: 'failure',
      impactScore: 92,
      confirmedBiases: ['Narrative Bias', 'Availability Bias', 'Anchoring Bias', 'Commitment Escalation'],
      falsPositiveBiases: [],
      notes:
        'Brand failed to reverse declining trajectory. Same-store sales continued falling (-12% in Y2). New management team replaced after 14 months. Investment written down to 0.3x MOIC.',
    },
    dealOutcome: {
      irr: -28.5,
      moic: 0.3,
      exitType: 'write_off',
      holdPeriod: 30,
    },
  },
  {
    dealName: 'Industrial Tech Growth Equity',
    dealType: 'growth_equity',
    sector: 'industrials',
    stage: 'portfolio',
    ticketSize: 35_000_000,
    overallScore: 78,
    noiseScore: 22,
    summary:
      'Growth equity IC memo for a $35M investment in an industrial IoT platform. The analysis was notably high-quality with low noise. Only 2 biases detected, both low severity. The memo included proper reference class forecasting, explicit bear/base/bull cases, and blind customer references. This represents best-practice IC memo writing.',
    biases: [
      {
        biasType: 'Optimism Bias',
        severity: 'low',
        excerpt: 'Market adoption curve suggests 40% penetration by 2027...',
        explanation:
          'Adoption projection is at the optimistic end of industry estimates (range: 25-45%). While not unreasonable, the memo presents this as the base case rather than the upside.',
        suggestion:
          'Use the median estimate (32%) as the base case and 40% as the bull case.',
      },
      {
        biasType: 'Status Quo Bias',
        severity: 'low',
        excerpt: 'Current go-to-market through channel partners is working well...',
        explanation:
          'The memo assumes the current GTM motion will continue to scale, but at $35M+ ARR, many B2B companies need to add a direct sales component.',
        suggestion:
          'Model the GTM transition cost and timeline in the financial projections. Include a direct sales build-out scenario.',
      },
    ],
    outcome: {
      outcome: 'success',
      impactScore: 25,
      confirmedBiases: [],
      falsPositiveBiases: ['Optimism Bias'],
      notes:
        'Company hit 38% market penetration (above the suggested 32% base case, invalidating the optimism bias flag). Channel GTM continued scaling effectively through $50M ARR. High-quality memo with genuinely low bias load.',
    },
    dealOutcome: {
      irr: 42.0,
      moic: 3.2,
      exitType: 'secondary',
      holdPeriod: 18,
    },
  },
];

// ─── Seed Execution ─────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding case study data...\n');

  for (const cs of CASE_STUDIES) {
    console.log(`  Creating: ${cs.dealName}`);

    const contentHash = crypto.randomBytes(16).toString('hex');

    await prisma.$transaction(async (tx) => {
      // Create Deal
      const deal = await tx.deal.create({
        data: {
          orgId: SEED_ORG_ID,
          name: cs.dealName,
          dealType: cs.dealType,
          stage: cs.stage,
          sector: cs.sector,
          ticketSize: cs.ticketSize,
          status: cs.stage === 'exited' ? 'exited' : 'invested',
        },
      });

      // Create Document (minimal — just enough to link)
      const doc = await tx.document.create({
        data: {
          userId: SEED_USER_ID,
          orgId: SEED_ORG_ID,
          filename: `${cs.dealName.toLowerCase().replace(/\s+/g, '-')}-ic-memo.pdf`,
          fileType: 'application/pdf',
          fileSize: 0,
          content: '[Redacted — seed case study]',
          contentHash,
          status: 'analyzed',
          dealId: deal.id,
        },
      });

      // Create Analysis
      const analysis = await tx.analysis.create({
        data: {
          documentId: doc.id,
          overallScore: cs.overallScore,
          noiseScore: cs.noiseScore,
          summary: cs.summary,
          outcomeStatus: cs.outcome ? 'outcome_recorded' : 'pending_outcome',
        },
      });

      // Create BiasInstances
      for (const bias of cs.biases) {
        await tx.biasInstance.create({
          data: {
            analysisId: analysis.id,
            biasType: bias.biasType,
            severity: bias.severity,
            excerpt: bias.excerpt,
            explanation: bias.explanation,
            suggestion: bias.suggestion,
            confidence: bias.severity === 'high' ? 0.9 : bias.severity === 'medium' ? 0.75 : 0.6,
          },
        });
      }

      // Create DecisionOutcome
      if (cs.outcome) {
        await tx.decisionOutcome.create({
          data: {
            analysisId: analysis.id,
            userId: SEED_USER_ID,
            orgId: SEED_ORG_ID,
            outcome: cs.outcome.outcome,
            impactScore: cs.outcome.impactScore,
            confirmedBiases: cs.outcome.confirmedBiases,
            falsPositiveBiases: cs.outcome.falsPositiveBiases,
            notes: cs.outcome.notes,
          },
        });
      }

      // Create DealOutcome (if available)
      if (cs.dealOutcome) {
        await tx.dealOutcome.create({
          data: {
            dealId: deal.id,
            irr: cs.dealOutcome.irr,
            moic: cs.dealOutcome.moic,
            exitType: cs.dealOutcome.exitType,
            holdPeriod: cs.dealOutcome.holdPeriod,
          },
        });
      }

      // Create ShareLink (case study)
      await tx.shareLink.create({
        data: {
          token: crypto.randomBytes(24).toString('base64url'),
          analysisId: analysis.id,
          userId: SEED_USER_ID,
          orgId: SEED_ORG_ID,
          isCaseStudy: true,
          expiresAt: null, // Case studies never expire
        },
      });
    });

    console.log(`  ✓ ${cs.dealName} created\n`);
  }

  console.log(`\nDone! Created ${CASE_STUDIES.length} case studies.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
