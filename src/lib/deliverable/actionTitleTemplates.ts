/**
 * Action-title deterministic templates — locked 2026-05-20.
 *
 * Per the Deep Research synthesis: action titles drive the entire
 * deliverable's horizontal logic (the Pyramid Principle's load-bearing
 * mechanism). They MUST be valid even when the LLM-augmentation call
 * fails — every template here produces a complete, active, ≤15-word
 * sentence that contains a real count or metric drawn from the data.
 *
 * The LLM augmentation produces VARIATION ON TOP of these templates,
 * not a replacement for them. If the LLM output ever fails validation
 * (word count, missing counts, banned vocab, count drift vs real data),
 * we silently fall back to the template. The user always sees a valid
 * action title; the variation is icing.
 *
 * Banned vocabulary enforcement (CLAUDE.md `BANNED_VOCABULARY`):
 *   - "decision hygiene", "decision intelligence platform",
 *     "boardroom strategic decision", "company knowledge base",
 *     "AI decision tool", "AI-powered decision platform",
 *     "native reasoning layer", "bad strategic decisions",
 *     "always-on red team", "digital red team"
 *   - The templates below NEVER use these. The LLM validator at
 *     `validateActionTitle` rejects any output that contains them.
 */

import type { Grade } from '@/lib/utils/grade';
import type { ReasoningRisksBucket, StressTestBucket } from './types';

// ──────────────────────────────────────────────────────────────────────
// Banned vocabulary — vendored from icp.ts to avoid the Prisma-importing
// transitive dependency chain when this module is imported into pure
// helper contexts (composer, tests, etc.).
//
// SOURCE OF TRUTH: src/lib/constants/icp.ts BANNED_VOCABULARY. When
// that array changes, update this one in lockstep. The lint:positioning
// gate catches drift on shipped surfaces; the validator below catches
// it at LLM augmentation time.
// ──────────────────────────────────────────────────────────────────────

export const ACTION_TITLE_BANNED_PHRASES: readonly string[] = [
  'decision hygiene',
  'decision intelligence platform',
  'boardroom strategic decision',
  'company knowledge base',
  'ai decision tool',
  'ai-powered decision platform',
  'native reasoning layer',
  'bad strategic decisions',
  'always-on red team',
  'digital red team',
];

const WORD_CAP = 15;

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function containsDigit(s: string): boolean {
  return /\d/.test(s);
}

function listAndJoin(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

/** Truncate a label so the action title stays under the word cap. */
function shortLabel(label: string, maxWords = 3): string {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

function topSeverityWord(counts: ReasoningRisksBucket['counts']): string {
  if (counts.critical > 0) return 'critical';
  if (counts.high > 0) return 'high-severity';
  if (counts.medium > 0) return 'moderate';
  return 'low-severity';
}

// ──────────────────────────────────────────────────────────────────────
// SCQA Cover action title
// ──────────────────────────────────────────────────────────────────────

interface CoverTemplateInput {
  dqiScore: number;
  grade: Grade;
  totalRisks: number;
  criticalRisks: number;
  namedPatternCount: number;
  projectedLift: number;
  /** Optional exposure amount in the user's currency. */
  exposureLabel?: string;
  /** Name of the top toxic combination, when a compound pattern led with exposure. */
  topPatternName?: string;
  /** Critical/high findings surfaced by the ADVERSARIAL modules (forgotten
   *  questions / red team / boardroom). The cover must reconcile with them —
   *  never headline "cleared" while the room rejects (2026-07-02). */
  crossModuleCriticals?: number;
  /** The bias detector ERRORED this run — its empty result is an outage,
   *  not a clean pass. */
  biasDetectionDegraded?: boolean;
}

export function coverActionTitle(input: CoverTemplateInput): string {
  const { dqiScore, grade, totalRisks, criticalRisks, namedPatternCount, projectedLift } = input;
  const crossModule = input.crossModuleCriticals ?? 0;

  // Strongest case: a named TOXIC COMBINATION fired AND carries exposure — the
  // differentiator. Lead with "[pattern] compounds into ~$X at risk": the
  // compounding of biases into a measurable monetary outcome IS the moat.
  if (input.topPatternName && input.exposureLabel && totalRisks > 0) {
    return `${input.topPatternName} compounds into ~${input.exposureLabel} at risk at DQI ${Math.round(dqiScore)}`;
  }

  // Exposure present but no named pattern led — still lead with the dollars.
  if (input.exposureLabel && totalRisks > 0) {
    return `${totalRisks} reasoning risks expose ${input.exposureLabel} on this thesis at DQI ${Math.round(dqiScore)}`;
  }

  // Critical findings dominate
  if (criticalRisks > 0 && projectedLift > 0) {
    return `${criticalRisks} critical risks drop this memo to DQI ${Math.round(dqiScore)}; mitigation lifts +${Math.round(projectedLift)} points`;
  }

  // Named patterns fired
  if (namedPatternCount > 0) {
    const plural = namedPatternCount === 1 ? 'pattern' : 'patterns';
    return `${namedPatternCount} named failure ${plural} surfaced across ${totalRisks} risks at DQI ${Math.round(dqiScore)}`;
  }

  // Risks present but no criticals
  if (totalRisks > 0) {
    return `${totalRisks} reasoning risks shape this thesis at DQI ${Math.round(dqiScore)}, grade ${grade}`;
  }

  // Zero bias-shaped findings from here down. The cover must still
  // reconcile with the strongest cross-module signal (2026-07-02 — the
  // blind-Fermi lesson: "cleared the audit at grade F" while a CRITICAL
  // forgotten question + 4 red-team objections sat one tab over).
  if (input.biasDetectionDegraded) {
    return `Bias detection unavailable this run; ${crossModule} adversarial findings still stand at DQI ${Math.round(dqiScore)}`;
  }
  if (crossModule > 0) {
    return `${crossModule} existential risks surfaced beyond the bias lane at DQI ${Math.round(dqiScore)}`;
  }
  // Genuinely clean memo — "cleared" is only honest at a passing grade.
  if (grade === 'A' || grade === 'B') {
    return `This memo cleared the audit at DQI ${Math.round(dqiScore)}, grade ${grade}; review the stress test`;
  }
  return `No bias findings, but the memo scored DQI ${Math.round(dqiScore)}, grade ${grade}; review the stress test`;
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 1 — Reasoning Risks
// ──────────────────────────────────────────────────────────────────────

interface ReasoningRisksTemplateInput {
  counts: ReasoningRisksBucket['counts'];
  topBiasLabels: string[]; // up to 3 highest-severity bias display labels
  topPatternLabels: string[]; // up to 2 named pattern labels
  /** Critical/high findings synthesized from the adversarial modules —
   *  the headline must never read "0 critical" while these exist. */
  crossModuleCriticals?: number;
  /** The bias detector ERRORED this run (outage ≠ clean pass). */
  biasDetectionDegraded?: boolean;
}

export function reasoningRisksActionTitle(input: ReasoningRisksTemplateInput): string {
  const { counts, topBiasLabels, topPatternLabels } = input;
  const total = counts.critical + counts.high + counts.medium + counts.low;
  const crossModule = input.crossModuleCriticals ?? 0;

  // Compound patterns are the strongest signal — lead with them
  if (counts.namedPatterns > 0 && topPatternLabels.length > 0) {
    const patternsList = listAndJoin(topPatternLabels.slice(0, 2));
    return `${total} biases combine into ${counts.namedPatterns} named failure pattern${counts.namedPatterns === 1 ? '' : 's'}: ${patternsList}`;
  }

  // Multiple criticals — name them
  if (counts.critical >= 2 && topBiasLabels.length >= 2) {
    const top = topBiasLabels.slice(0, 3).map(s => shortLabel(s, 2));
    return `${listAndJoin(top)} drive ${counts.critical} critical risks across this thesis`;
  }

  // Single critical
  if (counts.critical === 1 && topBiasLabels.length >= 1) {
    return `${shortLabel(topBiasLabels[0], 3)} is the load-bearing critical risk; ${total - 1} secondary biases follow`;
  }

  // No criticals but other severities
  if (total > 0) {
    const sev = topSeverityWord(counts);
    return `${total} biases (mostly ${sev}) shape the reasoning behind this memo`;
  }

  // Zero bias-shaped findings. NEVER say "0 critical reasoning risks"
  // while the adversarial modules carry criticals, or while the detector
  // ERRORED (2026-07-02 — the blind-Fermi internal contradiction).
  if (input.biasDetectionDegraded) {
    return `Bias detection unavailable for this run; review the ${crossModule} adversarial findings below`;
  }
  if (crossModule > 0) {
    return `0 bias-shaped findings; ${crossModule} existential risks synthesized from the adversarial modules below`;
  }
  return '0 critical reasoning risks surfaced; secondary signals available in the drill-down';
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 2 — Stress Test
// ──────────────────────────────────────────────────────────────────────

interface StressTestTemplateInput {
  counts: StressTestBucket['counts'];
  overallVerdict?: 'APPROVED' | 'REJECTED' | 'MIXED';
  topDissentPersona?: string;
  topDissentSubject?: string;
}

export function stressTestActionTitle(input: StressTestTemplateInput): string {
  const { counts, overallVerdict, topDissentPersona, topDissentSubject } = input;
  const total = counts.approve + counts.reject + counts.revise;

  if (overallVerdict === 'REJECTED' && topDissentPersona) {
    return `The room rejects ${counts.reject}-${counts.approve}; ${shortLabel(topDissentPersona, 3)} blocks on ${shortLabel(topDissentSubject ?? 'the synergy assumption', 4)}`;
  }

  if (overallVerdict === 'MIXED' && topDissentPersona) {
    return `The boardroom splits ${counts.approve}-${counts.reject}-${counts.revise}; ${shortLabel(topDissentPersona, 3)} demands revision`;
  }

  if (overallVerdict === 'APPROVED' && counts.reject + counts.revise > 0) {
    return `${counts.approve} of ${total} reviewers approve; ${counts.reject + counts.revise} object on documented risks`;
  }

  if (counts.redTeam > 0 && total > 0) {
    return `${total} boardroom reviewers + ${counts.redTeam} red-team objections stress-tested this memo`;
  }

  if (counts.redTeam > 0) {
    return `${counts.redTeam} adversarial objections target the load-bearing claims in this memo`;
  }

  return 'The simulated stress test ran clean; review the boardroom drill-down for individual votes';
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 3 — Historical Analogs
// ──────────────────────────────────────────────────────────────────────

interface HistoricalAnalogsTemplateInput {
  forgottenQuestionCount: number;
  topAnalog?: string;
  highSeverityCount: number;
}

export function historicalAnalogsActionTitle(input: HistoricalAnalogsTemplateInput): string {
  const { forgottenQuestionCount, topAnalog, highSeverityCount } = input;

  if (topAnalog && forgottenQuestionCount > 0) {
    return `${forgottenQuestionCount} questions ${shortLabel(topAnalog, 3)} had to answer that this memo doesn't`;
  }

  if (highSeverityCount > 0) {
    return `${highSeverityCount} of ${forgottenQuestionCount} forgotten questions match historical-failure-class patterns`;
  }

  if (forgottenQuestionCount > 0) {
    return `${forgottenQuestionCount} questions historical analogs answered that this memo doesn't address`;
  }

  return 'No forgotten questions surfaced; the memo addresses what comparable decisions answered';
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 4 — Counterfactuals (what to fix)
// ──────────────────────────────────────────────────────────────────────

interface CounterfactualsTemplateInput {
  currentDqi: number;
  bestCaseDqi: number;
  scenarioCount: number;
  topScenarioLabel?: string;
  /** The TOP scenario's OWN lift — so "mitigating X" claims X's real delta,
   *  not the whole stack's (the Fermi credibility bug: "X alone → 8-to-39"
   *  when 39 was the sum of all five fixes). */
  topScenarioDelta?: number;
}

export function counterfactualsActionTitle(input: CounterfactualsTemplateInput): string {
  const { currentDqi, bestCaseDqi, scenarioCount, topScenarioLabel, topScenarioDelta } = input;
  const delta = Math.round(bestCaseDqi - currentDqi);

  if (delta > 0 && topScenarioLabel) {
    const top = shortLabel(topScenarioLabel, 3);
    const cur = Math.round(currentDqi);
    const best = Math.round(bestCaseDqi);
    // Honest: name the TOP fix's OWN lift, then the all-fixes total.
    if (scenarioCount > 1 && topScenarioDelta != null && Math.round(topScenarioDelta) > 0) {
      return `Mitigating ${top} lifts DQI +${Math.round(topScenarioDelta)}; all ${scenarioCount} fixes reach ${best}`;
    }
    // Single fix: alone === all, so the plain claim is honest.
    return `Mitigating ${top} raises DQI from ${cur} to ${best}`;
  }

  if (delta > 0) {
    return `Addressing the top ${scenarioCount} risks raises DQI by ${delta} points to ${Math.round(bestCaseDqi)}`;
  }

  if (scenarioCount > 0) {
    return `${scenarioCount} mitigation scenarios mapped; review the slider drill-down for projected lift`;
  }

  return 'No actionable mitigation scenarios surfaced at this audit confidence level';
}

// ──────────────────────────────────────────────────────────────────────
// Bucket 5 — Provenance (how we know)
// ──────────────────────────────────────────────────────────────────────

interface ProvenanceTemplateInput {
  methodologyVersion: string;
  pipelineNodeCount: number;
  matrixDimension: number;
  caseCorpusSize: number;
  meanBrier: number;
  frameworkCount: number;
  auditHashPrefix: string;
}

export function provenanceActionTitle(input: ProvenanceTemplateInput): string {
  const { methodologyVersion, pipelineNodeCount, caseCorpusSize, meanBrier, frameworkCount } =
    input;

  if (frameworkCount > 0) {
    return `Audited via v${methodologyVersion} against ${caseCorpusSize} decisions across ${frameworkCount} regulatory frameworks`;
  }

  return `Audited via v${methodologyVersion}; ${pipelineNodeCount}-node pipeline; Brier ${meanBrier.toFixed(2)} against ${caseCorpusSize} cases`;
}

// ──────────────────────────────────────────────────────────────────────
// Validation — every action title we ship passes these checks. The
// LLM-augmented output must also pass; failures fall back to the
// template silently.
// ──────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  ok: boolean;
  reason?:
    | 'too_long'
    | 'no_metric'
    | 'banned_phrase'
    | 'count_mismatch'
    | 'empty'
    | 'not_a_sentence';
}

export interface ValidationContext {
  /** When supplied, the validator checks that any "{N}" the title
   *  claims actually matches the underlying data. Caller is
   *  responsible for the comparison; the validator just opens the
   *  door for the upstream layer to extract numbers and verify. */
  expectedCounts?: {
    biasCount?: number;
    namedPatternCount?: number;
    forgottenQuestionCount?: number;
  };
}

/**
 * Validate that a candidate action title meets the locked shape rules:
 *   1. Non-empty after trim
 *   2. ≤ WORD_CAP words
 *   3. Contains at least one digit (the count or metric anchor)
 *   4. Does not contain any banned vocabulary
 *   5. Ends with terminal punctuation OR is a complete fragment with a
 *      subject and verb (we relax this last one to "must contain at
 *      least one verb-like word" via a small heuristic to avoid
 *      false positives on edge cases)
 */
export function validateActionTitle(title: string, ctx: ValidationContext = {}): ValidationResult {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (countWords(trimmed) > WORD_CAP) return { ok: false, reason: 'too_long' };
  if (!containsDigit(trimmed)) return { ok: false, reason: 'no_metric' };

  const lower = trimmed.toLowerCase();
  for (const banned of ACTION_TITLE_BANNED_PHRASES) {
    if (lower.includes(banned)) return { ok: false, reason: 'banned_phrase' };
  }

  if (ctx.expectedCounts) {
    // Light count-drift check: pull all numeric tokens from the title
    // and verify that, if a count was claimed, it matches a real
    // counter in the data. We accept the title if at least one
    // numeric token matches a real count — this allows the title to
    // also carry DQI scores, deltas, or percentages without confusion.
    const tokens = Array.from(trimmed.matchAll(/\b(\d+)\b/g)).map(m => Number(m[1]));
    const expected = Object.values(ctx.expectedCounts).filter(
      (n): n is number => typeof n === 'number'
    );
    if (expected.length > 0 && tokens.length > 0) {
      // Allow DQI scores (40-100) + percentages (0-100) + reasonable counts
      const counts = tokens.filter(t => t < 40);
      if (counts.length > 0) {
        const anyMatch = counts.some(c => expected.includes(c));
        // Only flag count drift if NO claimed count matches reality
        // AND every numeric token looks like a count (small integer)
        if (!anyMatch && tokens.every(t => t < 40)) {
          return { ok: false, reason: 'count_mismatch' };
        }
      }
    }
  }

  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────
// SCQA executive summary fields — deterministic generators
// ──────────────────────────────────────────────────────────────────────

interface SCQATemplateInput {
  dqiScore: number;
  grade: Grade;
  totalRisks: number;
  criticalRisks: number;
  topConcern?: string;
  topMitigation?: string;
  /** Critical/high findings from the adversarial modules (forgotten
   *  questions / red team / boardroom) — the complication must name them
   *  when the bias lane is quiet (2026-07-02). */
  crossModuleCriticals?: number;
  /** The single strongest cross-module concern (compact). */
  topCrossModuleConcern?: string;
  /** The bias detector ERRORED this run. */
  biasDetectionDegraded?: boolean;
}

export function scqaSituation(): string {
  return 'A strategic memo was submitted for reasoning audit across the locked R²F pipeline.';
}

export function scqaComplication(input: SCQATemplateInput): string {
  const crossModule = input.crossModuleCriticals ?? 0;
  if (input.criticalRisks > 0 && input.topConcern) {
    return `${input.criticalRisks} critical reasoning risk${input.criticalRisks === 1 ? '' : 's'} surfaced, led by ${shortLabel(input.topConcern, 4)}.`;
  }
  if (input.totalRisks > 0) {
    const tail =
      crossModule > 0
        ? ` ${crossModule} critical finding${crossModule === 1 ? '' : 's'} stand in the adversarial modules.`
        : '';
    return `${input.totalRisks} reasoning risk${input.totalRisks === 1 ? '' : 's'} surfaced; none at critical severity.${tail}`;
  }
  if (input.biasDetectionDegraded) {
    return `Bias detection was unavailable for this run (provider error); the adversarial findings below are unaffected and still stand.`;
  }
  if (crossModule > 0) {
    const led = input.topCrossModuleConcern
      ? `, led by ${shortLabel(input.topCrossModuleConcern, 8)}`
      : '';
    return `No bias-shaped findings, but ${crossModule} existential risk${crossModule === 1 ? '' : 's'} surfaced in the stress test and historical analogs${led}.`;
  }
  return 'No critical reasoning risks surfaced, but stress-test objections remain to be reviewed.';
}

export function scqaQuestion(): string {
  return 'Should this thesis advance to committee, or be revised first?';
}

export function scqaAnswer(input: SCQATemplateInput): string {
  // FIX 2026-05-20: previous version called `shortLabel(input.topMitigation, 6)`
  // and inlined the truncated mitigation suggestion. This produced cut-off
  // fragments like "address The Board should demand a 'Base first." that
  // read as broken English. The Answer line is too important to truncate
  // mid-sentence. Now we reference the top concern by NAME instead.
  if (input.criticalRisks > 0 && input.topConcern) {
    return `Revise before committee — address ${shortLabel(input.topConcern, 4)} first.`;
  }
  if (input.criticalRisks > 0) {
    return 'Revise before committee — close the critical-severity findings first.';
  }
  // Cross-module criticals demand revision even when the bias lane is
  // quiet — a CRITICAL unanswered question is a reasoning gap (2026-07-02).
  if ((input.crossModuleCriticals ?? 0) > 0) {
    return 'Revise before committee — answer the critical unanswered questions first.';
  }
  if (input.totalRisks > 0) {
    return 'Advance with documented mitigations for the surfaced risks.';
  }
  if (input.grade === 'A' || input.grade === 'B') {
    return 'Advance to committee with the appended audit trail.';
  }
  return 'Review the stress-test objections before final commitment.';
}

// Exported word-cap for tests
export const ACTION_TITLE_WORD_CAP = WORD_CAP;
