/**
 * RAG Embeddings Module
 * 
 * Generates embeddings for document analyses and performs semantic search
 * using Gemini's embedding model and PostgreSQL pgvector.
 */

import { prisma } from '@/lib/prisma';


// OpenAI Embedding Model (1536 dimensions)
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

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
 * Generate an embedding vector for text content using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ OPENAI_API_KEY not found. Using zero-vector fallback.');
        return new Array(1536).fill(0);
    }

    try {
        // Truncate text to avoid token limits (approx 8k tokens)
        // OpenAI text-embedding-3-small has an 8191 token limit.
        // A safe char limit is around 30k characters.
        const truncatedText = text.slice(0, 30000);

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: OPENAI_EMBEDDING_MODEL,
                input: truncatedText,
                encoding_format: 'float'
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API Error: ${response.status} ${response.statusText} - ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        const embedding = data.data[0].embedding;

        return embedding;
    } catch (error) {
        console.warn('⚠️ Embedding generation failed. Using zero-vector fallback to preserve system stability.', error);
        // Return zero vector of length 1536 to match DB schema
        return new Array(1536).fill(0);
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
