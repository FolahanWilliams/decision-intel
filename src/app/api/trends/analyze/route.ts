import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI, type Tool } from "@google/generative-ai";
import { getRequiredEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';

const log = createLogger('TrendsAnalyzeRoute');

// Helper to get Grounded Model — initialised lazily so the missing-key error
// surfaces at request time with a clear message rather than at module load.
function getMarketAnalystModel() {
    const genAI = new GoogleGenerativeAI(getRequiredEnvVar('GOOGLE_API_KEY'));
    return genAI.getGenerativeModel({
        model: "gemini-3-flash-preview", // Fast, Supports Tools
        tools: [
            { googleSearch: {} } as Tool
        ],
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2 // Low temp for factual analysis
        }
    });
}

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Gather Context (What is the user interested in?)
        // Fetch last 10 analyses to extract topics/tickers from factCheck
        const recentAnalyses = await prisma.analysis.findMany({
            where: { document: { userId } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { factCheck: true, summary: true }
        });

        // Extract topics — the verificationNode stores primaryTopic as
        // a plain string (e.g. "Apple", "Tesla Motors"), not as an object.
        // Also check the legacy primaryCompany.ticker path for backwards compat.
        const topics = new Set<string>();
        recentAnalyses.forEach(a => {
            const fc = a.factCheck as Record<string, unknown> | null;
            if (!fc) return;
            // New format: primaryTopic (string)
            if (typeof fc.primaryTopic === 'string' && fc.primaryTopic.trim()) {
                topics.add(fc.primaryTopic.trim());
            }
            // Legacy format: primaryCompany { ticker, name }
            const pc = fc.primaryCompany as { ticker?: string; name?: string } | undefined;
            if (pc?.ticker) topics.add(pc.ticker);
            else if (pc?.name) topics.add(pc.name);
        });

        const activeTopics = Array.from(topics).slice(0, 3); // Top 3

        if (activeTopics.length === 0) {
            return NextResponse.json({
                summary: "No sufficient data to generate market intelligence. Upload documents with financial data first.",
                risks: [],
                searchSources: []
            });
        }

        // 2. Perform Market Analysis (Grounded)
        log.info('Running Market Analysis for: ' + activeTopics.join(', '));
        const model = getMarketAnalystModel();

        const prompt = `
        You are an AI Market Intelligence Analyst.
        Target Companies: ${activeTopics.join(', ')}.

        TASK:
        1. Search for the LATEST major market news, regulatory threats, and macroeconomic trends affecting these companies/sectors.
        2. Focus on "Systemic Risks" and "Tailwinds".
        3. Be brief, executive-style.

        OUTPUT JSON:
        {
            "summary": "Brief market overview (markdown)",
            "impactAssessment": [
                { "category": "Regulatory", "status": "High"|"Medium"|"Low", "details": "string" },
                { "category": "Macro", "status": "High"|"Medium"|"Low", "details": "string" },
                { "category": "Competitor", "status": "High"|"Medium"|"Low", "details": "string" }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON safely
        let analysis;
        try {
            analysis = JSON.parse(responseText);
        } catch {
            // Fallback if model returns Markdown block
            try {
                const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                analysis = JSON.parse(cleanText);
            } catch {
                log.error('Failed to parse Gemini response: ' + responseText.slice(0, 200));
                return NextResponse.json(
                    { error: 'Market analysis returned an unparseable response. Please try again.' },
                    { status: 500 }
                );
            }
        }

        // Extract Sources from Grounding Metadata
        const metadata = result.response.candidates?.[0]?.groundingMetadata;
        const searchSources = metadata?.groundingChunks
            ?.map((c: { web?: { uri?: string } }) => c.web?.uri)
            .filter((u: unknown): u is string => typeof u === 'string') || [];

        logAudit({
            action: 'SEARCH_MARKET_TRENDS',
            resource: 'MarketAnalysis',
            details: { tickers: activeTopics }
        }).catch(() => {});

        return NextResponse.json({
            ...analysis,
            searchSources
        });

    } catch (error) {
        log.error('Market Analyst failed:', error);
        return NextResponse.json(
            { error: 'Market analysis failed' },
            { status: 500 }
        );
    }
}
