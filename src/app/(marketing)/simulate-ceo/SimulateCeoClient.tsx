'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('SimulateCeoClient');

const C = {
  navy: '#0F172A',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  red: '#DC2626',
  amber: '#D97706',
};

type SimQuestion = {
  question: string;
  gap: string;
  severity: 'low' | 'medium' | 'high';
};

type SimResult = {
  questions: SimQuestion[];
  disclaimer: string;
};

const SEVERITY_COLOR: Record<SimQuestion['severity'], string> = {
  high: C.red,
  medium: C.amber,
  low: C.green,
};

const SAMPLE_PROFILE =
  'Risk-averse CEO, 20 years in finance, hates surprises, always asks for worst-case numbers first, impatient with long preambles.';

export function SimulateCeoClient() {
  const [memo, setMemo] = useState('');
  const [profile, setProfile] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (memo.trim().length < 200) {
      setError('Paste at least 200 characters of the memo.');
      return;
    }
    if (profile.trim().length < 10) {
      setError('Add a one-line CEO profile (at least 10 characters).');
      return;
    }
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/simulate-ceo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo: memo.trim(), ceoProfile: profile.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error ?? 'Simulation failed. Try again.');
        return;
      }
      setResult(json.data);
    } catch (err) {
      log.warn('Simulate-CEO call failed:', err);
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: C.white, minHeight: '100vh', color: C.navy }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 24px 96px' }}>
        {/* Nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 48,
          }}
        >
          <Link
            href="/"
            style={{ fontSize: 14, fontWeight: 700, color: C.navy, textDecoration: 'none' }}
          >
            Decision Intel
          </Link>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.slate500,
            }}
          >
            Standalone teaser · free
          </span>
        </div>

        {/* Hero */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.green,
            marginBottom: 18,
          }}
        >
          Simulate my CEO
        </div>
        <h1
          style={{
            fontSize: 'clamp(30px, 4.8vw, 44px)',
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            color: C.navy,
            marginBottom: 18,
          }}
        >
          Paste a memo. Get the three questions your CEO is most likely to ask.
        </h1>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            color: C.slate600,
            marginBottom: 36,
          }}
        >
          Same primed-persona engine as the full Decision Intel pipeline, stripped down to a
          single-CEO simulation so you can stress-test a memo in the twelve minutes before you walk
          into the meeting. Free, no login. Three runs per day per IP.
        </p>

        {/* Form */}
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            marginBottom: 32,
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.slate500,
              marginBottom: 8,
            }}
          >
            One-line CEO profile
          </label>
          <input
            type="text"
            value={profile}
            onChange={e => setProfile(e.target.value)}
            placeholder={SAMPLE_PROFILE}
            maxLength={400}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${C.slate200}`,
              background: C.white,
              color: C.navy,
              fontSize: 15,
              marginBottom: 20,
            }}
          />

          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: C.slate500,
              marginBottom: 8,
            }}
          >
            The memo
          </label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="Paste the strategic memo, board paper, market-entry recommendation, or M&A summary. Minimum 200 characters."
            rows={14}
            maxLength={8000}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 10,
              border: `1px solid ${C.slate200}`,
              background: C.white,
              color: C.navy,
              fontSize: 14.5,
              fontFamily: 'inherit',
              lineHeight: 1.6,
              resize: 'vertical',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 14,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: C.slate500 }}>
              {memo.length.toLocaleString()}/8,000 characters
            </span>
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 10,
                border: 'none',
                background: submitting ? C.slate400 : C.green,
                color: C.white,
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Simulating CEO…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Simulate CEO questions
                </>
              )}
            </button>
          </div>
          {error && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 8,
                background: `${C.red}15`,
                color: C.red,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={15} />
              {error}
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div
            style={{
              padding: 28,
              borderRadius: 16,
              background: C.navy,
              color: C.white,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#86EFAC',
                marginBottom: 14,
              }}
            >
              Three questions the CEO will ask
            </div>
            <ol
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {result.questions.map((q, i) => (
                <li key={i} style={{ display: 'flex', gap: 14 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: `${SEVERITY_COLOR[q.severity]}30`,
                      border: `1px solid ${SEVERITY_COLOR[q.severity]}`,
                      color: SEVERITY_COLOR[q.severity],
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: C.white,
                        lineHeight: 1.4,
                        marginBottom: 6,
                      }}
                    >
                      &ldquo;{q.question}&rdquo;
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: C.slate400,
                        lineHeight: 1.55,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color: SEVERITY_COLOR[q.severity],
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontSize: 10.5,
                          marginRight: 8,
                        }}
                      >
                        {q.severity} gap
                      </span>
                      {q.gap}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: `1px solid ${C.slate700}`,
                fontSize: 12.5,
                color: C.slate400,
                lineHeight: 1.6,
              }}
            >
              {result.disclaimer}
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 13.5,
                color: C.slate400,
                lineHeight: 1.6,
              }}
            >
              Want all five rigor layers, not just the boardroom?{' '}
              <span style={{ color: C.slate500 }}>
                Knowledge Graph, boardroom simulation, reasoning audit, what-if counterfactual, and
                outcome loop.
              </span>
            </div>
            <Link
              href="/demo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                padding: '10px 18px',
                borderRadius: 10,
                background: C.white,
                color: C.navy,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Run the full reasoning audit <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Explanatory footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${C.slate200}`,
            fontSize: 14,
            color: C.slate600,
            lineHeight: 1.7,
          }}
        >
          <strong style={{ color: C.navy }}>How it works.</strong> Decision Intel&rsquo;s full
          pipeline runs five primed boardroom personas (CEO, CFO, GC, domain lead, dissenting
          director) against your memo, arbitrated through the Recognition-Rigor Framework. This page
          is the single-CEO teaser. It&rsquo;s the same engine, cut down for speed. When
          you&rsquo;re ready for the full audit with Decision Provenance Record, try{' '}
          <Link href="/demo" style={{ color: C.green, fontWeight: 600 }}>
            the free demo
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
