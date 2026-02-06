/**
 * RAG Embeddings Module
 * 
 * Generates embeddings for document analyses and performs semantic search
 * using Gemini's embedding model and PostgreSQL pgvector.
 */

import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini - use same env var as nodes.ts for consistency
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Embedding model - uses text-embedding-004 which outputs 768 dimensions
// We pad to 1536 for schema compatibility (pgvector setup)
const EMBEDDING_MODEL = 'text-embedding-004';

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
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

        // Truncate text to avoid token limits (roughly 8k tokens ~ 32k chars)
        const truncatedText = text.slice(0, 30000);

        const result = await model.embedContent(truncatedText);
        const embedding = result.embedding.values;

        // Pad to 1536 dimensions if needed (for schema compatibility)
        // This is a simple zero-padding approach
        while (embedding.length < 1536) {
            embedding.push(0);
        }

        return embedding.slice(0, 1536);
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        throw error;
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
 * Store an embedding for a document analysis
 */
export async function storeAnalysisEmbedding(
    documentId: string,
    filename: string,
    summary: string,
    biases: Array<{ biasType: string; severity: string; explanation: string }>,
    score: number,
    analysisId?: string
): Promise<void> {
    try {
        const text = createAnalysisEmbeddingText(filename, summary, biases, score);
        const embedding = await generateEmbedding(text);

        const metadata: EmbeddingMetadata = {
            documentId,
            analysisId,
            filename,
            overallScore: score,
            biasCount: biases.length,
            primaryBiases: biases.slice(0, 3).map(b => b.biasType),
            createdAt: new Date().toISOString()
        };

        // Use raw SQL for vector insertion since Prisma doesn't natively support vectors
        await prisma.$executeRaw`
            INSERT INTO "DecisionEmbedding" (id, "documentId", content, embedding, metadata)
            VALUES (
                gen_random_uuid()::text,
                ${documentId},
                ${text},
                ${`[${embedding.join(',')}]`}::vector,
                ${JSON.stringify(metadata)}::jsonb
            )
        `;

        console.log(`Stored embedding for document ${documentId}`);
    } catch (error) {
        console.error('Failed to store embedding:', error);
        // Don't throw - embedding storage is non-critical
    }
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
