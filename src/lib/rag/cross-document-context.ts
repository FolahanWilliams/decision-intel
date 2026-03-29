/**
 * Cross-Document RAG Context Assembly
 *
 * Pulls relevant context from a user's other documents (both section-level
 * and whole-document embeddings) to enrich the analysis pipeline.
 */

import { searchSimilarSections } from './section-embeddings';
import { searchSimilarWithOutcomes } from './embeddings';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('CrossDocContext');

const MAX_PROMPT_CHARS = 3000;

export interface SectionMatch {
  documentId: string;
  filename: string;
  sectionTitle: string;
  content: string;
  similarity: number;
}

export interface DocMatch {
  documentId: string;
  filename: string;
  score: number;
  similarity: number;
  biases: string[];
  content: string;
  outcome?: {
    result: string;
    impactScore: number | null;
    lessonsLearned: string | null;
  };
}

export interface CrossDocContext {
  sections: SectionMatch[];
  documents: DocMatch[];
  documentCount: number;
  sectionCount: number;
}

/**
 * Assemble cross-document context for a given document.
 * Searches both section-level and whole-document embeddings,
 * deduplicates by documentId, and returns structured context.
 */
export async function assembleCrossDocumentContext(
  documentId: string,
  content: string,
  userId: string,
  limit: number = 5
): Promise<CrossDocContext> {
  try {
    // Use first 5k chars as query (balances quality vs token cost)
    const queryText = content.slice(0, 5000);

    // Search both section and document level in parallel
    const [sectionResults, docResults] = await Promise.all([
      searchSimilarSections(queryText, userId, limit * 2, documentId),
      searchSimilarWithOutcomes(queryText, userId, limit).then(results =>
        results
          .filter(r => r.documentId !== documentId)
          .map(r => ({
            documentId: r.documentId,
            filename: r.filename,
            score: r.score,
            similarity: r.similarity,
            biases: r.biases,
            content: r.content,
            outcome: r.outcome
              ? {
                  result: r.outcome.result,
                  impactScore: r.outcome.impactScore,
                  lessonsLearned: r.outcome.lessonsLearned,
                }
              : undefined,
          }))
      ),
    ]);

    // Deduplicate sections by documentId+content prefix to avoid redundancy
    const seenSections = new Set<string>();
    const uniqueSections = sectionResults.filter(s => {
      const key = `${s.documentId}:${s.content.slice(0, 100)}`;
      if (seenSections.has(key)) return false;
      seenSections.add(key);
      return true;
    });

    // Take top results by similarity
    const topSections = uniqueSections.slice(0, limit);
    const topDocs = docResults.slice(0, limit);

    log.info(
      `Cross-doc context: ${topSections.length} sections, ${topDocs.length} documents for doc ${documentId}`
    );

    return {
      sections: topSections,
      documents: topDocs,
      documentCount: topDocs.length,
      sectionCount: topSections.length,
    };
  } catch (error) {
    log.warn('Cross-doc context assembly failed (non-fatal):', error);
    return { sections: [], documents: [], documentCount: 0, sectionCount: 0 };
  }
}

/**
 * Format cross-document context into a string suitable for LLM prompt injection.
 * Truncates to ~3000 chars to avoid overwhelming the context window.
 */
export function formatCrossDocContextForPrompt(ctx: CrossDocContext): string {
  if (ctx.documentCount === 0 && ctx.sectionCount === 0) {
    return '';
  }

  const parts: string[] = [];
  let totalChars = 0;

  // Document-level context (higher signal)
  if (ctx.documents.length > 0) {
    parts.push('RELATED DOCUMENTS FROM YOUR PORTFOLIO:');
    for (const doc of ctx.documents) {
      const outcomeStr = doc.outcome
        ? ` | Outcome: ${doc.outcome.result}${doc.outcome.lessonsLearned ? ` — ${doc.outcome.lessonsLearned.slice(0, 150)}` : ''}`
        : '';
      const biasStr = doc.biases.length > 0 ? ` | Biases: ${doc.biases.join(', ')}` : '';
      const line = `- "${doc.filename}" (score: ${doc.score}, similarity: ${(doc.similarity * 100).toFixed(0)}%)${biasStr}${outcomeStr}`;
      if (totalChars + line.length > MAX_PROMPT_CHARS) break;
      parts.push(line);
      totalChars += line.length;
    }
  }

  // Section-level context (finer-grained)
  if (ctx.sections.length > 0 && totalChars < MAX_PROMPT_CHARS - 200) {
    parts.push('\nRELATED SECTIONS FROM OTHER DOCUMENTS:');
    for (const section of ctx.sections) {
      const excerpt = section.content.slice(0, 300).replace(/\n/g, ' ');
      const line = `- [${section.sectionTitle}] (similarity: ${(section.similarity * 100).toFixed(0)}%): ${excerpt}`;
      if (totalChars + line.length > MAX_PROMPT_CHARS) break;
      parts.push(line);
      totalChars += line.length;
    }
  }

  return parts.join('\n');
}
