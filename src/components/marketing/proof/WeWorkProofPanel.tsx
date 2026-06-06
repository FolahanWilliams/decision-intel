'use client';

/**
 * WeWorkProofPanel — back-compat wrapper.
 *
 * The hand-coded panel was generalized 2026-06-05 into the reusable
 * DecisionProofPanel so the WeWork "went sideways" half + the Apple
 * "held up" half can render as a MATCHED PAIR on /demo (see RetroProofPair,
 * the SF-advisor retro-cold-open motion). This wrapper is kept so existing
 * imports + CLAUDE.md references stay valid; new surfaces should mount
 * RetroProofPair (the pair) or DecisionProofPanel (a single panel) directly.
 */

import { DecisionProofPanel, WEWORK_FLAGGED } from './DecisionProofPanel';

interface WeWorkProofPanelProps {
  /** Optional event name override for tracking. */
  eventName?: string;
}

export function WeWorkProofPanel({
  eventName = 'wework_proof_panel_clicked',
}: WeWorkProofPanelProps = {}) {
  return <DecisionProofPanel {...WEWORK_FLAGGED} eventName={eventName} />;
}
