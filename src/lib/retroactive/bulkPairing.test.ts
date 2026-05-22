import { describe, it, expect } from 'vitest';
import {
  pairBulkDocuments,
  entityOverlapScoreExported,
  temporalProximityScoreExported,
  contentSimilarityScoreExported,
  bandForConfidenceExported,
} from './bulkPairing';
import type { UploadedHistoricalDoc } from './types';

function makeDoc(overrides: Partial<UploadedHistoricalDoc> = {}): UploadedHistoricalDoc {
  return {
    documentId: 'd-' + Math.random().toString(36).slice(2, 8),
    filename: 'sample.pdf',
    content: 'placeholder content for the document body that is long enough for tokenization.',
    inferredDate: '2020-06-01',
    detectedRole: 'memo',
    roleConfidence: 0.8,
    entities: { organizations: [], amounts: [], projectCodenames: [] },
    ...overrides,
  };
}

describe('entityOverlapScore', () => {
  it('returns 0 for fully disjoint entity sets', () => {
    const score = entityOverlapScoreExported(
      { organizations: ['Apple', 'Microsoft'], amounts: [], projectCodenames: [] },
      { organizations: ['Tesla', 'Ford'], amounts: [], projectCodenames: [] }
    );
    expect(score).toBe(0);
  });

  it('returns higher score for project-codename overlap (2x weighted)', () => {
    const orgOnly = entityOverlapScoreExported(
      { organizations: ['Helios Capital'], amounts: [], projectCodenames: [] },
      { organizations: ['Helios Capital'], amounts: [], projectCodenames: [] }
    );
    const codeOverlap = entityOverlapScoreExported(
      { organizations: [], amounts: [], projectCodenames: ['Project Atlas'] },
      { organizations: [], amounts: [], projectCodenames: ['Project Atlas'] }
    );
    expect(orgOnly).toBeGreaterThan(0);
    expect(codeOverlap).toBeGreaterThanOrEqual(orgOnly);
  });

  it('is case-insensitive', () => {
    const score = entityOverlapScoreExported(
      { organizations: ['ACME CORP'], amounts: [], projectCodenames: [] },
      { organizations: ['acme corp'], amounts: [], projectCodenames: [] }
    );
    expect(score).toBe(1);
  });
});

describe('temporalProximityScore', () => {
  it('returns 0 when either date is missing', () => {
    expect(temporalProximityScoreExported(undefined, '2020-01-01').score).toBe(0);
    expect(temporalProximityScoreExported('2020-01-01', undefined).score).toBe(0);
    expect(temporalProximityScoreExported(undefined, undefined).score).toBe(0);
  });

  it('returns 0 when outcome is BEFORE memo', () => {
    expect(temporalProximityScoreExported('2020-06-01', '2019-06-01').score).toBe(0);
  });

  it('returns ~1.0 for the sweet spot (6mo to 3yr gap)', () => {
    // 18 months gap
    expect(temporalProximityScoreExported('2020-01-01', '2021-07-01').score).toBe(1.0);
    // 30 months gap
    expect(temporalProximityScoreExported('2020-01-01', '2022-07-01').score).toBe(1.0);
  });

  it('decays for very long gaps (10+ years)', () => {
    expect(temporalProximityScoreExported('2010-01-01', '2024-01-01').score).toBeLessThan(0.4);
  });

  it('returns 0.5 for same-day docs (likely mixed)', () => {
    expect(temporalProximityScoreExported('2020-01-01', '2020-01-01').score).toBe(0.5);
  });
});

describe('contentSimilarityScore', () => {
  it('returns 0 for fully disjoint content', () => {
    const score = contentSimilarityScoreExported(
      'investing climate technology renewable energy storage batteries lithium',
      'agricultural fertilizer market analysis Nigeria farming smallholder crops'
    );
    expect(score).toBeLessThan(0.2);
  });

  it('returns higher for content with shared significant terms', () => {
    const score = contentSimilarityScoreExported(
      'Project Helios acquisition rationale synergy realization 250 million purchase price',
      'Project Helios integration retrospective synergy missed 250 million writedown impairment'
    );
    expect(score).toBeGreaterThan(0.15);
  });

  it('handles empty input', () => {
    expect(contentSimilarityScoreExported('', 'anything')).toBe(0);
    expect(contentSimilarityScoreExported('anything', '')).toBe(0);
  });
});

describe('bandForConfidence', () => {
  it('maps confidence to the correct band', () => {
    expect(bandForConfidenceExported(0.9)).toBe('auto_high');
    expect(bandForConfidenceExported(0.75)).toBe('auto_high');
    expect(bandForConfidenceExported(0.6)).toBe('auto_medium');
    expect(bandForConfidenceExported(0.5)).toBe('auto_medium');
    expect(bandForConfidenceExported(0.3)).toBe('auto_low');
    expect(bandForConfidenceExported(0.25)).toBe('auto_low');
    expect(bandForConfidenceExported(0.1)).toBe('unpaired');
  });
});

describe('pairBulkDocuments', () => {
  it('handles an empty input gracefully', () => {
    const result = pairBulkDocuments({ docs: [] });
    expect(result.totalDocs).toBe(0);
    expect(result.pairs.length).toBe(0);
    expect(result.unclassified.length).toBe(0);
  });

  it('produces a deterministic batchId for the same docs', () => {
    const docs = [makeDoc({ documentId: 'a' }), makeDoc({ documentId: 'b' })];
    const a = pairBulkDocuments({ docs });
    const b = pairBulkDocuments({ docs });
    expect(a.batchId).toBe(b.batchId);
  });

  it('pairs a clearly-related memo + outcome with high confidence', () => {
    const memo = makeDoc({
      documentId: 'memo-1',
      detectedRole: 'memo',
      inferredDate: '2019-03-01',
      entities: {
        organizations: ['Helios Capital'],
        amounts: ['$50M'],
        projectCodenames: ['Project Atlas'],
      },
      content:
        'Investment thesis for Project Atlas at Helios Capital. We recommend $50M commitment. Target IRR 28% over 5 years. Risks include market entry timing and regulatory environment.',
    });
    const outcome = makeDoc({
      documentId: 'outcome-1',
      detectedRole: 'outcome',
      inferredDate: '2022-06-01',
      entities: {
        organizations: ['Helios Capital'],
        amounts: ['$120M'],
        projectCodenames: ['Project Atlas'],
      },
      content:
        'Project Atlas retrospective at Helios Capital. The $50M investment exited at $120M after 38 months. IRR delivered 32% against a target of 28%. The thesis on market entry timing was correct; regulatory environment risks materialised but were navigable.',
    });
    const result = pairBulkDocuments({ docs: [memo, outcome] });
    expect(result.pairs.length).toBe(1);
    expect(result.pairs[0].band).toBe('auto_high');
    expect(result.pairs[0].confidence).toBeGreaterThan(0.7);
  });

  it('does not pair docs with no entity overlap and no content overlap', () => {
    // Memo + outcome with: no shared entities, no content overlap, AND
    // implausible temporal gap (outcome 15 years after memo). All three
    // signals at zero/near-zero → confidence below the auto_low band →
    // memo flagged as unpaired.
    const memo = makeDoc({
      documentId: 'memo-2',
      detectedRole: 'memo',
      inferredDate: '2009-03-01',
      entities: {
        organizations: ['Helios Capital'],
        amounts: [],
        projectCodenames: ['Project Atlas'],
      },
      content:
        'Investment thesis Project Atlas focusing European renewable storage opportunities recommend commit twenty million target IRR.',
    });
    const outcome = makeDoc({
      documentId: 'outcome-2',
      detectedRole: 'outcome',
      inferredDate: '2024-06-01',
      entities: {
        organizations: ['Sigma Ventures'],
        amounts: [],
        projectCodenames: ['Project Zenith'],
      },
      content:
        'Project Zenith retrospective Sigma Ventures agricultural fertilizer Nigeria smallholder farmers crops.',
    });
    const result = pairBulkDocuments({ docs: [memo, outcome] });
    // Memo should be unpaired
    const memoEntry = result.pairs.find(p => p.memoDoc.documentId === 'memo-2');
    expect(memoEntry?.band).toBe('unpaired');
    // Outcome should be in unclassified (unclaimed)
    expect(result.unclassified.some(d => d.documentId === 'outcome-2')).toBe(true);
  });

  it('greedy assignment: each outcome paired at most once', () => {
    // Two memos compete for the same outcome
    const sharedEntity = {
      organizations: ['Apex Holdings'],
      amounts: [],
      projectCodenames: [],
    };
    const memoA = makeDoc({
      documentId: 'memo-a',
      detectedRole: 'memo',
      inferredDate: '2019-01-01',
      entities: sharedEntity,
      content:
        'Apex Holdings investment thesis: target market expansion across Europe with $80M commitment for 30% IRR.',
    });
    const memoB = makeDoc({
      documentId: 'memo-b',
      detectedRole: 'memo',
      inferredDate: '2019-06-01',
      entities: sharedEntity,
      content:
        'Apex Holdings: secondary tranche thesis for follow-on $40M at the same target IRR of 30%.',
    });
    const outcome = makeDoc({
      documentId: 'outcome-shared',
      detectedRole: 'outcome',
      inferredDate: '2022-01-01',
      entities: sharedEntity,
      content:
        'Apex Holdings retrospective: combined position exited at 3.2x. Target IRR of 30% delivered.',
    });

    const result = pairBulkDocuments({ docs: [memoA, memoB, outcome] });
    // The outcome should appear in exactly one pair
    const pairsWithOutcome = result.pairs.filter(
      p => p.outcomeDoc?.documentId === 'outcome-shared'
    );
    expect(pairsWithOutcome.length).toBe(1);
  });

  it('mixed-role docs become their own self-pair with high confidence', () => {
    const mixed = makeDoc({
      documentId: 'mixed-1',
      detectedRole: 'mixed',
      inferredDate: '2022-01-01',
      content:
        'Project Atlas decision review: original $50M investment delivered 32% IRR after 30 months.',
    });
    const result = pairBulkDocuments({ docs: [mixed] });
    expect(result.pairs.length).toBe(1);
    expect(result.pairs[0].memoDoc.documentId).toBe('mixed-1');
    expect(result.pairs[0].outcomeDoc?.documentId).toBe('mixed-1');
    expect(result.pairs[0].band).toBe('auto_high');
  });

  it('unknown-role docs go to unclassified bucket', () => {
    const unknown = makeDoc({ detectedRole: 'unknown' });
    const result = pairBulkDocuments({ docs: [unknown] });
    expect(result.pairs.length).toBe(0);
    expect(result.unclassified.length).toBe(1);
  });

  it('produces a stable pair-id per memo-outcome pair', () => {
    const memo = makeDoc({ documentId: 'memo-x', detectedRole: 'memo' });
    const outcome = makeDoc({ documentId: 'outcome-y', detectedRole: 'outcome' });
    // Force a confident pairing by sharing entities + dates
    memo.entities = {
      organizations: ['Shared Co'],
      amounts: [],
      projectCodenames: ['Shared Project'],
    };
    outcome.entities = {
      organizations: ['Shared Co'],
      amounts: [],
      projectCodenames: ['Shared Project'],
    };
    memo.inferredDate = '2019-01-01';
    outcome.inferredDate = '2021-01-01';
    memo.content =
      'shared project thesis investment recommendation analysis market growth opportunity';
    outcome.content =
      'shared project retrospective investment delivered results analysis market growth realised';

    const a = pairBulkDocuments({ docs: [memo, outcome] });
    const b = pairBulkDocuments({ docs: [memo, outcome] });
    expect(a.pairs[0].pairId).toBe(b.pairs[0].pairId);
  });
});
