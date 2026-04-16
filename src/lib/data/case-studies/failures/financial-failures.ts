import { CaseStudy } from '../types';

// Deduped 2026-04-16: cs-fail-fin-001 Enron (legacy fin-006 kept, Tier 1+),
// cs-fail-fin-003 FTX (legacy fin-010 kept), cs-fail-fin-004 SVB (legacy fin-011 kept).

export const FINANCIAL_FAILURE_CASES: CaseStudy[] = [
  {
    id: 'cs-fail-fin-002',
    title: 'WorldCom $11B Accounting Fraud',
    company: 'WorldCom',
    industry: 'telecommunications',
    year: 2002,
    yearRealized: 2002,
    summary:
      "WorldCom's CEO Bernie Ebbers and CFO Scott Sullivan orchestrated an $11 billion accounting fraud by capitalizing operating expenses as capital expenditures, inflating reported earnings. Internal auditor Cynthia Cooper discovered the fraud in June 2002 despite resistance from senior finance executives. The company filed for bankruptcy in July 2002 with $107 billion in assets — surpassing Enron as the largest U.S. bankruptcy at the time.",
    decisionContext:
      'Whether to continue capitalizing line costs (operating expenses) as capital expenditures to maintain the appearance of profitability and meet Wall Street earnings estimates.',
    outcome: 'catastrophic_failure',
    impactScore: 96,
    estimatedImpact: '$180B in market capitalization destroyed',
    impactDirection: 'negative',
    biasesPresent: ['authority_bias', 'groupthink', 'confirmation_bias', 'sunk_cost_fallacy'],
    primaryBias: 'authority_bias',
    toxicCombinations: ['Echo Chamber', 'Sunk Ship'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: true,
      unanimousConsensus: true,
      participantCount: 8,
      dissentEncouraged: false,
      externalAdvisors: false,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'Authority bias toward the CEO created an environment where the CFO felt empowered to commit fraud rather than report disappointing results.',
      "The sunk cost of WorldCom's acquisition-driven growth strategy made leadership incapable of admitting the organic growth model was broken.",
      'Internal audit independence — Cynthia Cooper reported to the audit committee, not the CFO — was the only mechanism that ultimately exposed the fraud.',
    ],
    preDecisionEvidence: {
      document:
        "Effective immediately, all line cost entries above $5 million are to be reclassified from operating expense accounts to capital expenditure accounts under the prepaid capacity line item. This adjustment reflects management's revised view that these costs represent long-term network investments with multi-year useful lives. Do not discuss these reclassifications with external auditors until further notice.",
      source: 'CFO Scott Sullivan, internal accounting policy directive to WorldCom comptroller',
      date: '2001',
      documentType: 'internal_memo',
      detectableRedFlags: [
        'Reclassification of $3.8B in operating line costs as capital expenditures — a direct violation of GAAP expense recognition',
        'Revenue declining quarter-over-quarter while reported earnings remained stable, masking deterioration through accounting adjustments',
        'Internal auditor Cynthia Cooper blocked from reviewing general ledger entries by senior finance staff',
      ],
      flaggableBiases: ['authority_bias', 'groupthink', 'sunk_cost_fallacy'],
      hypotheticalAnalysis:
        "A decision intelligence platform would have detected the anomalous divergence between declining telecom revenue industry-wide and WorldCom's stable reported earnings, flagging the sudden spike in capitalized line costs as inconsistent with historical patterns. The directive to exclude external auditors from reviewing entries would have triggered a critical transparency alert, and authority bias scoring would have identified the CFO's unilateral control over accounting classifications as a single point of failure.",
    },
    source:
      'WorldCom Inc. Chapter 11 filing, S.D.N.Y. Case No. 02-13533; SEC v. WorldCom Inc. (2002); Cynthia Cooper, "Extraordinary Circumstances" (2008)',
    sourceType: 'sec_filing',
  },
  {
    id: 'cs-fail-fin-005',
    title: 'GE Capital and the Destruction of General Electric',
    company: 'General Electric',
    industry: 'manufacturing',
    year: 2008,
    yearRealized: 2018,
    summary:
      'Under Jack Welch and Jeff Immelt, GE transformed from an industrial conglomerate into a financial services company, with GE Capital contributing over 50% of earnings by 2007. The financial crisis exposed massive subprime exposure, forcing a $15 billion capital raise and a government bailout. Immelt then doubled down on oil and gas acquisitions at peak valuations. From 2000 to 2018, GE destroyed over $200 billion in market capitalization and was removed from the Dow Jones.',
    decisionContext:
      'Whether to continue growing GE Capital as the primary earnings driver despite increasing concentration risk in financial services, or return to industrial fundamentals.',
    outcome: 'catastrophic_failure',
    impactScore: 94,
    estimatedImpact: '$200B+ in market capitalization destroyed over 18 years',
    impactDirection: 'negative',
    biasesPresent: [
      'overconfidence_bias',
      'sunk_cost_fallacy',
      'anchoring_bias',
      'confirmation_bias',
      'status_quo_bias',
    ],
    primaryBias: 'overconfidence_bias',
    toxicCombinations: ['Sunk Ship', 'Optimism Trap', 'Status Quo Lock'],
    beneficialPatterns: [],
    biasesManaged: [],
    mitigationFactors: [],
    survivorshipBiasRisk: 'low',
    contextFactors: {
      monetaryStakes: 'very_high',
      dissentAbsent: true,
      timePressure: false,
      unanimousConsensus: true,
      participantCount: 15,
      dissentEncouraged: false,
      externalAdvisors: true,
      iterativeProcess: false,
    },
    lessonsLearned: [
      'The "GE Way" culture created such strong authority bias that successive CEOs were unable to challenge the strategic direction established by Jack Welch.',
      'Sunk cost in financial services infrastructure made it psychologically impossible to divest GE Capital even as concentration risk became existential.',
      'Anchoring to peak-cycle oil prices for the Alstom and Baker Hughes acquisitions compounded the original GE Capital mistake with new capital misallocation.',
    ],
    preDecisionEvidence: {
      document:
        "GE Capital is the growth engine of this company, and we intend to expand its reach. Financial services now represent our highest-return businesses, generating consistent double-digit earnings growth. We will continue to deploy capital into financial services — insurance, commercial lending, and consumer finance — where GE's management discipline and operational rigor give us a structural advantage over traditional banks. Our industrial businesses provide the foundation, but GE Capital provides the growth.",
      source: 'Jeff Immelt, 2003 annual shareholder letter',
      date: '2003',
      documentType: 'public_statement',
      detectableRedFlags: [
        'GE Capital growing to contribute 55% of consolidated earnings, transforming an industrial conglomerate into a de facto unregulated bank',
        'Industrial conglomerate structure masking financial services concentration risk from investors and regulators',
        "Complexity of GE Capital's portfolio — insurance, subprime lending, commercial real estate — making independent risk assessment nearly impossible",
        'Stock buybacks and dividend increases funded by financial leverage rather than industrial cash flows',
      ],
      flaggableBiases: [
        'overconfidence',
        'anchoring_bias',
        'sunk_cost_fallacy',
        'narrative_fallacy',
      ],
      hypotheticalAnalysis:
        'A decision intelligence platform would have flagged the concentration risk of a single business unit contributing over half of earnings, particularly one operating in financial services without bank-level regulatory oversight or capital requirements. The narrative fallacy of "GE management discipline" being transferable to financial risk management would have been identified as unsupported by evidence. The platform would have modeled tail-risk scenarios showing that a financial crisis would simultaneously impair GE Capital\'s assets and eliminate the company\'s ability to raise capital.',
    },
    source:
      'GE 10-K filings (2007-2018); Thomas Gryta and Ted Mann, "Lights Out: Pride, Delusion, and the Fall of General Electric" (2020); SEC investigation of GE accounting (2020)',
    sourceType: 'sec_filing',
  },
];
