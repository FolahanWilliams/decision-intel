/**
 * Meeting Processing Pipeline
 *
 * Orchestrates the full lifecycle of a meeting recording:
 *   1. Download audio from Supabase Storage
 *   2. Transcribe via Whisper + LLM diarization
 *   3. Store transcript in MeetingTranscript
 *   4. Create a HumanDecision from the transcript
 *   5. Run cognitive audit on the decision
 *
 * Runs in the background (fire-and-forget from the upload route).
 */

import { prisma } from '@/lib/prisma';
// Dynamic import to avoid top-level env var check during build
// import { getServiceSupabase } from '@/lib/supabase';
import { transcribeMeeting } from '@/lib/meetings/transcribe';
import { extractMeetingIntelligence } from '@/lib/meetings/intelligence';
import { predictDecisionQuality } from '@/lib/meetings/quality-predictor';
import { analyzeHumanDecision } from '@/lib/human-audit/analyzer';
import { toPrismaJson, toPrismaStringArray } from '@/lib/utils/prisma-json';
import { storeHumanDecisionEmbedding } from '@/lib/rag/embeddings';
import { generateNudges } from '@/lib/nudges/engine';
import { createLogger } from '@/lib/utils/logger';
import { logAudit } from '@/lib/audit';
import {
  BiasFindings,
  CognitiveAuditNoiseStats,
  CognitiveAuditSentiment,
  CognitiveAuditCompliance,
  CognitiveAuditPreMortem,
  CognitiveAuditLogicalAnalysis,
  CognitiveAuditSwot,
} from '@/lib/schemas/human-audit';
import crypto from 'crypto';
import type { HumanDecisionInput } from '@/types/human-audit';

const log = createLogger('MeetingProcess');

/**
 * Process a meeting recording end-to-end.
 * Called in the background after a successful upload.
 */
export async function processMeeting(meetingId: string, userId: string): Promise<void> {
  try {
    // Fetch meeting record
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);
    if (!meeting.storagePath) throw new Error('No storage path for meeting');

    // ── Step 1: Download audio from Supabase Storage ──────────────────
    await updateStatus(meetingId, 'transcribing', 0);

    const { getServiceSupabase } = await import('@/lib/supabase');
    const supabase = getServiceSupabase();
    const bucket = process.env.SUPABASE_MEETING_BUCKET || 'meetings';
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(meeting.storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download recording: ${downloadError?.message || 'no data'}`);
    }

    const audioBuffer = Buffer.from(await fileData.arrayBuffer());
    log.info(`Downloaded recording: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`);

    // ── Step 2: Transcribe ────────────────────────────────────────────
    const transcriptionResult = await transcribeMeeting(
      audioBuffer,
      meeting.fileName || 'recording.webm',
      meeting.fileType || 'audio/webm',
      meeting.participants,
      async progress => {
        await updateStatus(meetingId, 'transcribing', progress);
      }
    );

    // ── Step 3: Store transcript ──────────────────────────────────────
    await prisma.meetingTranscript.create({
      data: {
        meetingId,
        speakers: JSON.parse(JSON.stringify(transcriptionResult.speakers)),
        segments: JSON.parse(JSON.stringify(transcriptionResult.segments)),
        fullText: transcriptionResult.fullText,
        language: transcriptionResult.language,
        confidence: transcriptionResult.confidence,
      },
    });

    // Update meeting with duration
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        durationSeconds: Math.round(transcriptionResult.durationMs / 1000),
        participants:
          transcriptionResult.speakers.length > 0
            ? toPrismaStringArray(transcriptionResult.speakers.map(s => s.name))
            : meeting.participants,
      },
    });

    log.info(
      `Transcript stored: ${transcriptionResult.segments.length} segments, ${transcriptionResult.speakers.length} speakers`
    );

    // Audit log
    logAudit({
      action: 'MEETING_TRANSCRIBED',
      resource: 'Meeting',
      resourceId: meetingId,
      details: {
        speakers: transcriptionResult.speakers.length,
        segments: transcriptionResult.segments.length,
        durationSeconds: Math.round(transcriptionResult.durationMs / 1000),
        language: transcriptionResult.language,
      },
    }).catch(() => {});

    // ── Step 3b: Extract meeting intelligence (Phase 2) ──────────────
    // Runs in parallel with audit preparation — action items, key decisions,
    // summary, speaker biases, and similar past meetings
    const intelligencePromise = extractMeetingIntelligence(
      transcriptionResult.fullText,
      transcriptionResult.segments,
      transcriptionResult.speakers,
      meeting.title,
      meeting.meetingType,
      userId,
      meetingId
    ).catch(err => {
      log.error('Meeting intelligence extraction failed:', err);
      return null;
    });

    // ── Step 4: Create HumanDecision from transcript ──────────────────
    await updateStatus(meetingId, 'analyzing', 0);

    const contentHash = crypto
      .createHash('sha256')
      .update(transcriptionResult.fullText)
      .digest('hex');

    // Build the decision content with meeting metadata header
    const decisionContent = [
      `Meeting: ${meeting.title}`,
      `Type: ${meeting.meetingType}`,
      `Participants: ${transcriptionResult.speakers.map(s => s.name).join(', ')}`,
      `Duration: ${formatDuration(transcriptionResult.durationMs)}`,
      '',
      '--- TRANSCRIPT ---',
      '',
      transcriptionResult.fullText,
    ].join('\n');

    const humanDecision = await prisma.humanDecision.create({
      data: {
        userId,
        source: 'meeting_transcript',
        channel: meeting.title,
        decisionType: meeting.meetingType === 'strategic_planning' ? 'strategic' : undefined,
        participants: toPrismaStringArray(transcriptionResult.speakers.map(s => s.name)),
        content: decisionContent,
        contentHash,
        status: 'pending',
      },
    });

    // Link meeting to the human decision
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { humanDecisionId: humanDecision.id },
    });

    // ── Step 5: Run cognitive audit ───────────────────────────────────
    const input: HumanDecisionInput = {
      source: 'meeting_transcript',
      channel: meeting.title,
      decisionType: meeting.meetingType === 'strategic_planning' ? 'strategic' : undefined,
      participants: transcriptionResult.speakers.map(s => s.name),
      content: decisionContent,
    };

    const auditResult = await analyzeHumanDecision(input, { userId, decisionId: humanDecision.id });

    // Validate and persist (same pattern as /api/human-decisions runCognitiveAudit)
    const validatedBiases = BiasFindings.safeParse(auditResult.biasFindings).success
      ? auditResult.biasFindings
      : BiasFindings.parse([]);
    const validatedNoiseStats = CognitiveAuditNoiseStats.safeParse(auditResult.noiseStats).success
      ? auditResult.noiseStats
      : CognitiveAuditNoiseStats.parse({});
    const validatedSentiment = CognitiveAuditSentiment.safeParse(auditResult.sentimentDetail)
      .success
      ? auditResult.sentimentDetail
      : CognitiveAuditSentiment.parse({});
    const validatedCompliance =
      auditResult.complianceResult &&
      CognitiveAuditCompliance.safeParse(auditResult.complianceResult).success
        ? auditResult.complianceResult
        : undefined;
    const validatedPreMortem =
      auditResult.preMortem && CognitiveAuditPreMortem.safeParse(auditResult.preMortem).success
        ? auditResult.preMortem
        : undefined;
    const validatedLogicalAnalysis =
      auditResult.logicalAnalysis &&
      CognitiveAuditLogicalAnalysis.safeParse(auditResult.logicalAnalysis).success
        ? auditResult.logicalAnalysis
        : undefined;
    const validatedSwot =
      auditResult.swotAnalysis && CognitiveAuditSwot.safeParse(auditResult.swotAnalysis).success
        ? auditResult.swotAnalysis
        : undefined;

    await prisma.$transaction(async tx => {
      await tx.cognitiveAudit.create({
        data: {
          humanDecisionId: humanDecision.id,
          decisionQualityScore: auditResult.decisionQualityScore,
          noiseScore: auditResult.noiseScore,
          sentimentScore: auditResult.sentimentScore,
          biasFindings: toPrismaJson(validatedBiases),
          noiseStats: toPrismaJson(validatedNoiseStats),
          sentimentDetail: toPrismaJson(validatedSentiment),
          complianceResult: validatedCompliance ? toPrismaJson(validatedCompliance) : undefined,
          preMortem: validatedPreMortem ? toPrismaJson(validatedPreMortem) : undefined,
          logicalAnalysis: validatedLogicalAnalysis
            ? toPrismaJson(validatedLogicalAnalysis)
            : undefined,
          swotAnalysis: validatedSwot ? toPrismaJson(validatedSwot) : undefined,
          teamConsensusFlag: auditResult.teamConsensusFlag,
          dissenterCount: auditResult.dissenterCount,
          summary: auditResult.summary,
        },
      });

      await tx.humanDecision.update({
        where: { id: humanDecision.id },
        data: { status: 'analyzed' },
      });
    });

    // Embed for RAG
    storeHumanDecisionEmbedding(
      humanDecision.id,
      decisionContent,
      userId,
      auditResult.summary
    ).catch(err => log.error('Meeting embedding failed:', err));

    // Generate nudges
    const nudges = await generateNudges({ decision: input, auditResult });
    for (const nudge of nudges) {
      await prisma.nudge
        .create({
          data: {
            humanDecisionId: humanDecision.id,
            nudgeType: nudge.nudgeType,
            triggerReason: nudge.triggerReason,
            message: nudge.message,
            severity: nudge.severity,
            channel: nudge.channel,
          },
        })
        .catch(err => log.error('Failed to persist nudge:', err));
    }

    // ── Step 6: Store meeting intelligence results ──────────────────
    const intelligence = await intelligencePromise;
    if (intelligence) {
      await prisma.meeting
        .update({
          where: { id: meetingId },
          data: {
            summary: intelligence.summary.executive,
            actionItems: JSON.parse(JSON.stringify(intelligence.actionItems)),
            keyDecisions: JSON.parse(JSON.stringify(intelligence.keyDecisions)),
            speakerBiases: JSON.parse(JSON.stringify(intelligence.speakerBiases)),
            similarMeetings: JSON.parse(JSON.stringify(intelligence.similarMeetings)),
          },
        })
        .catch(err => log.error('Failed to store meeting intelligence:', err));

      // Compute meeting decision quality prediction while full summary is available
      const qualityPrediction = predictDecisionQuality(
        intelligence.summary,
        intelligence.speakerBiases,
        intelligence.keyDecisions
      );

      log.info(
        `Intelligence stored: ${intelligence.actionItems.length} actions, ${intelligence.keyDecisions.length} decisions, quality=${qualityPrediction.predictedScore} (confidence=${qualityPrediction.confidence})`
      );
    }

    // ── Done ──────────────────────────────────────────────────────────
    await updateStatus(meetingId, 'complete', 100);
    log.info(
      `Meeting ${meetingId} fully processed: score=${auditResult.decisionQualityScore}, biases=${auditResult.biasFindings.length}`
    );
  } catch (error) {
    log.error(`Meeting processing failed for ${meetingId}:`, error);
    await prisma.meeting
      .update({
        where: { id: meetingId },
        data: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      })
      .catch(() => {});
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function updateStatus(meetingId: string, status: string, progress: number) {
  await prisma.meeting
    .update({
      where: { id: meetingId },
      data: { status, transcriptionProgress: progress },
    })
    .catch(() => {});
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
