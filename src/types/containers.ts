/**
 * DecisionContainer type surface (Phase 2 — replaces src/types/deals.ts).
 *
 * Shared types between the API routes (/api/containers/*), the UI
 * surfaces (/dashboard/decisions, ContainerKanban, ContainerCompositeHero,
 * CommitteeReadinessGate), the aggregation helper (container-aggregation.ts),
 * the SWR hook (useContainers), and the Container-aware DPR assembler.
 *
 * Mode-specific shapes (kind = investment | acquisition | strategic)
 * live in the SSOT at src/lib/data/decision-container-modes.ts. This
 * file holds the wire/serialised shapes that flow over the API.
 */

import type { DecisionContainerKind } from '@/lib/data/decision-container-modes';

// ─── Filter / list ──────────────────────────────────────────────────────────

export interface ContainerFilters {
  /** Filter by mode. Undefined = all modes. */
  kind?: DecisionContainerKind;
  /** Filter by stageId — values are mode-specific (see CONTAINER_MODES). */
  stageId?: string;
  /** Filter by archive state. Default = 'active'. */
  status?: 'active' | 'archived';
  /** Free-text search across name + targetCompany + decisionFrame. */
  search?: string;
  /** Filter by ticket-size band (gte / lte in account currency). */
  ticketSizeMin?: number;
  ticketSizeMax?: number;
  /** Filter by sector (acquisition + investment modes). */
  sector?: string;
}

// ─── List shape (kanban + cards) ────────────────────────────────────────────

export interface ContainerSummary {
  id: string;
  orgId: string | null;
  ownerUserId: string;
  kind: DecisionContainerKind;
  name: string;
  decisionFrame: string | null;
  stageId: string;
  status: string;
  decidedAt: string | null;
  committeeDate: string | null;
  /** Mode-specific optional fields (only populated when relevant). */
  fundName: string | null;
  vintage: number | null;
  dealType: string | null;
  ticketSize: number | null;
  currency: string;
  targetCompany: string | null;
  sector: string | null;
  exitDate: string | null;
  /** Composite metrics (cached on write). */
  compositeDqi: number | null;
  compositeGrade: string | null;
  documentCount: number;
  analyzedDocCount: number;
  recurringBiasCount: number;
  conflictCount: number;
  highSeverityConflictCount: number;
  /** Cross-reference summary chip. */
  crossRefConflictCount: number;
  crossRefHighSeverityCount: number;
  /** Latest run timestamp (ISO). */
  updatedAt: string;
  createdAt: string;
}

export interface ContainerListResponse {
  data: ContainerSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Detail shape ───────────────────────────────────────────────────────────

export interface ContainerDocumentRef {
  id: string;
  containerId: string;
  documentId: string;
  role: string | null;
  position: number;
  addedAt: string;
  /** Joined doc fields needed by the detail page card row. */
  document: {
    id: string;
    filename: string;
    documentType: string | null;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    status: string;
    /** Latest analysis on the doc — drives the per-row DQI tile. */
    latestAnalysis: {
      id: string;
      overallScore: number;
      noiseScore: number;
      summary: string;
      createdAt: string;
      biasCount: number;
    } | null;
  };
}

export interface ContainerOutcomeShape {
  id: string;
  containerId: string;
  summary: string;
  /** Mode-specific metric blob. Shape matches SSOT outcomeShape.fields. */
  metrics: Record<string, unknown>;
  realisedDqi: number | null;
  brierScore: number | null;
  reportedAt: string;
  reportedByUserId: string;
}

/**
 * Cross-reference run findings — payload carried from
 * runCrossReferenceAgent() through to the UI cards. Mirror of the
 * legacy DealCrossReferenceFinding shape so the existing
 * cross-reference agent + cross-reference UI components continue
 * to consume it without rewrite.
 */
export interface ContainerCrossReferenceFinding {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  claims: Array<{
    documentId: string;
    documentName: string;
    excerpt: string;
    analysisId?: string;
  }>;
  resolution: string;
}

export interface ContainerCrossReferenceRun {
  id: string;
  containerId: string;
  runAt: string;
  modelVersion: string;
  documentSnapshot: Array<{ documentId: string; analysisId: string }>;
  findings:
    | ContainerCrossReferenceFinding[]
    | { findings: ContainerCrossReferenceFinding[]; summary?: string };
  conflictCount: number;
  highSeverityCount: number;
  status: 'running' | 'complete' | 'error';
  errorMessage: string | null;
}

export interface ContainerDetail extends ContainerSummary {
  documents: ContainerDocumentRef[];
  outcome: ContainerOutcomeShape | null;
  latestCrossReference: ContainerCrossReferenceRun | null;
  /** Per-bias signature aggregated across member documents. */
  aggregation: {
    allBiases: Array<{ biasType: string; severity: string; count: number; documentIds: string[] }>;
    namedPatterns: Array<{
      patternLabel: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      documentCount: number;
      maxToxicScore: number | null;
    }>;
    criticalPatternCount: number;
    highPatternCount: number;
  };
}

// ─── Create + update payloads ───────────────────────────────────────────────

export interface ContainerCreateInput {
  kind: DecisionContainerKind;
  name: string;
  decisionFrame?: string | null;
  /** Optional explicit stage; when omitted, defaults to mode's defaultStageId. */
  stageId?: string;
  /** Mode-specific optional fields. */
  fundName?: string | null;
  vintage?: number | null;
  dealType?: string | null;
  ticketSize?: number | null;
  currency?: string;
  targetCompany?: string | null;
  sector?: string | null;
  committeeDate?: string | null;
  visibility?: 'private' | 'team' | 'specific';
}

export interface ContainerUpdateInput {
  name?: string;
  decisionFrame?: string | null;
  stageId?: string;
  status?: 'active' | 'archived';
  fundName?: string | null;
  vintage?: number | null;
  dealType?: string | null;
  ticketSize?: number | null;
  currency?: string;
  targetCompany?: string | null;
  sector?: string | null;
  committeeDate?: string | null;
  exitDate?: string | null;
  visibility?: 'private' | 'team' | 'specific';
  decidedAt?: string | null;
}

// ─── Outcome capture payload ────────────────────────────────────────────────

export interface ContainerOutcomeInput {
  summary: string;
  /** Mode-specific metric blob — validated server-side against SSOT outcomeShape.fields. */
  metrics: Record<string, unknown>;
}

// ─── Helpers (UI-only constants) ────────────────────────────────────────────

export const STATUS_OPTIONS: ReadonlyArray<{ value: 'active' | 'archived'; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export const VISIBILITY_OPTIONS: ReadonlyArray<{
  value: 'private' | 'team' | 'specific';
  label: string;
  description: string;
}> = [
  {
    value: 'team',
    label: 'Team',
    description: 'Anyone in your org with access can see this container.',
  },
  { value: 'private', label: 'Private', description: 'Only you can see this container.' },
  {
    value: 'specific',
    label: 'Specific people',
    description: 'Only the teammates you grant access to can see this container.',
  },
];

/**
 * Common dealType options for acquisition mode. Mostly informational —
 * the kind discriminator already drives the pipeline behaviour.
 */
export const DEAL_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'buyout', label: 'Buyout' },
  { value: 'growth_equity', label: 'Growth equity' },
  { value: 'venture', label: 'Venture' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'add_on', label: 'Add-on' },
  { value: 'recapitalization', label: 'Recapitalization' },
];

export const SECTOR_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'industrials', label: 'Industrials' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'financial_services', label: 'Financial services' },
  { value: 'energy', label: 'Energy' },
];

/**
 * Document type options — sourced from the canonical
 * INVESTMENT_DOCUMENT_TYPES export with friendly labels. UI consumers
 * (upload form, document-type filter, container detail row labels)
 * import this rather than re-derive.
 */
export { INVESTMENT_DOCUMENT_TYPES } from '@/lib/prompts/investment-vertical';
