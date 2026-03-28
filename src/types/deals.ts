/**
 * Deal Pipeline — Shared Types & Constants
 *
 * Used across deal pipeline pages, kanban board, forms, and outcome tracking.
 */

// ─── Value/Label Option Type ──────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

// ─── Deal Types ───────────────────────────────────────────────────────────────

export const DEAL_TYPES: SelectOption[] = [
  { value: 'buyout', label: 'Buyout' },
  { value: 'growth_equity', label: 'Growth Equity' },
  { value: 'venture', label: 'Venture' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'add_on', label: 'Add-On' },
  { value: 'recapitalization', label: 'Recapitalization' },
];

// ─── Deal Stages (ordered) ───────────────────────────────────────────────────

export const DEAL_STAGES: SelectOption[] = [
  { value: 'screening', label: 'Screening' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'ic_review', label: 'IC Review' },
  { value: 'closing', label: 'Closing' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'exited', label: 'Exited' },
];

// ─── Deal Statuses ───────────────────────────────────────────────────────────

export const DEAL_STATUSES: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'passed', label: 'Passed' },
  { value: 'invested', label: 'Invested' },
  { value: 'written_off', label: 'Written Off' },
  { value: 'exited', label: 'Exited' },
];

// ─── Document Types ──────────────────────────────────────────────────────────

export const DOCUMENT_TYPES: SelectOption[] = [
  { value: 'ic_memo', label: 'IC Memo' },
  { value: 'cim', label: 'CIM' },
  { value: 'pitch_deck', label: 'Pitch Deck' },
  { value: 'term_sheet', label: 'Term Sheet' },
  { value: 'due_diligence', label: 'DD Report' },
  { value: 'lp_report', label: 'LP Report' },
  { value: 'other', label: 'Other' },
];

// ─── Exit Types ──────────────────────────────────────────────────────────────

export const EXIT_TYPES: SelectOption[] = [
  { value: 'ipo', label: 'IPO' },
  { value: 'trade_sale', label: 'Trade Sale' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'write_off', label: 'Write-Off' },
  { value: 'partial_exit', label: 'Partial Exit' },
];

// ─── Sector Options ──────────────────────────────────────────────────────────

export const SECTORS: SelectOption[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'industrials', label: 'Industrials' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'financial_services', label: 'Financial Services' },
  { value: 'energy', label: 'Energy' },
];

// ─── Currency Options ────────────────────────────────────────────────────────

export const CURRENCIES: SelectOption[] = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

// ─── TypeScript Interfaces ───────────────────────────────────────────────────

export interface DealOutcome {
  id: string;
  dealId: string;
  irr: number | null;
  moic: number | null;
  exitType: string | null;
  exitValue: number | null;
  holdPeriod: number | null;
  notes: string | null;
  reportedAt: string;
  updatedAt: string;
}

export interface DealDocument {
  id: string;
  filename: string;
  documentType: string | null;
  status: string;
}

export interface DealSummary {
  id: string;
  orgId: string;
  name: string;
  dealType: string;
  stage: string;
  sector: string | null;
  ticketSize: number | null;
  currency: string;
  fundName: string | null;
  vintage: number | null;
  targetCompany: string | null;
  status: string;
  exitDate: string | null;
  outcome: DealOutcome | null;
  _count: { documents: number };
  createdAt: string;
  updatedAt: string;
}

export interface DealDetail extends DealSummary {
  documents: DealDocument[];
}

export interface DealFilters {
  stage?: string;
  status?: string;
  dealType?: string;
  sector?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStageLabel(stage: string): string {
  return DEAL_STAGES.find(s => s.value === stage)?.label || stage;
}

export function getDealTypeLabel(dealType: string): string {
  return DEAL_TYPES.find(t => t.value === dealType)?.label || dealType;
}

export function getDocTypeLabel(docType: string): string {
  return DOCUMENT_TYPES.find(d => d.value === docType)?.label || docType;
}

export function getExitTypeLabel(exitType: string): string {
  return EXIT_TYPES.find(e => e.value === exitType)?.label || exitType;
}

export function getNextStage(currentStage: string): string | null {
  const idx = DEAL_STAGES.findIndex(s => s.value === currentStage);
  if (idx === -1 || idx === DEAL_STAGES.length - 1) return null;
  return DEAL_STAGES[idx + 1].value;
}

export function formatTicketSize(amount: number | null, currency: string = 'USD'): string {
  if (amount == null) return '—';
  if (amount >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${currency} ${(amount / 1_000).toFixed(0)}K`;
  return `${currency} ${amount.toLocaleString()}`;
}
