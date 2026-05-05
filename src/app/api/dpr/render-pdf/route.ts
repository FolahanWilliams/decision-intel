/**
 * DPR PDF renderer — server-side Puppeteer endpoint.
 *
 * Locked 2026-05-05. Single entry point that converts the HTML rendered
 * at /dpr-render/[type]/[id] into a McKinsey-grade A4 PDF. Used by:
 *
 *   1. /api/documents/[id]/provenance-record (Phase 4 wire-in)
 *   2. /api/decision-packages/[id]/provenance-record (Phase 4)
 *   3. /api/deals/[id]/provenance-record (Phase 4)
 *   4. /api/public/sample-dpr (Phase 4)
 *   5. /api/compliance/audit-packet/[analysisId] (Phase 4)
 *   6. The /documents/[id] client-side Export DPR button (Phase 4)
 *
 * Architecture:
 *   - Vercel runtime: Node.js (not edge — Chromium is a binary)
 *   - Chromium is pulled at first invocation from @sparticuz/chromium-min
 *     CDN (~50MB compressed). Subsequent warm invocations reuse it.
 *   - For specimen URLs (no auth), runs unauthenticated.
 *   - For document/package/deal URLs (Phase 4), the caller's Supabase
 *     auth cookies are forwarded to the Puppeteer browser context so
 *     the headless browser is "logged in as" the caller.
 *
 * Cold start: 1-3 seconds. Warm invocation: 300-500ms.
 *
 * Limits:
 *   - Body size: ~5MB max PDF (sufficient for ~30-page DPRs)
 *   - Timeout: 60s (Vercel Pro). For larger documents, consider streaming.
 */

import type { NextRequest } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { createLogger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const log = createLogger('DprRenderPdf');

const VALID_TYPES = ['specimen', 'document', 'package', 'deal'] as const;
type DprType = (typeof VALID_TYPES)[number];

const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const id = url.searchParams.get('id');

  if (!type || !id) {
    return jsonError(400, 'Missing type or id query param.');
  }
  if (!VALID_TYPES.includes(type as DprType)) {
    return jsonError(400, `Invalid type: ${type}. Must be one of ${VALID_TYPES.join(', ')}.`);
  }

  // Phase 1: only specimen path is supported. Phase 4 wires document /
  // package / deal with full auth + ownership routing.
  if (type !== 'specimen') {
    return jsonError(
      501,
      `Type "${type}" is not yet implemented in Phase 1. Specimen only. Phase 4 wires document / package / deal paths.`
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `${url.protocol}//${url.host}`;
  const renderUrl = `${baseUrl}/dpr-render/${type}/${id}`;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();

    log.info('Rendering DPR PDF', { type, id, renderUrl });
    await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 30_000 });

    // Wait for fonts to fully load before rendering — avoids FOIT in PDF.
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });

    log.info('DPR PDF rendered successfully', {
      type,
      id,
      sizeBytes: pdf.length,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="dpr-${type}-${id}.pdf"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    log.error('DPR PDF rendering failed', { type, id, error: err });
    return jsonError(
      500,
      err instanceof Error ? err.message : 'Unknown rendering error'
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        log.warn('Failed to close Puppeteer browser cleanly:', closeErr);
      }
    }
  }
}

/**
 * Launch a headless Chromium suitable for the current environment.
 *
 * On Vercel: uses @sparticuz/chromium-min (binary downloaded at runtime
 * from the chromium-pack release tarball).
 *
 * Locally: uses the system Chrome / Chromium if PUPPETEER_EXECUTABLE_PATH
 * is set, otherwise falls back to chromium-min as well.
 */
async function launchBrowser() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    ? process.env.PUPPETEER_EXECUTABLE_PATH
    : await chromium.executablePath(CHROMIUM_PACK_URL);

  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 1024 },
    executablePath,
    headless: true,
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
