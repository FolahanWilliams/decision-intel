/**
 * Auto-extract the DECISION SIZE (deal value / capex / raise / valuation) from a
 * strategic document — locked 2026-06-30.
 *
 * The value-at-stake reveal ("this compound pattern puts ~$X at risk") is the
 * Taktile move + the core differentiator, but `computeFindingValueAtStake` needs
 * a TICKET. Until now the ticket only came from a MANUAL entry (the /demo form),
 * so an uploaded cold audit on a public M&A announcement / S-1 / earnings release
 * — where the deal size is sitting right there in the text — produced NO dollar
 * exposure. This closes that: it reads the number off the document so the reveal
 * fires automatically on the free top-of-funnel audits.
 *
 * Pure + honest: two-tier context gating (a COMMITMENT figure — acquire / capex /
 * raise — is preferred over a bare VALUATION), a $1M floor so an incidental
 * salary / revenue-line number can't masquerade as the ticket, and NULL when no
 * confident decision-size figure is found (the deliverable then renders the
 * DQI-lift fallback — we never fabricate a dollar figure).
 */

export interface ExtractedTicket {
  amount: number;
  currency: 'USD' | 'GBP' | 'EUR';
  /** The matched phrase, for provenance / the source drawer. */
  evidence: string;
  /** 'commitment' = a capital-committing figure; 'valuation' = a worth/market-cap figure. */
  tier: 'commitment' | 'valuation';
}

const CURRENCY_BY_SYMBOL: Record<string, 'USD' | 'GBP' | 'EUR'> = {
  $: 'USD',
  '£': 'GBP',
  '€': 'EUR',
};

// A figure with capital-COMMITTING context is the ticket we want — the actual
// decision size (deal / capex / raise), not a company's total worth. These are
// word-initial STEMS (leading \b, no trailing \b) so "acqui" matches acquire /
// acquiring / acquisition, "merg" matches merger / merging, etc. — a trailing
// \b would defeat the stem. "\bbid\b" keeps its own exact boundaries so it never
// fires on "forbid" / "bidirectional".
const COMMITMENT_CONTEXT =
  /\b(acqui|merg|deal|purchase|buy|takeover|transaction|raising|raise|offering|ipo|invest|capital expenditure|capex|commit|consideration|all-cash|all-stock|\bbid\b|tender|enterprise value|price of|pay)/i;
// A bare valuation is a weaker proxy (a $1.77T market cap is not a decision) —
// used only when no commitment figure exists. Also stem-style ("market capitali"
// matches capitalisation / capitalization).
const VALUATION_CONTEXT = /\b(valued|valuation|market cap|market capitali|worth|equity value)/i;

// A figure describing a TOTAL MARKET (TAM / industry size / market opportunity)
// is NOT a decision — it's the size of the whole pond, not the bet. These
// routinely run to the trillions and would otherwise masquerade as the biggest
// "commitment": Fermi's S-11 cites a multi-trillion AI/power market, a nearby
// "invest" word bound it as the ticket, and being the largest it won → a $5.2T
// "decision" on a $20B company (which renders "$5200.0B", torpedoing the DPR).
// When a market-size word is the NEAREST context to a figure, it is DISQUALIFIED.
const MARKET_SIZE_CONTEXT =
  /(addressable market|total addressable|\bTAM\b|\bSAM\b|market opportunit|market size|total market|global .{0,15}market|serviceable|market (?:is|will be|was) (?:projected|expected|estimated))/i;

// $NNN (billion|million|B|M|...). The scale word/letter is optional, so a bare
// "$500" DOES match here — it is filtered downstream by the MIN_TICKET floor
// (see below), which is what keeps a small figure from counting as a strategic ticket.
const MONEY_RE = /([$£€])\s?([\d][\d,]*(?:\.\d+)?)\s?(trillion|billion|million|bn|tn|[bmt])?\b/gi;

function scaleFor(unit: string | undefined): number {
  if (!unit) return 1;
  const u = unit.toLowerCase();
  if (u === 'trillion' || u === 'tn' || u === 't') return 1_000_000_000_000;
  if (u === 'billion' || u === 'bn' || u === 'b') return 1_000_000_000;
  if (u === 'million' || u === 'm') return 1_000_000;
  return 1;
}

/** Floor below which a figure is not a strategic decision size. */
const MIN_TICKET = 1_000_000;
/** How far from a figure a context word can sit and still bind to it. */
const CONTEXT_WINDOW = 50;

/** Char distance from `str`'s far edge to the nearest match of `re`, or Infinity. */
function nearestDistance(re: RegExp, str: string, fromEnd: boolean): number {
  let best = Infinity;
  for (const m of str.matchAll(new RegExp(re.source, 'gi'))) {
    const idx = m.index ?? 0;
    const dist = fromEnd ? str.length - (idx + m[0].length) : idx;
    if (dist < best) best = dist;
  }
  return best;
}

/**
 * Classify a figure by the NEAREST context word (preceding or following), so a
 * "$200B market cap, ... acquiring $5B" sentence binds each figure to the word
 * actually next to it instead of the whole window bleeding together. Ties go to
 * commitment (the stronger signal).
 */
function classifyByNearestContext(
  text: string,
  at: number,
  matchLen: number
): 'commitment' | 'valuation' | null {
  const before = text.slice(Math.max(0, at - CONTEXT_WINDOW), at);
  const after = text.slice(at + matchLen, at + matchLen + CONTEXT_WINDOW);
  const commit = Math.min(
    nearestDistance(COMMITMENT_CONTEXT, before, true),
    nearestDistance(COMMITMENT_CONTEXT, after, false)
  );
  const val = Math.min(
    nearestDistance(VALUATION_CONTEXT, before, true),
    nearestDistance(VALUATION_CONTEXT, after, false)
  );
  const market = Math.min(
    nearestDistance(MARKET_SIZE_CONTEXT, before, true),
    nearestDistance(MARKET_SIZE_CONTEXT, after, false)
  );
  if (commit === Infinity && val === Infinity && market === Infinity) return null;
  // A market-size word nearest → this is the size of the whole market, not a
  // decision. DISQUALIFY (wins ties over commitment/valuation): a "$5.2T market
  // opportunity" is never the ticket, even with an "invest" word equally near.
  if (market !== Infinity && market <= commit && market <= val) return null;
  return commit <= val ? 'commitment' : 'valuation';
}

/**
 * Scan a document for the decision size. Returns the largest COMMITMENT figure
 * if any exist, else the largest VALUATION figure, else null.
 */
export function extractTicketFromContent(content: string): ExtractedTicket | null {
  if (!content) return null;
  const text = content.slice(0, 200_000); // bound the scan
  let bestCommitment: ExtractedTicket | null = null;
  let bestValuation: ExtractedTicket | null = null;

  for (const m of text.matchAll(MONEY_RE)) {
    const symbol = m[1];
    const num = parseFloat(m[2].replace(/,/g, ''));
    if (!Number.isFinite(num) || num <= 0) continue;
    const amount = Math.round(num * scaleFor(m[3]));
    if (amount < MIN_TICKET) continue;

    const tier = classifyByNearestContext(text, m.index ?? 0, m[0].length);
    if (!tier) continue;
    const currency = CURRENCY_BY_SYMBOL[symbol] ?? 'USD';
    const candidate: ExtractedTicket = { amount, currency, evidence: m[0].trim(), tier };

    if (tier === 'commitment') {
      if (!bestCommitment || amount > bestCommitment.amount) bestCommitment = candidate;
    } else if (!bestValuation || amount > bestValuation.amount) {
      bestValuation = candidate;
    }
  }

  return bestCommitment ?? bestValuation;
}
