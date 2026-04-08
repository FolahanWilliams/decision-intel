/**
 * Project Pipeline — Shared Types & Constants
 *
 * Used across project pipeline pages, kanban board, forms, and outcome tracking.
 * (Database columns retain "deal" naming for backward compatibility.)
 */

// ─── Value/Label Option Type ──────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

// ─── Project Types (DB column: dealType) ────────────────────────────────────

export const DEAL_TYPES: SelectOption[] = [
  // Enterprise / generic
  { value: 'm_and_a', label: 'M&A / Acquisition' },
  { value: 'strategic_initiative', label: 'Strategic Initiative' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
  { value: 'vendor_evaluation', label: 'Vendor Evaluation' },
  { value: 'product_launch', label: 'Product Launch' },
  { value: 'restructuring', label: 'Restructuring' },
  // Additional deal types (PE/VC compatible)
  { value: 'buyout', label: 'Buyout' },
  { value: 'growth_equity', label: 'Growth Equity' },
  { value: 'venture', label: 'Venture' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'add_on', label: 'Add-On / Bolt-On' },
  { value: 'recapitalization', label: 'Recapitalization' },
];

export const DEAL_TYPE_COLORS: Record<string, string> = {
  // Enterprise
  m_and_a: '#6366f1',
  strategic_initiative: '#10b981',
  risk_assessment: '#f59e0b',
  vendor_evaluation: '#8b5cf6',
  product_launch: '#3b82f6',
  restructuring: '#ec4899',
  // Additional deal types
  buyout: '#6366f1',
  growth_equity: '#10b981',
  venture: '#f59e0b',
  secondary: '#8b5cf6',
  add_on: '#3b82f6',
  recapitalization: '#ec4899',
};

// ─── Project Stages (DB column: stage) ──────────────────────────────────────

export const DEAL_STAGES: SelectOption[] = [
  // Generic workflow stages
  { value: 'intake', label: 'Intake' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'review', label: 'Review' },
  { value: 'approval', label: 'Approval' },
  { value: 'execution', label: 'Execution' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'closed', label: 'Closed' },
  // Deal-specific stages
  { value: 'screening', label: 'Screening' },
  { value: 'due_diligence', label: 'Due Diligence' },
  { value: 'ic_review', label: 'Committee Review' },
  { value: 'closing', label: 'Closing' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'exited', label: 'Exited' },
];

// ─── Stage Colors ───────────────────────────────────────────────────────────

export const STAGE_COLORS: Record<string, string> = {
  // Generic
  intake: '#6366f1',
  analysis: '#f59e0b',
  review: '#8b5cf6',
  approval: '#3b82f6',
  execution: '#10b981',
  monitoring: '#14b8a6',
  closed: '#6b7280',
  // Deal-specific
  screening: '#6366f1',
  due_diligence: '#f59e0b',
  ic_review: '#8b5cf6',
  closing: '#3b82f6',
  portfolio: '#10b981',
  exited: '#6b7280',
};

// ─── Project Statuses (DB column: status) ───────────────────────────────────

export const DEAL_STATUSES: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
  // Deal-specific statuses
  { value: 'passed', label: 'Passed' },
  { value: 'invested', label: 'Invested' },
  { value: 'written_off', label: 'Written Off' },
  { value: 'exited', label: 'Exited' },
];

export const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  on_hold: '#f59e0b',
  approved: '#3b82f6',
  rejected: '#ef4444',
  completed: '#6b7280',
  passed: '#6b7280',
  invested: '#3b82f6',
  written_off: '#ef4444',
  exited: '#f59e0b',
};

// ─── Document Types ──────────────────────────────────────────────────────────

export const DOCUMENT_TYPES: SelectOption[] = [
  // Enterprise / generic
  { value: 'board_memo', label: 'Board Memo' },
  { value: 'strategy_paper', label: 'Strategy Paper' },
  { value: 'risk_assessment', label: 'Risk Assessment' },
  { value: 'vendor_proposal', label: 'Vendor Proposal' },
  { value: 'policy_document', label: 'Policy Document' },
  { value: 'project_charter', label: 'Project Charter' },
  { value: 'budget_proposal', label: 'Budget Proposal' },
  // Deal / M&A document types
  { value: 'ic_memo', label: 'Decision Memo' },
  { value: 'cim', label: 'CIM / Target Profile' },
  { value: 'pitch_deck', label: 'Pitch Deck' },
  { value: 'term_sheet', label: 'Term Sheet' },
  { value: 'due_diligence', label: 'DD Report' },
  { value: 'lp_report', label: 'Executive Report' },
  { value: 'other', label: 'Other' },
];

// ─── Outcome Types (DB column: exitType) ────────────────────────────────────

export const EXIT_TYPES: SelectOption[] = [
  // Generic outcomes
  { value: 'successful', label: 'Successful' },
  { value: 'partial_success', label: 'Partial Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'ongoing', label: 'Ongoing' },
  // Additional outcome types
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

// ─── Investment Project Type Detection ──────────────────────────────────────

const PE_VC_TYPES = new Set([
  'buyout',
  'growth_equity',
  'venture',
  'secondary',
  'add_on',
  'recapitalization',
]);

/** Returns true if the project type belongs to the investment vertical */
export function isPeVcProjectType(dealType?: string | null): boolean {
  if (!dealType) return false;
  return PE_VC_TYPES.has(dealType);
}

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

// ─── Aliases for new "Project" terminology ──────────────────────────────────

export type ProjectSummary = DealSummary;
export type ProjectDetail = DealDetail;
export type ProjectOutcome = DealOutcome;
export type ProjectFilters = DealFilters;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStageLabel(stage: string): string {
  return DEAL_STAGES.find(s => s.value === stage)?.label || stage;
}

export function getDealTypeLabel(dealType: string): string {
  return DEAL_TYPES.find(t => t.value === dealType)?.label || dealType;
}

/** Alias for getDealTypeLabel — uses "Project" terminology */
export const getProjectTypeLabel = getDealTypeLabel;

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
