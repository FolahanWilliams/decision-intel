/**
 * ComparisonContent — single-comparison section renderer.
 *
 * Used by:
 *   - /compare (hub) — loops over COMPARISONS, renders all 6
 *   - /compare/[slug] (per-page) — renders the matched one only
 *
 * The rendering is identical across both surfaces so an LLM that
 * crawls /compare/cloverpop gets the SAME comparison block it would
 * get from /compare#cloverpop — no version drift between hub and
 * spoke. Visual layout extracted verbatim from the inline structure
 * in /compare/page.tsx as of 2026-05-23.
 */

import { Check, Minus } from 'lucide-react';
import type { Comparison } from '@/lib/data/compare-pages';

const C = {
  white: '#FFFFFF',
  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  green: '#16A34A',
  amber: '#D97706',
};

function VerdictIcon({ v }: { v: 'yes' | 'partial' | 'no' }) {
  if (v === 'yes') {
    return <Check size={16} style={{ color: C.green }} aria-label="Yes" />;
  }
  if (v === 'partial') {
    return <Minus size={16} style={{ color: C.amber }} aria-label="Partial" />;
  }
  return <Minus size={16} style={{ color: C.slate500 }} aria-label="No" />;
}

interface Props {
  comparison: Comparison;
  /** Optional `id` for hub-page anchor links. */
  sectionId?: string;
  /** Optional background color override (hub alternates slate50/white). */
  background?: string;
}

export function ComparisonContent({ comparison: c, sectionId, background }: Props) {
  return (
    <section
      id={sectionId}
      style={{
        padding: '56px 24px 56px',
        background: background ?? C.white,
        borderTop: `1px solid ${C.slate100}`,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 12,
            color: C.green,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Decision Intel vs {c.competitor}
        </div>
        <h2
          style={{
            fontSize: 'clamp(22px, 2.6vw, 32px)',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: 0,
            color: C.slate900,
            letterSpacing: '-0.01em',
          }}
        >
          {c.oneLiner}
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginTop: 28,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 10,
              padding: '18px 20px',
              borderTop: `3px solid ${C.slate500}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.slate500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              What {c.competitor} does well
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: C.slate700, margin: 0 }}>
              {c.competitorStrength}
            </p>
          </div>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 10,
              padding: '18px 20px',
              borderTop: `3px solid ${C.green}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Where Decision Intel is different
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: C.slate700, margin: 0 }}>
              {c.diDifferentiator}
            </p>
          </div>
        </div>

        <div
          style={{
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: C.slate50, borderBottom: `1px solid ${C.slate200}` }}>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: C.slate500,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Axis
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: C.green,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Decision Intel
                </th>
                <th
                  scope="col"
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: C.slate500,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {c.competitor}
                </th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{
                    borderBottom: ri === c.rows.length - 1 ? 'none' : `1px solid ${C.slate100}`,
                  }}
                >
                  <td
                    style={{
                      padding: '14px 16px',
                      verticalAlign: 'top',
                      color: C.slate900,
                      fontWeight: 600,
                    }}
                  >
                    {row.axis}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', color: C.slate700 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <VerdictIcon v={row.diVerdict} />
                      <span style={{ lineHeight: 1.5 }}>{row.decisionIntel}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'top', color: C.slate700 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <VerdictIcon v={row.competitorVerdict} />
                      <span style={{ lineHeight: 1.5 }}>{row.competitor}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {c.faq && c.faq.length > 0 && (
          <div style={{ marginTop: 36 }}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.slate500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: '0 0 16px',
              }}
            >
              FAQ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {c.faq.map((item, fi) => (
                <div
                  key={fi}
                  style={{
                    background: C.white,
                    border: `1px solid ${C.slate200}`,
                    borderRadius: 10,
                    padding: '16px 20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: C.slate900,
                      marginBottom: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.q}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: C.slate700 }}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
