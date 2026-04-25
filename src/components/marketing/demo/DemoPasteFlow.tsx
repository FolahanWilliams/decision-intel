'use client';

/**
 * DemoPasteFlow — public paste-first audit surface at /demo.
 *
 * Visitors paste a strategic memo (≥50 / ≤4,000 words) and click Run free
 * audit. The full Decision Intel audit pipeline runs against the paste
 * via /api/demo/run (anonymous, encrypted at rest, rate-limited
 * 1/IP/24h). On completion the wow-sequence renders inline via
 * PasteAuditResults.
 *
 * Sample chips load from SAMPLE_BUNDLES so a visitor without a memo of
 * their own can still reach a real audit. ?sample=<slug> deep-links from
 * /case-studies/sample/[slug] pre-populate the textarea.
 *
 * Famous-decision cards link to /demo/[slug] for the static deep-view of
 * cases like Kodak / WeWork / Nokia (preDecisionEvidence + dqiEstimate).
 */

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { SAMPLE_BUNDLES_BY_SLUG, type SampleBundle } from '@/lib/data/sample-bundles';
import { PasteAuditResults } from './PasteAuditResults';
import { trackEvent } from '@/lib/analytics/track';
import type { AnalysisResult } from '@/types';

const C = {
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenSoft: '#F0FDF4',
  greenBorder: 'rgba(22,163,74,0.25)',
  red: '#DC2626',
  redSoft: '#FEF2F2',
};

// Featured sample slugs: a Pan-African PE roll-up leads (Sankore-shape
// design-partner signal + the EM overlay surfaces visibly), then a
// Series-B fintech growth round (multi-jurisdiction African regulatory
// risk), then the LATAM CSO market-entry (developed-EM bridge), then a
// classic MA IC memo. The four-chip set covers all four primary roles
// (pe_vc, pe_vc, cso, ma) and visibly leads with the African / EM story
// without sacrificing the corporate-strategy vocabulary the rest of the
// site is built around.
const FEATURED_SLUGS = [
  'pe-lagos-consumer-rollup',
  'pe-kenya-fintech-growth',
  'cso-brazil-market-entry',
  'ma-project-atlas-ic-memo',
] as const;

const MIN_WORDS = 50;
const MAX_WORDS = 4000;

interface DemoResult {
  documentId: string;
  analysisId: string | null;
  result: AnalysisResult;
}

interface FamousCaseLink {
  slug: string;
  company: string;
  year: number;
  industry: string;
}

interface DemoPasteFlowProps {
  famousCases: FamousCaseLink[];
}

const PROGRESS_PHASES = [
  'Anonymising and structuring the memo',
  'Detecting cognitive biases',
  'Running boardroom simulation',
  'Mapping regulatory frameworks',
  'Computing the Decision Quality Index',
] as const;

const PHASE_DURATION_MS = [4500, 9000, 9000, 6000, 5000];

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function DemoPasteFlow({ famousCases }: DemoPasteFlowProps) {
  const searchParams = useSearchParams();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phaseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeSampleSlug, setActiveSampleSlug] = useState<string | null>(null);

  // ?sample=<slug> deep link from /case-studies/sample/[slug]
  useEffect(() => {
    const slug = searchParams.get('sample');
    if (!slug) return;
    const bundle = SAMPLE_BUNDLES_BY_SLUG[slug];
    if (bundle) {
      setText(bundle.content);
      setActiveSampleSlug(slug);
      trackEvent('demo_sample_preloaded', { slug });
    }
  }, [searchParams]);

  function loadSample(bundle: SampleBundle) {
    setText(bundle.content);
    setActiveSampleSlug(bundle.slug);
    setError(null);
    trackEvent('demo_sample_loaded', { slug: bundle.slug });
    setTimeout(() => {
      const ta = document.getElementById('demo-paste-textarea');
      ta?.focus();
      ta?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  function clearSample() {
    setText('');
    setActiveSampleSlug(null);
  }

  function startPhaseProgression() {
    setPhaseIndex(0);
    phaseTimersRef.current = [];
    let acc = 0;
    PHASE_DURATION_MS.slice(0, -1).forEach((dur, i) => {
      acc += dur;
      const t = setTimeout(() => setPhaseIndex(i + 1), acc);
      phaseTimersRef.current.push(t);
    });
  }

  function clearPhaseProgression() {
    phaseTimersRef.current.forEach(t => clearTimeout(t));
    phaseTimersRef.current = [];
    setPhaseIndex(0);
  }

  useEffect(() => {
    return () => clearPhaseProgression();
  }, []);

  async function runAudit() {
    const wc = wordCount(text);
    if (wc < MIN_WORDS) {
      setError(`Paste at least ${MIN_WORDS} words so the audit has something to work with.`);
      return;
    }
    if (wc > MAX_WORDS) {
      setError(
        `Demo audits cap at ${MAX_WORDS.toLocaleString()} words. Trim and try again, or sign up for full-document audits.`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    startPhaseProgression();
    trackEvent('demo_audit_submitted', { word_count: wc, sample: activeSampleSlug });

    try {
      const res = await fetch('/api/demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success: true; data: DemoResult }
        | { success: false; error: string }
        | null;
      if (!res.ok || !json || json.success !== true) {
        const msg =
          (json && 'error' in json && json.error) ||
          `Audit failed (${res.status}). Please try again or sign up for a free account.`;
        setError(msg);
        trackEvent('demo_audit_failed', { status: res.status });
        return;
      }
      setResult(json.data);
      trackEvent('demo_audit_succeeded', { dqi: json.data.result.overallScore });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed. Please try again.');
      trackEvent('demo_audit_failed', { status: 0 });
    } finally {
      setSubmitting(false);
      clearPhaseProgression();
    }
  }

  const wc = wordCount(text);
  const canSubmit = wc >= MIN_WORDS && wc <= MAX_WORDS && !submitting;

  // ─── Result state ────────────────────────────────────────────────
  if (result) {
    return (
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 72px' }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
            padding: '14px 18px',
            background: C.greenSoft,
            border: `1px solid ${C.greenBorder}`,
            borderRadius: 12,
          }}
        >
          <CheckCircle2 size={20} color={C.green} />
          <div style={{ fontSize: 14, color: C.slate700, lineHeight: 1.5 }}>
            <strong style={{ color: C.slate900 }}>Audit complete.</strong> This ran the full
            Decision Intel audit against your paste — the same engine a paid run produces.
          </div>
        </motion.div>
        <PasteAuditResults
          documentId={result.documentId}
          analysisId={result.analysisId}
          result={result.result}
        />
        <section
          style={{
            marginTop: 32,
            padding: '22px 26px',
            background: C.white,
            border: `1px solid ${C.slate200}`,
            borderRadius: 14,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.slate900, marginBottom: 4 }}>
              Want to audit another?
            </div>
            <div style={{ fontSize: 13, color: C.slate600 }}>
              Free accounts get four audits a month with full document support, the Decision
              Knowledge Graph, and the Decision Provenance Record export.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setResult(null);
                setText('');
                setActiveSampleSlug(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: C.slate700,
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Run another paste
            </button>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                color: C.white,
                background: C.green,
                borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              Create free account <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ─── Paste state ─────────────────────────────────────────────────
  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 72px' }}>
      <section style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: C.green,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: 12,
          }}
        >
          One free audit · No login · No card
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 4.2vw, 42px)',
            fontWeight: 800,
            color: C.slate900,
            margin: '0 0 14px',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Audit a strategic memo in 60 seconds.
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px, 1.6vw, 17px)',
            color: C.slate600,
            lineHeight: 1.6,
            margin: '0 auto',
            maxWidth: 640,
          }}
        >
          Paste any strategic memo, board recommendation, or market-entry analysis. The full
          Decision Intel audit runs against it: cognitive-bias detection, boardroom simulation,
          counterfactual ROI, regulatory mapping. Encrypted at rest. Never used to train
          models.
        </p>
      </section>

      {/* Sample chips */}
      <section style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: C.slate500,
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          Or paste-load a sample
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {FEATURED_SLUGS.map(slug => {
            const bundle = SAMPLE_BUNDLES_BY_SLUG[slug];
            if (!bundle) return null;
            const active = activeSampleSlug === slug;
            return (
              <button
                key={slug}
                onClick={() => loadSample(bundle)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  background: active ? C.greenSoft : C.white,
                  border: active ? `1.5px solid ${C.green}` : `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background 0.12s, border 0.12s',
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: active ? C.green : C.slate900,
                    marginBottom: 4,
                  }}
                >
                  {bundle.title}
                </div>
                <div style={{ fontSize: 11.5, color: C.slate600, lineHeight: 1.45 }}>
                  {bundle.summary}
                </div>
                {bundle.marketContext === 'emerging_market' && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      color: C.green,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Emerging-market overlay
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Paste shell */}
      <section
        style={{
          background: C.white,
          border: `2px solid ${C.slate200}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 18,
        }}
      >
        <textarea
          id="demo-paste-textarea"
          value={text}
          onChange={e => {
            setText(e.target.value);
            setError(null);
            if (
              activeSampleSlug &&
              e.target.value !== SAMPLE_BUNDLES_BY_SLUG[activeSampleSlug]?.content
            ) {
              setActiveSampleSlug(null);
            }
          }}
          placeholder="Paste a strategic memo, board recommendation, or market-entry analysis. Min 50 words; max 4,000."
          rows={14}
          disabled={submitting}
          style={{
            width: '100%',
            minHeight: 240,
            padding: 14,
            fontSize: 14,
            lineHeight: 1.6,
            color: C.slate900,
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 10,
            resize: 'vertical',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: wc < MIN_WORDS ? C.slate500 : wc > MAX_WORDS ? C.red : C.slate700,
              fontWeight: 600,
            }}
          >
            {wc.toLocaleString()} / {MAX_WORDS.toLocaleString()} words
            {wc > 0 && wc < MIN_WORDS && (
              <span style={{ color: C.slate500, fontWeight: 400 }}>
                {' '}
                · {MIN_WORDS - wc} more to start
              </span>
            )}
            {activeSampleSlug && (
              <span style={{ marginLeft: 10, fontWeight: 400 }}>
                · Sample loaded ·{' '}
                <button
                  onClick={clearSample}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.green,
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    fontSize: 12,
                  }}
                >
                  clear
                </button>
              </span>
            )}
          </div>
          <button
            onClick={runAudit}
            disabled={!canSubmit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              fontSize: 14,
              fontWeight: 700,
              color: canSubmit ? C.white : C.slate400,
              background: canSubmit ? C.green : C.slate100,
              border: 'none',
              borderRadius: 10,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'background 0.12s',
              boxShadow: canSubmit ? '0 6px 16px rgba(22,163,74,0.22)' : 'none',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Running audit…
              </>
            ) : (
              <>
                Run free audit <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
        {error && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: C.redSoft,
              border: `1px solid ${C.red}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 13,
              color: C.slate900,
            }}
          >
            <AlertCircle size={16} color={C.red} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>{error}</div>
          </div>
        )}
        {submitting && (
          <div
            style={{
              marginTop: 14,
              padding: '14px 16px',
              background: C.slate50,
              border: `1px solid ${C.slate200}`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: C.slate700,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Live pipeline
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {PROGRESS_PHASES.map((phase, i) => {
                const isActive = i === phaseIndex;
                const isDone = i < phaseIndex;
                return (
                  <div
                    key={phase}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: isDone ? C.slate500 : isActive ? C.slate900 : C.slate400,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={14} color={C.green} />
                    ) : isActive ? (
                      <Loader2 size={14} className="animate-spin" color={C.green} />
                    ) : (
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          border: `1.5px solid ${C.slate200}`,
                        }}
                      />
                    )}
                    <span style={{ fontWeight: isActive ? 700 : 500 }}>{phase}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Trust strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 18,
          flexWrap: 'wrap',
          marginBottom: 36,
          fontSize: 12,
          color: C.slate500,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Lock size={12} color={C.slate500} /> AES-256-GCM at rest
        </span>
        <span>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={12} color={C.slate500} /> Same engine as paid audits
        </span>
        <span>·</span>
        <span>1 audit per visitor per 24h</span>
      </div>

      {/* Famous-decision case strip */}
      {famousCases.length > 0 && (
        <section style={{ borderTop: `1px solid ${C.slate200}`, paddingTop: 32 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: C.slate500,
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            Or browse a pre-loaded famous-decision audit
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {famousCases.map(c => (
              <Link
                key={c.slug}
                href={`/demo/${c.slug}`}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  background: C.white,
                  border: `1px solid ${C.slate200}`,
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: C.slate900,
                  transition: 'border 0.12s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  <FileText size={13} color={C.green} />
                  {c.company} · {c.year}
                </div>
                <div style={{ fontSize: 11.5, color: C.slate600, lineHeight: 1.4 }}>
                  {c.industry}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.green,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Open the audit <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
