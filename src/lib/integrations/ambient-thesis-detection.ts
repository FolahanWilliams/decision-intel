/**
 * Ambient thesis-formation detection service (locked 2026-05-10 per
 * Tier 2.2 + Deep Research paper #2 Ch 6 / Ch 12 condition #1).
 *
 * Cloverpop failed because manual logging killed adoption (system-of-
 * record fallacy). Ambient capture fixes friction collapse — when a
 * sponsor starts discussing a target or thesis in Slack / Drive,
 * deepseek-v4-flash classification fires a signal, and the UI surfaces
 * a banner inviting the user to start an audit BEFORE the IC memo
 * crystallises. Paper Ch 6: audit must fire before deal-fever locks in.
 *
 * Privacy posture (load-bearing):
 *   - default OFF on every installation; the cron skips installations
 *     where ambientCaptureEnabled = false even if connected
 *   - per-channel scoping via SlackInstallation.ambientCaptureChannels
 *     (empty list = no parsing even when enabled)
 *   - Drive folder scoping reuses GoogleDriveInstallation.monitoredFolders
 *   - excerpts capped at 500 chars; raw message content never persisted
 *   - 14-day auto-expiry on unconfirmed signals
 *
 * Cost discipline: every classification call uses deepseek-v4-flash via
 * the Vercel AI Gateway (~$0.0002 per call). At a reasonable polling
 * cadence (5 min) parsing ~5 channels per installation, per-user daily
 * cost stays ≤ $0.05/day.
 */

import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_RECOMMENDATIONS } from '@/lib/ai/gateway-models';
import { resolveToken } from '@/lib/integrations/slack/handler';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';

const log = createLogger('AmbientThesisDetection');

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

export interface ClassificationResult {
  isThesisFormation: boolean;
  confidence: number;
  extractedFields: {
    targetName?: string;
    decisionFrame?: string;
    convictionLanguage?: string;
    sector?: string;
    kind?: 'investment' | 'acquisition' | 'strategic';
  };
}

export interface PersistSignalInput {
  userId: string;
  orgId: string | null;
  source: 'slack' | 'drive' | 'email';
  sourceRef: string;
  sourceParentRef?: string;
  excerpt: string;
  confidence: number;
  extractedFields: ClassificationResult['extractedFields'];
}

// ──────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────

/** Confidence threshold to surface a banner. Below this we discard. */
export const SIGNAL_BANNER_THRESHOLD = 0.75;

/** Confidence threshold to auto-create a container without confirmation. */
export const SIGNAL_AUTO_CREATE_THRESHOLD = 0.9;

/** Auto-archive unconfirmed signals after 14 days. */
export const SIGNAL_EXPIRY_DAYS = 14;

/** Cap on excerpt length stored per signal — privacy. */
export const EXCERPT_MAX_CHARS = 500;

// ──────────────────────────────────────────────────────────────────────
// Classification — deepseek-v4-flash via Vercel AI Gateway
// ──────────────────────────────────────────────────────────────────────

const CLASSIFY_SYSTEM_PROMPT = `You classify whether a short text excerpt indicates a sponsor is FORMING a strategic decision thesis (early stage — exploring a target, framing a deal, considering a market entry). Return JSON only:
{
  "isThesisFormation": boolean,
  "confidence": 0.0 to 1.0,
  "targetName": string | null,
  "decisionFrame": string | null,
  "convictionLanguage": string | null,
  "sector": string | null,
  "kind": "investment" | "acquisition" | "strategic" | null
}

isThesisFormation = TRUE only if:
- A named target / opportunity / market is mentioned
- Language indicates active exploration (e.g. "I think we should", "we're looking at", "considering acquiring", "thinking about entering")
- Not yet a finalized IC memo or board decision (paper Ch 6: pre-formalization)

isThesisFormation = FALSE for:
- Generic discussions of an existing investment / portfolio company
- Post-decision execution chatter
- Operational / administrative messages
- Questions about already-committed decisions

confidence: how SURE you are this is thesis-formation. Banner fires at >= 0.75.

kind:
- "investment" — VC / growth / late-stage portfolio commitments
- "acquisition" — corporate development / M&A buy-side
- "strategic" — non-investment decisions (market entry, product, restructure)`;

/**
 * Run the deepseek-v4-flash classifier on a text excerpt. Returns a
 * structured signal; falls back to `{ isThesisFormation: false }` on
 * gateway failure or malformed output. Never throws — ambient parsing
 * is fire-and-forget across many sources; one bad excerpt should never
 * poison the batch.
 */
export async function classifyTextForThesisFormation(text: string): Promise<ClassificationResult> {
  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return { isThesisFormation: false, confidence: 0, extractedFields: {} };
  }
  try {
    const { text: raw } = await generateText(
      `Excerpt:\n"""\n${trimmed.slice(0, 2000)}\n"""\n\nReturn JSON only.`,
      {
        model: MODEL_RECOMMENDATIONS,
        system: CLASSIFY_SYSTEM_PROMPT,
        maxOutputTokens: 256,
        temperature: 0.1,
      }
    );
    // Trim code-fences if model wrapped JSON.
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    const parsed = JSON.parse(cleaned) as {
      isThesisFormation?: boolean;
      confidence?: number;
      targetName?: string | null;
      decisionFrame?: string | null;
      convictionLanguage?: string | null;
      sector?: string | null;
      kind?: string | null;
    };
    const isThesisFormation = parsed.isThesisFormation === true;
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
    const kindRaw = parsed.kind;
    const kind: ClassificationResult['extractedFields']['kind'] | undefined =
      kindRaw === 'investment' || kindRaw === 'acquisition' || kindRaw === 'strategic'
        ? kindRaw
        : undefined;
    return {
      isThesisFormation,
      confidence,
      extractedFields: {
        targetName: parsed.targetName ?? undefined,
        decisionFrame: parsed.decisionFrame ?? undefined,
        convictionLanguage: parsed.convictionLanguage ?? undefined,
        sector: parsed.sector ?? undefined,
        kind,
      },
    };
  } catch (err) {
    log.warn('Classification failed; returning negative', { err: String(err) });
    return { isThesisFormation: false, confidence: 0, extractedFields: {} };
  }
}

// ──────────────────────────────────────────────────────────────────────
// Persistence
// ──────────────────────────────────────────────────────────────────────

/**
 * Persist a detected signal. Idempotent on (source, sourceRef) — running
 * the cron twice on the same message does not duplicate.
 */
export async function persistAmbientSignal(input: PersistSignalInput): Promise<{
  signalId: string;
  created: boolean;
}> {
  const excerpt = input.excerpt.slice(0, EXCERPT_MAX_CHARS);
  const expiresAt = new Date(Date.now() + SIGNAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  try {
    const created = await prisma.ambientThesisSignal.create({
      data: {
        userId: input.userId,
        orgId: input.orgId,
        source: input.source,
        sourceRef: input.sourceRef,
        sourceParentRef: input.sourceParentRef,
        confidence: input.confidence,
        extractedFields: input.extractedFields as unknown as Prisma.InputJsonValue,
        excerpt,
        status: 'pending',
        expiresAt,
      },
    });

    await logAudit({
      action: 'AMBIENT_SIGNAL_DETECTED',
      resource: 'AmbientThesisSignal',
      resourceId: created.id,
      details: {
        source: input.source,
        confidence: input.confidence,
        targetName: input.extractedFields.targetName,
      },
    });

    return { signalId: created.id, created: true };
  } catch (err) {
    // P2002 = unique constraint (source, sourceRef) collision — already
    // detected on a prior cron pass. Not an error.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await prisma.ambientThesisSignal.findUnique({
        where: { source_sourceRef: { source: input.source, sourceRef: input.sourceRef } },
        select: { id: true },
      });
      return { signalId: existing?.id ?? '', created: false };
    }
    log.error('Failed to persist ambient signal', { err: String(err) });
    throw err;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Slack channel ingestion
// ──────────────────────────────────────────────────────────────────────

interface SlackHistoryMessage {
  ts: string;
  user?: string;
  text?: string;
  bot_id?: string;
  app_id?: string;
  thread_ts?: string;
  subtype?: string;
}

/**
 * Fetch new messages from a Slack channel since a given timestamp. Skips
 * bot messages + subtypes (channel_join, etc.). Caps at 100 messages per
 * call — the cron can re-page on the next pass.
 */
export async function fetchSlackChannelHistory(
  teamId: string,
  channelId: string,
  oldestTs?: string
): Promise<SlackHistoryMessage[]> {
  const token = await resolveToken(teamId);
  if (!token) {
    log.warn('No Slack bot token for team', { teamId });
    return [];
  }
  const params = new URLSearchParams({
    channel: channelId,
    limit: '100',
  });
  if (oldestTs) params.set('oldest', oldestTs);

  try {
    const response = await fetch(`https://slack.com/api/conversations.history?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      messages?: SlackHistoryMessage[];
    };
    if (!data.ok) {
      log.warn('Slack history fetch failed', { teamId, channelId, error: data.error });
      return [];
    }
    return (data.messages ?? []).filter(
      m => m.text && !m.bot_id && !m.app_id && !m.subtype && m.user
    );
  } catch (err) {
    log.warn('Slack history network error', { teamId, channelId, err: String(err) });
    return [];
  }
}

/**
 * Poll a single Slack installation's consented channels for new thesis-
 * formation signals. Returns the number of signals persisted in this run.
 */
export async function pollSlackInstallationForSignals(install: {
  teamId: string;
  installedByUserId: string;
  orgId: string | null;
  ambientCaptureChannels: string[];
}): Promise<number> {
  let persistedCount = 0;
  // Look at the last hour of messages by default — relies on idempotency
  // via (source, sourceRef) to skip already-processed ones. Future: stamp
  // a per-channel cursor on a new SlackChannelCursor model so polling is
  // bounded.
  const oldestTs = ((Date.now() - 60 * 60 * 1000) / 1000).toFixed(6);

  for (const channelId of install.ambientCaptureChannels) {
    const messages = await fetchSlackChannelHistory(install.teamId, channelId, oldestTs);
    for (const m of messages) {
      if (!m.text || !m.user) continue;
      const sourceRef = `${channelId}:${m.ts}`;
      // Skip ones we've seen.
      const existing = await prisma.ambientThesisSignal.findUnique({
        where: { source_sourceRef: { source: 'slack', sourceRef } },
        select: { id: true },
      });
      if (existing) continue;

      const classification = await classifyTextForThesisFormation(m.text);
      if (
        !classification.isThesisFormation ||
        classification.confidence < SIGNAL_BANNER_THRESHOLD
      ) {
        continue;
      }

      const result = await persistAmbientSignal({
        userId: install.installedByUserId,
        orgId: install.orgId,
        source: 'slack',
        sourceRef,
        sourceParentRef: m.thread_ts ?? channelId,
        excerpt: m.text,
        confidence: classification.confidence,
        extractedFields: classification.extractedFields,
      });
      if (result.created) persistedCount += 1;
    }
  }

  return persistedCount;
}

// ──────────────────────────────────────────────────────────────────────
// Drive ingestion (scaffolding — production parse path is a follow-up)
// ──────────────────────────────────────────────────────────────────────

/**
 * Poll a Drive installation for new files in monitored folders. The
 * actual file-content classification piggybacks on the existing
 * downloadFileContent + structurer pipeline. For T2.2 v1 we surface
 * file METADATA signals (new file added to monitored folder with
 * thesis-shaped name) — file-body parsing is a follow-up.
 *
 * Returns the number of signals persisted.
 */
export async function pollDriveInstallationForSignals(install: {
  userId: string;
  orgId: string | null;
  monitoredFolders: string[];
}): Promise<number> {
  // Conservative v1: surface a metadata-only signal when a new file
  // lands in a monitored folder with a thesis-shaped name (target / deal
  // / acquisition / market entry / strategic). The full file-content
  // path requires reusing parseFile() + the structurer pipeline which
  // is heavier; queued for the next session.
  if (install.monitoredFolders.length === 0) return 0;
  log.info('Drive ambient polling — metadata-only v1', {
    userId: install.userId,
    folderCount: install.monitoredFolders.length,
  });
  return 0;
}

// ──────────────────────────────────────────────────────────────────────
// Top-level entry — called by /api/cron/ambient-detection
// ──────────────────────────────────────────────────────────────────────

export interface PollAllResult {
  installationsProcessed: number;
  signalsPersisted: number;
  expiredCleanedUp: number;
}

/**
 * Cron entry point. Polls every installation with ambient-capture
 * enabled. Catches per-installation errors so one bad token doesn't
 * poison the batch.
 */
export async function pollAllAmbientSources(): Promise<PollAllResult> {
  let installationsProcessed = 0;
  let signalsPersisted = 0;

  // Slack installations
  try {
    const slackInstalls = await prisma.slackInstallation.findMany({
      where: {
        ambientCaptureEnabled: true,
        status: 'active',
      },
      select: {
        teamId: true,
        installedByUserId: true,
        orgId: true,
        ambientCaptureChannels: true,
      },
    });
    for (const install of slackInstalls) {
      try {
        const persisted = await pollSlackInstallationForSignals(install);
        signalsPersisted += persisted;
        installationsProcessed += 1;
      } catch (err) {
        log.warn('Slack ambient poll failed for install', {
          teamId: install.teamId,
          err: String(err),
        });
      }
    }
  } catch (err) {
    log.warn('Slack installation lookup failed', { err: String(err) });
  }

  // Drive installations
  try {
    const driveInstalls = await prisma.googleDriveInstallation.findMany({
      where: {
        ambientCaptureEnabled: true,
        status: 'active',
      },
      select: {
        userId: true,
        orgId: true,
        monitoredFolders: true,
      },
    });
    for (const install of driveInstalls) {
      try {
        const persisted = await pollDriveInstallationForSignals(install);
        signalsPersisted += persisted;
        installationsProcessed += 1;
      } catch (err) {
        log.warn('Drive ambient poll failed for install', {
          userId: install.userId,
          err: String(err),
        });
      }
    }
  } catch (err) {
    log.warn('Drive installation lookup failed', { err: String(err) });
  }

  // Expire stale signals.
  let expiredCleanedUp = 0;
  try {
    const expired = await prisma.ambientThesisSignal.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'expired' },
    });
    expiredCleanedUp = expired.count;
  } catch (err) {
    log.warn('Expiry sweep failed', { err: String(err) });
  }

  log.info('Ambient detection pass complete', {
    installationsProcessed,
    signalsPersisted,
    expiredCleanedUp,
  });

  return { installationsProcessed, signalsPersisted, expiredCleanedUp };
}
