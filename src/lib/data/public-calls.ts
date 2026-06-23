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
 * PROXIMITY OVER FAME (the 2026-06-23 sharpening — Rob's clarity lesson):
 *   The value is the RISK SHAPE, not the famous name. Your customer (a solo GP,
 *   a fractional CSO, a mid-market corp-dev head) never audits a mega-cap; they
 *   audit their own memos. A public decision earns its place ONLY as a checkable
 *   instance of a reasoning-risk that recurs in the BUYER's own decisions — so
 *   every call carries a `mirrors` line naming whose decision it resembles and
 *   why. PREFER calls that visibly resemble the buyer's world (a growth-round
 *   thesis, a market entry, a mid-market acquisition) over mega-cap flexes; a
 *   famous name buys attention, a buyer-shaped call buys belief.
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
  proxyLadder?: { window: string; question: string }[]; // the monitoring sequence, optional
  scoringNote?: string; // how this specific call is scored (the flag, not the price), optional
  mirrors?: string; // the proximity bridge: why this decision's reasoning-risk is the BUYER's risk too
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
    proxyLadder: [
      {
        window: '3-month · ~Sep 2026',
        question:
          'Does the first post-IPO reporting reaffirm or quietly soften the "H2 2026 commercial payload" milestone, and is the test-flight cadence an H2 commercial debut would require actually happening?',
      },
      {
        window: '6-month · Dec 31 2026',
        question:
          'Did the first commercial Starship payload fly? (primary) Secondary: did Starlink net-adds decelerate or ARPU keep falling?',
      },
      {
        window: '12-month · Jun 2027',
        question:
          'Is the gap between the 2030 milestones priced in today and what has actually shipped narrowing or widening?',
      },
    ],
    scoringNote:
      'We are not predicting the share price. The stock could rise on Starlink alone while the Starship timeline slips, and the flag would still be validated, because the flag was about the reasoning-risk, not the price. The scored unit is simple: did the flagged risk materialise?',
    mirrors:
      'You will never audit a $1.77T IPO. But a GP backing a late-stage round, and a CSO defending a market-entry memo, face the same shape of risk: a coherent narrative gated on a timeline the reference class says is optimistic. This is a public, checkable instance of the exact reasoning-risk your own decisions carry.',
  },
];
