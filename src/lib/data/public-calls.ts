/**
 * Public prospective track record — the canonical SSOT for Decision Intel's
 * locked, dated, falsifiable reasoning-audit calls.
 *
 * ONE source, TWO consumers:
 *   - the public page          /track-record  (src/app/(marketing)/track-record/page.tsx)
 *   - the founder-hub ledger    PilotPlanTab.tsx (Pilot Plan)
 * Edit the calls HERE and both surfaces update. No DB until it is worth one
 * (the SSOT-array pattern, same as the sprint SESSION_LOG): at N=1..20 calls a
 * code-edited array is the right shape; a table + admin UI is premature.
 *
 * THE LOAD-BEARING DISCIPLINE (never drift from this):
 *   Score the FLAG, not the FORECAST. A call names a specific reasoning-risk in
 *   a PUBLIC decision, a falsifiable proxy, and a due date. What gets scored is
 *   whether that RISK materialised — never whether we predicted the price.
 *   Retro opens the door; prospective Brier earns belief. Publish the false
 *   positives: a record you can only see the wins of is not a record.
 *   (See POSITIONING_EPISTEMIC_HONESTY in icp.ts — correlated risk indicators,
 *   not causation.)
 *
 * TO ADD A CALL: copy a block below, give it a unique `id`, write the `flag`
 * (the reasoning-risk), a falsifiable `proxy` with a real `dueDate`, set
 * `status: 'locked'`. As the proxy date lands, flip the status and fill
 * `result` — publish wins AND losses. Keep `subject` to PUBLIC decisions only
 * (no confidentiality wall).
 */

export type PublicCallStatus =
  | 'locked' // published in advance + proxy locked, not yet due
  | 'tracking' // a proxy window has opened, watching the signal
  | 'confirmed' // the flagged risk materialised (a true positive)
  | 'false_positive' // the flagged risk did NOT bite — published anyway
  | 'mixed'; // the flag partially materialised

export interface PublicCall {
  id: string;
  subject: string;
  dateLocked: string; // ISO date the call was published + the proxy locked
  flag: string; // the reasoning-risk we named
  proxy: string; // the falsifiable test
  dueDate: string; // ISO date the proxy resolves
  status: PublicCallStatus;
  result?: string; // filled when the proxy resolves (wins AND losses)
}

export const CALL_STATUS_META: Record<
  PublicCallStatus,
  { label: string; color: string; description: string }
> = {
  locked: {
    label: 'Locked',
    color: 'var(--info)',
    description: 'Published in advance, the falsifiable proxy set. The due date has not arrived.',
  },
  tracking: {
    label: 'Tracking',
    color: 'var(--warning)',
    description: 'A proxy window has opened. The signal is being watched against the flag.',
  },
  confirmed: {
    label: 'Flag confirmed',
    color: 'var(--success)',
    description:
      'The reasoning-risk we named materialised, a true positive. The share price is irrelevant to this result.',
  },
  false_positive: {
    label: 'False positive',
    color: 'var(--text-muted)',
    description:
      'The flagged risk did not bite. Published anyway, because calibration needs the losses.',
  },
  mixed: {
    label: 'Mixed',
    color: 'var(--warning)',
    description:
      'The flag partially materialised. Scored on its merits, never rounded up to a win.',
  },
};

export const PUBLIC_CALLS: PublicCall[] = [
  {
    id: 'spcx-2026-06',
    subject: 'SpaceX (SPCX) S-1 IPO thesis',
    dateLocked: '2026-06-21',
    flag: 'Valuation gated on a Starship timeline the reference class (5/25 flights in 2025) says is optimistic.',
    proxy:
      'First commercial Starship payload flies by Dec 31 2026 (the S-1’s own "H2 2026" milestone).',
    dueDate: '2026-12-31',
    status: 'locked',
    result: undefined,
  },
];
