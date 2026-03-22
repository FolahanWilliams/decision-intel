/**
 * Tests for Meeting Decision Quality Predictor
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  predictMeetingQuality,
  calculateDissentRatio,
  calculateSpeakerBalance,
  calculateBiasDensity,
  calculateDecisionExplicitness,
  calculateRiskDiscussion,
  calculateEngagementQuality,
  generateRecommendations,
  type QualitySignal,
  type QualityPrediction,
} from './quality-predictor';
import type { SpeakerBiasProfile, KeyDecision, MeetingSummary } from './intelligence';

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Meeting Quality Predictor', () => {
  const createMockSpeaker = (
    name: string,
    talkTime: number,
    biases: Record<string, number> = {}
  ): SpeakerBiasProfile => ({
    name,
    talkTimeSeconds: talkTime,
    interruptionCount: 0,
    biasScores: biases,
    statements: [],
  });

  const createMockDecision = (
    explicit: boolean,
    hasRationale: boolean,
    dissent: number = 0
  ): KeyDecision => ({
    decision: 'Test decision',
    timestamp: '00:15:00',
    speaker: 'John',
    explicitDecision: explicit,
    rationale: hasRationale ? 'Because of reasons' : undefined,
    dissentLevel: dissent,
    biasesPresent: [],
  });

  const createMockSummary = (hasRisks: boolean): MeetingSummary => ({
    objective: 'Test meeting',
    keyPoints: ['Point 1', 'Point 2'],
    decisions: ['Decision 1'],
    risks: hasRisks ? ['Risk 1', 'Risk 2'] : [],
    nextSteps: ['Action 1'],
  });

  describe('calculateDissentRatio', () => {
    it('should calculate healthy dissent ratio', () => {
      const decisions = [
        createMockDecision(true, true, 3),
        createMockDecision(true, true, 2),
        createMockDecision(true, false, 0),
        createMockDecision(true, true, 4),
      ];

      const signal = calculateDissentRatio(decisions);

      expect(signal.signal).toBe('dissentRatio');
      expect(signal.value).toBe(0.75); // 3 out of 4 have dissent
      expect(signal.impact).toBeGreaterThan(0); // Positive impact for healthy dissent
    });

    it('should penalize no dissent', () => {
      const decisions = [
        createMockDecision(true, true, 0),
        createMockDecision(true, true, 0),
      ];

      const signal = calculateDissentRatio(decisions);

      expect(signal.value).toBe(0);
      expect(signal.impact).toBeLessThan(0); // Negative impact for no dissent
    });

    it('should handle empty decisions', () => {
      const signal = calculateDissentRatio([]);

      expect(signal.value).toBe(0);
      expect(signal.impact).toBe(0);
    });
  });

  describe('calculateSpeakerBalance', () => {
    it('should calculate balanced participation', () => {
      const speakers = [
        createMockSpeaker('Alice', 300),
        createMockSpeaker('Bob', 280),
        createMockSpeaker('Charlie', 320),
        createMockSpeaker('Diana', 290),
      ];

      const signal = calculateSpeakerBalance(speakers);

      expect(signal.signal).toBe('speakerBalance');
      expect(signal.value).toBeGreaterThan(0.9); // High balance
      expect(signal.impact).toBeGreaterThan(0); // Positive impact
    });

    it('should penalize speaker dominance', () => {
      const speakers = [
        createMockSpeaker('Alice', 600),
        createMockSpeaker('Bob', 100),
        createMockSpeaker('Charlie', 80),
        createMockSpeaker('Diana', 50),
      ];

      const signal = calculateSpeakerBalance(speakers);

      expect(signal.value).toBeLessThan(0.5); // Low balance
      expect(signal.impact).toBeLessThan(0); // Negative impact
    });

    it('should handle single speaker', () => {
      const speakers = [createMockSpeaker('Alice', 600)];

      const signal = calculateSpeakerBalance(speakers);

      expect(signal.value).toBe(0); // No balance with one speaker
      expect(signal.impact).toBeLessThan(-5); // Strong negative impact
    });
  });

  describe('calculateBiasDensity', () => {
    it('should calculate low bias density', () => {
      const speakers = [
        createMockSpeaker('Alice', 300, { confirmatoryBias: 2, groupthink: 1 }),
        createMockSpeaker('Bob', 280, { availabilityHeuristic: 2 }),
      ];

      const signal = calculateBiasDensity(speakers);

      expect(signal.signal).toBe('biasDensity');
      expect(signal.value).toBeLessThan(3); // Low average bias
      expect(signal.impact).toBeGreaterThan(0); // Positive impact for low bias
    });

    it('should penalize high bias density', () => {
      const speakers = [
        createMockSpeaker('Alice', 300, { confirmatoryBias: 8, groupthink: 7 }),
        createMockSpeaker('Bob', 280, { availabilityHeuristic: 9, anchoringBias: 8 }),
      ];

      const signal = calculateBiasDensity(speakers);

      expect(signal.value).toBeGreaterThan(7); // High average bias
      expect(signal.impact).toBeLessThan(-5); // Strong negative impact
    });

    it('should weight by speaker talk time', () => {
      const speakers = [
        createMockSpeaker('Alice', 500, { confirmatoryBias: 9 }), // Dominant speaker with high bias
        createMockSpeaker('Bob', 100, { confirmatoryBias: 1 }), // Minor speaker with low bias
      ];

      const signal = calculateBiasDensity(speakers);

      expect(signal.value).toBeCloseTo(7.67, 1); // Weighted towards dominant speaker
    });
  });

  describe('calculateDecisionExplicitness', () => {
    it('should reward explicit decisions with rationale', () => {
      const decisions = [
        createMockDecision(true, true),
        createMockDecision(true, true),
        createMockDecision(true, false),
      ];

      const signal = calculateDecisionExplicitness(decisions);

      expect(signal.value).toBeCloseTo(0.83, 2); // (1+1+0.5)/3
      expect(signal.impact).toBeGreaterThan(0);
    });

    it('should penalize implicit decisions', () => {
      const decisions = [
        createMockDecision(false, false),
        createMockDecision(false, false),
        createMockDecision(true, false),
      ];

      const signal = calculateDecisionExplicitness(decisions);

      expect(signal.value).toBeCloseTo(0.17, 2); // Only 1 partially explicit
      expect(signal.impact).toBeLessThan(0);
    });
  });

  describe('calculateRiskDiscussion', () => {
    it('should reward risk acknowledgment', () => {
      const summary = createMockSummary(true);
      const decisions = [
        createMockDecision(true, true, 3),
        createMockDecision(true, true, 2),
      ];

      const signal = calculateRiskDiscussion(summary, decisions);

      expect(signal.value).toBe(1); // Risks discussed
      expect(signal.impact).toBeGreaterThan(0);
    });

    it('should penalize lack of risk discussion', () => {
      const summary = createMockSummary(false);
      const decisions = [
        createMockDecision(true, true, 0),
        createMockDecision(true, true, 0),
      ];

      const signal = calculateRiskDiscussion(summary, decisions);

      expect(signal.value).toBe(0); // No risks discussed
      expect(signal.impact).toBeLessThan(0);
    });
  });

  describe('calculateEngagementQuality', () => {
    it('should calculate high engagement quality', () => {
      const speakers = [
        { ...createMockSpeaker('Alice', 300), interruptionCount: 1 },
        { ...createMockSpeaker('Bob', 280), interruptionCount: 2 },
        { ...createMockSpeaker('Charlie', 290), interruptionCount: 1 },
      ];

      const totalDuration = 900;
      const signal = calculateEngagementQuality(speakers, totalDuration);

      expect(signal.value).toBeGreaterThan(0.8); // High quality
      expect(signal.impact).toBeGreaterThan(0);
    });

    it('should penalize excessive interruptions', () => {
      const speakers = [
        { ...createMockSpeaker('Alice', 300), interruptionCount: 10 },
        { ...createMockSpeaker('Bob', 280), interruptionCount: 15 },
      ];

      const totalDuration = 600;
      const signal = calculateEngagementQuality(speakers, totalDuration);

      expect(signal.value).toBeLessThan(0.5); // Low quality
      expect(signal.impact).toBeLessThan(0);
    });
  });

  describe('predictMeetingQuality', () => {
    it('should predict high quality for healthy meeting', () => {
      const speakers = [
        createMockSpeaker('Alice', 300, { confirmatoryBias: 2 }),
        createMockSpeaker('Bob', 280, { groupthink: 1 }),
        createMockSpeaker('Charlie', 290, { availabilityHeuristic: 2 }),
      ];

      const decisions = [
        createMockDecision(true, true, 3),
        createMockDecision(true, true, 2),
      ];

      const summary = createMockSummary(true);

      const prediction = predictMeetingQuality(speakers, decisions, summary, 900);

      expect(prediction.predictedScore).toBeGreaterThan(70);
      expect(prediction.confidence).toBeGreaterThan(0.7);
      expect(prediction.signals).toHaveLength(6);
      expect(prediction.recommendations).toHaveLength(0); // No issues
    });

    it('should predict low quality for problematic meeting', () => {
      const speakers = [
        createMockSpeaker('Alice', 700, { confirmatoryBias: 9, groupthink: 8 }),
        createMockSpeaker('Bob', 50, { availabilityHeuristic: 2 }),
      ];

      const decisions = [
        createMockDecision(false, false, 0),
        createMockDecision(false, false, 0),
      ];

      const summary = createMockSummary(false);

      const prediction = predictMeetingQuality(speakers, decisions, summary, 800);

      expect(prediction.predictedScore).toBeLessThan(40);
      expect(prediction.recommendations.length).toBeGreaterThan(3); // Multiple issues
    });

    it('should handle edge cases gracefully', () => {
      const prediction = predictMeetingQuality([], [], createMockSummary(false), 0);

      expect(prediction.predictedScore).toBe(50); // Baseline
      expect(prediction.confidence).toBeLessThan(0.3); // Low confidence
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for low quality signals', () => {
      const signals: QualitySignal[] = [
        {
          signal: 'dissentRatio',
          value: 0.1,
          impact: -8,
          description: 'Low dissent',
        },
        {
          signal: 'speakerBalance',
          value: 0.3,
          impact: -6,
          description: 'Imbalanced',
        },
        {
          signal: 'biasDensity',
          value: 8,
          impact: -10,
          description: 'High bias',
        },
      ];

      const recommendations = generateRecommendations(signals);

      expect(recommendations).toContain('Encourage constructive dissent and devil\'s advocacy in decision-making');
      expect(recommendations).toContain('Ensure balanced participation from all attendees');
      expect(recommendations).toContain('Implement bias checks and structured decision frameworks');
    });

    it('should not generate recommendations for good signals', () => {
      const signals: QualitySignal[] = [
        {
          signal: 'dissentRatio',
          value: 0.6,
          impact: 5,
          description: 'Healthy dissent',
        },
        {
          signal: 'speakerBalance',
          value: 0.9,
          impact: 8,
          description: 'Well balanced',
        },
      ];

      const recommendations = generateRecommendations(signals);

      expect(recommendations).toHaveLength(0);
    });

    it('should limit recommendations to top issues', () => {
      const signals: QualitySignal[] = [
        { signal: 'dissentRatio', value: 0, impact: -10, description: '' },
        { signal: 'speakerBalance', value: 0, impact: -9, description: '' },
        { signal: 'biasDensity', value: 10, impact: -8, description: '' },
        { signal: 'decisionExplicitness', value: 0, impact: -7, description: '' },
        { signal: 'riskDiscussion', value: 0, impact: -6, description: '' },
        { signal: 'engagementQuality', value: 0, impact: -5, description: '' },
      ];

      const recommendations = generateRecommendations(signals);

      expect(recommendations.length).toBeLessThanOrEqual(4); // Max 4 recommendations
    });
  });

  describe('Integration tests', () => {
    it('should handle complex realistic meeting scenario', () => {
      // Simulate a real meeting with mixed quality
      const speakers = [
        {
          ...createMockSpeaker('CEO', 450, {
            confirmatoryBias: 6,
            authorityBias: 5,
          }),
          interruptionCount: 3,
        },
        {
          ...createMockSpeaker('CTO', 200, {
            availabilityHeuristic: 4,
          }),
          interruptionCount: 1,
        },
        {
          ...createMockSpeaker('CFO', 150, {
            anchoringBias: 3,
          }),
          interruptionCount: 2,
        },
        {
          ...createMockSpeaker('PM', 100, {
            groupthink: 2,
          }),
          interruptionCount: 0,
        },
      ];

      const decisions = [
        {
          decision: 'Launch new product line',
          timestamp: '00:10:00',
          speaker: 'CEO',
          explicitDecision: true,
          rationale: 'Market research shows demand',
          dissentLevel: 2,
          biasesPresent: ['confirmatoryBias'],
        },
        {
          decision: 'Increase budget by 20%',
          timestamp: '00:20:00',
          speaker: 'CFO',
          explicitDecision: true,
          rationale: undefined,
          dissentLevel: 1,
          biasesPresent: ['anchoringBias'],
        },
        {
          decision: 'Hire 5 engineers',
          timestamp: '00:30:00',
          speaker: 'CTO',
          explicitDecision: false,
          rationale: undefined,
          dissentLevel: 0,
          biasesPresent: [],
        },
      ];

      const summary: MeetingSummary = {
        objective: 'Q2 Planning',
        keyPoints: ['Product launch', 'Budget increase', 'Team expansion'],
        decisions: ['Launch product', 'Increase budget', 'Hire engineers'],
        risks: ['Market uncertainty'],
        nextSteps: ['Create hiring plan', 'Finalize budget'],
      };

      const prediction = predictMeetingQuality(speakers, decisions, summary, 900);

      // Should identify mixed quality
      expect(prediction.predictedScore).toBeGreaterThan(40);
      expect(prediction.predictedScore).toBeLessThan(70);

      // Should have moderate confidence
      expect(prediction.confidence).toBeGreaterThan(0.5);
      expect(prediction.confidence).toBeLessThan(0.8);

      // Should generate targeted recommendations
      expect(prediction.recommendations.length).toBeGreaterThan(0);
      expect(prediction.recommendations.some(r =>
        r.includes('balance') || r.includes('participation')
      )).toBe(true);
    });
  });
});