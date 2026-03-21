/**
 * Enterprise Security Bias Taxonomy
 *
 * Comprehensive 15-bias detection framework specifically designed for
 * cloud security operations, based on Kahneman's behavioral research
 * and adapted for SOC environments.
 */

import { z } from 'zod';

// ─── Security-Specific Bias Definitions ─────────────────────────────────────

export enum SecurityBiasType {
  ANCHORING = 'anchoring_bias',
  AVAILABILITY = 'availability_heuristic',
  CONFIRMATION = 'confirmation_bias',
  GROUPTHINK = 'groupthink',
  LOSS_AVERSION = 'loss_aversion',
  AUTOMATION_BIAS = 'automation_bias',
  RECENCY = 'recency_effect',
  OVERCONFIDENCE = 'overconfidence_bias',
  SUNK_COST = 'sunk_cost_fallacy',
  HALO_EFFECT = 'halo_effect',
  BANDWAGON = 'bandwagon_effect',
  STATUS_QUO = 'status_quo_bias',
  FRAMING = 'framing_effect',
  DUNNING_KRUGER = 'dunning_kruger_effect',
  CHOICE_OVERLOAD = 'choice_overload'
}

export interface BiasDefinition {
  type: SecurityBiasType;
  name: string;
  description: string;
  securityContext: string;
  triggers: string[];
  nudgeStrategy: string;
  kpiImpact: string[];
  detectionSignals: string[];
}

export const SECURITY_BIAS_TAXONOMY: BiasDefinition[] = [
  {
    type: SecurityBiasType.ANCHORING,
    name: 'Anchoring Bias',
    description: 'Over-reliance on the first piece of information encountered',
    securityContext: 'Fixating on initial severity scores from security tools without considering context',
    triggers: [
      'Initial "CRITICAL" severity label',
      'First vulnerability CVE score',
      'Opening alert in incident queue'
    ],
    nudgeStrategy: 'Prompt to evaluate context factors (identity, data sensitivity, exposure)',
    kpiImpact: ['MTTD', 'MTTR', 'False Positive Rate'],
    detectionSignals: [
      'Decision made within 30 seconds of alert',
      'No additional context queries performed',
      'Severity unchanged from initial assessment'
    ]
  },
  {
    type: SecurityBiasType.AVAILABILITY,
    name: 'Availability Heuristic',
    description: 'Overestimating probability based on recent or memorable events',
    securityContext: 'Over-prioritizing vulnerabilities that match recent high-profile breaches',
    triggers: [
      'Recent news coverage of exploit',
      'Similar incident in past 30 days',
      'Vendor security advisory'
    ],
    nudgeStrategy: 'Provide base-rate statistics on actual exploitation in similar environments',
    kpiImpact: ['Alert Prioritization Accuracy', 'Resource Allocation'],
    detectionSignals: [
      'Mentions of recent breach in notes',
      'Priority override without risk assessment',
      'Pattern matching to news events'
    ]
  },
  {
    type: SecurityBiasType.CONFIRMATION,
    name: 'Confirmation Bias',
    description: 'Seeking information that confirms existing beliefs',
    securityContext: 'Only investigating logs that support initial hypothesis about an incident',
    triggers: [
      'Prior similar incident',
      'Team consensus on root cause',
      'Vendor reputation'
    ],
    nudgeStrategy: 'Force consideration of alternative explanations with structured investigation',
    kpiImpact: ['MTTI', 'Root Cause Accuracy'],
    detectionSignals: [
      'Single hypothesis investigation',
      'No contradictory evidence sought',
      'Early investigation closure'
    ]
  },
  {
    type: SecurityBiasType.GROUPTHINK,
    name: 'Groupthink',
    description: 'Conformity pressure leading to irrational decision-making',
    securityContext: 'Team unanimously agreeing on remediation without dissent',
    triggers: [
      'All-hands incident response',
      'Executive presence in war room',
      'Time pressure situations'
    ],
    nudgeStrategy: 'Assign rotating "devil\'s advocate" role to challenge consensus',
    kpiImpact: ['Decision Quality', 'Post-Incident Learning'],
    detectionSignals: [
      'Unanimous agreement in <2 minutes',
      'No alternative proposals',
      'Silence from junior members'
    ]
  },
  {
    type: SecurityBiasType.LOSS_AVERSION,
    name: 'Loss Aversion',
    description: 'Preference to avoid losses over acquiring gains',
    securityContext: 'Hesitation to patch production systems despite critical vulnerabilities',
    triggers: [
      'Production system changes',
      'Customer-facing service updates',
      'Revenue-generating systems'
    ],
    nudgeStrategy: 'Quantitative risk comparison: breach cost vs downtime cost',
    kpiImpact: ['MTTR', 'Vulnerability Dwell Time'],
    detectionSignals: [
      'Delayed patching decisions',
      'Multiple postponements',
      'Excessive change approval requests'
    ]
  },
  {
    type: SecurityBiasType.AUTOMATION_BIAS,
    name: 'Automation Bias',
    description: 'Over-reliance on automated systems and AI recommendations',
    securityContext: 'Blindly accepting AI-generated remediation scripts without review',
    triggers: [
      'AI confidence score >90%',
      'Automated tool recommendations',
      'ML-based threat detection'
    ],
    nudgeStrategy: 'Mandatory reasoning check before executing automated remediation',
    kpiImpact: ['Incident Accuracy', 'Collateral Damage'],
    detectionSignals: [
      'No manual verification',
      'Immediate automation execution',
      'Skipped human review steps'
    ]
  },
  {
    type: SecurityBiasType.RECENCY,
    name: 'Recency Effect',
    description: 'Giving more weight to recent events than historical patterns',
    securityContext: 'Focusing on latest alerts while ignoring persistent threats',
    triggers: [
      'New alert arrivals',
      'Recent incident type',
      'Latest threat intelligence'
    ],
    nudgeStrategy: 'Display historical threat patterns alongside current alerts',
    kpiImpact: ['Alert Queue Management', 'Threat Prioritization'],
    detectionSignals: [
      'LIFO alert processing',
      'Historical threats ignored',
      'Trend analysis skipped'
    ]
  },
  {
    type: SecurityBiasType.OVERCONFIDENCE,
    name: 'Overconfidence Bias',
    description: 'Excessive confidence in one\'s own answers or abilities',
    securityContext: 'Skipping verification steps due to confidence in initial assessment',
    triggers: [
      'Senior analyst decisions',
      'Familiar vulnerability types',
      'Previous success patterns'
    ],
    nudgeStrategy: 'Require confidence intervals and second opinions on critical decisions',
    kpiImpact: ['False Negative Rate', 'Missed Detections'],
    detectionSignals: [
      '100% confidence ratings',
      'Skipped validation steps',
      'No peer review requested'
    ]
  },
  {
    type: SecurityBiasType.SUNK_COST,
    name: 'Sunk Cost Fallacy',
    description: 'Continuing investment due to previously invested resources',
    securityContext: 'Persisting with failing security tool due to implementation costs',
    triggers: [
      'Large prior investment',
      'Long implementation time',
      'Team training completed'
    ],
    nudgeStrategy: 'Focus on future ROI rather than past investments',
    kpiImpact: ['Tool Effectiveness', 'Budget Efficiency'],
    detectionSignals: [
      'Tool retention despite poor metrics',
      'Escalating investment',
      'Justification based on past costs'
    ]
  },
  {
    type: SecurityBiasType.HALO_EFFECT,
    name: 'Halo Effect',
    description: 'Overall impression influences specific judgments',
    securityContext: 'Trusting all products from vendor due to one good experience',
    triggers: [
      'Vendor reputation',
      'Previous tool success',
      'Industry awards'
    ],
    nudgeStrategy: 'Evaluate each tool/decision independently on merit',
    kpiImpact: ['Vendor Risk Management', 'Tool Selection Quality'],
    detectionSignals: [
      'No competitive evaluation',
      'Automatic vendor selection',
      'Skipped proof-of-concept'
    ]
  },
  {
    type: SecurityBiasType.BANDWAGON,
    name: 'Bandwagon Effect',
    description: 'Adopting beliefs because many others do',
    securityContext: 'Implementing security controls because "everyone else is doing it"',
    triggers: [
      'Industry trends',
      'Peer company practices',
      'Conference recommendations'
    ],
    nudgeStrategy: 'Require environment-specific risk assessment',
    kpiImpact: ['Control Effectiveness', 'Resource Optimization'],
    detectionSignals: [
      'Trend-based decisions',
      'No risk assessment',
      'Copy-paste implementations'
    ]
  },
  {
    type: SecurityBiasType.STATUS_QUO,
    name: 'Status Quo Bias',
    description: 'Preference for current state of affairs',
    securityContext: 'Resisting security architecture changes despite evolving threats',
    triggers: [
      'Legacy system protection',
      'Established procedures',
      'Comfort with current tools'
    ],
    nudgeStrategy: 'Highlight threat evolution and competitive disadvantage',
    kpiImpact: ['Security Posture', 'Adaptation Speed'],
    detectionSignals: [
      'Rejected change proposals',
      'Outdated security controls',
      'No architecture reviews'
    ]
  },
  {
    type: SecurityBiasType.FRAMING,
    name: 'Framing Effect',
    description: 'Drawing different conclusions from same data based on presentation',
    securityContext: 'Risk perception changes based on how vulnerability is described',
    triggers: [
      'Vendor severity labels',
      'Alert description format',
      'Dashboard presentations'
    ],
    nudgeStrategy: 'Standardize risk presentations with multiple perspectives',
    kpiImpact: ['Risk Assessment Accuracy', 'Decision Consistency'],
    detectionSignals: [
      'Inconsistent similar decisions',
      'Presentation-dependent choices',
      'Format-influenced priorities'
    ]
  },
  {
    type: SecurityBiasType.DUNNING_KRUGER,
    name: 'Dunning-Kruger Effect',
    description: 'Incompetent individuals overestimate their abilities',
    securityContext: 'Junior analysts overconfident in complex incident response',
    triggers: [
      'Limited experience',
      'Early career success',
      'Lack of feedback'
    ],
    nudgeStrategy: 'Implement progressive responsibility with mentorship',
    kpiImpact: ['Incident Resolution Quality', 'Learning Curve'],
    detectionSignals: [
      'Experience-confidence mismatch',
      'Rejected assistance',
      'Oversimplified analysis'
    ]
  },
  {
    type: SecurityBiasType.CHOICE_OVERLOAD,
    name: 'Choice Overload',
    description: 'Decision paralysis from too many options',
    securityContext: 'Alert fatigue leading to delayed or poor triage decisions',
    triggers: [
      '>100 alerts in queue',
      'Multiple remediation options',
      'Complex decision trees'
    ],
    nudgeStrategy: 'Implement progressive disclosure and smart filtering',
    kpiImpact: ['MTTA', 'Alert Processing Rate'],
    detectionSignals: [
      'Increasing decision time',
      'Random selection patterns',
      'Decision avoidance'
    ]
  }
];

// ─── Bias Detection Engine ───────────────────────────────────────────────────

export interface BiasDetectionResult {
  detected: boolean;
  biasType: SecurityBiasType;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  signals: string[];
  nudgeRecommendation: string;
  kpiImpact: string[];
  mitigationSteps: string[];
}

export class SecurityBiasDetector {
  /**
   * Analyze a security decision for cognitive biases
   */
  detectBias(
    decisionContext: {
      decisionType: string;
      timeToDecision: number; // seconds
      dataPointsConsulted: number;
      teamSize: number;
      consensusTime?: number; // seconds
      previousSimilarDecisions?: number;
      automationInvolved: boolean;
      alertVolume?: number;
      seniorityLevel?: 'junior' | 'mid' | 'senior';
      productionSystem?: boolean;
    }
  ): BiasDetectionResult[] {
    const results: BiasDetectionResult[] = [];

    // Anchoring Bias Detection
    if (decisionContext.timeToDecision < 30 && decisionContext.dataPointsConsulted < 2) {
      results.push({
        detected: true,
        biasType: SecurityBiasType.ANCHORING,
        confidence: 0.85,
        severity: 'high',
        signals: [
          `Decision made in ${decisionContext.timeToDecision}s`,
          `Only ${decisionContext.dataPointsConsulted} data points consulted`
        ],
        nudgeRecommendation: 'Consider additional context: Check identity permissions, data sensitivity, and network exposure before finalizing severity.',
        kpiImpact: ['MTTD +15%', 'False Positive Rate +20%'],
        mitigationSteps: [
          'Implement mandatory context checklist',
          'Add 60-second minimum investigation time',
          'Require at least 3 data sources'
        ]
      });
    }

    // Groupthink Detection
    if (
      decisionContext.teamSize > 3 &&
      decisionContext.consensusTime &&
      decisionContext.consensusTime < 120
    ) {
      results.push({
        detected: true,
        biasType: SecurityBiasType.GROUPTHINK,
        confidence: 0.75,
        severity: 'medium',
        signals: [
          `${decisionContext.teamSize} team members`,
          `Consensus in ${decisionContext.consensusTime}s`
        ],
        nudgeRecommendation: 'Assign a devil\'s advocate: Have one team member explicitly argue against the current approach.',
        kpiImpact: ['Decision Quality -25%', 'Post-Incident Learning -30%'],
        mitigationSteps: [
          'Implement rotating devil\'s advocate role',
          'Require written dissenting opinions',
          'Add anonymous feedback channel'
        ]
      });
    }

    // Automation Bias Detection
    if (decisionContext.automationInvolved && decisionContext.dataPointsConsulted < 2) {
      results.push({
        detected: true,
        biasType: SecurityBiasType.AUTOMATION_BIAS,
        confidence: 0.9,
        severity: 'critical',
        signals: [
          'Automated recommendation accepted',
          'No manual verification performed'
        ],
        nudgeRecommendation: 'Verify automation: Review the reasoning behind the automated recommendation before execution.',
        kpiImpact: ['Incident Accuracy -40%', 'Collateral Damage Risk +60%'],
        mitigationSteps: [
          'Implement mandatory reasoning review',
          'Add manual verification checkpoint',
          'Require human approval for critical actions'
        ]
      });
    }

    // Loss Aversion Detection
    if (decisionContext.productionSystem && decisionContext.timeToDecision > 300) {
      results.push({
        detected: true,
        biasType: SecurityBiasType.LOSS_AVERSION,
        confidence: 0.7,
        severity: 'high',
        signals: [
          'Production system involved',
          `Decision delayed ${decisionContext.timeToDecision}s`
        ],
        nudgeRecommendation: 'Quantify risk: Compare potential breach cost ($X) vs temporary downtime cost ($Y).',
        kpiImpact: ['MTTR +35%', 'Vulnerability Dwell Time +48h'],
        mitigationSteps: [
          'Create risk quantification matrix',
          'Set maximum decision timelines',
          'Implement gradual rollback procedures'
        ]
      });
    }

    // Choice Overload Detection
    if (decisionContext.alertVolume && decisionContext.alertVolume > 100) {
      results.push({
        detected: true,
        biasType: SecurityBiasType.CHOICE_OVERLOAD,
        confidence: 0.8,
        severity: 'high',
        signals: [
          `${decisionContext.alertVolume} alerts in queue`,
          'Decision paralysis indicators'
        ],
        nudgeRecommendation: 'Simplify choices: Use smart filtering to show top 10 critical alerts first.',
        kpiImpact: ['MTTA +50%', 'Alert Processing Rate -60%'],
        mitigationSteps: [
          'Implement progressive alert disclosure',
          'Add ML-based priority filtering',
          'Create decision shortcuts for common scenarios'
        ]
      });
    }

    return results;
  }

  /**
   * Calculate overall cognitive load and bias risk
   */
  calculateCognitiveRisk(detections: BiasDetectionResult[]): {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number; // 0-100
    primaryBias: SecurityBiasType | null;
    mitigationPriority: string[];
  } {
    if (detections.length === 0) {
      return {
        overallRisk: 'low',
        riskScore: 0,
        primaryBias: null,
        mitigationPriority: []
      };
    }

    // Calculate weighted risk score
    const severityWeights = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    const totalScore = detections.reduce((sum, d) =>
      sum + (severityWeights[d.severity] * d.confidence * 100), 0
    );
    const riskScore = Math.min(100, totalScore / detections.length);

    // Determine overall risk level
    let overallRisk: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 25) overallRisk = 'low';
    else if (riskScore < 50) overallRisk = 'medium';
    else if (riskScore < 75) overallRisk = 'high';
    else overallRisk = 'critical';

    // Identify primary bias (highest confidence * severity)
    const primaryDetection = detections.reduce((max, d) =>
      (severityWeights[d.severity] * d.confidence) >
      (severityWeights[max.severity] * max.confidence) ? d : max
    );

    // Priority mitigation steps
    const mitigationPriority = detections
      .sort((a, b) =>
        (severityWeights[b.severity] * b.confidence) -
        (severityWeights[a.severity] * a.confidence)
      )
      .slice(0, 3)
      .map(d => d.mitigationSteps[0]);

    return {
      overallRisk,
      riskScore,
      primaryBias: primaryDetection.biasType,
      mitigationPriority
    };
  }
}

// ─── Zod Schemas for API Validation ─────────────────────────────────────────

export const BiasDetectionContextSchema = z.object({
  decisionType: z.string(),
  timeToDecision: z.number().positive(),
  dataPointsConsulted: z.number().int().nonnegative(),
  teamSize: z.number().int().positive(),
  consensusTime: z.number().positive().optional(),
  previousSimilarDecisions: z.number().int().nonnegative().optional(),
  automationInvolved: z.boolean(),
  alertVolume: z.number().int().nonnegative().optional(),
  seniorityLevel: z.enum(['junior', 'mid', 'senior']).optional(),
  productionSystem: z.boolean().optional()
});

export const BiasDetectionResultSchema = z.object({
  detected: z.boolean(),
  biasType: z.nativeEnum(SecurityBiasType),
  confidence: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  signals: z.array(z.string()),
  nudgeRecommendation: z.string(),
  kpiImpact: z.array(z.string()),
  mitigationSteps: z.array(z.string())
});

export type BiasDetectionContext = z.infer<typeof BiasDetectionContextSchema>;
export type BiasDetectionResultType = z.infer<typeof BiasDetectionResultSchema>;