import { generateWithFallback } from '@/lib/ai/model-router';
import { createLogger } from '@/lib/utils/logger';
import type { ExtractedProfile, GeneratedOutreach, IntentCallouts, OutreachIntent } from './types';

const log = createLogger('MessageGenerator');

const FOUNDER_PITCH_CONTEXT = `DECISION INTEL — FOUNDER POSITIONING CONTEXT

What it is: Decision Intel is an AI cognitive bias auditing platform. Users upload strategic documents (M&A memos, board papers, strategy proposals) and get a comprehensive bias audit in under 60 seconds. 20-bias taxonomy (DI-B-001 to DI-B-020), DQI score, forgotten-questions detector, boardroom simulation, counterfactual replay.

Who it's for: Corporate strategy and M&A teams at F1000 and PE-backed mid-market. Expansion: investment committees at PE/VC.

Moat: 18 months of causal outcome data per org — once a team logs enough decisions with outcomes, our engine learns which biases actually mattered and deducts from future DQI scores accordingly. No competitor has this primitive. Advised by a senior consultant who took Wiz from startup to $32B.

Competitor reality: There is no direct competitor in "decision quality auditing." Cloverpop does decision tracking (not bias detection). The real competition is "do nothing" — teams don't audit their decision processes at all.

Economics: 97% gross margins ($0.03-0.07 per analysis). Pricing: $2,499/mo for corporate strategy teams, $249/mo for Individual (solo strategist).

The "why now" hook: Boards are demanding decision rigor after a decade of bad M&A (Boeing MAX, WeWork, Microsoft-Nokia). Compliance frameworks are citing cognitive hygiene. LLMs finally make real-time bias detection feasible at <$0.10 per document. The 18-month causal flywheel just turned on (production code path that was silently broken for months is now live).

Founder: Solo technical founder, 16, based in Nigeria. Raising pre-seed/seed in the next ~6 months. No pilot users yet — actively outreaching to corp dev/M&A teams via advisor network.

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
Technical and scoped. Reference their technical depth or process rigor from the profile. Propose a 2-week POC with clear scope: 10 documents of their choosing, full DQI + bias breakdown + causal deductions if they have historical outcomes. Mention the 97% gross margins and sub-60-second turnaround. Close by asking for a 20-minute technical call to scope which documents fit.`,

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
2. The message MUST reference at least one specific detail from the founder context (the 60-second audit, the Wiz advisor, the 18-month causal moat, the 97% gross margins, the "do nothing" competitor, or the "why now" hook).
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
