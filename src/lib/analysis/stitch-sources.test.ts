import { describe, it, expect } from 'vitest';
import { stitchDecisionSources, MIN_PER_SOURCE } from './stitch-sources';

describe('stitchDecisionSources — multi-document decision stitching', () => {
  it('a single source passes through with no stitching header', () => {
    const r = stitchDecisionSources([
      { name: 'Doc A', content: 'We believe the market will grow.' },
    ]);
    expect(r.sources).toHaveLength(1);
    expect(r.content).not.toContain('SOURCE 1 OF');
    expect(r.content).toContain('We believe the market will grow.');
  });

  it('two+ sources are all represented under labeled boundaries + a synthesis header', () => {
    const r = stitchDecisionSources([
      { name: 'S-1', content: 'Risk factors: we depend on a single anchor tenant.' },
      { name: '424B4', content: 'We intend to invest heavily to capture the market opportunity.' },
      { name: '8-K', content: 'The board approved the acquisition strategy despite the leverage.' },
    ]);
    expect(r.sources).toHaveLength(3);
    expect(r.content).toContain('audited from 3 source documents');
    expect(r.content).toContain('synthesise across ALL sources');
    expect(r.content).toContain('=== SOURCE 1 OF 3 · S-1 ===');
    expect(r.content).toContain('single anchor tenant');
    expect(r.content).toContain('=== SOURCE 2 OF 3 · 424B4 ===');
    expect(r.content).toContain('invest heavily');
    expect(r.content).toContain('=== SOURCE 3 OF 3 · 8-K ===');
    expect(r.content).toContain('leverage');
  });

  it('a long source is DISTILLED to its share; a short source is never starved', () => {
    // The "pull thoroughly from every source" guarantee: a huge filing gets
    // bounded to ~its budget share (distilled to its reasoning) while a short
    // memo stays fully present — never truncated to the first doc.
    const bigReasoning = Array.from(
      { length: 3000 },
      (_, i) =>
        `Paragraph ${i}: our strategy depends on unproven demand and we may fail because the market is uncertain.`
    ).join('\n\n');
    const r = stitchDecisionSources(
      [
        { name: 'Big filing', content: bigReasoning },
        { name: 'Short memo', content: 'The exit trigger is a predefined walk-away price.' },
      ],
      40_000
    );
    expect(r.anyDistilled).toBe(true);
    // Short source is fully present.
    expect(r.content).toContain('predefined walk-away price');
    // Big source is present, distilled, bounded to ~its share (not the whole budget).
    const big = r.sources.find(s => s.name === 'Big filing')!;
    expect(big.distilled).toBe(true);
    expect(big.charsUsed).toBeGreaterThan(MIN_PER_SOURCE - 1);
    expect(big.charsUsed).toBeLessThanOrEqual(40_000);
    expect(r.content).toContain('=== SOURCE 1 OF 2 · Big filing ===');
  });

  it('empty / whitespace sources are filtered out', () => {
    const r = stitchDecisionSources([
      { name: 'Empty', content: '   ' },
      { name: 'Real', content: 'A real decision memo with reasoning.' },
    ]);
    expect(r.sources).toHaveLength(1);
    expect(r.sources[0].name).toBe('Real');
    expect(r.content).not.toContain('SOURCE 1 OF'); // collapsed to the single-source path
  });

  it('all-empty input returns empty', () => {
    expect(stitchDecisionSources([]).content).toBe('');
    expect(stitchDecisionSources([{ name: 'x', content: '' }]).sources).toHaveLength(0);
  });
});
