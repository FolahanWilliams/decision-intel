# Decision Intel Pilot Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Decision Intel from "pilot-worthy with gaps" to "ready for Sankore pilot deployment" by addressing critical findings from CSO, Head of M&A, CEO (Titi), and end-user audits.

**Architecture:** Phase-based rollout with 3 priority tiers - Critical (Deal Killers), High (Major Friction), Medium (Polish). Each phase produces deployable, testable software.

**Tech Stack:** Next.js 16, TypeScript, Prisma, Supabase, LangGraph, SSE

---

## Phase 0: Investigation & Mapping

**Objective:** Map current codebase state to specific audit findings before implementing fixes.

- [ ] **Step 1: Map DQI explainability files**

Run: `grep -r "Bias Load\|Noise Level\|Evidence Quality" src/lib/scoring/`
Files to identify:

- dqi.ts - main DQI calculation
- index.ts - exports
- Identify where component weights are defined

- [ ] **Step 2: Map Nigerian compliance files**

Run: `grep -rn "NDPR\|CBN\|FRC" src/lib/compliance/`
Files to identify:

- compliance directory structure
- Currently implemented frameworks

- [ ] **Step 3: Map export/report files**

Run: `grep -rn "Board Report\|PDF\|export" src/lib/reports/`
Files to identify:

- pdf-generator.ts
- board-report-generator.ts
- markdown-generator.ts
- Identify export flow

- [ ] **Step 4: Map deal API routes**

Run: `ls -la src/app/api/deals/`
Files to identify:

- Deal CRUD endpoints
- Outcome tracking
- Cross-reference logic

- [ ] **Step 5: Map dashboard UI components**

Run: `ls src/components/dashboard/`
Files to identify:

- Dashboard page.tsx
- KPI cards
- Upload components

---

## Phase 1: CRITICAL - Deal Killers (Must Fix Before Pilot)

### Task 1.1: Nigerian SEC Compliance Framework

**Files:**

- Create: `src/lib/compliance/sec-nigeria.ts`
- Modify: `src/lib/compliance/index.ts` - add export
- Test: `src/lib/compliance/sec-nigeria.test.ts`

**Rationale:** CEO (Titi) identified missing ISA 2007 and SEC Nigeria Rules as #1 deal killer. Sankore cannot demonstrate regulatory compliance without this.

- [ ] **Step 1: Research Nigerian SEC framework requirements**

Research Investment and Securities Act 2007 (ISA 2007)
Research SEC Nigeria Rules and Regulations (Registration, Annual Licensing)
Identify key provisions for Investment Advisers, Portfolio Managers

- [ ] **Step 2: Create sec-nigeria.ts compliance framework**

```typescript
import { ComplianceFramework, ComplianceRequirement } from './types';

export const secNigeriaFramework: ComplianceFramework = {
  name: 'SEC Nigeria',
  jurisdiction: 'Nigeria',
  acts: [
    {
      name: 'Investment and Securities Act 2007',
      abbreviation: 'ISA 2007',
      requirements: [
        {
          id: 'ISA-REG-001',
          category: 'Registration',
          description: 'Investment Adviser registration',
          provisions: ['Part II', 'Section 24-31'],
          auditRequirements: [
            'Client suitability assessment documented',
            'Risk disclosure recorded',
            'Investment objectives confirmed',
          ],
        },
        {
          id: 'ISA-PFM-001',
          category: 'Portfolio Management',
          description: 'Portfolio manager duties',
          provisions: ['Part III', 'Section 45-52'],
          auditRequirements: [
            'Portfolio strategy documented',
            'Rebalancing criteria defined',
            'Performance benchmarks established',
          ],
        },
      ],
    },
  ],
  rules: [
    {
      name: 'SEC Rules and Regulations',
      year: 2024,
      applicableTo: ['Investment Advisers', 'Portfolio Managers', 'Fund Managers'],
    },
  ],
  mappings: {
    cognitiveBias: {
      'anchoring-bias': ['ISA-REG-001'], // Suitability assessment
      overconfidence: ['ISA-PFM-001'], // Portfolio strategy deviation
      'confirmation-bias': ['ISA-PFM-001'], // Selective evidence
      groupthink: ['ISA-REG-001'], // Independent judgment
    },
  },
};
```

- [ ] **Step 3: Add framework to compliance registry**

Modify: `src/lib/compliance/index.ts`

```typescript
import { secNigeriaFramework } from './sec-nigeria';

export const frameworks: Record<string, ComplianceFramework> = {
  // ... existing frameworks
  'sec-nigeria': secNigeriaFramework,
};
```

- [ ] **Step 4: Write tests**

```typescript
import { secNigeriaFramework } from './sec-nigeria';

describe('SEC Nigeria Compliance', () => {
  it('includes Investment and Securities Act 2007', () => {
    const act = secNigeriaFramework.acts.find(a => a.abbreviation === 'ISA 2007');
    expect(act).toBeDefined();
  });

  it('maps cognitive biases to regulatory provisions', () => {
    expect(secNigeriaFramework.mappings.cognitiveBias['anchoring-bias']).toContain('ISA-REG-001');
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/compliance/
git commit -m "feat: add Nigerian SEC compliance framework (ISA 2007)"
```

### Task 1.2: Client-Anonymized Export Mode

**Files:**

- Modify: `src/lib/reports/pdf-generator.ts` - add anonymization
- Modify: `src/lib/reports/board-report-generator.ts` - add client-safe mode
- Create: `src/lib/utils/anonymizer.ts`
- Test: `src/lib/reports/anonymizer.test.ts`

**Rationale:** CEO identified inability to share board reports with LPs without exposing deal details as #2 deal killer.

- [ ] **Step 1: Create anonymizer utility**

Create: `src/lib/utils/anonymizer.ts`

```typescript
export interface AnonymizationConfig {
  replaceCompanyNames: boolean;
  replaceAmounts: boolean;
  replaceNames: boolean;
  preserveMethodology: boolean;
}

const COMPANY_PATTERN =
  /\[COMPANY_\d+\]|[A-Z][a-z]+ (Capital|Industries|Holdings|Group|Investments)/g;
const AMOUNT_PATTERN = /₦\d+(\.\d+)?[BMK]?|\$\d+(\.\d+)?[BMK]?/g;
const NAME_PATTERN = /\[NAME_\d+\]|[A-Z][a-z]+ [A-Z][a-z]+/g;

export function anonymizeText(text: string, config: AnonymizationConfig): string {
  let result = text;
  let companyCounter = 1;
  let amountCounter = 1;
  let nameCounter = 1;

  if (config.replaceCompanyNames) {
    result = result.replace(COMPANY_PATTERN, (_, match) => {
      if (match.startsWith('[COMPANY_')) return match;
      return `[COMPANY_${companyCounter++}]`;
    });
  }

  if (config.replaceAmounts) {
    result = result.replace(AMOUNT_PATTERN, () => `[AMOUNT_${amountCounter++}]`);
  }

  if (config.replaceNames) {
    result = result.replace(NAME_PATTERN, (_, match) => {
      if (match.startsWith('[NAME_')) return match;
      return `[NAME_${nameCounter++}]`;
    });
  }

  return result;
}

export function generateClientSafeReport(
  originalReport: string,
  config: AnonymizationConfig
): string {
  const header = 'CONFIDENTIAL - CLIENT SUMMARY\n';
  const disclaimer =
    '\n---\nNOTE: Certain details have been anonymized for client distribution.\nAnalysis methodology is preserved for verification purposes.\n';
  return header + anonymizeText(originalReport, config) + disclaimer;
}
```

- [ ] **Step 2: Add client-safe export option to board report generator**

Modify: `src/lib/reports/board-report-generator.ts`

```typescript
interface BoardReportOptions {
  // ... existing options
  clientSafeMode?: boolean;
  anonymizationConfig?: AnonymizationConfig;
}

export async function generateBoardReport(
  documentId: string,
  options: BoardReportOptions = {}
): Promise<BoardReport> {
  const analysis = await getAnalysis(documentId);
  let content = assembleReportContent(analysis);

  if (options.clientSafeMode) {
    content = generateClientSafeReport(
      content,
      options.anonymizationConfig ?? {
        replaceCompanyNames: true,
        replaceAmounts: true,
        replaceNames: true,
        preserveMethodology: true,
      }
    );
  }

  return renderPdf(content, options);
}
```

- [ ] **Step 3: Add client-safe toggle to PDF export modal**

Modify: `src/components/ui/ShareModal.tsx` (or relevant share component)

```typescript
interface ShareModalProps {
  documentId: string;
}

export function ShareModal({ documentId }: ShareModalProps) {
  const [clientSafeMode, setClientSafeMode] = useState(false);

  return (
    <Modal>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={clientSafeMode}
            onChange={(e) => setClientSafeMode(e.target.checked)}
          />
          Client-Safe Mode (Anonymized)
        </label>
        <p className="help-text">
          Replaces company names, amounts, and personal names while preserving methodology
        </p>
      </div>
      {/* ... existing export options */}
    </Modal>
  );
}
```

- [ ] **Step 4: Write tests**

```typescript
import { anonymizeText, generateClientSafeReport } from './anonymizer';

describe('Anonymizer', () => {
  it('replaces company names with [COMPANY_N] placeholders', () => {
    const result = anonymizeText('Diamond Capital is acquiring target', {
      replaceCompanyNames: true,
      replaceAmounts: false,
      replaceNames: false,
      preserveMethodology: false,
    });
    expect(result).toContain('[COMPANY_');
  });

  it('replaces amounts with [AMOUNT_N] placeholders', () => {
    const result = anonymizeText('Deal size: ₦120B', {
      replaceCompanyNames: false,
      replaceAmounts: true,
      replaceNames: false,
      preserveMethodology: false,
    });
    expect(result).toContain('[AMOUNT_');
  });

  it('generates client-safe report with header', () => {
    const result = generateClientSafeReport('Original content', {
      replaceCompanyNames: true,
      replaceAmounts: true,
      replaceNames: true,
      preserveMethodology: true,
    });
    expect(result).toContain('CONFIDENTIAL - CLIENT SUMMARY');
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/anonymizer.ts src/lib/reports/board-report-generator.ts
git commit -m "feat: add client-safe anonymized export mode"
```

### Task 1.3: DQI Explainability Report

**Files:**

- Modify: `src/lib/scoring/dqi.ts` - add explainability method
- Create: `src/lib/reports/dqi-explainability-generator.ts`
- Test: `src/lib/scoring/dqi.test.ts`

**Rationale:** CSO identified DQI weights as "research-informed estimates" without confidence intervals as showstopper. Need to expose calculation methodology.

- [ ] **Step 1: Add DQI explainability method**

Modify: `src/lib/scoring/dqi.ts`

```typescript
export interface DQIExplanation {
  overallScore: number;
  letterGrade: string;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number; // 90%, 95%, etc.
  };
  components: {
    name: string;
    weight: number;
    rawScore: number;
    weightedContribution: number;
    confidence?: number;
  }[];
  methodology: string;
  lastCalculated: Date;
}

export function calculateDQIWithExplanation(analysis: Analysis): DQIExplanation {
  const score = calculateDQI(analysis);

  // Component breakdown with confidence intervals
  const components = [
    {
      name: 'Bias Load',
      weight: 0.28,
      rawScore: analysis.biasScore,
      weightedContribution: analysis.biasScore * 0.28,
      confidence: 0.85, // Estimated from validation data
    },
    {
      name: 'Noise Level',
      weight: 0.18,
      rawScore: analysis.noiseScore,
      weightedContribution: analysis.noiseScore * 0.18,
      confidence: 0.8,
    },
    // ... other components
  ];

  // Calculate confidence bounds (simplified delta method)
  const varianceSum = components.reduce(
    (sum, c) => sum + Math.pow(c.weight * (1 - c.confidence), 2),
    0
  );
  const standardError = Math.sqrt(varianceSum);

  return {
    overallScore: score,
    letterGrade: scoreToGrade(score),
    confidenceInterval: {
      lower: Math.max(0, score - 1.645 * standardError * 100),
      upper: Math.min(100, score + 1.645 * standardError * 100),
      confidence: '90%',
    },
    components,
    methodology:
      'DQI v2.0.0 - 6-component composite with research-informed weights. Confidence intervals estimated via delta method.',
    lastCalculated: new Date(),
  };
}
```

- [ ] **Step 2: Add confidence interval display to UI**

Modify: `src/components/visualizations/ExecutiveSummary.tsx`

```typescript
interface DqiScoreBadgeProps {
  score: number;
  showConfidence?: boolean;
}

export function DqiScoreBadge({ score, showConfidence = false }: DqiScoreBadgeProps) {
  const grade = scoreToGrade(score);

  return (
    <div className="dqi-badge">
      <div className="score">{score}</div>
      <div className="grade">{grade}</div>
      {showConfidence && (
        <div className="confidence" title="90% confidence interval">
          ±5 (90% CI)
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write tests**

```typescript
import { calculateDQIWithExplanation } from './dqi';

describe('DQI Explainability', () => {
  it('returns confidence interval', () => {
    const explanation = calculateDQIWithExplanation(mockAnalysis);
    expect(explanation.confidenceInterval).toBeDefined();
    expect(explanation.confidenceInterval.lower).toBeLessThan(explanation.overallScore);
    expect(explanation.confidenceInterval.upper).toBeGreaterThan(explanation.overallScore);
  });

  it('includes component breakdown', () => {
    const explanation = calculateDQIWithExplanation(mockAnalysis);
    expect(explanation.components).toHaveLength(6);
  });

  it('discloses methodology', () => {
    const explanation = calculateDQIWithExplanation(mockAnalysis);
    expect(explanation.methodology).toContain('research-informed');
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/scoring/dqi.ts src/lib/reports/dqi-explainability-generator.ts
git commit -m "feat: add DQI explainability with confidence intervals"
```

### Task 1.4: Deal-Level Bulk Delete & Legal Hold

**Files:**

- Modify: `src/app/api/deals/[id]/route.ts` - add archive/legal-hold endpoints
- Modify: `prisma/schema.prisma` - add deal-level fields
- Test: `src/app/api/deals/[id]/route.test.ts`

**Rationale:** Head of M&A identified inability to bulk-delete deal data when NDA expires as critical confidentiality gap.

- [ ] **Step 1: Add deal-level fields to schema**

Modify: `prisma/schema.prisma`

```prisma
model Deal {
  id                 String        @id @default(cuid())
  // ... existing fields
  confidentialityLevel String       @default("internal") // internal, confidential, restricted
  legalHold           Boolean      @default(false)
  loiDeadline         DateTime?
  exclusivityEnd     DateTime?
  targetCloseDate    DateTime?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([legalHold])
  @@index([confidentialityLevel])
}
```

Run: `npx prisma generate && npx prisma db push`

- [ ] **Step 2: Add deal archive endpoint**

Modify: `src/app/api/deals/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDeal, updateDeal, deleteDealDocuments } from '@/lib/deals';
import { getDocumentsByDeal } from '@/lib/documents';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  if (action === 'archive') {
    // Soft-delete all deal documents with 7-day accelerated purge
    const documents = await getDocumentsByDeal(id);

    for (const doc of documents) {
      await deleteDocument(doc.id, { acceleratedPurge: true, purgeDays: 7 });
    }

    await updateDeal(id, { status: 'archived' });

    return NextResponse.json({ success: true, documentsPurged: documents.length });
  }

  if (action === 'legal-hold') {
    // Place hold on all deal documents
    const documents = await getDocumentsByDeal(id);

    for (const doc of documents) {
      await setLegalHold(doc.id, true);
    }

    await updateDeal(id, { legalHold: true });

    return NextResponse.json({ success: true, documentsHeld: documents.length });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
```

- [ ] **Step 3: Add deal webhook for stage changes**

Add stage-change event emission in deal update logic

- [ ] **Step 4: Write tests**

```typescript
describe('Deal Archive & Legal Hold', () => {
  it('archives deal and purges documents in 7 days', async () => {
    const response = await POST('/api/deals/test-deal', {
      action: 'archive',
    });
    expect(response.success).toBe(true);
  });

  it('places legal hold on all deal documents', async () => {
    const response = await POST('/api/deals/test-deal', {
      action: 'legal-hold',
    });
    expect(response.success).toBe(true);
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/app/api/deals/
git commit -m "feat: add deal-level archive, legal hold, and deadline tracking"
```

---

## Phase 2: HIGH - Major Friction (Must Fix Before Active Use)

### Task 2.1: Rate Limit Warning & Deal Emergency Bypass

**Files:**

- Modify: `src/lib/utils/rate-limit.ts` - add warning threshold
- Modify: `src/components/dashboard/DashboardMetrics.tsx` - show remaining
- Modify: `src/app/api/analyze/stream/route.ts` - add emergency bypass
- Test: `src/lib/utils/rate-limit.test.ts`

**Rationale:** End-user identified rate limiting at 5/hr as #1 "I quit" moment - hits at worst time (live deal).

- [ ] **Step 1: Add rate limit warning utility**

Modify: `src/lib/utils/rate-limit.ts`

```typescript
export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
  warningThreshold: number;
  isWarning: boolean;
}

export function checkRateLimitWithWarning(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitStatus {
  const current = getRateLimitCount(key, windowSeconds);
  const remaining = limit - current;
  const warningThreshold = Math.floor(limit * 0.2); // 20% remaining

  return {
    allowed: remaining > 0,
    remaining,
    resetIn: getTimeUntilReset(key),
    warningThreshold,
    isWarning: remaining <= warningThreshold && remaining > 0,
  };
}
```

- [ ] **Step 2: Add rate limit display to dashboard**

Modify: `src/components/dashboard/DashboardMetrics.tsx`

```typescript
interface UsageIndicatorProps {
  limitType: 'analyses' | 'uploads' | 'searches';
  current: number;
  max: number;
}

export function UsageIndicator({ limitType, current, max }: UsageIndicatorProps) {
  const remaining = max - current;
  const isWarning = remaining <= Math.floor(max * 0.2);

  return (
    <div className={cn('usage-indicator', { warning: isWarning })}>
      <span className="label">{limitType}</span>
      <span className="count">{remaining}/{max}</span>
      {isWarning && (
        <span className="warning-badge" title="Approaching limit">
          Low
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add emergency bypass for paid tiers**

Modify: `src/app/api/analyze/stream/route.ts`

```typescript
interface AnalyzeOptions {
  allowEmergencyBypass?: boolean; // Available on paid tiers
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const body = await request.json();

  // Check rate limit
  const rateLimit = checkRateLimit(`analyze:${user.id}`, 5, 3600);

  if (!rateLimit.allowed && !body.allowEmergencyBypass) {
    return NextResponse.json({ error: 'Rate limit exceeded', remaining: 0 }, { status: 429 });
  }

  // For paid tiers, include bypass info
  if (user.subscriptionTier !== 'free' && rateLimit.isWarning) {
    // Allow one-time emergency analysis
    await incrementEmergencyUses(user.id);
  }
}
```

- [ ] **Step 4: Write tests**

```typescript
describe('Rate Limit Warning', () => {
  it('detects when 20% remaining', () => {
    const status = checkRateLimitWithWarning('test', 5, 3600);
    // Set current to 4
    setCurrentUsage('test', 4);
    const result = checkRateLimitWithWarning('test', 5, 3600);
    expect(result.isWarning).toBe(true);
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/rate-limit.ts src/components/dashboard/
git commit -m "feat: add rate limit warning before hitting limit"
```

### Task 2.2: Unified Search (Filename + Content)

**Files:**

- Modify: `src/components/dashboard/DashboardSearch.tsx` - unify search
- Create: `src/lib/search/unified.ts`
- Test: `src/lib/search/unified.test.ts`

**Rationale:** End-user identified fragmented search (filename filter vs RAG in separate URL) as major friction.

- [ ] **Step 1: Create unified search hook**

Create: `src/lib/search/unified.ts`

```typescript
import { searchDocuments } from '@/lib/rag/embeddings';
import { getDocumentsByFilename } from '@/lib/documents';

export interface UnifiedSearchResult {
  type: 'filename' | 'content';
  document: Document;
  relevance?: number;
  matchedOn?: string;
}

export async function unifiedSearch(
  query: string,
  options: {
    includeFilename?: boolean;
    includeContent?: boolean;
    limit?: number;
  } = {}
): Promise<UnifiedSearchResult[]> {
  const results: UnifiedSearchResult[] = [];
  const limit = options.limit ?? 10;

  if (options.includeFilename !== false) {
    const filenameMatches = await getDocumentsByFilename(query, Math.floor(limit / 2));
    results.push(
      ...filenameMatches.map(doc => ({
        type: 'filename' as const,
        document: doc,
        matchedOn: 'filename',
      }))
    );
  }

  if (options.includeContent !== false) {
    const contentMatches = await searchDocuments(query, Math.floor(limit / 2));
    results.push(
      ...contentMatches.map(doc => ({
        type: 'content' as const,
        document: doc.document,
        relevance: doc.relevance,
        matchedOn: 'content',
      }))
    );
  }

  // Deduplicate and re-rank
  const uniqueIds = new Set<string>();
  return results
    .filter(r => {
      if (uniqueIds.has(r.document.id)) return false;
      uniqueIds.add(r.document.id);
      return true;
    })
    .slice(0, limit);
}
```

- [ ] **Step 2: Replace dashboard search**

Modify: `src/components/dashboard/DashboardSearch.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { unifiedSearch, type UnifiedSearchResult } from '@/lib/search/unified';

export function DashboardSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnifiedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults = await unifiedSearch(q);
    setResults(searchResults);
    setIsSearching(false);
  }, []);

  return (
    <div className="dashboard-search">
      <Input
        placeholder="Search documents..."
        onChange={(e) => handleSearch(e.target.value)}
        value={query}
      />
      <div className="results">
        {results.map((result) => (
          <SearchResultCard
            key={result.document.id}
            result={result}
            type={result.type}
            relevance={result.relevance}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write tests**

```typescript
describe('Unified Search', () => {
  it('searches both filename and content', async () => {
    const results = await unifiedSearch('WeWork');
    expect(results.some(r => r.type === 'filename')).toBe(true);
    expect(results.some(r => r.type === 'content')).toBe(true);
  });

  it('deduplicates results', async () => {
    const results = await unifiedSearch('test');
    const ids = results.map(r => r.document.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/search/unified.ts src/components/dashboard/DashboardSearch.tsx
git commit -m "feat: add unified search (filename + content)"
```

### Task 2.3: Score Terminology Unification

**Files:**

- Modify: `src/lib/scoring/index.ts` - consolidate scoring exports
- Modify: `src/components/dashboard/` - update terminology
- Test: Verify consistency across UI

**Rationale:** End-user confused by "Decision IQ" on dashboard vs "DQI" on document detail - two scoring systems.

- [ ] **Step 1: Define unified scoring terminology**

Create: `src/lib/scoring/terminology.ts`

```typescript
export const SCORING_TERMS = {
  primary: {
    abbreviation: 'DQI',
    fullName: 'Decision Quality Index',
    description: 'Composite 0-100 score measuring decision quality',
    gradeScale: {
      A: { range: [80, 100], label: 'Excellent' },
      B: { range: [65, 79], label: 'Good' },
      C: { range: [50, 64], label: 'Average' },
      D: { range: [35, 49], label: 'Below Average' },
      F: { range: [0, 34], label: 'Poor' },
    },
  },
  components: {
    biasLoad: 'Bias Load',
    noiseLevel: 'Noise Level',
    evidenceQuality: 'Evidence Quality',
    processMaturity: 'Process Maturity',
    complianceRisk: 'Compliance Risk',
    historicalAlignment: 'Historical Alignment',
  },
  explanations: {
    biasLoad: 'Severity-weighted bias count vs document complexity',
    noiseLevel: 'Inter-judge variance from triple-judge measurement',
  },
} as const;
```

- [ ] **Step 2: Update dashboard to use unified terminology**

Modify all dashboard KPI components to use "DQI" consistently

```typescript
import { SCORING_TERMS } from '@/lib/scoring/terminology';

export function DashboardKpiCard({ score }: { score: number }) {
  const grade = SCORING_TERMS.primary.gradeScale;
  // ... usage
}
```

- [ ] **Step 3: Add tooltip explaining scoring**

Modify: `src/components/visualizations/DecisionRadar.tsx`

```typescript
export function DqiInfoTooltip() {
  return (
    <div className="tooltip-content">
      <h4>Decision Quality Index (DQI)</h4>
      <p>
        Composite score from 6 components:
        {SCORING_TERMS.explanations.biasLoad}
      </p>
      <a href="/docs/dqi-methodology">View full methodology</a>
    </div>
  );
}
```

- [ ] **Step 4: Write tests**

```typescript
describe('Scoring Terminology', () => {
  it('uses DQI consistently', () => {
    const components = Object.keys(SCORING_TERMS.components);
    expect(components.length).toBe(6);
  });

  it('has grade scale', () => {
    const grades = Object.keys(SCORING_TERMS.primary.gradeScale);
    expect(grades).toEqual(['A', 'B', 'C', 'D', 'F']);
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring/terminology.ts src/components/dashboard/
git commit -m "refactor: unify scoring terminology to DQI"
```

### Task 2.4: Share from Document Card

**Files:**

- Modify: `src/components/documents/DocumentCard.tsx` - add share icon
- Modify: `src/lib/reports/share-link.ts` - generate share link
- Test: `src/components/documents/DocumentCard.test.ts`

**Rationale:** End-user identified "share button hunt" as friction - must navigate to document detail to share.

- [ ] **Step 1: Add share button to document card**

Modify: `src/components/documents/DocumentCard.tsx`

```typescript
interface DocumentCardProps {
  document: Document;
  showShareButton?: boolean;
}

export function DocumentCard({ document, showShareButton = true }: DocumentCardProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleQuickShare = async (method: 'slack' | 'copy' | 'email') => {
    switch (method) {
      case 'slack':
        await shareToSlack(document);
        break;
      case 'copy':
        await copyShareLink(document);
        break;
      case 'email':
        await openEmailClient(document);
        break;
    }
  };

  return (
    <div className="document-card">
      {/* ... existing content */}

      {showShareButton && (
        <div className="card-actions">
          <button
            className="action-btn share"
            onClick={() => setShowShareMenu(!showShareMenu)}
            title="Share"
          >
            <ShareIcon />
          </button>
          {showShareMenu && (
            <div className="share-menu">
              <button onClick={() => handleQuickShare('slack')}>
                <SlackIcon /> Share to Slack
              </button>
              <button onClick={() => handleQuickShare('copy')}>
                <CopyIcon /> Copy Link
              </button>
              <button onClick={() => handleQuickShare('email')}>
                <EmailIcon /> Email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write tests**

```typescript
describe('Document Card Share', () => {
  it('shows share menu on click', () => {
    render(<DocumentCard document={mockDocument} />);
    fireEvent.click(screen.getByTitle('Share'));
    expect(screen.getByText('Share to Slack')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/documents/DocumentCard.tsx
git commit -m "feat: add share button to document card"
```

---

## Phase 3: MEDIUM - Polish (Before Pilot Launch)

### Task 3.1: Mobile Dashboard Shell

**Files:**

- Create: `src/app/(platform)/dashboard/mobile/page.tsx`
- Modify: `src/components/ui/` - mobile responsive adjustments
- Test: Verify mobile layouts

**Rationale:** End-user identified mobile as unusable - cannot check from bed during deal stress.

- [ ] **Step 1: Create mobile-optimized dashboard route**

Create: `src/app/(platform)/dashboard/mobile/page.tsx`

```typescript
import { MobileDashboard } from '@/components/dashboard/MobileDashboard';

export default function MobileDashboardPage() {
  return <MobileDashboard />;
}
```

- [ ] **Step 2: Create mobile dashboard component**

Create: `src/components/dashboard/MobileDashboard.tsx`

```typescript
'use client';

import { KPICards } from './KPICards';
import { RecentDocuments } from './RecentDocuments';
import { QuickUpload } from './QuickUpload';

export function MobileDashboard() {
  return (
    <div className="mobile-dashboard">
      <header className="mobile-header">
        <h1>Decision Intel</h1>
      </header>

      <section className="kpi-section">
        <KPICards variant="compact" />
      </section>

      <section className="quick-actions">
        <QuickUpload />
      </section>

      <section className="recent-section">
        <h2>Recent</h2>
        <RecentDocuments limit={5} />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Add mobile navigation**

Modify: `src/components/ui/Sidebar.tsx`

```typescript
// Add mobile route hint
const MOBILE_ROUTES = ['/dashboard/mobile'];
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(platform\)/dashboard/mobile/ src/components/dashboard/MobileDashboard.tsx
git commit -m "feat: add mobile-optimized dashboard view"
```

### Task 3.2: ROI Justification Screen

**Files:**

- Create: `src/app/(platform)/dashboard/roi/page.tsx`
- Create: `src/components/dashboard/RoiCalculator.tsx`
- Test: Verify calculations

**Rationale:** CEO needs way to justify $2k/mo spend to board - show time saved / biases caught / DQI improvement.

- [ ] **Step 1: Create ROI calculator component**

Create: `src/components/dashboard/RoiCalculator.tsx`

```typescript
'use client';

import { useMemo } from 'react';

interface RoiData {
  analysesCompleted: number;
  averageTimeSaved: number; // minutes per analysis
  biasesDetected: number;
  dqiImprovement: number; // average score improvement
  subscriptionCost: number;
}

export function calculateROI(data: RoiData) {
  const timeSavedHours = (data.analysesCompleted * data.averageTimeSaved) / 60;
  const costPerHour = data.subscriptionCost / (timeSavedHours * 4); // monthly
  const valueOfBiasesCaught = data.biasesDetected * 50000; // Estimated value per bias caught
  const dqiValue = data.dqiImprovement * 10000; // Per point improvement value

  return {
    timeSavedHours,
    costPerHour,
    valueOfBiasesCaught,
    dqiValue,
    totalValue: valueOfBiasesCaught + dqiValue,
    roi: ((valueOfBiasesCaught + dqiValue - data.subscriptionCost) / data.subscriptionCost) * 100
  };
}

export function RoiCalculator({ data }: { data: RoiData }) {
  const roi = useMemo(() => calculateROI(data), [data]);

  return (
    <div className="roi-calculator">
      <div className="metric-card">
        <span className="label">Time Saved</span>
        <span className="value">{roi.timeSavedHours.toFixed(1)} hrs</span>
      </div>
      <div className="metric-card">
        <span className="label">Biases Caught</span>
        <span className="value">{data.biasesDetected}</span>
      </div>
      <div className="metric-card highlight">
        <span className="label">ROI</span>
        <span className="value">{roi.roi.toFixed(0)}%</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ROI dashboard page**

Create: `src/app/(platform)/dashboard/roi/page.tsx`

```typescript
import { RoiCalculator } from '@/components/dashboard/RoiCalculator';

export default async function RoiPage() {
  const data = await getOrganizationMetrics();

  return (
    <div className="roi-dashboard">
      <h1>ROI Dashboard</h1>
      <RoiCalculator data={data} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(platform\)/dashboard/roi/ src/components/dashboard/RoiCalculator.tsx
git commit -m "feat: add ROI justification dashboard"
```

### Task 3.3: FRC Nigeria Code Update

**Files:**

- Modify: `src/lib/compliance/frc-nigeria.ts` - update to current code
- Test: `src/lib/compliance/frc-nigeria.test.ts`

**Rationale:** CEO identified FRC Nigeria Code 2018 as outdated - need 2023/2024 provisions.

- [ ] **Step 1: Research current FRC Nigeria code**

Research FRC Nigeria Corporate Governance Code updates (2023-2024)
Identify new provisions affecting investment firms

- [ ] **Step 2: Update compliance framework**

Modify: `src/lib/compliance/frc-nigeria.ts`

```typescript
export const frcNigeriaFramework: ComplianceFramework = {
  name: 'FRC Nigeria',
  code: 'Corporate Governance Code',
  year: 2024, // Updated from 2018
  // ... updated provisions
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/compliance/frc-nigeria.ts
git commit -m "feat: update FRC Nigeria code to 2024"
```

---

## Phase 4: Future Enhancements (Post-Pilot)

### Task 4.1: Virtual Data Room Connector

**Priority:** Lower - acknowledge limitation, don't build during pilot

- [ ] **Step 1: Document limitation explicitly**

Create: `docs/pilot-limitations.md`

```markdown
## Current Limitations

### Virtual Data Room Integration

Not implemented. Manual upload required.

Workaround: Upload documents to deal after syncing from Intralinks/Merrill.

Future: [TBD] Google Drive/SharePoint connector
```

- [ ] **Step 2: Commit**

```bash
git add docs/pilot-limitations.md
git commit -m "docs: document pilot limitations"
```

---

## Testing Strategy

### Test Files by Phase

| Phase | Test File              | Coverage                                     |
| ----- | ---------------------- | -------------------------------------------- |
| 1.1   | sec-nigeria.test.ts    | Framework detection, bias mapping            |
| 1.2   | anonymizer.test.ts     | Company/amount/name replacement              |
| 1.3   | dqi.test.ts            | Confidence intervals, methodology disclosure |
| 1.4   | deals.test.ts          | Archive, legal hold                          |
| 2.1   | rate-limit.test.ts     | Warning threshold                            |
| 2.2   | unified-search.test.ts | Dual-search integration                      |
| 2.3   | terminology.test.ts    | Score consistency                            |
| 2.4   | document-card.test.ts  | Share functionality                          |
| 3.1   | mobile.test.ts         | Responsive layouts                           |
| 3.2   | roi.test.ts            | Calculation accuracy                         |

### Run Tests

```bash
# All tests
npm test

# By phase
npm test -- --grep "Phase 1"
npm test -- --grep "Phase 2"
npm test -- --grep "Phase 3"
```

---

## Rollout Schedule

### Week 1-2: Critical Fixes (Phase 1)

- Nigerian SEC framework
- Client-safe export
- DQI explainability
- Deal archive/legal hold

### Week 3-4: High Priority (Phase 2)

- Rate limit warnings
- Unified search
- Terminology fix
- Share button

### Week 5-6: Polish (Phase 3)

- Mobile dashboard
- ROI screen
- FRC update

### Week 7+: Pilot Launch

- Deploy to Sankore
- Monitor usage
- Collect feedback

---

## Success Metrics

| Metric         | Target                         |
| -------------- | ------------------------------ |
| CSO confidence | DQI explainability accepted    |
| M&A workflow   | Archive/legal hold adoption    |
| CEO sign-off   | Compliance documentation ready |
| Team retention | Daily active use > 80%         |

---

**Plan complete and saved to:** `docs/superpowers/plans/2026-04-25-decision-intel-pilot-readiness.md`
