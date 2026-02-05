import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/analysis/analyzer';
import { BiasDetectionResult } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const EXTENSION_API_KEY = process.env.EXTENSION_API_KEY;

// Allow longer processing times for AI analysis
export const maxDuration = 60;

// Simple in-memory error tracking (per server instance)
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
        const errorStack = error instanceof Error ? error.stack || '' : '';
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

            // Only trigger healing in development to prevent runaway costs
            const isDevelopment = process.env.NODE_ENV === 'development';

            if (jsonErrorCount >= 3 && isDevelopment) {
                console.log("🚑 Critical Error Threshold Reached. Triggering Jules Healing Pipeline...");

                try {
                    // Use shell exec to trigger the healing script
                    const { exec } = await import('child_process');
                    const sanitizedStack = errorStack
                        .slice(0, 500)
                        .replace(/[<>'"]/g, '')
                        .replace(/\n/g, ' ');

                    exec(`./scripts/jules-healing.sh "${sanitizedStack}"`, (execError, stdout, stderr) => {
                        if (execError) {
                            console.error("❌ Healing script failed:", execError.message);
                        } else {
                            console.log("✅ Healing script triggered:", stdout);
                        }
                        if (stderr) console.error("Healing stderr:", stderr);
                    });

                    // Reset count after triggering (to avoid spamming)
                    jsonErrorCount = 0;
                    console.log("✅ Jules Healing Pipeline Dispatched.");
                } catch (healingError) {
                    console.error("❌ Failed to trigger healing:", healingError);
                }
            } else if (jsonErrorCount >= 3 && !isDevelopment) {
                console.warn("⚠️ Would trigger healing, but NODE_ENV !== 'development'. Skipping.");
            }
        }

        return NextResponse.json({
            error: 'Analysis failed',
            details: errorMessage
        }, { status: 500 });
    }
}
