import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { BiasDetectionResult } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const EXTENSION_API_KEY = process.env.EXTENSION_API_KEY;

// Allow longer processing times for AI analysis
export const maxDuration = 300;

// Simple in-memory error tracking (per server instance)
// NOTE: This global variable is for demonstration/local-dev self-healing purposes.
// In a serverless environment (like Vercel), this state is not shared across requests
// and may reset at any time. Do not rely on it for critical production logic.
let jsonErrorCount = 0;

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        // ... (auth logic kept same by replacing outer block, but let's be careful with replacement scope)
        // Actually, I should use a smaller replacement scope or be very careful.
        // Let's replace the whole try/catch block of the POST function.

        // ... (auth parts)
        const apiKey = request.headers.get('x-extension-key');
        let effectiveUserId = userId;

        // Secure check: ensure EXTENSION_API_KEY is defined before comparing
        if (!effectiveUserId && EXTENSION_API_KEY && apiKey === EXTENSION_API_KEY) {
            // Check if EXTENSION_API_KEY is empty or default
            if (EXTENSION_API_KEY.trim().length === 0) {
                console.error('Security Risk: EXTENSION_API_KEY is empty.');
                return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
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
        jsonErrorCount = 0;

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
            jsonErrorCount++;
            console.warn(`⚠️ Healable error detected. Count: ${jsonErrorCount}`);

            // Self-healing via shell execution is disabled for Serverless compatibility.
            // In a real production setup, this should trigger a webhook or background job.
            if (process.env.NODE_ENV === 'development' && jsonErrorCount >= 3) {
                console.warn("⚠️ Self-healing threshold reached. Skipping local shell script execution to ensure Vercel compatibility.");
            }
        }

        return NextResponse.json({
            error: 'Analysis failed',
            details: errorMessage
        }, { status: 500 });
    }
}
