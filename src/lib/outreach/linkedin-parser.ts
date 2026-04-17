import { createLogger } from '@/lib/utils/logger';

const log = createLogger('LinkedInParser');

export interface LinkedInFetchResult {
  rawText: string;
  source: 'url' | 'paste';
  warning?: string;
}

const LINKEDIN_URL_RE = /^https?:\/\/(?:www\.)?linkedin\.com\/(in|pub)\/[^\/?#]+/i;

export function isLinkedInUrl(input: string): boolean {
  return LINKEDIN_URL_RE.test(input.trim());
}

export async function fetchLinkedInProfile(input: {
  url?: string;
  rawText?: string;
}): Promise<LinkedInFetchResult> {
  if (input.rawText && input.rawText.trim().length > 50) {
    return {
      rawText: input.rawText.trim().slice(0, 12_000),
      source: 'paste',
    };
  }

  if (!input.url || !isLinkedInUrl(input.url)) {
    throw new Error(
      'Provide either a LinkedIn URL (linkedin.com/in/...) or paste the profile text directly.'
    );
  }

  try {
    const res = await fetch(input.url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DecisionIntelBot/1.0; +https://decision-intel.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      throw new Error(`LinkedIn returned ${res.status}`);
    }

    const html = await res.text();
    const extracted = extractTextFromHtml(html);

    if (extracted.length < 200) {
      throw new Error('Profile is gated — LinkedIn returned a login wall.');
    }

    return {
      rawText: extracted.slice(0, 12_000),
      source: 'url',
      warning:
        'LinkedIn public fetches are best-effort and often incomplete. For richest results, paste the profile text directly.',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn(`LinkedIn URL fetch failed: ${msg}`);
    throw new Error(
      `Couldn't fetch that LinkedIn URL (${msg}). Please paste the profile text directly — copy the About + Experience sections from the profile page.`
    );
  }
}

function extractTextFromHtml(html: string): string {
  const metaDescription = /<meta\s+name="description"\s+content="([^"]+)"/i.exec(html)?.[1] ?? '';
  const ogTitle = /<meta\s+property="og:title"\s+content="([^"]+)"/i.exec(html)?.[1] ?? '';
  const ogDescription =
    /<meta\s+property="og:description"\s+content="([^"]+)"/i.exec(html)?.[1] ?? '';

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  const header = [ogTitle, metaDescription, ogDescription].filter(Boolean).join('\n');
  return [header, bodyText].filter(Boolean).join('\n\n').trim();
}
