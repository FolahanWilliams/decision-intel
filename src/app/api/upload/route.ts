import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import { createClient } from '@/utils/supabase/server';
import { parseFile } from '@/lib/utils/file-parser';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { createHash } from 'crypto';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('UploadRoute');

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit by authenticated user (not IP)
    const rateLimitResult = await checkRateLimit(userId, '/api/upload');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can upload up to 5 documents per hour.',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
          remaining: 0,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.reset - Math.floor(Date.now() / 1000)) },
        }
      );
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
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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
    // Wrapped in schema-drift protection: if contentHash column doesn't
    // exist yet (migration pending) we skip the cache check gracefully.
    let existingDoc:
      | (Awaited<ReturnType<typeof prisma.document.findFirst>> & { analyses?: unknown[] })
      | null = null;
    try {
      existingDoc = await prisma.document.findFirst({
        where: { contentHash, userId },
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              biases: true,
            },
          },
        },
      });
    } catch (cacheErr: unknown) {
      const code = (cacheErr as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift: contentHash column missing, skipping cache check (' + code + ')');
      } else {
        throw cacheErr;
      }
    }

    if (existingDoc) {
      log.info('Cache hit: Document already analyzed ' + existingDoc.id);

      // Return cached result with the existing document ID and analysis
      return NextResponse.json({
        id: existingDoc.id,
        filename: (existingDoc as { filename: string }).filename,
        status: (existingDoc as { status: string }).status,
        cached: true,
        message: 'Document already analyzed (Cached)',
        analysis: (existingDoc.analyses as unknown[])?.[0] || null,
      });
    }

    // Extract text content
    let content = '';

    try {
      content = await parseFile(buffer, file.type, file.name);
    } catch (error) {
      log.error('File Parse Error:', error);
      return NextResponse.json(
        {
          error: getSafeErrorMessage(error),
        },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'Document appears to be empty' }, { status: 400 });
    }

    // Store in database with content hash for future caching.
    // Created BEFORE the storage upload so we can use the document's
    // cuid as the storage filename, making the path deterministic for
    // later deletion: ${userId}/${document.id}${ext}
    // Falls back to plain create if contentHash column is missing (schema drift).
    let document;
    try {
      document = await prisma.document.create({
        data: {
          userId,
          filename: file.name,
          fileType: file.type || 'text/plain',
          fileSize: file.size,
          content,
          contentHash,
          status: 'pending',
        },
      });
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string }).code;
      if (code === 'P2021' || code === 'P2022') {
        log.warn('Schema drift: contentHash column missing, falling back to create (' + code + ')');
        document = await prisma.document.create({
          data: {
            userId,
            filename: file.name,
            fileType: file.type || 'text/plain',
            fileSize: file.size,
            content,
            status: 'pending',
          },
        });
      } else if (code === 'P2002') {
        // Unique constraint violation on contentHash — another user
        // already has this hash. Safe to ignore: create without hash.
        document = await prisma.document.create({
          data: {
            userId,
            filename: file.name,
            fileType: file.type || 'text/plain',
            fileSize: file.size,
            content,
            status: 'pending',
          },
        });
      } else {
        throw dbError;
      }
    }

    // Upload to Supabase storage using document.id as the filename
    // so we can reconstruct the path on delete without extra DB columns.
    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();

    const ext = path.extname(file.name);
    const storagePath = `${userId}/${document.id}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_DOCUMENT_BUCKET || 'pdf')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Clean up the DB record since the storage upload failed
      log.error('Supabase Storage Upload Error:', uploadError);
      await prisma.document
        .delete({ where: { id: document.id } })
        .catch((e: unknown) => log.error('Failed to clean up DB after storage error:', e));
      throw new Error(`Storage Upload Failed: ${uploadError.message}`);
    }

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      status: document.status,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    // Log the raw code + message internally so Vercel logs show the real
    // cause (e.g. P2022 schema drift) while the client only receives the
    // sanitised message.
    const rawCode = (error as { code?: string }).code ?? 'none';
    const rawMsg = error instanceof Error ? error.message : String(error);
    log.error(`Upload error [code=${rawCode}]: ${rawMsg}`);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where = { userId };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
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
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    log.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
