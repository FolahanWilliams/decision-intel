import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@clerk/nextjs/server';
// pdf-parse is imported dynamically below for CommonJS compatibility

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

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'text/markdown',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            return NextResponse.json(
                { error: 'Invalid file type. Supported: PDF, TXT, MD, DOC, DOCX' },
                { status: 400 }
            );
        }

        // Read file content
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Extract text content based on file type
        let content = '';

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const pdfParse = require('pdf-parse');
                const pdfData = await pdfParse(buffer);
                content = pdfData.text;
            } catch (error) {
                console.error('PDF Parse Error:', error);
                return NextResponse.json({
                    error: 'Failed to parse PDF',
                    details: error instanceof Error ? error.message : String(error)
                }, { status: 400 });
            }
        } else {
            // Plain text files
            content = buffer.toString('utf-8');
        }

        if (!content.trim()) {
            return NextResponse.json({ error: 'Document appears to be empty' }, { status: 400 });
        }

        // Save file to disk
        const uploadDir = path.join(process.cwd(), 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const fileId = uuidv4();
        const ext = path.extname(file.name);
        const savedFilename = `${fileId}${ext}`;
        const filePath = path.join(uploadDir, savedFilename);
        await writeFile(filePath, buffer);

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
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload document', details: error.message },
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
            include: {
                analyses: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        return NextResponse.json(documents);
    } catch (error: any) {
        console.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents', details: error.message },
            { status: 500 }
        );
    }
}
