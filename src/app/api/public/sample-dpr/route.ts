/**
 * GET /api/public/sample-dpr
 *
 * Public, unauthenticated SPECIMEN Decision Provenance Record. A GC,
 * journalist, or regulator can download a real McKinsey-grade DPR PDF
 * before anyone signs a contract. The record is rendered from frozen
 * seed data via the new HTML/CSS Next.js route (/dpr-render/specimen/wework)
 * + Puppeteer — locked 2026-05-05 architecture (CLAUDE.md "DPR
 * architecture lock 2026-05-05").
 *
 * Migration note: this route previously called the legacy 1,696-LOC
 * jsPDF generator. Phase 2 wired it to the new HTML/CSS rendering via
 * the shared renderDprPdf() helper so a procurement reviewer who hits
 * the public URL gets the new visual language. The legacy generator
 * (decision-provenance-record-generator.ts) will be retired in Phase 4
 * once all 6 consumers have been swapped.
 *
 * Rate-limited per IP (10/hour) to keep public traffic cheap and bots
 * from hot-looping the Puppeteer renderer (~$0.001 per render).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { renderDprPdf } from '@/lib/reports/render-dpr-pdf';

const log = createLogger('SampleDpr');

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(ip, 'public:sample-dpr', {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    failMode: 'open',
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rl.limit),
          'X-RateLimit-Reset': String(rl.reset),
          'Retry-After': String(Math.max(1, rl.reset - Math.floor(Date.now() / 1000))),
        },
      }
    );
  }

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const { pdf } = await renderDprPdf({ baseUrl, type: 'specimen', id: 'wework' });
    log.info(`SPECIMEN DPR served to ${ip} (${pdf.length} bytes)`);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="decision-provenance-record-specimen.pdf"',
        // Public specimen — safe to cache aggressively on the CDN since
        // the seed data is frozen + the rendering is deterministic.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (err) {
    log.error('SPECIMEN DPR generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate specimen.' }, { status: 500 });
  }
}
