/**
 * POST /api/red-team/challenge — M7.2
 *
 * User-invoked Dr. Red Team challenge. Takes an analysisId (and optional
 * targetClaim / decisionRoomId), generates an adversarial response via
 * the Red Team persona prompt, persists the result, and returns it to
 * the caller.
 *
 * Rate limited because each call spends a Gemini Flash turn.
 * Audit-logged because "decision was challenged before it was made" is
 * a useful compliance signal.
 *
 * GET /api/red-team/challenge?analysisId=... — list prior challenges
 * for the analysis, ownership-gated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { buildRedTeamPersonaPrompt } from '@/lib/agents/prompts';
import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_ANALYTICAL } from '@/lib/ai/gateway-models';

const log = createLogger('RedTeamChallengeAPI');

export const dynamic = 'force-dynamic';

interface ChallengeBody {
  analysisId?: string;
  decisionRoomId?: string;
  targetClaim?: string;
  priorDiscussion?: string;
}

interface RedTeamJsonResponse {
  targetClaim: string;
  primaryObjection: string;
  secondaryObjections: string[];
  structuralQuestions: string[];
  closingLine: string;
}

/**
 * Parse the Red Team LLM response. Gemini Flash reliably returns JSON
 * when asked, but we defend against markdown-fenced output, leading
 * preamble, and the occasional malformed object.
 */
function parseRedTeamResponse(raw: string): RedTeamJsonResponse | null {
  // Strip markdown code fences if the model wrapped its output
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Find the outermost JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const jsonCandidate = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    const parsed = JSON.parse(jsonCandidate) as Partial<RedTeamJsonResponse>;
    if (
      typeof parsed.targetClaim !== 'string' ||
      typeof parsed.primaryObjection !== 'string' ||
      !Array.isArray(parsed.secondaryObjections) ||
      !Array.isArray(parsed.structuralQuestions) ||
      typeof parsed.closingLine !== 'string'
    ) {
      return null;
    }
    return {
      targetClaim: parsed.targetClaim.slice(0, 500),
      primaryObjection: parsed.primaryObjection.slice(0, 4000),
      secondaryObjections: parsed.secondaryObjections
        .filter((s: unknown): s is string => typeof s === 'string')
        .map(s => s.slice(0, 2000))
        .slice(0, 5),
      structuralQuestions: parsed.structuralQuestions
        .filter((s: unknown): s is string => typeof s === 'string')
        .map(s => s.slice(0, 600))
        .slice(0, 5),
      closingLine: parsed.closingLine.slice(0, 300),
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Tight rate limit — every call spends a Gemini turn and users will
    // click this multiple times out of curiosity. 30/hour is enough for
    // legitimate use but caps accidental loops.
    const rate = await checkRateLimit(user.id, '/api/red-team/challenge', {
      windowMs: 60 * 60 * 1000,
      maxRequests: 30,
    });
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded — Dr. Red Team is tired. Try again later.' },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as ChallengeBody;

    if (!body.analysisId && !body.decisionRoomId) {
      return NextResponse.json(
        { error: 'Either analysisId or decisionRoomId is required' },
        { status: 400 }
      );
    }

    // Resolve the target: we need document content + bias list for the prompt.
    // Only analysisId path is supported in phase 1 — decisionRoomId path is
    // scaffolded in the schema for later when the room detail UI lands.
    if (!body.analysisId) {
      return NextResponse.json(
        {
          error:
            'Decision-room-scoped challenges are not yet wired to the UI. Pass analysisId for now.',
        },
        { status: 400 }
      );
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: body.analysisId },
      include: {
        biases: {
          select: { biasType: true, severity: true, excerpt: true },
          orderBy: { confidence: 'desc' },
          take: 8,
        },
        document: {
          select: {
            userId: true,
            orgId: true,
            filename: true,
            content: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Ownership: user owns the analysis, OR belongs to its org
    if (analysis.document.userId !== user.id) {
      if (!analysis.document.orgId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id, orgId: analysis.document.orgId },
        select: { orgId: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build the prompt
    const prompt = buildRedTeamPersonaPrompt({
      documentContent: analysis.document.content,
      documentTitle: analysis.document.filename,
      overallScore: Math.round(analysis.overallScore),
      detectedBiases: analysis.biases.map(b => ({
        biasType: b.biasType,
        severity: b.severity,
        excerpt: b.excerpt,
      })),
      targetClaim: body.targetClaim,
      priorDiscussion: body.priorDiscussion,
    });

    // Call Gemini Flash. Temperature 0.8 — we want some variation across
    // invocations so a user who clicks "Challenge this" twice doesn't
    // get identical text. But not so high it loses coherence.
    const llmStart = Date.now();
    let rawText: string;
    try {
      // Phase 2 lock 2026-05-02: Gateway-routed Gemini 3 Flash Preview
      // (analytical default) — red-team challenge generation needs
      // sharper reasoning than Flash Lite to produce non-trivial
      // counter-arguments.
      const result = await generateText(prompt, {
        model: MODEL_ANALYTICAL,
        temperature: 0.8,
        maxOutputTokens: 2048,
      });
      rawText = result.text;
    } catch (llmErr) {
      log.error('Red Team LLM call failed:', llmErr);
      return NextResponse.json(
        {
          error: 'Dr. Red Team is unavailable right now. The underlying model returned an error.',
        },
        { status: 503 }
      );
    }

    const parsed = parseRedTeamResponse(rawText);
    if (!parsed) {
      log.warn('Failed to parse Red Team response:', rawText.slice(0, 300));
      return NextResponse.json(
        {
          error: 'Dr. Red Team produced a malformed response. Please try again.',
        },
        { status: 502 }
      );
    }

    // Persist
    const challenge = await prisma.redTeamChallenge.create({
      data: {
        userId: user.id,
        orgId: analysis.document.orgId ?? null,
        analysisId: body.analysisId,
        decisionRoomId: body.decisionRoomId ?? null,
        targetClaim: parsed.targetClaim,
        primaryObjection: parsed.primaryObjection,
        secondaryObjections: parsed.secondaryObjections,
        structuralQuestions: parsed.structuralQuestions,
        closingLine: parsed.closingLine,
      },
    });

    log.info(
      `Red Team challenge generated: analysis=${body.analysisId} user=${user.id} latency=${Date.now() - llmStart}ms`
    );

    // Audit trail — "decision was challenged before it was made"
    await prisma.auditLog
      .create({
        data: {
          userId: user.id,
          orgId: analysis.document.orgId ?? 'personal',
          action: 'red_team.challenge',
          resource: 'analysis',
          resourceId: body.analysisId,
          details: {
            challengeId: challenge.id,
            targetClaim: parsed.targetClaim.slice(0, 200),
            biasCount: analysis.biases.length,
            latencyMs: Date.now() - llmStart,
          },
        },
      })
      .catch(err =>
        log.warn(
          `Failed to write red_team.challenge audit log for analysis ${body.analysisId}:`,
          err instanceof Error ? err.message : String(err)
        )
      );

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2021' || code === 'P2022') {
      log.warn('Schema drift during Red Team challenge:', code);
      return NextResponse.json(
        {
          error: 'Dr. Red Team is not yet available. Database migration pending.',
        },
        { status: 503, headers: { 'Retry-After': '300' } }
      );
    }
    log.error('POST /api/red-team/challenge failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId query param is required' }, { status: 400 });
    }

    // Ownership check reuses the same pattern
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { document: { select: { userId: true, orgId: true } } },
    });
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    if (analysis.document.userId !== user.id) {
      if (!analysis.document.orgId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const membership = await prisma.teamMember.findFirst({
        where: { userId: user.id, orgId: analysis.document.orgId },
        select: { orgId: true },
      });
      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    let challenges;
    try {
      challenges = await prisma.redTeamChallenge.findMany({
        where: { analysisId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2021' || code === 'P2022') {
        return NextResponse.json({ challenges: [] });
      }
      throw err;
    }

    return NextResponse.json({ challenges });
  } catch (err) {
    log.error('GET /api/red-team/challenge failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
