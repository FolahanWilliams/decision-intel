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

// ─── Phase 2 Field Schemas ──────────────────────────────────────────────────

export const CognitiveAuditCompliance = z.object({
  status: z.enum(['PASS', 'WARN', 'FAIL']),
  riskScore: z.number().min(0).max(100),
  summary: z.string(),
  regulations: z
    .array(
      z.object({
        name: z.string(),
        status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL']),
        description: z.string(),
        riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
      })
    )
    .default([]),
  searchQueries: z.array(z.string()).default([]),
});

export const CognitiveAuditPreMortem = z.object({
  failureScenarios: z.array(z.string()).default([]),
  preventiveMeasures: z.array(z.string()).default([]),
});

export const CognitiveAuditLogicalAnalysis = z.object({
  score: z.number().min(0).max(100),
  fallacies: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        severity: z.enum(['low', 'medium', 'high']),
        excerpt: z.string(),
        explanation: z.string(),
      })
    )
    .default([]),
  assumptions: z.array(z.string()).optional(),
  conclusion: z.string().optional(),
  verdict: z.enum(['APPROVED', 'REJECTED', 'MIXED']).optional(),
  twins: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        vote: z.enum(['APPROVE', 'REJECT', 'REVISE']),
        confidence: z.number().min(0).max(1),
        rationale: z.string(),
        keyRiskIdentified: z.string(),
      })
    )
    .optional(),
  institutionalMemory: z
    .object({
      recallScore: z.number(),
      similarEvents: z.array(
        z.object({
          documentId: z.string().optional(),
          title: z.string(),
          summary: z.string(),
          outcome: z.string(),
          similarity: z.number(),
          lessonLearned: z.string(),
        })
      ),
      strategicAdvice: z.string(),
    })
    .optional(),
});
