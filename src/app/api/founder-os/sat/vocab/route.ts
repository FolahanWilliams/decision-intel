/**
 * SAT Prep — vocab API with persisted SM-2 spaced repetition (founder-private).
 *
 * Reuses the Education Room `applySm2` engine so the spacing algorithm has one
 * home. Words-in-context framing — fed from drill + reading misses, not
 * obscure-word recall (the digital SAT de-emphasises rare vocab, so this block
 * is thin by design).
 *
 * GET    /api/founder-os/sat/vocab?due=1  → cards (all, or only due now)
 * POST   create   { word, definition, partOfSpeech?, mnemonic?, etymology?, exampleSentence?,
 *                   ipa?, synonyms?, antonyms?, relatedWords?, clozeSentence? }
 * POST   review   { id, correct, confidence?, responseMs?, quizType? }  (honest quality via
 *                  effectiveQuality → applySm2 + per-type failure memory + response-time EMA)
 *                  Legacy flip-reveal { id, quality } still accepted.
 * POST   mnemonic { id, userMnemonic }   (the founder's own memory aid — generation effect)
 * DELETE ?id=...
 */

import { prisma } from '@/lib/prisma';
import { authenticateFounderOs } from '@/lib/founder-os/auth';
import { apiSuccess, apiError } from '@/lib/utils/api-response';
import { createLogger } from '@/lib/utils/logger';
import {
  applySm2,
  type SM2CardState,
} from '@/components/founder-hub/education/education-room-data';
import {
  effectiveQuality,
  updateResponseMsEma,
  nextFailedTypes,
} from '@/components/founder-hub/sat/sat-calibration';

const log = createLogger('SatVocab');

export const dynamic = 'force-dynamic';

interface PostBody {
  // create
  word?: string;
  definition?: string;
  partOfSpeech?: string;
  mnemonic?: string;
  etymology?: string;
  exampleSentence?: string;
  ipa?: string;
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[];
  clozeSentence?: string;
  // review (legacy flip-reveal: quality; new adaptive: correct/confidence/responseMs/quizType)
  id?: string;
  quality?: number;
  correct?: boolean;
  confidence?: number;
  responseMs?: number;
  quizType?: string;
  // save-your-own mnemonic (the generation effect)
  userMnemonic?: string;
}

function s(v: unknown, max: number): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

function strArr(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map(x => x.trim().slice(0, 80))
    .slice(0, max);
}

/** Status from SM-2 state — surfaced in the Vocab Bank filter. */
function deriveStatus(repetitions: number, intervalDays: number, totalReviews: number): string {
  if (totalReviews === 0) return 'new';
  if (repetitions < 2) return 'learning';
  if (intervalDays >= 21) return 'mastered';
  return 'reviewing';
}

export async function GET(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  const dueOnly = new URL(request.url).searchParams.get('due') === '1';
  try {
    const cards = await prisma.satVocabCard.findMany({
      where: {
        userId: auth.userId,
        ...(dueOnly ? { OR: [{ nextDue: null }, { nextDue: { lte: new Date() } }] } : {}),
      },
      orderBy: [{ nextDue: 'asc' }, { createdAt: 'desc' }],
      take: 500,
    });
    return apiSuccess({ data: { cards } });
  } catch (err) {
    log.warn('list failed:', err);
    return apiSuccess({ data: { cards: [] } });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return apiError({ error: 'Invalid JSON body', status: 400 });
  }

  // ── save-your-own-mnemonic path (the generation effect) ───────────
  if (
    typeof body.id === 'string' &&
    typeof body.userMnemonic === 'string' &&
    body.correct === undefined &&
    body.quality === undefined
  ) {
    try {
      const card = await prisma.satVocabCard.findUnique({ where: { id: body.id } });
      if (!card || card.userId !== auth.userId) {
        return apiError({ error: 'Not found', status: 404 });
      }
      const updated = await prisma.satVocabCard.update({
        where: { id: card.id },
        data: { userMnemonic: s(body.userMnemonic, 600) },
      });
      return apiSuccess({ data: { card: updated } });
    } catch (err) {
      log.warn('mnemonic save failed:', err);
      return apiError({ error: 'Failed to save mnemonic', status: 500 });
    }
  }

  // ── review path ──────────────────────────────────────────────────
  if (typeof body.id === 'string') {
    try {
      const card = await prisma.satVocabCard.findUnique({ where: { id: body.id } });
      if (!card || card.userId !== auth.userId) {
        return apiError({ error: 'Not found', status: 404 });
      }
      // Derive SM-2 quality. New adaptive path: honest quality from correctness +
      // confidence + speed. Legacy flip-reveal path: a raw 0-5 quality.
      const responseMs =
        body.responseMs == null ? null : Math.max(0, Math.round(Number(body.responseMs)));
      const quizType =
        typeof body.quizType === 'string' && body.quizType.trim()
          ? body.quizType.trim().slice(0, 24)
          : null;
      let quality: number;
      let correct: boolean;
      if (typeof body.correct === 'boolean') {
        correct = body.correct;
        const confidence =
          body.confidence == null
            ? null
            : Math.min(3, Math.max(0, Math.round(Number(body.confidence))));
        quality = effectiveQuality({ correct, confidence, responseMs });
      } else {
        quality = Math.min(5, Math.max(0, Math.round(Number(body.quality) || 0)));
        correct = quality >= 3;
      }
      const prev: SM2CardState = {
        cardId: card.id,
        easeFactor: card.easeFactor,
        repetitions: card.repetitions,
        intervalDays: card.intervalDays,
        lastReviewed: (card.lastReviewed ?? new Date()).toISOString(),
        nextDue: (card.nextDue ?? new Date()).toISOString(),
        totalReviews: card.totalReviews,
        successfulReviews: card.successfulReviews,
      };
      const next = applySm2(prev, quality, card.id);
      const updated = await prisma.satVocabCard.update({
        where: { id: card.id },
        data: {
          easeFactor: next.easeFactor,
          repetitions: next.repetitions,
          intervalDays: next.intervalDays,
          lastReviewed: new Date(next.lastReviewed),
          nextDue: new Date(next.nextDue),
          totalReviews: next.totalReviews,
          successfulReviews: next.successfulReviews,
          status: deriveStatus(next.repetitions, next.intervalDays, next.totalReviews),
          consecutiveFailures: correct ? 0 : card.consecutiveFailures + 1,
          ...(responseMs != null
            ? { responseMsEma: updateResponseMsEma(card.responseMsEma, responseMs) }
            : {}),
          ...(quizType
            ? { failedTypes: nextFailedTypes(card.failedTypes, quizType, correct) }
            : {}),
        },
      });
      return apiSuccess({ data: { card: updated } });
    } catch (err) {
      log.warn('review failed:', err);
      return apiError({ error: 'Failed to review card', status: 500 });
    }
  }

  // ── create path ──────────────────────────────────────────────────
  const word = s(body.word, 80);
  const definition = s(body.definition, 1000);
  if (!word || !definition) {
    return apiError({ error: 'word and definition required', status: 400 });
  }
  try {
    const synonyms = strArr(body.synonyms, 6);
    const antonyms = strArr(body.antonyms, 4);
    const relatedWords = strArr(body.relatedWords, 4);
    const card = await prisma.satVocabCard.upsert({
      where: { userId_word: { userId: auth.userId, word } },
      create: {
        userId: auth.userId,
        word,
        definition,
        partOfSpeech: s(body.partOfSpeech, 40),
        mnemonic: s(body.mnemonic, 600),
        etymology: s(body.etymology, 600),
        exampleSentence: s(body.exampleSentence, 600),
        ipa: s(body.ipa, 80),
        synonyms,
        antonyms,
        relatedWords,
        clozeSentence: s(body.clozeSentence, 600),
        status: 'new',
      },
      update: {
        // re-adding an existing word refreshes its definition fields, keeps SM-2 state.
        definition,
        ...(s(body.partOfSpeech, 40) ? { partOfSpeech: s(body.partOfSpeech, 40) } : {}),
        ...(s(body.mnemonic, 600) ? { mnemonic: s(body.mnemonic, 600) } : {}),
        ...(s(body.etymology, 600) ? { etymology: s(body.etymology, 600) } : {}),
        ...(s(body.exampleSentence, 600) ? { exampleSentence: s(body.exampleSentence, 600) } : {}),
        ...(s(body.ipa, 80) ? { ipa: s(body.ipa, 80) } : {}),
        ...(synonyms.length ? { synonyms } : {}),
        ...(antonyms.length ? { antonyms } : {}),
        ...(relatedWords.length ? { relatedWords } : {}),
        ...(s(body.clozeSentence, 600) ? { clozeSentence: s(body.clozeSentence, 600) } : {}),
      },
    });
    return apiSuccess({ data: { card } });
  } catch (err) {
    log.warn('create failed:', err);
    return apiError({ error: 'Failed to add word', status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateFounderOs(request);
  if (!auth.ok || !auth.userId) {
    return apiError({ error: auth.error ?? 'Unauthorized', status: auth.status ?? 401 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return apiError({ error: 'id required', status: 400 });
  try {
    await prisma.satVocabCard.deleteMany({ where: { id, userId: auth.userId } });
    return apiSuccess({ data: { deleted: true } });
  } catch (err) {
    log.warn('delete failed:', err);
    return apiError({ error: 'Failed to delete card', status: 500 });
  }
}
