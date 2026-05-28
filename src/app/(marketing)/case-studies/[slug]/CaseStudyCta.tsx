'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Upload } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/track';

interface CaseStudyCtaProps {
  slug: string;
  company: string;
  hasDeepAnalysis: boolean;
}

type Status = 'idle' | 'submitting' | 'done' | 'error';

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  green: '#16A34A',
  greenDark: '#15803D',
  slate400: '#94A3B8',
} as const;

export function CaseStudyCta({ slug, company, hasDeepAnalysis }: CaseStudyCtaProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    trackEvent('case_study_viewed', { slug, company, hasDeepAnalysis });
  }, [slug, company, hasDeepAnalysis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage(null);
    trackEvent('case_study_cta_click', { slug, company });

    try {
      const res = await fetch('/api/pilot-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, caseSlug: slug, company }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Submission failed');
      }

      trackEvent('case_study_contact_submit', { slug, company });
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed');
    }
  };

  if (status === 'done') {
    return (
      <div
        style={{
          background: C.navy,
          color: C.white,
          padding: 32,
          borderRadius: 14,
          textAlign: 'center',
          border: '1px solid rgba(22, 163, 74, 0.35)',
          boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.08), 0 8px 32px rgba(15, 23, 42, 0.12)',
        }}
      >
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Got it. We&apos;ll be in touch shortly.
        </h3>
        <p style={{ fontSize: 14, color: C.slate400, margin: 0 }}>
          You&apos;ll hear from the founder within a business day with a sample audit of one of your
          own strategic memos.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.navy,
        color: C.white,
        padding: 32,
        borderRadius: 14,
        border: '1px solid rgba(22, 163, 74, 0.35)',
        boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.08), 0 8px 32px rgba(15, 23, 42, 0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: C.green,
            animation: 'pulse 2s infinite',
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: C.green,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Pilot slots available
        </span>
      </div>

      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
        We caught these patterns in {company}&apos;s own record &mdash; before the outcome.
      </h3>
      <p style={{ fontSize: 14, color: C.slate400, marginBottom: 20, lineHeight: 1.6 }}>
        See the full {hasDeepAnalysis ? 'hindsight-stripped audit' : 'bias audit'} we ran &mdash; no
        login, no card. Then run the same 60-second audit on your own next memo.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Primary = the cold-evidence door. A reader arriving from a ChatGPT
            citation is cold; /demo lets them SEE a real audit with zero
            commitment (no login wall), matching their "show me" intent. The
            prior primary pointed at /login and bounced cold readers. */}
        <Link
          href="/demo"
          onClick={() => trackEvent('case_study_try_demo', { slug, company })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: C.green,
            color: C.white,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          See a live audit &middot; no login
        </Link>
        {/* Secondary = the warm door for readers ready to commit. */}
        <Link
          href="/login?mode=signup&redirect=/dashboard?onboarding=1"
          onClick={() => trackEvent('case_study_signup_click', { slug, company })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'transparent',
            color: C.white,
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Upload size={14} />
          Audit your own memo
          <ArrowRight size={14} />
        </Link>
      </div>

      <div
        id="pilot-form"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 16,
        }}
      >
        <p style={{ fontSize: 12, color: C.slate400, marginBottom: 10 }}>
          Or leave your email, we&apos;ll run a strategic memo of your choosing and send the readout
          within a business day.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (status === 'error') {
                setStatus('idle');
                setErrorMessage(null);
              }
            }}
            placeholder="your-email@firm.com"
            required
            disabled={status === 'submitting'}
            style={{
              flex: '1 1 200px',
              minWidth: 0,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.18)',
              background: C.navyLight,
              color: C.white,
              fontSize: 13,
              outline: 'none',
            }}
            aria-label="Work email"
          />
          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: status === 'submitting' ? C.greenDark : C.green,
              color: C.white,
              fontSize: 13,
              fontWeight: 600,
              cursor: status === 'submitting' ? 'wait' : 'pointer',
            }}
          >
            {status === 'submitting' ? 'Sending…' : 'Send'}
          </button>
        </form>
        {status === 'error' && errorMessage && (
          <p style={{ marginTop: 8, fontSize: 12, color: '#FCA5A5' }}>{errorMessage}</p>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
