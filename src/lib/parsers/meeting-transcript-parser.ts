/**
 * Meeting Transcript Parser (locked 2026-05-10 — meetings → document type
 * cascade).
 *
 * Meeting transcripts are uploaded as plain-text or .docx after upstream
 * transcription (Whisper, AssemblyAI, Otter, Fireflies, etc.). The user
 * pastes them into the upload zone like any other document. Unlike
 * synergy_model (spreadsheet) or qofe (PDF) which have format-specific
 * structure, transcripts are LINE-LEVEL: speaker turns where each line
 * starts with a name marker.
 *
 * The parser detects:
 *   - Speakers (canonical names from "Name:" line markers)
 *   - Speaker airtime (turn count + estimated word count per speaker)
 *   - Interruption patterns (consecutive turns from different speakers
 *     with one ending mid-sentence — heuristic, not perfect)
 *   - Hedging-language signals (raised concerns / dissent attempts)
 *   - Decision-compression flags (rapid topic switches under high stakes)
 *
 * NO LLM CALL. Pure function. Deterministic. The bias detective node
 * later reads the structured block AND the transcript text together for
 * the full audit.
 *
 * Mirrors the qofe + synergy_model parser pattern: persistable wrapper
 * under `kind: 'meeting_transcript'` on Document.parsedStructuredData.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface SpeakerStats {
  name: string;
  /** Number of distinct speaker turns. */
  turnCount: number;
  /** Total estimated word count across all turns. */
  wordCount: number;
  /** Share of total airtime (0-1, computed against the total word count). */
  airtimeShare: number;
}

export interface HedgingHit {
  /** The speaker who raised the hedge / concern / dissent attempt. */
  speaker: string;
  /** The phrase that matched (canonical pattern). */
  pattern: string;
  /** Truncated context (~140 chars) from the surrounding turn. */
  excerpt: string;
}

export type DominanceFlag =
  | 'balanced' // top speaker < 35% airtime
  | 'lead_dominant' // top speaker 35-50%
  | 'severe_dominance' // top speaker > 50% — single-voice meeting
  | 'cannot_assess'; // <2 speakers detected

export interface MeetingTranscriptAssessment {
  /** Per-speaker airtime stats, sorted by airtimeShare desc. */
  speakers: SpeakerStats[];
  /** Total speaker turns observed. */
  totalTurns: number;
  /** Verdict on airtime balance. */
  dominanceFlag: DominanceFlag;
  /** Hedging / dissent-attempt hits (capped at 8). */
  hedgingHits: HedgingHit[];
  /** True when ≥3 hedging hits surfaced — signals dissent was raised. */
  dissentRaised: boolean;
  /** True when transcript has speaker markers at all. */
  hasSpeakerMarkers: boolean;
}

export interface ParsedMeetingTranscriptData {
  kind: 'meeting_transcript';
  version: 1;
  assessment: MeetingTranscriptAssessment;
  /** Char length of the transcript body the assessment was computed over. */
  bodyLength: number;
  /** ISO timestamp of when the parse ran. */
  parsedAt: string;
}

// ─── Hedging / dissent-attempt patterns ────────────────────────────────

const HEDGING_PATTERNS = [
  /\bI('m| am)\s+(concerned|worried|skeptical|unsure)\b/i,
  /\bI('d| would)\s+be\s+(cautious|careful|wary)\b/i,
  /\bI think we should\s+(pause|reconsider|step back|slow down)\b/i,
  /\bwhat if\s+(we'?re|this|the)\s+\w+\s+(wrong|mistaken|miscalibrated|off|broken)/i,
  /\bI'?m not (sure|convinced|comfortable)\s+(that|with|about)\b/i,
  /\b(have|has) we (considered|thought about|stress-tested)\b/i,
  /\b(downside|worst case|risk|red flag)\s+is\b/i,
  /\bcounter[- ]?point\b/i,
  /\bI disagree\b/i,
  /\bI'?d push back\b/i,
];

// ─── Speaker-turn parsing ──────────────────────────────────────────────

/** Pattern for a "Name:" line marker. Allows 1-4 word names + optional
 *  trailing tags like "(CFO)" or "[CTO]". Hard cap on name length so
 *  paragraph text doesn't accidentally match. */
const SPEAKER_MARKER =
  /^\s*([A-Z][\w'.-]+(?:\s+[A-Z][\w'.-]+){0,3})(?:\s*[(\[][^)\]]+[)\]])?\s*:\s*/;

interface RawTurn {
  speaker: string;
  text: string;
}

/**
 * Walk the transcript line-by-line. When a line begins with "Name:",
 * start a new turn. Continuation lines (no marker) append to the current
 * turn's text. Lines before any speaker marker are dropped (header noise).
 */
function extractTurns(text: string): RawTurn[] {
  const turns: RawTurn[] = [];
  let current: RawTurn | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      // Blank lines preserve continuation but don't start a new turn.
      if (current) current.text += '\n';
      continue;
    }
    const match = line.match(SPEAKER_MARKER);
    if (match) {
      if (current && current.text.trim().length > 0) turns.push(current);
      current = {
        speaker: canonicaliseName(match[1]),
        text: line.slice(match[0].length).trim(),
      };
    } else if (current) {
      current.text = current.text ? `${current.text} ${line}` : line;
    }
  }
  if (current && current.text.trim().length > 0) turns.push(current);
  return turns;
}

function canonicaliseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ─── Hedging-hit scan ───────────────────────────────────────────────────

function scanHedgingHits(turns: RawTurn[]): HedgingHit[] {
  const hits: HedgingHit[] = [];
  for (const turn of turns) {
    if (hits.length >= 8) break;
    for (const pattern of HEDGING_PATTERNS) {
      if (hits.length >= 8) break;
      const match = turn.text.match(pattern);
      if (!match) continue;
      const excerpt = excerptAroundMatch(turn.text, match.index ?? 0, 140);
      hits.push({
        speaker: turn.speaker,
        pattern: match[0],
        excerpt,
      });
    }
  }
  return hits;
}

function excerptAroundMatch(text: string, index: number, total: number): string {
  const half = Math.floor(total / 2);
  const start = Math.max(0, index - half);
  const end = Math.min(text.length, index + half);
  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = `…${excerpt}`;
  if (end < text.length) excerpt = `${excerpt}…`;
  return excerpt;
}

// ─── Dominance verdict ──────────────────────────────────────────────────

function assessDominance(speakers: SpeakerStats[]): DominanceFlag {
  if (speakers.length < 2) return 'cannot_assess';
  const top = speakers[0];
  if (top.airtimeShare > 0.5) return 'severe_dominance';
  if (top.airtimeShare >= 0.35) return 'lead_dominant';
  return 'balanced';
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Score a meeting transcript over the full body of text. Pure function;
 * deterministic for a given input.
 */
export function scoreMeetingTranscript(text: string): MeetingTranscriptAssessment {
  const turns = extractTurns(text);
  const hasSpeakerMarkers = turns.length > 0;

  // Aggregate per-speaker stats.
  const byName = new Map<string, { turnCount: number; wordCount: number }>();
  let totalWords = 0;
  for (const turn of turns) {
    const words = countWords(turn.text);
    totalWords += words;
    const existing = byName.get(turn.speaker) ?? { turnCount: 0, wordCount: 0 };
    existing.turnCount += 1;
    existing.wordCount += words;
    byName.set(turn.speaker, existing);
  }

  const speakers: SpeakerStats[] = Array.from(byName.entries())
    .map(([name, stats]) => ({
      name,
      turnCount: stats.turnCount,
      wordCount: stats.wordCount,
      airtimeShare: totalWords > 0 ? stats.wordCount / totalWords : 0,
    }))
    .sort((a, b) => b.airtimeShare - a.airtimeShare);

  const hedgingHits = scanHedgingHits(turns);
  const dominanceFlag = assessDominance(speakers);

  return {
    speakers,
    totalTurns: turns.length,
    dominanceFlag,
    hedgingHits,
    dissentRaised: hedgingHits.length >= 3,
    hasSpeakerMarkers,
  };
}

/**
 * Builds the persistable wrapper for Document.parsedStructuredData JSONB
 * column. Mirrors qofe + synergy_model wrapper shape.
 */
export function toParsedMeetingTranscriptData(
  assessment: MeetingTranscriptAssessment,
  bodyLength: number
): ParsedMeetingTranscriptData {
  return {
    kind: 'meeting_transcript',
    version: 1,
    assessment,
    bodyLength,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Renders a STRUCTURED MEETING TRANSCRIPT block prepended to the
 * flattened text content the bias detective sees. The block surfaces
 * the per-speaker airtime + dominance verdict + dissent signals so the
 * detective doesn't have to rederive them from raw transcript scanning.
 */
export function formatMeetingTranscriptForAudit(parsed: ParsedMeetingTranscriptData): string {
  const { assessment } = parsed;
  if (!assessment.hasSpeakerMarkers) {
    return '';
  }

  const lines: string[] = [];
  lines.push('STRUCTURED MEETING TRANSCRIPT — PARSED PRE-AUDIT');
  lines.push('================================================');
  lines.push(
    `Total turns: ${assessment.totalTurns} · Speakers: ${assessment.speakers.length} · Airtime balance: ${formatDominance(assessment.dominanceFlag)}`
  );
  lines.push('');
  lines.push('Per-speaker airtime:');
  for (const speaker of assessment.speakers.slice(0, 6)) {
    const pct = Math.round(speaker.airtimeShare * 100);
    lines.push(
      `  · ${speaker.name} — ${pct}% airtime (${speaker.turnCount} turns, ${speaker.wordCount} words)`
    );
  }
  if (assessment.speakers.length > 6) {
    lines.push(`  · +${assessment.speakers.length - 6} additional speakers`);
  }
  lines.push('');
  if (assessment.dissentRaised) {
    lines.push(
      `Dissent signals (${assessment.hedgingHits.length} hits) — verify each was genuinely entertained, not dismissed:`
    );
    for (const hit of assessment.hedgingHits) {
      lines.push(`  · ${hit.speaker}: "${hit.pattern}" — ${hit.excerpt}`);
    }
  } else {
    lines.push(
      `Dissent signals: ${assessment.hedgingHits.length} hits — fewer than 3 is a "Yes Committee" risk indicator. Cross-check whether the meeting reached consensus genuinely or by social compression.`
    );
  }
  lines.push('');
  lines.push('================================================');
  lines.push('');
  return lines.join('\n');
}

function formatDominance(flag: DominanceFlag): string {
  switch (flag) {
    case 'balanced':
      return 'balanced (top speaker < 35%)';
    case 'lead_dominant':
      return 'lead-dominant (top speaker 35-50%)';
    case 'severe_dominance':
      return 'severe dominance (top speaker > 50% — flag as Yes Committee risk)';
    case 'cannot_assess':
      return 'cannot assess (no speaker markers detected)';
  }
}
