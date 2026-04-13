'use client';

import { createClient } from '@/utils/supabase/client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ShieldCheck,
  Brain,
  BarChart3,
  Search,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics/track';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function getErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'access_denied':
      return 'Access was denied. You may have cancelled the sign-in flow.';
    case 'server_error':
      return 'Google authentication failed. Please try again in a moment.';
    case 'temporarily_unavailable':
      return 'The authentication service is temporarily unavailable. Please try again later.';
    case 'invalid_request':
      return 'Invalid authentication request. Please clear your cookies and try again.';
    case 'session_expired':
      return 'Your session has expired. Please sign in again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');
  const errorMessage = getErrorMessage(authError);

  const redirectTo = searchParams.get('redirect');

  const handleGoogleLogin = async () => {
    setLoading(true);
    trackEvent('signup_started', { provider: 'google' });
    const supabase = createClient();
    const callbackUrl = new URL('/api/auth/callback', location.origin);
    if (redirectTo) {
      callbackUrl.searchParams.set('redirect', redirectTo);
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Ambient glows */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 20%, rgba(22, 163, 74, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 60% 40%, rgba(245, 158, 11, 0.04) 0%, transparent 50%)
          `,
        }}
      />

      {/* Left panel — branding & features */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          zIndex: 1,
        }}
        className="hidden md:flex"
      >
        <div style={{ maxWidth: 480 }}>
          {/* Brand */}
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '2.5rem' }}>
              <Image
                src="/logo.png"
                alt="Decision Intel"
                width={36}
                height={36}
                style={{
                  borderRadius: '10px',
                  objectFit: 'cover',
                }}
              />
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Decision Intel
              </span>
            </div>
          </Link>

          <h2
            style={{
              fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
            }}
          >
            Audit the reasoning behind every
            <span
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {' '}
              strategic memo
            </span>
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              marginBottom: '2rem',
              maxWidth: '440px',
            }}
          >
            Score cognitive biases, predict steering-committee objections, and turn every major
            call your team makes into a living Decision Knowledge Graph.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                icon: Brain,
                title: 'Bias Detection',
                description:
                  'Score 30+ cognitive biases with confidence, excerpts, and research-backed explanations',
                color: '#f59e0b',
              },
              {
                icon: BarChart3,
                title: 'Decision Quality Index',
                description:
                  'Auditable, board-ready evidence that your process was rigorous, compounding quarter over quarter',
                color: '#16A34A',
              },
              {
                icon: Search,
                title: 'Knowledge Graph',
                description:
                  'Every memo becomes a searchable, traceable node connected by assumption, bias, and outcome',
                color: '#3b82f6',
              },
              {
                icon: ShieldCheck,
                title: 'Risk & Compliance',
                description: 'FCA Consumer Duty, GDPR, and regulatory compliance audits',
                color: '#22c55e',
              },
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${feature.color}18`,
                    border: `1px solid ${feature.color}40`,
                    borderRadius: '10px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset',
                  }}
                >
                  <feature.icon size={18} style={{ color: feature.color }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    {feature.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {feature.description}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mini terminal preview */}
          <div
            style={{
              marginTop: '2rem',
              padding: '14px 16px',
              background: 'rgba(8, 11, 20, 0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              lineHeight: 1.8,
            }}
          >
            <span style={{ opacity: 0.4 }}>14:02:42</span>{' '}
            <span style={{ color: '#3b82f6' }}>AI</span> Scanning for cognitive anomalies...
            <br />
            <span style={{ color: '#f59e0b' }}>Warning:</span> Confirmatory Bias detected (94%)
            <br />
            <span style={{ opacity: 0.4 }}>14:02:43</span>{' '}
            <span style={{ color: '#22c55e' }}>RES</span> Decision Quality:{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>42/100</span>
          </div>
        </div>
      </div>

      {/* Right panel — sign in */}
      <div
        className="login-right-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile brand (hidden on desktop) */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div className="flex items-center justify-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Decision Intel"
                  width={36}
                  height={36}
                  style={{
                    borderRadius: '10px',
                    objectFit: 'cover',
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  Decision Intel
                </span>
              </div>
            </Link>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '8px',
              }}
            >
              Decision intelligence for strategic memos
            </p>
          </div>

          {/* Sign in card */}
          <div
            className="login-card"
            style={{
              padding: '2rem',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(8, 11, 20, 0.65)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '20px',
              boxShadow: '0 16px 56px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.08) inset',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h1
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome back
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Sign in to continue to your dashboard
              </p>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div
                role="alert"
                style={{
                  padding: '10px 14px',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  color: 'var(--error)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google sign in button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              aria-label="Sign in with Google"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 16px',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#fff',
                background:
                  'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                border: '1px solid rgba(22, 163, 74, 0.4)',
                borderRadius: '14px',
                boxShadow:
                  '0 4px 16px rgba(22, 163, 74, 0.35), 0 1px 0 rgba(255,255,255,0.12) inset',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
              {loading ? 'Redirecting...' : 'Sign in with Google'}
              {!loading && <ArrowRight size={16} style={{ opacity: 0.6 }} />}
            </button>

            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginTop: '1rem',
                lineHeight: 1.5,
              }}
            >
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>

          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '1.5rem',
              opacity: 0.7,
            }}
          >
            Secured with Supabase Auth &middot; Enterprise-grade encryption
          </p>
        </div>
      </div>

      {/* Mobile responsive overrides */}
      <style>{`
        @media (max-width: 640px) {
          .login-right-panel {
            padding: 1.25rem !important;
          }
          .login-card {
            padding: 1.5rem !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
