/**
 * Outreach Intelligence Brief — nightly corp-dev / M&A signal digest.
 *
 * The nightly cron (/api/cron/outreach-intel) runs this AFTER
 * sync-intelligence so the NewsArticle table is fresh, distills the
 * day's corp-dev / M&A items into ≤6 founder-facing signal cards, and
 * persists one OutreachIntelBrief row per UTC day.
 *
 * Discipline (mirrors M-7 ripple-detection / M-3 extract-from-memo):
 * the SELECTION + PARSE + DATE logic is PURE and unit-tested; the only
 * I/O is the searchNews fetch + the single MODEL_CHEAP synthesis call
 * in `generateOutreachIntelBrief`. The pure layer never calls Prisma,
 * never calls an LLM, and is deterministic.
 *
 * Anti-hallucination: the synthesis prompt references articles by
 * integer index (the same technique newsService uses); the parser
 * resolves each item back to a REAL ingested article by index and
 * drops any item whose index is out of range — the LLM cannot invent
 * a source link.
 *
 * Ego-threat discipline: `biasAngle` is written at the DEAL-PATTERN
 * level ("the kind of pattern an audit surfaces in deals shaped like
 * this"), never as a claim that any named person reasoned badly. This
 * keeps the signal ego-safe when it later seeds the Phase-C 1-pager.
 */

import { searchNews } from '@/lib/news/newsService';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Subset of the searchNews result shape the brief consumes. */
export interface IntelSourceArticle {
  title: string;
  link: string;
  source: string;
  description: string;
  publishedAt: Date;
  relevanceScore: number;
  biasTypes: string[];
  extractedTopics: string[];
  feedCategory: string;
}

export interface OutreachIntelItem {
  /** The corp-dev / M&A event in plain language. */
  headline: string;
  /** 1-2 sentence so-what for a strategy / corp-dev / fund operator. */
  whyItMatters: string;
  /** Coarse sector label (maps loosely to the case-library Industry set). */
  sector: string;
  /** Deal-PATTERN-level cognitive-bias lens — never an accusation. */
  biasAngle: string;
  sourceTitle: string;
  sourceLink: string;
}

export interface OutreachIntelBriefData {
  /** YYYY-MM-DD (UTC). */
  briefDate: string;
  /** 2-3 sentence morning read. */
  summary: string;
  items: OutreachIntelItem[];
  /** How many source articles fed the synthesis. */
  articleCount: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Max articles handed to the synthesis LLM (keeps the prompt bounded). */
export const MAX_ARTICLES_FOR_SYNTHESIS = 18;
/** Max signal cards in a single brief. */
export const MAX_BRIEF_ITEMS = 6;
/** Floor relevanceScore for a non-corp_dev-category article to qualify. */
export const MIN_RELEVANCE = 0.4;

/**
 * Categories the brief draws on. `corp_dev` is the primary feed, but
 * the SEC 8-K (`regulatory`) + McKinsey / Harvard-Law (`business`)
 * feeds are corp-dev-rich too, so the brief degrades gracefully if a
 * corp_dev RSS source goes dark.
 */
export const BRIEF_FEED_CATEGORIES = ['corp_dev', 'business', 'regulatory'] as const;

/** Lowercased substrings that mark an article as corp-dev / M&A. */
export const CORP_DEV_KEYWORDS: readonly string[] = [
  'acquisition',
  'acquire',
  'acquires',
  'acquired',
  'merger',
  'merges',
  'm&a',
  'takeover',
  'buyout',
  'leveraged buyout',
  'lbo',
  'divestiture',
  'divests',
  'spin-off',
  'spinoff',
  'carve-out',
  'carveout',
  'joint venture',
  'tender offer',
  'all-stock',
  'all-cash',
  'private equity',
  'deal value',
  'synergy',
  'synergies',
  'due diligence',
  'integration plan',
  'strategic review',
];

// ─── Pure: date key ──────────────────────────────────────────────────────────

/** UTC YYYY-MM-DD for `now` — the per-day idempotency key. */
export function briefDateFor(now: Date): string {
  return now.toISOString().slice(0, 10);
}

// ─── Pure: candidate selection ───────────────────────────────────────────────

function matchesCorpDev(a: IntelSourceArticle): boolean {
  if (a.feedCategory === 'corp_dev') return true;
  if (a.relevanceScore < MIN_RELEVANCE) return false;
  const haystack = `${a.title} ${a.description} ${a.extractedTopics.join(' ')}`.toLowerCase();
  return CORP_DEV_KEYWORDS.some(kw => haystack.includes(kw));
}

/**
 * Dedupe by link, keep corp-dev / M&A-relevant articles, rank by
 * relevance then recency, cap at MAX_ARTICLES_FOR_SYNTHESIS. Pure +
 * deterministic for a given input ordering.
 */
export function selectCorpDevArticles(articles: IntelSourceArticle[]): IntelSourceArticle[] {
  const seen = new Set<string>();
  const deduped: IntelSourceArticle[] = [];
  for (const a of articles) {
    if (!a.link || seen.has(a.link)) continue;
    seen.add(a.link);
    if (matchesCorpDev(a)) deduped.push(a);
  }
  deduped.sort((x, y) => {
    if (y.relevanceScore !== x.relevanceScore) return y.relevanceScore - x.relevanceScore;
    return y.publishedAt.getTime() - x.publishedAt.getTime();
  });
  return deduped.slice(0, MAX_ARTICLES_FOR_SYNTHESIS);
}

// ─── Pure: synthesis prompt ──────────────────────────────────────────────────

export function buildIntelSynthesisPrompt(articles: IntelSourceArticle[]): string {
  const list = articles
    .map(
      (a, i) =>
        `[${i}] "${a.title}" (${a.source}) — ${a.description.slice(0, 240).replace(/\s+/g, ' ')}`
    )
    .join('\n');

  return `You are a corporate-development and M&A intelligence analyst preparing a short morning brief for a solo founder running personalised 1:1 outreach (5-10 messages a week) to four buyer personas: fractional CSOs, mid-market heads of corporate development, smaller-fund GPs, and PE-backed founder/CEOs.

From the articles below, distill the ${MAX_BRIEF_ITEMS} HIGHEST-SIGNAL corp-dev / M&A items worth the founder knowing this morning. Skip anything that is not a strategic-decision / deal / corporate-development signal (ignore pure markets/macro/earnings noise).

For each item return:
- sourceIndex: the integer [i] of the article it is drawn from (MUST be one of the indices shown; never invent one)
- headline: the event in plain language, <= 16 words
- whyItMatters: 1-2 sentences — the so-what for a strategy / corp-dev / fund operator
- sector: a coarse sector label (e.g. "Technology", "Financial Services", "Healthcare", "Industrials", "Consumer", "Energy")
- biasAngle: name the cognitive-bias PATTERN that deals shaped like this commonly carry — written at the deal-pattern level (e.g. "synergy projections of this shape often rest on planning-fallacy + overconfidence"). NEVER assert that a named person or team reasoned badly. Pattern-level only.

Also return a 2-3 sentence "summary": the founder's morning read of the day's corp-dev/M&A landscape.

Articles:
${list}

Return ONLY raw JSON, no markdown:
{"summary": "...", "items": [{"sourceIndex": 0, "headline": "...", "whyItMatters": "...", "sector": "...", "biasAngle": "..."}]}`;
}

// ─── Pure: defensive parse ───────────────────────────────────────────────────

interface RawIntelItem {
  sourceIndex?: unknown;
  headline?: unknown;
  whyItMatters?: unknown;
  sector?: unknown;
  biasAngle?: unknown;
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

/**
 * Parse the synthesis response, resolving each item's `sourceIndex`
 * back to a REAL article from `sourceArticles`. Drops items with an
 * out-of-range / missing index or an empty headline. Returns
 * `{ summary: '', items: [] }` on any structural failure — the cron
 * persists an honest empty brief rather than throwing.
 */
export function parseIntelSynthesis(
  raw: string,
  sourceArticles: IntelSourceArticle[]
): { summary: string; items: OutreachIntelItem[] } {
  const empty = { summary: '', items: [] as OutreachIntelItem[] };
  let cleaned = raw.trim();
  // Strip markdown fences if the model wrapped the JSON.
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  // Some models prepend prose — slice from the first brace.
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) cleaned = cleaned.slice(firstBrace);

  let parsed: { summary?: unknown; items?: unknown };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== 'object') return empty;

  const rawItems = Array.isArray(parsed.items) ? (parsed.items as RawIntelItem[]) : [];
  const items: OutreachIntelItem[] = [];
  for (const r of rawItems) {
    if (items.length >= MAX_BRIEF_ITEMS) break;
    const idx =
      typeof r.sourceIndex === 'number' && Number.isInteger(r.sourceIndex) ? r.sourceIndex : -1;
    const article = idx >= 0 && idx < sourceArticles.length ? sourceArticles[idx] : null;
    if (!article) continue; // out-of-range / hallucinated index — drop
    const headline = str(r.headline, 200);
    if (!headline) continue;
    items.push({
      headline,
      whyItMatters: str(r.whyItMatters, 400),
      sector: str(r.sector, 60) || 'General',
      biasAngle: str(r.biasAngle, 300),
      sourceTitle: article.title,
      sourceLink: article.link,
    });
  }

  return { summary: str(parsed.summary, 600), items };
}

// ─── I/O wrapper ─────────────────────────────────────────────────────────────

/**
 * Fetch fresh corp-dev / M&A articles, run one MODEL_CHEAP synthesis
 * call, and return the brief. Fail-soft: if there is no signal or the
 * LLM call fails, returns a brief with an honest summary and no items
 * (the cron still persists it so the panel shows "scan ran, nothing
 * material" rather than a stale brief).
 */
export async function generateOutreachIntelBrief(now: Date = new Date()): Promise<{
  data: OutreachIntelBriefData;
  candidateCount: number;
}> {
  const briefDate = briefDateFor(now);

  // Pull recent articles across the corp-dev-rich categories.
  const perCategory = await Promise.all(
    BRIEF_FEED_CATEGORIES.map(category =>
      // Degraded-mode fallback: one category's read failing must not
      // sink the whole brief — the others still carry signal and the
      // empty-candidates path emits an honest "no signal" summary.
      searchNews({ category, limit: 25 }).catch(() => [])
    )
  );
  const merged: IntelSourceArticle[] = perCategory.flat().map(a => ({
    title: a.title,
    link: a.link,
    source: a.source,
    description: a.description,
    publishedAt: a.publishedAt,
    relevanceScore: a.relevanceScore,
    biasTypes: a.biasTypes,
    extractedTopics: a.extractedTopics,
    feedCategory: a.feedCategory,
  }));

  const candidates = selectCorpDevArticles(merged);

  if (candidates.length === 0) {
    return {
      data: {
        briefDate,
        summary:
          'No material corp-dev / M&A signal in the last 48 hours. Nothing new to anchor outreach on today — re-run tomorrow.',
        items: [],
        articleCount: 0,
      },
      candidateCount: 0,
    };
  }

  try {
    const { generateText } = await import('@/lib/ai/providers/gateway');
    const { MODEL_CHEAP } = await import('@/lib/ai/gateway-models');
    const { withTimeout } = await import('@/lib/utils/resilience');

    const prompt = buildIntelSynthesisPrompt(candidates);
    const result = await withTimeout(
      () => generateText(prompt, { model: MODEL_CHEAP, temperature: 0.2 }),
      30_000,
      'Intel synthesis timeout'
    );
    const { summary, items } = parseIntelSynthesis(result.text || '', candidates);

    return {
      data: {
        briefDate,
        summary:
          summary ||
          `${candidates.length} corp-dev / M&A items scanned. Synthesis returned no structured highlights — review the source feeds directly.`,
        items,
        articleCount: candidates.length,
      },
      candidateCount: candidates.length,
    };
  } catch {
    return {
      data: {
        briefDate,
        summary: `${candidates.length} corp-dev / M&A items scanned but synthesis was unavailable. Re-run tomorrow; the source feeds are still warm.`,
        items: [],
        articleCount: candidates.length,
      },
      candidateCount: candidates.length,
    };
  }
}
