import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';
import { withTimeout } from '@/lib/utils/resilience';

const log = createLogger('DocumentTitle');

const MAX_TITLE_LEN = 90;
const MIN_TITLE_LEN = 3;
const NAMING_TIMEOUT_MS = 12_000;

// Known placeholder prefixes that carry no information (the paste/upload
// defaults + common browser/OS junk). Matched against the base name (extension
// stripped), with an optional trailing timestamp / number.
const GENERIC_PREFIX =
  /^(paste|upload|untitled|document|memo|file|new[ _-]?document|scan|image|img|download|copy(\s*of)?|export|screenshot|attachment|tmp|temp|draft|final|version|doc)[-_ ]?[\dt:.z()_-]*$/i;

const SINGLE_JUNK_WORD = /^(draft|final|finalfinal|temp|tmp|test|sample|copy|new|old|misc)$/i;

/**
 * Is this filename UNINFORMATIVE — i.e. should we auto-derive a real title?
 *
 * The founder's reality: "most times it's just a random string." The prior
 * narrow regex (paste- / upload- prefixes with a fixed extension list) missed
 * the common cases (hash/UUID/timestamp names, `.html` filings saved from EDGAR,
 * `doc (3)` copies), which is why auto-naming appeared to "stop". It catches
 * those while
 * KEEPING any clearly-intentional name (≥2 real words, or a legit single word).
 *
 * Extension-agnostic: strips any trailing `.ext` (incl. `.html`) before judging.
 */
export function isUninformativeFilename(name: string): boolean {
  const trimmed = (name || '').trim();
  if (!trimmed) return false; // nothing to work with → nothing to rename

  const base = trimmed.replace(/\.[a-z0-9]{1,8}$/i, '').trim();
  if (base.length < 2) return true; // e.g. "x.pdf"

  // 1) Generic placeholder prefixes / single junk words.
  if (GENERIC_PREFIX.test(base) || SINGLE_JUNK_WORD.test(base)) return true;

  // 2) Hash / UUID names — checked against the WHOLE base (a dashed UUID
  //    tokenizes into parts, so this must not be gated by tokenization).
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(base)) return true;
  if (/^[0-9a-f]{12,}$/i.test(base.replace(/[\s_-]/g, ''))) return true; // md5/sha-style blob

  // 3) ≥2 real words → an intentional, informative name. KEEP.
  //    ("Q3 Strategy Memo", "SpaceX S1 RiskFactors", "google ipo", "2026 acquisition thesis")
  const tokens = base.split(/[\s_.\-]+/).filter(Boolean);
  const realWords = tokens.filter(t => /^[a-z][a-z'’&]*$/i.test(t) && t.length >= 2);
  if (realWords.length >= 2) return false;

  // 4) Single-token "random string" heuristics (timestamp / numeric id / blob).
  if (tokens.length <= 1) {
    const digitCount = (base.match(/\d/g) || []).length;
    // Mostly digits (timestamps / numeric ids).
    if (base.length >= 6 && digitCount / base.length >= 0.5) return true;
    // Long single alnum run-on with a digit — real single words are short; a
    // 16+ char blob with a digit in it is almost always a generated token.
    if (base.length >= 16 && digitCount > 0) return true;
  }

  // Otherwise (a single real word like "Fermi", "Tesla") — keep it.
  return false;
}

/** @deprecated back-compat alias — use isUninformativeFilename. */
export const isGenericFilename = isUninformativeFilename;

/**
 * Turn a raw LLM title into a safe, readable filename. Strips quotes/markdown,
 * collapses whitespace, removes path separators + control chars, enforces a
 * sane length, and re-attaches the original extension. Returns null when the
 * model gave us nothing usable (so the caller keeps the current name).
 */
export function sanitizeTitle(raw: string, ext: string): string | null {
  if (!raw) return null;
  let t = raw
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/^["'`*_#\s]+|["'`*_#\s]+$/g, '')
    .replace(/^(title|name|filename)\s*[:\-]\s*/i, '')
    .replace(/[*_#`]/g, '')
    .replace(/[\\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length < MIN_TITLE_LEN) return null;
  if (t.length > MAX_TITLE_LEN) t = t.slice(0, MAX_TITLE_LEN).trim();
  const cleanExt = /^\.[a-z0-9]+$/i.test(ext) ? ext : '.txt';
  return `${t}${cleanExt}`;
}

/**
 * If a document's filename is uninformative (a random string / hash / generic
 * placeholder), ask the cheap model for a fitting 3-8 word title from the
 * content and rename the document. Returns the NEW filename when it renamed,
 * else null (so the caller can update its in-memory copy). NEVER throws —
 * naming is cosmetic, so any failure (no gateway key, malformed output,
 * timeout) leaves the current name in place.
 *
 * Awaited BEFORE the audit runs (2026-07-02, founder ask: "name it then audit
 * after so the DPR carries the name") — the racy post-response `after()` was
 * unreliable and missed the founder's real filenames.
 */
export async function maybeAutoNameDocument(
  documentId: string,
  content: string,
  currentFilename: string
): Promise<string | null> {
  try {
    if (!isUninformativeFilename(currentFilename)) return null;
    if (!content || content.trim().length < 40) return null;

    const ext = currentFilename.match(/\.[a-z0-9]+$/i)?.[0] ?? '.txt';
    const excerpt = content.slice(0, 3000);
    const prompt =
      'Generate a concise, specific 3 to 8 word title for the following document, suitable as a filename. ' +
      'Name the company or subject and the document type when they are clear ' +
      '(for example "SpaceX S-1 Registration", "Google 2004 IPO Prospectus", "Acme Q3 Board Deck"). ' +
      'Do not invent details that are not in the text. Return ONLY the title, with no quotes and no extra words.\n\n' +
      `DOCUMENT:\n${excerpt}`;

    const { text } = await withTimeout(
      () => generateText(prompt, { model: MODEL_CHEAP, temperature: 0.2, maxOutputTokens: 40 }),
      NAMING_TIMEOUT_MS,
      'auto-name timed out'
    );

    const titled = sanitizeTitle(text ?? '', ext);
    if (!titled) return null;

    await prisma.document.update({ where: { id: documentId }, data: { filename: titled } });
    log.info(`Auto-named document ${documentId}: "${titled}"`);
    return titled;
  } catch (e) {
    log.warn(
      'auto-name failed (keeping current filename):',
      e instanceof Error ? e.message : String(e)
    );
    return null;
  }
}
