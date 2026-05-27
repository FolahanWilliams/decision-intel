/**
 * Tests for the per-case-study SEO helpers.
 *
 * Locks the CTR-optimization templates from drifting silently. The
 * GSC-validated leak is that the prior generic title format
 * (`${company} (${year}): ${title} | Decision Intel Case Study`)
 * was getting 0 clicks on 50 impressions over 3 months — these
 * tests pin the new templates so a future "improvement" can't
 * regress to a generic shape without the test suite flagging.
 */

import { describe, it, expect } from 'vitest';
import {
  generateCaseStudySeoTitle,
  generateCaseStudySeoDescription,
  generateCaseStudyFaqs,
  findRelatedCases,
} from './seo';
import type { CaseStudy } from './types';

// ─── Test fixture: realistic failure case (Barings-shaped) ────────

const baringsLike: CaseStudy = {
  id: 'test-barings',
  title: 'Barings Bank Collapse',
  company: 'Barings Bank',
  industry: 'financial_services',
  year: 1995,
  yearRealized: 1995,
  summary:
    'Nick Leeson accumulated $1.3 billion in hidden losses through unauthorized trading. The 233-year-old bank collapsed.',
  decisionContext:
    'London management granted unsupervised trading + settlement authority to one Singapore trader.',
  outcome: 'catastrophic_failure',
  impactScore: 95,
  estimatedImpact: '$1.3B in hidden trading losses; bank collapse',
  impactDirection: 'negative',
  biasesPresent: [
    'authority_bias',
    'illusion_of_control',
    'overconfidence_bias',
    'confirmation_bias',
  ],
  primaryBias: 'authority_bias',
  toxicCombinations: ['Unchallenged Authority + Hidden Losses'],
  beneficialPatterns: [],
  biasesManaged: [],
  mitigationFactors: [],
  survivorshipBiasRisk: 'low',
  contextFactors: {
    monetaryStakes: 'very_high',
    dissentAbsent: true,
    timePressure: false,
    unanimousConsensus: false,
    participantCount: 3,
    dissentEncouraged: false,
    externalAdvisors: false,
    iterativeProcess: false,
  },
  lessonsLearned: ['Segregation of duties matters'],
  source: 'Bank of England report',
  sourceType: 'case_study',
};

// ─── Test fixture: realistic success case (Toyota-shaped) ─────────

const toyotaLike: CaseStudy = {
  ...baringsLike,
  id: 'test-toyota',
  title: 'Toyota Production System',
  company: 'Toyota Motor Corporation',
  industry: 'automotive',
  year: 1988,
  yearRealized: 2000,
  summary: 'Lean manufacturing scaled across 12 plants.',
  decisionContext: 'Iterative refinement with dissent welcomed at every level.',
  outcome: 'exceptional_success',
  estimatedImpact: '40% productivity gain; category-defining quality leadership',
  impactDirection: 'positive',
  biasesPresent: ['groupthink', 'sunk_cost_fallacy'],
  primaryBias: 'groupthink',
  toxicCombinations: [],
  biasesManaged: ['groupthink', 'sunk_cost_fallacy'],
  survivorshipBiasRisk: 'medium',
  mitigationFactors: ['Iterative process', 'Active dissent encouragement'],
};

// ─── generateCaseStudySeoTitle ───────────────────────────────────

describe('generateCaseStudySeoTitle', () => {
  it('promises the bias count in the title for a failure case', () => {
    const title = generateCaseStudySeoTitle(baringsLike);
    expect(title).toContain('Barings Bank');
    expect(title).toContain('Collapse');
    expect(title).toContain('1995');
    expect(title).toContain('4 Cognitive Bias Patterns');
    expect(title).toContain('Decision Intel');
  });

  it('uses success language for a success case', () => {
    const title = generateCaseStudySeoTitle(toyotaLike);
    expect(title).toContain('Toyota');
    expect(title).toContain('Breakthrough');
    expect(title).toContain('1988');
    expect(title).toContain('2 Decision Patterns');
    expect(title).toContain('Powered');
  });

  it('never exceeds 130 chars (room for SERP rendering)', () => {
    expect(generateCaseStudySeoTitle(baringsLike).length).toBeLessThanOrEqual(130);
    expect(generateCaseStudySeoTitle(toyotaLike).length).toBeLessThanOrEqual(130);
  });

  it('always ends with " | Decision Intel" brand anchor', () => {
    expect(generateCaseStudySeoTitle(baringsLike).endsWith(' | Decision Intel')).toBe(true);
    expect(generateCaseStudySeoTitle(toyotaLike).endsWith(' | Decision Intel')).toBe(true);
  });

  it('handles cases with no estimatedImpact gracefully', () => {
    const noImpact = { ...baringsLike, estimatedImpact: '' };
    const title = generateCaseStudySeoTitle(noImpact);
    expect(title).toContain('the Outcome');
    expect(title.length).toBeLessThanOrEqual(130);
  });
});

// ─── generateCaseStudySeoDescription ─────────────────────────────

describe('generateCaseStudySeoDescription', () => {
  it('leads with the impact statement', () => {
    const desc = generateCaseStudySeoDescription(baringsLike);
    expect(desc).toContain('$1.3B');
  });

  it('names bias count + toxic count', () => {
    const desc = generateCaseStudySeoDescription(baringsLike);
    expect(desc).toContain('4 cognitive bias patterns');
    expect(desc).toContain('1 compound failure');
  });

  it('uses singular when toxic count is 1', () => {
    const desc = generateCaseStudySeoDescription(baringsLike);
    // Description reads "...4 cognitive bias patterns + 1 compound failure audited retroactively."
    // The singular check is the absence of trailing "s" on "failure".
    expect(desc).toContain('1 compound failure');
    expect(desc).not.toContain('1 compound failures');
  });

  it('uses plural when toxic count > 1', () => {
    const two = {
      ...baringsLike,
      toxicCombinations: ['A', 'B'],
    };
    const desc = generateCaseStudySeoDescription(two);
    expect(desc).toContain('2 compound failures');
  });

  it('omits the compound-failure phrase when toxicCount is 0', () => {
    const desc = generateCaseStudySeoDescription(toyotaLike);
    expect(desc).not.toContain('compound failure');
    expect(desc).toContain('2 cognitive bias patterns');
  });

  it('stays under 180 chars (Google snippet cap)', () => {
    expect(generateCaseStudySeoDescription(baringsLike).length).toBeLessThanOrEqual(180);
    expect(generateCaseStudySeoDescription(toyotaLike).length).toBeLessThanOrEqual(180);
  });

  it('names the document type when preDecisionEvidence is present', () => {
    const withEvidence = {
      ...baringsLike,
      preDecisionEvidence: {
        document: 'memo body',
        source: 'Barings Singapore',
        date: '1994',
        documentType: 'internal_memo' as const,
        detectableRedFlags: ['concentration risk'],
        flaggableBiases: ['authority_bias'],
        hypotheticalAnalysis: 'The audit would have caught X.',
      },
    };
    const desc = generateCaseStudySeoDescription(withEvidence);
    expect(desc).toContain('internal memo');
  });
});

// ─── generateCaseStudyFaqs ───────────────────────────────────────

describe('generateCaseStudyFaqs', () => {
  it('always includes at least 3 FAQs', () => {
    expect(generateCaseStudyFaqs(baringsLike).length).toBeGreaterThanOrEqual(3);
    expect(generateCaseStudyFaqs(toyotaLike).length).toBeGreaterThanOrEqual(3);
  });

  it('names the company in every FAQ question or answer text', () => {
    const faqs = generateCaseStudyFaqs(baringsLike);
    // At least two FAQs reference the company by name (the audit-method
    // FAQ is intentionally generic).
    const namedCount = faqs.filter(
      f => f.q.includes('Barings Bank') || f.a.includes('Barings Bank')
    ).length;
    expect(namedCount).toBeGreaterThanOrEqual(2);
  });

  it('lists the primary bias in the first FAQ answer', () => {
    const faqs = generateCaseStudyFaqs(baringsLike);
    // formatBiasName maps "authority_bias" → "Authority Bias"
    expect(faqs[0].a).toContain('Authority Bias');
  });

  it('adds the pre-decision FAQ when evidence present', () => {
    const withEvidence = {
      ...baringsLike,
      preDecisionEvidence: {
        document: 'memo body',
        source: 'Barings Singapore',
        date: '1994',
        documentType: 'internal_memo' as const,
        detectableRedFlags: ['concentration risk', 'segregation failure'],
        flaggableBiases: ['authority_bias'],
        hypotheticalAnalysis: 'The audit would have caught the concentration in Singapore.',
      },
    };
    const faqs = generateCaseStudyFaqs(withEvidence);
    const pdeFaq = faqs.find(f => f.q.includes('at the time'));
    expect(pdeFaq).toBeDefined();
    expect(pdeFaq?.a).toContain('2 red flags');
  });

  it('does NOT add the pre-decision FAQ when evidence absent', () => {
    const faqs = generateCaseStudyFaqs(baringsLike);
    const pdeFaq = faqs.find(f => f.q.includes('at the time'));
    expect(pdeFaq).toBeUndefined();
  });

  it('always includes the platform-explainer FAQ for AI ingestion', () => {
    const faqs = generateCaseStudyFaqs(baringsLike);
    const platformFaq = faqs.find(f => f.q.includes("Decision Intel's reasoning audit"));
    expect(platformFaq).toBeDefined();
    expect(platformFaq?.a).toContain('R²F');
    expect(platformFaq?.a).toContain('DPR');
  });
});

// ─── findRelatedCases ────────────────────────────────────────────

describe('findRelatedCases', () => {
  it('never returns the input case in the results', () => {
    // Use a real case to exercise the live ALL_CASES.
    const related = findRelatedCases(baringsLike);
    expect(related.find(r => r.id === baringsLike.id)).toBeUndefined();
  });

  it('returns at most the requested limit', () => {
    expect(findRelatedCases(baringsLike, 2).length).toBeLessThanOrEqual(2);
    expect(findRelatedCases(baringsLike, 4).length).toBeLessThanOrEqual(4);
  });

  it('returns CaseStudy shapes (not scores or partial objects)', () => {
    const related = findRelatedCases(baringsLike, 2);
    for (const r of related) {
      expect(typeof r.id).toBe('string');
      expect(typeof r.title).toBe('string');
      expect(typeof r.company).toBe('string');
      expect(Array.isArray(r.biasesPresent)).toBe(true);
    }
  });
});
