import { describe, it, expect } from 'vitest';
import { distillForAudit } from './content-distiller';

describe('distillForAudit', () => {
  it('passes a within-budget document through unchanged', () => {
    const memo = 'We believe the acquisition carries material integration risk.';
    const r = distillForAudit(memo, 50_000);
    expect(r.distilled).toBe(false);
    expect(r.content).toBe(memo);
    expect(r.note).toBeNull();
  });

  it('handles empty / null input safely', () => {
    expect(distillForAudit('', 50_000).content).toBe('');
    // @ts-expect-error — exercising the null guard
    expect(distillForAudit(null, 50_000).content).toBe('');
  });

  it('keeps reasoning sections and drops boilerplate when over budget', () => {
    const coverBoiler = Array.from(
      { length: 40 },
      (_, i) => `Exhibit ${i} .................................................. ${100 + i}`
    ).join('\n\n');
    const financialTable = Array.from(
      { length: 40 },
      () => '2024 5,231,004 4,102,118 1,128,886 ( 412,005 ) 716,881'
    ).join('\n\n');
    const reasoning =
      'RISK FACTORS. We may not achieve the growth we project; our strategy depends ' +
      'on assumptions that could prove materially adverse. There is no assurance the ' +
      'competitive advantage persists, and our ability to integrate the acquisition is uncertain.';

    // Budget forces a reduction; the reasoning block must survive, the table +
    // exhibit boilerplate must be dropped.
    const doc = `${coverBoiler}\n\n${financialTable}\n\n${reasoning}`;
    const r = distillForAudit(doc, 600);
    expect(r.distilled).toBe(true);
    expect(r.originalChars).toBe(doc.length);
    expect(r.content).toContain('RISK FACTORS');
    expect(r.content).toContain('competitive advantage');
    expect(r.content).not.toContain('5,231,004'); // financial table dropped
    expect(r.note).toContain('reasoning-dense');
  });

  it('never returns empty content for a non-empty over-budget document', () => {
    // All-boilerplate, over budget — must still return *something* to audit.
    const allTables = Array.from({ length: 200 }, () => '2024 1,000 2,000 3,000').join('\n\n');
    const r = distillForAudit(allTables, 500);
    expect(r.distilled).toBe(true);
    expect(r.content.length).toBeGreaterThan(0);
    expect(r.content.length).toBeLessThanOrEqual(allTables.length);
  });

  it('head-slices a single block larger than the entire budget', () => {
    const oneGiantBlock = 'We believe '.repeat(20_000); // ~220K chars, no blank lines
    const r = distillForAudit(oneGiantBlock, 10_000);
    expect(r.distilled).toBe(true);
    expect(r.content.length).toBeGreaterThan(0);
    expect(r.content.length).toBeLessThanOrEqual(10_000);
  });

  it('keeps the distilled output within the budget', () => {
    const blocks = Array.from(
      { length: 500 },
      (_, i) => `Block ${i}: our strategy depends on growth assumptions that carry risk.`
    ).join('\n\n');
    const r = distillForAudit(blocks, 5_000);
    expect(r.distilled).toBe(true);
    expect(r.keptChars).toBeLessThanOrEqual(5_000);
  });
});
