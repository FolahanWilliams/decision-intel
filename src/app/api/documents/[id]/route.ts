import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

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

        const document = await prisma.document.findFirst({
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

        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
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
        console.error('Error deleting document:', error);
        return NextResponse.json(
            { error: 'Failed to delete document' },
            { status: 500 }
        );
    }
}
