/**
 * Client-Side Bias Scanner
 *
 * Lightweight regex-based cognitive bias detection that runs entirely in the
 * browser. Used by the interactive demo to give visitors REAL results on their
 * own text, and mirrors the patterns used by the Slack real-time detector.
 *
 * This module has ZERO server-side imports — safe for 'use client' components.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DetectedBias {
  biasType: string;
  label: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  signal: string;
  excerpt: string;
  explanation: string;
  suggestion: string;
}

export interface ScanResult {
  biases: DetectedBias[];
  biasCount: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'clear';
  isPreDecision: boolean;
  summary: string;
}

// ─── Bias Pattern Definitions ───────────────────────────────────────────────

interface BiasDefinition {
  type: string;
  label: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  patterns: RegExp[];
  explanation: string;
  suggestion: string;
}

const BIAS_DEFINITIONS: BiasDefinition[] = [
  // === Original 6 (matching Slack handler) ===
  {
    type: 'anchoring',
    label: 'Anchoring Bias',
    severity: 'high',
    patterns: [
      /\binitial\s+offer\b/i,
      /\bstarting\s+point\b/i,
      /\bfirst\s+(price|number|quote|estimate|figure)\b/i,
      /\boriginal(ly)?\s+(price|cost|estimate|quote)\b/i,
      /\bbased\s+on\s+(the|their)\s+(initial|original|first)\b/i,
    ],
    explanation:
      'Over-reliance on the first piece of information encountered as a reference point, skewing subsequent judgments.',
    suggestion:
      "Conduct an independent assessment from scratch without reference to the initial anchor. What would a fair value look like if you hadn't seen the first number?",
  },
  {
    type: 'confirmation_bias',
    label: 'Confirmation Bias',
    severity: 'high',
    patterns: [
      /\bconfirms?\s+what\s+(I|we)\s+thought\b/i,
      /\bas\s+expected\b/i,
      /\bjust\s+as\s+(I|we)\s+predicted\b/i,
      /\bknew\s+it\b/i,
      /\btold\s+you\s+so\b/i,
      /\ball\s+(the\s+)?(data|evidence|research)\s+(supports?|confirms?|validates?)\b/i,
    ],
    explanation:
      'Selectively interpreting or seeking information that confirms pre-existing beliefs while ignoring contradictory evidence.',
    suggestion:
      'Actively seek disconfirming evidence. For every supporting data point, find the strongest counterargument.',
  },
  {
    type: 'sunk_cost',
    label: 'Sunk Cost Fallacy',
    severity: 'high',
    patterns: [
      /\balready\s+invested\b/i,
      /\btoo\s+far\s+in\b/i,
      /\bcan'?t\s+stop\s+now\b/i,
      /\balready\s+spent\b/i,
      /\bcome\s+this\s+far\b/i,
      /\btoo\s+much\s+(time|money|effort)\s+(into|on)\b/i,
    ],
    explanation:
      'Continuing a course of action because of previously invested resources (time, money, effort) rather than future value.',
    suggestion:
      'Reframe as a clean-sheet decision: "If we were starting fresh today with no prior investment, would we still choose this?"',
  },
  {
    type: 'groupthink',
    label: 'Groupthink',
    severity: 'critical',
    patterns: [
      /\beveryone\s+agrees?\b/i,
      /\bno\s+objections?\b/i,
      /\bunanimous(ly)?\b/i,
      /\bwe\s+all\s+think\b/i,
      /\bnobody\s+disagrees?\b/i,
      /\bwe'?re\s+all\s+(on\s+the\s+same\s+page|aligned)\b/i,
    ],
    explanation:
      'Desire for group harmony suppresses dissenting opinions and critical evaluation. Unanimous agreement on major decisions is a red flag.',
    suggestion:
      "Assign a formal devil's advocate with equal presentation time. Require documented dissenting opinions before any final vote.",
  },
  {
    type: 'availability_bias',
    label: 'Availability Bias',
    severity: 'medium',
    patterns: [
      /\blast\s+time\s+this\s+happened\b/i,
      /\bremember\s+when\b/i,
      /\bjust\s+saw\b/i,
      /\bjust\s+(read|heard)\s+about\b/i,
      /\bhappened\s+(to\s+us|before)\b/i,
    ],
    explanation:
      'Overweighting information that comes to mind easily (recent, vivid, or emotionally charged events) over base-rate data.',
    suggestion:
      'Check base-rate data for this type of situation. Recent dramatic events may not be representative of typical outcomes.',
  },
  {
    type: 'overconfidence',
    label: 'Overconfidence Bias',
    severity: 'high',
    patterns: [
      /\bguaranteed\b/i,
      /\b100\s*%\b/i,
      /\bno\s+way\s+this\s+fails\b/i,
      /\bslam\s+dunk\b/i,
      /\bno[- ]brainer\b/i,
      /\bsure\s+thing\b/i,
      /\bcannot?\s+lose\b/i,
      /\bcan'?t\s+go\s+wrong\b/i,
    ],
    explanation:
      'Excessive certainty in predictions or judgments without acknowledging uncertainty, risk, or alternative outcomes.',
    suggestion:
      'Consider: what would need to be true for this to fail? Assign probability ranges instead of point estimates.',
  },

  // === 8 New Bias Types ===
  {
    type: 'bandwagon',
    label: 'Bandwagon Effect',
    severity: 'medium',
    patterns: [
      /\beveryone\s+is\s+doing\b/i,
      /\bindustry\s+standard\b/i,
      /\bbest\s+practice\b/i,
      /\bmarket\s+(consensus|trend)\b/i,
      /\bcompetitors?\s+(are|all)\s+(doing|using|adopting)\b/i,
    ],
    explanation:
      'Adopting a position because it is popular rather than because it is optimal for your specific context and constraints.',
    suggestion:
      'Is this the right approach for YOUR specific situation, or just the popular one? Evaluate on first principles.',
  },
  {
    type: 'authority_bias',
    label: 'Authority Bias',
    severity: 'medium',
    patterns: [
      /\bthe\s+(CEO|CTO|CFO|board|director|VP|president)\s+(said|thinks|believes|wants)\b/i,
      /\bexperts?\s+agree\b/i,
      /\bboard\s+approved\b/i,
      /\b(McKinsey|Gartner|Deloitte|Goldman)\s+(says?|recommends?|found)\b/i,
      /\baccording\s+to\s+(the\s+)?(experts?|authorities?|leadership)\b/i,
    ],
    explanation:
      'Placing excessive weight on the opinion of an authority figure rather than independently evaluating the evidence.',
    suggestion:
      'Has this claim been independently validated? Authority figures can be wrong — evaluate the evidence on its own merits.',
  },
  {
    type: 'recency_bias',
    label: 'Recency Bias',
    severity: 'medium',
    patterns: [
      /\b(latest|most\s+recent)\s+(data|numbers|results|quarter)\b/i,
      /\brecent\s+trends?\s+(show|suggest|indicate)\b/i,
      /\bjust\s+(last|this)\s+(week|month|quarter)\b/i,
      /\bthis\s+quarter'?s?\s+(results?|performance)\b/i,
    ],
    explanation:
      'Giving disproportionate weight to recent events over long-term patterns and historical base rates.',
    suggestion:
      'Zoom out to a longer time horizon. How does this look over 3-5 years, not just the most recent quarter?',
  },
  {
    type: 'survivorship_bias',
    label: 'Survivorship Bias',
    severity: 'high',
    patterns: [
      /\bsuccessful\s+companies\s+(do|all|have)\b/i,
      /\btop\s+performers?\s+(all|do|have)\b/i,
      /\bwinners?\s+(all|do|have)\b/i,
      /\blike\s+(Apple|Google|Amazon|Tesla)\b/i,
      /\bjust\s+like\s+\w+\s+(did|does)\b/i,
    ],
    explanation:
      'Drawing conclusions only from survivors/successes while ignoring the much larger number of failures that followed the same approach.',
    suggestion:
      'What about companies that tried this exact approach and failed? Seek out failure case studies, not just success stories.',
  },
  {
    type: 'status_quo_bias',
    label: 'Status Quo Bias',
    severity: 'medium',
    patterns: [
      /\bwe'?ve\s+always\s+(done|used)\b/i,
      /\btradition(ally)?\b/i,
      /\bif\s+it\s+ain'?t\s+broke\b/i,
      /\bwhy\s+(change|fix)\s+(what|something)\b/i,
      /\bthe\s+way\s+we'?ve\s+always\b/i,
      /\bdon'?t\s+rock\s+the\s+boat\b/i,
    ],
    explanation:
      'Preferring the current state of affairs simply because it is familiar, even when change would produce better outcomes.',
    suggestion:
      'Is staying the course truly optimal, or just comfortable? Evaluate the status quo with the same rigor as any new proposal.',
  },
  {
    type: 'framing_effect',
    label: 'Framing Effect',
    severity: 'medium',
    patterns: [
      /\bonly\s+\d+\s*%/i,
      /\bas\s+much\s+as\s+\d+/i,
      /\bjust\s+\$?\d/i,
      /\ba\s+mere\s+\$?\d/i,
      /\b(small|tiny|minimal)\s+(investment|cost|risk|price)\b/i,
    ],
    explanation:
      'The way information is presented (framed) influences the decision disproportionately. "Only 10% risk" vs "1 in 10 will fail" trigger different responses despite being identical.',
    suggestion:
      'Reframe the same data differently. How would this look expressed as a loss instead of a gain, or as an absolute number instead of a percentage?',
  },
  {
    type: 'planning_fallacy',
    label: 'Planning Fallacy',
    severity: 'high',
    patterns: [
      /\bshould\s+only\s+take\b/i,
      /\beasily\s+(achievable|doable|done)\b/i,
      /\bno\s+problem\b/i,
      /\bstraightforward\b/i,
      /\bsimple\s+(matter|task|project)\b/i,
      /\bwe'?ll\s+(easily|quickly|definitely)\b/i,
      /\bwon'?t\s+take\s+long\b/i,
    ],
    explanation:
      'Systematically underestimating time, cost, and risk while overestimating benefits. Even experts fall prey to this on novel projects.',
    suggestion:
      'Check base rates: how long did similar projects actually take? Use reference class forecasting instead of inside-view planning.',
  },
  {
    type: 'hindsight_bias',
    label: 'Hindsight Bias',
    severity: 'low',
    patterns: [
      /\bI\s+knew\s+it\b/i,
      /\bobvious\s+in\s+retrospect\b/i,
      /\bpredictable\b/i,
      /\bshould\s+have\s+(seen|known)\b/i,
      /\bcould\s+have\s+predicted\b/i,
      /\bit\s+was\s+(clear|obvious)\s+(all\s+along|from\s+the\s+start)\b/i,
    ],
    explanation:
      'Believing, after an event has occurred, that the outcome was predictable beforehand. This distorts future risk assessment.',
    suggestion:
      'Was this really predictable in advance, or does it just feel that way now? Review what information was actually available at decision time.',
  },
];

// ─── Pre-Decision Signal Detection ──────────────────────────────────────────

const PRE_DECISION_SIGNALS = [
  /\bshould\s+we\b/i,
  /\bthinking\s+about\b/i,
  /\bconsidering\b/i,
  /\bwhat\s+if\s+we\b/i,
  /\bdebating\s+whether\b/i,
  /\bproposal\s+to\b/i,
  /\boptions\s+are\b/i,
  /\bweighing\s+up\b/i,
  /\bdo\s+we\s+go\s+with\b/i,
  /\bleaning\s+towards?\b/i,
  /\brecommendation\s+is\b/i,
];

// ─── Scanner ────────────────────────────────────────────────────────────────

function getExcerpt(text: string, match: RegExpMatchArray, contextChars = 60): string {
  const idx = match.index ?? 0;
  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + match[0].length + contextChars);
  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = '...' + excerpt;
  if (end < text.length) excerpt = excerpt + '...';
  return excerpt;
}

/**
 * Scan text for cognitive biases using regex pattern matching.
 * Returns all detected biases with explanations and actionable suggestions.
 */
export function scanForBiases(text: string): ScanResult {
  if (!text || text.trim().length < 15) {
    return {
      biases: [],
      biasCount: 0,
      riskLevel: 'clear',
      isPreDecision: false,
      summary: 'Text too short for meaningful analysis.',
    };
  }

  const detected: DetectedBias[] = [];

  for (const def of BIAS_DEFINITIONS) {
    for (const pattern of def.patterns) {
      const match = text.match(pattern);
      if (match) {
        detected.push({
          biasType: def.type,
          label: def.label,
          severity: def.severity,
          signal: match[0],
          excerpt: getExcerpt(text, match),
          explanation: def.explanation,
          suggestion: def.suggestion,
        });
        break; // One match per bias type is sufficient
      }
    }
  }

  const isPreDecision = PRE_DECISION_SIGNALS.some(p => p.test(text));

  const criticalCount = detected.filter(b => b.severity === 'critical').length;
  const highCount = detected.filter(b => b.severity === 'high').length;

  let riskLevel: ScanResult['riskLevel'];
  if (criticalCount > 0 || highCount >= 3) riskLevel = 'critical';
  else if (highCount >= 2 || detected.length >= 4) riskLevel = 'high';
  else if (detected.length >= 2) riskLevel = 'medium';
  else if (detected.length === 1) riskLevel = 'low';
  else riskLevel = 'clear';

  let summary: string;
  if (detected.length === 0) {
    summary =
      'No common cognitive biases detected in this text. The full analysis also checks for logical fallacies, decision noise, compliance, and runs a boardroom simulation.';
  } else if (riskLevel === 'critical') {
    summary = `Critical risk: ${detected.length} cognitive bias${detected.length > 1 ? 'es' : ''} detected, including ${criticalCount > 0 ? 'critical-severity' : 'multiple high-severity'} patterns. This text warrants careful review before committing to a decision.`;
  } else if (riskLevel === 'high') {
    summary = `High risk: ${detected.length} cognitive bias${detected.length > 1 ? 'es' : ''} detected with significant severity. Consider addressing the flagged patterns before finalizing.`;
  } else {
    summary = `${detected.length} cognitive bias signal${detected.length > 1 ? 's' : ''} detected. Review the flagged excerpts and consider the suggested mitigations.`;
  }

  return {
    biases: detected,
    biasCount: detected.length,
    riskLevel,
    isPreDecision,
    summary,
  };
}

/** All bias types available for display in UI */
export const AVAILABLE_BIAS_TYPES = BIAS_DEFINITIONS.map(d => ({
  type: d.type,
  label: d.label,
  severity: d.severity,
}));
