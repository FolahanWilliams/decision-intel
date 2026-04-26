/**
 * Market-context detection for the bias-detection pipeline.
 *
 * Why: a 35%+ CAGR claim in a Lagos fintech memo is not the same overconfidence
 * signal as a 35%+ CAGR claim in a Tokyo telco memo. Emerging markets routinely
 * print growth rates that would be hockey-stick fantasy in developed markets.
 * Without context, the bias detector flags both identically — and Titi (Sankore)
 * will dismiss the audit as "doesn't understand my market" the moment a Dangote
 * memo lights up with overconfidence flags on a 25% CAGR that's actually below
 * sector trend.
 *
 * What this does:
 *   1. detectMarketContext(text) scans the memo for country mentions and
 *      classifies the dominant market context: emerging_market | developed_market
 *      | cross_border | unknown.
 *   2. The detected context is fed into buildMarketContextBlock() in prompts.ts
 *      and injected into the bias-detection prompt as "growth-rate priors to
 *      apply for this jurisdiction."
 *   3. The detected context is persisted on the AnalysisResult and surfaced as
 *      a small chip on the analysis detail page so the user can see exactly
 *      which priors were applied.
 *
 * Lookup table is intentionally NOT exhaustive — covers the markets Decision
 * Intel realistically sees memos about (G7 + major EM + frontier Africa). When
 * a country we don't list shows up, we fall through to the bias detector's
 * default behaviour, which is correct.
 */

export type MarketContext = 'emerging_market' | 'developed_market' | 'cross_border' | 'unknown';

interface CountryEntry {
  /** Canonical name used in user-facing output. */
  name: string;
  /** Match strings — case-insensitive, word-boundary on first/last char. */
  aliases: string[];
  context: 'emerging_market' | 'developed_market';
}

// Order matters only for display/logging; matching is unordered.
const COUNTRIES: CountryEntry[] = [
  // Africa — the markets Sankore + the African design-partner pipeline lean on.
  {
    name: 'Nigeria',
    aliases: ['nigeria', 'nigerian', 'lagos', 'abuja'],
    context: 'emerging_market',
  },
  { name: 'Kenya', aliases: ['kenya', 'kenyan', 'nairobi'], context: 'emerging_market' },
  { name: 'Ghana', aliases: ['ghana', 'ghanaian', 'accra'], context: 'emerging_market' },
  {
    name: 'South Africa',
    aliases: ['south africa', 'south african', 'johannesburg', 'cape town'],
    context: 'emerging_market',
  },
  { name: 'Egypt', aliases: ['egypt', 'egyptian', 'cairo'], context: 'emerging_market' },
  {
    name: 'Ethiopia',
    aliases: ['ethiopia', 'ethiopian', 'addis ababa'],
    context: 'emerging_market',
  },
  { name: 'Morocco', aliases: ['morocco', 'moroccan', 'casablanca'], context: 'emerging_market' },
  {
    name: 'Côte d’Ivoire',
    aliases: ['cote d’ivoire', "cote d'ivoire", 'ivory coast', 'abidjan'],
    context: 'emerging_market',
  },
  { name: 'Senegal', aliases: ['senegal', 'senegalese', 'dakar'], context: 'emerging_market' },
  { name: 'Rwanda', aliases: ['rwanda', 'rwandan', 'kigali'], context: 'emerging_market' },
  {
    name: 'Tanzania',
    aliases: ['tanzania', 'tanzanian', 'dar es salaam'],
    context: 'emerging_market',
  },
  { name: 'Uganda', aliases: ['uganda', 'ugandan', 'kampala'], context: 'emerging_market' },

  // Asia EM
  {
    name: 'India',
    aliases: ['india', 'indian', 'mumbai', 'bangalore', 'bengaluru', 'delhi', 'new delhi'],
    context: 'emerging_market',
  },
  {
    name: 'Indonesia',
    aliases: ['indonesia', 'indonesian', 'jakarta'],
    context: 'emerging_market',
  },
  {
    name: 'Vietnam',
    aliases: ['vietnam', 'vietnamese', 'ho chi minh', 'hanoi'],
    context: 'emerging_market',
  },
  {
    name: 'Philippines',
    aliases: ['philippines', 'philippine', 'filipino', 'manila'],
    context: 'emerging_market',
  },
  { name: 'Thailand', aliases: ['thailand', 'thai', 'bangkok'], context: 'emerging_market' },
  {
    name: 'Malaysia',
    aliases: ['malaysia', 'malaysian', 'kuala lumpur'],
    context: 'emerging_market',
  },
  {
    name: 'Pakistan',
    aliases: ['pakistan', 'pakistani', 'karachi', 'islamabad'],
    context: 'emerging_market',
  },
  {
    name: 'Bangladesh',
    aliases: ['bangladesh', 'bangladeshi', 'dhaka'],
    context: 'emerging_market',
  },

  // LatAm EM
  {
    name: 'Brazil',
    aliases: ['brazil', 'brazilian', 'são paulo', 'sao paulo', 'rio de janeiro'],
    context: 'emerging_market',
  },
  { name: 'Mexico', aliases: ['mexico', 'mexican', 'mexico city'], context: 'emerging_market' },
  {
    name: 'Argentina',
    aliases: ['argentina', 'argentine', 'buenos aires'],
    context: 'emerging_market',
  },
  {
    name: 'Colombia',
    aliases: ['colombia', 'colombian', 'bogota', 'bogotá'],
    context: 'emerging_market',
  },
  { name: 'Chile', aliases: ['chile', 'chilean', 'santiago'], context: 'emerging_market' },
  { name: 'Peru', aliases: ['peru', 'peruvian', 'lima'], context: 'emerging_market' },

  // Other EM
  {
    name: 'Turkey',
    aliases: ['turkey', 'turkish', 'istanbul', 'ankara'],
    context: 'emerging_market',
  },
  {
    name: 'United Arab Emirates',
    aliases: ['uae', 'united arab emirates', 'dubai', 'abu dhabi'],
    context: 'emerging_market',
  },
  {
    name: 'Saudi Arabia',
    aliases: ['saudi arabia', 'saudi', 'riyadh'],
    context: 'emerging_market',
  },
  {
    name: 'China',
    aliases: ['china', 'chinese', 'beijing', 'shanghai', 'shenzhen'],
    context: 'emerging_market',
  },
  {
    name: 'Russia',
    aliases: ['russia', 'russian', 'moscow', 'st petersburg'],
    context: 'emerging_market',
  },
  { name: 'Poland', aliases: ['poland', 'polish', 'warsaw'], context: 'emerging_market' },

  // Developed markets (G7 + DM peers)
  {
    name: 'United States',
    aliases: [
      'united states',
      'usa',
      'u.s.a.',
      'us market',
      'america',
      'american',
      'new york',
      'silicon valley',
      'san francisco',
      'seattle',
    ],
    context: 'developed_market',
  },
  {
    name: 'United Kingdom',
    aliases: [
      'united kingdom',
      'uk',
      'u.k.',
      'britain',
      'british',
      'england',
      'london',
      'manchester',
    ],
    context: 'developed_market',
  },
  {
    name: 'Germany',
    aliases: ['germany', 'german', 'berlin', 'munich', 'frankfurt'],
    context: 'developed_market',
  },
  { name: 'France', aliases: ['france', 'french', 'paris'], context: 'developed_market' },
  { name: 'Italy', aliases: ['italy', 'italian', 'milan', 'rome'], context: 'developed_market' },
  {
    name: 'Spain',
    aliases: ['spain', 'spanish', 'madrid', 'barcelona'],
    context: 'developed_market',
  },
  {
    name: 'Netherlands',
    aliases: ['netherlands', 'dutch', 'amsterdam'],
    context: 'developed_market',
  },
  { name: 'Sweden', aliases: ['sweden', 'swedish', 'stockholm'], context: 'developed_market' },
  {
    name: 'Switzerland',
    aliases: ['switzerland', 'swiss', 'zurich', 'geneva'],
    context: 'developed_market',
  },
  { name: 'Japan', aliases: ['japan', 'japanese', 'tokyo', 'osaka'], context: 'developed_market' },
  { name: 'South Korea', aliases: ['south korea', 'korean', 'seoul'], context: 'developed_market' },
  {
    name: 'Canada',
    aliases: ['canada', 'canadian', 'toronto', 'vancouver', 'montreal'],
    context: 'developed_market',
  },
  {
    name: 'Australia',
    aliases: ['australia', 'australian', 'sydney', 'melbourne'],
    context: 'developed_market',
  },
  {
    name: 'New Zealand',
    aliases: ['new zealand', 'auckland', 'wellington'],
    context: 'developed_market',
  },
  { name: 'Singapore', aliases: ['singapore', 'singaporean'], context: 'developed_market' },
  { name: 'Hong Kong', aliases: ['hong kong'], context: 'developed_market' },
  { name: 'Israel', aliases: ['israel', 'israeli', 'tel aviv'], context: 'developed_market' },
  { name: 'Ireland', aliases: ['ireland', 'irish', 'dublin'], context: 'developed_market' },
];

export interface MarketContextDetection {
  context: MarketContext;
  emergingMarketCountries: string[];
  developedMarketCountries: string[];
  /**
   * Confidence from 0 to 1. We use mention-count proxies, not real NLP — high
   * confidence requires multiple distinct mentions. Surface this in the UI so
   * the user knows when the auto-detection is shaky.
   */
  confidence: number;
  /** Human-readable rationale for the chosen context. */
  rationale: string;
}

/**
 * Scan memo text for country mentions and classify the dominant market context.
 * Pure function, no side effects, no LLM call.
 */
export function detectMarketContext(memoText: string): MarketContextDetection {
  if (!memoText || typeof memoText !== 'string') {
    return {
      context: 'unknown',
      emergingMarketCountries: [],
      developedMarketCountries: [],
      confidence: 0,
      rationale: 'No memo text provided.',
    };
  }

  const lower = memoText.toLowerCase();
  const emHits = new Map<string, number>();
  const dmHits = new Map<string, number>();

  for (const country of COUNTRIES) {
    let hits = 0;
    for (const alias of country.aliases) {
      // Word-boundary match. \b doesn't handle non-ASCII well but the aliases
      // are already lowercased and the lookup string is lowercased, so simple
      // boundary checks work for the common cases here.
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'g');
      const matches = lower.match(re);
      if (matches) hits += matches.length;
    }
    if (hits > 0) {
      const target = country.context === 'emerging_market' ? emHits : dmHits;
      target.set(country.name, hits);
    }
  }

  const emCountries = Array.from(emHits.keys()).sort();
  const dmCountries = Array.from(dmHits.keys()).sort();
  const emTotal = Array.from(emHits.values()).reduce((a, b) => a + b, 0);
  const dmTotal = Array.from(dmHits.values()).reduce((a, b) => a + b, 0);

  if (emTotal === 0 && dmTotal === 0) {
    return {
      context: 'unknown',
      emergingMarketCountries: [],
      developedMarketCountries: [],
      confidence: 0,
      rationale: 'No country mentions detected — using default growth-rate priors.',
    };
  }

  // Cross-border: meaningful presence on both sides. Threshold is 2 mentions
  // on the minority side AND minority share ≥ 25% — otherwise a single passing
  // reference to "the US" in an EM memo would push it cross-border.
  const total = emTotal + dmTotal;
  const minorityCount = Math.min(emTotal, dmTotal);
  const minorityShare = minorityCount / total;
  const isCrossBorder = minorityCount >= 2 && minorityShare >= 0.25;

  if (isCrossBorder) {
    return {
      context: 'cross_border',
      emergingMarketCountries: emCountries,
      developedMarketCountries: dmCountries,
      confidence: Math.min(1, total / 8),
      rationale: `Cross-border memo — ${emCountries.length} emerging-market jurisdiction(s) and ${dmCountries.length} developed-market jurisdiction(s) referenced. Apply a hybrid prior: the EM segment uses EM growth-rate tolerances, the DM segment uses DM tolerances.`,
    };
  }

  if (emTotal > dmTotal) {
    return {
      context: 'emerging_market',
      emergingMarketCountries: emCountries,
      developedMarketCountries: dmCountries,
      confidence: Math.min(1, emTotal / 5),
      rationale: `Emerging-market memo — references ${emCountries.join(', ')}. Apply EM growth-rate priors (35%+ CAGR is sector-typical, not automatically overconfidence).`,
    };
  }

  return {
    context: 'developed_market',
    emergingMarketCountries: emCountries,
    developedMarketCountries: dmCountries,
    confidence: Math.min(1, dmTotal / 5),
    rationale: `Developed-market memo — references ${dmCountries.join(', ')}. Apply DM growth-rate priors (25%+ CAGR warrants overconfidence scrutiny).`,
  };
}

/**
 * Growth-rate thresholds the bias detector should use as the OVERCONFIDENCE
 * trigger when overall growth claims appear in the memo. These are not "the
 * truth" — they're priors. The author can defend a higher number with evidence.
 */
export const GROWTH_RATE_PRIORS: Record<MarketContext, { cagrCeiling: number; rationale: string }> =
  {
    emerging_market: {
      cagrCeiling: 35,
      rationale:
        'Emerging-market sectors (African telecoms, Indian fintech, Brazilian commerce) routinely sustain 30–45% CAGR for 3–5 years before maturing. Flag overconfidence only above ~35% sustained CAGR, or when growth claims are unhedged on FX / political / liquidity risk.',
    },
    developed_market: {
      cagrCeiling: 25,
      rationale:
        'Developed-market sectors mature: 25%+ sustained CAGR is rare and warrants scrutiny. Flag overconfidence on growth-rate claims above this unless the memo provides specific market-share or new-segment evidence.',
    },
    cross_border: {
      cagrCeiling: 30,
      rationale:
        'Cross-border memo — apply segment-specific priors: emerging-market segments use the 35% ceiling; developed-market segments use 25%. Single blended growth claims that paper over this distinction are themselves an overconfidence signal.',
    },
    unknown: {
      cagrCeiling: 25,
      rationale:
        'No jurisdiction detected — default to developed-market priors (more conservative, fewer false negatives on overconfidence).',
    },
  };
