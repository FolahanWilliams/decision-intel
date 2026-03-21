/**
 * True Causal Inference Engine
 *
 * Implements Pearl's Causal Hierarchy with:
 * - Association (seeing): P(Y|X)
 * - Intervention (doing): P(Y|do(X))
 * - Counterfactuals (imagining): P(Y_x|X',Y')
 *
 * Based on Judea Pearl's "The Book of Why" and structural causal models
 */

import { z } from 'zod';

// ─── Core Causal Structures ──────────────────────────────────────────────────

export interface CausalVariable {
  id: string;
  name: string;
  type: 'continuous' | 'binary' | 'categorical' | 'ordinal';
  observed: boolean;
  domain?: number[] | string[];
  distribution?: 'normal' | 'bernoulli' | 'poisson' | 'uniform';
  parameters?: Record<string, number>;
}

export interface StructuralEquation {
  target: string;
  parents: string[];
  equation: (parentValues: Map<string, number>, noise: number) => number;
  noiseDistribution: {
    type: 'normal' | 'uniform' | 'bernoulli';
    parameters: Record<string, number>;
  };
}

export interface CausalDAG {
  variables: Map<string, CausalVariable>;
  edges: Array<{ from: string; to: string; strength?: number }>;
  equations: Map<string, StructuralEquation>;
  latentConfounders?: Array<{ affects: string[] }>;
}

// ─── Pearl's Causal Hierarchy ────────────────────────────────────────────────

export class TrueCausalEngine {
  private dag: CausalDAG;
  private data: Array<Record<string, number>> = [];

  constructor(dag: CausalDAG) {
    this.dag = dag;
    this.validateDAG();
  }

  /**
   * Validate that the graph is acyclic
   */
  private validateDAG(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const children = this.dag.edges
        .filter(e => e.from === node)
        .map(e => e.to);

      for (const child of children) {
        if (!visited.has(child)) {
          if (hasCycle(child)) return true;
        } else if (recursionStack.has(child)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const [varId] of this.dag.variables) {
      if (!visited.has(varId) && hasCycle(varId)) {
        throw new Error('Causal graph contains cycles - not a valid DAG');
      }
    }
  }

  /**
   * Level 1: Association - P(Y|X)
   * Observational probability from data
   */
  association(
    Y: string,
    X: string,
    value: number,
    conditions: Map<string, number> = new Map()
  ): number {
    if (this.data.length === 0) {
      throw new Error('No observational data available');
    }

    // Filter data based on conditions
    let filteredData = this.data;
    for (const [condVar, condVal] of conditions) {
      filteredData = filteredData.filter(row => row[condVar] === condVal);
    }

    // Filter for X = value
    const xData = filteredData.filter(row => row[X] === value);
    if (xData.length === 0) return 0;

    // Calculate P(Y|X=value)
    const yVariable = this.dag.variables.get(Y);
    if (!yVariable) throw new Error(`Variable ${Y} not found`);

    if (yVariable.type === 'binary') {
      return xData.filter(row => row[Y] === 1).length / xData.length;
    } else if (yVariable.type === 'continuous') {
      // Return mean for continuous variables
      return xData.reduce((sum, row) => sum + (row[Y] || 0), 0) / xData.length;
    }

    return 0;
  }

  /**
   * Level 2: Intervention - P(Y|do(X))
   * Uses backdoor criterion and do-calculus
   */
  intervention(
    Y: string,
    X: string,
    value: number,
    method: 'backdoor' | 'frontdoor' | 'instrumental' = 'backdoor'
  ): number {
    if (method === 'backdoor') {
      return this.backdoorAdjustment(Y, X, value);
    } else if (method === 'frontdoor') {
      return this.frontdoorAdjustment(Y, X, value);
    } else {
      return this.instrumentalVariable(Y, X, value);
    }
  }

  /**
   * Backdoor Criterion and Adjustment Formula
   */
  private backdoorAdjustment(Y: string, X: string, value: number): number {
    // Find backdoor paths from X to Y
    const backdoorPaths = this.findBackdoorPaths(X, Y);

    // Find minimal adjustment set
    const adjustmentSet = this.findMinimalAdjustmentSet(X, Y, backdoorPaths);

    if (adjustmentSet.size === 0) {
      // No confounding - causal effect equals association
      return this.association(Y, X, value);
    }

    // Apply backdoor adjustment formula:
    // P(Y|do(X)) = Σ_z P(Y|X,Z=z) * P(Z=z)
    let causalEffect = 0;

    // For simplicity, assume binary confounders
    const adjustmentVars = Array.from(adjustmentSet);
    const configurations = this.generateConfigurations(adjustmentVars);

    for (const config of configurations) {
      const conditions = new Map(config);

      // P(Y|X,Z)
      const conditional = this.association(Y, X, value, conditions);

      // P(Z)
      const prior = this.calculateJointProbability(conditions);

      causalEffect += conditional * prior;
    }

    return causalEffect;
  }

  /**
   * Find all backdoor paths between X and Y
   */
  private findBackdoorPaths(X: string, Y: string): string[][] {
    const paths: string[][] = [];

    // Find parents of X (backdoor starts with arrow into X)
    const xParents = this.dag.edges
      .filter(e => e.to === X)
      .map(e => e.from);

    for (const parent of xParents) {
      // Find all paths from parent to Y
      const parentPaths = this.findAllPaths(parent, Y, new Set([X]));
      for (const path of parentPaths) {
        paths.push([X, parent, ...path]);
      }
    }

    return paths;
  }

  /**
   * Find all paths between two nodes
   */
  private findAllPaths(
    start: string,
    end: string,
    visited: Set<string> = new Set()
  ): string[][] {
    if (start === end) return [[]];

    visited.add(start);
    const paths: string[][] = [];

    // Consider all neighbors (both directions for undirected paths)
    const neighbors = [
      ...this.dag.edges.filter(e => e.from === start).map(e => e.to),
      ...this.dag.edges.filter(e => e.to === start).map(e => e.from)
    ];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const subPaths = this.findAllPaths(neighbor, end, new Set(visited));
        for (const subPath of subPaths) {
          paths.push([neighbor, ...subPath]);
        }
      }
    }

    return paths;
  }

  /**
   * Find minimal adjustment set using backdoor criterion
   */
  private findMinimalAdjustmentSet(
    X: string,
    Y: string,
    backdoorPaths: string[][]
  ): Set<string> {
    const adjustmentSet = new Set<string>();

    // For each backdoor path, find variables that block it
    for (const path of backdoorPaths) {
      // Check if path is already blocked by current adjustment set
      if (!this.isPathBlocked(path, adjustmentSet)) {
        // Find a variable to block this path
        for (const node of path) {
          if (node !== X && node !== Y) {
            adjustmentSet.add(node);
            break;
          }
        }
      }
    }

    // Remove descendants of X (they should not be adjusted for)
    const xDescendants = this.findDescendants(X);
    for (const desc of xDescendants) {
      adjustmentSet.delete(desc);
    }

    return adjustmentSet;
  }

  /**
   * Check if a path is blocked by adjustment set
   */
  private isPathBlocked(path: string[], adjustmentSet: Set<string>): boolean {
    // A path is blocked if it contains a collider not in adjustment set
    // or a non-collider in the adjustment set

    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];

      const isCollider = this.isCollider(prev, curr, next);

      if (isCollider && !adjustmentSet.has(curr)) {
        return true; // Collider blocks the path
      }
      if (!isCollider && adjustmentSet.has(curr)) {
        return true; // Non-collider in adjustment set blocks the path
      }
    }

    return false;
  }

  /**
   * Check if a node is a collider on a path
   */
  private isCollider(prev: string, curr: string, next: string): boolean {
    const prevToCurr = this.dag.edges.some(e => e.from === prev && e.to === curr);
    const nextToCurr = this.dag.edges.some(e => e.from === next && e.to === curr);
    return prevToCurr && nextToCurr;
  }

  /**
   * Front-door Criterion and Adjustment
   */
  private frontdoorAdjustment(Y: string, X: string, value: number): number {
    // Find mediator M between X and Y
    const mediators = this.findMediators(X, Y);

    if (mediators.length === 0) {
      throw new Error('No mediator found for front-door adjustment');
    }

    const M = mediators[0]; // Use first mediator

    // Front-door formula:
    // P(Y|do(X)) = Σ_m P(M=m|X) * Σ_x' P(Y|M=m,X=x') * P(X=x')

    let causalEffect = 0;
    const mValues = this.getVariableValues(M);
    const xValues = this.getVariableValues(X);

    for (const m of mValues) {
      // P(M=m|X)
      const probMGivenX = this.association(M, X, value);

      let innerSum = 0;
      for (const xPrime of xValues) {
        // P(Y|M=m,X=x')
        const conditions = new Map([[M, m], [X, xPrime]]);
        const probYGivenMX = this.association(Y, X, xPrime, conditions);

        // P(X=x')
        const probX = this.data.filter(row => row[X] === xPrime).length / this.data.length;

        innerSum += probYGivenMX * probX;
      }

      causalEffect += probMGivenX * innerSum;
    }

    return causalEffect;
  }

  /**
   * Instrumental Variable Method
   */
  private instrumentalVariable(Y: string, X: string, value: number): number {
    // Find instrumental variable Z
    const instruments = this.findInstruments(X, Y);

    if (instruments.length === 0) {
      throw new Error('No instrumental variable found');
    }

    const Z = instruments[0];

    // IV estimator: β = Cov(Z,Y) / Cov(Z,X)
    // Calculate covariance inline
    const calculateCov = (A: string, B: string): number => {
      if (this.data.length === 0) return 0;
      const aValues = this.data.map(row => row[A] || 0);
      const bValues = this.data.map(row => row[B] || 0);
      const aMean = aValues.reduce((a, b) => a + b, 0) / aValues.length;
      const bMean = bValues.reduce((a, b) => a + b, 0) / bValues.length;
      let cov = 0;
      for (let i = 0; i < aValues.length; i++) {
        cov += (aValues[i] - aMean) * (bValues[i] - bMean);
      }
      return cov / aValues.length;
    };

    const covZY = calculateCov(Z, Y);
    const covZX = calculateCov(Z, X);

    if (covZX === 0) {
      throw new Error('Weak instrument - no correlation with treatment');
    }

    const effect = covZY / covZX;

    // For binary treatment, return probability
    return Math.max(0, Math.min(1, effect * value));
  }

  /**
   * Level 3: Counterfactuals - P(Y_x | X', Y')
   * What would Y be if X had been x, given observations
   */
  counterfactual(
    query: { variable: string; intervention: number },
    evidence: Map<string, number>
  ): {
    probability: number;
    explanation: string;
    confidence: number;
  } {
    // Step 1: Abduction - Infer noise terms from evidence
    const noiseTerms = this.abduction(evidence);

    // Step 2: Action - Apply intervention
    const modifiedEquations = this.applyIntervention(
      query.variable,
      query.intervention
    );

    // Step 3: Prediction - Compute counterfactual outcome
    const outcome = this.prediction(
      query.variable,
      modifiedEquations,
      noiseTerms
    );

    // Calculate confidence based on identifiability
    // Simple confidence calculation based on data availability
    const confidence = this.data.length > 100 ? 0.9 :
                      this.data.length > 50 ? 0.7 :
                      this.data.length > 10 ? 0.5 : 0.3;

    return {
      probability: outcome,
      explanation: `Counterfactual analysis: If ${query.variable} were set to ${query.intervention}, the outcome would change with probability ${outcome.toFixed(2)}`,
      confidence
    };
  }

  /**
   * Abduction: Infer noise terms from observations
   */
  private abduction(evidence: Map<string, number>): Map<string, number> {
    const noiseTerms = new Map<string, number>();

    for (const [varId, equation] of this.dag.equations) {
      if (evidence.has(varId)) {
        // Solve for noise: observed = f(parents, noise)
        const parentValues = new Map<string, number>();
        for (const parent of equation.parents) {
          parentValues.set(parent, evidence.get(parent) || 0);
        }

        // Inverse function to find noise
        const observed = evidence.get(varId) ?? 0;
        const predicted = equation.equation(parentValues, 0);
        const noise = observed - predicted; // Simplified for linear case

        noiseTerms.set(varId, noise);
      }
    }

    return noiseTerms;
  }

  /**
   * Apply intervention by modifying structural equations
   */
  private applyIntervention(
    variable: string,
    value: number
  ): Map<string, StructuralEquation> {
    const modified = new Map(this.dag.equations);

    // Replace equation for intervened variable
    modified.set(variable, {
      target: variable,
      parents: [],
      equation: () => value,
      noiseDistribution: {
        type: 'uniform',
        parameters: { min: 0, max: 0 }
      }
    });

    return modified;
  }

  /**
   * Prediction: Forward propagate with modified equations
   */
  private prediction(
    targetVariable: string,
    equations: Map<string, StructuralEquation>,
    noiseTerms: Map<string, number>
  ): number {
    const values = new Map<string, number>();
    const computed = new Set<string>();

    // Topological sort for computation order
    const order = this.topologicalSort();

    for (const varId of order) {
      if (!computed.has(varId)) {
        const equation = equations.get(varId);
        if (!equation) continue;

        const parentValues = new Map<string, number>();
        for (const parent of equation.parents) {
          parentValues.set(parent, values.get(parent) || 0);
        }

        const noise = noiseTerms.get(varId) || 0;
        const value = equation.equation(parentValues, noise);
        values.set(varId, value);
        computed.add(varId);
      }
    }

    return values.get(targetVariable) || 0;
  }

  /**
   * Topological sort of DAG
   */
  private topologicalSort(): string[] {
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);

      const children = this.dag.edges
        .filter(e => e.from === node)
        .map(e => e.to);

      for (const child of children) {
        visit(child);
      }

      stack.push(node);
    };

    for (const [varId] of this.dag.variables) {
      visit(varId);
    }

    return stack.reverse();
  }

  /**
   * Find mediators between X and Y
   */
  private findMediators(X: string, Y: string): string[] {
    const mediators: string[] = [];

    for (const [varId] of this.dag.variables) {
      if (varId === X || varId === Y) continue;

      // Check if var is on a directed path from X to Y
      const xToVar = this.hasDirectedPath(X, varId);
      const varToY = this.hasDirectedPath(varId, Y);

      if (xToVar && varToY) {
        mediators.push(varId);
      }
    }

    return mediators;
  }

  /**
   * Find instrumental variables for X->Y
   */
  private findInstruments(X: string, Y: string): string[] {
    const instruments: string[] = [];

    for (const [varId] of this.dag.variables) {
      if (varId === X || varId === Y) continue;

      // Z is instrument if:
      // 1. Z -> X (affects treatment)
      // 2. Z ⊥ Y | X (no direct effect on outcome except through X)
      // 3. Z ⊥ U (no common causes with Y)

      const affectsX = this.hasDirectedPath(varId, X);
      const directToY = this.hasDirectedPath(varId, Y);
      const commonCause = this.hasCommonCause(varId, Y);

      if (affectsX && !directToY && !commonCause) {
        instruments.push(varId);
      }
    }

    return instruments;
  }

  /**
   * Check if there's a directed path from start to end
   */
  private hasDirectedPath(start: string, end: string): boolean {
    const visited = new Set<string>();
    const queue = [start];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === end) return true;

      if (visited.has(current)) continue;
      visited.add(current);

      const children = this.dag.edges
        .filter(e => e.from === current)
        .map(e => e.to);

      queue.push(...children);
    }

    return false;
  }

  /**
   * Check if two variables have a common cause
   */
  private hasCommonCause(X: string, Y: string): boolean {
    const xAncestors = this.findAncestors(X);
    const yAncestors = this.findAncestors(Y);

    for (const ancestor of xAncestors) {
      if (yAncestors.has(ancestor)) return true;
    }

    return false;
  }

  /**
   * Find all ancestors of a variable
   */
  private findAncestors(variable: string): Set<string> {
    const ancestors = new Set<string>();
    const queue = [variable];

    while (queue.length > 0) {
      const current = queue.shift()!;

      const parents = this.dag.edges
        .filter(e => e.to === current)
        .map(e => e.from);

      for (const parent of parents) {
        if (!ancestors.has(parent)) {
          ancestors.add(parent);
          queue.push(parent);
        }
      }
    }

    return ancestors;
  }

  /**
   * Find all descendants of a variable
   */
  private findDescendants(variable: string): Set<string> {
    const descendants = new Set<string>();
    const queue = [variable];

    while (queue.length > 0) {
      const current = queue.shift()!;

      const children = this.dag.edges
        .filter(e => e.from === current)
        .map(e => e.to);

      for (const child of children) {
        if (!descendants.has(child)) {
          descendants.add(child);
          queue.push(child);
        }
      }
    }

    return descendants;
  }

  // ─── Helper Methods ──────────────────────────────────────────────────────────

  private generateConfigurations(variables: string[]): Array<[string, number][]> {
    if (variables.length === 0) return [[]];

    const [first, ...rest] = variables;
    const restConfigs = this.generateConfigurations(rest);
    const configs: Array<[string, number][]> = [];

    const values = this.getVariableValues(first);
    for (const value of values) {
      for (const restConfig of restConfigs) {
        configs.push([[first, value], ...restConfig]);
      }
    }

    return configs;
  }

  private getVariableValues(varId: string): number[] {
    const variable = this.dag.variables.get(varId);
    if (!variable) return [];

    if (variable.type === 'binary') return [0, 1];
    if (variable.domain) {
      return variable.domain.map(v => typeof v === 'number' ? v : parseFloat(v) || 0);
    }

    // For continuous, return discretized values
    return [0, 0.25, 0.5, 0.75, 1];
  }

  private calculateJointProbability(conditions: Map<string, number>): number {
    if (this.data.length === 0) return 1 / Math.pow(2, conditions.size);

    const matching = this.data.filter(row => {
      for (const [varName, val] of conditions) {
        if (row[varName] !== val) return false;
      }
      return true;
    });

    return matching.length / this.data.length;
  }






  /**
   * Load observational data for analysis
   */
  loadData(data: Array<Record<string, number>>): void {
    this.data = data;
  }

  /**
   * Generate synthetic data from the causal model
   */
  generateData(samples: number = 1000): Array<Record<string, number>> {
    const data: Array<Record<string, number>> = [];

    for (let i = 0; i < samples; i++) {
      const sample: Record<string, number> = {};
      const order = this.topologicalSort();

      for (const varId of order) {
        const equation = this.dag.equations.get(varId);
        if (!equation) continue;

        const parentValues = new Map<string, number>();
        for (const parent of equation.parents) {
          parentValues.set(parent, sample[parent] || 0);
        }

        const noise = this.sampleNoise(equation.noiseDistribution);
        sample[varId] = equation.equation(parentValues, noise);
      }

      data.push(sample);
    }

    this.data = data;
    return data;
  }

  private sampleNoise(distribution: StructuralEquation['noiseDistribution']): number {
    switch (distribution.type) {
      case 'normal':
        return this.sampleNormal(
          distribution.parameters.mean || 0,
          distribution.parameters.std || 1
        );
      case 'uniform':
        return this.sampleUniform(
          distribution.parameters.min || 0,
          distribution.parameters.max || 1
        );
      case 'bernoulli':
        return Math.random() < (distribution.parameters.p || 0.5) ? 1 : 0;
      default:
        return 0;
    }
  }

  private sampleNormal(mean: number, std: number): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * std + mean;
  }

  private sampleUniform(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}

// ─── Security-Specific Causal Model ─────────────────────────────────────────

export function createSecurityCausalModel(): TrueCausalEngine {
  const dag: CausalDAG = {
    variables: new Map([
      ['vulnerability_severity', {
        id: 'vulnerability_severity',
        name: 'Vulnerability Severity',
        type: 'ordinal',
        observed: true,
        domain: [0, 1, 2, 3, 4] // low to critical
      }],
      ['patch_deployed', {
        id: 'patch_deployed',
        name: 'Patch Deployed',
        type: 'binary',
        observed: true
      }],
      ['attacker_sophistication', {
        id: 'attacker_sophistication',
        name: 'Attacker Sophistication',
        type: 'continuous',
        observed: false,
        distribution: 'normal',
        parameters: { mean: 0.5, std: 0.2 }
      }],
      ['network_exposure', {
        id: 'network_exposure',
        name: 'Network Exposure',
        type: 'continuous',
        observed: true
      }],
      ['breach_occurred', {
        id: 'breach_occurred',
        name: 'Breach Occurred',
        type: 'binary',
        observed: true
      }],
      ['downtime_hours', {
        id: 'downtime_hours',
        name: 'Downtime Hours',
        type: 'continuous',
        observed: true
      }],
      ['financial_impact', {
        id: 'financial_impact',
        name: 'Financial Impact',
        type: 'continuous',
        observed: true
      }],
      ['data_sensitivity', {
        id: 'data_sensitivity',
        name: 'Data Sensitivity',
        type: 'ordinal',
        observed: true,
        domain: [0, 1, 2, 3] // public, internal, confidential, restricted
      }],
      ['alert_fatigue', {
        id: 'alert_fatigue',
        name: 'Alert Fatigue Level',
        type: 'continuous',
        observed: true
      }],
      ['decision_quality', {
        id: 'decision_quality',
        name: 'Decision Quality',
        type: 'continuous',
        observed: true
      }]
    ]),

    edges: [
      { from: 'vulnerability_severity', to: 'breach_occurred' },
      { from: 'patch_deployed', to: 'breach_occurred' },
      { from: 'patch_deployed', to: 'downtime_hours' },
      { from: 'attacker_sophistication', to: 'breach_occurred' },
      { from: 'network_exposure', to: 'breach_occurred' },
      { from: 'breach_occurred', to: 'financial_impact' },
      { from: 'downtime_hours', to: 'financial_impact' },
      { from: 'data_sensitivity', to: 'financial_impact' },
      { from: 'alert_fatigue', to: 'decision_quality' },
      { from: 'decision_quality', to: 'patch_deployed' }
    ],

    equations: new Map([
      ['breach_occurred', {
        target: 'breach_occurred',
        parents: ['vulnerability_severity', 'patch_deployed', 'attacker_sophistication', 'network_exposure'],
        equation: (parents, noise) => {
          const vulnSeverity = parents.get('vulnerability_severity') || 0;
          const patchDeployed = parents.get('patch_deployed') ? 1 : 0;
          const attackerSoph = parents.get('attacker_sophistication') || 0.5;
          const networkExp = parents.get('network_exposure') || 0.5;

          // Logistic function for breach probability
          const logit = -2 +
            0.8 * vulnSeverity -
            3 * patchDeployed +
            2 * attackerSoph +
            1.5 * networkExp +
            noise;

          const probability = 1 / (1 + Math.exp(-logit));
          return Math.random() < probability ? 1 : 0;
        },
        noiseDistribution: { type: 'normal', parameters: { mean: 0, std: 0.5 } }
      }],
      ['financial_impact', {
        target: 'financial_impact',
        parents: ['breach_occurred', 'downtime_hours', 'data_sensitivity'],
        equation: (parents, noise) => {
          const breach = parents.get('breach_occurred') || 0;
          const downtime = parents.get('downtime_hours') || 0;
          const dataSens = parents.get('data_sensitivity') || 0;

          // Financial impact in millions
          const breachCost = breach * (1 + dataSens) * 2; // $2-8M for breach
          const downtimeCost = downtime * 0.01; // $10k per hour

          return Math.max(0, breachCost + downtimeCost + noise);
        },
        noiseDistribution: { type: 'normal', parameters: { mean: 0, std: 0.2 } }
      }],
      ['patch_deployed', {
        target: 'patch_deployed',
        parents: ['decision_quality'],
        equation: (parents, noise) => {
          const quality = parents.get('decision_quality') || 0.5;
          const probability = quality + noise;
          return Math.random() < probability ? 1 : 0;
        },
        noiseDistribution: { type: 'normal', parameters: { mean: 0, std: 0.1 } }
      }],
      ['downtime_hours', {
        target: 'downtime_hours',
        parents: ['patch_deployed'],
        equation: (parents, noise) => {
          const patched = parents.get('patch_deployed') || 0;
          return patched ? Math.max(0, 2 + noise) : 0; // 2 hours average if patched
        },
        noiseDistribution: { type: 'normal', parameters: { mean: 0, std: 1 } }
      }],
      ['decision_quality', {
        target: 'decision_quality',
        parents: ['alert_fatigue'],
        equation: (parents, noise) => {
          const fatigue = parents.get('alert_fatigue') || 0;
          return Math.max(0, Math.min(1, 0.9 - 0.5 * fatigue + noise));
        },
        noiseDistribution: { type: 'normal', parameters: { mean: 0, std: 0.1 } }
      }]
    ]),

    latentConfounders: [
      { affects: ['attacker_sophistication', 'network_exposure'] } // Threat landscape
    ]
  };

  return new TrueCausalEngine(dag);
}

// ─── Export Types and Utilities ─────────────────────────────────────────────

export const CausalQuerySchema = z.object({
  queryType: z.enum(['association', 'intervention', 'counterfactual']),
  target: z.string(),
  intervention: z.object({
    variable: z.string(),
    value: z.any()
  }).optional(),
  conditions: z.record(z.string(), z.any()).optional(),
  evidence: z.record(z.string(), z.any()).optional()
});

export type CausalQuery = z.infer<typeof CausalQuerySchema>;