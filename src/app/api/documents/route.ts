import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/documents - List all documents for the current user
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const documents = await prisma.document.findMany({
            where: { userId },
            orderBy: { uploadedAt: 'desc' },
            select: {
                id: true,
                filename: true,
                status: true,
                fileSize: true,
                uploadedAt: true,
                analyses: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        overallScore: true
                    }
                }
            }
        });

        // Transform to include score from latest analysis
        const transformedDocs = documents.map(doc => ({
            id: doc.id,
            filename: doc.filename,
            status: doc.status,
            fileSize: doc.fileSize,
            uploadedAt: doc.uploadedAt,
            score: doc.analyses[0]?.overallScore ?? undefined
        }));

        return NextResponse.json(transformedDocs);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
