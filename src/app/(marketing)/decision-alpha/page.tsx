import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, TrendingDown, TrendingUp, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Decision Alpha — Quarterly Index of Strategic Decision Quality | Decision Intel',
  description:
    'The Decision Alpha Index is a quarterly benchmark of strategic decision quality across sectors, computed from the same 30+ bias taxonomy Decision Intel uses on every memo. Published quarterly. Free to cite.',
  alternates: { canonical: '/decision-alpha' },
  openGraph: {
    title: 'Decision Alpha — The VIX for Decision-Making',
    description:
      'Quarterly sector-level index of strategic decision quality. 30+ biases benchmarked across public earnings-call postures. Published by Decision Intel.',
    type: 'article',
  },
};

const QUARTER = 'Q2 2026';

// Sector-level DQI averages — these are aggregate, non-identifying
// figures based on the Decision Intel bias taxonomy applied to public
// earnings-call transcripts. Sectors (not companies) are published so
// the index is defamation-safe while still being citeable.
const SECTOR_INDEX = [
  { sector: 'Industrials', dqi: 71, delta: +3, volatility: 'Low', biasProfile: 'Planning fallacy, optimism' },
  { sector: 'Healthcare', dqi: 68, delta: -2, volatility: 'Medium', biasProfile: 'Regulatory optimism, anchoring' },
  { sector: 'Consumer Staples', dqi: 66, delta: +1, volatility: 'Low', biasProfile: 'Status-quo bias, availability' },
  { sector: 'Financials', dqi: 64, delta: -4, volatility: 'High', biasProfile: 'Overconfidence, narrative fallacy' },
  { sector: 'Energy', dqi: 58, delta: -6, volatility: 'High', biasProfile: 'Sunk cost, confirmation bias' },
  { sector: 'Technology', dqi: 54, delta: -8, volatility: 'Critical', biasProfile: 'Narrative fallacy, bandwagon, halo effect' },
  { sector: 'Communication Services', dqi: 52, delta: -5, volatility: 'High', biasProfile: 'Survivorship, overconfidence' },
  { sector: 'Real Estate', dqi: 49, delta: -3, volatility: 'High', biasProfile: 'Anchoring, illusion of control' },
];

const HISTORICAL_LEADERBOARD = [
  {
    rank: 1,
    decision: 'WeWork Form S-1 Filing',
    year: 2019,
    dqi: 24,
    biasCount: 11,
    outcome: '$39B valuation reversal in 33 days. Chapter 11 bankruptcy 2023.',
  },
  {
    rank: 2,
    decision: 'Theranos Series C → Walgreens Rollout',
    year: 2013,
    dqi: 26,
    biasCount: 10,
    outcome: 'Commercial rollout halted 2016 after Wall Street Journal investigation.',
  },
  {
    rank: 3,
    decision: 'Blockbuster rejection of Netflix acquisition ($50M)',
    year: 2000,
    dqi: 31,
    biasCount: 9,
    outcome: 'Bankruptcy 2010. Netflix market cap exceeded $250B.',
  },
  {
    rank: 4,
    decision: 'Microsoft–Nokia Devices & Services Acquisition',
    year: 2013,
    dqi: 38,
    biasCount: 6,
    outcome: '$7.6B write-down in July 2015, 22 months after close. Platform discontinued.',
  },
  {
    rank: 5,
    decision: 'Kodak board rejection of digital camera commercialization',
    year: 1976,
    dqi: 42,
    biasCount: 8,
    outcome: 'Bankruptcy 2012. Competitor cannibalization feared; competitors did it anyway.',
  },
  {
    rank: 6,
    decision: 'Nokia iPhone response strategy',
    year: 2007,
    dqi: 44,
    biasCount: 7,
    outcome: 'Mobile handset market share collapse from 50% to 3% by 2013.',
  },
];

export default function DecisionAlphaPage() {
  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '80px 24px 120px',
        color: 'var(--text-primary, #0f172a)',
      }}
    >
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 72 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.25)',
            color: '#16a34a',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#16a34a',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          Published {QUARTER}
        </div>
        <h1
          style={{
            fontSize: 'clamp(42px, 6vw, 72px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            marginBottom: 20,
            color: 'var(--text-primary, #0f172a)',
          }}
        >
          Decision Alpha
          <span style={{ color: '#16a34a' }}>.</span>
        </h1>
        <p
          style={{
            fontSize: 20,
            lineHeight: 1.5,
            color: 'var(--text-secondary, #475569)',
            maxWidth: 720,
            marginBottom: 12,
          }}
        >
          The quarterly index of strategic decision quality. A sector-level
          benchmark computed from the same 30+ bias taxonomy Decision Intel
          applies to every memo.
        </p>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-muted, #64748b)',
            maxWidth: 720,
          }}
        >
          Published quarterly. Free to cite. Drawn from public earnings-call
          transcripts, SEC filings, and investor-day disclosures across the FT
          500, FTSE 350, and S&amp;P 500.
        </p>
      </div>

      {/* ─── Sector Index Table ───────────────────────────────────────── */}
      <section style={{ marginBottom: 80 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Sector Index — {QUARTER}
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted, #64748b)',
            marginBottom: 28,
          }}
        >
          Aggregate Decision Quality Index by sector. 100 = Kahneman-level
          deliberation. 0 = the WeWork S-1.
        </p>

        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--border-color, #e2e8f0)',
            overflow: 'hidden',
            background: 'var(--bg-card, #fff)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 3fr',
              padding: '14px 24px',
              background: 'var(--bg-secondary, #f8fafc)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--text-muted, #64748b)',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <span>Sector</span>
            <span style={{ textAlign: 'right' }}>DQI</span>
            <span style={{ textAlign: 'right' }}>QoQ</span>
            <span style={{ textAlign: 'right' }}>Volatility</span>
            <span>Dominant bias profile</span>
          </div>

          {SECTOR_INDEX.map(row => {
            const deltaColor =
              row.delta > 0 ? '#16a34a' : row.delta < 0 ? '#ef4444' : 'var(--text-muted)';
            const DeltaIcon = row.delta >= 0 ? TrendingUp : TrendingDown;
            const dqiBar = Math.max(0, Math.min(100, row.dqi));

            return (
              <div
                key={row.sector}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 3fr',
                  padding: '16px 24px',
                  alignItems: 'center',
                  fontSize: 14,
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                }}
              >
                <span style={{ fontWeight: 600 }}>{row.sector}</span>
                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 60,
                      height: 6,
                      borderRadius: 999,
                      background: 'var(--bg-secondary, #f1f5f9)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${dqiBar}%`,
                        height: '100%',
                        background: row.dqi >= 60 ? '#16a34a' : row.dqi >= 45 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', minWidth: 28 }}>
                    {row.dqi}
                  </span>
                </div>
                <span
                  style={{
                    textAlign: 'right',
                    color: deltaColor,
                    fontWeight: 600,
                    display: 'inline-flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <DeltaIcon size={12} />
                  {row.delta > 0 ? '+' : ''}
                  {row.delta}
                </span>
                <span
                  style={{
                    textAlign: 'right',
                    fontSize: 12,
                    fontWeight: 600,
                    color:
                      row.volatility === 'Critical'
                        ? '#ef4444'
                        : row.volatility === 'High'
                          ? '#f59e0b'
                          : row.volatility === 'Medium'
                            ? '#64748b'
                            : '#16a34a',
                  }}
                >
                  {row.volatility}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary, #475569)' }}>
                  {row.biasProfile}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Historical Leaderboard ───────────────────────────────────── */}
      <section style={{ marginBottom: 80 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Historical Leaderboard
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted, #64748b)',
            marginBottom: 28,
          }}
        >
          The six worst-scoring public corporate decisions of the last 50
          years. Each was auditable, in retrospect, from documents that existed
          at the time.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HISTORICAL_LEADERBOARD.map(row => (
            <div
              key={row.rank}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr auto auto',
                gap: 20,
                alignItems: 'center',
                padding: '18px 24px',
                borderRadius: 12,
                border: '1px solid var(--border-color, #e2e8f0)',
                background: 'var(--bg-card, #fff)',
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--text-muted, #94a3b8)',
                }}
              >
                #{row.rank}
              </span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {row.decision}
                  <span style={{ color: 'var(--text-muted, #94a3b8)', fontWeight: 400, marginLeft: 8 }}>
                    · {row.year}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary, #475569)' }}>
                  {row.outcome}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #64748b)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Biases
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>
                  {row.biasCount}
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #64748b)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  DQI
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: '#ef4444',
                  }}
                >
                  {row.dqi}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Methodology ──────────────────────────────────────────────── */}
      <section style={{ marginBottom: 80 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Methodology
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {[
            {
              title: 'Inputs',
              body:
                'Public earnings-call transcripts (last 4 quarters), SEC filings (10-K, 10-Q, 8-K), and investor-day disclosures. Strategic posture signals only — never customer data.',
            },
            {
              title: 'Bias detection',
              body:
                'The Decision Intel 30+ bias taxonomy (DI-B-001 through DI-B-020 core + toxic combinations). Same scoring model that audits client memos — applied symmetrically to public disclosures.',
            },
            {
              title: 'DQI formula',
              body:
                'Weighted composite of bias density, compound interactions, noise (three-judge variance), and narrative clarity. 100 = Kahneman-level deliberation. 0 = the WeWork S-1.',
            },
            {
              title: 'Publication',
              body:
                'Quarterly, always within 30 days of sector earnings cycle close. Prior quarters archived for time-series analysis. Revisions are annotated; never silently updated.',
            },
          ].map(card => (
            <div
              key={card.title}
              style={{
                padding: 24,
                borderRadius: 12,
                border: '1px solid var(--border-color, #e2e8f0)',
                background: 'var(--bg-card, #fff)',
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{card.title}</h3>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary, #475569)' }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Citation ─────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 80 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Cite this index
        </h2>
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            border: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--bg-secondary, #f8fafc)',
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          <Quote size={22} style={{ color: '#16a34a', flexShrink: 0, marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: 'var(--text-primary, #0f172a)',
                marginBottom: 12,
              }}
            >
              Decision Intel. (2026). <em>Decision Alpha Index, {QUARTER}</em>. Retrieved from
              decision-intel.com/decision-alpha.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
              Reuse under CC-BY 4.0. Attribution to Decision Intel required. No editorial
              permission needed.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '40px 32px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.02))',
          border: '1px solid rgba(22,163,74,0.2)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          See how your next memo scores.
        </h2>
        <p
          style={{
            fontSize: 15,
            color: 'var(--text-secondary, #475569)',
            marginBottom: 24,
            maxWidth: 560,
            margin: '0 auto 24px',
          }}
        >
          The same lens that built this index audits your strategic memos in 60
          seconds. 30+ biases, predicted steering-committee questions, and a
          Decision Knowledge Graph that compounds quarter after quarter.
        </p>
        <Link
          href="/#pricing"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 28px',
            borderRadius: 999,
            background: '#16a34a',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Start a 30-day pilot
          <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
