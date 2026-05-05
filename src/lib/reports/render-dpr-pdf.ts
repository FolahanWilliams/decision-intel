/**
 * Shared DPR-to-PDF helper — used by every server-side surface that needs
 * to render the McKinsey-grade Decision Provenance Record.
 *
 * Locked 2026-05-05. Single Puppeteer call site so the configuration
 * (Chromium pack URL, header/footer template, A4 margins, font-loading
 * wait, viewport) lives in exactly one place. Consumers call
 * `renderDprPdf({ type, id, baseUrl, classification })` and receive a
 * PDF Buffer back.
 *
 * Cold start cost on Vercel: 1-3s for the first invocation after a
 * deploy or idle period (chromium-min binary download from CDN).
 * Subsequent warm invocations ~300-500ms.
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('RenderDprPdf');

const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar';

export interface RenderDprPdfOpts {
  /** Absolute URL of the running Next.js server (used to navigate the headless browser). */
  baseUrl: string;
  /** DPR type — drives which /dpr-render/[type]/[id] route is hit. */
  type: 'specimen' | 'document' | 'package' | 'deal';
  /** Identifier — slug for specimen, UUID for the rest. */
  id: string;
  /**
   * Cookies to forward to the headless browser so it can authenticate as
   * the calling user when hitting auth-gated routes (Phase 4 — document /
   * package / deal). Specimen routes are public; pass undefined.
   */
  authCookieHeader?: string;
}

export interface RenderDprPdfResult {
  pdf: Buffer;
  bytes: number;
  durationMs: number;
}

export async function renderDprPdf(opts: RenderDprPdfOpts): Promise<RenderDprPdfResult> {
  const { baseUrl, type, id, authCookieHeader } = opts;
  const renderUrl = `${baseUrl}/dpr-render/${type}/${id}`;
  const start = Date.now();

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    ? process.env.PUPPETEER_EXECUTABLE_PATH
    : await chromium.executablePath(CHROMIUM_PACK_URL);

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 1024 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    if (authCookieHeader) {
      await page.setExtraHTTPHeaders({ Cookie: authCookieHeader });
    }

    log.info('Rendering DPR PDF', { type, id, renderUrl });
    await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 30_000 });

    // Wait for fonts to fully load before rendering — avoids FOIT in PDF.
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '12mm', left: '0', right: '0' },
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `
        <div style="
          width: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 7.5pt;
          color: #78716c;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0 16mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="flex: 1; text-align: left;">Decision Provenance Record</span>
          <span style="flex: 1; text-align: center;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </span>
          <span style="flex: 1; text-align: right;">decision-intel.com</span>
        </div>
      `,
    });

    const pdf = Buffer.from(pdfBytes);
    const durationMs = Date.now() - start;
    log.info('DPR PDF rendered successfully', {
      type,
      id,
      sizeBytes: pdf.length,
      durationMs,
    });

    return { pdf, bytes: pdf.length, durationMs };
  } finally {
    try {
      await browser.close();
    } catch (closeErr) {
      log.warn('Failed to close Puppeteer browser cleanly:', closeErr);
    }
  }
}
