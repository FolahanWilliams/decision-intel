/**
 * Case Study Matcher
 *
 * Maintains a curated set of famous decision failures and matches detected
 * bias patterns against historical parallels using RAG similarity search.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CaseStudyMatcher');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CaseStudyMatch {
  company: string;
  title: string;
  year: number | null;
  summary: string;
  biasTypes: string[];
  outcome: string;
  lessons: string;
  industry: string | null;
}

// ─── Curated Case Studies ────────────────────────────────────────────────────
// These are seeded into the DB on first use and matched via bias type overlap.

const CURATED_CASES: Omit<CaseStudyMatch, never>[] = [
  {
    company: 'Enron',
    title: 'Enron Accounting Fraud and Groupthink',
    year: 2001,
    summary:
      'Enron executives engaged in systematic accounting fraud enabled by groupthink, overconfidence, and authority bias. Internal dissent was suppressed, and complex financial instruments were used to hide debt.',
    biasTypes: ['groupthink', 'overconfidence', 'authority', 'confirmation'],
    outcome: 'bankruptcy',
    lessons:
      'Independent oversight, whistleblower protection, and challenging consensus are essential. When leaders punish dissent, cognitive biases compound unchecked.',
    industry: 'Energy',
  },
  {
    company: 'Nokia',
    title: "Nokia's Failure to Adapt to Smartphones",
    year: 2013,
    summary:
      'Nokia dominated mobile phones but failed to recognize the smartphone revolution. Status quo bias, overconfidence in existing market position, and anchoring to hardware-centric strategy led to catastrophic market share loss.',
    biasTypes: ['status_quo', 'overconfidence', 'anchoring', 'selective_perception'],
    outcome: 'market_loss',
    lessons:
      'Market leaders must actively challenge their assumptions. Anchoring to past success prevents recognition of disruptive threats.',
    industry: 'Technology',
  },
  {
    company: 'Kodak',
    title: "Kodak's Failure to Embrace Digital Photography",
    year: 2012,
    summary:
      'Kodak invented the digital camera in 1975 but refused to pivot from film. Sunk cost fallacy around film infrastructure, status quo bias, and loss aversion regarding cannibalizing film revenue led to bankruptcy.',
    biasTypes: ['sunk_cost', 'status_quo', 'loss_aversion', 'anchoring'],
    outcome: 'bankruptcy',
    lessons:
      'Sunk cost fallacy prevents organizations from cannibalizing their own products. First-mover advantage means nothing without willingness to disrupt yourself.',
    industry: 'Technology',
  },
  {
    company: 'Theranos',
    title: 'Theranos Blood Testing Fraud',
    year: 2018,
    summary:
      'Elizabeth Holmes built a $9B company on false claims about blood-testing technology. Authority bias (prestigious board), bandwagon effect (media hype), and overconfidence allowed the fraud to persist for years.',
    biasTypes: ['authority', 'bandwagon', 'overconfidence', 'confirmation'],
    outcome: 'fraud_conviction',
    lessons:
      'Authority bias from prestigious names on a board does not validate technology. Independent technical due diligence is non-negotiable.',
    industry: 'Healthcare',
  },
  {
    company: 'WeWork',
    title: "WeWork's Failed IPO and Governance Crisis",
    year: 2019,
    summary:
      'WeWork was valued at $47B but collapsed during IPO scrutiny. Overconfidence bias from founder Adam Neumann, framing bias (calling real estate a tech company), and groupthink among investors led to a $39B value destruction.',
    biasTypes: ['overconfidence', 'framing', 'groupthink', 'bandwagon'],
    outcome: 'market_loss',
    lessons:
      'Framing a traditional business as tech does not change fundamentals. Investor groupthink and FOMO create bubbles that harm all stakeholders.',
    industry: 'Real Estate',
  },
  {
    company: 'Blockbuster',
    title: "Blockbuster's Rejection of Netflix Partnership",
    year: 2010,
    summary:
      'Blockbuster CEO turned down acquiring Netflix for $50M in 2000. Anchoring to the physical store model, status quo bias, and overconfidence in brand power led to bankruptcy while Netflix grew to $150B+.',
    biasTypes: ['anchoring', 'status_quo', 'overconfidence', 'selective_perception'],
    outcome: 'bankruptcy',
    lessons:
      'Anchoring to current business models blinds organizations to emerging competitors. The cost of inaction often exceeds the cost of transformation.',
    industry: 'Entertainment',
  },
  {
    company: 'Boeing',
    title: 'Boeing 737 MAX Crisis',
    year: 2019,
    summary:
      'Boeing prioritized schedule and cost over safety in the 737 MAX program. Planning fallacy underestimated MCAS system risks, authority bias suppressed engineer concerns, and confirmation bias led to dismissing crash data.',
    biasTypes: ['planning_fallacy', 'authority', 'confirmation', 'overconfidence'],
    outcome: 'safety_crisis',
    lessons:
      'Planning fallacy in safety-critical systems has catastrophic consequences. When engineers raise concerns, authority bias in management must not override technical judgment.',
    industry: 'Aerospace',
  },
  {
    company: 'Lehman Brothers',
    title: 'Lehman Brothers Collapse and the 2008 Financial Crisis',
    year: 2008,
    summary:
      "Lehman Brothers' excessive leverage in subprime mortgages was driven by overconfidence, recency bias (recent market gains), and groupthink across the financial industry. Loss aversion prevented timely de-risking.",
    biasTypes: ['overconfidence', 'recency', 'groupthink', 'loss_aversion', 'bandwagon'],
    outcome: 'bankruptcy',
    lessons:
      'Recency bias in financial markets leads to systematic underestimation of tail risks. When an entire industry shares the same biases, systemic collapse becomes inevitable.',
    industry: 'Finance',
  },
  {
    company: 'Volkswagen',
    title: 'Volkswagen Dieselgate Emissions Scandal',
    year: 2015,
    summary:
      'VW installed defeat devices to cheat emissions tests. Groupthink in engineering culture, authority bias from aggressive leadership targets, and framing emissions goals as impossible within constraints led to institutional fraud.',
    biasTypes: ['groupthink', 'authority', 'framing', 'planning_fallacy'],
    outcome: 'regulatory_penalty',
    lessons:
      'When leadership sets targets that appear impossible, subordinates may resort to unethical shortcuts. Organizational culture that punishes bad news creates systemic blind spots.',
    industry: 'Automotive',
  },
  {
    company: 'Yahoo',
    title: "Yahoo's Decline and Missed Acquisitions",
    year: 2017,
    summary:
      'Yahoo turned down acquiring Google for $1M (2002) and Facebook for $1B (2006). Anchoring to portal strategy, overconfidence in existing user base, and loss aversion about dilution led to eventual sale for $4.5B.',
    biasTypes: ['anchoring', 'overconfidence', 'loss_aversion', 'status_quo'],
    outcome: 'market_loss',
    lessons:
      'Loss aversion about acquisition costs can lead to far greater losses. Strategic anchoring to a declining model compounds opportunity cost over time.',
    industry: 'Technology',
  },
];

// ─── Seeding ─────────────────────────────────────────────────────────────────

/**
 * Seed curated case studies into the DB if not already present.
 * Called lazily on first match request.
 */
let seeded = false;
async function ensureSeeded(): Promise<void> {
  if (seeded) return;

  const count = await prisma.caseStudy.count();
  if (count >= CURATED_CASES.length) {
    seeded = true;
    return;
  }

  log.info('Seeding case study database...');
  for (const cs of CURATED_CASES) {
    try {
      await prisma.caseStudy.upsert({
        where: {
          id: `seed_${cs.company.toLowerCase().replace(/\s+/g, '_')}_${cs.year || 0}`,
        },
        update: {},
        create: {
          id: `seed_${cs.company.toLowerCase().replace(/\s+/g, '_')}_${cs.year || 0}`,
          ...cs,
        },
      });
    } catch {
      // Already exists or other issue
    }
  }
  seeded = true;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Find case studies that match the detected bias types.
 * Uses overlap scoring: more matching bias types = higher relevance.
 *
 * @param detectedBiases Array of bias type strings found in the document
 * @param industry Optional industry to prioritize sector-relevant cases
 * @param limit Max results to return
 */
export async function matchCaseStudies(
  detectedBiases: string[],
  industry?: string,
  limit: number = 3
): Promise<CaseStudyMatch[]> {
  await ensureSeeded();

  if (detectedBiases.length === 0) return [];

  // Query all case studies that share at least one bias type
  const candidates = await prisma.caseStudy.findMany({
    where: {
      biasTypes: { hasSome: detectedBiases },
    },
    select: {
      company: true,
      title: true,
      year: true,
      summary: true,
      biasTypes: true,
      outcome: true,
      lessons: true,
      industry: true,
    },
  });

  // Score by overlap: more matching biases = higher score
  const scored = candidates.map(cs => {
    const overlap = cs.biasTypes.filter(b => detectedBiases.includes(b)).length;
    const industryBonus = industry && cs.industry?.toLowerCase() === industry.toLowerCase() ? 1 : 0;
    return { ...cs, score: overlap + industryBonus };
  });

  // Sort by score (descending), then by year (most recent first)
  scored.sort((a, b) => b.score - a.score || (b.year || 0) - (a.year || 0));

  return scored.slice(0, limit);
}
