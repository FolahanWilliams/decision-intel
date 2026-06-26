import Link from 'next/link';
import { getUseCaseBySlug } from '@/lib/data/use-cases';

/**
 * Homepage role-router — LEADS with the Phase-1 ETA owner-operator wedge
 * (searcher / independent sponsor / serial acquirer, per the 2026-06-26 ICP
 * pivot) routed to /use/owner-operator-deal-audit, then the three BRIDGE
 * personas (corp dev / fund GP / fractional CSO) for organic homepage traffic
 * that self-selects. Deliberately wedge-LED, NOT F500 CSO / GC (those are the
 * Phase-4 ceiling, not the cold door — the fractional CSO card is the bridge,
 * never the enterprise ceiling). Persona "you" copy is ego-safe per the
 * pain-framing lock — it names the stakes a buyer owns, never "broken
 * thinking". Workflow names + CTAs are read from the use-cases SSOT (no
 * drift); only the persona framing lives here.
 *
 * Solves the "one homepage, many buyers" conversion gap without touching the
 * locked hero / sign-in-first / category-claim decisions. The dedicated ETA
 * DM-landing page is /use/owner-operator-deal-audit (Layer 1); this re-point
 * is Layer 2 — the homepage stays coherent for an ETA buyer who clicks in.
 */

const C = {
  navy: '#0F172A',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate200: '#E2E8F0',
  slate600: '#475569',
  green: '#16A34A',
};

export const ROLE_ROUTES = [
  {
    slug: 'owner-operator-deal-audit',
    persona: 'Searcher / Sponsor / Operator',
    you: "You're the buyer, the operator, and the only check on the deal, with no one to catch what you can't see before you sign.",
  },
  {
    slug: 'm-and-a-bias-audit',
    persona: 'Head of Corp Dev / M&A',
    you: 'You own the acquisition thesis the committee will bet millions on.',
  },
  {
    slug: 'fund-investment-thesis-audit',
    persona: 'Fund GP / Principal',
    you: 'You make the calls your investors, and your track record, get judged on.',
  },
  {
    slug: 'strategic-memo-audit',
    persona: 'Fractional CSO',
    you: 'You run three to five client engagements, and every memo you send out carries your name.',
  },
] as const;

export function RoleRouter() {
  const routes = ROLE_ROUTES.map(r => ({ ...r, u: getUseCaseBySlug(r.slug) })).filter(
    (r): r is typeof r & { u: NonNullable<typeof r.u> } => Boolean(r.u)
  );

  return (
    <section style={{ background: C.slate50, borderTop: `1px solid ${C.slate200}` }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.green,
              marginBottom: 12,
            }}
          >
            Whichever call you own
          </div>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: C.navy,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Start where you sit
          </h2>
          <p
            style={{
              fontSize: 17,
              color: C.slate600,
              marginTop: 12,
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            Four ways in. Each routes to the audit built for the decisions you actually make.
          </p>
        </div>

        <div
          className="role-router-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
        >
          {routes.map(r => (
            <Link
              key={r.slug}
              href={`/use/${r.slug}`}
              className="role-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 14,
                padding: 24,
                textDecoration: 'none',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: C.green,
                }}
              >
                {r.persona}
              </div>
              <p
                style={{
                  fontSize: 15,
                  color: C.slate600,
                  lineHeight: 1.55,
                  margin: '12px 0 0',
                  flexGrow: 1,
                }}
              >
                {r.you}
              </p>
              <span style={{ marginTop: 18, fontSize: 14, fontWeight: 600, color: C.navy }}>
                {r.u.ctaLabel} →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .role-card { transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease; }
        .role-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px -18px rgba(15,23,42,0.25);
          border-color: ${C.green};
        }
        @media (prefers-reduced-motion: reduce) {
          .role-card, .role-card:hover { transform: none; transition: none; }
        }
        @media (max-width: 900px) { .role-router-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 560px) { .role-router-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
