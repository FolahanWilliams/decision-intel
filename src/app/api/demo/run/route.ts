import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { encryptDocumentContent, isDocumentEncryptionEnabled } from '@/lib/utils/encryption';
import { isAdminUserId } from '@/lib/utils/admin';
import { analyzeDocument } from '@/lib/analysis/analyzer';

const log = createLogger('DemoRun');

// Demo budget + content guards. The demo runs the *real* 12-node pipeline
// against a visitor-pasted memo; every audit costs ~£0.40 at Gemini paid
// tier 1. These limits cap the founder's demo spend while giving a real
// wow moment to each unique visitor.
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const PER_IP_MAX_REQUESTS = 1;
const GLOBAL_MAX_REQUESTS = 50; // ~$20/day ceiling
const MIN_WORDS = 50;
const MAX_WORDS = 4000;

function extractIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * POST /api/demo/run
 *
 * Anonymous endpoint that runs the real Decision Intel 12-node pipeline on
 * a pasted strategic memo. Returns the analysis for the wow-sequence
 * rendering on /demo.
 *
 * Setup (one-time):
 *  1. Pick a deterministic UUID for the demo user (any RFC 4122 v4 UUID).
 *  2. Set `DEMO_USER_ID` to that UUID on Vercel.
 *  3. Add the same UUID to `ADMIN_USER_IDS` so `checkAnalysisLimit`
 *     resolves it to the enterprise plan and the pipeline never blocks.
 *
 * Without DEMO_USER_ID, the endpoint 503s so the UI can show a fallback.
 *
 * Rate limits:
 *  - Per-IP: 1 audit / 24h
 *  - Global: 50 audits / 24h (~$20 daily budget ceiling)
 *
 * Content guards:
 *  - Min 50 words (nothing useful to audit below that)
 *  - Max 4,000 words (context-window + cost guard)
 */
export async function POST(req: NextRequest) {
  // 1. Env gate — fail cleanly if the endpoint isn't configured
  const demoUserId = process.env.DEMO_USER_ID?.trim();
  if (!demoUserId) {
    log.warn('DEMO_USER_ID not configured — demo audit endpoint disabled');
    return apiError({
      error:
        'The free demo audit is temporarily unavailable. Please try again soon or create a free account for 4 audits a month.',
      status: 503,
    });
  }

  if (!isAdminUserId(demoUserId)) {
    // Setup error: DEMO_USER_ID isn't in ADMIN_USER_IDS, so the plan check
    // inside analyzeDocument will throw after the 4-free-audit quota is
    // consumed by past demo runs. Fail loud so the founder sees it.
    log.error(
      'DEMO_USER_ID is set but not present in ADMIN_USER_IDS — plan bypass inactive.'
    );
    return apiError({
      error: 'Demo is misconfigured on the server. Please contact support.',
      status: 503,
    });
  }

  // 2. Parse body
  const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return apiError({ error: 'Missing "text" field in request body.', status: 400 });
  }

  // 3. Validate length
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < MIN_WORDS) {
    return apiError({
      error: `Paste at least ${MIN_WORDS} words so the audit has something to work with.`,
      status: 400,
    });
  }
  if (wordCount > MAX_WORDS) {
    return apiError({
      error: `Demo audits are capped at ${MAX_WORDS.toLocaleString()} words. Paste a trimmed excerpt, or create a free account to audit full documents.`,
      status: 413,
    });
  }

  // 4. Per-IP rate limit (one audit per visitor per day)
  const ip = extractIp(req);
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 24);

  const ipLimit = await checkRateLimit(`demo-ip:${ipHash}`, '/api/demo/run', {
    windowMs: WINDOW_MS,
    maxRequests: PER_IP_MAX_REQUESTS,
    failMode: 'closed',
  });
  if (!ipLimit.success) {
    return apiError({
      error:
        "You've already used today's free audit. Come back tomorrow, or create a free account for 4 audits a month.",
      status: 429,
      headers: {
        'Retry-After': String(Math.max(0, ipLimit.reset - Math.floor(Date.now() / 1000))),
      },
    });
  }

  // 5. Global budget kill-switch (~$20/day ceiling)
  const globalLimit = await checkRateLimit('demo-global', '/api/demo/run', {
    windowMs: WINDOW_MS,
    maxRequests: GLOBAL_MAX_REQUESTS,
    failMode: 'closed',
  });
  if (!globalLimit.success) {
    return apiError({
      error:
        'The free demo is at capacity today. Try again tomorrow, or create a free account for instant access.',
      status: 503,
    });
  }

  // 6. Create Document row under the demo user (encrypted content)
  let documentId: string;
  try {
    const contentHash = createHash('sha256').update(text).digest('hex');
    const encFields = isDocumentEncryptionEnabled() ? encryptDocumentContent(text) : {};

    const doc = await prisma.document.create({
      data: {
        userId: demoUserId,
        filename: `demo-audit-${Date.now()}.txt`,
        fileType: 'text/plain',
        fileSize: Buffer.byteLength(text, 'utf-8'),
        content: text,
        ...encFields,
        contentHash,
        status: 'uploaded',
      },
    });
    documentId = doc.id;
  } catch (err) {
    log.error('Demo document create failed:', err);
    return apiError({
      error: 'Could not prepare your memo for audit. Please try again.',
      status: 500,
      cause: err instanceof Error ? err : undefined,
    });
  }

  // 7. Run the real 12-node pipeline
  try {
    const result = await analyzeDocument(documentId);

    // analyzeDocument returns AnalysisResult (the output shape), not the
    // persisted Analysis row. Fetch the just-created Analysis ID so the
    // wow-sequence UI can deep-link into the full detail page if the
    // visitor signs up.
    const analysis = await prisma.analysis.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    log.info(`Demo audit completed for doc ${documentId}, wordCount=${wordCount}`);

    return apiSuccess({
      data: {
        documentId,
        analysisId: analysis?.id ?? null,
        result,
      },
    });
  } catch (err) {
    log.error('Demo audit pipeline failed:', err);

    // Clean up the demo document so a failed audit doesn't leave orphan rows
    await prisma.document
      .delete({ where: { id: documentId } })
      .catch(deleteErr => log.warn('Demo doc cleanup after pipeline failure:', deleteErr));

    return apiError({
      error:
        'The audit ran into an error. Please try again — if this keeps happening, reach us at team@decision-intel.com.',
      status: 500,
      cause: err instanceof Error ? err : undefined,
    });
  }
}
