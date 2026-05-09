/**
 * Aggregation tests focused on namedPatterns server-side aggregation
 * (locked 2026-05-09, hard-layer ship Proposal 2). Covers the path that
 * replaced client-side detection in IcReadinessGate — every consumer
 * now reads the same canonical aggregator output.
 */
import { describe, it, expect } from 'vitest';
import { aggregateAnalyses, type AnalyzedDocument } from './deal-aggregation';

function doc(
  id: string,
  overallScore: number,
  patterns: Array<{
    patternLabel: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | null;
    toxicScore: number;
  }> = []
): AnalyzedDocument {
  return {
    documentId: id,
    analysisId: `a-${id}`,
    overallScore,
    biases: [],
    toxicCombinations: patterns,
  };
}

describe('aggregateAnalyses · namedPatterns', () => {
  it('empty input → namedPatterns: [], counts: 0', () => {
    const result = aggregateAnalyses([]);
    expect(result.namedPatterns).toEqual([]);
    expect(result.criticalPatternCount).toBe(0);
    expect(result.highPatternCount).toBe(0);
  });

  it('docs without toxicCombinations field → namedPatterns: [], counts: 0', () => {
    // Backwards-compat: legacy callers don't supply toxicCombinations.
    const result = aggregateAnalyses([
      { documentId: 'd1', analysisId: 'a1', overallScore: 70, biases: [] },
    ]);
    expect(result.namedPatterns).toEqual([]);
  });

  it('groups patterns by patternLabel across documents, counts distinct docs', () => {
    const result = aggregateAnalyses([
      doc('d1', 60, [
        { patternLabel: 'The Synergy Mirage', severity: 'high', toxicScore: 70 },
      ]),
      doc('d2', 55, [
        { patternLabel: 'The Synergy Mirage', severity: 'critical', toxicScore: 85 },
      ]),
      doc('d3', 70, [
        { patternLabel: 'The Conglomerate Fallacy', severity: 'medium', toxicScore: 50 },
      ]),
    ]);
    const synergy = result.namedPatterns.find(p => p.patternLabel === 'The Synergy Mirage');
    expect(synergy).toBeDefined();
    expect(synergy?.documentCount).toBe(2);
    expect(synergy?.topSeverity).toBe('critical'); // higher of high + critical
    expect(synergy?.maxToxicScore).toBe(85);

    const conglom = result.namedPatterns.find(p => p.patternLabel === 'The Conglomerate Fallacy');
    expect(conglom?.documentCount).toBe(1);
    expect(conglom?.topSeverity).toBe('medium');
  });

  it('sorts by severity (critical first) then documentCount', () => {
    const result = aggregateAnalyses([
      doc('d1', 60, [
        { patternLabel: 'The Echo Chamber', severity: 'medium', toxicScore: 50 },
      ]),
      doc('d2', 50, [
        { patternLabel: 'The Synergy Mirage', severity: 'critical', toxicScore: 90 },
      ]),
      doc('d3', 60, [
        { patternLabel: 'The Echo Chamber', severity: 'medium', toxicScore: 50 },
      ]),
    ]);
    expect(result.namedPatterns[0].patternLabel).toBe('The Synergy Mirage');
    expect(result.namedPatterns[1].patternLabel).toBe('The Echo Chamber');
  });

  it('counts criticalPatternCount + highPatternCount accurately', () => {
    const result = aggregateAnalyses([
      doc('d1', 50, [
        { patternLabel: 'The Synergy Mirage', severity: 'critical', toxicScore: 90 },
        { patternLabel: 'The Yes Committee', severity: 'critical', toxicScore: 85 },
        { patternLabel: 'The Echo Chamber', severity: 'high', toxicScore: 65 },
      ]),
      doc('d2', 60, [
        { patternLabel: 'The Optimism Trap', severity: 'medium', toxicScore: 50 },
      ]),
    ]);
    expect(result.criticalPatternCount).toBe(2);
    expect(result.highPatternCount).toBe(1);
  });

  it('derives severity from toxicScore when severity column is null (legacy fallback)', () => {
    const result = aggregateAnalyses([
      doc('d1', 50, [
        { patternLabel: 'The Synergy Mirage', severity: null, toxicScore: 85 }, // → critical
        { patternLabel: 'The Echo Chamber', severity: null, toxicScore: 65 }, // → high
      ]),
    ]);
    const synergy = result.namedPatterns.find(p => p.patternLabel === 'The Synergy Mirage');
    expect(synergy?.topSeverity).toBe('critical');
    const echo = result.namedPatterns.find(p => p.patternLabel === 'The Echo Chamber');
    expect(echo?.topSeverity).toBe('high');
  });

  it('skips toxic-combination rows with null patternLabel (raw bias-pair detections)', () => {
    const result = aggregateAnalyses([
      doc('d1', 60, [
        { patternLabel: null, severity: 'high', toxicScore: 65 },
        { patternLabel: 'The Synergy Mirage', severity: 'critical', toxicScore: 85 },
      ]),
    ]);
    expect(result.namedPatterns).toHaveLength(1);
    expect(result.namedPatterns[0].patternLabel).toBe('The Synergy Mirage');
  });
});

describe('aggregateAnalyses · existing behaviour preserved', () => {
  it('compositeDqi unchanged when toxicCombinations absent', () => {
    const result = aggregateAnalyses([
      { documentId: 'd1', analysisId: 'a1', overallScore: 80, biases: [] },
      { documentId: 'd2', analysisId: 'a2', overallScore: 60, biases: [] },
    ]);
    expect(result.compositeDqi).toBe(70);
    expect(result.compositeGrade).toBe('B');
  });
});
