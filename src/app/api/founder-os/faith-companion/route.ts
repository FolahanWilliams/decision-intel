/**
 * Faith OS reflection companion (2026-05-28).
 *
 * POST /api/founder-os/faith-companion
 *   Reads the founder's prayer-journal entries + reading-plan reflections
 *   (server-side, scoped to userId), cross-references them, and returns a
 *   grounded synthesis: recurring themes (with evidence), scripture they
 *   keep returning to, a reflection on answered prayers, a gentle
 *   anti-prosperity encouragement, and one verse that fits their season.
 *
 * Grounding discipline: the companion reflects ONLY on what the founder
 * actually wrote. It never invents entries, never promises outcomes
 * ("pray and the deal closes"), and frames everything in identity +
 * stewardship + faithfulness — never faith-as-success-hack.
 *
 * Model: MODEL_ANALYTICAL (gemini-3-flash-preview) via the Vercel AI Gateway
 * — Flash, not grok-4.3, for low latency on this on-demand surface. Falls
 * back to a deterministic synthesis when AI_GATEWAY_API_KEY is absent, so the
 * surface always works. Rate-limited 20/hr/founder.
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import { generateText } from '@/lib/ai/providers/gateway';
// gemini-3-flash-preview (not grok-4.3) — the founder flagged grok latency
// 2026-05-28; this synthesis is reflective but not pipeline-grade, and Flash
// is materially faster for an on-demand button-press surface.
import { MODEL_ANALYTICAL } from '@/lib/ai/gateway-models';
import { DAILY_BIBLE_VERSES } from '@/components/founder-hub/founder-os/content';

const log = createLogger('FaithCompanion');

export const dynamic = 'force-dynamic';

interface CompanionTheme {
  theme: string;
  evidence: string;
}
interface CompanionSynthesis {
  openingLine: string;
  themes: CompanionTheme[];
  recurringScripture: string[];
  answeredReflection: string | null;
  encouragement: string;
  suggestedFocus: string;
  scriptureForYou: { ref: string; text: string } | null;
}

const SYSTEM_PROMPT = `You are a Christian reflection companion inside a founder's personal operating platform. Your only job is to help him SEE — across his own prayer-journal entries and scripture reflections — the patterns, the threads, and the faithfulness of God over time.

HARD RULES:
- Reflect ONLY on the entries you are given. Never invent an entry, a prayer, or a reflection he did not write. If the corpus is thin, say so gently rather than padding.
- NEVER promise outcomes. Do not imply that prayer/faith causes the business to succeed, the deal to close, or the runway to extend. That is the prosperity-gospel error and it is forbidden. Frame everything in identity, stewardship, faithfulness, and trust — his worth is settled in Christ regardless of the numbers.
- Cross-reference: your highest value is connecting threads ACROSS entries he wouldn't notice himself ("you have asked for wisdom on a decision four times this month; in your Proverbs reflections you keep returning to trusting vs. controlling").
- Pastoral but not preachy. Warm, specific, grounded. Speak TO him, not about him. No clichés.
- Scripture is ESV. Quote accurately or not at all — if unsure of exact wording, give only the reference.
- Keep it concise. He is a busy founder; this is a mirror, not a sermon.

Return STRICT JSON only (no markdown fences), matching exactly:
{
  "openingLine": "1-2 warm sentences naming what you see across his entries",
  "themes": [{"theme": "short label", "evidence": "what across his entries shows this"}],
  "recurringScripture": ["Reference", ...],
  "answeredReflection": "a sentence reflecting on his answered prayers, or null if none",
  "encouragement": "grounded, anti-prosperity encouragement (2-3 sentences)",
  "suggestedFocus": "one gentle suggestion for what to bring before God next",
  "scriptureForYou": {"ref": "Reference", "text": "ESV text"}
}
Give 2-4 themes. Omit scriptureForYou (use null) if you cannot quote it accurately.`;

function excerpt(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n) + '…' : t;
}

function parseSynthesis(raw: string): CompanionSynthesis | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (typeof obj.openingLine !== 'string' || !Array.isArray(obj.themes)) return null;
    return {
      openingLine: String(obj.openingLine),
      themes: (obj.themes as unknown[])
        .filter((t): t is CompanionTheme => !!t && typeof (t as CompanionTheme).theme === 'string')
        .slice(0, 4)
        .map(t => ({ theme: String(t.theme), evidence: String(t.evidence ?? '') })),
      recurringScripture: Array.isArray(obj.recurringScripture)
        ? (obj.recurringScripture as unknown[]).map(String).slice(0, 8)
        : [],
      answeredReflection:
        typeof obj.answeredReflection === 'string' ? obj.answeredReflection : null,
      encouragement: typeof obj.encouragement === 'string' ? obj.encouragement : '',
      suggestedFocus: typeof obj.suggestedFocus === 'string' ? obj.suggestedFocus : '',
      scriptureForYou:
        obj.scriptureForYou &&
        typeof obj.scriptureForYou.ref === 'string' &&
        typeof obj.scriptureForYou.text === 'string'
          ? { ref: obj.scriptureForYou.ref, text: obj.scriptureForYou.text }
          : null,
    };
  } catch {
    return null;
  }
}

/** Deterministic fallback synthesis from the raw data — used when the AI
 *  gateway key is absent or the call fails. Never invents; reflects counts. */
function fallbackSynthesis(
  journal: { kind: string; scriptureRef: string | null; answered: boolean; body: string }[],
  reading: { reference: string; reflection: string | null }[]
): CompanionSynthesis {
  const refCounts = new Map<string, number>();
  for (const e of journal)
    if (e.scriptureRef) refCounts.set(e.scriptureRef, (refCounts.get(e.scriptureRef) ?? 0) + 1);
  for (const r of reading) refCounts.set(r.reference, (refCounts.get(r.reference) ?? 0) + 1);
  const recurringScripture = Array.from(refCounts.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([ref]) => ref);
  const answered = journal.filter(e => e.kind === 'supplication' && e.answered).length;
  const supplications = journal.filter(e => e.kind === 'supplication').length;
  const verse = DAILY_BIBLE_VERSES[0];
  return {
    openingLine:
      journal.length + reading.length === 0
        ? 'Nothing logged yet — start a prayer or a reading reflection and the companion will reflect it back across time.'
        : `You have ${journal.length} journal ${journal.length === 1 ? 'entry' : 'entries'} and ${reading.length} reading reflection${reading.length === 1 ? '' : 's'} on record.`,
    themes: [],
    recurringScripture,
    answeredReflection:
      answered > 0
        ? `You've marked ${answered} of ${supplications} supplications answered. Look back over them.`
        : null,
    encouragement:
      'Keep the record. The point is not to perform — it is to remember, over time, who held you. (AI companion offline; this is the plain tally.)',
    suggestedFocus:
      'Bring one specific thing before God today, and write it down so you can look back.',
    scriptureForYou: { ref: verse.ref, text: verse.text },
  };
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }

  const rl = await checkRateLimit(auth.userId, 'faith-companion', {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.success) {
    return apiError({ error: 'Rate limit reached. Try again later.', status: 429 });
  }

  // Pull the corpus — recent journal entries + reading reflections.
  let journal: {
    kind: string;
    scriptureRef: string | null;
    answered: boolean;
    body: string;
    createdAt: Date;
  }[] = [];
  let reading: { reference: string; reflection: string | null }[] = [];
  try {
    journal = await prisma.founderOsPrayerJournal.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: { kind: true, scriptureRef: true, answered: true, body: true, createdAt: true },
    });
    reading = await prisma.founderOsReadingProgress.findMany({
      where: { userId: auth.userId, reflection: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 40,
      select: { reference: true, reflection: true },
    });
  } catch (err) {
    // @schema-drift-tolerant — pre-migration envs have no corpus yet.
    log.warn('corpus fetch failed:', err);
  }

  const corpusEmpty = journal.length === 0 && reading.length === 0;

  // No AI key OR empty corpus → deterministic fallback (always works).
  if (!process.env.AI_GATEWAY_API_KEY || corpusEmpty) {
    return apiSuccess({
      data: {
        source: corpusEmpty ? 'empty' : 'fallback',
        synthesis: fallbackSynthesis(journal, reading),
      },
    });
  }

  // Build the grounded prompt.
  const journalBlock = journal
    .map(e => {
      const dateStr = e.createdAt.toISOString().slice(0, 10);
      const refStr = e.scriptureRef ? ` [${e.scriptureRef}]` : '';
      const answeredStr = e.kind === 'supplication' ? (e.answered ? ' (answered)' : ' (open)') : '';
      return `- ${dateStr} · ${e.kind}${refStr}${answeredStr}: ${excerpt(e.body, 280)}`;
    })
    .join('\n');
  const readingBlock = reading
    .map(r => `- ${r.reference}: ${excerpt(r.reflection ?? '', 280)}`)
    .join('\n');

  const prompt = `Here are the founder's journal entries (newest first):\n${journalBlock || '(none)'}\n\nHere are his scripture-reading reflections:\n${readingBlock || '(none)'}\n\nReflect across all of it. Connect threads he would not notice himself. Return the strict JSON.`;

  try {
    const result = await generateText(prompt, {
      model: MODEL_ANALYTICAL,
      system: SYSTEM_PROMPT,
      temperature: 0.5,
      maxOutputTokens: 1400,
    });
    const synthesis = parseSynthesis(result.text);
    if (!synthesis) {
      log.warn('companion JSON parse failed; using fallback');
      return apiSuccess({
        data: { source: 'fallback', synthesis: fallbackSynthesis(journal, reading) },
      });
    }
    return apiSuccess({ data: { source: 'llm', synthesis } });
  } catch (err) {
    log.warn('companion generation failed; using fallback:', err);
    return apiSuccess({
      data: { source: 'fallback', synthesis: fallbackSynthesis(journal, reading) },
    });
  }
}
