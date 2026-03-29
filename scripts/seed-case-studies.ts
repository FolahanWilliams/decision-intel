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
  biases: {
    biasType: string;
    severity: string;
    excerpt: string;
    explanation: string;
    suggestion: string;
  }[];
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
      confirmedBiases: [
        'Narrative Bias',
        'Availability Bias',
        'Anchoring Bias',
        'Commitment Escalation',
      ],
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
        suggestion: 'Use the median estimate (32%) as the base case and 40% as the bull case.',
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

  // ─── Enterprise Case Studies ──────────────────────────────────────────────

  {
    dealName: 'Corporate M&A Integration',
    dealType: 'm_and_a',
    sector: 'technology',
    stage: 'closed',
    ticketSize: 2_100_000_000,
    overallScore: 38,
    noiseScore: 71,
    summary:
      'Board memo for a $2.1B acquisition of a competing enterprise software platform. Analysis revealed severe anchoring to strategic synergy projections ($340M annual savings) that were never independently validated. Sunk cost bias from an 18-month pursuit colored the go/no-go decision. Unanimous board approval with no documented dissent suggests groupthink. Post-close, integration stalled and projected synergies never materialized, resulting in an $800M write-down within 24 months.',
    biases: [
      {
        biasType: 'Anchoring Bias',
        severity: 'high',
        excerpt: 'Strategic synergies conservatively estimated at $340M annually...',
        explanation:
          'The $340M synergy estimate originated from the target company\'s management presentation and was adopted wholesale. No independent bottoms-up synergy model was built. The word "conservatively" masks the fact that this is the only scenario modeled.',
        suggestion:
          'Commission an independent synergy assessment. Model three scenarios (bear/base/bull) with probability weightings. Historical M&A synergy realization averages 50-60% of projections.',
      },
      {
        biasType: 'Sunk Cost Bias',
        severity: 'high',
        excerpt: 'After 18 months of strategic engagement and $14M in advisory fees...',
        explanation:
          'The memo frames prior investment of time and advisory fees as justification to proceed. These are sunk costs that should not factor into the forward-looking decision.',
        suggestion:
          'Apply a clean-slate test: would you pursue this acquisition today at this price if you had zero prior engagement? Separate the acquisition decision from the sunk advisory investment.',
      },
      {
        biasType: 'Groupthink',
        severity: 'high',
        excerpt: 'The board unanimously endorses proceeding to definitive agreement...',
        explanation:
          'Unanimous board approval with no documented dissenting views. No devil\'s advocate was assigned. The memo presents no "reasons to decline" section, suggesting insufficient challenge of the thesis.',
        suggestion:
          "Require a formal dissent section in every acquisition memo. Assign a board member as devil's advocate. Document the strongest arguments against proceeding.",
      },
      {
        biasType: 'Overconfidence',
        severity: 'medium',
        excerpt: 'Integration timeline of 12 months positions us for Year 2 cross-selling...',
        explanation:
          'The 12-month integration timeline is at the aggressive end for enterprise software M&A. Industry benchmarks show average integration timelines of 18-30 months for deals of this complexity.',
        suggestion:
          'Use reference class forecasting. Benchmark against 5+ comparable enterprise software integrations. Apply a 1.5-2x multiplier to internal timeline estimates.',
      },
    ],
    outcome: {
      outcome: 'failure',
      impactScore: 94,
      confirmedBiases: ['Anchoring Bias', 'Sunk Cost Bias', 'Groupthink'],
      falsPositiveBiases: [],
      notes:
        'Integration stalled at 18 months with only 15% of projected synergies realized. Key engineering talent departed during integration. $800M write-down announced in Year 2. Board later acknowledged insufficient challenge of the acquisition thesis.',
    },
  },
  {
    dealName: 'Digital Transformation Initiative',
    dealType: 'strategic_initiative',
    sector: 'financial_services',
    stage: 'monitoring',
    ticketSize: 150_000_000,
    overallScore: 52,
    noiseScore: 58,
    summary:
      'Strategy paper for a $150M digital transformation initiative at a mid-tier bank. Analysis detected significant planning fallacy in the 24-month delivery timeline — comparable bank transformations average 36-48 months. Optimism bias in projected cost savings and status quo bias from legacy system defenders who shaped the phasing plan. Despite these biases, the initiative eventually delivered core capabilities, though 18 months late and 2.5x over the original budget.',
    biases: [
      {
        biasType: 'Planning Fallacy',
        severity: 'high',
        excerpt: 'Full platform migration targeted for completion within 24 months...',
        explanation:
          "The 24-month timeline has no historical precedent for a bank of this size and complexity. The bank's own last major system migration took 38 months. Industry benchmarks show digital transformations of this scope average 36-48 months.",
        suggestion:
          'Use reference class forecasting: benchmark against 5+ comparable bank digital transformations. Apply an optimism correction factor of 1.5-2x to all timeline estimates.',
      },
      {
        biasType: 'Optimism Bias',
        severity: 'medium',
        excerpt: 'Projected annual cost savings of $45M by Year 3...',
        explanation:
          'Cost savings projections assume smooth adoption and no parallel running of legacy systems. Historical data shows banks typically run parallel systems for 12-18 months post-migration, significantly reducing Year 1-2 savings.',
        suggestion:
          'Model a realistic parallel-running period. Discount Year 1-2 savings by 60-80%. Present savings as a range rather than a point estimate.',
      },
      {
        biasType: 'Status Quo Bias',
        severity: 'medium',
        excerpt: 'The phased approach preserves existing customer touchpoints during transition...',
        explanation:
          'The phasing plan was heavily influenced by legacy system owners who advocated for preserving current workflows. This "preservation" approach adds 12+ months to the timeline and creates integration complexity that a clean-break migration would avoid.',
        suggestion:
          'Evaluate a parallel clean-break migration option alongside the phased approach. Quantify the cost of the extended timeline against the risk of customer disruption.',
      },
    ],
    outcome: {
      outcome: 'partial_success',
      impactScore: 55,
      confirmedBiases: ['Planning Fallacy', 'Status Quo Bias'],
      falsPositiveBiases: [],
      notes:
        'Initiative delivered core capabilities but 18 months behind schedule (42 vs. 24 months) and 2.5x over budget ($375M vs. $150M). The phased approach recommended by legacy system defenders added unnecessary complexity. Cost savings are materializing but at roughly 60% of original projections.',
    },
  },
  {
    dealName: 'Enterprise EHR Vendor Evaluation',
    dealType: 'vendor_evaluation',
    sector: 'healthcare',
    stage: 'closed',
    ticketSize: 45_000_000,
    overallScore: 61,
    noiseScore: 44,
    summary:
      'Vendor evaluation report for a $45M (5-year) enterprise EHR platform selection at a regional hospital system. Analysis detected authority bias toward the market-leading vendor, framing effects from vendor demos that emphasized different metrics, and availability bias from a recent competitor system outage. Notably, the evaluation committee overrode the AI-detected biases and chose the second-ranked vendor — a decision that saved an estimated $12M over 5 years and delivered better interoperability.',
    biases: [
      {
        biasType: 'Authority Bias',
        severity: 'high',
        excerpt: 'As the market leader with 35% share, Vendor A represents the safest choice...',
        explanation:
          'The evaluation memo gives disproportionate weight to market share as a proxy for quality. The "nobody gets fired for choosing the market leader" heuristic is substituting for rigorous feature-by-feature evaluation.',
        suggestion:
          'Blind the evaluation where possible. Score vendors on specific capability matrices without revealing vendor names. Separate market position from product quality in scoring.',
      },
      {
        biasType: 'Framing Effect',
        severity: 'medium',
        excerpt:
          'Vendor A demonstrated 99.97% uptime while Vendor B highlighted their 15-minute recovery time...',
        explanation:
          'Each vendor framed their demo around their own strengths. The evaluation committee is comparing different metrics (uptime vs. recovery time) rather than standardizing the comparison framework.',
        suggestion:
          'Create a standardized evaluation rubric BEFORE vendor demos. Require all vendors to report on identical metrics. Score on the same dimensions.',
      },
      {
        biasType: 'Availability Bias',
        severity: 'medium',
        excerpt:
          'Given the recent 72-hour outage at [Competitor Hospital System] running Vendor C...',
        explanation:
          'A single high-profile outage at another hospital is being used to eliminate Vendor C from consideration. This anecdote is given more weight than systematic reliability data across all vendor installations.',
        suggestion:
          'Evaluate vendor reliability using aggregate data (mean uptime across all installations) rather than single anecdotal events. Request incident reports from all vendors, not just the one with the recent outage.',
      },
      {
        biasType: 'Bandwagon Effect',
        severity: 'low',
        excerpt: 'Seven of our twelve peer institutions have standardized on Vendor A...',
        explanation:
          'Peer adoption is being used as evidence of product quality. Peer institutions may have different requirements, scales, and integration needs.',
        suggestion:
          'Evaluate whether peer institutions have similar requirements. Contact 2-3 peers who chose different vendors to understand their rationale and satisfaction.',
      },
    ],
    outcome: {
      outcome: 'success',
      impactScore: 35,
      confirmedBiases: ['Authority Bias', 'Framing Effect'],
      falsPositiveBiases: ['Availability Bias'],
      notes:
        "The evaluation committee used the bias analysis to challenge their initial preference for the market leader. After a debiased re-evaluation, they chose Vendor B, saving $12M over 5 years with better interoperability scores. The availability bias flag was a false positive — Vendor C's reliability issues were later confirmed as systemic, not anecdotal.",
    },
  },
  {
    dealName: 'Enterprise Product Launch Assessment',
    dealType: 'product_launch',
    sector: 'technology',
    stage: 'closed',
    ticketSize: 28_000_000,
    overallScore: 44,
    noiseScore: 63,
    summary:
      'Risk assessment for a $28M enterprise SaaS product launch into an adjacent market segment. Analysis detected severe confirmation bias in the market research (only surveyed existing customers), narrative bias in the executive presentation that told a compelling story contradicted by the data, and overconfidence in the go-to-market timeline. The product launched 6 months late, failed to gain traction in the new segment, and was pulled after 12 months with $22M in sunk costs.',
    biases: [
      {
        biasType: 'Confirmation Bias',
        severity: 'high',
        excerpt: '87% of surveyed customers expressed strong interest in the new product line...',
        explanation:
          'Market research surveyed only existing customers who already have a relationship with the company. No prospective customers, competitor users, or market skeptics were included. This creates a self-confirming echo chamber.',
        suggestion:
          'Conduct blind market research including non-customers, competitor users, and prospects who previously chose alternatives. Include a "reasons this product fails" exercise in the research design.',
      },
      {
        biasType: 'Narrative Bias',
        severity: 'high',
        excerpt:
          'The natural extension of our platform into adjacent verticals creates a $2B TAM opportunity...',
        explanation:
          'The executive presentation constructs a compelling narrative of "natural platform extension" while quantitative data shows the target segment has fundamentally different buying patterns, longer sales cycles, and existing entrenched competitors with 5+ years of domain expertise.',
        suggestion:
          'Separate the narrative from the data. Create a data-only summary. Flag where the story contradicts the numbers. Model customer acquisition cost in the new segment independently.',
      },
      {
        biasType: 'Overconfidence',
        severity: 'medium',
        excerpt: 'Our engineering team is confident the product can be market-ready in 9 months...',
        explanation:
          'The 9-month timeline assumes no discovery of new requirements from a different market segment. Engineering confidence is based on building for known customers, not unknown market needs.',
        suggestion:
          'Add a discovery phase (3-6 months) before committing to a launch date. Build in explicit go/no-go gates at 3 and 6 months based on market validation milestones.',
      },
      {
        biasType: 'Planning Fallacy',
        severity: 'medium',
        excerpt: 'Projected break-even within 18 months of launch...',
        explanation:
          'Break-even projections assume rapid adoption curves typical of existing markets. New market entry historically takes 2-3x longer to reach break-even for enterprise SaaS companies.',
        suggestion:
          'Benchmark against 5+ comparable new-market entries by enterprise SaaS companies. Apply a 2x multiplier to the break-even timeline as a base case.',
      },
    ],
    outcome: {
      outcome: 'failure',
      impactScore: 88,
      confirmedBiases: [
        'Confirmation Bias',
        'Narrative Bias',
        'Overconfidence',
        'Planning Fallacy',
      ],
      falsPositiveBiases: [],
      notes:
        'Product launched 6 months late (15 months vs. 9-month estimate). New market segment had fundamentally different needs that existing-customer research failed to surface. Product pulled after 12 months with $22M in sunk costs. Post-mortem confirmed all four detected biases were present in the decision process.',
    },
  },
];

// ─── Seed Execution ─────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding case study data...\n');

  for (const cs of CASE_STUDIES) {
    console.log(`  Creating: ${cs.dealName}`);

    const contentHash = crypto.randomBytes(16).toString('hex');

    await prisma.$transaction(async tx => {
      // Create Deal
      const deal = await tx.deal.create({
        data: {
          orgId: SEED_ORG_ID,
          name: cs.dealName,
          dealType: cs.dealType,
          stage: cs.stage,
          sector: cs.sector,
          ticketSize: cs.ticketSize,
          status: cs.stage === 'exited' ? 'exited' : cs.stage === 'closed' ? 'completed' : 'active',
        },
      });

      // Create Document (minimal — just enough to link)
      const doc = await tx.document.create({
        data: {
          userId: SEED_USER_ID,
          orgId: SEED_ORG_ID,
          filename: `${cs.dealName.toLowerCase().replace(/\s+/g, '-')}-${['m_and_a', 'strategic_initiative', 'vendor_evaluation', 'product_launch', 'risk_assessment', 'restructuring'].includes(cs.dealType) ? 'board-memo' : 'ic-memo'}.pdf`,
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
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
