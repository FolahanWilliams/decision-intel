
// New Node logic for src/lib/agents/nodes.ts
export async function sentimentAnalyzerNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("--- Sentiment Analyzer Node (Gemini) ---");
    try {
        const content = state.structuredContent || state.originalContent;
        const result = await model.generateContent([
            `You are a Sentiment Analyzer. Analyze the sentiment of the text.
            Return a JSON object with two keys:
            - "score": A number between -1 (very negative) and 1 (very positive).
            - "label": A string ("Positive", "Negative", or "Neutral").

            Example: { "score": 0.8, "label": "Positive" }`,
            `Text to Analyze:\n${content}`
        ]);
        const response = result.response.text();
        const data = parseJSON(response);

        return { sentimentAnalysis: data || { score: 0, label: 'Neutral' } };
    } catch (e) {
        console.error("Sentiment Analyzer failed", e);
        return { sentimentAnalysis: { score: 0, label: 'Neutral' } };
    }
}

// INSTRUCTIONS FOR JULES:
// 1. Add 'sentimentAnalysis' (optional) to AuditState in src/lib/agents/types.ts
// 2. Add this function to src/lib/agents/nodes.ts
// 3. Add 'sentimentAnalyzer' node to src/lib/agents/graph.ts (parallel with Bias/Noise/Fact)
