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
import { safeCompare } from '@/lib/utils/safe-compare';

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
Decision Intel is an AI-powered cognitive bias auditing engine for high-stakes executive teams. Upload a board memo, strategy paper, risk assessment, M&A proposal, or any strategic document → get a comprehensive bias audit in under 60 seconds. PE/VC investment committees are a proven first vertical (IC memos, CIMs, pitch decks, DD reports).
- 11-agent LangGraph pipeline (sequential: GDPR anonymizer → data structurer → intelligence gatherer → parallel fan-out: bias detective, noise judge, verification, deep analysis, simulation, RPD recognition → meta judge → risk scorer)
- 20 standard cognitive biases + 11 investment-specific biases (anchoring to entry price, thesis confirmation, sunk cost holds, survivorship, herd behavior, disposition effect, projection overconfidence, narrative fallacy, winner's curse, management halo, carry incentive distortion)
- Decision Quality Index (DQI): 0-100 composite score (FICO for decisions). Components: Bias Load 28%, Noise Level 18%, Evidence Quality 18%, Process Maturity 13%, Compliance Risk 13%, Historical Alignment 10%. Grade scale: A (80-100), B (65-79), C (50-64), D (35-49), F (0-34). v2.0.0 methodology.
- Conviction Score: 0-100 measuring thesis support INDEPENDENT of bias. Components: Evidence Strength 35%, Argument Coherence 30%, Judge Agreement 20%, Perspective Diversity 15%
- Compound Scoring Engine: 20x20 bias interaction matrix, context multipliers (monetary stakes, absent dissent, time pressure), biological signal detection (Winner Effect 1.2x, Cortisol/Stress 1.18x)
- Toxic Combination Detection: Echo Chamber, Sunk Ship, Blind Sprint, Yes Committee, Optimism Trap, Status Quo Lock, Recency Spiral
- 146 annotated real-world case studies (131 failures + 15 successes) across 8 industries (Financial Services 28, Technology 23, Government 13, Energy 11, Healthcare 11, Retail 11, Aerospace 9, Automotive 7). Includes pre-decision evidence (original memos, SEC filings, board presentations) showing biases detectable BEFORE outcomes were known.
- Project types: M&A, Strategic Initiative, Risk Assessment, Vendor Evaluation, Product Launch, Restructuring + PE/VC types (Buyout, Growth Equity, Venture, Secondary, Add-On, Recapitalization)

=== COMPETITIVE MOAT ===
Deepest moat: Causal learning pipeline + feedback loops. Competitors cannot clone 18 months of accumulated behavioral data.
- Bias Detection (LLM): Low moat — copyable
- Noise Decomposition: Medium — Kahneman framework
- Compound Scoring Engine: High — proprietary 20x20 matrix + biological signals
- Toxic Combinations: High — named patterns + learned from outcomes
- Causal Learning Pipeline: Very High — 18+ months per-org outcome data, pairwise interaction detection (joint failure rate >1.3x independence assumption)
- Nudge Calibration: Very High — behavioral feedback loop, org-specific
- Cross-Org Bias Genome: Very High — data network effect
- Pre-Decision Evidence Database: High — original memos/filings proving biases detectable before outcomes, eliminates hindsight bias criticism

=== COMPETITORS ===
Enterprise competitors:
- McKinsey Decision Analytics / Board Intelligence: Consulting-heavy, no automated real-time auditing. Response: "They consult quarterly. We audit every document in real-time."
- Palantir / enterprise data platforms: Data analysis, not decision quality. Response: "They analyze data. We analyze the decision-makers analyzing the data."
PE/VC vertical competitors:
- Affinity: Relationship CRM for dealmakers. DOESN'T do decision quality. Response: "Affinity finds the deal. We audit the decision to invest. Complementary."
- DealCloud (Intapp): Deal management/pipeline CRM. DOESN'T analyze documents. Response: "DealCloud tracks your pipeline. We audit the decisions your pipeline produces."
- Grata: AI company search/deal sourcing. DOESN'T evaluate decision quality. Response: "Grata finds targets. We stress-test the thesis."
- Blueflame AI: CIM summarization/data room analysis. DOESN'T detect biases or track outcomes. Response: "Blueflame reads faster. We read blind spots."
General AI:
- ChatGPT/Claude direct: Single model opinion, no noise measurement, no outcome tracking, no org calibration. Response: "One opinion from one model. We use 3 judges, 20x20 matrix, and an outcome flywheel."

=== MARKET STRATEGY ===
Primary market: Enterprise Decision Teams — any team making high-stakes, document-driven decisions (M&A, corporate strategy, risk assessment, vendor selection, product launches).
Proven vertical: PE/VC Investment Committees — quantifiable ROI ($50-500M per avoided bad deal), tight-knit community, fastest sales cycle.
Pricing: Starter (Free, 3 analyses) → Professional ($349/mo) → Team ($999/mo) → Enterprise (Custom).
Market: Decision intelligence $12.2B → $46.4B by 2030. Enterprise GRC $50B+. PE/VC software $607B → $995B by 2035.
Expansion: Year 1 Enterprise M&A/Strategy/Risk → Year 2 Financial Services (PE/VC, Hedge Funds) → Year 3 Government/Insurance → Year 4+ Horizontal platform.

=== SALES TOOLKIT ===
Pitch reframe: NOT "avoid bad decisions" but "swing with confidence because you've stress-tested the decision."
Key objections:
- "We have a good decision process" → "Upload 3 strategic documents and see the DQI. Most organizations score 45-65."
- "How is this different from ChatGPT?" → "3 independent judges, 20x20 interaction matrix, 31 domain-specific biases, outcome flywheel that gets smarter."
- "Our team would never share strategic documents" → "GDPR-anonymized before AI touches it. PII never leaves anonymization layer."
- "No budget" → "One avoided bad decision = millions saved. That's 100-1000x ROI."
- "You're just using hindsight" → "We include original documents from before outcomes were known. Boeing's 2011 board memo, Yahoo's rejection letter, Enron's Watkins memo — the biases were flaggable at decision time. 14 case studies now have pre-decision evidence proving this."
- "How do you know the biases were really detectable?" → "We source original board memos, SEC filings, and strategy documents from the decision point. Our platform's analysis of Boeing's 2011 re-engine memo flags sunk cost, anchoring, and time pressure — all visible before the 737 MAX outcome."
Demo script: Upload → Score reveal (pause for effect) → Bias walkthrough (specific excerpts) → Boardroom Simulation (THE WOW MOMENT) → Noise Score → Toxic Combinations → Close with free pilot offer.

=== RESEARCH FOUNDATIONS ===
- Kahneman: Insurance underwriter study — expected 10% variability, actual 55%. Noise is at least as damaging as bias. Triple-judge noise scoring is a direct implementation.
- Strebulaev (Stanford GSB): 9 VC principles. Key: consensus-seeking committees have LOWER success rates → validates blind prior system. "Home runs matter" → reframe pitch from defensive to offensive.
- Sibony: "Decision hygiene" framework. Offer free noise audit as sales hook.
- Klein: Invented premortem. RPD framework NOW SHIPPED: recognition cues from historical decisions (RAG pattern matching), narrative pre-mortems, RPD mental simulator, personal calibration dashboard. DI sits at intersection of structured analysis (Kahneman) + expert intuition amplification (Klein).
- Duke: Knowing bias names doesn't help. Precommitment and decision architecture does → validates nudge system.
- Tetlock: Human-machine hybrids beat both pure AI and pure human → validates DI architecture.
- Lochhead: Category creation. "Frame It, Name It, Claim It." DQI should become the standard metric for decision quality.
- Thiel: Contrarian truth: "Executive teams think decisions are rational but they're riddled with measurable noise and bias nobody audits."

=== INTEGRATIONS ===
- Slack: Decision detection, pre-decision coaching with org-calibrated nudges, thread bias accumulation, audit summary card on commitment. 7 slash commands: /di help (Block Kit categorized), /di analyze (full audit + Copilot link), /di score (instant bias check), /di brief (org intelligence), /di status (quality trends + calibration), /di prior, /di outcome. App Home dashboard. Auto-creates CopilotSession after every Slack audit with "Continue in Copilot" button for seamless handoff.
- Decision Knowledge Graph: 8 edge types, 5 node types, 5 anti-patterns, multi-touch attribution, edge learning from outcomes
- Committee Decision Rooms: blind prior collection, consensus scoring (0-100), unanimity warning (Strebulaev), dissent quality score, bias briefing
- Calibration Gamification: Bronze→Silver→Gold→Platinum, milestone tracking, "each outcome makes AI smarter"
- Personal Calibration Dashboard: /calibration — per-user decision patterns, recurring biases with trends, calibration score, blind spots, strength patterns
- Copilot AI Assistant: CopilotSession + CopilotTurn models for persistent AI coaching. Auto-seeded from Slack audits. Accessible from /dashboard/ai-assistant.
- Intelligence Brief: Contextual org intelligence on empty dashboard states — shows top dangerous biases, maturity grade, decision stats, and page-specific tips.

=== FOUNDER NOTES ===
- Deepest moat is time-to-data, not features. Frame first 6 months as calibration investment.
- Enterprise positioning broadens TAM from ~7,500 PE/VC firms to 10,000+ organizations. PE/VC remains strongest vertical for ROI proof points.
- Outcome Gate is controversial AND valuable. Show calibration improvement to make it rewarding.
- Sell the Bias Genome to investors: "World's first dataset of which cognitive biases predict failure, by industry."
- Counterfactual engine is underexposed. Get it into UI and sales deck — it's the ROI story.
- Consider a "Decision Score" that's external-facing — like a credit score for organizational decision quality.

=== RECENTLY SHIPPED FEATURES (March 2026) ===
- Slack → Copilot Auto-Trigger: Auto-creates CopilotSession seeded with decision context after every Slack audit. "Continue in Copilot" button in Slack messages.
- Intelligence Brief on Empty States: Contextual org intelligence (top dangerous biases, maturity grade, decision stats) replaces generic empty states across 4 dashboard pages.
- Enhanced Slack Commands: 7 slash commands with rich Block Kit — /di help (categorized), /di score (instant bias check), /di brief (org intelligence), /di status (quality trends), /di analyze (with Copilot link), /di prior, /di outcome.
- Bias Heat Map Enhancement: Density gutter minimap, confidence-based opacity, hover tooltips with excerpts, keyboard navigation (←→ cycle biases, H toggle heat map).
- Enterprise Language Pivot: Decision types renamed from PE/VC-specific to enterprise-neutral (resource_allocation, strategic_proposal, initiative_closure).
- Klein RPD Framework: Expert intuition amplification — recognition cues, narrative pre-mortems, RPD mental simulator, personal calibration dashboard. Dual framework: Kahneman debiasing + Klein intuition amplification.
- Enhanced Public Demo: Streaming simulation UX with 3 sample docs at /demo, no login required. DQI badge animation.
- Case Study Export: One-click anonymized shareable analyses with permanent links. Available via Share modal.
- Browser Extension: Chrome extension with quick-score popup (<5s) and full analysis sidepanel.
- A/B Prompt Testing: Experiment dashboard with Thompson sampling auto-optimization.
- Multi-Model Fallback: Gemini → Claude failover routing. Set AI_FALLBACK_ENABLED=true.
- Quick Bias Check: Dashboard modal for instant <5s bias scan via paste. Shared Gemini utility across extension + platform.
- Counterfactual Analysis API: "What-if" decision path computation with narrative explanations.
- Enterprise Project Types: M&A, Strategic Initiative, Risk Assessment, Vendor Evaluation, Product Launch, Restructuring — alongside existing PE/VC types.
- Founder Hub Streamlining: Now 11 tabs — Product Overview, Analysis Pipeline, Scoring Engine, DQI Methodology, Integrations & Flywheel, Strategy & Positioning, Sales Toolkit, Live Stats, Playbook & Research, Case Studies, Correlation & Causal Graph. Global search (⌘K), responsive tab strip.
- DQI Methodology Tab: Full transparency on 6-component DQI scoring — weight breakdown, component formulas, case study DQI rankings, System 1 vs System 2 bias classification, grade scale.
- Correlation & Causal Graph Tab: Visualizes cross-case correlations — bias co-occurrence pairs, industry risk profiles, severity predictors, context amplifiers, seed weights, and inline SVG causal graph (biases → outcomes).
- Pre-Decision Evidence: 6 case studies now include original documents from BEFORE outcomes were known (board memos, SEC filings, earnings calls). Shows what the platform would have flagged — eliminating hindsight bias from the analysis.
- Pairwise Interaction Learning: Causal learning engine detects multi-bias interaction effects (bias pairs with joint failure rate >1.3x expected from independence).
- Self-Activating Historical Alignment: DQI historicalAlignment component auto-computes from correlation engine when no explicit alignment data exists — no more default 60 scores.
`.trim();

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth: verify founder password
  const founderPass = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS;
  if (!founderPass) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  const headerPass = req.headers.get('x-founder-pass') || '';
  if (!safeCompare(headerPass, founderPass)) {
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
