import { generateWithFallback } from '@/lib/ai/model-router';
import { createLogger } from '@/lib/utils/logger';
import type { ExtractedProfile, GeneratedOutreach, IntentCallouts, OutreachIntent } from './types';

const log = createLogger('MessageGenerator');

// Source of truth for the wedge personas + sequencing + pain framing:
// src/lib/constants/icp.ts (PHASE_1_HXC_PERSONAS, ICP_WEDGE, ICP_CEILING,
// POSITIONING_PAIN_FRAMING, COMPETITIVE_DEFENSIVE_LINES). When the v3.5
// ICP lock or 2026-05-08 pain-framing lock changes, edit icp.ts first;
// this prompt follows the same vocabulary.
const FOUNDER_PITCH_CONTEXT = `DECISION INTEL — FOUNDER POSITIONING CONTEXT

What it is: Decision Intel is the reasoning audit platform. Users upload strategic documents (M&A memos, board papers, strategy proposals) and get a comprehensive reasoning audit in under 60 seconds. 22-bias taxonomy (DI-B-001 to DI-B-022), DQI score, forgotten-questions detector, boardroom simulation, counterfactual replay.

The pain (canonical phrasing — locked 2026-05-08): capital eroded by unaudited reasoning in strategic decisions. Money-line: reasoning is never objectively sound; it is either audited or unaudited. (Anchored in Mercier & Sperber argumentative theory + Kahneman & Klein 2009 conditions for trustworthy intuition.) Do NOT say "bad strategic decisions" or "flawed reasoning" — both trigger ego threat with elite decision-makers who view their intuition as their proprietary edge. Do NOT say "unaudited decisions" alone — drops the IP differentiator (Cloverpop logs decisions, IBM audits models — the word "reasoning" is what locks them out).

Who it's for (Phase 1 wedge — months 1-6, NOW, v3.5 ratified 2026-05-04): the FOUR buyer-class-continuous personas at £249/mo Individual tier — (a) Fractional CSOs running 3-5 client engagements with regular memo flow, (b) Heads of Corp Dev / M&A at $50M-$500M revenue scale-ups with personal-decisive budget, (c) GPs / principals at smaller funds (£5M-£100M AUM) with active deal flow OR LP-governance pressure, (d) PE-backed founders / CEOs owning the strategic memo workflow. UK + US. Junior analysts and roles outside these four are out-of-scope for Phase 1 (auto-waitlisted at sign-up).

Where this is going (NOT the Phase 1 message — context only): Phase 2 bridge (months 6-12) is Sankore-class design partner pilots producing reference-grade DPRs. Phase 3-4 ceiling (12-24+ months) is F500 corporate strategy + corp dev M&A teams running cross-border acquisitions @ £50K-150K ACV. Do NOT pitch the ceiling to a wedge prospect — different motion, different price, different gate.

Moat: per-org Brier-scored outcome calibration — once a customer logs enough decisions with outcomes, our engine learns which biases actually mattered for THEM specifically and recalibrates future DQI scores accordingly. The Recognition-Rigor Framework (Kahneman's debiasing + Klein's Recognition-Primed Decisions arbitrated in one pipeline) is the IP layer. The 19-framework cross-border regulatory map (G7 / EU / GCC / African markets including NDPR / CBN / WAEMU / PoPIA / SARB / ISA Nigeria 2007) is the moat layer Cloverpop and IBM watsonx.governance don't carry. Advised by a senior consultant who took Wiz from startup to $32B.

Competitor reality: there is no direct competitor in reasoning auditing. Defensive lines (use verbatim if a competitor name comes up): "Cloverpop logs decisions; Decision Intel audits them." / "IBM audits the model; Decision Intel audits the human reasoning." The real competition is "do nothing" — teams don't audit the reasoning behind strategic decisions at all.

Economics: ~90% blended gross margins (~£0.30-0.50 per audit on Gemini paid tier 1, ~17 LLM calls across 12 nodes). Pricing: £249/mo Individual (15 audits, the wedge tier), £2,499/mo Strategy (fair-use 250 audits/mo + team), Enterprise custom with volume floor + overage.

The "why now" hook: boards demanding rigor after a decade of capital eroded by unaudited reasoning (WeWork, Microsoft-Nokia, Boeing 737 MAX, Quibi). EU AI Act high-risk decision-support obligations enforce August 2026. LLMs finally make real-time reasoning audit feasible at <£0.50 per document. The per-org Brier-scored flywheel is live in production.

Founder: Solo technical founder, 16, raised between Lagos (home) and the UK (current residence). Raising pre-seed/seed in the next ~6 months. No paying customers yet — actively outreaching to the four Phase 1 HXC personas via LinkedIn DMs and warm intros (5-10/week target).

WRITING STYLE RULES (mandatory for every message):
- No emojis, no em dashes, no bullet-point formatting in the message body.
- First-person singular only ("I" not "we").
- Short sentences. No corporate jargon.
- Reference at least one specific detail from the recipient's profile.
- Reference at least one specific detail from this positioning context.
- End with a clear, small ask — never a demo request in a first-touch message.
- Always open with a formal time-of-day salutation on its own line: "Good Afternoon Mr./Ms. [Last Name]," (use Afternoon unless profile context suggests otherwise)
- Always include this sentence near the start: "I hope this message finds you well. I know you have a busy schedule, so I'll keep this brief."
- Always self-introduce with age: "My name is Folahan Williams, and I am a 16-year-old startup founder currently building [one-sentence description of Decision Intel]."
- Always end with this exact sign-off (preserve the line breaks): "Warm regards,\\nFolahan Williams\\n\\ndecision-intel.com"
- Word limit is specified per intent — stay within it.`;

const INTENT_INSTRUCTIONS: Record<OutreachIntent, string> = {
  connect: `INTENT: Connect (seeking guidance or expertise).
The tone is warm and deferential — Folahan is reaching out to a more experienced professional for advice, not pitching. Follow this structure exactly:

1. Salutation line: "Good Afternoon [Title] [Last Name]," (on its own line)
2. Opening: "I hope this message finds you well! I know you have a busy schedule, so I'll keep this brief."
3. Self-introduction: "My name is Folahan Williams, and I am a 16-year-old startup founder currently building an enterprise B2B SaaS platform focused on cognitive auditing for enterprise decisions at Decision Intel."
4. Why this person specifically: 1-2 sentences referencing their specific experience, role, company, or background from the profile — explain why their perspective is uniquely valuable to someone navigating this space.
5. The ask: "If you have just five minutes to spare, I would greatly appreciate the opportunity to discuss your experiences and any advice you could share."
6. Closing: "Thank you very much for considering my request. I look forward to the possibility of connecting with you!"
7. Sign-off: "Warm regards,\nFolahan Williams\n\ndecision-intel.com"

Maximum 200 words including the salutation and sign-off. Goal: a reply, not a meeting.`,

  pilot: `INTENT: Pilot Customer.
Open with a specific observation about their company's recent strategic moves or M&A activity (inferred from profile). Explain in one sentence that you run a bias-auditing tool. Offer a concrete, free 30-day pilot for their team with a specific proof point ("I'll run your last three board memos through it and send you the findings — no login required, no cost"). Close with "Is next week too soon?" or similar low-friction ask.`,

  poc: `INTENT: Proof of Concept.
Technical and scoped. Reference their technical depth or process rigor from the profile. Propose a 2-week POC with clear scope: 10 documents of their choosing, full DQI + bias breakdown + causal deductions if they have historical outcomes. Mention the ~90% blended gross margin and sub-60-second turnaround. Close by asking for a 20-minute technical call to scope which documents fit.`,

  investor: `INTENT: Investor.
Positioning-first. Lead with the "why now" hook and the moat. Reference the investor's thesis or portfolio overlap if inferable. Mention the Wiz advisor explicitly. Mention that we just turned on the causal flywheel (the broken-until-now code path is shipping). Close by offering a 10-minute loom of a live audit on one of the investor's portfolio companies' public memos (earnings call, shareholder letter). NEVER ask for money in a first-touch message.`,
};

const GENERATOR_PROMPT = `You are a ghostwriter for the founder of Decision Intel. Write an outreach message tailored to the recipient and intent below. Return JSON only — no markdown fences, no prose outside the JSON.

{{FOUNDER_CONTEXT}}

{{INTENT_INSTRUCTIONS}}

RECIPIENT PROFILE (structured):
{{PROFILE_JSON}}

Return this exact JSON shape:
{
  "message": string,         // The full outreach message body including salutation and sign-off. Follow ALL writing style rules. Stay within the intent-specific word limit.
  "talkingPoints": string[], // Up to 3 talking points the founder can use if they get a reply. Specific, not generic.
  "warmOpeners": string[],   // 2 alternate first-line openers the founder can swap in if the primary one feels off.
  "callouts": {
    "headline": string,      // One-line tactical summary of why this intent fits this person.
    "body": string,          // 2 sentences on what to watch for in the reply.
    "bullets": string[]      // Up to 3 short bullets — for pilot: ICP match reasons; for poc: technical fit points; for investor: moat/thesis overlap; for connect: shared topics.
  }
}

Hard requirements — validation will reject outputs that fail these:
1. The message MUST reference at least one specific detail from the profile (name, role, company, recent topic, or inferred priority).
2. The message MUST reference at least one specific detail from the founder context (the 60-second reasoning audit, the Wiz advisor, the per-org Brier-scored outcome flywheel, the ~90% blended gross margins, the "capital eroded by unaudited reasoning" pain framing, or the EU AI Act August 2026 enforcement "why now" hook).
3. The message MUST stay within the word limit specified by the intent (200 words for connect, 150 words for all other intents).
4. The message MUST include a formal salutation on the first line (e.g. "Good Afternoon Ms. Smith,") and end with the "Warm regards, Folahan Williams, decision-intel.com" sign-off.
5. No emojis, no em dashes, no markdown.`;

export async function generateOutreach(
  profile: ExtractedProfile,
  intent: OutreachIntent
): Promise<GeneratedOutreach> {
  const prompt = GENERATOR_PROMPT.replace('{{FOUNDER_CONTEXT}}', FOUNDER_PITCH_CONTEXT)
    .replace('{{INTENT_INSTRUCTIONS}}', INTENT_INSTRUCTIONS[intent])
    .replace('{{PROFILE_JSON}}', JSON.stringify(profile, null, 2));

  const result = await generateWithFallback(prompt, {
    maxTokens: 1600,
    temperature: 0.55,
  });

  const parsed = parseGeneratorOutput(result.text);
  const validated = validateOutput(parsed, profile, intent);

  return {
    profile,
    message: validated.message,
    talkingPoints: validated.talkingPoints,
    warmOpeners: validated.warmOpeners,
    callouts: validated.callouts,
  };
}

interface RawGeneratorOutput {
  message: string;
  talkingPoints: string[];
  warmOpeners: string[];
  callouts: IntentCallouts;
}

function parseGeneratorOutput(text: string): RawGeneratorOutput {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonSlice =
    firstBrace === -1 || lastBrace === -1 ? cleaned : cleaned.slice(firstBrace, lastBrace + 1);

  try {
    const obj = JSON.parse(jsonSlice);
    return {
      message: typeof obj.message === 'string' ? obj.message : '',
      talkingPoints: Array.isArray(obj.talkingPoints)
        ? obj.talkingPoints.filter((x: unknown): x is string => typeof x === 'string').slice(0, 3)
        : [],
      warmOpeners: Array.isArray(obj.warmOpeners)
        ? obj.warmOpeners.filter((x: unknown): x is string => typeof x === 'string').slice(0, 2)
        : [],
      callouts: {
        kind: 'connect',
        headline: typeof obj.callouts?.headline === 'string' ? obj.callouts.headline : '',
        body: typeof obj.callouts?.body === 'string' ? obj.callouts.body : '',
        bullets: Array.isArray(obj.callouts?.bullets)
          ? obj.callouts.bullets
              .filter((x: unknown): x is string => typeof x === 'string')
              .slice(0, 3)
          : [],
      },
    };
  } catch (err) {
    log.error('Failed to parse generator output', { text, err });
    throw new Error('The AI returned an unexpected format. Try regenerating.');
  }
}

function validateOutput(
  raw: RawGeneratorOutput,
  profile: ExtractedProfile,
  intent: OutreachIntent
): RawGeneratorOutput {
  const cleanMessage = raw.message
    .replace(/[\u2014\u2013]/g, ',')
    .replace(/\*\*/g, '')
    .trim();

  const wordCount = cleanMessage.split(/\s+/).filter(Boolean).length;
  const limit = intent === 'connect' ? 220 : 170;
  if (wordCount > limit) {
    log.warn(`Generated message was ${wordCount} words (limit: ${limit} for ${intent})`);
  }

  return {
    ...raw,
    message: cleanMessage,
    callouts: { ...raw.callouts, kind: intent },
  };
}
