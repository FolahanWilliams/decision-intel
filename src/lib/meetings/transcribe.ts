/**
 * Meeting Transcription Service — Phase 2
 *
 * Dual-provider transcription with real audio-based speaker diarization:
 *
 *   Provider 1 (preferred): AssemblyAI
 *     - Real audio-based speaker diarization (voice embeddings)
 *     - Per-word confidence scores
 *     - Auto language detection
 *     - Set ASSEMBLYAI_API_KEY to enable
 *
 *   Provider 2 (fallback): OpenAI Whisper + Gemini LLM diarization
 *     - Whisper for transcription
 *     - Gemini infers speakers from conversational cues (less accurate)
 *     - Always available as fallback
 */

import { createLogger } from '@/lib/utils/logger';
import { getRequiredEnvVar, getOptionalEnvVar } from '@/lib/env';
import { withRetry } from '@/lib/utils/resilience';
import { parseJSON } from '@/lib/utils/json';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
  provider: 'assemblyai' | 'whisper';
}

// ─── Provider Selection ─────────────────────────────────────────────────────

function getProvider(): 'assemblyai' | 'whisper' {
  try {
    const key = getOptionalEnvVar('ASSEMBLYAI_API_KEY', '');
    if (key && key.length > 0) return 'assemblyai';
  } catch {
    // env var not set — silent fallback to whisper per CLAUDE.md fire-and-forget exceptions.
  }
  return 'whisper';
}

// ─── AssemblyAI Transcription (Phase 2 — Real Diarization) ──────────────────

async function assemblyAITranscribe(
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string,
  participantHints: string[],
  onProgress?: (progress: number) => Promise<void>
): Promise<TranscriptionResult> {
  const apiKey = getRequiredEnvVar('ASSEMBLYAI_API_KEY');
  const baseUrl = 'https://api.assemblyai.com/v2';

  // Step 1: Upload audio (0-20%)
  await onProgress?.(5);
  const uploadRes = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': mimeType,
    },
    body: new Blob([new Uint8Array(audioBuffer)]),
  });

  if (!uploadRes.ok) {
    throw new Error(`AssemblyAI upload failed (${uploadRes.status}): ${await uploadRes.text()}`);
  }

  const { upload_url } = await uploadRes.json();
  await onProgress?.(20);

  // Step 2: Create transcription job with speaker diarization
  const transcriptRes = await fetch(`${baseUrl}/transcript`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      speaker_labels: true,
      speakers_expected:
        participantHints.length > 0 ? Math.min(participantHints.length, 10) : undefined,
      language_detection: true,
    }),
  });

  if (!transcriptRes.ok) {
    throw new Error(
      `AssemblyAI transcript creation failed (${transcriptRes.status}): ${await transcriptRes.text()}`
    );
  }

  const { id: transcriptId } = await transcriptRes.json();
  log.info(`AssemblyAI transcript job created: ${transcriptId}`);

  // Step 3: Poll for completion (20-80%)
  let attempts = 0;
  const maxAttempts = 300; // 25 minutes max (5s intervals)
  let transcriptData: AssemblyAITranscript | null = null;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    const pollRes = await fetch(`${baseUrl}/transcript/${transcriptId}`, {
      headers: { Authorization: apiKey },
    });

    if (!pollRes.ok) continue;

    const data = (await pollRes.json()) as AssemblyAITranscript;

    if (data.status === 'completed') {
      transcriptData = data;
      break;
    }

    if (data.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${data.error || 'unknown error'}`);
    }

    // Estimate progress (processing status)
    const progress = 20 + Math.min(60, (attempts / maxAttempts) * 60);
    await onProgress?.(progress);
  }

  if (!transcriptData) {
    throw new Error('AssemblyAI transcription timed out');
  }

  await onProgress?.(85);

  // Step 4: Build structured result from AssemblyAI response
  const utterances = transcriptData.utterances || [];
  const speakerMap = new Map<string, string>();

  // Map AssemblyAI speaker labels (A, B, C...) to participant names or Speaker 1, 2, 3...
  const uniqueSpeakers = [...new Set(utterances.map(u => u.speaker))].sort();
  uniqueSpeakers.forEach((label, i) => {
    const name = participantHints[i] || `Speaker ${i + 1}`;
    speakerMap.set(label, name);
  });

  // If we have more participant hints than speakers, try to match with Gemini
  if (participantHints.length > 0 && participantHints.length >= uniqueSpeakers.length) {
    try {
      const enrichedMap = await matchSpeakersToNames(utterances, uniqueSpeakers, participantHints);
      for (const [label, name] of enrichedMap) {
        speakerMap.set(label, name);
      }
    } catch (e) {
      log.warn(
        'Speaker name matching failed, using defaults:',
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  const segments: TranscriptSegment[] = utterances.map(u => ({
    speaker: speakerMap.get(u.speaker) || `Speaker ${u.speaker}`,
    text: u.text,
    startMs: u.start,
    endMs: u.end,
  }));

  // Build speaker stats
  const speakerStats = new Map<string, { speakTimeMs: number; wordCount: number }>();
  for (const seg of segments) {
    const existing = speakerStats.get(seg.speaker) || { speakTimeMs: 0, wordCount: 0 };
    existing.speakTimeMs += seg.endMs - seg.startMs;
    existing.wordCount += seg.text.split(/\s+/).filter(Boolean).length;
    speakerStats.set(seg.speaker, existing);
  }

  const speakers: SpeakerInfo[] = Array.from(speakerStats.entries()).map(([name, stats], i) => ({
    id: `speaker_${i + 1}`,
    name,
    speakTimeMs: stats.speakTimeMs,
    wordCount: stats.wordCount,
  }));

  const fullText = segments.map(seg => `[${seg.speaker}]: ${seg.text}`).join('\n');

  await onProgress?.(100);

  log.info(
    `AssemblyAI transcription complete: ${speakers.length} speakers, ${segments.length} utterances, confidence=${(transcriptData.confidence ?? 0).toFixed(2)}`
  );

  return {
    fullText,
    segments,
    speakers,
    language: transcriptData.language_code || 'en',
    confidence: transcriptData.confidence ?? 0.9,
    durationMs: transcriptData.audio_duration
      ? Math.round(transcriptData.audio_duration * 1000)
      : 0,
    provider: 'assemblyai',
  };
}

// ─── AssemblyAI Types ───────────────────────────────────────────────────────

interface AssemblyAITranscript {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text: string;
  utterances?: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
    confidence: number;
    words: Array<{
      text: string;
      start: number;
      end: number;
      confidence: number;
      speaker: string;
    }>;
  }>;
  confidence?: number;
  audio_duration?: number;
  language_code?: string;
  error?: string;
}

// ─── Speaker Name Matching (Gemini-assisted) ────────────────────────────────

async function matchSpeakersToNames(
  utterances: Array<{ speaker: string; text: string }>,
  speakerLabels: string[],
  participantNames: string[]
): Promise<Map<string, string>> {
  const apiKey = getRequiredEnvVar('GOOGLE_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getOptionalEnvVar('GEMINI_MODEL_NAME', 'gemini-3-flash-preview'),
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  // Sample utterances per speaker
  const speakerSamples: Record<string, string[]> = {};
  for (const u of utterances) {
    if (!speakerSamples[u.speaker]) speakerSamples[u.speaker] = [];
    if (speakerSamples[u.speaker].length < 5) {
      speakerSamples[u.speaker].push(u.text);
    }
  }

  const samplesText = Object.entries(speakerSamples)
    .map(([label, texts]) => `Speaker ${label}:\n${texts.map(t => `  "${t}"`).join('\n')}`)
    .join('\n\n');

  const prompt = `Given these speaker samples from a meeting and the known participant names, match each speaker label to the most likely participant.

Speaker labels: ${speakerLabels.join(', ')}
Known participants: ${participantNames.join(', ')}

${samplesText}

Return JSON: { "matches": [{ "label": "A", "name": "Alice" }, ...] }

Only match speakers you are confident about. Use "Speaker N" for uncertain matches.`;

  const result = await withRetry(
    async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    },
    1,
    1000
  );

  const parsed = parseJSON(result) as { matches?: Array<{ label: string; name: string }> } | null;
  const map = new Map<string, string>();

  if (parsed?.matches) {
    for (const m of parsed.matches) {
      if (m.label && m.name) {
        map.set(m.label, m.name);
      }
    }
  }

  return map;
}

// ─── Whisper Transcription (Fallback) ───────────────────────────────────────

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

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
  formData.append('file', blob, fileName);
  formData.append('model', whisperModel);
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
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
    segments: (data.segments || []).map((s: { start: number; end: number; text: string }) => ({
      start: s.start,
      end: s.end,
      text: s.text?.trim() || '',
    })),
  };
}

// ─── LLM-based Diarization (Whisper fallback) ──────────────────────────────

async function diarizeSpeakersLLM(
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
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
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

Given the following timestamped transcript segments, identify which speaker said each segment. Look for:
- Conversational cues ("I think...", "As [name] mentioned...", addressing others)
- Topic/perspective shifts suggesting different speakers
- Introduction patterns ("Hi, I'm...", "This is [name]...")
- Role-based language (financial terms -> CFO, legal terms -> counsel, etc.)

${participantContext}

Transcript segments:
${segmentText}

Return JSON:
{
  "speakers": [
    { "segmentIndex": 0, "speaker": "Speaker 1" },
    { "segmentIndex": 1, "speaker": "Speaker 2" },
    ...
  ]
}`;

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
    log.warn(
      'LLM diarization failed, falling back to single speaker:',
      e instanceof Error ? e.message : String(e)
    );
  }

  return segments.map(seg => ({
    speaker: 'Speaker',
    text: seg.text,
    startMs: Math.round(seg.start * 1000),
    endMs: Math.round(seg.end * 1000),
  }));
}

// ─── Main Transcription Pipeline ────────────────────────────────────────────

/**
 * Full transcription pipeline with automatic provider selection:
 *   - AssemblyAI if ASSEMBLYAI_API_KEY is set (real audio diarization)
 *   - Whisper + Gemini LLM diarization as fallback
 */
export async function transcribeMeeting(
  audioBuffer: Buffer,
  fileName: string,
  mimeType: string,
  participantHints: string[] = [],
  onProgress?: (progress: number) => Promise<void>
): Promise<TranscriptionResult> {
  const provider = getProvider();
  log.info(
    `Starting transcription: ${fileName} (${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB) via ${provider}`
  );

  // ── AssemblyAI Path (preferred) ──────────────────────────────────
  if (provider === 'assemblyai') {
    try {
      return await assemblyAITranscribe(
        audioBuffer,
        fileName,
        mimeType,
        participantHints,
        onProgress
      );
    } catch (e) {
      log.error(
        'AssemblyAI failed, falling back to Whisper:',
        e instanceof Error ? e.message : String(e)
      );
      // Fall through to Whisper
    }
  }

  // ── Whisper + LLM Diarization Path (fallback) ────────────────────
  await onProgress?.(10);
  const whisperResult = await whisperTranscribe(audioBuffer, fileName, mimeType);
  await onProgress?.(60);

  if (!whisperResult.text.trim()) {
    throw new Error('Transcription produced empty text — the audio may be silent or corrupt');
  }

  log.info(
    `Whisper complete: ${whisperResult.segments.length} segments, ${whisperResult.duration.toFixed(0)}s, lang=${whisperResult.language}`
  );

  await onProgress?.(65);
  const diarizedSegments = await diarizeSpeakersLLM(whisperResult.segments, participantHints);
  await onProgress?.(90);

  // Build speaker metadata
  const speakerStats = new Map<string, { speakTimeMs: number; wordCount: number }>();
  for (const seg of diarizedSegments) {
    const existing = speakerStats.get(seg.speaker) || { speakTimeMs: 0, wordCount: 0 };
    existing.speakTimeMs += seg.endMs - seg.startMs;
    existing.wordCount += seg.text.split(/\s+/).filter(Boolean).length;
    speakerStats.set(seg.speaker, existing);
  }

  const speakers: SpeakerInfo[] = Array.from(speakerStats.entries()).map(([name, stats], i) => ({
    id: `speaker_${i + 1}`,
    name,
    speakTimeMs: stats.speakTimeMs,
    wordCount: stats.wordCount,
  }));

  const fullText = diarizedSegments.map(seg => `[${seg.speaker}]: ${seg.text}`).join('\n');

  await onProgress?.(100);

  log.info(
    `Transcription complete (Whisper): ${speakers.length} speakers, ${diarizedSegments.length} segments`
  );

  return {
    fullText,
    segments: diarizedSegments,
    speakers,
    language: whisperResult.language,
    confidence: 0.85,
    durationMs: Math.round(whisperResult.duration * 1000),
    provider: 'whisper',
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
