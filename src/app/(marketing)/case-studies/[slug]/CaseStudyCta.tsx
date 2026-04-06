'use client';

import { useEffect, useState } from 'react';
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
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate900: '#0F172A',
  red: '#DC2626',
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
        body: JSON.stringify({
          email,
          caseSlug: slug,
          company,
        }),
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
        }}
      >
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Got it &mdash; we&apos;ll be in touch shortly.
        </h3>
        <p style={{ fontSize: 14, color: C.slate400, margin: 0 }}>
          You&apos;ll hear from the founder within a business day with a sample analysis of one of
          your own deals.
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
      }}
    >
      <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
        Get this analysis for one of your own deals.
      </h3>
      <p style={{ fontSize: 14, color: C.slate400, marginBottom: 20, lineHeight: 1.6 }}>
        We&apos;ll run a memo or deck of your choosing through the same pipeline that produced this{' '}
        {hasDeepAnalysis ? 'hindsight-stripped analysis' : 'case review'}, and send you a written
        readout within a business day. No obligation, pilot slots only.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
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
            flex: 1,
            minWidth: 240,
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.18)',
            background: C.navyLight,
            color: C.white,
            fontSize: 14,
            outline: 'none',
          }}
          aria-label="Work email"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            background: status === 'submitting' ? C.greenDark : C.green,
            color: C.white,
            fontSize: 14,
            fontWeight: 600,
            cursor: status === 'submitting' ? 'wait' : 'pointer',
          }}
        >
          {status === 'submitting' ? 'Sending…' : 'Request a pilot'}
        </button>
      </form>

      {status === 'error' && errorMessage && (
        <p style={{ marginTop: 12, fontSize: 13, color: '#FCA5A5' }}>{errorMessage}</p>
      )}
    </div>
  );
}
