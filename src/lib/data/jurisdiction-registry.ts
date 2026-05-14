/**
 * JURISDICTION_REGISTRY — typed SSOT for per-jurisdiction sovereign-context
 * structural-assumptions guidance.
 *
 * Locked 2026-05-13 (F-3 ship). Closes the audit's F-3 brainstorm:
 * "buildSovereignContextBlock in agents/prompts.ts hand-codes each EM
 * jurisdiction (refactor to JURISDICTION_REGISTRY would unlock fast moat
 * scaling for Rwanda / Ghana / Egypt / new African jurisdictions)".
 *
 * Architecture rule: every per-jurisdiction structural-assumptions cue
 * must be a single registry entry, not an inline branch in `prompts.ts`.
 * Adding Rwanda-specific guidance, Ghana 2025 IMF-cycle update, or any
 * new African / EM regime becomes a registry append — never a prompt
 * rewrite. Pan-African moat scales cleanly.
 *
 * The registry is consumed by:
 *   - src/lib/agents/prompts.ts → buildSovereignContextBlock (the
 *     structural-assumptions agent prompt that injects per-jurisdiction
 *     guidance when the memo touches any of these countries)
 *   - Any future surface that needs jurisdiction-specific copy (e.g.,
 *     a `/security` regulatory-map detail panel, a Founder Hub
 *     Jurisdiction Atlas, etc.)
 *
 * Naming conventions:
 *   - `id` is a snake_case canonical key (single-country) OR a region
 *     name (multi-country economic zones like `waemu`).
 *   - `triggers` is the case-insensitive country-name set that maps to
 *     this registry entry. Use lowercase. WAEMU triggers on ALL its
 *     member countries.
 *   - `narrative` is the exact prompt snippet (bullet-prefixed) injected
 *     into the structural-assumptions agent's system prompt. Procurement-
 *     grade. Tied to a verifiable regime fact, not a forecast.
 *
 * Forward-looking rule: when adding a new jurisdiction, append a new
 * entry to JURISDICTION_REGISTRY. The matchJurisdictions() helper +
 * the prompts.ts consumer auto-pick it up. NEVER add per-country
 * branches to prompts.ts directly.
 */

export type JurisdictionId =
  | 'nigeria'
  | 'kenya'
  | 'ghana'
  | 'waemu'
  | 'south_africa'
  | 'egypt'
  | 'tanzania'
  | 'east_africa_peers'
  | 'argentina'
  | 'turkey';

export interface JurisdictionEntry {
  id: JurisdictionId;
  /** Human-readable label for procurement-grade surfacing. */
  label: string;
  /**
   * Case-insensitive country-name set that triggers this entry. Use
   * lowercase. A jurisdiction may have multiple aliases (e.g. WAEMU
   * triggers on every member country individually).
   */
  triggers: ReadonlyArray<string>;
  /**
   * The prompt snippet (bullet-prefixed) injected into the structural-
   * assumptions agent's system prompt when this jurisdiction's triggers
   * fire. Procurement-grade — every claim must be tied to a verifiable
   * regime fact (currency convertibility, repatriation rules, central-
   * bank intervention pattern), never a forecast.
   */
  narrative: string;
  /** Currency code (ISO 4217 where applicable) — useful for future surfaces. */
  currency: string;
  /** Central bank / monetary authority — for procurement-grade citations. */
  monetaryAuthority: string;
  /** FX regime classification — for filtering / display. */
  fxRegime: 'free_float' | 'managed_float' | 'peg' | 'multi_rate' | 'in_transition';
  /**
   * Optional list of named regulatory frameworks that touch this
   * jurisdiction. Future: cross-reference to getAllRegisteredFrameworks().
   */
  relatedFrameworks?: ReadonlyArray<string>;
}

export const JURISDICTION_REGISTRY: ReadonlyArray<JurisdictionEntry> = [
  {
    id: 'nigeria',
    label: 'Nigeria',
    triggers: ['nigeria'],
    currency: 'NGN',
    monetaryAuthority: 'Central Bank of Nigeria (CBN)',
    fxRegime: 'free_float',
    relatedFrameworks: ['NDPR', 'CBN', 'FRC Nigeria', 'ISA 2007'],
    narrative:
      '• Nigeria — naira free-float regime since 2023 unification. FX access via the CBN I&E window; FMDQ-listed naira forwards are the institutional hedging instrument (NGX does NOT list FX forwards). FY24 brought a 38% naira devaluation. The dollar-repatriation assumption is the load-bearing structural bet on most Nigerian deals — flag explicitly.',
  },
  {
    id: 'kenya',
    label: 'Kenya',
    triggers: ['kenya'],
    currency: 'KES',
    monetaryAuthority: 'Central Bank of Kenya (CBK)',
    fxRegime: 'managed_float',
    relatedFrameworks: ['CMA Kenya', 'CBK'],
    narrative:
      '• Kenya — KES managed float overseen by CBK. Capital-account convertibility is open in practice, but the central bank intervenes to defend bands during stress (2024 Eurobond cycle is the live precedent). Shilling cycle correlates with East-Africa commodity terms-of-trade.',
  },
  {
    id: 'ghana',
    label: 'Ghana',
    triggers: ['ghana'],
    currency: 'GHS',
    monetaryAuthority: 'Bank of Ghana (BoG)',
    fxRegime: 'managed_float',
    relatedFrameworks: ['BoG'],
    narrative:
      '• Ghana — cedi managed float; 2022 sovereign-default + IMF programme is the live cycle. Bank-of-Ghana FX restrictions can shift mid-year. Eurobond restructuring is in active conclusion as of 2024-25; capital-controls risk during dollar-debt-service windows.',
  },
  {
    id: 'waemu',
    label: 'WAEMU (CFA-franc zone)',
    triggers: [
      'côte d’ivoire',
      'cote d’ivoire',
      "côte d'ivoire",
      "cote d'ivoire",
      'senegal',
      'mali',
      'burkina faso',
      'benin',
      'togo',
      'niger',
      'guinea-bissau',
    ],
    currency: 'XOF',
    monetaryAuthority: 'BCEAO',
    fxRegime: 'peg',
    relatedFrameworks: ['WAEMU', 'BCEAO Circular 04-2017'],
    narrative:
      '• WAEMU (CFA-franc zone) — XOF pegged to EUR by the BCEAO; convertibility guaranteed by the French Treasury under the convertibility agreement. FX risk is materially LOWER than other African markets, but the CFA-zone is itself a political construct under periodic review (the 2019 ECO redenomination is partial). Cross-border governance via BCEAO Circular 04-2017.',
  },
  {
    id: 'south_africa',
    label: 'South Africa',
    triggers: ['south africa'],
    currency: 'ZAR',
    monetaryAuthority: 'South African Reserve Bank (SARB)',
    fxRegime: 'free_float',
    relatedFrameworks: ['PoPIA', 'SARB Model Risk Directive D2/2022', 'Joint Standard 2/2024'],
    narrative:
      '• South Africa — ZAR free-float managed by SARB; among the most liquid African currencies. Rand-cycle correlates strongly with global commodity demand and EM risk-off. Exchange-control framework limits non-resident asset holdings; SARB Model Risk Directive D2/2022 + Joint Standard 2/2024 govern AI/ML risk for SA-regulated banks.',
  },
  {
    id: 'egypt',
    label: 'Egypt',
    triggers: ['egypt'],
    currency: 'EGP',
    monetaryAuthority: 'Central Bank of Egypt (CBE)',
    fxRegime: 'in_transition',
    relatedFrameworks: ['CBE 2023 ICT Governance and Risk Management Framework'],
    narrative:
      '• Egypt — EGP devalued ~50% across 2023-24 against the dollar; CBE moved to a more flexible regime under the 2024 IMF programme. CBE 2023 ICT Governance and Risk Management Framework governs AI/ML for Egyptian banks. Dollar-shortage windows and capital-controls risk should be flagged on every Egyptian deal.',
  },
  {
    id: 'tanzania',
    label: 'Tanzania',
    triggers: ['tanzania'],
    currency: 'TZS',
    monetaryAuthority: 'Bank of Tanzania (BoT)',
    fxRegime: 'managed_float',
    relatedFrameworks: ['BoT FinTech Sandbox Guidelines 2023'],
    narrative:
      '• Tanzania — TZS managed float; BoT FinTech Sandbox Guidelines 2023 govern AI/ML decisioning. Dollar-shortage episodes are recurrent; assume FX repatriation friction unless the memo addresses it.',
  },
  {
    id: 'east_africa_peers',
    label: 'East-Africa peers (Rwanda / Uganda / Ethiopia)',
    triggers: ['rwanda', 'uganda', 'ethiopia'],
    currency: 'RWF / UGX / ETB',
    monetaryAuthority: 'National Bank of Rwanda / Bank of Uganda / National Bank of Ethiopia',
    fxRegime: 'managed_float',
    narrative:
      '• East-Africa peers (RWF / UGX / ETB) — managed-float regimes with periodic stress; Ethiopia in particular operated dual-rate FX through 2023 with active reform pending. Dollar-shortage and parallel-rate divergence are the recurring structural risks.',
  },
  {
    id: 'argentina',
    label: 'Argentina',
    triggers: ['argentina'],
    currency: 'ARS',
    monetaryAuthority: 'Banco Central de la República Argentina (BCRA)',
    fxRegime: 'multi_rate',
    narrative:
      '• Argentina — multi-rate FX regime through 2023; 2024 reforms dismantling capital controls but cycle is unstable. Hyperinflation-scale price-level regime change ongoing. Treat as the highest-FX-risk LATAM context.',
  },
  {
    id: 'turkey',
    label: 'Turkey',
    triggers: ['turkey'],
    currency: 'TRY',
    monetaryAuthority: 'Central Bank of the Republic of Türkiye (CBRT)',
    fxRegime: 'in_transition',
    narrative:
      '• Turkey — TRY policy regime in active flux; 2024 return to orthodox monetary policy after years of unconventional stimulus. Lira cycle is the load-bearing structural bet on every Turkish exposure.',
  },
];

/**
 * Returns the registry entries whose triggers match any of the given
 * country names (case-insensitive). Used by buildSovereignContextBlock
 * in prompts.ts to assemble the per-jurisdiction guidance.
 *
 * Behaviour:
 *   - Lower-cases inputs before matching.
 *   - Each entry matches AT MOST ONCE per call (a memo touching both
 *     Côte d'Ivoire and Senegal yields ONE WAEMU bullet, not two).
 *   - Sort order matches the canonical JURISDICTION_REGISTRY order
 *     (Nigeria → Kenya → Ghana → WAEMU → SA → Egypt → ...) so the
 *     prompt output stays deterministic and procurement-readable.
 */
export function matchJurisdictions(countries: ReadonlyArray<string>): JurisdictionEntry[] {
  const lc = countries.map(c => c.toLowerCase());
  const hits: JurisdictionEntry[] = [];
  for (const entry of JURISDICTION_REGISTRY) {
    if (entry.triggers.some(t => lc.includes(t))) {
      hits.push(entry);
    }
  }
  return hits;
}

/** Convenience: returns just the narrative strings, in registry order. */
export function matchJurisdictionNarratives(countries: ReadonlyArray<string>): string[] {
  return matchJurisdictions(countries).map(e => e.narrative);
}
