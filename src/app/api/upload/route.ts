import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { parseFile } from '@/lib/utils/file-parser';

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Enforce file size limit (5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        const isTextFile = file.name.endsWith('.txt') || file.name.endsWith('.md');
        if (!allowedTypes.includes(file.type) && !isTextFile) {
            return NextResponse.json(
                { error: 'Invalid file type. Supported: PDF, TXT, MD, DOCX' },
                { status: 400 }
            );
        }

        // Read file content
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Extract text content
        let content = '';

        try {
            content = await parseFile(buffer, file.type, file.name);
        } catch (error) {
            console.error('File Parse Error:', error);
            return NextResponse.json({
                error: 'Failed to parse file',
                details: error instanceof Error ? error.message : String(error)
            }, { status: 400 });
        }

        if (!content.trim()) {
            return NextResponse.json({ error: 'Document appears to be empty' }, { status: 400 });
        }

        // Store in database
        const document = await prisma.document.create({
            data: {
                userId,
                filename: file.name,
                fileType: file.type || 'text/plain',
                fileSize: file.size,
                content,
                status: 'pending'
            }
        });

        return NextResponse.json({
            id: document.id,
            filename: document.filename,
            status: document.status,
            message: 'Document uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload document', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

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
                userId: true,
                filename: true,
                fileType: true,
                fileSize: true,
                status: true,
                uploadedAt: true,
                updatedAt: true,
                analyses: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
