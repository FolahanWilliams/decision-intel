/**
 * Share-card OG image — GET /api/share-cards/:token
 *
 * Generates a 1200x630 PNG summarising a shared analysis: DQ Index, bias
 * count, decision verdict, and a "Audit your own memo" CTA. Used in email
 * templates (lifecycle drip), tweet previews, and as the social-unfurl card
 * for /shared/:token URLs.
 *
 * Public. No auth. Only renders for existing, non-revoked ShareLinks.
 */

import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: RouteContext): Promise<Response> {
  const { token } = await params;
  try {
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        analysis: {
          select: {
            id: true,
            overallScore: true,
            noiseScore: true,
            metaVerdict: true,
            document: { select: { filename: true } },
            biases: { select: { id: true }, take: 40 },
          },
        },
      },
    });

    if (!link || link.revokedAt || (link.expiresAt && link.expiresAt < new Date())) {
      return fallbackCard('Link expired or revoked');
    }

    const a = link.analysis;
    const score = Math.round(a.overallScore ?? 0);
    const noise = Math.round(a.noiseScore ?? 0);
    const biasCount = a.biases.length;
    const filename = (a.document?.filename ?? 'Untitled memo').slice(0, 60);
    const verdict = (a.metaVerdict ?? '').slice(0, 90);

    const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';

    return new ImageResponse(
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a0a1f 0%, #0f0f23 60%, #111133 100%)',
          color: '#e2e8f0',
          padding: '64px 72px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 22,
            color: '#94a3b8',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: '#16A34A',
              borderRadius: 2,
            }}
          />
          Decision Intel &middot; audit report
        </div>

        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: '#ffffff',
            marginTop: 36,
            lineHeight: 1.15,
            display: 'flex',
          }}
        >
          {filename}
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 18,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Decision Quality Index
            </div>
            <div style={{ fontSize: 120, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: 22, color: '#94a3b8' }}>out of 100</div>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}
          >
            <Stat label="Biases flagged" value={String(biasCount)} />
            <Stat label="Judge noise" value={`${noise}%`} />
          </div>
        </div>

        {verdict && (
          <div
            style={{
              fontSize: 22,
              color: '#cbd5e1',
              marginTop: 36,
              lineHeight: 1.4,
              fontStyle: 'italic',
              display: 'flex',
            }}
          >
            &ldquo;{verdict}&rdquo;
          </div>
        )}

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(148, 163, 184, 0.25)',
            paddingTop: 22,
          }}
        >
          <div style={{ fontSize: 22, color: '#94a3b8', display: 'flex' }}>
            Trust your IC&apos;s yes. Or know why you shouldn&apos;t.
          </div>
          <div
            style={{
              fontSize: 22,
              color: '#16A34A',
              fontWeight: 600,
              display: 'flex',
            }}
          >
            decisionintel.app &rarr;
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 }
    );
  } catch {
    return fallbackCard('Could not generate card');
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{ fontSize: 18, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}
      >
        {label}
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
        {value}
      </div>
    </div>
  );
}

function fallbackCard(message: string) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0f0f23',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 42,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {message}
    </div>,
    { width: 1200, height: 630 }
  );
}
