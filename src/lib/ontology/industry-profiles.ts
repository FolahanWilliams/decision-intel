/**
 * Industry-Specific Bias Profiles
 *
 * Different industries have unique cognitive bias patterns that go beyond
 * the core 16 biases. These profiles add domain-specific biases with
 * detection prompts, risk multipliers, and regulatory context.
 */

export interface IndustryBias {
  id: string;
  name: string;
  description: string;
  parentBias: string;
  industrySpecific: true;
  detectionPrompt: string;
  exampleScenario: string;
  riskMultiplier: number;
}

export interface IndustryProfile {
  industry: string;
  displayName: string;
  additionalBiases: IndustryBias[];
  highRiskCombinations: Array<{ biases: string[]; reason: string }>;
  regulatoryContext: string;
}

export const INDUSTRY_PROFILES: Record<string, IndustryProfile> = {
  financial_services: {
    industry: 'financial_services',
    displayName: 'Financial Services (Banking, PE/VC, Insurance)',
    additionalBiases: [
      {
        id: 'disposition_effect',
        name: 'Disposition Effect',
        description: 'Tendency to sell winning investments too early and hold losing ones too long.',
        parentBias: 'loss_aversion',
        industrySpecific: true,
        detectionPrompt:
          'Look for language suggesting premature profit-taking on successful positions while holding or averaging down on losing positions. Watch for phrases like "let\'s lock in gains" alongside "it will recover" for underwater positions.',
        exampleScenario:
          'A portfolio manager sells a 20% gainer after 3 months but holds a 30% loser for 2 years, citing "unrealized losses aren\'t real losses."',
        riskMultiplier: 1.4,
      },
      {
        id: 'herding_behavior',
        name: 'Herding / Herd Behavior',
        description: 'Following the investment decisions of peers rather than independent analysis.',
        parentBias: 'bandwagon_effect',
        industrySpecific: true,
        detectionPrompt:
          'Look for justifications based on what other firms, funds, or analysts are doing rather than independent thesis. Watch for "everyone is in this trade" or "the market consensus is" as primary reasoning.',
        exampleScenario:
          'An investment committee approves a deal primarily because three competitor firms have already invested, without conducting independent due diligence on the target.',
        riskMultiplier: 1.3,
      },
      {
        id: 'home_bias',
        name: 'Home Bias',
        description: 'Overweighting domestic or familiar investments relative to their global opportunity cost.',
        parentBias: 'status_quo_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for portfolio allocations disproportionately weighted to domestic markets or familiar sectors. Watch for dismissal of international opportunities with vague concerns about "complexity" or "currency risk."',
        exampleScenario:
          'A UK pension fund allocates 80% to UK equities despite the UK representing only 4% of global market cap, citing "we understand UK companies better."',
        riskMultiplier: 1.2,
      },
      {
        id: 'myopic_loss_aversion',
        name: 'Myopic Loss Aversion',
        description: 'Excessive risk aversion driven by evaluating performance over too-short time horizons.',
        parentBias: 'loss_aversion',
        industrySpecific: true,
        detectionPrompt:
          'Look for decision-making driven by quarterly or monthly performance rather than the investment\'s stated time horizon. Watch for portfolio changes after short-term drawdowns in long-term strategies.',
        exampleScenario:
          'A fund board reduces equity allocation after a 10% quarterly drawdown in a strategy with a 10-year horizon, locking in losses and missing the recovery.',
        riskMultiplier: 1.5,
      },
      {
        id: 'survivorship_bias_finance',
        name: 'Survivorship Bias',
        description: 'Evaluating strategies based only on surviving funds/companies while ignoring failures.',
        parentBias: 'selective_perception',
        industrySpecific: true,
        detectionPrompt:
          'Look for performance analysis that only considers existing funds or companies without accounting for those that have been liquidated or delisted. Watch for "historical returns of this strategy" without survivorship adjustment.',
        exampleScenario:
          'A fund-of-funds pitch shows "hedge fund index returned 12% annually" without noting that failed funds are removed from the index, inflating apparent returns by 2-3%.',
        riskMultiplier: 1.3,
      },
      {
        id: 'winners_curse',
        name: "Winner's Curse",
        description: 'Overpaying in competitive auctions or deal processes due to the winner systematically overvaluing the asset.',
        parentBias: 'overconfidence_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for competitive bidding situations where the winning bid significantly exceeds intrinsic value estimates. Watch for "we had to increase our bid to win" or justification of premium multiples in a competitive process.',
        exampleScenario:
          'A PE firm wins an auction by bidding 14x EBITDA when their initial model showed 10x as fair value, rationalizing the premium with "synergies" that never materialize.',
        riskMultiplier: 1.4,
      },
    ],
    highRiskCombinations: [
      { biases: ['herding_behavior', 'overconfidence_bias'], reason: 'Consensus trades with high leverage create systemic risk — the 2008 crisis pattern.' },
      { biases: ['disposition_effect', 'sunk_cost_fallacy'], reason: 'Holding losers while cutting winners destroys portfolio returns and compounds path dependency.' },
      { biases: ['myopic_loss_aversion', 'recency_bias'], reason: 'Short-term losses trigger panic selling, missing long-term mean reversion.' },
    ],
    regulatoryContext: 'FCA Consumer Duty, MiFID II suitability, SEC Regulation Best Interest, Basel III capital adequacy.',
  },

  healthcare: {
    industry: 'healthcare',
    displayName: 'Healthcare & Life Sciences',
    additionalBiases: [
      {
        id: 'premature_closure',
        name: 'Premature Closure',
        description: 'Accepting a diagnosis or conclusion before all relevant information has been gathered.',
        parentBias: 'anchoring_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for early conclusions that stop further investigation. Watch for decisions made with incomplete data collection, or dismissal of additional testing because "we already know the answer."',
        exampleScenario:
          'A clinical review board approves a treatment protocol based on Phase II trial data alone, dismissing the need for larger Phase III confirmation because early results were positive.',
        riskMultiplier: 1.5,
      },
      {
        id: 'anchoring_chief_complaint',
        name: 'Anchoring on Chief Complaint',
        description: 'Fixating on the initial presentation or primary complaint while missing co-occurring conditions.',
        parentBias: 'anchoring_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for analysis that focuses exclusively on the primary stated problem without considering secondary factors, comorbidities, or systemic interactions.',
        exampleScenario:
          'A drug safety committee focuses exclusively on the reported efficacy endpoint while overlooking emerging cardiovascular safety signals in secondary data.',
        riskMultiplier: 1.4,
      },
      {
        id: 'diagnosis_momentum',
        name: 'Diagnosis Momentum',
        description: 'Once a label is applied, subsequent decision-makers accept it without independent verification.',
        parentBias: 'authority_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for conclusions being passed through multiple review stages without independent re-evaluation. Watch for "as previously established" or "consistent with prior assessment" without new evidence.',
        exampleScenario:
          'An initial regulatory submission labels a drug as "non-addictive." Every subsequent review cites this label without independently verifying the claim against emerging real-world evidence.',
        riskMultiplier: 1.5,
      },
      {
        id: 'therapeutic_inertia',
        name: 'Therapeutic Inertia',
        description: 'Failure to initiate or intensify treatment when indicated, due to comfort with the current approach.',
        parentBias: 'status_quo_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for decisions to continue current approaches despite evidence that escalation or change is warranted. Watch for "the current approach is working well enough" when outcomes are suboptimal.',
        exampleScenario:
          'A hospital system continues using a legacy EHR system despite documented patient safety incidents, because "migration risk" is perceived as higher than ongoing operational risk.',
        riskMultiplier: 1.3,
      },
      {
        id: 'commission_bias',
        name: 'Commission Bias',
        description: 'Preference for action over inaction, even when inaction may be the better clinical choice.',
        parentBias: 'overconfidence_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for preference for aggressive intervention when watchful waiting or conservative management might be more appropriate. Watch for "we need to do something" driving decisions.',
        exampleScenario:
          'A pharmaceutical company rushes an antiviral to market under emergency authorization when existing generic treatments show similar efficacy, driven by revenue opportunity rather than patient need.',
        riskMultiplier: 1.3,
      },
    ],
    highRiskCombinations: [
      { biases: ['premature_closure', 'confirmation_bias'], reason: 'Early diagnosis locks in selective data collection, missing contradictory evidence.' },
      { biases: ['diagnosis_momentum', 'authority_bias'], reason: 'Labels from senior clinicians propagate unchallenged through the review chain.' },
    ],
    regulatoryContext: 'FDA 21 CFR, EMA guidelines, HIPAA, clinical trial regulations (ICH-GCP), WHO Essential Medicines.',
  },

  legal: {
    industry: 'legal',
    displayName: 'Legal & Regulatory',
    additionalBiases: [
      {
        id: 'hindsight_liability',
        name: 'Hindsight Bias in Liability',
        description: 'Judging past decisions as obviously wrong because the outcome is now known.',
        parentBias: 'hindsight_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for assessments of past decisions that assume the outcome was foreseeable at the time the decision was made. Watch for "they should have known" or "it was obvious" language.',
        exampleScenario:
          'A board review concludes an acquisition was "clearly overpriced" based on post-acquisition performance, ignoring that market conditions at the time of the deal supported the valuation.',
        riskMultiplier: 1.3,
      },
      {
        id: 'outcome_bias_sentencing',
        name: 'Outcome Bias in Evaluation',
        description: 'Judging the quality of a decision by its outcome rather than the quality of the decision process.',
        parentBias: 'hindsight_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for evaluation of decisions based primarily on whether they worked out rather than whether the reasoning and process were sound at the time.',
        exampleScenario:
          'A compliance review penalizes a risk officer for approving a trade that later lost money, even though the trade was within all risk limits and properly authorized at the time.',
        riskMultiplier: 1.2,
      },
      {
        id: 'defensive_decision_making',
        name: 'Defensive Decision-Making',
        description: 'Making decisions to avoid personal blame rather than to optimize outcomes.',
        parentBias: 'loss_aversion',
        industrySpecific: true,
        detectionPrompt:
          'Look for decisions driven by "what will protect me if this goes wrong" rather than "what is the best outcome." Watch for excessive documentation, unnecessary approvals, or conservative choices made to create an audit trail.',
        exampleScenario:
          'A general counsel recommends against a beneficial but novel business strategy solely because it lacks precedent, choosing the defensible "no" over the optimal "yes with guardrails."',
        riskMultiplier: 1.3,
      },
      {
        id: 'precedent_anchoring',
        name: 'Precedent Anchoring',
        description: 'Over-relying on past cases or precedent when current circumstances are materially different.',
        parentBias: 'anchoring_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for heavy reliance on historical precedent or prior case outcomes without adequately considering how current circumstances differ. Watch for "in the last case we did X" without analyzing whether the situations are truly comparable.',
        exampleScenario:
          'A regulatory team applies the same compliance framework to a novel AI product that was designed for traditional financial products, missing AI-specific risks entirely.',
        riskMultiplier: 1.3,
      },
      {
        id: 'severity_escalation',
        name: 'Severity Escalation Bias',
        description: 'Tendency to escalate penalties or responses disproportionately to demonstrate seriousness.',
        parentBias: 'availability_heuristic',
        industrySpecific: true,
        detectionPrompt:
          'Look for enforcement actions or penalties that seem disproportionate to the violation, often driven by recent high-profile cases or public pressure rather than consistent application of standards.',
        exampleScenario:
          'A compliance committee imposes maximum penalties on a minor reporting violation because a competitor was recently fined for fraud, even though the situations are materially different.',
        riskMultiplier: 1.2,
      },
    ],
    highRiskCombinations: [
      { biases: ['hindsight_liability', 'outcome_bias_sentencing'], reason: 'Judging decisions by outcomes creates a culture of defensive decision-making.' },
      { biases: ['precedent_anchoring', 'status_quo_bias'], reason: 'Over-reliance on precedent prevents adaptation to novel situations.' },
    ],
    regulatoryContext: 'Bar ethics rules, judicial conduct codes, corporate governance codes, fiduciary duty standards.',
  },

  technology: {
    industry: 'technology',
    displayName: 'Technology & Software',
    additionalBiases: [
      {
        id: 'feature_creep_bias',
        name: 'Feature Creep Bias',
        description: 'Continuously adding features rather than shipping, driven by the belief that more features equals better product.',
        parentBias: 'planning_fallacy',
        industrySpecific: true,
        detectionPrompt:
          'Look for expanding project scope, growing feature lists, or delayed launches justified by "just one more feature." Watch for roadmaps that keep growing without corresponding schedule adjustments.',
        exampleScenario:
          'A startup delays its MVP launch by 8 months to add 15 additional features, none of which were requested by beta users, while competitors capture the market.',
        riskMultiplier: 1.3,
      },
      {
        id: 'not_invented_here',
        name: 'Not-Invented-Here Syndrome',
        description: 'Rejecting external solutions in favor of building internally, even when external solutions are superior.',
        parentBias: 'overconfidence_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for decisions to build custom solutions when proven open-source or third-party alternatives exist. Watch for dismissals of external tools with "it won\'t meet our needs" without specific evaluation.',
        exampleScenario:
          'An engineering team spends 6 months building a custom monitoring system instead of adopting Datadog or Grafana, claiming unique requirements that the existing tools already support.',
        riskMultiplier: 1.2,
      },
      {
        id: 'shiny_object_syndrome',
        name: 'Shiny Object Syndrome',
        description: 'Chasing new technologies or trends without evaluating fit for the actual problem.',
        parentBias: 'recency_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for technology adoption driven by hype or trend rather than specific problem-solution fit. Watch for "we should use AI/blockchain/serverless for this" without explaining why the current approach is insufficient.',
        exampleScenario:
          'A team rewrites a working CRUD application in a trendy new framework because it was featured at a conference, introducing 6 months of bugs and regressions.',
        riskMultiplier: 1.2,
      },
      {
        id: 'tech_debt_blindness',
        name: 'Technical Debt Blindness',
        description: 'Ignoring accumulating technical debt because it is not immediately visible in product metrics.',
        parentBias: 'cognitive_misering',
        industrySpecific: true,
        detectionPrompt:
          'Look for decisions that prioritize new features over maintenance, refactoring, or infrastructure upgrades. Watch for "we\'ll fix it later" patterns and growing incident rates attributed to "complexity."',
        exampleScenario:
          'A platform team defers database migration for 3 years despite growing query latency, until a production outage costs $2M in lost revenue.',
        riskMultiplier: 1.4,
      },
      {
        id: 'survivorship_bias_metrics',
        name: 'Survivorship Bias in Metrics',
        description: 'Measuring only successful users/transactions while ignoring drop-offs, failures, and silent churn.',
        parentBias: 'selective_perception',
        industrySpecific: true,
        detectionPrompt:
          'Look for metrics that only track successful completions without measuring abandonment, error rates, or users who never return. Watch for "our conversion rate is great" without denominator clarity.',
        exampleScenario:
          'A product team reports 95% user satisfaction by only surveying users who completed onboarding, ignoring the 60% who dropped off during registration.',
        riskMultiplier: 1.3,
      },
    ],
    highRiskCombinations: [
      { biases: ['feature_creep_bias', 'planning_fallacy'], reason: 'Scope expansion + timeline optimism = perpetual delay and missed market windows.' },
      { biases: ['not_invented_here', 'overconfidence_bias'], reason: 'Building everything custom while believing your team is exceptional leads to wasted engineering effort.' },
    ],
    regulatoryContext: 'EU AI Act, GDPR, CCPA, SOC 2, ISO 27001, industry-specific compliance (HIPAA for healthtech, PCI-DSS for fintech).',
  },

  energy_industrial: {
    industry: 'energy_industrial',
    displayName: 'Energy, Industrial & Aerospace',
    additionalBiases: [
      {
        id: 'normalcy_bias',
        name: 'Normalcy Bias',
        description: 'Assuming that because a disaster has never happened, it will not happen in the future.',
        parentBias: 'status_quo_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for risk assessments that dismiss low-probability, high-impact scenarios because "it\'s never happened before." Watch for assumptions that historical safety records predict future safety.',
        exampleScenario:
          'A nuclear plant risk assessment dismisses the possibility of a tsunami exceeding seawall height because no such event has been recorded in the past 100 years of data.',
        riskMultiplier: 1.6,
      },
      {
        id: 'safety_complacency',
        name: 'Safety Complacency',
        description: 'Reduced vigilance after long periods without incidents, leading to erosion of safety protocols.',
        parentBias: 'availability_heuristic',
        industrySpecific: true,
        detectionPrompt:
          'Look for relaxation of safety procedures justified by "we haven\'t had an incident in X years." Watch for reduced training frequency, waived inspections, or simplified checklists.',
        exampleScenario:
          'An oil platform reduces the frequency of blowout preventer testing from monthly to quarterly after 5 years without a well control event, saving $200K/year in maintenance costs.',
        riskMultiplier: 1.5,
      },
      {
        id: 'production_pressure',
        name: 'Production Pressure Bias',
        description: 'Prioritizing production targets or schedule over safety when the two conflict.',
        parentBias: 'sunk_cost_fallacy',
        industrySpecific: true,
        detectionPrompt:
          'Look for decisions where schedule, budget, or production targets override safety recommendations. Watch for "we can\'t afford the delay" or "let\'s proceed and monitor" language when safety concerns are raised.',
        exampleScenario:
          'A construction project proceeds with a concrete pour despite quality control flagging substandard rebar placement, because a one-day delay would trigger contractual penalties.',
        riskMultiplier: 1.6,
      },
      {
        id: 'regulatory_capture',
        name: 'Regulatory Capture Bias',
        description: 'When regulators adopt the perspective and priorities of the industry they regulate.',
        parentBias: 'authority_bias',
        industrySpecific: true,
        detectionPrompt:
          'Look for regulatory decisions that consistently favor industry interests over public safety. Watch for revolving-door references, industry-funded research cited as independent, or deference to industry self-regulation.',
        exampleScenario:
          'A mining safety regulator allows a company to self-certify emergency ventilation systems after the regulator\'s lead inspector is hired by the mining company.',
        riskMultiplier: 1.4,
      },
      {
        id: 'decommissioning_avoidance',
        name: 'Decommissioning Avoidance',
        description: 'Extending the life of aging infrastructure beyond safe limits to avoid decommissioning costs.',
        parentBias: 'loss_aversion',
        industrySpecific: true,
        detectionPrompt:
          'Look for decisions to extend equipment or facility life based primarily on avoiding replacement costs rather than safety-informed lifecycle analysis. Watch for "life extension studies" that consistently find infrastructure safe to continue.',
        exampleScenario:
          'A utility extends a 50-year-old nuclear reactor\'s license by 20 years based on an industry-funded life extension study, despite increasing maintenance incidents and embrittlement concerns.',
        riskMultiplier: 1.5,
      },
    ],
    highRiskCombinations: [
      { biases: ['normalcy_bias', 'safety_complacency'], reason: 'No recent incidents + "it can\'t happen here" = catastrophic surprise when it does.' },
      { biases: ['production_pressure', 'authority_bias'], reason: 'Schedule pressure from leadership overrides field engineer safety concerns — the Challenger pattern.' },
    ],
    regulatoryContext: 'OSHA, EPA, NRC, NTSB investigations, ISO 45001, API standards, IAEA safety standards.',
  },
};

/**
 * Get the industry profile for a given industry key.
 */
export function getIndustryProfile(industry: string): IndustryProfile | undefined {
  return INDUSTRY_PROFILES[industry];
}

/**
 * Get all additional biases for an industry.
 */
export function getIndustryBiases(industry: string): IndustryBias[] {
  return INDUSTRY_PROFILES[industry]?.additionalBiases ?? [];
}

/**
 * Attempt to detect the industry from document content using keyword matching.
 * Returns the most likely industry or null if no strong match.
 */
export function detectIndustry(content: string): string | null {
  const lower = content.toLowerCase();

  const industryKeywords: Record<string, string[]> = {
    financial_services: [
      'portfolio', 'investment', 'fund', 'equity', 'bond', 'hedge',
      'banking', 'trading', 'derivatives', 'capital adequacy', 'risk-weighted',
      'AUM', 'fiduciary', 'suitability', 'KYC', 'Basel', 'MiFID',
    ],
    healthcare: [
      'clinical trial', 'FDA', 'patient', 'diagnosis', 'pharmaceutical',
      'drug', 'therapy', 'medical device', 'EHR', 'HIPAA', 'efficacy',
      'adverse event', 'placebo', 'randomized',
    ],
    legal: [
      'litigation', 'compliance', 'enforcement', 'statute', 'regulation',
      'precedent', 'liability', 'indemnity', 'fiduciary duty', 'injunction',
      'settlement', 'arbitration',
    ],
    technology: [
      'software', 'API', 'deployment', 'microservices', 'cloud',
      'machine learning', 'sprint', 'agile', 'technical debt',
      'SaaS', 'platform', 'open source', 'DevOps',
    ],
    energy_industrial: [
      'pipeline', 'refinery', 'drilling', 'turbine', 'reactor',
      'emissions', 'decommission', 'safety incident', 'OSHA',
      'environmental impact', 'megawatt', 'blowout preventer',
    ],
  };

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore && score >= 3) {
      bestScore = score;
      bestMatch = industry;
    }
  }

  return bestMatch;
}
