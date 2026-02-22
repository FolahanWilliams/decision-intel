import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI, type Tool } from "@google/generative-ai";
import { getRequiredEnvVar } from '@/lib/env';
import { createLogger } from '@/lib/utils/logger';

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
        // Fetch last 10 analyses to get unique tickers
        const recentAnalyses = await prisma.analysis.findMany({
            where: { document: { userId } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { factCheck: true } // Assuming we stored primaryCompany here
        });

        // Extract Tickers
        const tickers = new Set<string>();
        recentAnalyses.forEach(a => {
            const fc = a.factCheck as unknown as { primaryCompany: { ticker: string } }; // Type assertion since it's JSON
            if (fc?.primaryCompany?.ticker) {
                tickers.add(fc.primaryCompany.ticker);
            }
        });

        const activeTickers = Array.from(tickers).slice(0, 3); // Top 3

        if (activeTickers.length === 0) {
            return NextResponse.json({
                summary: "No sufficient data to generate market intelligence. Upload documents with financial data first.",
                risks: [],
                searchSources: []
            });
        }

        // 2. Perform Market Analysis (Grounded)
        log.info('Running Market Analysis for: ' + activeTickers.join(', '));
        const model = getMarketAnalystModel();

        const prompt = `
        You are an AI Market Intelligence Analyst.
        Target Companies: ${activeTickers.join(', ')}.

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
