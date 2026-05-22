import { describe, it, expect } from 'vitest';
import {
  extractOutcomeDraftDeterministic,
  detectDocumentRole,
  OUTCOME_PATTERNS_EXPORTED,
  METRIC_PATTERNS_EXPORTED,
} from './outcomeExtractor';

describe('extractOutcomeDraftDeterministic', () => {
  it('returns null for empty or near-empty content', () => {
    expect(
      extractOutcomeDraftDeterministic({
        sourceDocumentId: 'd',
        content: '',
        kind: 'investment',
      })
    ).toBeNull();
    expect(
      extractOutcomeDraftDeterministic({
        sourceDocumentId: 'd',
        content: 'too short',
        kind: 'investment',
      })
    ).toBeNull();
  });

  it('detects positive exit signal on an investment doc', () => {
    const content =
      'After 28 months in the portfolio, the company was sold to a strategic acquirer. Exited at $450 million. IRR of 32%.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'doc-1',
      content,
      kind: 'investment',
    });
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('positive');
    expect(result!.verdict).toBe('value_created');
    expect(result!.evidenceQuotes.length).toBeGreaterThan(0);
    // The actual sentence containing the signal should be quoted
    expect(result!.evidenceQuotes.join(' ')).toMatch(/sold|exit|IRR/i);
  });

  it('detects negative write-down signal on an acquisition doc', () => {
    const content =
      'Three years post-close, the integration faltered and we wrote down $180 million on the deal. Synergies were not realised; the projected operational improvements failed to materialise.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'doc-2',
      content,
      kind: 'acquisition',
    });
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('negative');
    expect(result!.verdict).toBe('value_destroyed');
    expect(result!.extractionConfidence).toBeGreaterThan(0.3);
  });

  it('detects too-early signal and returns appropriate verdict', () => {
    const content =
      'The investment closed in Q3 2024. It is too early to tell whether the thesis will play out as expected; the company is still in early-stage execution. Outcome remains pending.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'doc-3',
      content,
      kind: 'investment',
    });
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('too_early');
    expect(result!.verdict).toBe('too_early_to_tell');
  });

  it('extracts structured metrics when present', () => {
    const content =
      'The portfolio company was exited after 22 months at $250 million. IRR of 41%, MOIC of 3.2x against a fund target of 2.5x.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'doc-4',
      content,
      kind: 'investment',
    });
    expect(result).not.toBeNull();
    const metricLabels = result!.draftMetrics.map(m => m.label);
    expect(metricLabels).toContain('IRR');
    expect(metricLabels).toContain('MOIC');
    expect(metricLabels).toContain('Time to exit (months)');
  });

  it('verbatim quotes are literal substrings of the source content', () => {
    const content =
      'The investment was a success. The company was acquired by a strategic at a 3x multiple after 30 months in our portfolio. Fund returned 28%.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'doc-5',
      content,
      kind: 'investment',
    });
    expect(result).not.toBeNull();
    for (const quote of result!.evidenceQuotes) {
      // Strip trailing ellipsis from the quote helper output
      const trimmed = quote.replace(/\.\.\.$/, '').trim();
      expect(content.includes(trimmed.split(' ').slice(0, 5).join(' '))).toBe(true);
    }
  });

  it('never fabricates an outcome — returns null when no signals fire', () => {
    const content =
      'This memorandum describes general market conditions in the consumer sector. No specific decision is referenced. Various trends are discussed.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'doc-6',
      content,
      kind: 'investment',
    });
    expect(result).toBeNull();
  });

  it('applies kind-specific patterns correctly', () => {
    // Strategic-only signal — "project was abandoned" should fire on strategic
    const content = 'After 18 months, the project was abandoned due to changing market priorities.';
    const strategic = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'doc-7',
      content,
      kind: 'strategic',
    });
    expect(strategic).not.toBeNull();
    expect(strategic!.direction).toBe('negative');
  });

  it('confidence scales with multiple hits', () => {
    const single = 'The deal was abandoned three years later.';
    const multi =
      'The deal was abandoned three years later. Synergies were not realised. The integration was terminated. Loss of $120 million was recorded.';
    const singleResult = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'd',
      content: single,
      kind: 'acquisition',
    });
    const multiResult = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'd',
      content: multi,
      kind: 'acquisition',
    });
    expect(singleResult).not.toBeNull();
    expect(multiResult).not.toBeNull();
    expect(multiResult!.extractionConfidence).toBeGreaterThan(singleResult!.extractionConfidence);
  });

  it('draft narrative is non-empty and references the inferred direction', () => {
    const content = 'The deal closed and we exited at $200 million after 24 months. IRR of 35%.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'd',
      content,
      kind: 'investment',
    });
    expect(result).not.toBeNull();
    expect(result!.draftNarrative.length).toBeGreaterThan(10);
    expect(result!.draftNarrative.toLowerCase()).toContain('value');
  });

  it('extractedAt is a valid ISO date', () => {
    const content =
      'The deal was abandoned in mid-2022. Synergies projected at $40M were not realised; the integration was wound down.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'd',
      content,
      kind: 'acquisition',
    });
    expect(result).not.toBeNull();
    expect(new Date(result!.extractedAt).toString()).not.toBe('Invalid Date');
  });

  it('extractionTier is "regex" for deterministic extractions', () => {
    const content =
      'The fund returned 32% versus a target of 25%. Strong year on year performance against benchmark.';
    const result = extractOutcomeDraftDeterministic({
      sourceDocumentId: 'd',
      content,
      kind: 'investment',
    });
    expect(result).not.toBeNull();
    expect(result!.extractionTier).toBe('regex');
  });

  it('has at least 10 outcome patterns + at least 5 metric patterns', () => {
    expect(OUTCOME_PATTERNS_EXPORTED.length).toBeGreaterThanOrEqual(10);
    expect(METRIC_PATTERNS_EXPORTED.length).toBeGreaterThanOrEqual(5);
  });
});

describe('detectDocumentRole', () => {
  it('returns unknown for empty / tiny content', () => {
    expect(detectDocumentRole('').role).toBe('unknown');
    expect(detectDocumentRole('hi').role).toBe('unknown');
  });

  it('detects a memo from pre-decision language', () => {
    const memo = `
      EXECUTIVE SUMMARY

      We recommend the committee approve a $50M investment in Project Helix.

      Investment thesis: The target operates in a high-growth market with 35% projected IRR.

      Risks include: regulatory uncertainty in the target jurisdiction, integration complexity,
      and customer concentration. The deal rationale rests on three pillars.

      Approval requested at the next IC meeting.
    `;
    const result = detectDocumentRole(memo);
    expect(result.role).toBe('memo');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects an outcome doc from post-decision language', () => {
    const outcome = `
      POST-MORTEM: Project Helix

      Actual returns vs projected: the investment delivered 18% IRR against a 35% target.

      Synergies were not realised. The integration was wound down in Q3.

      Lessons learned: customer concentration risk was understated; the regulatory
      timeline assumption proved optimistic.

      Year-three performance review confirms we missed our target.
    `;
    const result = detectDocumentRole(outcome);
    expect(result.role).toBe('outcome');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('detects mixed when both decision + outcome language present', () => {
    const mixed = `
      DECISION REVIEW: Project Atlas (2018)

      Original recommendation: invest $30M at a 25% IRR target.

      Actual outcome: the company exited at $90M, delivering 31% IRR.

      Investment thesis was: market share would grow from 12% to 30%.

      Lessons learned: the market share growth was driven by a regulatory tailwind
      we hadn't fully appreciated; the upside materialised faster than projected.
    `;
    const result = detectDocumentRole(mixed);
    expect(result.role).toBe('mixed');
  });
});
