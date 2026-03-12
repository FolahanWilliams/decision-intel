import { describe, it, expect } from 'vitest';
import {
    NoiseStatsSchema,
    FactCheckSchema,
    ComplianceSchema,
    SentimentSchema,
    LogicalSchema,
    SwotSchema,
    CognitiveSchema,
    SimulationSchema,
    MemorySchema,
} from './analysis';

describe('Analysis Schemas', () => {
    describe('NoiseStatsSchema', () => {
        it('parses valid data', () => {
            const result = NoiseStatsSchema.parse({ mean: 75, stdDev: 5, variance: 25 });
            expect(result).toEqual({ mean: 75, stdDev: 5, variance: 25 });
        });

        it('applies default values for missing fields', () => {
            const result = NoiseStatsSchema.parse({});
            expect(result).toEqual({ mean: 0, stdDev: 0, variance: 0 });
        });

        it('applies default when input is undefined', () => {
            const result = NoiseStatsSchema.parse(undefined);
            expect(result).toEqual({ mean: 0, stdDev: 0, variance: 0 });
        });
    });

    describe('FactCheckSchema', () => {
        it('parses valid data', () => {
            const input = { score: 80, summary: 'Verified', verifications: [], flags: [] };
            const result = FactCheckSchema.parse(input);
            expect(result.score).toBe(80);
            expect(result.summary).toBe('Verified');
        });

        it('applies defaults for missing fields', () => {
            const result = FactCheckSchema.parse(undefined);
            expect(result).toEqual({ score: 0, summary: 'Unavailable', verifications: [], flags: [] });
        });

        it('passes through extra fields', () => {
            const input = { score: 50, summary: 'Partial', verifications: [], flags: [], extraField: 'kept' };
            const result = FactCheckSchema.parse(input);
            expect((result as Record<string, unknown>).extraField).toBe('kept');
        });
    });

    describe('ComplianceSchema', () => {
        it('parses valid data', () => {
            const input = { status: 'PASS', riskScore: 0, summary: 'Compliant', regulations: [] };
            const result = ComplianceSchema.parse(input);
            expect(result.status).toBe('PASS');
        });

        it('applies defaults when undefined', () => {
            const result = ComplianceSchema.parse(undefined);
            expect(result.status).toBe('WARN');
            expect(result.riskScore).toBe(0);
        });
    });

    describe('SentimentSchema', () => {
        it('parses valid data', () => {
            const result = SentimentSchema.parse({ score: 0.8, label: 'Positive' });
            expect(result).toEqual({ score: 0.8, label: 'Positive' });
        });

        it('applies defaults when undefined', () => {
            const result = SentimentSchema.parse(undefined);
            expect(result).toEqual({ score: 0, label: 'Neutral' });
        });
    });

    describe('LogicalSchema', () => {
        it('parses valid data', () => {
            const result = LogicalSchema.parse({ score: 90, fallacies: [] });
            expect(result.score).toBe(90);
        });

        it('defaults score to 100', () => {
            const result = LogicalSchema.parse(undefined);
            expect(result!.score).toBe(100);
            expect(result!.fallacies).toEqual([]);
        });
    });

    describe('SwotSchema', () => {
        it('parses valid SWOT data', () => {
            const input = {
                strengths: ['Strong brand'],
                weaknesses: ['High cost'],
                opportunities: ['New market'],
                threats: ['Competition'],
                strategicAdvice: 'Expand'
            };
            const result = SwotSchema.parse(input);
            expect(result!.strengths).toEqual(['Strong brand']);
        });

        it('returns undefined when input is undefined', () => {
            const result = SwotSchema.parse(undefined);
            expect(result).toBeUndefined();
        });
    });

    describe('CognitiveSchema', () => {
        it('parses valid cognitive data', () => {
            const input = {
                blindSpotGap: 20,
                blindSpots: [{ name: 'Overconfidence', description: 'Overestimates success' }],
                counterArguments: []
            };
            const result = CognitiveSchema.parse(input);
            expect(result!.blindSpotGap).toBe(20);
            expect(result!.blindSpots).toHaveLength(1);
        });

        it('returns undefined when input is undefined', () => {
            expect(CognitiveSchema.parse(undefined)).toBeUndefined();
        });
    });

    describe('SimulationSchema', () => {
        it('parses valid simulation data', () => {
            const input = { overallVerdict: 'Positive', twins: [{ scenario: 'A' }] };
            const result = SimulationSchema.parse(input);
            expect(result!.overallVerdict).toBe('Positive');
        });

        it('defaults overallVerdict to Neutral', () => {
            const result = SimulationSchema.parse({});
            expect(result!.overallVerdict).toBe('Neutral');
        });

        it('returns undefined when input is undefined', () => {
            expect(SimulationSchema.parse(undefined)).toBeUndefined();
        });
    });

    describe('MemorySchema', () => {
        it('parses valid memory data', () => {
            const input = { recallScore: 85, similarEvents: [{ event: 'Past merger' }] };
            const result = MemorySchema.parse(input);
            expect(result!.recallScore).toBe(85);
        });

        it('returns undefined when input is undefined', () => {
            expect(MemorySchema.parse(undefined)).toBeUndefined();
        });
    });
});
