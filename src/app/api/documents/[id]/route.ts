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
                        // Explicitly exclude 'simulation' and other new fields to prevent P2022
                        noiseStats: true,
                        // These JSON fields are safe if they exist in schema but are null in DB, 
                        // but if the column itself is missing from DB, we must excluding them too?
                        // The user error log says `Analysis.simulation` does not exist.
                        // Safe bet: select only what we KNOW exists in the DB or handled by Prisma if valid.
                        // Actually, `biases` is a relation, so it's fine.
                        // Let's stick to the core fields that the UI uses.
                        factCheck: true, // Only if this column exists. 
                        // It seems `factCheck` might ALSO be missing if migration didn't run?
                        // The error was specifically about `simulation`.
                        // Let's be conservative.
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
