import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@clerk/nextjs/server';
import { parseFile } from '@/lib/utils/file-parser';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { createHash } from 'crypto';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('UploadRoute');

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   "anonymous";
        
        const rateLimitResult = await checkRateLimit(ip, '/api/upload');
        
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { 
                    error: "Rate limit exceeded. You can analyze up to 5 documents per hour.",
                    limit: rateLimitResult.limit,
                    reset: rateLimitResult.reset,
                    remaining: 0
                }, 
                { status: 429 }
            );
        }

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

        // Generate SHA-256 hash for semantic caching
        const contentHash = createHash('sha256').update(buffer).digest('hex');

        // Check if document already exists (Semantic Caching)
        const existingDoc = await prisma.document.findUnique({
            where: { contentHash },
            include: { 
                analyses: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        biases: true
                    }
                }
            }
        });

        if (existingDoc) {
            log.info('Cache hit: Document already analyzed ' + existingDoc.id);
            
            // Return cached result with the existing document ID and analysis
            return NextResponse.json({
                id: existingDoc.id,
                filename: existingDoc.filename,
                status: existingDoc.status,
                cached: true,
                message: 'Document already analyzed (Cached)',
                analysis: existingDoc.analyses[0] || null
            });
        }

        // Extract text content
        let content = '';

        try {
            content = await parseFile(buffer, file.type, file.name);
        } catch (error) {
            log.error('File Parse Error:', error);
            return NextResponse.json({
                error: getSafeErrorMessage(error)
            }, { status: 400 });
        }

        if (!content.trim()) {
            return NextResponse.json({ error: 'Document appears to be empty' }, { status: 400 });
        }

        // Initialize Supabase Admin (Bypass RLS for upload)
        const { getServiceSupabase } = await import('@/lib/supabase');
        const supabase = getServiceSupabase();

        const fileId = uuidv4();
        const ext = path.extname(file.name);
        // Sanitize filename for storage path
        const safeFilename = fileId + ext;
        const storagePath = `${userId}/${safeFilename}`;



        // Upload to Supabase
        const { error: uploadError } = await supabase.storage
            .from(process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf')
            .upload(storagePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            log.error('Supabase Storage Upload Error:', uploadError);
            throw new Error(`Storage Upload Failed: ${uploadError.message}`);
        }
        // Store in database with content hash for future caching
        const document = await prisma.document.create({
            data: {
                userId,
                filename: file.name,
                fileType: file.type || 'text/plain',
                fileSize: file.size,
                content,
                contentHash, // Save hash for semantic caching
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
        // Log the raw code + message internally so Vercel logs show the real
        // cause (e.g. P2022 schema drift) while the client only receives the
        // sanitised message.
        const rawCode = (error as { code?: string }).code ?? 'none';
        const rawMsg  = error instanceof Error ? error.message : String(error);
        log.error(`Upload error [code=${rawCode}]: ${rawMsg}`);
        return NextResponse.json(
            { error: getSafeErrorMessage(error) },
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
        log.error('Error fetching documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
