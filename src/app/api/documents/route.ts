import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/documents - List all documents for the current user
export async function GET(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const detailed = searchParams.get('detailed') === 'true';

        // Select fields based on detail level
        const select = {
            id: true,
            filename: true,
            status: true,
            fileSize: true,
            uploadedAt: true,
            analyses: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                    overallScore: true,
                    // If detailed, fetch more data for risk analysis
                    ...(detailed && {
                        noiseScore: true,
                        biases: {
                            select: { severity: true, biasType: true }
                        },
                        factCheck: true
                    })
                }
            }
        } as const;

        const documents = await prisma.document.findMany({
            where: { userId },
            orderBy: { uploadedAt: 'desc' },
            select
        });

        // Transform to include score from latest analysis
        const transformedDocs = documents.map(doc => {
            const latestAnalysis = doc.analyses[0];
            return {
                id: doc.id,
                filename: doc.filename,
                status: doc.status,
                fileSize: doc.fileSize,
                uploadedAt: doc.uploadedAt,
                score: latestAnalysis?.overallScore ?? undefined,
                // Include details if requested
                ...(detailed && latestAnalysis && {
                    analyses: [{
                        overallScore: latestAnalysis.overallScore,
                        noiseScore: latestAnalysis.noiseScore,
                        biases: latestAnalysis.biases,
                        factCheck: latestAnalysis.factCheck
                    }]
                })
            };
        });

        return NextResponse.json(transformedDocs);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
