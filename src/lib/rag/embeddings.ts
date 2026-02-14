/**
 * RAG Embeddings Module
 * 
 * Generates embeddings for document analyses and performs semantic search
 * using Gemini's embedding model and PostgreSQL pgvector.
 */

import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { getRequiredEnvVar } from '@/lib/env';

// Lazy initialization of Gemini client
let genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

// Embedding model - using gemini-embedding-001 which supports dimensionality reduction
const EMBEDDING_MODEL = 'models/gemini-embedding-001';

interface EmbeddingMetadata {
    documentId: string;
    analysisId?: string;
    filename?: string;
    overallScore?: number;
    biasCount?: number;
    primaryBiases?: string[];
    createdAt: string;
}

/**
 * Generate an embedding vector for text content using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const model = getGenAI().getGenerativeModel({ model: EMBEDDING_MODEL });

        // Truncate text to avoid token limits (roughly 8k tokens ~ 32k chars)
        const truncatedText = text.slice(0, 30000);

        const result = await model.embedContent({
            content: { role: 'user', parts: [{ text: truncatedText }] },
            taskType: TaskType.RETRIEVAL_DOCUMENT,
            outputDimensionality: 1536
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- outputDimensionality not yet in SDK types
        } as any);
        const embedding = result.embedding.values;

        // Validate embedding
        if (!embedding || !Array.isArray(embedding) || embedding.length !== 1536) {
            throw new Error(`Invalid embedding generated: expected 1536 dimensions, got ${embedding?.length}`);
        }

        return embedding;
    } catch (error) {
        console.error('❌ Embedding generation failed:', error);
        // CRITICAL: Do not return zero vectors silently - this causes incorrect similarity search results
        // Instead, throw the error to let the caller handle it appropriately
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Create a rich text representation of an analysis for embedding
 */
function createAnalysisEmbeddingText(
    filename: string,
    summary: string,
    biases: Array<{ biasType: string; severity: string; explanation: string }>,
    score: number
): string {
    const biasText = biases.map(b =>
        `${b.biasType} (${b.severity}): ${b.explanation}`
    ).join('\n');

    return `
Document: ${filename}
Decision Quality Score: ${score}/100
Summary: ${summary}
Detected Cognitive Biases:
${biasText || 'No biases detected'}
    `.trim();
}

/**
 * Input type for batch embedding storage
 */
export interface EmbeddingInput {
    documentId: string;
    filename: string;
    summary: string;
    biases: Array<{ biasType: string; severity: string; explanation: string }>;
    score: number;
    analysisId?: string;
}

/**
 * Store embeddings for multiple document analyses in a single batch INSERT.
 * Generates embeddings in parallel (fault-tolerant) and inserts all successful
 * results in one multi-row SQL statement.
 * 
 * @returns Number of embeddings successfully stored
 */
export async function storeAnalysisEmbeddingsBatch(
    items: EmbeddingInput[]
): Promise<number> {
    if (items.length === 0) return 0;

    try {
        // Generate all embeddings in parallel (fault-tolerant)
        const embeddingResults = await Promise.allSettled(
            items.map(async (item) => {
                const text = createAnalysisEmbeddingText(
                    item.filename, item.summary, item.biases, item.score
                );
                const embedding = await generateEmbedding(text);

                const metadata: EmbeddingMetadata = {
                    documentId: item.documentId,
                    analysisId: item.analysisId,
                    filename: item.filename,
                    overallScore: item.score,
                    biasCount: item.biases.length,
                    primaryBiases: item.biases.slice(0, 3).map(b => b.biasType),
                    createdAt: new Date().toISOString()
                };

                return { text, embedding, metadata, documentId: item.documentId };
            })
        );

        // Filter to successful results only
        const successful = embeddingResults
            .filter((r): r is PromiseFulfilledResult<{ text: string; embedding: number[]; metadata: EmbeddingMetadata; documentId: string }> =>
                r.status === 'fulfilled'
            )
            .map(r => r.value);

        const failed = embeddingResults.filter(r => r.status === 'rejected').length;
        if (failed > 0) {
            console.warn(`⚠️ ${failed}/${items.length} embedding generations failed`);
        }

        if (successful.length === 0) {
            console.warn('All embedding generations failed, skipping storage');
            return 0;
        }

        // Build multi-row INSERT with parameterized values
        // For a single item, use the simple tagged template (fully parameterized)
        if (successful.length === 1) {
            const { text, embedding, metadata, documentId } = successful[0];
            const embeddingString = `[${embedding.join(',')}]`;
            const metadataJson = JSON.stringify(metadata);

            await prisma.$executeRaw`
                INSERT INTO "DecisionEmbedding" (id, "documentId", content, embedding, metadata)
                VALUES (
                    gen_random_uuid()::text,
                    ${documentId},
                    ${text},
                    ${embeddingString}::vector,
                    ${metadataJson}::jsonb
                )
                ON CONFLICT (id) DO NOTHING
            `;
        } else {
            // For multiple items, build a batch insert
            // Each value set is individually parameterized via tagged template literals
            // We use $executeRawUnsafe here because Prisma tagged templates don't support dynamic row counts
            const values: string[] = [];
            const params: unknown[] = [];
            let paramIndex = 1;

            for (const { text, embedding, metadata, documentId } of successful) {
                const embeddingString = `[${embedding.join(',')}]`;
                const metadataJson = JSON.stringify(metadata);

                values.push(`(gen_random_uuid()::text, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}::vector, $${paramIndex + 3}::jsonb)`);
                params.push(documentId, text, embeddingString, metadataJson);
                paramIndex += 4;
            }

            const sql = `
                INSERT INTO "DecisionEmbedding" (id, "documentId", content, embedding, metadata)
                VALUES ${values.join(', ')}
                ON CONFLICT (id) DO NOTHING
            `;

            await prisma.$executeRawUnsafe(sql, ...params);
        }

        console.log(`✅ Stored ${successful.length} embedding(s) in batch`);
        return successful.length;
    } catch (error) {
        console.error('Failed to store embeddings batch:', error);
        // Don't throw - embedding storage is non-critical
        return 0;
    }
}

/**
 * Store an embedding for a single document analysis.
 * Thin wrapper around storeAnalysisEmbeddingsBatch for backward compatibility.
 */
export async function storeAnalysisEmbedding(
    documentId: string,
    filename: string,
    summary: string,
    biases: Array<{ biasType: string; severity: string; explanation: string }>,
    score: number,
    analysisId?: string
): Promise<void> {
    await storeAnalysisEmbeddingsBatch([{
        documentId, filename, summary, biases, score, analysisId
    }]);
}

/**
 * Search for similar documents using cosine similarity
 */
export async function searchSimilarDocuments(
    queryText: string,
    userId: string,
    limit: number = 5,
    excludeDocumentId?: string
): Promise<Array<{
    documentId: string;
    filename: string;
    score: number;
    similarity: number;
    biases: string[];
}>> {
    try {
        const queryEmbedding = await generateEmbedding(queryText);
        const embeddingVector = `[${queryEmbedding.join(',')}]`;

        // Use separate queries for with/without exclusion to avoid SQL injection
        // and ensure proper parameterization
        let results: Array<{
            document_id: string;
            content: string;
            metadata: unknown;
            similarity: number;
        }>;

        if (excludeDocumentId) {
            results = await prisma.$queryRaw<typeof results>`
                SELECT 
                    de."documentId" as document_id,
                    de.content,
                    de.metadata,
                    1 - (de.embedding <=> ${embeddingVector}::vector) as similarity
                FROM "DecisionEmbedding" de
                JOIN "Document" d ON d.id = de."documentId"
                WHERE d."userId" = ${userId}
                AND de."documentId" != ${excludeDocumentId}
                ORDER BY de.embedding <=> ${embeddingVector}::vector
                LIMIT ${limit}
            `;
        } else {
            results = await prisma.$queryRaw<typeof results>`
                SELECT 
                    de."documentId" as document_id,
                    de.content,
                    de.metadata,
                    1 - (de.embedding <=> ${embeddingVector}::vector) as similarity
                FROM "DecisionEmbedding" de
                JOIN "Document" d ON d.id = de."documentId"
                WHERE d."userId" = ${userId}
                ORDER BY de.embedding <=> ${embeddingVector}::vector
                LIMIT ${limit}
            `;
        }

        return results.map(r => {
            const meta = r.metadata as EmbeddingMetadata;
            return {
                documentId: r.document_id,
                filename: meta?.filename || 'Unknown',
                score: meta?.overallScore || 0,
                similarity: Math.round(r.similarity * 100) / 100,
                biases: meta?.primaryBiases || []
            };
        });
    } catch (error) {
        console.error('Semantic search failed:', error);
        return [];
    }
}

/**
 * Get contextual insights by comparing current document to historical patterns
 */
export async function getContextualInsights(
    documentId: string,
    documentContent: string,
    userId: string
): Promise<{
    similarDocuments: Array<{
        documentId: string;
        filename: string;
        score: number;
        similarity: number;
        biases: string[];
    }>;
    patternInsights: string[];
}> {
    // Find similar documents
    const similar = await searchSimilarDocuments(
        documentContent.slice(0, 5000), // Use first 5k chars for query
        userId,
        3,
        documentId
    );

    // Generate pattern insights based on similar documents
    const patternInsights: string[] = [];

    if (similar.length > 0) {
        const avgScore = similar.reduce((sum, d) => sum + d.score, 0) / similar.length;
        patternInsights.push(
            `Based on ${similar.length} similar document(s), the average decision quality score is ${Math.round(avgScore)}/100.`
        );

        // Count bias frequencies
        const biasFreq: Record<string, number> = {};
        similar.forEach(d => {
            d.biases.forEach(b => {
                biasFreq[b] = (biasFreq[b] || 0) + 1;
            });
        });

        const commonBiases = Object.entries(biasFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([bias]) => bias);

        if (commonBiases.length > 0) {
            patternInsights.push(
                `Common biases in similar documents: ${commonBiases.join(', ')}.`
            );
        }
    }

    return {
        similarDocuments: similar,
        patternInsights
    };
}
