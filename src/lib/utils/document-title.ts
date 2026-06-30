import { generateText } from '@/lib/ai/providers/gateway';
import { MODEL_CHEAP } from '@/lib/ai/gateway-models';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('DocumentTitle');

/**
 * Auto-generated / placeholder filenames that carry no information — these are
 * the ones we replace with an LLM-derived title. An intentionally-named upload
 * ("Q3_Strategy_Memo.docx") is NEVER touched.
 *
 * Covers: paste-<iso-timestamp>.txt (the InlinePasteMemoCard default),
 * upload-*, untitled/document/memo/file with an optional timestamp/number.
 */
const GENERIC_FILENAME =
  /^(paste|upload|untitled|document|memo|file|new[ _-]?document)[-_ ]?[\dt:.z_-]*\.(txt|md|markdown|pdf|docx?|csv|rtf)$/i;

const MAX_TITLE_LEN = 90;
const MIN_TITLE_LEN = 3;

export function isGenericFilename(name: string): boolean {
  return GENERIC_FILENAME.test((name || '').trim());
}

/**
 * Turn a raw LLM title into a safe, readable filename. Strips quotes/markdown,
 * collapses whitespace, removes path separators + control chars, enforces a
 * sane length, and re-attaches the original extension. Returns null when the
 * model gave us nothing usable (so the caller keeps the generic name).
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
 * Fire-and-forget: if a document's filename is an auto-generated placeholder
 * (paste-<ts>.txt), ask the cheap model for a fitting 3-8 word title and rename
 * the document. NEVER throws — naming is cosmetic, so any failure (no gateway
 * key, malformed output, transient error) leaves the generic name in place.
 *
 * Called non-blocking after document creation so the upload + audit aren't
 * delayed; by the time the ~60s audit finishes, the rename has landed and the
 * document-detail page shows the real title.
 */
export async function maybeAutoNameDocument(
  documentId: string,
  content: string,
  currentFilename: string
): Promise<void> {
  try {
    if (!isGenericFilename(currentFilename)) return;
    if (!content || content.trim().length < 40) return;

    const ext = currentFilename.match(/\.[a-z0-9]+$/i)?.[0] ?? '.txt';
    const excerpt = content.slice(0, 3000);
    const prompt =
      'Generate a concise, specific 3 to 8 word title for the following document, suitable as a filename. ' +
      'Name the company or subject and the document type when they are clear ' +
      '(for example "SpaceX S-1 Registration", "Project Atlas Market-Entry Memo", "Acme Q3 Board Deck"). ' +
      'Do not invent details that are not in the text. Return ONLY the title, with no quotes and no extra words.\n\n' +
      `DOCUMENT:\n${excerpt}`;

    const { text } = await generateText(prompt, {
      model: MODEL_CHEAP,
      temperature: 0.2,
      maxOutputTokens: 40,
    });

    const titled = sanitizeTitle(text ?? '', ext);
    if (!titled) return;

    await prisma.document.update({ where: { id: documentId }, data: { filename: titled } });
    log.info(`Auto-named document ${documentId}: "${titled}"`);
  } catch (e) {
    log.warn(
      'auto-name failed (keeping generic filename):',
      e instanceof Error ? e.message : String(e)
    );
  }
}
