/**
 * Case-study OG image — GET /api/og-case-study/:slug
 *
 * Generates a 1200x630 social-unfurl card for a single case study page.
 * Public, no auth, renders from the in-repo case data only.
 */

import { ImageResponse } from 'next/og';
import {
  getCaseBySlug,
  isFailureOutcome,
  isSuccessOutcome,
  type CaseStudy,
} from '@/lib/data/case-studies';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ slug: string }> };

function outcomeLabel(outcome: CaseStudy['outcome']): string {
  return outcome.replace(/_/g, ' ').toUpperCase();
}

function outcomeColor(outcome: CaseStudy['outcome']): string {
  if (isFailureOutcome(outcome)) return '#ef4444';
  if (isSuccessOutcome(outcome)) return '#22c55e';
  return '#eab308';
}

export async function GET(_req: Request, { params }: RouteContext): Promise<Response> {
  const { slug } = await params;
  try {
    const caseStudy = getCaseBySlug(slug);
    if (!caseStudy) {
      return fallbackCard('Case study not found');
    }

    const badgeColor = outcomeColor(caseStudy.outcome);
    const hasDeep = !!caseStudy.preDecisionEvidence;
    const primaryBias = caseStudy.primaryBias || caseStudy.biasesPresent[0] || '';

    return new ImageResponse(
      (
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
            Decision Intel &middot; case study
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#ffffff',
                background: badgeColor,
                padding: '8px 16px',
                borderRadius: 999,
                letterSpacing: 0.5,
                display: 'flex',
              }}
            >
              {outcomeLabel(caseStudy.outcome)}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#cbd5e1',
                background: 'rgba(148, 163, 184, 0.15)',
                padding: '8px 16px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'flex',
              }}
            >
              {caseStudy.industry.replace(/_/g, ' ')} &middot; {caseStudy.year}
            </div>
            {hasDeep && (
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#EDE9FE',
                  background: '#5B21B6',
                  padding: '8px 16px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'flex',
                }}
              >
                Deep analysis
              </div>
            )}
          </div>

          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: '#ffffff',
              marginTop: 24,
              lineHeight: 1.05,
              letterSpacing: -1,
              display: 'flex',
            }}
          >
            {caseStudy.company}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: '#cbd5e1',
              marginTop: 12,
              lineHeight: 1.3,
              display: 'flex',
            }}
          >
            {caseStudy.title.slice(0, 90)}
          </div>

          {primaryBias && (
            <div
              style={{
                fontSize: 20,
                color: '#94a3b8',
                marginTop: 28,
                display: 'flex',
              }}
            >
              Primary bias flagged:{' '}
              <span style={{ color: '#ffffff', fontWeight: 600, marginLeft: 8 }}>
                {primaryBias}
              </span>
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
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return fallbackCard('Could not generate card');
  }
}

function fallbackCard(message: string) {
  return new ImageResponse(
    (
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
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
