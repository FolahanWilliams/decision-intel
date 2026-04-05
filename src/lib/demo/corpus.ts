/**
 * Seed corpus for cold-start orgs (M4).
 *
 * Reuses the hand-crafted analyses already in `src/app/demo/data.ts` (used
 * by the /demo marketing page) as the source of truth. For each analysis
 * we synthesize a plausible source-memo body by stitching the bias-evidence
 * excerpts together with short framing text — this gives the seeded
 * Document a readable `content` field without duplicating 900 LOC of data.
 *
 * The three seed analyses intentionally cover diverse bias signatures so
 * the Decision Knowledge Graph and Team Cognitive Profile render meaningful
 * topology from day one:
 *
 *   1. Microsoft–Nokia Acquisition (2013, real failure)
 *      → anchoring, confirmation, sunk cost, groupthink, overconfidence
 *   2. Project Phoenix European Expansion (fictional, authority-driven)
 *      → authority, confirmation, sunk cost, bandwagon, planning fallacy
 *   3. Meridian Health Series B Investment (fictional, overconfidence)
 *      → overconfidence, halo effect, availability, framing
 *
 * All three are failures (or likely failures), which lets M4 also seed
 * 2 confirmed outcomes so the calibration flywheel has signal from day one.
 */

import { DEMO_ANALYSES, type DemoAnalysis, type DemoBias } from '@/app/demo/data';

export interface CorpusEntry {
  demoId: string; // Stable key for idempotency checks ("demo-nokia-acquisition")
  filename: string;
  documentType: string;
  documentContent: string; // Synthesized memo body used as Document.content
  analysis: DemoAnalysis; // Full analysis results to persist
  seedOutcome?: {
    outcome: 'success' | 'partial_success' | 'failure' | 'too_early';
    timeframe: string;
    impactScore: number;
    notes: string;
    confirmedBiases: string[];
  };
  participants: string[]; // Feeds person nodes in the decision graph
}

/**
 * Build a plausible source memo from a DemoAnalysis by concatenating the
 * bias excerpts with short contextual framing. The result is what the
 * ingested document would have looked like before analysis — realistic
 * enough that a user clicking the seeded doc sees something readable,
 * not a placeholder.
 */
function synthesizeMemoBody(analysis: DemoAnalysis, header: string): string {
  const excerpts = analysis.biases.map((b: DemoBias) => b.excerpt.trim());
  const sections = [
    header,
    '',
    'EXECUTIVE SUMMARY',
    '',
    excerpts.slice(0, 2).join('\n\n'),
    '',
    'STRATEGIC RATIONALE',
    '',
    excerpts.slice(2, 4).join('\n\n') || excerpts[0],
    '',
    'RISK ASSESSMENT',
    '',
    excerpts.slice(4, 6).join('\n\n') || excerpts[excerpts.length - 1],
    '',
    'RECOMMENDATION',
    '',
    'The committee is asked to approve the proposal as presented. Outstanding diligence items will be resolved in parallel with legal documentation.',
  ];
  return sections.join('\n');
}

const HEADERS: Record<string, string> = {
  'demo-nokia-acquisition':
    'MEMORANDUM — BOARD OF DIRECTORS\nSubject: Strategic Rationale for Nokia Devices & Services Acquisition\nClassification: CONFIDENTIAL',
  'demo-phoenix-expansion':
    'STRATEGIC INITIATIVE PROPOSAL\nProject Phoenix — European Market Expansion\nPrepared for: Executive Leadership Team\nClassification: INTERNAL USE ONLY',
  'demo-meridian-series-b':
    'INVESTMENT COMMITTEE MEMORANDUM\nMeridian Health Technologies — Series B ($45M Round)\nRecommendation: LEAD INVESTOR / BOARD SEAT\nClassification: LP-CONFIDENTIAL',
};

const PARTICIPANTS: Record<string, string[]> = {
  'demo-nokia-acquisition': ['Steve Ballmer', 'Kevin Turner', 'Amy Hood', 'Craig Mundie'],
  'demo-phoenix-expansion': ['Jordan Park', 'Alex Chen', 'Morgan Rios', 'Taylor Kim'],
  'demo-meridian-series-b': ['Riley Donovan', 'Sam Okafor', 'Priya Venkatesan', 'David Cho'],
};

const OUTCOMES: Record<string, CorpusEntry['seedOutcome']> = {
  // Microsoft took a $7.6B write-down on the Nokia acquisition in July 2015
  'demo-nokia-acquisition': {
    outcome: 'failure',
    timeframe: '12-24 months',
    impactScore: -9,
    notes:
      'Sample data — mirrors the real Microsoft write-down of $7.6B on the Nokia Devices & Services acquisition (July 2015). Kept as a worked example so the calibration flywheel has signal from day one.',
    confirmedBiases: ['anchoring_bias', 'sunk_cost_fallacy', 'overconfidence_bias'],
  },
  // Fictional expansion proposal — failure mode matches the bias profile
  'demo-phoenix-expansion': {
    outcome: 'failure',
    timeframe: '6-12 months',
    impactScore: -7,
    notes:
      'Sample data — Project Phoenix is a synthetic worked example. Outcome marked failure because the bias signature (authority-driven + sunk-cost framing) historically correlates with expansion failure.',
    confirmedBiases: ['authority_bias', 'confirmation_bias', 'sunk_cost_fallacy'],
  },
  // Meridian is deliberately left as too_early so users can see a non-failure outcome shape
};

/**
 * Returns the seed corpus ready for insertion. Pure data — no DB access.
 * Safe to call from anywhere (tests, scripts, API routes).
 */
export function getSeedCorpus(): CorpusEntry[] {
  return DEMO_ANALYSES.map(analysis => {
    const header = HEADERS[analysis.id] ?? `MEMORANDUM\nSubject: ${analysis.documentName}`;
    return {
      demoId: analysis.id,
      filename: `${analysis.shortName} (SAMPLE).txt`,
      documentType:
        analysis.id === 'demo-nokia-acquisition'
          ? 'm_and_a_memo'
          : analysis.id === 'demo-phoenix-expansion'
            ? 'strategy_proposal'
            : 'ic_memo',
      documentContent: synthesizeMemoBody(analysis, header),
      analysis,
      seedOutcome: OUTCOMES[analysis.id],
      participants: PARTICIPANTS[analysis.id] ?? [],
    };
  });
}

/**
 * Set of demo IDs used for idempotency checks — if any document with
 * `isSample: true` and contentHash matching a seed entry already exists,
 * we skip re-seeding.
 */
export function getSeedDemoIds(): Set<string> {
  return new Set(DEMO_ANALYSES.map(a => a.id));
}
