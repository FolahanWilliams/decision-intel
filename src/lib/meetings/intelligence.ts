/**
 * Meeting Intelligence Service — Phase 2
 *
 * Extracts structured intelligence from meeting transcripts:
 *   1. Action items with assignees, due dates, and priorities
 *   2. Key decisions with context and decision-makers
 *   3. Structured meeting summary (agenda, outcomes, next steps)
 *   4. Per-speaker bias patterns
 *   5. Similar past meetings via RAG institutional memory
 */

import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_ANALYTICAL } from '@/lib/ai/gateway-models';
import { createLogger } from '@/lib/utils/logger';
import { withRetry } from '@/lib/utils/resilience';
import { parseJSON } from '@/lib/utils/json';
import { searchSimilarDocuments } from '@/lib/rag/embeddings';
import type { TranscriptSegment, SpeakerInfo } from '@/lib/meetings/transcribe';

const log = createLogger('MeetingIntel');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActionItem {
  id: string;
  text: string;
  assignee: string | null;
  dueDate: string | null;
  status: 'open' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: string;
}

export interface KeyDecision {
  id: string;
  text: string;
  madeBy: string | null;
  context: string;
  decisionType: string;
  confidence: number;
  rationale: string;
  dissent: string | null;
}

export interface MeetingSummary {
  executive: string;
  agenda: string[];
  outcomes: string[];
  nextSteps: string[];
  openQuestions: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  engagementScore: number;
}

export interface SpeakerBiasProfile {
  speaker: string;
  biases: Array<{
    biasType: string;
    count: number;
    avgSeverity: number;
    examples: string[];
  }>;
  dominanceScore: number;
  dissenterScore: number;
}

export interface SimilarMeeting {
  meetingId: string;
  title: string;
  similarity: number;
  outcome: string;
  lessonsLearned: string;
}

export interface MeetingIntelligenceResult {
  summary: MeetingSummary;
  actionItems: ActionItem[];
  keyDecisions: KeyDecision[];
  speakerBiases: SpeakerBiasProfile[];
  similarMeetings: SimilarMeeting[];
}

// ─── AI Model ───────────────────────────────────────────────────────────────
//
// Phase 2 lock 2026-05-02: Gateway-routed Gemini 3 Flash Preview
// (analytical default) for meeting-intelligence extraction (action
// items, key decisions, summary, speaker bias profiling). Higher-
// quality reasoning needed than Flash Lite — extracting commitments
// and implicit decisions from a transcript needs nuance.

async function callModel(prompt: string): Promise<string> {
  const result = await generateText(prompt, {
    model: MODEL_ANALYTICAL,
    maxOutputTokens: 16384,
  });
  return result.text;
}

// ─── Extract Action Items ───────────────────────────────────────────────────

export async function extractActionItems(
  transcript: string,
  speakers: SpeakerInfo[]
): Promise<ActionItem[]> {
  
  const speakerNames = speakers.map(s => s.name).join(', ');

  const prompt = `You are an expert meeting analyst. Extract ALL action items from this meeting transcript.

An action item is any task, commitment, follow-up, or deliverable that someone agreed to do, was assigned to do, or needs to be done.

Known speakers: ${speakerNames}

<transcript>
${transcript.slice(0, 40000)}
</transcript>

Return JSON:
{
  "actionItems": [
    {
      "id": "ai_1",
      "text": "What needs to be done",
      "assignee": "Speaker name or null if unassigned",
      "dueDate": "ISO date string if mentioned, else null",
      "status": "open",
      "priority": "low|medium|high|critical",
      "context": "Brief quote or context from where this was mentioned"
    }
  ]
}

Rules:
- Extract EVERY actionable commitment, even implicit ones ("I'll look into that")
- Assign to the speaker who committed, not who requested
- Set priority based on urgency cues (ASAP/urgent = critical, by next week = high, etc.)
- Include context so the action item can be traced back to the conversation`;

  const result = await withRetry(
    async () => {
      const responseText = await callModel(prompt);
      return responseText;
    },
    2,
    1500
  );

  const parsed = parseJSON(result) as { actionItems?: ActionItem[] } | null;
  if (!parsed?.actionItems || !Array.isArray(parsed.actionItems)) {
    log.warn('Failed to parse action items');
    return [];
  }

  return parsed.actionItems.map((item, i) => ({
    ...item,
    id: item.id || `ai_${i + 1}`,
    status: item.status || 'open',
    priority: (['low', 'medium', 'high', 'critical'].includes(item.priority)
      ? item.priority
      : 'medium') as ActionItem['priority'],
  }));
}

// ─── Extract Key Decisions ──────────────────────────────────────────────────

export async function extractKeyDecisions(
  transcript: string,
  speakers: SpeakerInfo[]
): Promise<KeyDecision[]> {
  
  const speakerNames = speakers.map(s => s.name).join(', ');

  const prompt = `You are an expert meeting analyst. Identify ALL key decisions made during this meeting.

A key decision is any moment where the group agreed on a course of action, approved/rejected a proposal, chose between alternatives, or committed to a direction.

Known speakers: ${speakerNames}

<transcript>
${transcript.slice(0, 40000)}
</transcript>

Return JSON:
{
  "keyDecisions": [
    {
      "id": "kd_1",
      "text": "Clear statement of the decision",
      "madeBy": "Primary decision-maker (speaker name) or null for group decisions",
      "context": "Brief surrounding context/discussion that led to this decision",
      "decisionType": "approval|rejection|strategic|tactical|operational|delegation|deferral",
      "confidence": 0.0-1.0,
      "rationale": "Why this decision was made (reasoning expressed in meeting)",
      "dissent": "Any voiced disagreement, or null"
    }
  ]
}

Rules:
- Include both explicit decisions ("We've decided to...") and implicit ones (unanimous agreement after discussion)
- Note any dissent or reservations expressed
- Set confidence based on how clearly the decision was stated (0.5 for ambiguous, 1.0 for explicit)
- Classify the type accurately`;

  const result = await withRetry(
    async () => {
      const responseText = await callModel(prompt);
      return responseText;
    },
    2,
    1500
  );

  const parsed = parseJSON(result) as { keyDecisions?: KeyDecision[] } | null;
  if (!parsed?.keyDecisions || !Array.isArray(parsed.keyDecisions)) {
    log.warn('Failed to parse key decisions');
    return [];
  }

  return parsed.keyDecisions.map((d, i) => ({
    ...d,
    id: d.id || `kd_${i + 1}`,
    confidence: Math.max(0, Math.min(1, d.confidence ?? 0.7)),
  }));
}

// ─── Generate Meeting Summary ───────────────────────────────────────────────

export async function generateMeetingSummary(
  transcript: string,
  meetingTitle: string,
  meetingType: string,
  speakers: SpeakerInfo[]
): Promise<MeetingSummary> {
  
  const totalWords = speakers.reduce((s, sp) => s + sp.wordCount, 0);
  const speakerBreakdown = speakers
    .map(
      s =>
        `${s.name}: ${s.wordCount} words (${Math.round((s.wordCount / (totalWords || 1)) * 100)}%)`
    )
    .join(', ');

  const prompt = `You are an expert meeting analyst. Generate a comprehensive meeting summary.

Meeting: "${meetingTitle}" (type: ${meetingType})
Speakers: ${speakerBreakdown}

<transcript>
${transcript.slice(0, 40000)}
</transcript>

Return JSON:
{
  "executive": "2-3 sentence executive summary of the meeting",
  "agenda": ["Topic 1 discussed", "Topic 2 discussed", ...],
  "outcomes": ["Key outcome 1", "Key outcome 2", ...],
  "nextSteps": ["Next step 1 with owner if known", ...],
  "openQuestions": ["Unresolved question 1", ...],
  "sentiment": "positive|neutral|negative|mixed",
  "engagementScore": 0-100
}

Rules:
- Executive summary should capture the most important takeaway
- Agenda items should reflect what was actually discussed (not planned)
- Outcomes are concrete results or agreements reached
- Next steps are forward-looking actions agreed upon
- Open questions are things left unresolved
- Engagement score: 100 = everyone actively participating, balanced discussion; 0 = one person talking, no interaction
- Sentiment reflects the emotional tone of the meeting overall`;

  const result = await withRetry(
    async () => {
      const responseText = await callModel(prompt);
      return responseText;
    },
    2,
    1500
  );

  const parsed = parseJSON(result) as MeetingSummary | null;
  if (!parsed) {
    log.warn('Failed to parse meeting summary');
    return {
      executive: 'Summary generation failed.',
      agenda: [],
      outcomes: [],
      nextSteps: [],
      openQuestions: [],
      sentiment: 'neutral',
      engagementScore: 50,
    };
  }

  return {
    executive: parsed.executive || 'No summary available.',
    agenda: Array.isArray(parsed.agenda) ? parsed.agenda : [],
    outcomes: Array.isArray(parsed.outcomes) ? parsed.outcomes : [],
    nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
    openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
    sentiment: (['positive', 'neutral', 'negative', 'mixed'].includes(parsed.sentiment)
      ? parsed.sentiment
      : 'neutral') as MeetingSummary['sentiment'],
    engagementScore: Math.max(0, Math.min(100, parsed.engagementScore ?? 50)),
  };
}

// ─── Speaker Bias Analysis ──────────────────────────────────────────────────

export async function analyzeSpeakerBiases(
  segments: TranscriptSegment[],
  speakers: SpeakerInfo[]
): Promise<SpeakerBiasProfile[]> {
  

  // Build per-speaker transcript excerpts
  const speakerTexts = new Map<string, string[]>();
  for (const seg of segments) {
    const existing = speakerTexts.get(seg.speaker) || [];
    existing.push(seg.text);
    speakerTexts.set(seg.speaker, existing);
  }

  const speakerSections = Array.from(speakerTexts.entries())
    .map(([name, texts]) => `=== ${name} ===\n${texts.join('\n')}`)
    .join('\n\n');

  const totalWords = speakers.reduce((s, sp) => s + sp.wordCount, 0) || 1;

  const prompt = `You are an expert cognitive bias analyst. Analyze each speaker's contributions for cognitive biases and discussion dynamics.

For each speaker, identify:
1. Cognitive biases in their reasoning or language
2. Their dominance in the discussion (are they dominating or being marginalized?)
3. Whether they play a dissenter role (challenging groupthink)

Known speakers and their word counts:
${speakers.map(s => `- ${s.name}: ${s.wordCount} words (${Math.round((s.wordCount / totalWords) * 100)}%)`).join('\n')}

<speaker_contributions>
${speakerSections.slice(0, 40000)}
</speaker_contributions>

Return JSON:
{
  "speakerBiases": [
    {
      "speaker": "Speaker Name",
      "biases": [
        {
          "biasType": "anchoring|groupthink|confirmation_bias|availability_heuristic|authority_bias|framing_effect|sunk_cost|overconfidence|bandwagon|loss_aversion",
          "count": 1,
          "avgSeverity": 0.0-1.0,
          "examples": ["Brief quote showing the bias"]
        }
      ],
      "dominanceScore": 0-100,
      "dissenterScore": 0-100
    }
  ]
}

Rules:
- dominanceScore: 100 = completely dominates discussion, 0 = barely speaks
- dissenterScore: 100 = consistently challenges group, raises alternatives; 0 = always agrees
- Only include biases you can clearly identify from the text with evidence
- Include at least one example quote per bias`;

  const result = await withRetry(
    async () => {
      const responseText = await callModel(prompt);
      return responseText;
    },
    2,
    1500
  );

  const parsed = parseJSON(result) as { speakerBiases?: SpeakerBiasProfile[] } | null;
  if (!parsed?.speakerBiases || !Array.isArray(parsed.speakerBiases)) {
    log.warn('Failed to parse speaker biases');
    return [];
  }

  return parsed.speakerBiases.map(sb => ({
    speaker: sb.speaker,
    biases: Array.isArray(sb.biases)
      ? sb.biases.map(b => ({
          biasType: b.biasType || 'unknown',
          count: Math.max(1, b.count || 1),
          avgSeverity: Math.max(0, Math.min(1, b.avgSeverity ?? 0.5)),
          examples: Array.isArray(b.examples) ? b.examples : [],
        }))
      : [],
    dominanceScore: Math.max(0, Math.min(100, sb.dominanceScore ?? 50)),
    dissenterScore: Math.max(0, Math.min(100, sb.dissenterScore ?? 0)),
  }));
}

// ─── Institutional Memory (Similar Meetings) ────────────────────────────────

export async function findSimilarMeetings(
  meetingContent: string,
  userId: string,
  currentMeetingId: string
): Promise<SimilarMeeting[]> {
  try {
    const similarDocs = await searchSimilarDocuments(meetingContent, userId, 5);

    if (similarDocs.length === 0) {
      log.info('No similar past meetings found');
      return [];
    }

    // Filter out the current meeting itself and return as SimilarMeeting format
    return similarDocs
      .filter(doc => doc.documentId !== currentMeetingId)
      .slice(0, 3)
      .map(doc => ({
        meetingId: doc.documentId || '',
        title: doc.filename || 'Previous Meeting',
        similarity: Math.round(doc.similarity * 100) / 100,
        outcome: `Similarity score: ${Math.round(doc.similarity * 100)}%`,
        lessonsLearned: doc.content?.slice(0, 300) || '',
      }));
  } catch (e) {
    log.warn('Similar meetings search failed:', e instanceof Error ? e.message : String(e));
    return [];
  }
}

// ─── Full Meeting Intelligence Pipeline ─────────────────────────────────────

/**
 * Run all Phase 2 intelligence extraction in parallel.
 * Called after transcription + cognitive audit are complete.
 */
export async function extractMeetingIntelligence(
  transcript: string,
  segments: TranscriptSegment[],
  speakers: SpeakerInfo[],
  meetingTitle: string,
  meetingType: string,
  userId: string,
  meetingId: string
): Promise<MeetingIntelligenceResult> {
  log.info(
    `Extracting meeting intelligence for ${meetingId}: ${speakers.length} speakers, ${segments.length} segments`
  );

  // Run all extractions in parallel
  const [
    summaryResult,
    actionItemsResult,
    keyDecisionsResult,
    speakerBiasesResult,
    similarMeetingsResult,
  ] = await Promise.allSettled([
    generateMeetingSummary(transcript, meetingTitle, meetingType, speakers),
    extractActionItems(transcript, speakers),
    extractKeyDecisions(transcript, speakers),
    analyzeSpeakerBiases(segments, speakers),
    findSimilarMeetings(transcript, userId, meetingId),
  ]);

  const summary =
    summaryResult.status === 'fulfilled'
      ? summaryResult.value
      : {
          executive: 'Summary generation failed.',
          agenda: [],
          outcomes: [],
          nextSteps: [],
          openQuestions: [],
          sentiment: 'neutral' as const,
          engagementScore: 50,
        };

  if (summaryResult.status === 'rejected') {
    log.error('Meeting summary failed:', summaryResult.reason);
  }
  if (actionItemsResult.status === 'rejected') {
    log.error('Action items extraction failed:', actionItemsResult.reason);
  }
  if (keyDecisionsResult.status === 'rejected') {
    log.error('Key decisions extraction failed:', keyDecisionsResult.reason);
  }
  if (speakerBiasesResult.status === 'rejected') {
    log.error('Speaker bias analysis failed:', speakerBiasesResult.reason);
  }
  if (similarMeetingsResult.status === 'rejected') {
    log.error('Similar meetings search failed:', similarMeetingsResult.reason);
  }

  const result: MeetingIntelligenceResult = {
    summary,
    actionItems: actionItemsResult.status === 'fulfilled' ? actionItemsResult.value : [],
    keyDecisions: keyDecisionsResult.status === 'fulfilled' ? keyDecisionsResult.value : [],
    speakerBiases: speakerBiasesResult.status === 'fulfilled' ? speakerBiasesResult.value : [],
    similarMeetings:
      similarMeetingsResult.status === 'fulfilled' ? similarMeetingsResult.value : [],
  };

  log.info(
    `Meeting intelligence extracted: ${result.actionItems.length} action items, ${result.keyDecisions.length} decisions, ${result.speakerBiases.length} speaker profiles`
  );

  return result;
}
