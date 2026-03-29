/**
 * Section-Level Embeddings for Cross-Document RAG
 *
 * Splits document content into logical sections (~500-1000 chars),
 * generates embeddings for each section, and stores them in the
 * DecisionEmbedding table with type='section' metadata.
 *
 * Enables finer-grained semantic search across a user's document corpus.
 */

import { prisma } from '@/lib/prisma';
import { generateEmbeddings } from './embeddings';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('SectionEmbeddings');

export interface Section {
  title: string;
  content: string;
  index: number;
}

export interface SectionSearchResult {
  documentId: string;
  filename: string;
  sectionTitle: string;
  content: string;
  similarity: number;
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

const MIN_SECTION_LENGTH = 200;
const MAX_SECTION_LENGTH = 1200;
const TARGET_SECTION_LENGTH = 800;

/**
 * Heading patterns commonly found in investment memos, CIMs, term sheets, etc.
 */
const HEADING_PATTERNS = [
  /^#{1,4}\s+.+/m, // Markdown headings
  /^[A-Z][A-Z\s]{3,}$/m, // ALL CAPS lines (common in PDFs)
  /^\d+\.\s+[A-Z]/, // Numbered sections: "1. Overview"
  /^(?:Section|Part|Chapter)\s+\d/im, // Explicit section markers
  /^(?:Executive Summary|Overview|Background|Key Findings|Risk Factors|Financial Analysis|Conclusion|Recommendation|Terms and Conditions|Due Diligence)/im,
];

/**
 * Split document content into logical sections for embedding.
 * Uses heading detection, paragraph breaks, and fallback fixed-length chunks.
 */
export function chunkIntoSections(content: string, filename: string): Section[] {
  if (!content || content.length < MIN_SECTION_LENGTH) {
    return content
      ? [{ title: `${filename} — Full Document`, content: content.trim(), index: 0 }]
      : [];
  }

  // Try heading-based splitting first
  const headingSections = splitByHeadings(content, filename);
  if (headingSections.length >= 2) {
    return normalizeSections(headingSections);
  }

  // Fallback: split by double newlines (paragraph breaks)
  const paragraphSections = splitByParagraphs(content, filename);
  if (paragraphSections.length >= 2) {
    return normalizeSections(paragraphSections);
  }

  // Last resort: fixed-length chunks
  return normalizeSections(splitByLength(content, filename));
}

function splitByHeadings(content: string, filename: string): Section[] {
  // Find heading positions
  const lines = content.split('\n');
  const headingIndices: { lineIdx: number; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length < 3 || line.length > 120) continue;
    if (HEADING_PATTERNS.some(p => p.test(line))) {
      headingIndices.push({ lineIdx: i, title: line.replace(/^#+\s*/, '').trim() });
    }
  }

  if (headingIndices.length < 2) return [];

  const sections: Section[] = [];
  for (let i = 0; i < headingIndices.length; i++) {
    const start = headingIndices[i].lineIdx;
    const end = i < headingIndices.length - 1 ? headingIndices[i + 1].lineIdx : lines.length;
    const sectionContent = lines
      .slice(start + 1, end)
      .join('\n')
      .trim();
    if (sectionContent.length >= MIN_SECTION_LENGTH / 2) {
      sections.push({
        title: `${filename} — ${headingIndices[i].title}`,
        content: sectionContent,
        index: sections.length,
      });
    }
  }

  // Capture preamble before first heading
  if (headingIndices[0].lineIdx > 0) {
    const preamble = lines.slice(0, headingIndices[0].lineIdx).join('\n').trim();
    if (preamble.length >= MIN_SECTION_LENGTH / 2) {
      sections.unshift({
        title: `${filename} — Introduction`,
        content: preamble,
        index: 0,
      });
      // Re-index
      sections.forEach((s, i) => (s.index = i));
    }
  }

  return sections;
}

function splitByParagraphs(content: string, filename: string): Section[] {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sections: Section[] = [];
  let buffer = '';
  let sectionIdx = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (
      buffer.length + trimmed.length > MAX_SECTION_LENGTH &&
      buffer.length >= MIN_SECTION_LENGTH
    ) {
      sections.push({
        title: `${filename} — Section ${sectionIdx + 1}`,
        content: buffer.trim(),
        index: sectionIdx++,
      });
      buffer = trimmed;
    } else {
      buffer += (buffer ? '\n\n' : '') + trimmed;
    }
  }

  if (buffer.trim().length > 0) {
    sections.push({
      title: `${filename} — Section ${sectionIdx + 1}`,
      content: buffer.trim(),
      index: sectionIdx,
    });
  }

  return sections;
}

function splitByLength(content: string, filename: string): Section[] {
  const sections: Section[] = [];
  let offset = 0;
  let idx = 0;

  while (offset < content.length) {
    let end = Math.min(offset + TARGET_SECTION_LENGTH, content.length);
    // Try to break at a sentence boundary
    if (end < content.length) {
      const searchWindow = content.slice(end - 100, end + 100);
      const sentenceBreak = searchWindow.search(/[.!?]\s/);
      if (sentenceBreak !== -1) {
        end = end - 100 + sentenceBreak + 2;
      }
    }

    const chunk = content.slice(offset, end).trim();
    if (chunk.length >= MIN_SECTION_LENGTH / 2) {
      sections.push({
        title: `${filename} — Part ${idx + 1}`,
        content: chunk,
        index: idx++,
      });
    }
    offset = end;
  }

  return sections;
}

/**
 * Merge sections that are too short and split sections that are too long.
 */
function normalizeSections(sections: Section[]): Section[] {
  const result: Section[] = [];

  for (const section of sections) {
    if (section.content.length > MAX_SECTION_LENGTH * 2) {
      // Split oversized sections
      const subSections = splitByLength(section.content, section.title.split(' — ')[0]);
      for (const sub of subSections) {
        sub.title = `${section.title} (${sub.index + 1})`;
        sub.index = result.length;
        result.push(sub);
      }
    } else if (
      section.content.length < MIN_SECTION_LENGTH &&
      result.length > 0 &&
      result[result.length - 1].content.length < MAX_SECTION_LENGTH
    ) {
      // Merge small section into previous
      result[result.length - 1].content += '\n\n' + section.content;
    } else {
      section.index = result.length;
      result.push(section);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/**
 * Generate and store section-level embeddings for a document.
 * Non-critical — failures are logged but don't throw.
 */
export async function storeSectionEmbeddings(
  documentId: string,
  sections: Section[]
): Promise<number> {
  if (sections.length === 0) return 0;

  try {
    const texts = sections.map(s => `${s.title}\n\n${s.content}`);
    const embeddings = await generateEmbeddings(texts);

    const successful = sections
      .map((section, i) => ({ section, embedding: embeddings[i] }))
      .filter(
        ({ embedding }) =>
          embedding != null && embedding.length === 1536 && !embedding.every(v => v === 0)
      );

    if (successful.length === 0) {
      log.warn('All section embedding generations failed');
      return 0;
    }

    const inserts = successful.map(({ section, embedding }) => {
      const embeddingString = `[${embedding.join(',')}]`;
      const metadata = JSON.stringify({
        type: 'section',
        sectionIndex: section.index,
        sectionTitle: section.title,
        documentId,
      });

      return prisma.$executeRaw`
        INSERT INTO "DecisionEmbedding" (id, "documentId", content, embedding, metadata)
        VALUES (
          gen_random_uuid()::text,
          ${documentId},
          ${section.content.slice(0, 30000)},
          ${embeddingString}::vector,
          ${metadata}::jsonb
        )
        ON CONFLICT (id) DO NOTHING
      `;
    });

    if (inserts.length === 1) {
      await inserts[0];
    } else {
      await prisma.$transaction(inserts);
    }

    log.info(`Stored ${successful.length} section embedding(s) for document ${documentId}`);
    return successful.length;
  } catch (error) {
    log.error('Failed to store section embeddings:', error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Validate that a string only contains characters safe for SQL interpolation.
 */
function assertSafeId(value: string, fieldName: string): void {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new Error(`Invalid ${fieldName} format`);
  }
}

/**
 * Validate that an embedding vector string only contains floats/brackets/commas.
 */
function assertSafeEmbeddingVector(vec: string): void {
  if (!/^\[[-\d.,eE\s]+\]$/.test(vec)) {
    throw new Error('Invalid embedding vector format');
  }
}

/**
 * Search for similar sections across the user's documents.
 * Filters to type='section' embeddings for finer-grained matching.
 */
export async function searchSimilarSections(
  queryText: string,
  userId: string,
  limit: number = 10,
  excludeDocumentId?: string
): Promise<SectionSearchResult[]> {
  try {
    const { generateEmbedding } = await import('./embeddings');
    const queryEmbedding = await generateEmbedding(queryText);
    const embeddingVector = `[${queryEmbedding.join(',')}]`;

    assertSafeEmbeddingVector(embeddingVector);
    assertSafeId(userId, 'userId');
    const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));

    let results: Array<{
      document_id: string;
      content: string;
      metadata: unknown;
      similarity: number;
    }>;

    if (excludeDocumentId) {
      assertSafeId(excludeDocumentId, 'excludeDocumentId');
      results = await prisma.$queryRawUnsafe<typeof results>(
        `SELECT
          de."documentId" as document_id,
          de.content,
          de.metadata,
          1 - (de.embedding <=> '${embeddingVector}'::vector) as similarity
        FROM "DecisionEmbedding" de
        JOIN "Document" d ON d.id = de."documentId"
        WHERE d."userId" = $1
          AND de."documentId" != $2
          AND de.metadata->>'type' = 'section'
        ORDER BY de.embedding <=> '${embeddingVector}'::vector
        LIMIT ${safeLimit}`,
        userId,
        excludeDocumentId
      );
    } else {
      results = await prisma.$queryRawUnsafe<typeof results>(
        `SELECT
          de."documentId" as document_id,
          de.content,
          de.metadata,
          1 - (de.embedding <=> '${embeddingVector}'::vector) as similarity
        FROM "DecisionEmbedding" de
        JOIN "Document" d ON d.id = de."documentId"
        WHERE d."userId" = $1
          AND de.metadata->>'type' = 'section'
        ORDER BY de.embedding <=> '${embeddingVector}'::vector
        LIMIT ${safeLimit}`,
        userId
      );
    }

    return results.map(r => {
      const meta = r.metadata as { sectionTitle?: string; documentId?: string } | null;
      return {
        documentId: r.document_id,
        filename: meta?.sectionTitle?.split(' — ')[0] || 'Unknown',
        sectionTitle: meta?.sectionTitle || 'Unknown Section',
        content: r.content,
        similarity: Math.round(r.similarity * 100) / 100,
      };
    });
  } catch (error) {
    log.error('Section search failed:', error);
    return [];
  }
}
