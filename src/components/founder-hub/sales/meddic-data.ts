/**
 * MEDDIC — the enterprise deal-qualification framework, applied to selling
 * Decision Intel to the Phase-1 wedge buyers (solo GP / angel, fractional CSO,
 * mid-market corp-dev head, PE-backed founder).
 *
 * SSOT for the MeddicVisualization founder-hub surface. Synthesised from the
 * master KB (NotebookLM 809f5104) MEDDIC-to-DI breakdown, then SANITISED to the
 * current locks: no retired "70-90% of deals fail" attribution, no EU AI Act at
 * the wedge (borrowed authority — cut), no "decision hygiene" (banned vocab),
 * and value-at-stake framed as a FLAG OF EXPOSURE, never a prediction of loss.
 *
 * The point is not to memorise MEDDIC; it is to QUALIFY a live pilot — for each
 * letter: the discovery questions to ask, how it applies to the DI sale, the
 * real DI proof asset, what "strong" looks like, and the trap that loses it.
 */

export type MeddicId =
  | 'metrics'
  | 'economic_buyer'
  | 'decision_criteria'
  | 'decision_process'
  | 'identify_pain'
  | 'champion';

export interface MeddicProof {
  label: string;
  detail: string;
}

export interface MeddicElement {
  id: MeddicId;
  letter: string;
  name: string;
  /** Accent color (the element's identity in the viz). */
  color: string;
  /** One-line essence. */
  tagline: string;
  /** The single question this element answers about the deal. */
  question: string;
  /** The canonical discovery questions a seller asks. */
  discoveryQuestions: string[];
  /** How this element applies specifically to selling DI to the wedge. */
  diApplication: string;
  /** The real DI proof assets that answer this element. */
  diProof: MeddicProof[];
  /** What a STRONG / qualified signal looks like for this element. */
  strongSignal: string;
  /** The failure mode — what kills the deal at this element. */
  trap: string;
}

export const MEDDIC: MeddicElement[] = [
  {
    id: 'metrics',
    letter: 'M',
    name: 'Metrics',
    color: '#D97706',
    tagline: 'Quantify the cost of a bad call, not software ROI.',
    question: 'What does a missed reasoning risk actually cost this buyer?',
    discoveryQuestions: [
      'What is the financial impact on the fund or firm if a deal goes sideways because a qualitative assumption was wrong?',
      'How much committee time goes to debating the financial model versus stress-testing the actual reasoning?',
      'How do you measure the success or failure of your deal-evaluation process today?',
    ],
    diApplication:
      'For a GP or corp-dev head the metric is not "time saved" — it is the capital exposed to their own blind spots before they commit. You sell the ability to put a number on the reasoning risk, not the formatting.',
    diProof: [
      {
        label: 'Value-at-stake flag',
        detail:
          'The audit surfaces the exposure anchored to the ticket the buyer enters — a flag of what is on the line, explicitly not a prediction of loss.',
      },
      {
        label: 'DQI 0–100',
        detail:
          'A composite score over bias load, noise, and historical alignment against the case library — a number where there was only intuition.',
      },
    ],
    strongSignal:
      'The buyer can name a specific number (a deal size, a committed cheque) that a missed reasoning risk would have cost them.',
    trap: 'Leading with "time saved" or "software ROI" — it shrinks a capital-loss problem into a productivity tool.',
  },
  {
    id: 'economic_buyer',
    letter: 'E',
    name: 'Economic Buyer',
    color: '#16A34A',
    tagline: 'At the wedge, the buyer and the user are the same person.',
    question: 'Whose budget pays, and whose career is on the line?',
    discoveryQuestions: [
      'Who signs off on the risk profile before the capital is deployed?',
      'If this deal fails 18 months out, whose career takes the hit?',
      'Whose budget pays for external diligence or consulting today?',
    ],
    diApplication:
      'At the individual tier the economic buyer IS the champion: the fractional CSO, the GP, the PE-backed founder spending a personal or corporate-card budget with no procurement gate. You are selling career insurance to the senior person who bears the liability, not a tool a junior analyst evaluates.',
    diProof: [
      {
        label: 'The Decision Provenance Record',
        detail:
          'A hashed, tamper-evident record the buyer can produce when the board asks, 18 months later, how the call was stress-tested. The artefact that protects the person who signed.',
      },
      {
        label: 'No procurement gate',
        detail:
          'Individual pricing on a personal or corporate-card budget — the same person decides and pays, so the sale closes in one conversation.',
      },
    ],
    strongSignal:
      'You are talking to the person who personally signs the decision AND controls the budget — not routing through an analyst or procurement.',
    trap: 'Selling to an enthusiastic junior who cannot sign — a champion with no budget is not the economic buyer.',
  },
  {
    id: 'decision_criteria',
    letter: 'D',
    name: 'Decision Criteria',
    color: '#0EA5E9',
    tagline: 'Speed and ego-safety are the real criteria.',
    question:
      'What must the tool do to be adopted without slowing the deal or threatening the ego?',
    discoveryQuestions: [
      'What would a new diligence tool have to do for you to adopt it without slowing your deal velocity?',
      'How do you currently pressure-test the reasoning in a 40-page memo without insulting the deal sponsor?',
    ],
    diApplication:
      'Wedge buyers move fast and protect their ego. Tell a CSO their reasoning is "flawed" and you trigger ego threat and lose the sale. Frame the criterion as auditing the reasoning — a missing process, never broken thinking — and the tool has to fit the workflow in seconds.',
    diProof: [
      {
        label: 'R²F (Recognition-Rigor Framework)',
        detail:
          'Kahneman debiasing synthesised with Klein recognition-primed decision — it amplifies the expert’s intuition, it does not overrule it. The audit respects their edge.',
      },
      {
        label: 'SLIP delivery',
        detail:
          'Simple paste, Low cost, Instant 60-second audit, Plays well with the board deck. Speed and fit are the proof.',
      },
    ],
    strongSignal:
      'Their stated criteria are fit, speed, and defensibility — and you have framed DI as auditing the reasoning, not grading the person.',
    trap: 'Saying their reasoning is "flawed" or "bad" — ego threat kills it. It is unaudited reasoning, a missing process.',
  },
  {
    id: 'decision_process',
    letter: 'D',
    name: 'Decision Process',
    color: '#8B5CF6',
    tagline: 'Map to their deal pipeline; intercept pre-IC.',
    question: 'What are the exact steps to a yes, and where does reasoning get stress-tested?',
    discoveryQuestions: [
      'Walk me through the steps from screening to the final IC vote — where is the rationale formally stress-tested?',
      'Who needs to see the diligence pack before capital is committed?',
      'How are dissenting opinions logged before the room reaches consensus?',
    ],
    diApplication:
      'The process of buying DI mirrors their process of doing deals (Screen → Diligence → IC → PMI). The wedge is to intercept pre-IC, before deal fever sets and the reasoning hardens into a defensive artefact nobody will reopen.',
    diProof: [
      {
        label: 'Boardroom Decision Twin',
        detail:
          'Simulates the CFO / risk / skeptic votes and generates the exact questions the committee will ask — before the meeting happens.',
      },
      {
        label: 'Blind prior capture',
        detail:
          'Collects the deal team’s independent priors before group discussion, structurally heading off groupthink and anchoring.',
      },
    ],
    strongSignal:
      'You know the literal steps to a signed pilot AND where in their deal flow DI plugs in (pre-IC).',
    trap: 'Arriving post-IC, after the reasoning has hardened — there is no political room to reopen a committed thesis.',
  },
  {
    id: 'identify_pain',
    letter: 'I',
    name: 'Identify Pain',
    color: '#DC2626',
    tagline: 'The pain is capital eroded by unaudited reasoning.',
    question: 'What specific pain, in their own words, does this remove?',
    discoveryQuestions: [
      'Walk me through the last memo or IC deck you built — what was the part you dreaded?',
      'When the board pushed back, what was the one question that surprised you?',
      'What is the last thing you paid for to make that part less painful — did it actually work?',
    ],
    diApplication:
      'The pain is not formatting. It is that a long memo hides the reasoning risk that kills the deal and gets them blamed — and they are committing capital on intuition no one has audited. Name it in their words; do not sell features.',
    diProof: [
      {
        label: 'Retro audit on a closed deal',
        detail:
          'Run the 60-second audit on a deal they have already closed: here are the reasoning risks that were visible at the time, and the fix. Forensic, not predictive — it sidesteps no-track-record and no-data.',
      },
      {
        label: 'Named toxic combinations',
        detail:
          'Show the specific fatal pattern their memo triggered from the case library — the reasoning failure that recurs, not a generic bias list.',
      },
    ],
    strongSignal:
      'The buyer has named a specific, recent, painful moment — a memo, a board question, a deal that went sideways — in their own words.',
    trap: 'Selling the feature list instead of their pain, or worse, manufacturing a pain they never named.',
  },
  {
    id: 'champion',
    letter: 'C',
    name: 'Champion',
    color: '#06B6D4',
    tagline: 'Arm the user to be the smartest, lowest-risk voice in the room.',
    question:
      'Who carries the artefact to the sponsor or board — and why does it make them look good?',
    discoveryQuestions: [
      'Who in the firm is actively trying to catch the next blind spot before it costs a deal?',
      'If we surface a real blind spot in this memo, who takes that artefact to the sponsor or the board?',
    ],
    diApplication:
      'For the wedge the champion is the user. You arm the fractional CSO or corp-dev head to be the most rigorous risk-manager in the room WITHOUT spending political capital — the antagonist that costs them nothing socially. The dissent comes from the system, not from them attacking a sponsor’s pet deal.',
    diProof: [
      {
        label: 'The DPR specimens',
        detail:
          'Hand them the public, anonymised reference records: "here is exactly what the output looks like — take it to your next review." The artefact does the persuading.',
      },
      {
        label: 'Political-capital-free dissent',
        detail:
          'The audit raises the hard questions so the champion does not have to attack a colleague’s thesis in public.',
      },
    ],
    strongSignal:
      'You have a named person who will carry the record into the room AND it makes THEM look rigorous, not contrarian.',
    trap: 'A champion with no path to the economic buyer, or one for whom championing DI costs political capital.',
  },
];

export type QualStatus = 'unknown' | 'weak' | 'strong';

export const QUAL_META: Record<QualStatus, { label: string; color: string }> = {
  unknown: { label: 'Unknown', color: 'var(--text-muted)' },
  weak: { label: 'Weak', color: 'var(--warning)' },
  strong: { label: 'Strong', color: 'var(--success)' },
};
