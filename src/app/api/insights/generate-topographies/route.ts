/**
 * POST /api/insights/generate-topographies
 *
 * Generates Bias Web and Pre-Mortem Topography visualizations on demand
 * using the most recent analysis that has the required data.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { getSafeErrorMessage } from '@/lib/utils/error';
import { generateBiasWeb, generatePreMortemTopography } from '@/lib/agents/visualization';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const log = createLogger('GenerateTopographies');

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 3 per hour (image generation is expensive)
    const rateLimitResult = await checkRateLimit(user.id, '/api/insights/generate-topographies', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 3,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can generate topographies up to 3 times per hour.',
          reset: rateLimitResult.reset,
        },
        { status: 429 }
      );
    }

    // Find the user's most recent analysis with bias data
    const docIds = (
      await prisma.document.findMany({
        where: { userId: user.id },
        select: { id: true },
      })
    ).map((d: { id: string }) => d.id);

    if (docIds.length === 0) {
      return NextResponse.json(
        { error: 'No documents found. Upload and analyze a document first.' },
        { status: 404 }
      );
    }

    // Get the most recent analysis with its biases and preMortem data
    const analysis = await prisma.analysis.findFirst({
      where: { documentId: { in: docIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentId: true,
        preMortem: true,
        biases: {
          select: {
            biasType: true,
            severity: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analyses found. Analyze a document first.' },
        { status: 404 }
      );
    }

    if (analysis.biases.length === 0) {
      return NextResponse.json(
        { error: 'No bias data found in the most recent analysis.' },
        { status: 404 }
      );
    }

    log.info(
      `Generating topographies for analysis ${analysis.id} (${analysis.biases.length} biases)`
    );

    // Generate both visualizations in parallel
    const [biasWebImageUrl, preMortemImageUrl] = await Promise.all([
      generateBiasWeb(analysis.biases, 'analysis', analysis.documentId),
      generatePreMortemTopography(
        analysis.preMortem as { failureScenarios?: string[] } | null,
        'analysis',
        analysis.documentId
      ),
    ]);

    if (!biasWebImageUrl && !preMortemImageUrl) {
      return NextResponse.json(
        {
          error:
            'Failed to generate visualizations. Ensure GOOGLE_API_KEY is configured.',
        },
        { status: 502 }
      );
    }

    // Persist the image URLs on the analysis record
    try {
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          ...(biasWebImageUrl ? { biasWebImageUrl } : {}),
          ...(preMortemImageUrl ? { preMortemImageUrl } : {}),
        },
      });
    } catch (dbError: unknown) {
      const prismaError = dbError as { code?: string; message?: string };
      if (prismaError.code === 'P2021' || prismaError.code === 'P2022') {
        log.warn('Schema drift saving topography URLs: ' + prismaError.code);
        // Still return the URLs even if we can't persist them
      } else {
        throw dbError;
      }
    }

    log.info(
      `Topographies generated: biasWeb=${!!biasWebImageUrl}, preMortem=${!!preMortemImageUrl}`
    );

    return NextResponse.json({
      biasWebImageUrl,
      preMortemImageUrl,
      analysisId: analysis.id,
    });
  } catch (error) {
    log.error('Generate topographies error:', error);
    return NextResponse.json({ error: getSafeErrorMessage(error) }, { status: 500 });
  }
}
