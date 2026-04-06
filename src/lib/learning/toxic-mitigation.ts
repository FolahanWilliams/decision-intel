/**
 * Toxic Combination Mitigation Playbook Engine
 *
 * Generates specific, actionable debiasing steps for detected toxic combinations.
 * Each named pattern has a curated multi-step playbook informed by behavioral
 * economics research (Kahneman, Sunstein, Thaler, Klein).
 *
 * Deterministic — no LLM call needed. Rules are pattern + context factor driven.
 */

export interface MitigationStep {
  /** Short imperative title */
  title: string;
  /** Detailed how-to description */
  description: string;
  /** Who should own this step */
  owner: 'facilitator' | 'team_lead' | 'analyst' | 'all_participants' | 'external';
  /** Time to implement: 'immediate' | 'before_next_meeting' | 'ongoing' */
  timing: 'immediate' | 'before_next_meeting' | 'ongoing';
  /** Priority level */
  priority: 'critical' | 'high' | 'medium';
}

export interface MitigationPlaybook {
  patternLabel: string;
  summary: string;
  steps: MitigationStep[];
  researchBasis: string;
}

// ─── Pattern-Specific Playbooks ────────────────────────────────────────────

const PATTERN_PLAYBOOKS: Record<string, Omit<MitigationPlaybook, 'patternLabel'>> = {
  'The Echo Chamber': {
    summary:
      'Break the self-reinforcing loop by injecting structured dissent and anonymizing initial positions.',
    steps: [
      {
        title: "Appoint a formal Devil's Advocate",
        description:
          'Designate one team member (rotating each meeting) whose explicit job is to argue the opposing case. Give them 10 minutes of uninterrupted time to present the strongest bear case.',
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Collect blind written priors before discussion',
        description:
          "Before any verbal discussion, have each participant write their position and confidence level independently. Use Decision Intel's Blind Prior feature in Decision Rooms to prevent anchoring on the first speaker.",
        owner: 'all_participants',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Present the bear case first',
        description:
          'Structure the meeting to present risks, red flags, and reasons NOT to proceed before discussing the opportunity. This counteracts the natural tendency to lead with enthusiasm.',
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'high',
      },
      {
        title: 'Require a pre-mortem exercise',
        description:
          'Ask the team: "Imagine it\'s 18 months from now and this decision failed catastrophically. Write down the three most likely reasons why." Compare answers to identify blind spots.',
        owner: 'all_participants',
        timing: 'before_next_meeting',
        priority: 'high',
      },
    ],
    researchBasis:
      'Kahneman & Tversky (1974) on anchoring; Janis (1972) on groupthink prevention; Klein (1998) on pre-mortem technique.',
  },

  'The Sunk Ship': {
    summary:
      'De-anchor from prior investment by reframing the decision as a fresh allocation choice.',
    steps: [
      {
        title: 'Apply the "Clean Slate" test',
        description:
          'Ask: "If we had NOT already invested $X, would we invest today at this valuation with what we know now?" If the answer is no, the sunk cost is driving the decision.',
        owner: 'team_lead',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Separate the investment review from the author',
        description:
          'Have someone who was NOT involved in the original deal evaluate the follow-on. Original deal champions have anchoring bias on their initial thesis.',
        owner: 'facilitator',
        timing: 'before_next_meeting',
        priority: 'critical',
      },
      {
        title: 'Quantify the opportunity cost',
        description:
          'Calculate what the follow-on capital could return if deployed to the best alternative opportunity in the pipeline. Make the comparison explicit.',
        owner: 'analyst',
        timing: 'before_next_meeting',
        priority: 'high',
      },
      {
        title: 'Set a hard "kill threshold" in advance',
        description:
          'Before reviewing the investment, define specific metrics that would trigger an automatic exit. Write them down and commit before seeing the data.',
        owner: 'team_lead',
        timing: 'immediate',
        priority: 'high',
      },
    ],
    researchBasis:
      'Arkes & Blumer (1985) on sunk cost; Kahneman (2011) on reference-dependent evaluation; Thaler (1980) on mental accounting.',
  },

  'The Blind Sprint': {
    summary:
      'Slow down the decision process to counteract availability-driven urgency and overconfidence.',
    steps: [
      {
        title: 'Implement a mandatory 24-hour cooling-off period',
        description:
          'No final decisions on the same day as the initial discussion. Sleep on it. Fast-twitch decisions under time pressure are precisely where availability bias is strongest.',
        owner: 'team_lead',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Challenge the deadline legitimacy',
        description:
          'Ask: "Is this deadline real or self-imposed? What actually happens if we take 48 more hours?" Often the urgency is manufactured or negotiable.',
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'high',
      },
      {
        title: 'Assign a base-rate researcher',
        description:
          'Have one analyst look up the base rate: "Of deals/decisions like this, how often do they succeed?" This counteracts the availability of the vivid current case.',
        owner: 'analyst',
        timing: 'immediate',
        priority: 'high',
      },
      {
        title: 'Confidence calibration check',
        description:
          "Ask each participant to estimate their confidence level and write down what would make them LESS confident. If nobody can articulate a scenario where they're wrong, overconfidence is in play.",
        owner: 'all_participants',
        timing: 'immediate',
        priority: 'medium',
      },
    ],
    researchBasis:
      'Tversky & Kahneman (1973) on availability heuristic; Lichtenstein et al. (1982) on overconfidence calibration.',
  },

  'The Yes Committee': {
    summary: 'Neutralize authority dominance by structuring the decision to elevate junior voices.',
    steps: [
      {
        title: 'Reverse the speaking order',
        description:
          "Have the most junior people speak first, working up to seniors. This prevents anchoring on the authority figure's position. The MD or Partner speaks last.",
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Use anonymous voting for the final decision',
        description:
          "Collect votes via Decision Intel's Blind Prior feature. If the anonymous result differs significantly from the verbal consensus, investigate the gap.",
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Assign a "Red Team" from outside the deal team',
        description:
          'Bring in 1-2 people who have no stake in the outcome to challenge the thesis. External perspective breaks the authority-compliance loop.',
        owner: 'team_lead',
        timing: 'before_next_meeting',
        priority: 'high',
      },
    ],
    researchBasis:
      'Milgram (1963) on authority obedience; Sunstein & Hastie (2015) on group decision amplification.',
  },

  'The Optimism Trap': {
    summary: 'Counter selective evidence gathering by mandating disconfirming evidence search.',
    steps: [
      {
        title: 'Mandate a "Reasons to Pass" memo',
        description:
          'Before the IC meeting, require a formal one-pager documenting the strongest 3-5 reasons NOT to invest. This must be presented alongside the deal memo.',
        owner: 'analyst',
        timing: 'before_next_meeting',
        priority: 'critical',
      },
      {
        title: 'Apply reference class forecasting',
        description:
          "Look up outcomes for similar deals (same sector, size, stage) from the past 5 years. What percentage succeeded? Use this as the baseline, not the team's gut feeling.",
        owner: 'analyst',
        timing: 'before_next_meeting',
        priority: 'high',
      },
      {
        title: 'Ask "What would change your mind?"',
        description:
          'Have each supporter explicitly state the evidence that would flip their position to a "pass." If they can\'t articulate it, their conviction isn\'t grounded in evidence.',
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'high',
      },
    ],
    researchBasis:
      'Kahneman & Lovallo (1993) on planning fallacy; Tetlock (2005) on forecasting accuracy.',
  },

  'The Status Quo Lock': {
    summary:
      'Force active choice by making the default explicit and requiring justification for inaction.',
    steps: [
      {
        title: 'Explicitly name the status quo and its costs',
        description:
          'Frame inaction as a decision with costs: "Continuing current course means X risk, Y opportunity cost, Z competitive exposure." Make the default feel like a choice, not a non-event.',
        owner: 'analyst',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Require equal rigor for "do nothing" as for "do something"',
        description:
          'If the team is evaluating an investment, require the same depth of analysis for the "pass" option. What are the risks of NOT acting?',
        owner: 'facilitator',
        timing: 'before_next_meeting',
        priority: 'high',
      },
      {
        title: 'Set a review trigger date',
        description:
          'If choosing to maintain status quo, set a specific future date to re-evaluate. Open-ended "we\'ll revisit later" means it never gets revisited.',
        owner: 'team_lead',
        timing: 'immediate',
        priority: 'medium',
      },
    ],
    researchBasis:
      'Samuelson & Zeckhauser (1988) on status quo bias; Thaler & Sunstein (2008) on choice architecture.',
  },

  'The Recency Spiral': {
    summary: 'Anchor on long-term base rates instead of recent vivid events.',
    steps: [
      {
        title: 'Present 5-year and 10-year data alongside recent performance',
        description:
          'Physically display the long-term trend next to the recent data. Recency bias shrinks when the broader pattern is visible.',
        owner: 'analyst',
        timing: 'before_next_meeting',
        priority: 'critical',
      },
      {
        title: 'Ask "Would we make this decision if last quarter looked different?"',
        description:
          "Replace the recent data point with the 5-year average and re-evaluate. If the decision changes, you're anchored on recency.",
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'high',
      },
      {
        title: 'Separate data gathering from decision-making',
        description:
          'Have the analysis prepared days before the decision meeting. This creates temporal distance from the most recent data point and reduces its emotional salience.',
        owner: 'team_lead',
        timing: 'before_next_meeting',
        priority: 'medium',
      },
    ],
    researchBasis:
      'Tversky & Kahneman (1973) on availability; Taleb (2007) on narrative fallacy from recent events.',
  },

  'The Golden Child': {
    summary:
      'Strip the prestige effect by evaluating the opportunity blind to brand, founder reputation, or social proof.',
    steps: [
      {
        title: 'Conduct a "brand-blind" evaluation',
        description:
          'Replace the company/founder name with "Company X" in the deal memo and evaluate the fundamentals. Would you invest in this anonymous opportunity at this price?',
        owner: 'analyst',
        timing: 'before_next_meeting',
        priority: 'critical',
      },
      {
        title: 'Stress-test the thesis against comparable failures',
        description:
          'Find 2-3 cases where similarly prestigious/hyped companies failed. Present these as case studies to puncture the invincibility narrative.',
        owner: 'analyst',
        timing: 'before_next_meeting',
        priority: 'high',
      },
      {
        title: 'Separate due diligence from the pitch',
        description:
          "Don't let the founder's charisma influence the DD process. Have a separate team conduct reference checks and financial analysis independently of the pitch meeting.",
        owner: 'team_lead',
        timing: 'before_next_meeting',
        priority: 'high',
      },
    ],
    researchBasis:
      'Thorndike (1920) on halo effect; Nisbett & Wilson (1977) on attribution errors.',
  },

  'The Doubling Down': {
    summary:
      'Break the escalation of commitment cycle with predefined exit rules and external accountability.',
    steps: [
      {
        title: 'Enforce predefined stop-loss rules',
        description:
          'Before the investment, define specific metrics that trigger an automatic exit or write-down review. Write them down, sign them, and hold the team accountable.',
        owner: 'team_lead',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Bring in a fresh evaluator with no prior commitment',
        description:
          'Have someone who was NOT on the original deal team evaluate whether to continue. They have no psychological ownership of the original thesis.',
        owner: 'facilitator',
        timing: 'before_next_meeting',
        priority: 'critical',
      },
      {
        title: 'Calculate the "reversal cost" explicitly',
        description:
          'Quantify what it costs to exit NOW vs. the expected cost of continuing and failing. Make the comparison numerical, not emotional.',
        owner: 'analyst',
        timing: 'immediate',
        priority: 'high',
      },
    ],
    researchBasis:
      'Staw (1976) on escalation of commitment; Brockner (1992) on entrapment; Kahneman (2011) on loss aversion.',
  },

  'The Deadline Panic': {
    summary: 'Separate genuine urgency from psychological pressure to achieve closure.',
    steps: [
      {
        title: 'Audit the deadline source',
        description:
          'Ask: "Who set this deadline and why? Is it contractual, competitive, or self-imposed?" Most perceived urgency is either negotiable or manufactured.',
        owner: 'team_lead',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Define "minimum viable decision"',
        description:
          'Identify what can be decided now vs. what can be deferred. Often a partial commitment buys time without losing the opportunity.',
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'high',
      },
      {
        title: 'Build in a "trip wire" review',
        description:
          'If proceeding under time pressure, define specific trigger points (30, 60, 90 days) for mandatory review. This prevents rushed decisions from becoming permanent commitments.',
        owner: 'team_lead',
        timing: 'immediate',
        priority: 'high',
      },
    ],
    researchBasis:
      'Zeigarnik (1927) on task completion pressure; Buehler et al. (1994) on planning fallacy.',
  },
};

// ─── Context-Aware Step Augmentation ───────────────────────────────────────

interface ContextFactorsForMitigation {
  monetaryStakes?: string;
  dissentAbsent?: boolean;
  timePressure?: boolean;
  unanimousConsensus?: boolean;
  participantCount?: number;
}

function getContextAugmentations(context: ContextFactorsForMitigation): MitigationStep[] {
  const extra: MitigationStep[] = [];

  if (context.monetaryStakes === 'very_high') {
    extra.push({
      title: 'Escalate to board-level review',
      description:
        'Given the very high monetary stakes, this decision warrants board or senior advisory review. The cost of a bad decision at this scale justifies the additional process.',
      owner: 'team_lead',
      timing: 'before_next_meeting',
      priority: 'critical',
    });
  }

  if (context.participantCount !== undefined && context.participantCount < 3) {
    extra.push({
      title: 'Expand the decision group',
      description: `Only ${context.participantCount} participant(s) involved. Add 2-3 additional perspectives, ideally from different functions or seniority levels, to reduce group-size risk.`,
      owner: 'team_lead',
      timing: 'before_next_meeting',
      priority: 'high',
    });
  }

  if (context.unanimousConsensus && context.dissentAbsent) {
    extra.push({
      title: 'Invoke the "Unanimity Warning"',
      description:
        'When everyone agrees and no dissent exists, treat it as a red flag, not a green light. Unanimous consensus on complex decisions usually signals information suppression, not genuine alignment.',
      owner: 'facilitator',
      timing: 'immediate',
      priority: 'critical',
    });
  }

  return extra;
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Generate a mitigation playbook for a toxic combination.
 *
 * Uses the named pattern label to look up curated steps, then augments
 * with context-specific recommendations based on decision metadata.
 *
 * For unnamed/ad-hoc combinations, generates generic but still actionable steps
 * based on the constituent bias types and context factors.
 */
export function generateMitigationPlaybook(
  patternLabel: string | null,
  biasTypes: string[],
  contextFactors?: ContextFactorsForMitigation
): MitigationPlaybook {
  // Try named pattern first
  if (patternLabel && PATTERN_PLAYBOOKS[patternLabel]) {
    const playbook = PATTERN_PLAYBOOKS[patternLabel];
    const contextSteps = contextFactors ? getContextAugmentations(contextFactors) : [];

    return {
      patternLabel,
      summary: playbook.summary,
      steps: [...playbook.steps, ...contextSteps],
      researchBasis: playbook.researchBasis,
    };
  }

  // Fallback: generate generic playbook for unnamed combinations
  const biasLabels = biasTypes.map(b => b.replace(/_/g, ' ')).join(' + ');
  const contextSteps = contextFactors ? getContextAugmentations(contextFactors) : [];

  return {
    patternLabel: patternLabel || `Compound Risk: ${biasLabels}`,
    summary: `Multiple interacting biases detected (${biasLabels}). Apply structured debiasing to prevent compound decision risk.`,
    steps: [
      {
        title: 'Collect independent written assessments',
        description:
          'Before any group discussion, have each participant write their position and reasoning independently. Compare for convergence and divergence.',
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'critical',
      },
      {
        title: 'Assign a dedicated counter-argument presenter',
        description:
          'One team member should prepare and present the strongest case AGAINST the proposed decision. Allocate at least 15 minutes for this.',
        owner: 'facilitator',
        timing: 'immediate',
        priority: 'high',
      },
      {
        title: 'Review base rates for similar decisions',
        description:
          'Look up historical outcomes for comparable decisions in your organization and industry. Ground the discussion in data, not intuition.',
        owner: 'analyst',
        timing: 'before_next_meeting',
        priority: 'high',
      },
      ...contextSteps,
    ],
    researchBasis:
      'Kahneman, Sibony & Sunstein (2021) on decision hygiene; Larrick (2004) on debiasing strategies.',
  };
}
