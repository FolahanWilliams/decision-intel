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
          Got it &mdash; we&apos;ll be in touch shortly.
        </h3>
        <p style={{ fontSize: 14, color: C.slate400, margin: 0 }}>
          You&apos;ll hear from the founder within a business day with a sample audit of one of
          your own strategic memos.
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
        <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Pilot slots available
        </span>
      </div>

      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
        See what we&apos;d flag in <em>your</em> next strategic memo.
      </h3>
      <p style={{ fontSize: 14, color: C.slate400, marginBottom: 20, lineHeight: 1.6 }}>
        Upload a strategic memo or board deck. Get the same{' '}
        {hasDeepAnalysis ? 'hindsight-stripped analysis' : 'bias audit'} you just saw for{' '}
        {company}, on your own high-stakes call, in under 60 seconds.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Link
          href="/login"
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
          <Upload size={15} />
          Try the Demo &mdash; Free
        </Link>
        <a
          href="#pilot-form"
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
          Request a Pilot
          <ArrowRight size={14} />
        </a>
      </div>

      <div
        id="pilot-form"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 16,
        }}
      >
        <p style={{ fontSize: 12, color: C.slate400, marginBottom: 10 }}>
          Or leave your email, we&apos;ll run a strategic memo of your choosing and send the
          readout within a business day.
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

        <p style={{ marginTop: 14, fontSize: 12, color: C.slate400 }}>
          Ready to audit your own memo right now?{' '}
          <a
            href="/login?redirect=/dashboard"
            onClick={() => trackEvent('case_study_signup_click', { slug, company })}
            style={{ color: C.white, fontWeight: 600, textDecoration: 'underline' }}
          >
            Create a free account &rarr;
          </a>
        </p>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
