/**
 * Dalio 18 Determinants of Rise and Fall
 *
 * Ray Dalio's framework (Principles for Dealing with the Changing World Order,
 * 2021) identifies 18 structural determinants that drive the rise and fall of
 * empires, economies, and markets. Unlike cognitive biases (which operate on
 * the individual reasoner), these are macro-structural assumptions a strategic
 * memo is implicitly betting on.
 *
 * Decision Intel uses these as a SECOND lens alongside the Kahneman + Klein
 * cognitive-bias stack. A memo can be cognitively clean yet still rest on a
 * structural assumption that makes the plan unworkable — e.g., assuming
 * reserve-currency stability under a debt cycle peak, or assuming continued
 * FX access under a balance-of-payments crisis.
 *
 * Application: the structural-assumptions pipeline node reads the memo,
 * identifies which determinants the plan depends on (via `auditPrompt`), and
 * surfaces "Structural assumptions flagged" when `flagConditions` trigger.
 *
 * Source: Ray Dalio, "Principles for Dealing with the Changing World Order"
 * (Simon & Schuster, 2021); economicprinciples.org/Big-Picture/.
 */

export type DalioCategory =
  | 'cycles' // Debt, currency, and inflation cycles — the short-run drivers
  | 'power' // Economic, military, trade, and reserve-currency power
  | 'fundamentals' // Education, innovation, productivity, infrastructure
  | 'internal' // Governance, civility, wealth gaps, rule of law
  | 'external'; // Geology, acts of nature, resource endowment

/**
 * Human-readable label per category, used by the structural-exposure
 * heatmap on /dashboard/analytics + the Dalio constellation viz on
 * the Sankore brief.
 */
export const DETERMINANT_CATEGORIES: Record<DalioCategory, { label: string; description: string }> =
  {
    cycles: {
      label: 'Cycles',
      description: 'Debt, currency, and inflation cycles — the short-run drivers.',
    },
    power: {
      label: 'Power',
      description: 'Economic, military, trade, and reserve-currency power.',
    },
    fundamentals: {
      label: 'Fundamentals',
      description: 'Education, innovation, productivity, infrastructure.',
    },
    internal: {
      label: 'Internal order',
      description: 'Governance, civility, wealth gaps, rule of law.',
    },
    external: {
      label: 'External shocks',
      description: 'Geology, acts of nature, resource endowment.',
    },
  };

export interface DalioDeterminant {
  /** Stable ID. Once assigned, never changes. */
  id: string;
  label: string;
  category: DalioCategory;
  /** One-paragraph description of what this determinant measures. */
  description: string;
  /**
   * System prompt fragment used by the structural-assumptions pipeline node.
   * Written as an instruction to an LLM inspecting a memo.
   */
  auditPrompt: string;
  /**
   * Heuristic triggers. If the memo contains any of these signals, the node
   * should examine whether the plan rests on an assumption about this
   * determinant — and whether that assumption is defensible.
   */
  flagConditions: string[];
}

export const DALIO_DETERMINANTS: Record<string, DalioDeterminant> = {
  debt_cycle: {
    id: 'debt_cycle',
    label: 'Debt Cycle (short + long)',
    category: 'cycles',
    description:
      'Where the economy sits on the short-term (5–8 year) and long-term (~75 year) debt cycles. Late-cycle conditions (debt/GDP peaks, central-bank balance-sheet exhaustion, rising debt-service ratios) change the cost and availability of capital, the stability of asset prices, and the likelihood of currency depreciation.',
    auditPrompt:
      'Does this memo assume capital, refinancing, or asset-price stability that depends on where the relevant economy sits on the debt cycle? If the plan assumes low rates, stable valuations, or continued credit expansion, flag the structural assumption and name the cycle position the plan is betting on.',
    flagConditions: [
      'memo references refinancing, rollover risk, leverage ratios, or borrowing cost assumptions',
      'valuation model assumes continuation of prevailing discount rates or terminal multiples',
      'plan depends on asset-price appreciation as a financing mechanism',
    ],
  },

  currency_cycle: {
    id: 'currency_cycle',
    label: 'Currency / Inflation Cycle',
    category: 'cycles',
    description:
      'The cycle of currency strength, inflation, and devaluation. Emerging-market and reserve-currency economies sit at different places on this cycle; assumptions that work in a strong-dollar phase can break in a depreciation phase.',
    auditPrompt:
      'Does the memo assume FX stability, predictable inflation, or continued purchasing-power parity? If the plan involves cross-border cash flows, imported inputs, or dollar-denominated liabilities against local-currency revenues, flag the currency-cycle exposure explicitly.',
    flagConditions: [
      'cross-border cash flows or imported cost-of-goods inputs',
      'dollar-denominated debt paired with local-currency revenue',
      'inflation assumption held constant across a multi-year projection',
    ],
  },

  reserve_currency_status: {
    id: 'reserve_currency_status',
    label: 'Reserve Currency Status',
    category: 'power',
    description:
      'Whether the currency a plan depends on (for trade, settlement, reserves, or capital access) retains reserve-currency status. Dalio identifies reserve-currency transitions as one of the slowest-moving but most consequential determinants; the assumption is usually implicit.',
    auditPrompt:
      'Does the plan implicitly assume continued USD dominance (or EUR, GBP, CNY at the margin) for settlement, funding, or reserve holdings? Flag assumptions that depend on reserve-currency stability when the time horizon exceeds 5 years.',
    flagConditions: [
      'long-dated (>5 year) plans denominated in or settled through USD',
      'sovereign-risk analysis omits reserve-currency transition scenarios',
      'emerging-market exposure with no consideration of local-currency settlement rails',
    ],
  },

  economic_output: {
    id: 'economic_output',
    label: 'Economic Output',
    category: 'power',
    description:
      'The absolute and relative economic output of the country or region the plan operates in. Drives addressable-market size, income elasticity, and the stability of demand.',
    auditPrompt:
      'Does the memo rely on growth-rate assumptions that reflect the underlying economic output trajectory of the target market? Flag when CAGR assumptions exceed GDP growth by implausible margins without a stated share-gain mechanism.',
    flagConditions: [
      'market-size CAGR >2x the underlying nominal GDP growth without share-shift rationale',
      'demand projection assumes income elasticity unchanged across cycle shifts',
    ],
  },

  trade: {
    id: 'trade',
    label: 'Trade Share',
    category: 'power',
    description:
      'The country or bloc’s share of global trade, terms of trade, and trade-route dependencies. Shifts in trade share change relative prices, partner leverage, and supply-chain resilience.',
    auditPrompt:
      'Does the plan depend on specific trade corridors, export-market access, or tariff regimes staying stable? Flag trade-route concentration and tariff-sensitive assumptions.',
    flagConditions: [
      'single-corridor supply-chain dependency',
      'export thesis that assumes current tariff / trade-agreement regime persists beyond 3 years',
      'input cost forecast tied to a specific trade route',
    ],
  },

  military: {
    id: 'military',
    label: 'Military / Geopolitical Power',
    category: 'power',
    description:
      'Military and geopolitical leverage affects asset security, sanction risk, enforceability of contracts, and access to sea lanes, airspace, and spectrum.',
    auditPrompt:
      'Does the plan implicitly assume geopolitical stability, contract enforceability across borders, or freedom from sanctions / secondary sanctions? Flag when the plan involves dual-use technology, strategic minerals, or counterparties in adversarial jurisdictions.',
    flagConditions: [
      'counterparty or supply chain in a jurisdiction under active sanctions or sanction-risk',
      'dual-use technology transfer',
      'assumption of neutral posture in a region experiencing active conflict',
    ],
  },

  markets_financial_center: {
    id: 'markets_financial_center',
    label: 'Markets & Financial-Center Status',
    category: 'power',
    description:
      'The depth, liquidity, and regulatory credibility of the financial centre the plan relies on for funding, hedging, and exit. London, New York, Singapore, Hong Kong, Lagos, and Johannesburg all occupy different positions on this axis.',
    auditPrompt:
      'Does the plan assume continued access to the relevant financial center for capital raising, hedging, or exit? Flag when the plan depends on liquidity or exit optionality in a centre whose regulatory credibility is shifting.',
    flagConditions: [
      'exit plan depends on IPO in a specific exchange',
      'hedging strategy assumes counterparty depth in a specific market',
      'funding plan assumes issuance access in a specific jurisdiction',
    ],
  },

  education: {
    id: 'education',
    label: 'Education & Human Capital',
    category: 'fundamentals',
    description:
      'The quality and quantity of the human capital the plan depends on. Drives execution risk, talent cost, and the credibility of productivity assumptions.',
    auditPrompt:
      'Does the plan depend on a specific talent base or educational-system output? Flag when the plan assumes talent availability, wage stability, or productivity levels that require a specific human-capital regime.',
    flagConditions: [
      'hiring plan exceeds local graduate output in the relevant discipline',
      'productivity assumption requires workforce training not scoped in the plan',
    ],
  },

  innovation: {
    id: 'innovation',
    label: 'Innovation & Technology',
    category: 'fundamentals',
    description:
      'The rate of innovation and technology absorption in the relevant economy. Drives competitive positioning, substitution risk, and the half-life of any technical moat.',
    auditPrompt:
      'Does the plan assume a technology moat that outlasts the expected rate of substitution? Flag when competitive positioning depends on a specific technology whose obsolescence curve is not explicitly modelled.',
    flagConditions: [
      'defensibility argument rests on a specific technology patent or know-how',
      'substitution risk not explicitly modelled over the plan horizon',
    ],
  },

  productivity: {
    id: 'productivity',
    label: 'Productivity',
    category: 'fundamentals',
    description:
      'Total-factor productivity growth — the long-run driver of economic output. Plans that assume productivity-linked cost savings or margin expansion depend on this implicitly.',
    auditPrompt:
      'Does the plan assume productivity gains that exceed the long-run trend of the relevant economy? Flag explicit or implicit productivity assumptions.',
    flagConditions: [
      'margin expansion thesis >200 bps without productivity source named',
      'unit-cost decline assumption above industry / geography trend',
    ],
  },

  cost_competitiveness: {
    id: 'cost_competitiveness',
    label: 'Cost Competitiveness',
    category: 'fundamentals',
    description:
      'The relative cost position of labour, capital, and inputs. Drives gross-margin persistence and the rate at which competitive advantage erodes.',
    auditPrompt:
      'Does the plan depend on a cost advantage (labour, energy, capital) that requires the relative cost position to persist? Flag when the advantage is time-limited or reversible.',
    flagConditions: [
      'labour-arbitrage thesis against trend of wage convergence',
      'energy-cost advantage against trend of policy or commodity shift',
    ],
  },

  infrastructure: {
    id: 'infrastructure',
    label: 'Infrastructure & Investment',
    category: 'fundamentals',
    description:
      'Physical and digital infrastructure (power, ports, logistics, broadband) that enables the plan. Infrastructure deficits are a first-order constraint in emerging markets.',
    auditPrompt:
      'Does the plan depend on infrastructure (power reliability, logistics networks, payment rails, broadband) that may not meet the assumed service level? Flag infrastructure dependencies not explicitly de-risked.',
    flagConditions: [
      'power-intensive operation in a grid-constrained market',
      'logistics cost assumption in a single-port or single-corridor network',
      'digital-service assumption in a market with unreliable payment rails',
    ],
  },

  geology: {
    id: 'geology',
    label: 'Geology & Natural Resources',
    category: 'external',
    description:
      'Endowment of raw materials, energy, water, and arable land. Drives input-cost stability and strategic-resource leverage.',
    auditPrompt:
      'Does the plan depend on access to specific natural resources (water, rare earths, arable land, hydrocarbons)? Flag resource-endowment assumptions and named-supplier concentration.',
    flagConditions: [
      'water-intensive operation without explicit water-security plan',
      'single-source dependency on a strategic mineral or rare-earth input',
    ],
  },

  acts_of_nature: {
    id: 'acts_of_nature',
    label: 'Acts of Nature',
    category: 'external',
    description:
      'Climate change, pandemics, natural disasters. Low-probability, high-impact events that Dalio treats as a separate determinant rather than a residual.',
    auditPrompt:
      'Does the plan include a tail-risk scenario for climate or pandemic disruption over the plan horizon? Flag multi-year plans with no explicit climate or disease-resilience modelling.',
    flagConditions: [
      'multi-year plan (>3 years) with no climate scenario',
      'supply chain concentrated in a single climate-exposed geography',
    ],
  },

  governance: {
    id: 'governance',
    label: 'Governance / Rule of Law',
    category: 'internal',
    description:
      'Regulatory predictability, contract enforceability, and institutional capacity. Emerging-market plans often price governance risk implicitly; Dalio forces it into the open.',
    auditPrompt:
      'Does the plan rely on regulatory stability, contract enforceability, or institutional capacity that may shift? Flag regulatory-change risk and enforcement-path dependencies.',
    flagConditions: [
      'plan horizon spans an election cycle in a jurisdiction with policy-shift history',
      'contract enforceability assumption in a jurisdiction with weak commercial-court capacity',
      'licence or concession dependency with unclear renewal pathway',
    ],
  },

  wealth_gaps: {
    id: 'wealth_gaps',
    label: 'Wealth / Opportunity / Values Gaps',
    category: 'internal',
    description:
      'Internal inequality and values-conflict trajectory. Rising gaps drive political volatility, tax regime shifts, and consumer-demand bifurcation.',
    auditPrompt:
      'Does the plan assume political stability, current tax regime, or current consumer-demand composition in a market where internal gaps are widening? Flag plans that bet on political quiescence through the horizon.',
    flagConditions: [
      'tax-rate assumption held constant across horizon',
      'consumer-demand projection assumes current income distribution persists',
    ],
  },

  civility: {
    id: 'civility',
    label: 'Civility / Determination / Work Ethic',
    category: 'internal',
    description:
      'Cultural determinants of collective output — trust, civility, work norms. Slow-moving but, per Dalio, among the most important long-run determinants.',
    auditPrompt:
      'Does the plan depend on collective-action assumptions (social cohesion, shared norms, trust in institutions) that may differ from the reasoner’s priors? Flag cross-cultural execution-risk assumptions.',
    flagConditions: [
      'cross-cultural joint venture without explicit partner-selection rationale',
      'execution plan assumes collaborative norms that vary meaningfully across the operating footprint',
    ],
  },

  resource_allocation: {
    id: 'resource_allocation',
    label: 'Resource-Allocation Efficiency',
    category: 'internal',
    description:
      'How efficiently capital, talent, and attention are allocated within the organisation or economy. Tracks whether the best opportunities are actually being funded.',
    auditPrompt:
      'Does the plan assume the allocating organisation (the firm, the state, the capital markets) will continue to fund this project through the horizon? Flag dependencies on internal or external capital that may be reallocated.',
    flagConditions: [
      'multi-year plan reliant on continuous internal funding against competing initiatives',
      'public-funding dependency without named budget commitment across the horizon',
    ],
  },
};

export const DALIO_DETERMINANT_LIST: DalioDeterminant[] = Object.values(DALIO_DETERMINANTS);

export function getDalioDeterminant(id: string): DalioDeterminant | null {
  return DALIO_DETERMINANTS[id] ?? null;
}

export function getDeterminantsByCategory(category: DalioCategory): DalioDeterminant[] {
  return DALIO_DETERMINANT_LIST.filter(d => d.category === category);
}

/**
 * Compact representation of all 18 determinants for injection into the
 * structural-assumptions pipeline prompt. Each line: `id | label | auditPrompt`.
 */
export function buildDalioPromptBlock(): string {
  return DALIO_DETERMINANT_LIST.map(d => `- ${d.id} (${d.label}): ${d.auditPrompt}`).join('\n');
}
