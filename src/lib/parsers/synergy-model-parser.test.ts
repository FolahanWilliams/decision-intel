/**
 * Synergy Model Parser tests.
 *
 * Builds an in-memory ExcelJS workbook with synergy-shaped data, then
 * verifies the parser detects the shape, extracts the line items, and
 * scores defensibility correctly.
 */
import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import {
  extractSynergyStructure,
  formatSynergyStructureForAudit,
} from './synergy-model-parser';

function makeWorkbook(
  sheets: Array<{
    name: string;
    rows: Array<Array<string | number | null>>;
  }>
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  for (const s of sheets) {
    const sheet = wb.addWorksheet(s.name);
    for (const row of s.rows) {
      sheet.addRow(row);
    }
  }
  return wb;
}

describe('extractSynergyStructure', () => {
  it('returns detected=false for non-synergy workbooks', () => {
    const wb = makeWorkbook([
      {
        name: 'Sheet1',
        rows: [
          ['Revenue', 'Q1', 'Q2', 'Q3', 'Q4'],
          ['Total', 100, 110, 120, 130],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.detected).toBe(false);
    expect(result.confidence).toBe('none');
    expect(result.claims).toEqual([]);
  });

  it('detects synergy-shaped sheet by name keyword + extracts claims', () => {
    const wb = makeWorkbook([
      {
        name: 'Synergies',
        rows: [
          ['Synergy line item', 'Year 1', 'Year 2', 'Run-rate', 'Mechanism', 'Owner', 'Milestone'],
          [
            'Cross-sell to existing customers',
            5000000,
            12000000,
            18000000,
            'Bundle SKU A with SKU B in CRM upsell flow',
            'VP Sales — Jane Smith',
            'Q3 2026 ARR target +$5M',
          ],
          ['Headcount consolidation in finance', 2000000, 4000000, 6000000, '', '', ''],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.detected).toBe(true);
    expect(result.claims).toHaveLength(2);
    expect(result.claims[0].label).toBe('Cross-sell to existing customers');
    expect(result.claims[0].type).toBe('revenue');
    expect(result.claims[0].hasMechanism).toBe(true);
    expect(result.claims[0].hasOwner).toBe(true);
    expect(result.claims[0].hasMilestone).toBe(true);
    expect(result.claims[0].defensibility.severity).toBe('low');
  });

  it('classifies cost claims based on row label keywords', () => {
    const wb = makeWorkbook([
      {
        name: 'Cost Synergies',
        rows: [
          ['Initiative', 'Year 1', 'Run-rate'],
          ['SG&A overhead consolidation', 1000000, 3000000],
          ['Vendor consolidation in sourcing', 500000, 2000000],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.detected).toBe(true);
    expect(result.claims).toHaveLength(2);
    expect(result.claims[0].type).toBe('cost_opex');
    expect(result.claims[1].type).toBe('cost_cogs');
  });

  it('flags critical severity for claims with no mechanism, owner, or milestone', () => {
    const wb = makeWorkbook([
      {
        name: 'Synergy projection',
        rows: [
          ['Synergy', 'Year 1', 'Year 2', 'Run-rate'],
          ['Revenue uplift from market access', 10000000, 25000000, 40000000],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.detected).toBe(true);
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].defensibility.severity).toBe('critical');
    expect(result.claims[0].defensibility.score).toBe(0);
    expect(result.claims[0].type).toBe('revenue');
  });

  it('skips subtotal / total rows', () => {
    const wb = makeWorkbook([
      {
        name: 'Synergies',
        rows: [
          ['Initiative', 'Year 1', 'Run-rate'],
          ['Cross-sell campaigns', 5000000, 12000000],
          ['Cost takeout in finance', 2000000, 6000000],
          ['Total', 7000000, 18000000],
          ['Subtotal', 7000000, 18000000],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.claims).toHaveLength(2); // Total + Subtotal skipped
    expect(result.claims.map(c => c.label)).not.toContain('Total');
    expect(result.claims.map(c => c.label)).not.toContain('Subtotal');
  });

  it('aggregates totals across claims with year-1 + run-rate amounts', () => {
    const wb = makeWorkbook([
      {
        name: 'Synergies',
        rows: [
          ['Initiative', 'Year 1', 'Run-rate'],
          ['A', 1000, 3000],
          ['B', 2000, 5000],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.totalProjectedYear1).toBe(3000);
    expect(result.totalProjectedRunRate).toBe(8000);
  });

  it('confidence is high with ≥5 claims on a synergy-named sheet', () => {
    const wb = makeWorkbook([
      {
        name: 'Synergy build-up',
        rows: [
          ['Item', 'Year 1', 'Run-rate'],
          ['A', 1, 2],
          ['B', 1, 2],
          ['C', 1, 2],
          ['D', 1, 2],
          ['E', 1, 2],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.confidence).toBe('high');
  });

  it('detects synergy context even when sheet name is generic (Sheet1)', () => {
    const wb = makeWorkbook([
      {
        name: 'Sheet1',
        rows: [
          ['Synergy projections by initiative', '', '', ''],
          ['', '', '', ''],
          ['Initiative', 'Year 1', 'Year 2', 'Run-rate'],
          ['Cross-sell', 5000000, 12000000, 18000000],
          ['Vendor consolidation', 2000000, 4000000, 6000000],
        ],
      },
    ]);
    const result = extractSynergyStructure(wb);
    expect(result.detected).toBe(true);
    expect(result.claims).toHaveLength(2);
  });
});

describe('formatSynergyStructureForAudit', () => {
  it('returns empty string when no claims detected', () => {
    const wb = makeWorkbook([
      { name: 'Sheet1', rows: [['Revenue', 'Q1'], ['Total', 100]] },
    ]);
    const structure = extractSynergyStructure(wb);
    expect(formatSynergyStructureForAudit(structure)).toBe('');
  });

  it('emits a structured block with markers + portfolio summary + per-claim verdicts', () => {
    const wb = makeWorkbook([
      {
        name: 'Synergies',
        rows: [
          ['Item', 'Year 1', 'Run-rate'],
          ['Cross-sell campaigns', 5000000, 12000000],
        ],
      },
    ]);
    const structure = extractSynergyStructure(wb);
    const block = formatSynergyStructureForAudit(structure);
    expect(block).toContain('=== STRUCTURED SYNERGY MODEL — PARSED PRE-AUDIT ===');
    expect(block).toContain('=== END STRUCTURED SYNERGY MODEL ===');
    expect(block).toContain('PORTFOLIO DEFENSIBILITY:');
    expect(block).toContain('PER-CLAIM AUDIT');
    expect(block).toContain('Cross-sell campaigns');
    expect(block).toContain('Verdict:');
  });
});
