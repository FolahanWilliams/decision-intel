import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DocumentsRoute');

// Select objects for detailed vs core-only analysis fields.
// Separated so the schema-drift fallback can retry with core fields only.
const ANALYSIS_SELECT_DETAILED = {
    overallScore: true,
    noiseScore: true,
    biases: {
        select: { severity: true, biasType: true }
    },
    factCheck: true
} as const;

const ANALYSIS_SELECT_CORE = {
    overallScore: true,
} as const;

// GET /api/documents - List all documents for the current user
export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const detailed = searchParams.get('detailed') === 'true';
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 10));
        const skip = (page - 1) * limit;

        const where = { userId };
        let schemaDrift = false;

        // Build the select — detailed mode requests extended analysis fields.
        const buildSelect = (useExtended: boolean) => ({
            id: true,
            filename: true,
            status: true,
            fileSize: true,
            uploadedAt: true,
            analyses: {
                orderBy: { createdAt: 'desc' } as const,
                take: 1,
                select: (detailed && useExtended) ? ANALYSIS_SELECT_DETAILED : ANALYSIS_SELECT_CORE
            }
        });

        // Try with extended fields first; fall back to core-only if the DB
        // is missing newer columns (schema drift / P2021 / P2022).
        let documents;
        let total: number;
        try {
            [documents, total] = await Promise.all([
                prisma.document.findMany({
                    where,
                    orderBy: { uploadedAt: 'desc' },
                    skip,
                    take: limit,
                    select: buildSelect(true)
                }),
                prisma.document.count({ where })
            ]);
        } catch (fetchErr: unknown) {
            const code = (fetchErr as { code?: string }).code;
            if (code === 'P2021' || code === 'P2022') {
                log.warn('Schema drift in document list: falling back to core analysis fields (' + code + ')');
                schemaDrift = true;
                [documents, total] = await Promise.all([
                    prisma.document.findMany({
                        where,
                        orderBy: { uploadedAt: 'desc' },
                        skip,
                        take: limit,
                        select: buildSelect(false)
                    }),
                    prisma.document.count({ where })
                ]);
            } else {
                throw fetchErr;
            }
        }

        // Transform to include score from latest analysis
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- shape varies with schema drift
        const transformedDocs = documents.map((doc: any) => {
            const latestAnalysis = doc.analyses[0];
            return {
                id: doc.id,
                filename: doc.filename,
                status: doc.status,
                fileSize: doc.fileSize,
                uploadedAt: doc.uploadedAt,
                score: latestAnalysis?.overallScore ?? undefined,
                // Include details if requested and available
                ...(detailed && latestAnalysis && !schemaDrift && {
                    analyses: [{
                        overallScore: latestAnalysis.overallScore,
                        noiseScore: latestAnalysis.noiseScore,
                        biases: latestAnalysis.biases,
                        factCheck: latestAnalysis.factCheck
                    }]
                })
            };
        });

        return NextResponse.json({
            documents: transformedDocs,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        log.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
