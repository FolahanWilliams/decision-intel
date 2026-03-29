/**
 * POST /api/founder-hub/chat — Founder-only AI chat
 *
 * Gemini chat endpoint with all Founder Hub content baked into the
 * system prompt. Separate from the user-facing /api/chat to avoid
 * leaking founder-internal content (moat assessment, competitor
 * responses, pricing rationale, sales playbook).
 *
 * Auth: requires NEXT_PUBLIC_FOUNDER_HUB_PASS in x-founder-pass header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { formatSSE } from '@/lib/sse';
import { createLogger } from '@/lib/utils/logger';
import { timingSafeEqual } from 'crypto';

const log = createLogger('FounderHubChat');
const ENCODER = new TextEncoder();

// ─── Gemini Setup (cached at module scope) ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedModel: any = null;

function getModel() {
  if (cachedModel) return cachedModel;
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview');
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
    generationConfig: { maxOutputTokens: 4096 },
  });
  cachedModel = model;
  return model;
}

// ─── Founder Hub Knowledge Base ─────────────────────────────────────────────

const FOUNDER_CONTEXT = `
You are the Decision Intel Founder's strategic AI advisor. You have deep knowledge of every aspect of the Decision Intel platform, its competitive positioning, sales strategy, market analysis, and research foundations. Answer questions concisely and specifically — never be generic.

=== PRODUCT OVERVIEW ===
Decision Intel is an AI-powered cognitive bias auditing engine for PE/VC investment committees. Upload an IC memo, CIM, pitch deck, or DD report → get a comprehensive bias audit in under 60 seconds.
- 16-agent LangGraph pipeline (parallel fan-out: bias detective, noise judge x3, fact checker, pre-mortem, compliance, deep analysis, verification, sentiment, rpd recognition → meta judge → risk scorer → boardroom simulation)
- 20 standard cognitive biases + 11 PE-specific biases (anchoring to entry price, thesis confirmation, sunk cost holds, survivorship, herd behavior, disposition effect, projection overconfidence, narrative fallacy, winner's curse, management halo, carry incentive distortion)
- Decision Quality Index (DQI): 0-100 composite score (FICO for decisions). Components: Bias Load 30%, Noise Level 20%, Evidence Quality 20%, Process Maturity 15%, Compliance Risk 15%
- Conviction Score: 0-100 measuring thesis support INDEPENDENT of bias. Components: Evidence Strength 35%, Argument Coherence 30%, Judge Agreement 20%, Perspective Diversity 15%
- Compound Scoring Engine: 20x20 bias interaction matrix, context multipliers (monetary stakes, absent dissent, time pressure), biological signal detection (Winner Effect 1.2x, Cortisol/Stress 1.18x)
- Toxic Combination Detection (Wiz-inspired): Echo Chamber, Sunk Ship, Blind Sprint, Yes Committee, Optimism Trap, Status Quo Lock, Recency Spiral
- 113 annotated real-world failure cases across 8 industries (Financial Services 28, Technology 23, Government 13, Energy 11, Healthcare 11, Retail 11, Aerospace 9, Automotive 7)

=== COMPETITIVE MOAT ===
Deepest moat: Causal learning pipeline + feedback loops. Competitors cannot clone 18 months of accumulated behavioral data.
- Bias Detection (LLM): Low moat — copyable
- Noise Decomposition: Medium — Kahneman framework
- Compound Scoring Engine: High — proprietary 20x20 matrix + biological signals
- Toxic Combinations: High — named patterns + learned from outcomes
- Causal Learning Pipeline: Very High — 18+ months per-org outcome data
- Nudge Calibration: Very High — behavioral feedback loop, org-specific
- Cross-Org Bias Genome: Very High — data network effect

=== COMPETITORS ===
- Affinity: Relationship CRM for dealmakers. DOESN'T do decision quality. Response: "Affinity finds the deal. We audit the decision to invest. Complementary."
- DealCloud (Intapp): Deal management/pipeline CRM. DOESN'T analyze IC materials. Response: "DealCloud tracks your pipeline. We audit the decisions your pipeline produces."
- Grata: AI company search/deal sourcing. DOESN'T evaluate decision quality. Response: "Grata finds targets. We stress-test the thesis."
- Blueflame AI: CIM summarization/data room analysis. DOESN'T detect biases or track outcomes. Response: "Blueflame reads faster. We read blind spots."
- ChatGPT/Claude direct: Single model opinion, no noise measurement, no outcome tracking, no org calibration. Response: "One opinion from one model. We use 3 judges, 20x20 matrix, and an outcome flywheel."

=== MARKET STRATEGY ===
Beachhead: PE/VC Investment Committees. Why: product built for it, genuine white space, accessible buyer (5-50 person firms, MP can greenlight), tight-knit community (FOMO), quantifiable ROI ($50-500M avoided per bad deal).
Pricing: $50-100K/year. ROI: 500-1000x (one avoided bad deal per vintage).
Market: PE/VC software $607B → $995B by 2035. Decision intelligence $12.2B → $46.4B by 2030.
Expansion: Year 1-2 PE/VC → Year 2-3 M&A Advisory → Year 3-4 Broader FinServ → Year 4+ Enterprise.

=== SALES TOOLKIT ===
Pitch reframe: NOT "avoid bad deals" but "swing with confidence because you've stress-tested the decision."
Key objections:
- "We have a good IC process" → "Upload 3 IC memos and see the DQI. Most funds score 45-65."
- "How is this different from ChatGPT?" → "3 independent judges, 20x20 interaction matrix, 11 PE biases, outcome flywheel that gets smarter."
- "Our team would never share IC memos" → "GDPR-anonymized before AI touches it. PII never leaves anonymization layer."
- "No budget" → "One avoided bad deal = $50-500M saved. That's 500-1000x ROI on $50K."
Demo script: Upload → Score reveal (pause for effect) → Bias walkthrough (specific excerpts) → Boardroom Simulation (THE WOW MOMENT) → Noise Score → Toxic Combinations → Close with free pilot offer.

=== RESEARCH FOUNDATIONS ===
- Kahneman: Insurance underwriter study — expected 10% variability, actual 55%. Noise is at least as damaging as bias. Your triple-judge noise scoring is a direct implementation.
- Strebulaev (Stanford GSB): 9 VC principles. Key: consensus-seeking ICs have LOWER IPO rates → validates your blind prior system. "Home runs matter" → reframe pitch from defensive to offensive.
- Sibony: "Decision hygiene" framework. Offer free noise audit as sales hook.
- Klein: Invented premortem. RPD framework NOW SHIPPED: recognition cues from historical deals (RAG pattern matching), narrative war-story pre-mortems, RPD mental simulator (/api/rpd-simulator), personal calibration dashboard (/calibration). DI sits at intersection of structured analysis (Kahneman) + expert intuition amplification (Klein).
- Duke: Knowing bias names doesn't help. Precommitment and decision architecture does → validates nudge system.
- Tetlock: Human-machine hybrids beat both pure AI and pure human → validates DI architecture.
- Lochhead: Category creation. "Frame It, Name It, Claim It." DQI should become the term PE uses like IRR/MOIC.
- Thiel: Contrarian truth: "ICs think decisions are rational but they're riddled with measurable noise and bias nobody audits."

=== INTEGRATIONS ===
- Slack: Decision detection, pre-decision coaching with org-calibrated nudges, thread bias accumulation, audit summary card on commitment, /di commands (analyze, prior, outcome, status), App Home dashboard
- Decision Knowledge Graph: 8 edge types, 5 node types, 5 anti-patterns, multi-touch attribution, edge learning from outcomes
- Committee Decision Rooms: blind prior collection, consensus scoring (0-100), unanimity warning (Strebulaev), dissent quality score, bias briefing
- Calibration Gamification: Bronze→Silver→Gold→Platinum, milestone tracking, "each outcome makes AI smarter"
- Personal Calibration Dashboard: /calibration — per-user decision patterns, recurring biases with trends, calibration score, blind spots, strength patterns

=== FOUNDER NOTES ===
- Deepest moat is time-to-data, not features. Frame first 6 months as calibration investment.
- Outcome Gate is controversial AND valuable. Show calibration improvement to make it rewarding.
- Sell the Bias Genome to investors: "World's first dataset of which cognitive biases predict failure, by industry."
- Counterfactual engine is underexposed. Get it into UI and sales deck — it's the ROI story.
- Consider a "Decision Score" that's external-facing — like a credit score for organizational decision quality.

=== RECENTLY SHIPPED FEATURES (March 2026) ===
- Enhanced Public Demo: Streaming simulation UX with 3 sample docs at /demo, no login required. DQI badge animation.
- Data-Backed ROI Calculator: Live outcome stats from /api/public/outcome-stats replace Kahneman defaults when ≥10 outcomes exist.
- Case Study Export: One-click anonymized shareable analyses with permanent links. Available via Share modal.
- Browser Extension: Chrome extension with quick-score popup (<5s) at /api/extension/quick-score and full analysis sidepanel at /api/extension/analyze.
- A/B Prompt Testing: Experiment dashboard at /dashboard/experiments. Thompson sampling auto-optimization. Per-variant effectiveness tracking.
- Multi-Model Fallback: Gemini → Claude failover routing via src/lib/ai/model-router.ts. Set AI_FALLBACK_ENABLED=true.
- Graph Health Widget: Real-time knowledge graph density, isolated nodes, anti-pattern tracking on main dashboard.
- Counterfactual Analysis API: POST /api/decision-graph/counterfactual for "what-if" decision path computation.
- Product Analytics: trackEvent() client lib at src/lib/analytics/track.ts. Internal /api/analytics/events endpoint.
- Prompt Versioning: SHA-256 deduplicated prompt tracking wired to every analysis via promptVersionId.
- Quick Bias Check: Dashboard modal for instant <5s bias scan via paste. Shared Gemini utility between extension and platform at /api/analyze/quick-score.
- Demo Conversion Tracking: 10 funnel events wired across demo, login, marketing, analysis, and case study pages via trackEvent() fire-and-forget.
- Klein RPD Framework: Expert intuition amplification with 4 components — recognition cues (historical pattern matching via RAG), narrative pre-mortems (war stories), RPD mental simulator (/api/rpd-simulator), personal calibration dashboard (/calibration). Runs as 16th agent in pipeline. Dual framework: Kahneman debiasing + Klein intuition amplification.
`.trim();

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth: verify founder password
  const founderPass = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS;
  if (!founderPass) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  const headerPass = req.headers.get('x-founder-pass') || '';
  try {
    const expected = Buffer.from(founderPass);
    const provided = Buffer.from(headerPass);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.slice(0, 5000) : '';
    const history: Array<{ role: string; content: string }> = Array.isArray(body.history)
      ? body.history
          .filter(
            (m: unknown): m is { role: string; content: string } =>
              typeof m === 'object' &&
              m !== null &&
              typeof (m as Record<string, unknown>).role === 'string' &&
              typeof (m as Record<string, unknown>).content === 'string'
          )
          .slice(-20)
      : [];

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const model = getModel();

    // Build Gemini history with founder context as system prompt
    const geminiHistory = history.map(m => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: FOUNDER_CONTEXT }] },
        {
          role: 'model',
          parts: [
            {
              text: "Understood. I'm your Decision Intel strategic advisor with full knowledge of the platform, competitors, market strategy, sales playbook, and research foundations. Ask me anything.",
            },
          ],
        },
        ...geminiHistory,
      ],
    });

    const result = await chat.sendMessageStream(message);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text })));
            }
          }
          controller.enqueue(ENCODER.encode(formatSSE({ type: 'done' })));
        } catch (err) {
          log.error('Founder chat stream error:', err);
          controller.enqueue(
            ENCODER.encode(
              formatSSE({ type: 'error', message: 'An error occurred generating the response.' })
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    log.error('Founder chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
