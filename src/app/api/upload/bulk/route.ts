/**
 * Bulk Document Upload API
 *
 * POST /api/upload/bulk - Upload multiple documents for analysis
 * GET /api/upload/bulk?batchId=xxx - Check batch upload status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { validateContent } from '@/lib/utils/resilience';
import { createHash } from 'crypto';

const log = createLogger('BulkUpload');

const MAX_FILES_PER_BATCH = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file

// Supported file types
const SUPPORTED_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * GET /api/upload/bulk?batchId=xxx - Check batch upload status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      // Return recent batch uploads for the user
      const batches = await prisma.batchUpload.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return NextResponse.json({ batches });
    }

    // Get specific batch status
    const batch = await prisma.batchUpload.findFirst({
      where: {
        id: batchId,
        userId: user.id,
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get associated documents and their analysis status
    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
        uploadedAt: {
          gte: batch.createdAt,
          lte: new Date(batch.createdAt.getTime() + 60000), // Within 1 minute of batch creation
        },
      },
      select: {
        id: true,
        filename: true,
        status: true,
        analyses: {
          select: {
            id: true,
            overallScore: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      batch,
      documents,
      progress: {
        total: batch.totalFiles,
        completed: batch.completed,
        failed: batch.failed,
        pending: batch.totalFiles - batch.completed - batch.failed,
      },
    });
  } catch (error) {
    log.error('Failed to fetch batch status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/upload/bulk - Upload multiple documents
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting - stricter for bulk uploads
    const rateLimitResult = await checkRateLimit(user.id, '/api/upload/bulk', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 bulk uploads per hour
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can perform up to 5 bulk uploads per hour.',
          limit: rateLimitResult.limit,
          reset: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_BATCH} files per batch` },
        { status: 400 }
      );
    }

    // Get organization ID if user is in a team
    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      select: { orgId: true },
    });

    // Create batch upload record
    const batch = await prisma.batchUpload.create({
      data: {
        userId: user.id,
        orgId: membership?.orgId,
        totalFiles: files.length,
        status: 'processing',
      },
    });

    // Process files asynchronously
    processFilesAsync(files, user.id, batch.id, membership?.orgId || null);

    return NextResponse.json(
      {
        batchId: batch.id,
        totalFiles: files.length,
        message: 'Batch upload started. Check status using the batchId.',
        statusUrl: `/api/upload/bulk?batchId=${batch.id}`,
      },
      { status: 202 } // Accepted for processing
    );
  } catch (error) {
    log.error('Bulk upload failed:', error);
    return NextResponse.json({ error: 'Bulk upload failed' }, { status: 500 });
  }
}

/**
 * Process files asynchronously in the background
 */
async function processFilesAsync(
  files: File[],
  userId: string,
  batchId: string,
  orgId: string | null
): Promise<void> {
  const errors: Array<{ filename: string; error: string }> = [];
  let completed = 0;
  let failed = 0;

  for (const file of files) {
    try {
      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }

      if (!SUPPORTED_TYPES.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Read file content
      const buffer = await file.arrayBuffer();
      let content = '';

      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        content = new TextDecoder().decode(buffer);
      } else if (file.type === 'application/pdf') {
        // PDF parsing would go here - for now, skip
        throw new Error('PDF parsing not yet implemented in bulk upload');
      } else {
        throw new Error(`File type ${file.type} processing not implemented`);
      }

      // Validate content
      const validation = validateContent(content);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid content');
      }

      // Generate content hash for deduplication
      const contentHash = createHash('sha256').update(content).digest('hex');

      // Check for duplicate
      const existing = await prisma.document.findUnique({
        where: { contentHash },
        select: { id: true, filename: true },
      });

      if (existing) {
        log.info(`Skipping duplicate file: ${file.name} (matches ${existing.filename})`);
        completed++;
        continue;
      }

      // Save document
      const doc = await prisma.document.create({
        data: {
          userId,
          orgId,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          content,
          contentHash,
          status: 'pending', // Will be processed by background job
        },
      });

      log.info(`Document saved: ${doc.id} (${file.name})`);
      completed++;

      // Trigger analysis (fire and forget - could use queue instead)
      triggerAnalysis(doc.id, userId).catch((err: unknown) => {
        log.error(`Failed to trigger analysis for ${doc.id}:`, err);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log.error(`Failed to process file ${file.name}:`, errorMessage);
      errors.push({ filename: file.name, error: errorMessage });
      failed++;
    }

    // Update batch status periodically
    if ((completed + failed) % 3 === 0 || completed + failed === files.length) {
      await prisma.batchUpload.update({
        where: { id: batchId },
        data: {
          completed,
          failed,
          status: completed + failed === files.length ? 'completed' : 'processing',
          ...(errors.length > 0 && { errors }),
        },
      });
    }
  }

  // Final update
  await prisma.batchUpload.update({
    where: { id: batchId },
    data: {
      completed,
      failed,
      status: 'completed',
      ...(errors.length > 0 && { errors }),
    },
  });

  log.info(`Batch ${batchId} completed: ${completed} success, ${failed} failed`);
}

/**
 * Trigger analysis for a document (simplified - would use proper queue in production)
 */
async function triggerAnalysis(documentId: string, userId: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'd need proper auth headers here in production
      },
      body: JSON.stringify({ documentId }),
    });

    if (!response.ok) {
      throw new Error(`Analysis trigger failed: ${response.status}`);
    }
  } catch (error) {
    log.error(`Failed to trigger analysis for ${documentId}:`, error);
    // Could save to FailedAnalysis queue here for retry
  }
}