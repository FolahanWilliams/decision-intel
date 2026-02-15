import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { BiasDetectionResult } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const EXTENSION_API_KEY = process.env.EXTENSION_API_KEY?.trim();

// Allow longer processing times for AI analysis
export const maxDuration = 300;

// Simple stateless error handling
// NOTE: Global state is removed for serverless compatibility.
// and may reset at any time. Do not rely on it for critical production logic.

export async function POST(request: NextRequest) {
    try {
        // Check rate limit first
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   "anonymous";
        
        const rateLimitResult = await checkRateLimit(ip, '/api/analyze');
        
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
        const apiKey = request.headers.get('x-extension-key');
        let effectiveUserId = userId;

        // Secure check: ensure EXTENSION_API_KEY is defined and not empty before comparing
        if (!effectiveUserId && EXTENSION_API_KEY && EXTENSION_API_KEY.length > 0) {
            if (apiKey !== EXTENSION_API_KEY) {
                console.error('Unauthorized: Invalid API key provided');
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const extUserId = request.headers.get('x-extension-user-id');
            effectiveUserId = extUserId ? `ext_${extUserId}` : 'extension_guest';
        }

        if (!effectiveUserId) {
            console.error('Unified Auth Failed: No Session ID and Invalid API Key');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Safety check for malformed or missing request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error('Request body parse error:', parseError);
            return NextResponse.json({ error: 'Invalid or missing request body' }, { status: 400 });
        }

        let documentId = body.documentId;

        // Handle direct text analysis (from extension)
        if (!documentId && body.text) {
            const newDoc = await prisma.document.create({
                data: {
                    userId: effectiveUserId,
                    filename: body.filename || 'Web analysis',
                    fileType: body.fileType || 'web',
                    fileSize: body.text.length,
                    content: body.text,
                    status: 'pending'
                }
            });
            documentId = newDoc.id;
        }

        if (!documentId) {
            return NextResponse.json({ error: 'Missing documentId or text' }, { status: 400 });
        }

        // Verify ownership
        const doc = await prisma.document.findFirst({
            where: { id: documentId, userId: effectiveUserId }
        });

        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Reset error count on success
        const result = await analyzeDocument(doc);

        return NextResponse.json({
            success: true,
            documentId,
            overallScore: result.overallScore,
            noiseScore: result.noiseScore,
            summary: result.summary,
            biasesFound: result.biases.filter((b: BiasDetectionResult) => b.found).length,
            biases: result.biases
        });

    } catch (error) {
        console.error('Analysis error:', error);
        // Sanitize error message to prevent prompt injection into Jules
        let errorMessage = error instanceof Error ? error.message : String(error);
        errorMessage = errorMessage.slice(0, 200).replace(/[<>]/g, ''); // Truncate and remove basic HTML/XML tags

        // Self-Healing Trigger
        const isHealableError =
            errorMessage.includes('JSON') ||
            errorMessage.includes('Unexpected end of JSON') ||
            errorMessage.includes('SAFETY') ||
            errorMessage.includes('blocked');

        if (isHealableError) {
            console.warn(`⚠️ Healable error detected: ${errorMessage}`);
        }

        return NextResponse.json({
            error: 'Analysis failed',
            details: errorMessage
        }, { status: 500 });
    }
}
