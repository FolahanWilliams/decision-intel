/**
 * Context Assembly Layer
 *
 * Queries all intelligence sources in parallel and returns a structured
 * IntelligenceContext object for consumption by LangGraph agent nodes.
 *
 * Takes a document's extracted topics, detected biases, companies, and
 * industries → fans out to news, research, case studies, and macro context
 * → returns a unified context envelope.
 */

import { searchNews, syncAllFeeds, type NewsSearchOptions } from '@/lib/news/newsService';
import { findResearchForBiases, type ResearchPaper } from '@/lib/research/scholarSearch';
import { matchCaseStudies, type CaseStudyMatch } from '@/lib/research/caseStudyMatcher';
import {
  getMacroSnapshot,
  getIndustryBenchmarks,
  type MacroSnapshot,
  type IndustryBenchmark,
} from '@/lib/tools/macroContext';
import { withTimeout as utilTimeout } from '@/lib/utils/resilience';
import { createLogger } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';

const log = createLogger('ContextBuilder');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IntelligenceRequest {
  /** Bias types detected by the bias detective (e.g. "confirmation_bias") */
  biasTypes: string[];
  /** Industry sector extracted from the document (e.g. "Technology") */
  industry?: string;
  /** Key topics/keywords extracted from the document */
  topics?: string[];
  /** Companies mentioned in the document */
  companies?: string[];
}

export interface NewsContextItem {
  title: string;
  link: string;
  source: string;
  category: string;
  publishedAt: string;
  relevanceScore: number;
  biasTypes: string[];
}

export interface IntelligenceContext {
  /** Recent news articles relevant to the document's topics and biases */
  news: NewsContextItem[];
  /** Academic research papers backing detected bias types */
  research: Record<string, ResearchPaper[]>;
  /** Historical case studies matching the bias pattern */
  caseStudies: CaseStudyMatch[];
  /** Current macroeconomic snapshot */
  macro: MacroSnapshot | null;
  /** Industry-specific benchmarks */
  industryBenchmarks: IndustryBenchmark[];
  /** Metadata about the context assembly */
  meta: {
    assembledAt: string;
    durationMs: number;
    sources: {
      newsCount: number;
      researchCount: number;
      caseStudyCount: number;
      macroIndicators: number;
      industryBenchmarks: number;
    };
    errors: string[];
  };
}

// ─── On-Demand Lazy Sync ─────────────────────────────────────────────────────
// Between daily cron runs, data can become stale. This ensures fresh news
// is available by triggering a lightweight sync if the DB is empty or stale.

const STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours — triggers lazy sync halfway between daily crons
let lastLazySyncAttempt = 0; // Prevent hammering — at most once per 30 min per process
const LAZY_SYNC_COOLDOWN_MS = 30 * 60 * 1000;

async function ensureFreshNews(): Promise<void> {
  // Cooldown: don't attempt lazy sync more than once per 30 minutes
  if (Date.now() - lastLazySyncAttempt < LAZY_SYNC_COOLDOWN_MS) return;

  try {
    // Check if we have any recent articles
    const recentArticle = await prisma.newsArticle.findFirst({
      where: { createdAt: { gt: new Date(Date.now() - STALE_THRESHOLD_MS) } },
      select: { id: true },
    });

    if (recentArticle) return; // Data is fresh enough

    log.info('News data is stale or empty — triggering on-demand sync...');
    lastLazySyncAttempt = Date.now();

    // Run sync with timeout — generous enough for slow RSS feeds
    await utilTimeout(() => syncAllFeeds(), 60_000, 'On-demand news sync timeout');
    log.info('On-demand news sync completed');
  } catch (err) {
    // Non-fatal: if lazy sync fails, we proceed with whatever cached data exists
    log.warn(
      'On-demand news sync failed (non-fatal):',
      err instanceof Error ? err.message : String(err)
    );
  }
}

// ─── Context Assembly ────────────────────────────────────────────────────────

/**
 * Assemble intelligence context for a document analysis.
 * All sources are queried in parallel with individual error isolation.
 * Returns whatever data is available — never throws.
 */
export async function assembleContext(request: IntelligenceRequest): Promise<IntelligenceContext> {
  const start = Date.now();
  const errors: string[] = [];

  const { biasTypes, industry, topics } = request;

  // Ensure news data is fresh (lazy sync if stale)
  await ensureFreshNews();

  // Fan out to all intelligence sources in parallel
  const [newsResult, researchResult, caseStudyResult, macroResult, benchmarkResult] =
    await Promise.allSettled([
      // 1. News: search by bias types + topics + industry
      fetchNewsContext(biasTypes, topics, industry),

      // 2. Research: find papers for each detected bias type
      biasTypes.length > 0
        ? utilTimeout(() => findResearchForBiases(biasTypes, 2), 25_000, 'Research lookup timeout')
        : Promise.resolve({} as Record<string, ResearchPaper[]>),

      // 3. Case studies: match by bias pattern + industry
      biasTypes.length > 0
        ? utilTimeout(
            () => matchCaseStudies(biasTypes, industry, 5),
            15_000,
            'Case study lookup timeout'
          )
        : Promise.resolve([] as CaseStudyMatch[]),

      // 4. Macro snapshot (FRED data)
      utilTimeout(() => getMacroSnapshot(), 20_000, 'Macro snapshot timeout'),

      // 5. Industry benchmarks (Gemini grounded search)
      industry
        ? utilTimeout(() => getIndustryBenchmarks(industry), 30_000, 'Industry benchmark timeout')
        : Promise.resolve([] as IndustryBenchmark[]),
    ]);

  // Extract results with error isolation
  const news = extractResult<NewsContextItem[]>(newsResult, [], 'news', errors);
  const research = extractResult<Record<string, ResearchPaper[]>>(
    researchResult,
    {},
    'research',
    errors
  );
  const caseStudies = extractResult<CaseStudyMatch[]>(caseStudyResult, [], 'caseStudies', errors);
  const macro = extractResult<MacroSnapshot | null>(macroResult, null, 'macro', errors);
  const industryBenchmarks = extractResult<IndustryBenchmark[]>(
    benchmarkResult,
    [],
    'industryBenchmarks',
    errors
  );

  const durationMs = Date.now() - start;

  if (errors.length > 0) {
    log.warn(
      `Context assembly completed with ${errors.length} error(s) in ${durationMs}ms:`,
      errors
    );
  } else {
    log.info(
      `Context assembly complete in ${durationMs}ms — ` +
        `news:${news.length}, research:${Object.values(research).flat().length}, ` +
        `cases:${caseStudies.length}, macro:${macro?.indicators?.length ?? 0}, ` +
        `benchmarks:${industryBenchmarks.length}`
    );
  }

  return {
    news,
    research,
    caseStudies,
    macro,
    industryBenchmarks,
    meta: {
      assembledAt: new Date().toISOString(),
      durationMs,
      sources: {
        newsCount: news.length,
        researchCount: Object.values(research).flat().length,
        caseStudyCount: caseStudies.length,
        macroIndicators: macro?.indicators?.length ?? 0,
        industryBenchmarks: industryBenchmarks.length,
      },
      errors,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchNewsContext(
  biasTypes: string[],
  topics?: string[],
  industry?: string
): Promise<NewsContextItem[]> {
  const searchOptions: NewsSearchOptions = {
    limit: 10,
  };

  // Prioritize: bias-relevant news > topic-relevant > industry-relevant
  if (biasTypes.length > 0) searchOptions.biasTypes = biasTypes;
  if (topics && topics.length > 0) searchOptions.topics = topics;
  if (industry) searchOptions.industry = industry;

  const articles = await searchNews(searchOptions);

  return articles.map(a => ({
    title: a.title,
    link: a.link,
    source: a.source,
    category: a.feedCategory,
    publishedAt: new Date(a.publishedAt).toISOString(),
    relevanceScore: a.relevanceScore,
    biasTypes: a.biasTypes,
  }));
}

function extractResult<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
  label: string,
  errors: string[]
): T {
  if (result.status === 'fulfilled') return result.value;
  const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
  errors.push(`${label}: ${msg}`);
  return fallback;
}

/**
 * Format intelligence context as a concise text block for injection into
 * LLM prompts. Keeps it under ~2000 chars to avoid bloating prompts.
 */
export function formatContextForPrompt(ctx: IntelligenceContext): string {
  const parts: string[] = [];

  // News summary
  if (ctx.news.length > 0) {
    const newsLines = ctx.news.slice(0, 5).map(n => `- [${n.source}] ${n.title} (${n.category})`);
    parts.push(`RECENT NEWS (${ctx.news.length} articles):\n${newsLines.join('\n')}`);
  }

  // Research summary
  const allPapers = Object.entries(ctx.research);
  if (allPapers.length > 0) {
    const researchLines = allPapers
      .flatMap(([bias, papers]) =>
        papers
          .slice(0, 2)
          .map(p => `- [${bias}] "${p.paperTitle}" (${p.year ?? 'n/a'}, cited ${p.citationCount}x)`)
      )
      .slice(0, 6);
    parts.push(`ACADEMIC RESEARCH:\n${researchLines.join('\n')}`);
  }

  // Case studies
  if (ctx.caseStudies.length > 0) {
    const caseLines = ctx.caseStudies
      .slice(0, 3)
      .map(c => `- ${c.company} (${c.year ?? 'n/a'}): ${c.outcome} — ${c.lessons.slice(0, 100)}`);
    parts.push(`HISTORICAL PARALLELS:\n${caseLines.join('\n')}`);
  }

  // Macro context
  if (ctx.macro && ctx.macro.indicators.length > 0) {
    parts.push(`MACRO ENVIRONMENT: ${ctx.macro.summary}`);
  }

  // Industry benchmarks
  if (ctx.industryBenchmarks.length > 0) {
    const benchLines = ctx.industryBenchmarks
      .slice(0, 4)
      .map(b => `- ${b.metric}: ${b.value} (${b.source})`);
    parts.push(`INDUSTRY BENCHMARKS:\n${benchLines.join('\n')}`);
  }

  if (parts.length === 0) {
    return 'No external intelligence context available.';
  }

  return parts.join('\n\n');
}
