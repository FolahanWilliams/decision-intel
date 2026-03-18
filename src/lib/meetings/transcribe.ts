/**
 * Meeting Transcription Service
 *
 * Uses OpenAI Whisper API for speech-to-text transcription.
 * Produces timestamped, speaker-labeled transcript segments.
 *
 * For speaker diarization, we use a two-pass approach:
 *   1. Whisper transcribes audio with word-level timestamps
 *   2. A lightweight LLM pass identifies speaker changes from conversational cues
 *
 * This avoids needing pyannote or a dedicated diarization API for Phase 1.
 */

import { createLogger } from '@/lib/utils/logger';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { withRetry } from '@/lib/utils/resilience';
import { parseJSON } from '@/lib/utils/json';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const log = createLogger('Transcription');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TranscriptSegment {
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
}

export interface SpeakerInfo {
  id: string;
  name: string;
  speakTimeMs: number;
  wordCount: number;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  speakers: SpeakerInfo[];
  language: string;
  confidence: number;
  durationMs: number;
}

// ─── Whisper Transcription ──────────────────────────────────────────────────

/**
 * Transcribe an audio buffer using OpenAI Whisper API.
 * Returns raw text with word-level timestamps.
 */
async function whisperTranscribe(
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{
  text: string;
  language: string;
  duration: number;
  segments: Array<{ start: number; end: number; text: string }>;
}> {
  const apiKey = getRequiredEnvVar('OPENAI_API_KEY');
  const whisperModel = getOptionalEnvVar('WHISPER_MODEL', 'whisper-1');

  // OpenAI Whisper API expects multipart form data
  const formData = new FormData();

  // Convert Buffer to Blob for FormData (use Uint8Array to avoid Buffer/BlobPart type mismatch)
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append('file', blob, fileName);
  formData.append('model', whisperModel);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    text: data.text || '',
    language: data.language || 'en',
    duration: data.duration || 0,
    segments: (data.segments || []).map(
      (s: { start: number; end: number; text: string }) => ({
        start: s.start,
        end: s.end,
        text: s.text?.trim() || '',
      })
    ),
  };
}

// ─── Speaker Diarization (LLM-based) ───────────────────────────────────────

/**
 * Uses Gemini to identify distinct speakers in a transcript.
 * This is a lightweight Phase 1 approach — Phase 2 will use proper
 * audio-based diarization (pyannote / AssemblyAI).
 */
async function diarizeSpeakers(
  rawText: string,
  segments: Array<{ start: number; end: number; text: string }>,
  participantHints: string[]
): Promise<TranscriptSegment[]> {
  try {
    const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview'),
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 16384,
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const segmentText = segments
      .map((s, i) => `[${i}] (${formatTime(s.start)} - ${formatTime(s.end)}): ${s.text}`)
      .join('\n');

    const participantContext =
      participantHints.length > 0
        ? `Known participants: ${participantHints.join(', ')}`
        : 'Participants are unknown — label them as Speaker 1, Speaker 2, etc.';

    const prompt = `You are a meeting transcript speaker identification expert.

Given the following timestamped transcript segments from a meeting recording, identify which speaker said each segment. Look for:
- Conversational cues ("I think...", "As [name] mentioned...", addressing others)
- Topic/perspective shifts that suggest a different person speaking
- Introduction patterns ("Hi, I'm...", "This is [name]...")
- Role-based language (financial terms → CFO, legal terms → counsel, etc.)

${participantContext}

Transcript segments:
${segmentText}

Return JSON array where each element maps to the same index as the input segments:
{
  "speakers": [
    { "segmentIndex": 0, "speaker": "Speaker 1" },
    { "segmentIndex": 1, "speaker": "Speaker 2" },
    ...
  ]
}

Rules:
- Use participant names if you can identify them, otherwise use "Speaker 1", "Speaker 2", etc.
- Be consistent — the same person should always have the same label
- When unsure, assign based on conversational flow (consecutive similar-topic segments are likely the same speaker)`;

    const result = await withRetry(
      async () => {
        const response = await model.generateContent(prompt);
        return response.response.text();
      },
      2,
      1500
    );

    const parsed = parseJSON(result) as {
      speakers?: Array<{ segmentIndex: number; speaker: string }>;
    } | null;

    if (parsed?.speakers && Array.isArray(parsed.speakers)) {
      const speakerMap = new Map<number, string>();
      for (const s of parsed.speakers) {
        speakerMap.set(s.segmentIndex, s.speaker);
      }

      return segments.map((seg, i) => ({
        speaker: speakerMap.get(i) || 'Unknown Speaker',
        text: seg.text,
        startMs: Math.round(seg.start * 1000),
        endMs: Math.round(seg.end * 1000),
      }));
    }
  } catch (e) {
    log.warn('Speaker diarization failed, falling back to single speaker:', e instanceof Error ? e.message : String(e));
  }

  // Fallback: all segments attributed to a single speaker
  return segments.map(seg => ({
    speaker: 'Speaker',
    text: seg.text,
    startMs: Math.round(seg.start * 1000),
    endMs: Math.round(seg.end * 1000),
  }));
}

// ─── Main Transcription Pipeline ────────────────────────────────────────────

/**
 * Full transcription pipeline:
 * 1. Whisper transcribes audio → text with timestamps
 * 2. Gemini identifies speakers per segment
 * 3. Builds structured transcript with speaker metadata
 */
export async function transcribeMeeting(
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string,
  participantHints: string[] = [],
  onProgress?: (progress: number) => Promise<void>
): Promise<TranscriptionResult> {
  log.info(`Starting transcription: ${fileName} (${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB)`);

  // Step 1: Whisper transcription (0-60% progress)
  await onProgress?.(10);
  const whisperResult = await whisperTranscribe(audioBuffer, fileName, mimeType);
  await onProgress?.(60);

  if (!whisperResult.text.trim()) {
    throw new Error('Transcription produced empty text — the audio may be silent or corrupt');
  }

  log.info(`Whisper complete: ${whisperResult.segments.length} segments, ${whisperResult.duration.toFixed(0)}s, lang=${whisperResult.language}`);

  // Step 2: Speaker diarization (60-90% progress)
  await onProgress?.(65);
  const diarizedSegments = await diarizeSpeakers(
    whisperResult.text,
    whisperResult.segments,
    participantHints
  );
  await onProgress?.(90);

  // Step 3: Build speaker metadata
  const speakerStats = new Map<string, { speakTimeMs: number; wordCount: number }>();
  for (const seg of diarizedSegments) {
    const existing = speakerStats.get(seg.speaker) || { speakTimeMs: 0, wordCount: 0 };
    existing.speakTimeMs += seg.endMs - seg.startMs;
    existing.wordCount += seg.text.split(/\s+/).filter(Boolean).length;
    speakerStats.set(seg.speaker, existing);
  }

  const speakers: SpeakerInfo[] = Array.from(speakerStats.entries()).map(
    ([name, stats], i) => ({
      id: `speaker_${i + 1}`,
      name,
      speakTimeMs: stats.speakTimeMs,
      wordCount: stats.wordCount,
    })
  );

  // Build full text with speaker labels
  const fullText = diarizedSegments
    .map(seg => `[${seg.speaker}]: ${seg.text}`)
    .join('\n');

  await onProgress?.(100);

  log.info(`Transcription complete: ${speakers.length} speakers, ${diarizedSegments.length} segments`);

  return {
    fullText,
    segments: diarizedSegments,
    speakers,
    language: whisperResult.language,
    confidence: 0.85, // Whisper doesn't return per-segment confidence easily; use a reasonable default
    durationMs: Math.round(whisperResult.duration * 1000),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
