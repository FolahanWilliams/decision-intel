import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSpecimen, SPECIMEN_SLUGS, type SpecimenSeverity } from '@/lib/data/specimen-personas';
import { HISTORICAL_CASE_COUNT } from '@/lib/data/case-studies';
import { BIAS_EDUCATION } from '@/lib/constants/bias-education';
import { getAllRegisteredFrameworks } from '@/lib/compliance/frameworks';
import { PLATFORM_BASELINE_SNAPSHOT } from '@/lib/learning/platform-baseline-snapshot';

/**
 * BAFTA specimen artefact — the per-persona "what unaudited looks like"
 * leave-behind (repositioning plan §11, Workstream A). noindex until
 * validated; NOT in the sitemap. Shared via direct link / forwarded PDF,
 * never via organic search — so it does not need to rank, it needs to
 * persuade by artefact.
 *
 * Counts derive from canonical exports (never hardcoded) so the stats strip
 * cannot drift when the case library / taxonomy / framework registry change.
 */

const BIAS_COUNT = Object.keys(BIAS_EDUCATION).length;
const FRAMEWORK_COUNT = getAllRegisteredFrameworks().length;
const METHODOLOGY_VERSION = '2.4.0'; // drift-tolerant — illustrative retro-cover stamp

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  ink: '#0A0E27',
  paper: '#FFFFFF',
  bg: '#F8FAFC',
  border: '#E2E8F0',
  slate900: '#0F172A',
  slate600: '#475569',
  slate500: '#64748B',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#D97706',
  blue: '#2563EB',
  white: '#FFFFFF',
} as const;

function severityHex(s: SpecimenSeverity): string {
  return s === 'critical' ? C.red : s === 'high' ? C.amber : C.blue;
}

export function generateStaticParams() {
  return SPECIMEN_SLUGS.map(persona => ({ persona }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ persona: string }>;
}): Promise<Metadata> {
  const { persona } = await params;
  const spec = getSpecimen(persona);
  if (!spec) return { title: 'Specimen Not Found | Decision Intel' };
  return {
    title: `${spec.heroTitle} | Decision Intel`,
    description: spec.heroSub,
    // noindex until validated (repositioning plan §11). Not a search surface.
    robots: { index: false, follow: false },
  };
}

export default async function SpecimenPage({ params }: { params: Promise<{ persona: string }> }) {
  const { persona } = await params;
  const spec = getSpecimen(persona);
  if (!spec) notFound();

  const stats = [
    {
      value: String(FRAMEWORK_COUNT),
      label: 'regulatory frameworks (G7 / EU / GCC / African markets)',
    },
    {
      value: String(BIAS_COUNT),
      label:
        'cognitive biases (R²F taxonomy, DI-B-001 → DI-B-0' +
        String(BIAS_COUNT).padStart(2, '0') +
        ')',
    },
    {
      value: String(HISTORICAL_CASE_COUNT),
      label: 'historical corporate decisions, retro-audited',
    },
    {
      value: PLATFORM_BASELINE_SNAPSHOT.meanBrier.toFixed(3),
      label: 'Brier calibration baseline (CIA-analyst grade)',
    },
  ];

  return (
    <main style={{ background: C.bg, color: C.slate900, minHeight: '100vh' }}>
      <div
        style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}
        className="specimen-wrap"
      >
        {/* eyebrow */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: C.green,
            marginBottom: 16,
          }}
        >
          Decision Intel · Specimen audit · {spec.personaLabel}
        </div>

        {/* ── Page 1 — Hero ── */}
        <h1
          style={{
            fontFamily: 'var(--font-display, Georgia, serif)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            margin: '0 0 18px',
            color: C.ink,
          }}
        >
          {spec.heroTitle}
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: C.slate600,
            margin: '0 0 28px',
            maxWidth: 720,
          }}
        >
          {spec.heroSub}
        </p>

        {/* stats strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 1,
            background: C.border,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 8,
          }}
          className="specimen-stats"
        >
          {stats.map(s => (
            <div key={s.label} style={{ background: C.paper, padding: '16px 18px' }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: C.ink,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11.5, color: C.slate500, marginTop: 4, lineHeight: 1.4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <Divider label="What we found in the public record" />

        {/* ── Page 2 — public-record findings ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {spec.publicFailures.map(f => (
            <article key={f.company} style={cardStyle}>
              <h3 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: C.ink }}>
                {f.company}
              </h3>
              <div style={{ fontSize: 13, color: C.red, fontWeight: 600, marginBottom: 12 }}>
                {f.headline}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {f.findings.map((fi, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={severityChip(fi.severity)}>{fi.severity}</span>
                    <div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>
                        {fi.pattern}
                      </span>
                      <span style={{ fontSize: 13.5, color: C.slate600 }}> — {fi.gap}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <Divider label="Why it happens" />

        {/* ── Page 3 — empathic mode ── */}
        <h2 style={sectionH2}>{spec.whyTitle}</h2>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: C.slate600, margin: '0 0 20px' }}>
          {spec.whyLead}
        </p>
        <ol
          style={{
            margin: '0 0 20px',
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {spec.structuralReasons.map((r, i) => (
            <li key={i} style={{ display: 'flex', gap: 14 }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: C.ink,
                  color: C.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginBottom: 3 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 13.5, color: C.slate600, lineHeight: 1.6 }}>{r.body}</div>
              </div>
            </li>
          ))}
        </ol>
        <div style={{ ...cardStyle, borderLeft: `3px solid ${C.green}`, background: '#F0FDF4' }}>
          <p
            style={{ margin: 0, fontSize: 14, color: C.slate900, lineHeight: 1.6, fontWeight: 500 }}
          >
            {spec.notACritique}
          </p>
        </div>

        <Divider label="What the provenance record would have shown" />

        {/* ── Page 4 — retro DPR cover ── */}
        <div
          style={{
            background: C.ink,
            color: '#E2E8F0',
            borderRadius: 12,
            padding: '24px 26px',
            fontFamily: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
            fontSize: 13,
            lineHeight: 1.9,
            marginBottom: 20,
            overflowX: 'auto',
          }}
        >
          <div
            style={{ color: C.green, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 10 }}
          >
            DECISION PROVENANCE RECORD · {spec.retroDealName}
          </div>
          <DprLine k="DQI Grade" v={`${spec.retroGrade} (${spec.retroScore} / 100)`} />
          <DprLine k="Critical patterns" v={spec.retroCriticalPatterns.join(' · ')} />
          <DprLine k="Reference class" v={spec.retroReferenceClass} />
          <DprLine k="Validity class" v={spec.retroValidityClass} />
          <DprLine
            k="Methodology"
            v={`v${METHODOLOGY_VERSION} · tamper-evident SHA-256 input hash`}
          />
        </div>
        <p style={{ fontSize: 13.5, color: C.slate600, margin: '0 0 12px', fontWeight: 600 }}>
          The hardening questions the reviewer would have received:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
          {spec.hardeningQuestions.map((q, i) => (
            <div key={i} style={{ ...cardStyle, padding: '14px 16px', display: 'flex', gap: 10 }}>
              <span style={{ color: C.green, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: 13.5, color: C.slate900, lineHeight: 1.6 }}>{q}</span>
            </div>
          ))}
        </div>

        <Divider label="What you're missing right now" />

        {/* ── Page 5 — cost + feature stack ── */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <tbody>
              {spec.costRows.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: i < spec.costRows.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <td style={{ padding: '10px 0', color: C.slate600 }}>{r.variable}</td>
                  <td
                    style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700, color: C.ink }}
                  >
                    {r.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ ...cardStyle, background: C.navy, color: '#E2E8F0', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {spec.costMath.map((m, i) => (
              <div
                key={i}
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: i === spec.costMath.length - 1 ? C.white : '#CBD5E1',
                  fontWeight: i === spec.costMath.length - 1 ? 700 : 400,
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13.5, color: C.slate600, margin: '0 0 12px', fontWeight: 600 }}>
          What Decision Intel covers across the decision lifecycle:
        </p>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          {spec.lifecycle.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: 12,
                padding: '12px 16px',
                borderBottom: i < spec.lifecycle.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
              className="specimen-lifecycle-row"
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{row.stage}</div>
              <div>
                <div style={{ fontSize: 13, color: C.slate900 }}>{row.surface}</div>
                <div style={{ fontSize: 12, color: C.slate500, marginTop: 2 }}>
                  Prevents: {row.prevents}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* procurement artefact stack — shared */}
        <details style={{ ...cardStyle, marginBottom: 28 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: C.ink }}>
            Procurement-grade artefact stack
          </summary>
          <ul
            style={{
              margin: '12px 0 0',
              paddingLeft: 18,
              fontSize: 13,
              color: C.slate600,
              lineHeight: 1.7,
            }}
          >
            <li>
              {FRAMEWORK_COUNT}-framework regulatory map (EU AI Act Art 14 + Basel III ICAAP + SOX
              §404 + SEC AI disclosure + more)
            </li>
            <li>SOC 2 Type I issuance targeted Q4 2026 + Type II observation window underway</li>
            <li>
              DPA template (PDF + DOCX, redline-ready) + Sub-Processor Schedule with 30-day change
              SLA
            </li>
            <li>
              Audit-log retention SLA per tier (1y / 3y / 7y) + indemnification with named
              carve-outs
            </li>
            <li>Decision Provenance Record — hashed + tamper-evident on every audit</li>
          </ul>
        </details>

        {/* cover frame */}
        <div style={{ ...cardStyle, borderLeft: `3px solid ${C.green}`, marginBottom: 36 }}>
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: C.green,
              marginBottom: 6,
            }}
          >
            The one line for your committee
          </div>
          <p
            style={{ margin: 0, fontSize: 15, color: C.ink, lineHeight: 1.55, fontStyle: 'italic' }}
          >
            {spec.coverFrame}
          </p>
        </div>

        {/* ── CTA ── */}
        <div
          style={{
            background: C.ink,
            color: C.white,
            borderRadius: 14,
            padding: 32,
            textAlign: 'center',
            border: `1px solid rgba(22,163,74,0.35)`,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontSize: 26,
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}
          >
            {spec.ctaLabel}.
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#94A3B8',
              margin: '0 0 22px',
              maxWidth: 520,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            See a live audit first — no login, no card. Then run the same 60-second audit on your
            own next decision.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/demo" style={ctaPrimary}>
              See a live audit · no login
            </Link>
            <Link href="/login?mode=signup&redirect=/dashboard?onboarding=1" style={ctaSecondary}>
              {spec.ctaLabel} →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .specimen-lifecycle-row { grid-template-columns: 1fr !important; gap: 4px !important; }
        }
      `}</style>
    </main>
  );
}

// ── small presentational helpers ──

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '36px 0 20px' }}>
      <div style={{ height: 1, flex: 1, background: C.border }} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: C.slate500,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ height: 1, flex: 1, background: C.border }} />
    </div>
  );
}

function DprLine({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span style={{ color: '#64748B' }}>{k.padEnd(18, ' ')}</span>
      <span style={{ color: '#E2E8F0' }}>{v}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: C.paper,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '18px 20px',
};

const sectionH2: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: C.ink,
  letterSpacing: '-0.01em',
  margin: '0 0 12px',
  lineHeight: 1.25,
};

function severityChip(s: SpecimenSeverity): React.CSSProperties {
  const color = severityHex(s);
  return {
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color,
    background: `color-mix(in srgb, ${color} 10%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
    borderRadius: 6,
    padding: '3px 7px',
    marginTop: 1,
  };
}

const ctaPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '13px 26px',
  borderRadius: 8,
  background: C.green,
  color: C.white,
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
};

const ctaSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '13px 26px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'transparent',
  color: C.white,
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
};
