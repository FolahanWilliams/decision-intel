/**
 * Zod validation schemas for Human Cognitive Audit pipeline outputs.
 *
 * Validates and sanitises LLM-generated JSON before persistence,
 * following the same pattern as src/lib/schemas/analysis.ts.
 */

import { z } from 'zod';

export const BiasFindings = z
  .array(
    z
      .object({
        biasType: z.string().default('Unknown'),
        found: z.boolean().default(true),
        severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        excerpt: z.string().default(''),
        explanation: z.string().default(''),
        suggestion: z.string().default(''),
        confidence: z.number().min(0).max(1).default(0.7),
        researchInsight: z
          .object({
            title: z.string(),
            summary: z.string(),
            sourceUrl: z.string(),
          })
          .optional(),
      })
      .passthrough()
  )
  .default([]);

export const CognitiveAuditNoiseStats = z
  .object({
    mean: z.number().default(0),
    stdDev: z.number().default(0),
    variance: z.number().default(0),
  })
  .default({ mean: 0, stdDev: 0, variance: 0 });

export const CognitiveAuditSentiment = z
  .object({
    score: z.number().min(-1).max(1).default(0),
    label: z.enum(['Positive', 'Negative', 'Neutral']).default('Neutral'),
  })
  .default({ score: 0, label: 'Neutral' });
