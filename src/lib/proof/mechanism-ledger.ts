/**
 * Mechanism hit-rate ledger — the proof that matters (locked 2026-07-02).
 *
 * The DQI is risk-density; it can't be the headline until tens-to-hundreds
 * of audits calibrate it. The buyer doesn't care about a number — they care
 * about ONE thing: on a decision that went badly, did the blind audit NAME
 * the mechanism that actually materialized, BEFORE anyone knew the outcome?
 *
 * This ledger is that question, made measurable + un-cherry-pickable. Every
 * row carries the verbatim blind finding AND the verbatim outcome, so a
 * reader judges the hit themselves — no trust required. It is the validation
 * program (measurable NOW, no waiting for the DQI to calibrate) and the
 * sales artifact (what you put in front of an advisor/investor).
 *
 * TWO honest sections:
 *  - RETRO: known-outcome cases graded now. Carries the blind-mode caveat —
 *    live retrieval was disabled + findings cite the doc's own language, but
 *    the model MAY recall a famous outcome from training. This is strong, not
 *    bulletproof.
 *  - FORWARD: current filings audited + DPR-hash-stamped (a pre-registration).
 *    Outcomes arrive later. This is the un-contestable proof — no hindsight,
 *    no training-memory objection. `verdict: 'pending'` until the outcome lands.
 *
 * DISCIPLINE: never fabricate a verdict. A case with no defensible
 * outcome-materialized reads is `pending` (the founder's grading fills it).
 * The N-floor mirrors the Vohra/calibration honesty: below N settled cases,
 * do NOT headline a rate.
 */

export type MechanismLedgerVerdict = 'hit' | 'partial' | 'miss' | 'pending';
export type MechanismLedgerMode = 'retro' | 'forward';

export interface MechanismLedgerEntry {
  id: string;
  /** Public historical case name (same class as the 143-case library). */
  company: string;
  sector: string;
  /** Year of the DECISION (not the outcome). */
  decisionYear: number;
  mode: MechanismLedgerMode;
  /** Was the audit run with live retrieval disabled (blind mode)? The
   *  honesty flag: a retro hit is stronger when the audit was blind. */
  blindAudit: boolean;
  /** The mechanism the engine named, verbatim-ish from the blind findings /
   *  forgotten-questions. This is what the reader compares to the outcome. */
  mechanismNamed: string;
  /** What actually happened. Null for a forward pre-registration whose
   *  outcome has not yet materialized. */
  outcome: {
    summary: string;
    /** When it materialized — ISO date or a year string. */
    materialisedOn: string;
  } | null;
  verdict: MechanismLedgerVerdict;
  /** Why hit / partial / miss / pending — the grading rationale. */
  verdictNote: string;
  /** For a FORWARD pre-registration: the DPR SHA-256 prefix + audit date
   *  that timestamps the finding before the outcome exists. The tamper-
   *  evident anchor that defeats the hindsight objection. */
  preRegistration?: {
    dprHashPrefix: string;
    auditedOn: string;
  };
}

/** Below this many SETTLED cases (hit|partial|miss), do not headline a rate.
 *  Same N-floor honesty as the Vohra PMF gate + the calibration surfaces. */
export const MECHANISM_LEDGER_MIN_N = 5;

export interface MechanismHitRate {
  /** hit + partial + miss (pending never counts in the denominator). */
  settled: number;
  hits: number;
  partials: number;
  misses: number;
  /** Cases awaiting an outcome (forward pre-registrations) or a grade. */
  pending: number;
  /** Strict: named the EXACT mechanism. hits / settled. Null when settled=0. */
  strictHitRate: number | null;
  /** Weighted: partials count 0.5. (hits + 0.5*partials) / settled. */
  weightedHitRate: number | null;
  /** True once `settled >= MECHANISM_LEDGER_MIN_N` — the gate for headlining. */
  meetsNFloor: boolean;
}

const SETTLED: ReadonlySet<MechanismLedgerVerdict> = new Set(['hit', 'partial', 'miss']);

/**
 * Pure aggregate. Honest by construction: a miss lowers the rate, pending
 * never inflates it, and the rate is null (not a fabricated 0/100) when
 * nothing is settled yet.
 */
export function computeMechanismHitRate(
  entries: readonly MechanismLedgerEntry[]
): MechanismHitRate {
  const settledEntries = entries.filter(e => SETTLED.has(e.verdict));
  const settled = settledEntries.length;
  const hits = settledEntries.filter(e => e.verdict === 'hit').length;
  const partials = settledEntries.filter(e => e.verdict === 'partial').length;
  const misses = settledEntries.filter(e => e.verdict === 'miss').length;
  const pending = entries.filter(e => e.verdict === 'pending').length;

  return {
    settled,
    hits,
    partials,
    misses,
    pending,
    strictHitRate: settled === 0 ? null : hits / settled,
    weightedHitRate: settled === 0 ? null : (hits + 0.5 * partials) / settled,
    meetsNFloor: settled >= MECHANISM_LEDGER_MIN_N,
  };
}

/** Format a 0-1 rate as a whole-percent string, or an em-dash-free placeholder. */
export function formatHitRate(rate: number | null): string {
  if (rate === null) return 'not yet settled';
  return `${Math.round(rate * 100)}%`;
}

/**
 * SEED — only cases with a defensible, public, documented outcome-materialized
 * read are graded here. Everything else is the founder's grading run to fill.
 * These three are all PUBLIC failures (same class as the case library), all
 * run BLIND, all with the mechanism the audit named matching the mechanism
 * that actually killed the decision.
 */
export const MECHANISM_LEDGER_SEED: readonly MechanismLedgerEntry[] = [
  {
    id: 'zillow-ibuying-2021',
    company: 'Zillow (Zillow Offers)',
    sector: 'Proptech / iBuying',
    decisionYear: 2021,
    mode: 'retro',
    blindAudit: true,
    mechanismNamed:
      'No deceleration trigger: a leveraged, algorithm-driven bet on continued home-price ' +
      'appreciation with no kill-switch and no downside case if prices flattened.',
    outcome: {
      summary:
        'Wound down Zillow Offers in ~90 days (Nov 2021); ~$300M+ inventory write-down; ~25% of ' +
        'the workforce cut. The iBuying algorithm kept buying into a cooling market — the exact ' +
        'missing circuit-breaker.',
      materialisedOn: '2021-11',
    },
    verdict: 'hit',
    verdictNote:
      'The blind audit named the missing deceleration trigger + the un-hedged price bet — the ' +
      'precise mechanism that forced the wind-down. Note: this was the case that inverted on the ' +
      'DQI axis (reassuring letter under-disclosed), which the fragility un-inversion corrected.',
  },
  {
    id: 'fermi-america-s11-2026',
    company: 'Fermi America',
    sector: 'AI data-center / energy',
    decisionYear: 2026,
    mode: 'retro',
    blindAudit: true,
    mechanismNamed:
      'Anchor-tenant / timeline mismatch — substantially all contracted capacity on a single ' +
      'tenant with no definitive leases for the remainder; a ~$20B valuation detached from ' +
      'pre-revenue fundamentals; capital committed to long-lead build before tenants signed.',
    outcome: {
      summary:
        'S-11 valuation of ~$20B repriced to ~$3.4B within ~6 months — the concentration + ' +
        'valuation-vs-fundamentals gap the audit led with.',
      materialisedOn: '2026',
    },
    verdict: 'hit',
    verdictNote:
      'The blind audit surfaced single-tenant concentration, the valuation-vs-fundamentals gap, ' +
      'and capital-before-tenants — the mechanisms behind the repricing. (It initially buried ' +
      'them below a planning-fallacy finding; the existential-first ranking fix corrected the order.)',
  },
  {
    id: 'wework-s1-2019',
    company: 'WeWork (The We Company)',
    sector: 'Real estate / flex-office',
    decisionYear: 2019,
    mode: 'retro',
    blindAudit: true,
    mechanismNamed:
      'Founder-control governance concentration + a path-to-profitability unsupported by unit ' +
      'economics; "community-adjusted EBITDA" as an unfalsifiable accretion metric.',
    outcome: {
      summary:
        'IPO pulled Sept 2019; ~$47B private valuation collapsed to ~$8B; CEO ousted — the ' +
        'governance + unit-economics mechanisms the audit named.',
      materialisedOn: '2019-09',
    },
    verdict: 'hit',
    verdictNote:
      'The canonical DI specimen: the blind S-1 audit named the governance concentration + the ' +
      'unfalsifiable accretion metric that the market rejected within weeks.',
  },
];

/**
 * The honesty caveats rendered alongside the ledger. Load-bearing: the retro
 * hit-rate is STRONG, not bulletproof; the forward ledger is the un-contestable
 * proof. Edit these strings here (the card reads them).
 */
export const MECHANISM_LEDGER_CAVEATS = {
  retro:
    'Retro cases are graded honestly, including the blind-mode caveat: live retrieval was disabled ' +
    'and every finding cites the document’s own language, but the model may still recall a famous ' +
    'outcome from training. The defensible claim is "the audit named the mechanism from the memo’s ' +
    'own words," never "the model could not have known."',
  forward:
    'The un-contestable proof is forward: audit a CURRENT filing, hash-stamp the DPR (a ' +
    'pre-registration with a timestamp), and let the outcome arrive later. No hindsight, no ' +
    'training-memory objection. Add current audits here as you run them — each becomes a ' +
    'dated, tamper-evident prediction.',
  scope:
    'Scope: adverse-outcome decisions only — "did the blind audit name the killer?" A separate ' +
    'concern is false positives on the winners (the DQI-is-risk-density issue), tracked elsewhere.',
} as const;
