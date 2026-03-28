/**
 * Shared Zod validation schemas for analysis pipeline outputs.
 *
 * These schemas are used in both the synchronous analyzer and the SSE
 * streaming route to validate and sanitise LLM-generated JSON before it is
 * persisted to the database.  Centralising them here ensures the two code
 * paths always apply identical validation rules and defaults.
 */

import { z } from 'zod';

export const NoiseStatsSchema = z
  .object({
    mean: z.number().min(0).max(100).default(0),
    stdDev: z.number().min(0).default(0),
    variance: z.number().min(0).default(0),
  })
  .default({ mean: 0, stdDev: 0, variance: 0 });

export const FactCheckSchema = z
  .object({
    score: z.number().min(0).max(100).default(0),
    summary: z.string().default('Unavailable'),
    verifications: z.array(z.record(z.string(), z.unknown())).default([]),
    flags: z.array(z.string()).default([]),
    primaryTopic: z.string().optional(),
    searchSources: z.array(z.string()).optional(),
  })
  .passthrough()
  .default({ score: 0, summary: 'Unavailable', verifications: [], flags: [] });

export const ComplianceSchema = z
  .object({
    status: z.string().default('WARN'),
    riskScore: z.number().min(0).max(100).default(0),
    summary: z.string().default('Compliance check unavailable'),
    regulations: z.array(z.record(z.string(), z.unknown())).default([]),
    searchQueries: z.array(z.string()).optional(),
  })
  .passthrough()
  .default({
    status: 'WARN',
    riskScore: 0,
    summary: 'Compliance check unavailable',
    regulations: [],
  });

export const SentimentSchema = z
  .object({
    score: z.number().min(0).max(100).default(0),
    label: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).catch('Neutral').default('Neutral'),
  })
  .default({ score: 0, label: 'Neutral' });

export const LogicalSchema = z
  .object({
    score: z.number().min(0).max(100).default(100),
    fallacies: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .default({ score: 100, fallacies: [] });

export const SwotSchema = z
  .object({
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    opportunities: z.array(z.string()).default([]),
    threats: z.array(z.string()).default([]),
    strategicAdvice: z.string().default(''),
  })
  .optional();

export const CognitiveSchema = z
  .object({
    blindSpotGap: z.number().min(0).max(100).default(0),
    blindSpots: z
      .array(
        z.object({
          name: z.string(),
          description: z.string(),
        })
      )
      .default([]),
    counterArguments: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .optional();

export const SimulationSchema = z
  .object({
    overallVerdict: z.string().default('Neutral'),
    twins: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .optional();

export const MemorySchema = z
  .object({
    recallScore: z.number().min(0).max(100).default(0),
    similarEvents: z.array(z.record(z.string(), z.unknown())).default([]),
  })
  .optional();

export const CompoundScoringSchema = z
  .object({
    calibratedScore: z.number(),
    compoundMultiplier: z.number(),
    contextAdjustment: z.number(),
    confidenceDecay: z.number(),
    amplifyingInteractions: z
      .array(
        z.object({
          bias: z.string(),
          multiplier: z.number(),
          interactions: z.array(z.string()),
        })
      )
      .default([]),
    adjustments: z
      .array(
        z.object({
          source: z.string(),
          delta: z.number(),
          description: z.string(),
        })
      )
      .default([]),
  })
  .optional();

export const BayesianPriorsSchema = z
  .object({
    adjustedScore: z.number(),
    beliefDelta: z.number(),
    informationGain: z.number(),
    priorInfluence: z.number(),
    biasAdjustments: z
      .array(
        z.object({
          biasType: z.string(),
          priorConfidence: z.number(),
          posteriorConfidence: z.number(),
          direction: z.enum(['increased', 'decreased', 'unchanged']),
          reason: z.string(),
        })
      )
      .default([]),
  })
  .optional();
