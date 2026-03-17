/**
 * Academic Research Grounding Service
 *
 * Enriches bias detections with scientific backing via Semantic Scholar API
 * and Gemini grounded search. Results are cached in the ResearchCache model.
 */

import { prisma } from '@/lib/prisma';
import { withRetry, withTimeout } from '@/lib/utils/resilience';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('ScholarSearch');

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';
const CACHE_TTL_DAYS = 30;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResearchPaper {
  paperTitle: string;
  authors: string[];
  year: number | null;
  abstract: string;
  doi: string | null;
  sourceUrl: string | null;
  citationCount: number;
  source: string;
}

// ─── Semantic Scholar Search ─────────────────────────────────────────────────

async function searchSemanticScholar(query: string, limit: number = 5): Promise<ResearchPaper[]> {
  try {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      fields: 'title,authors,year,abstract,externalIds,citationCount,url',
    });

    const response = await withTimeout(
      () =>
        fetch(`${SEMANTIC_SCHOLAR_API}/paper/search?${params}`, {
          headers: { 'User-Agent': 'DecisionIntel/1.0' },
        }),
      15_000,
      'Semantic Scholar timeout'
    );

    if (!response.ok) {
      log.warn(`Semantic Scholar returned ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const papers = (data.data || []) as Array<{
      title?: string;
      authors?: Array<{ name?: string }>;
      year?: number;
      abstract?: string;
      externalIds?: { DOI?: string };
      citationCount?: number;
      url?: string;
    }>;

    return papers
      .filter(p => p.title && p.abstract)
      .map(p => ({
        paperTitle: p.title!,
        authors: (p.authors || []).map(a => a.name || 'Unknown').slice(0, 10),
        year: p.year || null,
        abstract: (p.abstract || '').slice(0, 3000),
        doi: p.externalIds?.DOI || null,
        sourceUrl: p.url || null,
        citationCount: p.citationCount || 0,
        source: 'semantic_scholar',
      }));
  } catch (err) {
    log.warn('Semantic Scholar search failed:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

// ─── Gemini Grounded Scholar Search ──────────────────────────────────────────

async function searchViaGemini(biasType: string): Promise<ResearchPaper[]> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const { getRequiredEnvVar } = await import('@/lib/env');
    const genAI = new GoogleGenerativeAI(getRequiredEnvVar('GOOGLE_API_KEY'));

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL_NAME || 'gemini-3-flash-preview',
      tools: [{ googleSearch: {} } as Record<string, unknown>],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const prompt = `Find the top 3 most-cited academic research papers about "${biasType}" cognitive bias in decision-making.
For each paper, return:
- paperTitle: full title
- authors: string[] of author names
- year: publication year
- abstract: brief summary (1-2 sentences)
- doi: DOI if available, null otherwise
- citationCount: approximate citation count

Return a JSON array.`;

    const result = await withTimeout(
      () => model.generateContent(prompt),
      30_000,
      'Gemini scholar search timeout'
    );

    const text = result.response?.text?.() || '[]';
    const papers = JSON.parse(
      text
        .replace(/```json\n?/g, '')
        .replace(/```/g, '')
        .trim()
    );

    if (!Array.isArray(papers)) return [];

    return papers
      .map((p: Record<string, unknown>) => ({
        paperTitle: String(p.paperTitle || ''),
        authors: Array.isArray(p.authors) ? p.authors.map(String).slice(0, 10) : [],
        year: typeof p.year === 'number' ? p.year : null,
        abstract: String(p.abstract || '').slice(0, 3000),
        doi: typeof p.doi === 'string' ? p.doi : null,
        sourceUrl: null,
        citationCount: typeof p.citationCount === 'number' ? p.citationCount : 0,
        source: 'google_scholar',
      }))
      .filter((p: ResearchPaper) => p.paperTitle);
  } catch (err) {
    log.warn('Gemini scholar search failed:', err instanceof Error ? err.message : String(err));
    return [];
  }
}

// ─── Cache Layer ─────────────────────────────────────────────────────────────

async function getCachedPapers(biasType: string): Promise<ResearchPaper[] | null> {
  const papers = await prisma.researchCache.findMany({
    where: {
      biasTypes: { has: biasType },
      expiresAt: { gt: new Date() },
    },
    orderBy: { citationCount: 'desc' },
    take: 5,
  });

  if (papers.length === 0) return null;

  return papers.map(p => ({
    paperTitle: p.paperTitle,
    authors: p.authors,
    year: p.year,
    abstract: p.abstract,
    doi: p.doi,
    sourceUrl: p.sourceUrl,
    citationCount: p.citationCount,
    source: p.source,
  }));
}

async function cachePapers(biasType: string, papers: ResearchPaper[]): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

  for (const paper of papers) {
    try {
      if (paper.doi) {
        await prisma.researchCache.upsert({
          where: { doi: paper.doi },
          update: { citationCount: paper.citationCount },
          create: {
            paperTitle: paper.paperTitle,
            authors: paper.authors,
            year: paper.year,
            abstract: paper.abstract,
            doi: paper.doi,
            sourceUrl: paper.sourceUrl,
            biasTypes: [biasType],
            citationCount: paper.citationCount,
            source: paper.source,
            expiresAt,
          },
        });
      } else {
        await prisma.researchCache.create({
          data: {
            paperTitle: paper.paperTitle,
            authors: paper.authors,
            year: paper.year,
            abstract: paper.abstract,
            doi: paper.doi,
            sourceUrl: paper.sourceUrl,
            biasTypes: [biasType],
            citationCount: paper.citationCount,
            source: paper.source,
            expiresAt,
          },
        });
      }
    } catch {
      // Duplicate or DB error — skip
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Find research papers related to a specific cognitive bias type.
 * Checks cache first, then queries Semantic Scholar + Gemini grounded search.
 *
 * @param biasType e.g. "confirmation", "anchoring", "groupthink"
 * @param limit Max papers to return (default 5)
 */
export async function findResearchForBias(
  biasType: string,
  limit: number = 5
): Promise<ResearchPaper[]> {
  // Check cache first
  const cached = await getCachedPapers(biasType);
  if (cached && cached.length >= 3) {
    log.info(`Research cache hit for "${biasType}" (${cached.length} papers)`);
    return cached.slice(0, limit);
  }

  // Search both sources in parallel
  const query = `"${biasType}" cognitive bias decision-making`;
  const [semanticResults, geminiResults] = await Promise.allSettled([
    withRetry(() => searchSemanticScholar(query, limit), 2, 1000, 5000),
    searchViaGemini(biasType),
  ]);

  const papers: ResearchPaper[] = [];
  const seen = new Set<string>();

  // Merge results, deduplicate by title similarity
  for (const result of [semanticResults, geminiResults]) {
    if (result.status === 'fulfilled') {
      for (const paper of result.value) {
        const key = paper.paperTitle.toLowerCase().slice(0, 50);
        if (!seen.has(key)) {
          seen.add(key);
          papers.push(paper);
        }
      }
    }
  }

  // Sort by citation count, take top N
  papers.sort((a, b) => b.citationCount - a.citationCount);
  const topPapers = papers.slice(0, limit);

  // Cache asynchronously
  cachePapers(biasType, topPapers).catch(err => log.warn('Failed to cache research papers:', err));

  return topPapers;
}

/**
 * Bulk-search research for multiple bias types at once.
 * Used during analysis to enrich all detected biases.
 */
export async function findResearchForBiases(
  biasTypes: string[],
  papersPerBias: number = 3
): Promise<Record<string, ResearchPaper[]>> {
  const results: Record<string, ResearchPaper[]> = {};

  // Process sequentially to respect Semantic Scholar rate limits
  for (const biasType of biasTypes.slice(0, 5)) {
    results[biasType] = await findResearchForBias(biasType, papersPerBias);
  }

  return results;
}

/**
 * Clean expired research cache entries.
 */
export async function cleanExpiredResearch(): Promise<number> {
  const result = await prisma.researchCache.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
