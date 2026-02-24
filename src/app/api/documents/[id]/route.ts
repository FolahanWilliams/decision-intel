import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DocumentRoute');

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try with all analysis fields first; fall back to core-only if
        // extended columns don't exist yet (schema drift / P2022).
        let document;
        try {
            document = await prisma.document.findFirst({
                where: { id, userId },
                select: {
                    id: true,
                    filename: true,
                    fileType: true,
                    fileSize: true,
                    content: true,
                    uploadedAt: true,
                    status: true,
                    analyses: {
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            overallScore: true,
                            noiseScore: true,
                            summary: true,
                            createdAt: true,
                            biases: true,
                            noiseStats: true,
                            noiseBenchmarks: true,
                            factCheck: true,
                            compliance: true,
                            preMortem: true,
                            sentiment: true,
                            logicalAnalysis: true,
                            swotAnalysis: true,
                            cognitiveAnalysis: true,
                            simulation: true,
                            institutionalMemory: true,
                            speakers: true
                        }
                    }
                }
            });
        } catch (fetchErr: unknown) {
            const code = (fetchErr as { code?: string }).code;
            if (code === 'P2021' || code === 'P2022') {
                log.warn('Schema drift: falling back to core analysis fields (' + code + ')');
                document = await prisma.document.findFirst({
                    where: { id, userId },
                    select: {
                        id: true,
                        filename: true,
                        fileType: true,
                        fileSize: true,
                        content: true,
                        uploadedAt: true,
                        status: true,
                        analyses: {
                            orderBy: { createdAt: 'desc' },
                            select: {
                                id: true,
                                overallScore: true,
                                noiseScore: true,
                                summary: true,
                                createdAt: true,
                                biases: true
                            }
                        }
                    }
                });
            } else {
                throw fetchErr;
            }
        }

        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(document);
    } catch (error) {
        log.error('Error fetching document:', error);
        return NextResponse.json(
            { error: 'Failed to fetch document' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.document.deleteMany({
            where: { id, userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        log.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
