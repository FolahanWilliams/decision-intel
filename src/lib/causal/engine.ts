/**
 * Causal AI Reasoning Engine
 *
 * Implements structural causal models (SCM) for counterfactual reasoning
 * in security operations. Moves beyond correlation to understand mechanistic
 * causation in complex cloud environments.
 */

import { z } from 'zod';

// ─── Core Causal Structures ──────────────────────────────────────────────────

export interface CausalNode {
  id: string;
  type: 'action' | 'outcome' | 'confounder' | 'mediator' | 'collider';
  name: string;
  description: string;
  value?: string | number | boolean;
  probability?: number;
}

export interface CausalEdge {
  from: string;
  to: string;
  strength: number; // -1 to 1, negative for inverse relationships
  mechanism: string; // Description of causal mechanism
  timeDelay?: number; // Seconds
}

export interface StructuralCausalModel {
  nodes: Map<string, CausalNode>;
  edges: CausalEdge[];
  equations: Map<string, (inputs: Map<string, number>) => number>;
}

// ─── Security-Specific Causal Models ─────────────────────────────────────────

export class SecurityCausalModel {
  private model: StructuralCausalModel;

  constructor() {
    this.model = this.buildSecurityModel();
  }

  /**
   * Build the base causal model for security operations
   */
  private buildSecurityModel(): StructuralCausalModel {
    const nodes = new Map<string, CausalNode>();
    const edges: CausalEdge[] = [];
    const equations = new Map<string, (inputs: Map<string, number>) => number>();

    // Define nodes
    nodes.set('patch_deployment', {
      id: 'patch_deployment',
      type: 'action',
      name: 'Deploy Security Patch',
      description: 'Action to deploy a security patch to production'
    });

    nodes.set('system_downtime', {
      id: 'system_downtime',
      type: 'outcome',
      name: 'System Downtime',
      description: 'Production system unavailability'
    });

    nodes.set('breach_risk', {
      id: 'breach_risk',
      type: 'outcome',
      name: 'Breach Risk',
      description: 'Probability of security breach'
    });

    nodes.set('vulnerability_exposure', {
      id: 'vulnerability_exposure',
      type: 'mediator',
      name: 'Vulnerability Exposure Window',
      description: 'Time window where vulnerability is exploitable'
    });

    nodes.set('business_impact', {
      id: 'business_impact',
      type: 'outcome',
      name: 'Business Impact',
      description: 'Financial and operational impact'
    });

    nodes.set('network_exposure', {
      id: 'network_exposure',
      type: 'confounder',
      name: 'Network Exposure',
      description: 'Public internet exposure of the system'
    });

    nodes.set('data_sensitivity', {
      id: 'data_sensitivity',
      type: 'confounder',
      name: 'Data Sensitivity',
      description: 'Classification level of data in system'
    });

    nodes.set('attacker_capability', {
      id: 'attacker_capability',
      type: 'confounder',
      name: 'Attacker Capability',
      description: 'Sophistication level of potential attackers'
    });

    nodes.set('secret_rotation', {
      id: 'secret_rotation',
      type: 'action',
      name: 'Rotate Secrets',
      description: 'Action to rotate compromised credentials'
    });

    nodes.set('service_availability', {
      id: 'service_availability',
      type: 'outcome',
      name: 'Service Availability',
      description: 'Percentage of service uptime'
    });

    // Define edges (causal relationships)
    edges.push(
      {
        from: 'patch_deployment',
        to: 'system_downtime',
        strength: 0.3, // Patch deployment causes 30% chance of downtime
        mechanism: 'Service restart required for patch application',
        timeDelay: 60
      },
      {
        from: 'patch_deployment',
        to: 'vulnerability_exposure',
        strength: -0.95, // Patching reduces vulnerability exposure by 95%
        mechanism: 'Patch closes security vulnerability',
        timeDelay: 0
      },
      {
        from: 'vulnerability_exposure',
        to: 'breach_risk',
        strength: 0.7,
        mechanism: 'Exposed vulnerabilities increase breach probability',
        timeDelay: 3600 // 1 hour
      },
      {
        from: 'network_exposure',
        to: 'breach_risk',
        strength: 0.4,
        mechanism: 'Public exposure increases attack surface'
      },
      {
        from: 'data_sensitivity',
        to: 'business_impact',
        strength: 0.8,
        mechanism: 'Sensitive data breaches have higher impact'
      },
      {
        from: 'breach_risk',
        to: 'business_impact',
        strength: 0.9,
        mechanism: 'Security breaches directly impact business'
      },
      {
        from: 'system_downtime',
        to: 'business_impact',
        strength: 0.5,
        mechanism: 'Downtime causes revenue and productivity loss'
      },
      {
        from: 'secret_rotation',
        to: 'service_availability',
        strength: -0.2, // 20% chance of service disruption
        mechanism: 'Connection resets during credential rotation',
        timeDelay: 30
      },
      {
        from: 'attacker_capability',
        to: 'breach_risk',
        strength: 0.6,
        mechanism: 'Sophisticated attackers more likely to succeed'
      }
    );

    // Define structural equations
    equations.set('breach_risk', (inputs: Map<string, number>) => {
      const vulnExposure = inputs.get('vulnerability_exposure') || 0;
      const networkExposure = inputs.get('network_exposure') || 0;
      const attackerCap = inputs.get('attacker_capability') || 0;

      // P(breach) = base_rate * (1 + vuln_factor + network_factor + attacker_factor)
      const baseRate = 0.01; // 1% base breach rate
      const vulnFactor = vulnExposure * 0.7;
      const networkFactor = networkExposure * 0.4;
      const attackerFactor = attackerCap * 0.6;

      return Math.min(1, baseRate * (1 + vulnFactor + networkFactor + attackerFactor));
    });

    equations.set('business_impact', (inputs: Map<string, number>) => {
      const breachRisk = inputs.get('breach_risk') || 0;
      const downtime = inputs.get('system_downtime') || 0;
      const dataSensitivity = inputs.get('data_sensitivity') || 0;

      // Impact = breach_cost * P(breach) + downtime_cost * downtime_hours
      const breachCost = 1000000 * (1 + dataSensitivity * 4); // $1M-5M based on sensitivity
      const downtimeCost = 10000; // $10K per hour

      return breachRisk * breachCost + downtime * downtimeCost;
    });

    equations.set('system_downtime', (inputs: Map<string, number>) => {
      const patchDeployment = inputs.get('patch_deployment') || 0;
      // Expected downtime in hours
      return patchDeployment ? Math.random() < 0.3 ? 2 : 0 : 0; // 30% chance of 2hr downtime
    });

    return { nodes, edges, equations };
  }

  /**
   * Perform do-calculus intervention: do(X = x)
   * This simulates setting a variable to a specific value
   */
  doIntervention(
    action: string,
    value: number,
    context: Map<string, number> = new Map()
  ): Map<string, number> {
    const results = new Map<string, number>(context);
    results.set(action, value);

    // Propagate causal effects through the graph
    const visited = new Set<string>();
    const queue = [action];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      // Find all edges from current node
      const outgoingEdges = this.model.edges.filter(e => e.from === current);

      for (const edge of outgoingEdges) {
        const targetEquation = this.model.equations.get(edge.to);
        if (targetEquation) {
          // Apply structural equation
          const newValue = targetEquation(results);
          results.set(edge.to, newValue);
          queue.push(edge.to);
        } else {
          // Simple linear propagation if no equation defined
          const sourceValue = results.get(edge.from) || 0;
          const currentTarget = results.get(edge.to) || 0;
          const effect = sourceValue * edge.strength;
          results.set(edge.to, currentTarget + effect);
          queue.push(edge.to);
        }
      }
    }

    return results;
  }

  /**
   * Counterfactual reasoning: "What would have happened if..."
   */
  counterfactual(
    factual: Map<string, number>,
    intervention: { variable: string; value: number }
  ): {
    factual: Map<string, number>;
    counterfactual: Map<string, number>;
    differences: Map<string, { factual: number; counterfactual: number; delta: number | string }>;
  } {
    // Apply intervention to get counterfactual world
    const counterfactual = this.doIntervention(
      intervention.variable,
      intervention.value,
      new Map(factual)
    );

    // Calculate differences
    const differences = new Map<string, { factual: number; counterfactual: number; delta: number | string }>();

    for (const [key, factualValue] of factual) {
      const counterfactualValue = counterfactual.get(key);
      if (counterfactualValue !== undefined && counterfactualValue !== factualValue) {
        const delta = typeof factualValue === 'number' && typeof counterfactualValue === 'number'
          ? counterfactualValue - factualValue
          : `${factualValue} → ${counterfactualValue}`;

        differences.set(key, {
          factual: factualValue,
          counterfactual: counterfactualValue,
          delta
        });
      }
    }

    return { factual, counterfactual, differences };
  }

  /**
   * Calculate Average Treatment Effect (ATE)
   */
  calculateATE(
    treatment: string,
    outcome: string,
    samples: number = 1000
  ): {
    ate: number;
    confidence: number;
    recommendation: string;
  } {
    let treatedOutcomes = 0;
    let controlOutcomes = 0;

    for (let i = 0; i < samples; i++) {
      // Generate random context
      const context = this.generateRandomContext();

      // Treatment group: do(treatment = 1)
      const treated = this.doIntervention(treatment, 1, new Map(context));
      treatedOutcomes += treated.get(outcome) || 0;

      // Control group: do(treatment = 0)
      const control = this.doIntervention(treatment, 0, new Map(context));
      controlOutcomes += control.get(outcome) || 0;
    }

    const ate = (treatedOutcomes - controlOutcomes) / samples;
    const confidence = Math.min(0.95, samples / 1000); // Simplified confidence

    let recommendation = '';
    if (ate > 0) {
      recommendation = `${treatment} increases ${outcome} by ${Math.abs(ate).toFixed(2)} on average`;
    } else if (ate < 0) {
      recommendation = `${treatment} decreases ${outcome} by ${Math.abs(ate).toFixed(2)} on average`;
    } else {
      recommendation = `${treatment} has no causal effect on ${outcome}`;
    }

    return { ate, confidence, recommendation };
  }

  /**
   * Generate random context for simulations
   */
  private generateRandomContext(): Map<string, number> {
    const context = new Map<string, number>();

    context.set('network_exposure', Math.random()); // 0-1 scale
    context.set('data_sensitivity', Math.random()); // 0-1 scale
    context.set('attacker_capability', Math.random()); // 0-1 scale
    context.set('vulnerability_exposure', Math.random() > 0.7 ? 1 : 0); // 30% have vulnerabilities

    return context;
  }

  /**
   * Find optimal intervention given constraints
   */
  findOptimalIntervention(
    objective: string,
    minimize: boolean = true,
    constraints: Map<string, { min?: number; max?: number }> = new Map(),
    possibleActions: string[] = []
  ): {
    bestAction: string;
    bestValue: number | null;
    expectedOutcome: number;
    tradeoffs: Map<string, number>;
  } {
    let bestAction = '';
    let bestValue: number | null = null;
    let bestOutcome = minimize ? Infinity : -Infinity;
    const tradeoffs = new Map<string, number>();

    // If no actions specified, use all action nodes
    if (possibleActions.length === 0) {
      for (const [id, node] of this.model.nodes) {
        if (node.type === 'action') {
          possibleActions.push(id);
        }
      }
    }

    // Test each possible action
    for (const action of possibleActions) {
      // Try different values (for binary actions, try 0 and 1)
      const valuesToTest = [0, 1]; // Simplified to binary for this example

      for (const value of valuesToTest) {
        // Check constraints
        const constraint = constraints.get(action);
        if (constraint) {
          if (constraint.min !== undefined && value < constraint.min) continue;
          if (constraint.max !== undefined && value > constraint.max) continue;
        }

        // Simulate intervention
        const context = this.generateRandomContext();
        const result = this.doIntervention(action, value, context);
        const outcome = result.get(objective) || 0;

        // Track tradeoffs
        for (const [key, val] of result) {
          if (key !== objective && typeof val === 'number') {
            const current = tradeoffs.get(key) || 0;
            tradeoffs.set(key, current + val);
          }
        }

        // Update best if improved
        if ((minimize && outcome < bestOutcome) || (!minimize && outcome > bestOutcome)) {
          bestAction = action;
          bestValue = value;
          bestOutcome = outcome;
        }
      }
    }

    // Normalize tradeoffs
    for (const [key, val] of tradeoffs) {
      tradeoffs.set(key, val / (possibleActions.length * 2));
    }

    return {
      bestAction,
      bestValue,
      expectedOutcome: bestOutcome,
      tradeoffs
    };
  }
}

// ─── Causal Discovery from Data ─────────────────────────────────────────────

export class CausalDiscovery {
  /**
   * Discover causal relationships from observational data
   * using constraint-based methods (simplified PC algorithm)
   */
  static discoverStructure(
    data: Array<Record<string, number>>,
    variables: string[],
    significanceLevel: number = 0.05
  ): {
    edges: Array<{ from: string; to: string; strength: number }>;
    confounders: string[];
    colliders: string[];
  } {
    const edges: Array<{ from: string; to: string; strength: number }> = [];
    const confounders: string[] = [];
    const colliders: string[] = [];

    // Step 1: Test conditional independence
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const varA = variables[i];
        const varB = variables[j];

        // Calculate correlation (simplified)
        const correlation = this.calculateCorrelation(data, varA, varB);

        if (Math.abs(correlation) > significanceLevel) {
          edges.push({
            from: varA,
            to: varB,
            strength: correlation
          });
        }
      }
    }

    // Step 2: Identify confounders and colliders (simplified)
    for (const variable of variables) {
      const incoming = edges.filter(e => e.to === variable).length;
      const outgoing = edges.filter(e => e.from === variable).length;

      if (incoming >= 2) {
        colliders.push(variable);
      }
      if (outgoing >= 2) {
        confounders.push(variable);
      }
    }

    return { edges, confounders, colliders };
  }

  /**
   * Calculate correlation between two variables
   */
  private static calculateCorrelation(
    data: Array<Record<string, number>>,
    varA: string,
    varB: string
  ): number {
    const n = data.length;
    if (n === 0) return 0;

    const valuesA = data.map(d => d[varA] || 0);
    const valuesB = data.map(d => d[varB] || 0);

    const meanA = valuesA.reduce((a, b) => a + b, 0) / n;
    const meanB = valuesB.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < n; i++) {
      const diffA = valuesA[i] - meanA;
      const diffB = valuesB[i] - meanB;
      numerator += diffA * diffB;
      denomA += diffA * diffA;
      denomB += diffB * diffB;
    }

    if (denomA === 0 || denomB === 0) return 0;
    return numerator / Math.sqrt(denomA * denomB);
  }
}

// ─── Security Decision Scenarios ─────────────────────────────────────────────

export class SecurityScenarios {
  private causalModel: SecurityCausalModel;

  constructor() {
    this.causalModel = new SecurityCausalModel();
  }

  /**
   * Analyze patch deployment decision
   */
  analyzePatchDecision(context: {
    vulnerabilitySeverity: 'low' | 'medium' | 'high' | 'critical';
    productionSystem: boolean;
    peakTrafficHours: boolean;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  }): {
    recommendation: 'patch_now' | 'patch_maintenance_window' | 'accept_risk';
    reasoning: string;
    riskComparison: {
      patchNow: { breachRisk: number; downtime: number; totalImpact: number };
      patchLater: { breachRisk: number; downtime: number; totalImpact: number };
      noAction: { breachRisk: number; downtime: number; totalImpact: number };
    };
  } {
    // Convert context to causal model inputs
    const severityMap = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    const dataMap = { public: 0.1, internal: 0.3, confidential: 0.6, restricted: 1.0 };

    const inputs = new Map<string, number>();
    inputs.set('vulnerability_exposure', severityMap[context.vulnerabilitySeverity]);
    inputs.set('data_sensitivity', dataMap[context.dataClassification]);
    inputs.set('network_exposure', context.productionSystem ? 0.9 : 0.3);
    inputs.set('attacker_capability', 0.6); // Assume medium sophistication

    // Scenario 1: Patch now
    const patchNow = this.causalModel.doIntervention('patch_deployment', 1, new Map(inputs));
    const patchNowImpact = {
      breachRisk: patchNow.get('breach_risk') || 0,
      downtime: context.peakTrafficHours ? 4 : 2, // Hours
      totalImpact: patchNow.get('business_impact') || 0
    };

    // Scenario 2: Patch in maintenance window (6 hours delay)
    inputs.set('vulnerability_exposure', severityMap[context.vulnerabilitySeverity] * 1.2); // Increased exposure
    const patchLater = this.causalModel.doIntervention('patch_deployment', 1, new Map(inputs));
    const patchLaterImpact = {
      breachRisk: (patchLater.get('breach_risk') || 0) * 1.5, // Higher risk due to delay
      downtime: 1, // Less downtime in maintenance window
      totalImpact: patchLater.get('business_impact') || 0
    };

    // Scenario 3: No action
    const noAction = this.causalModel.doIntervention('patch_deployment', 0, new Map(inputs));
    const noActionImpact = {
      breachRisk: noAction.get('breach_risk') || 0,
      downtime: 0,
      totalImpact: noAction.get('business_impact') || 0
    };

    // Make recommendation
    const impacts = [
      { action: 'patch_now' as const, impact: patchNowImpact.totalImpact },
      { action: 'patch_maintenance_window' as const, impact: patchLaterImpact.totalImpact },
      { action: 'accept_risk' as const, impact: noActionImpact.totalImpact }
    ];

    const bestAction = impacts.reduce((min, curr) =>
      curr.impact < min.impact ? curr : min
    );

    const recommendation = bestAction.action;

    // Generate reasoning
    let reasoning: string;
    if (recommendation === 'patch_now') {
      reasoning = `Immediate patching recommended despite potential downtime. The ${context.vulnerabilitySeverity} severity vulnerability on a ${context.dataClassification} data system poses significant risk that outweighs ${patchNowImpact.downtime}h downtime.`;
    } else if (recommendation === 'patch_maintenance_window') {
      reasoning = `Defer patching to maintenance window. The risk increase over 6 hours is acceptable given the ${patchNowImpact.downtime - patchLaterImpact.downtime}h downtime reduction during peak hours.`;
    } else {
      reasoning = `Risk acceptance recommended. The vulnerability's low exploitability (${(noActionImpact.breachRisk * 100).toFixed(1)}%) doesn't justify the operational disruption of patching.`;
    }

    return {
      recommendation,
      reasoning,
      riskComparison: {
        patchNow: patchNowImpact,
        patchLater: patchLaterImpact,
        noAction: noActionImpact
      }
    };
  }

  /**
   * Analyze secret rotation decision
   */
  analyzeSecretRotation(context: {
    exposureType: 'public_repo' | 'logs' | 'suspected' | 'confirmed_breach';
    secretType: 'api_key' | 'database' | 'encryption_key' | 'certificate';
    dependentServices: number;
    lastRotation: number; // Days ago
  }): {
    urgency: 'immediate' | 'scheduled' | 'monitor';
    estimatedImpact: {
      serviceDisruption: string;
      securityRisk: string;
      operationalCost: number;
    };
    strategy: string[];
  } {
    const exposureRisk = {
      public_repo: 0.9,
      logs: 0.6,
      suspected: 0.4,
      confirmed_breach: 1.0
    };

    const secretCriticality = {
      api_key: 0.5,
      database: 0.9,
      encryption_key: 1.0,
      certificate: 0.7
    };

    const risk = exposureRisk[context.exposureType] * secretCriticality[context.secretType];
    const staleness = Math.min(1, context.lastRotation / 365); // Normalize to 0-1

    let urgency: 'immediate' | 'scheduled' | 'monitor';
    let strategy: string[] = [];

    if (risk > 0.8 || context.exposureType === 'confirmed_breach') {
      urgency = 'immediate';
      strategy = [
        'Initiate emergency rotation procedure',
        'Notify affected service owners',
        'Prepare rollback plan',
        'Monitor for unauthorized access during rotation'
      ];
    } else if (risk > 0.5 || staleness > 0.5) {
      urgency = 'scheduled';
      strategy = [
        'Schedule rotation for next maintenance window',
        'Coordinate with service teams',
        'Test rotation in staging environment',
        'Prepare gradual rollout plan'
      ];
    } else {
      urgency = 'monitor';
      strategy = [
        'Add secret to monitoring watchlist',
        'Review access logs for anomalies',
        'Plan rotation for next quarter',
        'Document secret dependencies'
      ];
    }

    const serviceDisruption = context.dependentServices > 10
      ? 'High - Multiple service restarts required'
      : context.dependentServices > 3
      ? 'Medium - Coordinated restart needed'
      : 'Low - Minimal service impact';

    const securityRisk = risk > 0.8
      ? 'Critical - Immediate exploitation possible'
      : risk > 0.5
      ? 'High - Exploitation likely within days'
      : 'Medium - Preventive measure recommended';

    const operationalCost = context.dependentServices * 1000 * risk; // $ estimate

    return {
      urgency,
      estimatedImpact: {
        serviceDisruption,
        securityRisk,
        operationalCost
      },
      strategy
    };
  }
}

// ─── Export Schemas for API Validation ──────────────────────────────────────

export const CausalAnalysisRequestSchema = z.object({
  scenario: z.enum(['patch_decision', 'secret_rotation', 'incident_response']),
  context: z.record(z.string(), z.any()),
  objective: z.string().optional(),
  constraints: z.record(z.string(), z.object({
    min: z.number().optional(),
    max: z.number().optional()
  })).optional()
});

export const CausalAnalysisResponseSchema = z.object({
  recommendation: z.string(),
  reasoning: z.string(),
  counterfactuals: z.array(z.object({
    scenario: z.string(),
    probability: z.number(),
    impact: z.number()
  })),
  confidence: z.number(),
  tradeoffs: z.record(z.string(), z.number())
});

export type CausalAnalysisRequest = z.infer<typeof CausalAnalysisRequestSchema>;
export type CausalAnalysisResponse = z.infer<typeof CausalAnalysisResponseSchema>;