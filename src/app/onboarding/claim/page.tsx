'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// Demo → account claim flow (D9 deep, locked 2026-04-27).
//
// The /demo page produces a wow-moment audit owned by DEMO_USER_ID. When a
// visitor signs up, this thin page claims that audit by transferring its
// Document.userId to the new user (MOVE semantics) via /api/onboarding/
// claim-demo-analysis, then redirects to /documents/[id]?claimed=true so
// the doc page can render a "✓ Claimed from your demo run" toast.
//
// Auth flow: page checks supabase.auth.getUser() on mount; if unauthed,
// redirects to /login?redirect=/onboarding/claim?demoAnalysisId=X so the
// existing login redirect-handling brings them back here post-auth.
//
// Failure modes: 404 (audit not found), 410 (window expired or already
// claimed), 409 (lost race), 503 (transient). Each gets a specific UI
// message + retry CTA when retryable, dashboard link when not.

function ClaimRunner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoAnalysisId = searchParams.get('demoAnalysisId');
  const demoDocumentId = searchParams.get('demoDocumentId');

  const [status, setStatus] = useState<'pending' | 'claiming' | 'success' | 'error'>('pending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorRetryable, setErrorRetryable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const claim = async () => {
      if (!demoAnalysisId && !demoDocumentId) {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg(
          'No demo audit ID was provided in the URL. Run a new audit from the dashboard or paste a memo at /demo.'
        );
        setErrorRetryable(false);
        return;
      }

      // Auth check first — bounce to login with this URL as the redirect
      // target so we land back here post-auth.
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!authData.user) {
        const claimUrl = new URL('/onboarding/claim', window.location.origin);
        if (demoAnalysisId) claimUrl.searchParams.set('demoAnalysisId', demoAnalysisId);
        if (demoDocumentId) claimUrl.searchParams.set('demoDocumentId', demoDocumentId);
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('mode', 'signup');
        loginUrl.searchParams.set('redirect', claimUrl.pathname + claimUrl.search);
        router.replace(loginUrl.toString());
        return;
      }

      setStatus('claiming');

      try {
        const res = await fetch('/api/onboarding/claim-demo-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisId: demoAnalysisId ?? undefined,
            documentId: demoDocumentId ?? undefined,
          }),
        });

        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          setStatus('success');
          // Brief flash of success before navigation so the user has visual
          // confirmation rather than an instant route swap.
          setTimeout(() => {
            if (cancelled) return;
            router.replace(`/documents/${data.documentId}?claimed=true`);
          }, 600);
          return;
        }

        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus('error');
        setErrorMsg(errBody.error ?? 'Could not claim this audit.');
        // 503 + 409 are retryable (transient + race); 410 + 404 + 400 are not.
        setErrorRetryable(res.status === 503 || res.status === 409);
      } catch {
        if (cancelled) return;
        setStatus('error');
        setErrorMsg('Network error while claiming this audit. Please retry.');
        setErrorRetryable(true);
      }
    };

    claim();

    return () => {
      cancelled = true;
    };
  }, [demoAnalysisId, demoDocumentId, router]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-2xl)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          padding: 'var(--spacing-2xl)',
        }}
      >
        {(status === 'pending' || status === 'claiming') && (
          <>
            <Loader2
              size={36}
              className="animate-spin"
              style={{ color: 'var(--accent-primary)', margin: '0 auto var(--spacing-md)' }}
            />
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 6,
              }}
            >
              Claiming your demo audit
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Moving the audit you ran at /demo into your account…
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle
              size={36}
              style={{ color: 'var(--success)', margin: '0 auto var(--spacing-md)' }}
            />
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 6,
              }}
            >
              Claimed
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Opening your audit…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle
              size={36}
              style={{ color: 'var(--warning)', margin: '0 auto var(--spacing-md)' }}
            />
            <h1
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 6,
              }}
            >
              Couldn&apos;t claim this audit
            </h1>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '0 0 var(--spacing-md)',
                lineHeight: 1.5,
              }}
            >
              {errorMsg}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {errorRetryable && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              )}
              <Link
                href="/dashboard"
                className="btn"
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Go to dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClaimDemoAuditPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        </div>
      }
    >
      <ClaimRunner />
    </Suspense>
  );
}
