import { formatBiasName } from '@/lib/utils/labels';

type DocTypeGuess = {
  label: string;
  biases: string[];
};

const DOC_TYPE_TO_BIASES: Record<string, DocTypeGuess> = {
  board_memo: { label: 'board memo', biases: ['confirmation_bias', 'groupthink'] },
  strategy_paper: {
    label: 'strategic memo',
    biases: ['confirmation_bias', 'anchoring_bias'],
  },
  risk_assessment: {
    label: 'risk assessment',
    biases: ['availability_heuristic', 'optimism_bias'],
  },
  vendor_proposal: { label: 'vendor proposal', biases: ['anchoring_bias', 'status_quo_bias'] },
  policy_document: { label: 'policy document', biases: ['status_quo_bias', 'confirmation_bias'] },
  project_charter: { label: 'project charter', biases: ['planning_fallacy', 'optimism_bias'] },
  budget_proposal: { label: 'budget proposal', biases: ['planning_fallacy', 'optimism_bias'] },
  ic_memo: { label: 'decision memo', biases: ['sunk_cost_fallacy', 'overconfidence_bias'] },
  cim: { label: 'CIM / target profile', biases: ['confirmation_bias', 'anchoring_bias'] },
  pitch_deck: { label: 'pitch deck', biases: ['optimism_bias', 'overconfidence_bias'] },
  term_sheet: { label: 'term sheet', biases: ['anchoring_bias', 'sunk_cost_fallacy'] },
  due_diligence: { label: 'DD report', biases: ['confirmation_bias', 'availability_heuristic'] },
  lp_report: { label: 'executive report', biases: ['narrative_fallacy', 'survivorship_bias'] },
};

const FILENAME_PATTERNS: Array<{ regex: RegExp; guess: DocTypeGuess }> = [
  {
    regex: /m[-_\s]?&[-_\s]?a|merger|acquisition|deal[-_\s]?memo/i,
    guess: { label: 'M&A memo', biases: ['sunk_cost_fallacy', 'overconfidence_bias'] },
  },
  {
    regex: /market[-_\s]?entry|expansion|gtm|go[-_\s]?to[-_\s]?market/i,
    guess: {
      label: 'market-entry recommendation',
      biases: ['availability_heuristic', 'planning_fallacy'],
    },
  },
  {
    regex: /pric(e|ing)/i,
    guess: { label: 'pricing memo', biases: ['anchoring_bias', 'status_quo_bias'] },
  },
  {
    regex: /budget|forecast|plan/i,
    guess: { label: 'forecast / plan', biases: ['planning_fallacy', 'optimism_bias'] },
  },
  {
    regex: /strateg/i,
    guess: { label: 'strategic memo', biases: ['confirmation_bias', 'groupthink'] },
  },
  {
    regex: /board|committee/i,
    guess: { label: 'board memo', biases: ['confirmation_bias', 'groupthink'] },
  },
];

const DEFAULT_GUESS: DocTypeGuess = {
  label: 'strategic memo',
  biases: ['confirmation_bias', 'anchoring_bias'],
};

export interface BiasPreview {
  docTypeLabel: string;
  biasLabels: string[];
}

export function getBiasPreview(
  filename: string | undefined,
  selectedDocType: string | undefined
): BiasPreview {
  if (selectedDocType && DOC_TYPE_TO_BIASES[selectedDocType]) {
    const g = DOC_TYPE_TO_BIASES[selectedDocType];
    return { docTypeLabel: g.label, biasLabels: g.biases.map(formatBiasName) };
  }
  if (filename) {
    for (const { regex, guess } of FILENAME_PATTERNS) {
      if (regex.test(filename)) {
        return { docTypeLabel: guess.label, biasLabels: guess.biases.map(formatBiasName) };
      }
    }
  }
  return {
    docTypeLabel: DEFAULT_GUESS.label,
    biasLabels: DEFAULT_GUESS.biases.map(formatBiasName),
  };
}
