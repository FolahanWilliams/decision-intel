import { describe, it, expect } from 'vitest';
import { extractEntities, inferDocumentDate } from './entityExtractor';

describe('extractEntities', () => {
  it('extracts organizations with common suffixes', () => {
    const content =
      'The investment in Helios Capital Partners was reviewed alongside the Sankore Holdings deal and the Apex Industries portfolio.';
    const result = extractEntities(content);
    expect(result.organizations.length).toBeGreaterThan(0);
    expect(result.organizations.some(o => o.includes('Helios'))).toBe(true);
    expect(result.organizations.some(o => o.includes('Sankore'))).toBe(true);
    expect(result.organizations.some(o => o.includes('Apex'))).toBe(true);
  });

  it('extracts amounts in multiple currencies', () => {
    const content =
      'The deal closed at $50 million with a £12 billion fund, €8M follow-on, and ₦3 billion local-currency tranche. IRR of 32% delivered.';
    const result = extractEntities(content);
    expect(result.amounts.length).toBeGreaterThan(3);
  });

  it('extracts project codenames', () => {
    const content =
      'Project Atlas was approved by the IC. Operation Helios remains in diligence. Initiative Phoenix was deprioritized.';
    const result = extractEntities(content);
    expect(result.projectCodenames).toContain('Project Atlas');
  });

  it('returns empty arrays for content with no entities', () => {
    const content = 'this is plain lowercase text with no entities or amounts to find.';
    const result = extractEntities(content);
    expect(result.organizations).toEqual([]);
    expect(result.amounts).toEqual([]);
    expect(result.projectCodenames).toEqual([]);
  });

  it('dedupes repeated entities', () => {
    const content =
      'Apex Capital is a great firm. Apex Capital invested in Project Atlas. Apex Capital then exited Project Atlas. Apex Capital is great.';
    const result = extractEntities(content);
    expect(result.organizations.filter(o => o === 'Apex Capital').length).toBe(1);
    expect(result.projectCodenames.filter(p => p === 'Project Atlas').length).toBe(1);
  });
});

describe('inferDocumentDate', () => {
  it('extracts ISO-like dates from filename', () => {
    expect(inferDocumentDate('memo-2018-09-15.pdf', '')).toBe('2018-09-15');
  });

  it('extracts ISO dates from content', () => {
    expect(inferDocumentDate('doc.pdf', 'Decision recorded on 2020-03-01.')).toBe('2020-03-01');
  });

  it('extracts month + year combinations', () => {
    expect(inferDocumentDate('doc.pdf', 'IC review held in September 2018.')).toBe('2018-09-01');
  });

  it('extracts quarter notation', () => {
    expect(inferDocumentDate('doc.pdf', 'Closing target: Q3 2020.')).toBe('2020-07-01');
  });

  it('prefers higher-confidence patterns when multiple present', () => {
    // Bare year (low) vs ISO date (high)
    const content = 'In 2018, the team committed. The actual filing on 2018-09-15 sealed it.';
    expect(inferDocumentDate('doc.pdf', content)).toBe('2018-09-15');
  });

  it('returns undefined when no date pattern fires', () => {
    expect(inferDocumentDate('doc.pdf', 'no temporal information here at all.')).toBeUndefined();
  });

  it('handles bare-year fallback', () => {
    expect(inferDocumentDate('doc.pdf', 'Investment thesis prepared for 2019.')).toBe('2019-06-01');
  });
});
