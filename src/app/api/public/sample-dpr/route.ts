/**
 * GET /api/public/sample-dpr
 *
 * Public, unauthenticated SPECIMEN Decision Provenance Record. A GC,
 * journalist, or regulator can download a real 4-page DPR PDF before
 * anyone signs a contract. The record is rendered from frozen seed
 * data in src/lib/reports/sample-dpr.ts and watermarked diagonally
 * with "SPECIMEN" on every page so it can't be mistaken for a live
 * audit.
 *
 * Rate-limited per IP (10/hour) to keep public traffic cheap and bots
 * from hot-looping the generator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { buildSampleDprData } from '@/lib/reports/sample-dpr';
import { DecisionProvenanceRecordGenerator } from '@/lib/reports/decision-provenance-record-generator';

const log = createLogger('SampleDpr');

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
    // ?clientSafe=1 lets a curious LP / journalist / regulator preview
    // the LP-export shape on the same SPECIMEN bytes — same tracking
    // limit, no auth, watermark stays.
    const clientSafe = req.nextUrl.searchParams.get('clientSafe') === '1';
    const data = buildSampleDprData();
    const generator = new DecisionProvenanceRecordGenerator();
    const doc = generator.generate(data, { watermark: 'SPECIMEN', clientSafe });
    const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    const pdfBytes = new Uint8Array(pdfArrayBuffer);

    log.info(`SPECIMEN DPR served to ${ip}`);

    return new NextResponse(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="decision-provenance-record-specimen.pdf"',
        // Public specimen — safe to cache aggressively on the CDN since
        // the content is frozen at build time.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (err) {
    log.error('SPECIMEN DPR generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate specimen.' }, { status: 500 });
  }
}
