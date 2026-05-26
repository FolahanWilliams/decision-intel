/**
 * ConversionLedgerPanel prefill SSOT — the cross-link contract between
 * BAFTA-prep rehearsal surfaces (BaftaPrepCallout in Sparring Room,
 * EventPrepCard in Founder OS) and the wedge funnel instrument
 * (ConversionLedgerPanel in Outreach Hub).
 *
 * Locked 2026-05-26 (3C cross-link ship, per the nightly-audit Section 3C
 * finding "Damien wakes up, drills the persona rep, then has to navigate 3
 * tabs to log a real prospect from that drill"). One-click flow:
 *
 *   1. Caller invokes `prefillConversionLedger({ persona, source? })`,
 *      which stores the prefill in sessionStorage and dispatches
 *      `founder-hub-navigate` for `outreach_hub`.
 *   2. The Founder Hub page handler flips the active tab.
 *   3. ConversionLedgerPanel consumes the prefill on mount via
 *      `consumeLedgerPrefill()`, which clears the key after read so a
 *      hard refresh doesn't re-fire the form.
 *
 * sessionStorage is the right home for this (not URL params): the panel
 * is rendered inside a tab system where the URL doesn't change across
 * tab switches, and persistence across a hard refresh is undesirable
 * (the prefill is a single-shot rehearsal handoff, not a saveable state).
 *
 * Source enum mirrors `PROSPECT_SOURCES` in `conversion-ledger.ts` —
 * we don't import it here to keep the contract zero-dependency and
 * tree-shakeable on the caller side. The validator runs on the consume
 * path inside the panel itself.
 */

import { FOUNDER_HUB_NAVIGATE_EVENT } from '@/lib/founder-hub/chat-nav';

/** sessionStorage key. Versioned (`-v1`) so a future shape change can
 *  cleanly invalidate stale entries without re-firing the form. */
export const LEDGER_PREFILL_KEY = 'di-conversion-ledger-prefill-v1';

export interface LedgerPrefill {
  /** WedgePersonaId / BUYER_PERSONA.id — the IDs are aligned across both
   *  surfaces (verified 2026-05-26: fractional_cso / midmarket_corp_dev /
   *  smaller_fund_gp / pe_backed_founder). The 'other' persona is also
   *  permitted to round-trip from a non-HXC log path. */
  persona?: string;
  /** Optional source preselect. Must be one of PROSPECT_SOURCES ids —
   *  the panel re-validates and falls back to its default if unknown. */
  source?: string;
}

/** Write the prefill + dispatch the tab-switch event. Safe to call on
 *  the client; no-ops gracefully on SSR or when sessionStorage is
 *  unavailable (private-browsing edge case). */
export function prefillConversionLedger(payload: LedgerPrefill): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(LEDGER_PREFILL_KEY, JSON.stringify(payload));
  } catch {
    // canonical sessionStorage exception class — private browsing, quota
    // exceeded, etc. The dispatch still fires so the founder lands on the
    // right tab; they'll just see a blank add-form to fill manually.
  }
  window.dispatchEvent(
    new CustomEvent(FOUNDER_HUB_NAVIGATE_EVENT, {
      detail: { tabId: 'outreach_hub' },
    })
  );
}

/** Read + clear the prefill. Call exactly once on panel mount. Returns
 *  null if no prefill is pending or if the parse fails. */
export function consumeLedgerPrefill(): LedgerPrefill | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(LEDGER_PREFILL_KEY);
    if (raw) window.sessionStorage.removeItem(LEDGER_PREFILL_KEY);
  } catch {
    // canonical sessionStorage exception class
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Record<string, unknown>;
    return {
      persona: typeof obj.persona === 'string' ? obj.persona : undefined,
      source: typeof obj.source === 'string' ? obj.source : undefined,
    };
  } catch {
    // canonical JSON.parse exception class
    return null;
  }
}
