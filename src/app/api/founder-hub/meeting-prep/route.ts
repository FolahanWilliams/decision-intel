/**
 * POST /api/founder-hub/meeting-prep
 *
 * Dynamic meeting-preparation generator. Takes the prospect's LinkedIn
 * info + meeting context + the founder's desired outcome, streams back
 * an executive-level prep plan grounded in:
 *   - Aristotle's ethos / pathos / logos frame
 *   - Cialdini's six influence principles (reciprocity, commitment,
 *     social proof, authority, liking, scarcity)
 *   - Decision Intel's actual assets (Wiz advisor, R²F framework,
 *     135-case corpus, 5-seat design-partner cohort, ~90% blended
 *     margin, pre-seed fundraise posture)
 *   - The founder's specific position (16, solo, Lagos/UK/SF migration,
 *     part-time shipping cadence as velocity thesis)
 *
 * SSE-streamed so the UI can render tokens as they arrive — a ~90s
 * generation feels live rather than dead. Auth: x-founder-pass header.
 * No persistence: plans are ephemeral (copy / print if needed) — the
 * founder can always re-run if the prospect reschedules.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { formatSSE } from '@/lib/sse';
import { createLogger } from '@/lib/utils/logger';
import { verifyFounderPass } from '@/lib/utils/founder-auth';
import { FOUNDER_CONTEXT } from '../founder-context';

const log = createLogger('MeetingPrep');
const ENCODER = new TextEncoder();

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
    generationConfig: { maxOutputTokens: 6144, temperature: 0.35 },
  });
  cachedModel = model;
  return model;
}

const MEETING_TYPES = [
  'cso_discovery',
  'vc_pitch',
  'vc_fundraise_first',
  'advisor_intro',
  'design_partner_review',
  'reference_call',
  'content_collab',
  'other',
] as const;
type MeetingType = (typeof MEETING_TYPES)[number];

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  cso_discovery: 'CSO / corp strategy discovery call',
  vc_pitch: 'VC pitch (later-stage partner meeting)',
  vc_fundraise_first: 'VC pre-seed first call',
  advisor_intro: 'Advisor / warm intro coffee',
  design_partner_review: 'Design partner review / renewal conversation',
  reference_call: 'Reference call (prospect asked for a customer ref)',
  content_collab: 'Content / podcast / panel collaboration',
  other: 'Other — general high-stakes meeting',
};

const MEETING_PREP_SYSTEM_PROMPT = `
You are Decision Intel's executive meeting-preparation strategist. You write ONE custom plan per request. No templates. No generic advice. The founder pastes in what they know about the person they are meeting, the context, and their own ask; you return the plan they will actually use to win the meeting.

=== WHAT YOU KNOW THAT MAKES YOU USEFUL ===
You have the full founder-context loaded above: Decision Intel's positioning (native reasoning layer · Recognition-Rigor Framework · Decision Provenance Record · Decision Quality Index · 135-case corpus · 20×20 bias-weight matrix · 12-node pipeline · ~90% blended margin · 5-seat design-partner cohort at £1,999/mo with first-right-of-refusal Year 2 at list); the founder's specific profile (16, solo technical founder, Lagos-raised, UK-resident, moving to SF at 18, part-time while finishing school, advised by a senior Wiz operator who helped take Wiz from startup to $32B, pre-revenue, no pilots yet, 200+ components + 70+ API routes shipped); the founder's voice (clear prose, no markdown bold, no em dashes in output, calm CSO 1:1 voice with manager-level pain included, never critique the buyer's judgment). Your job is to show the founder how to use those assets specifically against the specific person in front of them.

=== THE FRAME ===
Every plan uses Aristotle's three modes of persuasion — ethos, pathos, logos — and the six Cialdini influence principles — reciprocity, commitment / consistency, social proof, authority, liking, scarcity. Name them where you use them so the founder sees the architecture (not because name-dropping is convincing; because the founder will remember the framework across meetings).

Ethos = why should they trust him now (Wiz advisor; shipped codebase; academic anchors — Kahneman, Klein, Tetlock — all in the product).
Pathos = what do THEY feel about this domain right now (extract from their LinkedIn — recent posts, role changes, industry anxiety, stated priorities).
Logos = the logical case (case corpus, regulatory tailwinds, unit economics, velocity math).

=== THE SHAPE OF YOUR OUTPUT ===
Output exactly these sections, in this order, with these headers in UPPERCASE. Use plain prose. Do NOT use markdown bullet characters like asterisks or hyphens for bullets — use short paragraphs or numbered items (1. 2. 3.). No em dashes. No markdown bold.

WHO THEY ARE
Three to five sentences. What you read off their LinkedIn that MATTERS for this meeting — their role trajectory, what they seem to care about right now, what they'd be sensitive to. Name one specific signal (a recent post, a role change, a company decision) if the provided info permits. If the info is sparse, say so explicitly: "The profile you shared is thin — the plan below is calibrated accordingly; add more context and re-run for a sharper read."

WHAT A WIN LOOKS LIKE (FROM HIS SIDE)
One to two sentences restating the founder's desired outcome in the LANGUAGE THEY will accept, not the language he thought of it in. Example: he thinks "I want them to become a design partner." Restated: "You want Sarah to leave this meeting feeling she has just secured first-mover access to a category the EU AI Act is about to make mandatory for her peers." That second sentence is what lands.

THE OPENING 60 SECONDS (ETHOS ANCHOR)
One sentence he says out loud as the meeting starts. Grounded in which ethos asset will land for THIS specific person. If they are ex-consulting, lead with the 135-case corpus. If they are ex-banking, lead with Basel III / SEC tailwinds. If they are ex-operator, lead with the Wiz advisor and the shipped codebase. If they are ex-academic, lead with Kahneman / Klein / Tetlock anchors. If they are a VC, lead with the design-partner cohort ARR math. Write the exact sentence he should say. Then one sentence on WHY that anchor, for this person specifically.

PATHOS MOVES
Two or three short numbered items (1. 2. 3.). What emotional currents to meet them in. If their LinkedIn shows anxiety about AI replacing their role, meet the anxiety: "You are not obsolete; you are the last line of human judgment. This audits YOUR reasoning, not replaces it." If their LinkedIn shows quiet frustration that their board does not take AI risk seriously, bridge to EU AI Act Article 14 record-keeping. Each item is the founder's mental note PLUS the sentence he actually says in the room.

LOGOS MOVES
Three airtight claims he can defend if pushed, ranked by likely pushback intensity (easiest to hardest). Each claim gets one numbered item with: the claim, the single supporting fact from Decision Intel's real asset library (not invented), and the one follow-up question he asks after the claim lands that deepens their engagement. Cialdini note: the third claim should invoke scarcity or social proof — "the 5-seat design partner cohort" or "three Fortune 500 corp strategy teams already shaping R²F with us" (ONLY if true — do not manufacture social proof that does not exist; if the cohort is still at 0-of-5, say "we are shaping R²F with the first wave of corporate strategy advisors including a senior operator who took Wiz from startup to thirty-two billion").

THE THREE QUESTIONS THEY WILL MOST LIKELY ASK
Predict the three sharpest questions for THIS person. For each: the question, the founder's one-paragraph answer, and the Cialdini / influence lever at play (authority, social proof, commitment, etc.). If one of the three is the age objection, the answer ends with the velocity-math question the founder flips on them: "What do you expect the velocity to be when I am full-time in SF in eighteen months?" Never duck the age question — own it first.

THE ASK
One paragraph. Specific, small, reciprocal. What does he want from them AFTER this meeting, by when, and what does he offer in exchange. If this is a CSO: the ask is a decision to run one strategic memo through Decision Intel before their next board meeting, with founder personally delivering the audit. If this is a VC first call: the ask is a follow-up meeting with a named partner plus a commitment to a specific follow-up artifact (deck, DPR specimen, 135-case library walkthrough). If this is an advisor / warm-intro coffee: the ask is a warm intro to a specific named CSO in their network plus an offer to prepare the intro note on their behalf. Reciprocity: he offers something they can use BEFORE they say yes to his ask — a relevant case study from the 135-case library, a free pre-meeting bias audit of their latest board deck, a draft intro paragraph. Never ask without offering first.

PRE-MEETING PREP (20 MINUTES, THE MORNING OF)
Numbered checklist of six to eight items, in order. What the founder reads / rehearses / opens in a tab BEFORE the meeting. Specific: "open the Design Partners tab in the Founder Hub so slide 10 is one-click away," "re-read the 2009 Kahneman-Klein paper abstract," "practice the age-framing line five times out loud." Last item is always: "breathe, walk around the block, arrive calm. He will sense the calm."

THE CLOSE
One paragraph. How the founder ends the meeting so they know what happens next. Specific verbal ask + specific next artifact + specific calendar move ("I will send the follow-up note by end of day tomorrow with a link to the DPR specimen and three case studies from the financial-services sub-corpus. Does Friday at ten AM work to hear your reaction?"). Never leave the close open-ended. Commitment + consistency — if they agree to the calendar move now, they will keep the commitment later.

AFTER THE MEETING (SAME DAY, WITHIN 90 MINUTES)
Three numbered items. The send-back email the founder writes, the artifact he attaches, and the CRM / notes update. One of the three is ALWAYS: log the meeting + outcome in the Decision Log so the founder's own Brier score on "will this call progress to the next step" calibrates. Meta: we eat our own dogfood.

=== STYLE RULES — HARD STOPS ===
No markdown bold. No em dashes in the output (use commas or sentence breaks). No hedging phrases like "you might consider" — the founder has fifteen minutes to prep; tell him what to do. No "as an AI language model" or any meta. Use "he" for the founder consistently since he reads this as a coached voice. Never invent a fact about Decision Intel that is not already in the founder-context above — if in doubt, use the softer honest version ("we are shaping R²F with the first wave of corporate strategy advisors" instead of inventing customer counts). Total length: 900 to 1,300 words. Shorter if the input is sparse; longer if the input is rich. Do not pad.
`.trim();

interface PrepBody {
  linkedInInfo?: string;
  meetingContext?: string;
  founderAsk?: string;
  meetingType?: string;
  prospectName?: string;
  prospectRole?: string;
  prospectCompany?: string;
}

function normaliseMeetingType(value: string | undefined): MeetingType {
  if (!value) return 'other';
  return (MEETING_TYPES as readonly string[]).includes(value) ? (value as MeetingType) : 'other';
}

export async function POST(req: NextRequest) {
  const passCheck = verifyFounderPass(req.headers.get('x-founder-pass'));
  if (!passCheck.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: PrepBody;
  try {
    body = (await req.json()) as PrepBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const linkedInInfo = (body.linkedInInfo ?? '').trim();
  const meetingContext = (body.meetingContext ?? '').trim();
  const founderAsk = (body.founderAsk ?? '').trim();
  const meetingType = normaliseMeetingType(body.meetingType);
  const prospectName = (body.prospectName ?? '').trim();
  const prospectRole = (body.prospectRole ?? '').trim();
  const prospectCompany = (body.prospectCompany ?? '').trim();

  if (linkedInInfo.length < 40) {
    return NextResponse.json(
      {
        error:
          'Add at least 40 characters of LinkedIn info — paste the profile summary or the role + background you know.',
      },
      { status: 400 }
    );
  }
  if (meetingContext.length < 20) {
    return NextResponse.json(
      { error: 'Add at least 20 characters on what the meeting is about.' },
      { status: 400 }
    );
  }
  if (founderAsk.length < 15) {
    return NextResponse.json(
      { error: 'Add at least 15 characters on what a win looks like for you.' },
      { status: 400 }
    );
  }

  const prospectHeader =
    [prospectName, prospectRole, prospectCompany && `at ${prospectCompany}`]
      .filter(Boolean)
      .join(' · ') || '(no prospect header supplied)';

  const userPayload = [
    `MEETING TYPE: ${MEETING_TYPE_LABELS[meetingType]}`,
    '',
    `PROSPECT HEADER: ${prospectHeader}`,
    '',
    'PROSPECT — LinkedIn info / background the founder already has:',
    linkedInInfo,
    '',
    'MEETING CONTEXT — what this meeting is about, who initiated it, how it came to be:',
    meetingContext,
    '',
    'FOUNDER ASK — what a win looks like for him (restate it in the prospect language):',
    founderAsk,
    '',
    'Write the full meeting-prep plan following the section structure and style rules in the system prompt. Tailor every section to THIS specific person.',
  ].join('\n');

  try {
    const model = getModel();
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: FOUNDER_CONTEXT }] },
        {
          role: 'model',
          parts: [
            {
              text: "Understood. I have the founder context loaded and will ground every meeting-prep plan in Decision Intel's real assets, the founder's specific position, and the three-mode ethos/pathos/logos frame with Cialdini principles named where used.",
            },
          ],
        },
        { role: 'user', parts: [{ text: MEETING_PREP_SYSTEM_PROMPT }] },
        {
          role: 'model',
          parts: [
            {
              text: 'Ready. Share the prospect info, the meeting context, and what a win looks like — I will return a custom plan he can use in the room.',
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessageStream(userPayload);

    const stream = new ReadableStream({
      async start(controller) {
        let carry = '';
        const sanitize = (raw: string): string => {
          let s = carry + raw;
          carry = '';
          if (s.endsWith('*') && !s.endsWith('**')) {
            carry = '*';
            s = s.slice(0, -1);
          } else if (s.endsWith('_') && !s.endsWith('__')) {
            carry = '_';
            s = s.slice(0, -1);
          }
          return s.replace(/\*\*/g, '').replace(/__/g, '').replace(/[—–]/g, ', ');
        };
        try {
          for await (const chunk of result.stream) {
            const text = sanitize(chunk.text());
            if (text) {
              controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text })));
            }
          }
          if (carry) {
            controller.enqueue(ENCODER.encode(formatSSE({ type: 'chunk', text: carry })));
          }
          controller.enqueue(ENCODER.encode(formatSSE({ type: 'done' })));
        } catch (err) {
          log.error('Meeting prep stream error:', err);
          controller.enqueue(
            ENCODER.encode(
              formatSSE({ type: 'error', message: 'Generation failed. Please retry.' })
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
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    log.error('Meeting prep setup failed:', err);
    return NextResponse.json({ error: 'Failed to start generation.' }, { status: 500 });
  }
}
