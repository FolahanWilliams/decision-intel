'use client';

import { createClient } from '@/utils/supabase/client';
import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  ShieldCheck,
  BarChart3,
  Search,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Mail,
  CheckCircle,
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

/**
 * Supabase's password-strength error dumps the raw character sets into the
 * message ("... abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ
 * 0123456789"), which reads as noise. Translate into a clean human sentence
 * based on which sets appear in the raw error, so the message stays accurate
 * even if password requirements change on the Supabase side.
 */
function cleanAuthError(message: string): string {
  if (!/password should contain/i.test(message)) return message;
  const needs: string[] = [];
  if (/[a-z]{10,}/.test(message)) needs.push('a lowercase letter');
  if (/[A-Z]{10,}/.test(message)) needs.push('an uppercase letter');
  if (/[0-9]{8,}/.test(message)) needs.push('a digit');
  if (/[!@#$%^&*()\-_=+[\]{};:'"\\|,.<>/?]{5,}/.test(message)) needs.push('a special character');

  if (needs.length === 0) return 'Password does not meet the requirements.';
  if (needs.length === 1) return `Password must include ${needs[0]}.`;
  const last = needs.pop();
  return `Password must include ${needs.join(', ')}, and ${last}.`;
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
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode: 'signin' | 'signup' | 'forgot' | 'reset' =
    modeParam === 'signup' || modeParam === 'forgot' || modeParam === 'reset'
      ? modeParam
      : 'signin';

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Errors delivered in the URL hash fragment by Supabase (e.g. otp_expired).
  // The server callback redirects to /login?error=true and Supabase appends
  // #error_code=...&error_description=... — only the client can read the hash.
  const [hashError, setHashError] = useState<{ code: string; description: string } | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // OTP fallback: when the PKCE magic-link flow fails (most commonly because
  // the flow-state TTL expires before the user clicks, or the email scanner
  // consumes the token), users can type the 6-digit code from the email
  // instead. Verified via supabase.auth.verifyOtp, which doesn't need the
  // PKCE code verifier cookie.
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const authError = searchParams.get('error');
  const errorMessage = getErrorMessage(authError);

  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.location.hash.slice(1);
    if (!raw) return;
    const params = new URLSearchParams(raw);
    const code = params.get('error_code');
    const description = params.get('error_description') ?? '';
    if (code) {
      setHashError({ code, description });
      // Clean the hash so refresh / back-nav doesn't re-show a stale error.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

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

  /**
   * Before attempting password auth, probe whether the email's domain has
   * an active SAML SSO configuration. If it does, the API returns a redirect
   * URL to the IdP and we short-circuit — password auth is bypassed because
   * enterprise SSO overrides local credentials. If the domain has no SSO,
   * the probe returns { ssoEnabled: false } and we fall through to the
   * existing email+password / Google OAuth paths unchanged.
   *
   * The probe endpoint is rate-limited per-IP to avoid becoming a
   * "which-companies-use-DI" enumeration oracle.
   */
  const probeSsoForEmail = async (candidate: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/sso/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: candidate }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { ssoEnabled?: boolean; redirectUrl?: string };
      if (data.ssoEnabled && data.redirectUrl) return data.redirectUrl;
      return null;
    } catch {
      return null;
    }
  };

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    setFormLoading(true);
    const supabase = createClient();
    trackEvent(mode === 'signin' ? 'signin_started' : 'signup_started', {
      provider: 'email',
    });

    try {
      if (mode === 'signin') {
        // SSO probe first — enterprise SSO overrides local password auth.
        const ssoUrl = await probeSsoForEmail(email);
        if (ssoUrl) {
          trackEvent('signin_sso_initiated', {});
          window.location.href = ssoUrl;
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const safeRedirect = redirectTo && /^\/[^/]/.test(redirectTo) ? redirectTo : '/dashboard';
        window.location.href = safeRedirect;
      } else {
        const callbackUrl = new URL('/api/auth/callback', location.origin);
        if (redirectTo) callbackUrl.searchParams.set('redirect', redirectTo);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl.toString() },
        });
        if (error) throw error;
        setSignupSuccess(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setFormError(cleanAuthError(message));
    } finally {
      setFormLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setFormError(null);
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOtpError(null);
    const token = otpCode.replace(/\s+/g, '');
    if (!token || token.length < 6) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }
    if (!email) {
      setOtpError('Missing email — please sign up again.');
      return;
    }
    setVerifyingOtp(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });
      if (error) throw error;
      const safeRedirect = redirectTo && /^\/[^/]/.test(redirectTo) ? redirectTo : '/dashboard';
      window.location.href = safeRedirect;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not verify code.';
      setOtpError(cleanAuthError(message));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSendResetCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (!email) {
      setFormError('Enter your email to receive a reset code.');
      return;
    }
    setFormLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      trackEvent('password_reset_requested', { provider: 'email' });
      setMode('reset');
      setPassword('');
      setOtpCode('');
      setOtpError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send reset code.';
      setFormError(cleanAuthError(message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOtpError(null);
    const token = otpCode.replace(/\s+/g, '');
    if (!email) {
      setOtpError('Missing email — start the reset flow again.');
      return;
    }
    if (!token || token.length < 6) {
      setOtpError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setOtpError('New password must be at least 8 characters.');
      return;
    }
    setVerifyingOtp(true);
    try {
      const supabase = createClient();
      // Step 1: verify recovery OTP — establishes a recovery-authenticated session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery',
      });
      if (verifyError) throw verifyError;
      // Step 2: use the recovery session to update the password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      trackEvent('password_reset_completed', { provider: 'email' });
      const safeRedirect = redirectTo && /^\/[^/]/.test(redirectTo) ? redirectTo : '/dashboard';
      window.location.href = safeRedirect;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not reset password.';
      setOtpError(cleanAuthError(message));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setFormError('Enter your email below, then click resend.');
      return;
    }
    setResending(true);
    setFormError(null);
    try {
      const supabase = createClient();
      const callbackUrl = new URL('/api/auth/callback', location.origin);
      if (redirectTo) callbackUrl.searchParams.set('redirect', redirectTo);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      if (error) throw error;
      setResendSuccess(true);
      setHashError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not resend confirmation email.';
      setFormError(cleanAuthError(message));
    } finally {
      setResending(false);
    }
  };

  // Translate Supabase hash-error codes into user-facing copy.
  const hashErrorMessage = (() => {
    if (!hashError) return null;
    const { code, description } = hashError;
    const lowerDesc = description.toLowerCase();
    if (code === 'otp_expired' || (code === 'access_denied' && lowerDesc.includes('email link'))) {
      return 'This confirmation link expired, was already used, or was opened in a different browser. Enter your email below to send a new one.';
    }
    if (code === 'access_denied') {
      return 'Sign-in was cancelled or denied.';
    }
    return description || 'Authentication failed. Please try again.';
  })();

  const canResend =
    !!hashError &&
    (hashError.code === 'otp_expired' ||
      (hashError.code === 'access_denied' &&
        hashError.description.toLowerCase().includes('email link')));

  return (
    <div
      className="login-root"
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#FFFFFF',
        color: '#0F172A',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Left panel — brand + enterprise pitch (matches landing voice) */}
      <div
        className="login-left-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2.5rem 3rem 2rem',
          background: '#F8FAFC',
          borderRight: '1px solid #E2E8F0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top: brand + back-to-site link */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Image
              src="/logo.png"
              alt="Decision Intel"
              width={32}
              height={32}
              style={{ borderRadius: '8px', objectFit: 'cover' }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.05rem',
                color: '#0F172A',
                letterSpacing: '-0.01em',
              }}
            >
              Decision Intel
            </span>
          </Link>
          <Link
            href="/"
            className="login-back-link"
            style={{
              fontSize: '0.78rem',
              color: '#64748B',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Back to site
          </Link>
        </div>

        {/* Middle: enterprise pitch */}
        <div style={{ maxWidth: 480, margin: '2rem 0' }}>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: '#16A34A',
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              margin: '0 0 14px',
            }}
          >
            Decision Intelligence
          </p>
          <h2
            style={{
              fontSize: 'clamp(1.6rem, 2.8vw, 2.1rem)',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '1rem',
              lineHeight: 1.15,
              letterSpacing: '-0.025em',
            }}
          >
            The native reasoning layer for{' '}
            <span style={{ color: '#16A34A' }}>boardroom strategic decisions.</span>
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              color: '#475569',
              lineHeight: 1.65,
              marginBottom: '2rem',
              maxWidth: '460px',
            }}
          >
            Audit every strategic memo, simulate steering-committee objections, and compound your
            team&rsquo;s judgment into a living Decision Knowledge Graph &mdash; quarter after
            quarter.
          </p>

          {/* Four Moments — landing-aligned vocabulary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                title: 'Decision Knowledge Graph',
                description:
                  'Every memo, assumption, bias, and outcome linked into one navigable graph.',
              },
              {
                title: 'AI boardroom simulation',
                description: 'Walk in with every CEO, CFO, and board objection already answered.',
              },
              {
                title: 'Human-AI reasoning audit',
                description:
                  'Your team keeps the judgment. The system keeps the receipts — every flag traceable.',
              },
              {
                title: 'What-if + Decision Quality Index',
                description:
                  'Counterfactual replay before the call; auditable DQI compounding after.',
              },
            ].map((moment, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    borderRadius: '999px',
                    marginTop: '2px',
                  }}
                >
                  <CheckCircle size={12} strokeWidth={2.5} style={{ color: '#16A34A' }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#0F172A',
                      marginBottom: '2px',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {moment.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.55 }}>
                    {moment.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: compliance trust strip — same as landing */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
            paddingTop: '20px',
            borderTop: '1px solid #E2E8F0',
          }}
        >
          {[
            { Icon: ShieldCheck, label: 'SOC 2 ready' },
            { Icon: Search, label: 'GDPR + EU AI Act mapped' },
            { Icon: BarChart3, label: '135-case reference library' },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#64748B',
                letterSpacing: '0.01em',
              }}
            >
              <Icon size={13} style={{ color: '#16A34A', flexShrink: 0 }} />
              {label}
            </div>
          ))}
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
          {/* Sign in card */}
          <div
            className="login-card"
            style={{
              padding: '2rem',
              border: '1px solid var(--border-color, #E2E8F0)',
              background: 'var(--bg-card, #FFFFFF)',
              borderRadius: '20px',
              boxShadow: '0 20px 48px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            {signupSuccess ? (
              <div style={{ padding: '0.5rem 0 1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      margin: '0 auto 1rem',
                      borderRadius: '50%',
                      background: 'rgba(22,163,74,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mail size={22} style={{ color: 'var(--accent-primary, #16A34A)' }} />
                  </div>
                  <h1
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Check your email
                  </h1>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                      marginBottom: '1.5rem',
                    }}
                  >
                    We sent a 6-digit code to <strong>{email}</strong>. Enter it below to finish
                    creating your account.
                  </p>
                </div>

                {otpError && (
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
                    <span>{otpError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} style={{ display: 'grid', gap: 12 }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={verifyingOtp}
                    aria-label="6-digit verification code"
                    style={{
                      padding: '12px 14px',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      letterSpacing: '0.25em',
                      textAlign: 'center',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-card, #FFFFFF)',
                      border: '1px solid var(--border-color, #E2E8F0)',
                      borderRadius: 10,
                      outline: 'none',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={verifyingOtp || otpCode.length < 6}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: '#16A34A',
                      border: '1px solid rgba(22, 163, 74, 0.4)',
                      borderRadius: 12,
                      cursor: verifyingOtp || otpCode.length < 6 ? 'not-allowed' : 'pointer',
                      opacity: verifyingOtp || otpCode.length < 6 ? 0.7 : 1,
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {verifyingOtp ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Verifying…
                      </>
                    ) : (
                      <>
                        Verify code
                        <ArrowRight size={14} style={{ opacity: 0.7 }} />
                      </>
                    )}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setSignupSuccess(false);
                      setOtpCode('');
                      setOtpError(null);
                      setMode('signin');
                      setPassword('');
                    }}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    Back to sign in
                  </button>
                </div>
              </div>
            ) : mode === 'forgot' ? (
              <div style={{ padding: '0.5rem 0 1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      margin: '0 auto 1rem',
                      borderRadius: '50%',
                      background: 'rgba(22,163,74,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mail size={22} style={{ color: 'var(--accent-primary, #16A34A)' }} />
                  </div>
                  <h1
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Forgot your password?
                  </h1>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                      marginBottom: '1.5rem',
                    }}
                  >
                    Enter your email and we&rsquo;ll send you a 6-digit code to reset it.
                  </p>
                </div>

                {formError && (
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
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSendResetCode} style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #475569)',
                      }}
                    >
                      Work email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      disabled={formLoading}
                      style={{
                        padding: '11px 14px',
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: 10,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: '#16A34A',
                      border: '1px solid rgba(22, 163, 74, 0.4)',
                      borderRadius: 12,
                      cursor: formLoading ? 'not-allowed' : 'pointer',
                      opacity: formLoading ? 0.7 : 1,
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        Send reset code
                        <ArrowRight size={14} style={{ opacity: 0.7 }} />
                      </>
                    )}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setFormError(null);
                    }}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    ← Back to sign in
                  </button>
                </div>
              </div>
            ) : mode === 'reset' ? (
              <div style={{ padding: '0.5rem 0 1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      margin: '0 auto 1rem',
                      borderRadius: '50%',
                      background: 'rgba(22,163,74,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Mail size={22} style={{ color: 'var(--accent-primary, #16A34A)' }} />
                  </div>
                  <h1
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    Enter your reset code
                  </h1>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.6,
                      marginBottom: '1.5rem',
                    }}
                  >
                    We sent a 6-digit code to <strong>{email}</strong>. Enter it below along with
                    your new password.
                  </p>
                </div>

                {otpError && (
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
                    <span>{otpError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #475569)',
                      }}
                    >
                      6-digit code
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      autoComplete="one-time-code"
                      maxLength={6}
                      disabled={verifyingOtp}
                      aria-label="6-digit reset code"
                      style={{
                        padding: '12px 14px',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        letterSpacing: '0.25em',
                        textAlign: 'center',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: 10,
                        outline: 'none',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #475569)',
                      }}
                    >
                      New password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      disabled={verifyingOtp}
                      style={{
                        padding: '11px 14px',
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: 10,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={verifyingOtp || otpCode.length < 6 || password.length < 8}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#fff',
                      background: '#16A34A',
                      border: '1px solid rgba(22, 163, 74, 0.4)',
                      borderRadius: 12,
                      cursor:
                        verifyingOtp || otpCode.length < 6 || password.length < 8
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: verifyingOtp || otpCode.length < 6 || password.length < 8 ? 0.7 : 1,
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {verifyingOtp ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Resetting…
                      </>
                    ) : (
                      <>
                        Reset password
                        <ArrowRight size={14} style={{ opacity: 0.7 }} />
                      </>
                    )}
                  </button>
                </form>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={e => handleSendResetCode(e as unknown as FormEvent<HTMLFormElement>)}
                    disabled={formLoading}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--accent-primary, #16A34A)',
                      background: 'none',
                      border: 'none',
                      cursor: formLoading ? 'not-allowed' : 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                      fontWeight: 600,
                      opacity: formLoading ? 0.6 : 1,
                    }}
                  >
                    {formLoading ? 'Sending…' : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setFormError(null);
                      setOtpError(null);
                      setOtpCode('');
                      setPassword('');
                    }}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    ← Back to sign in
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {mode === 'signin'
                      ? 'Sign in to your Decision Knowledge Graph'
                      : 'Start auditing strategic memos in 60 seconds'}
                  </p>
                </div>

                {/* Hash-fragment error (Supabase auth flow failures like otp_expired).
                    Takes priority over the URL-level error because it carries the specific
                    reason; the URL-level ?error=true is only the generic fallback. */}
                {hashError && !resendSuccess && (
                  <div
                    role="alert"
                    style={{
                      padding: '12px 14px',
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
                    <div style={{ flex: 1 }}>
                      <div style={{ lineHeight: 1.5 }}>{hashErrorMessage}</div>
                      {canResend && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={resending}
                          style={{
                            marginTop: 10,
                            padding: 0,
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-primary, #16A34A)',
                            textDecoration: 'underline',
                            textUnderlineOffset: '2px',
                            cursor: resending ? 'not-allowed' : 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            fontFamily: 'inherit',
                            opacity: resending ? 0.6 : 1,
                          }}
                        >
                          {resending ? 'Sending…' : 'Resend confirmation email'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Success state after resend */}
                {resendSuccess && (
                  <div
                    role="status"
                    style={{
                      padding: '12px 14px',
                      marginBottom: '1rem',
                      fontSize: '0.82rem',
                      color: 'var(--accent-primary, #16A34A)',
                      background: 'rgba(22,163,74,0.08)',
                      border: '1px solid rgba(22,163,74,0.25)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>
                      Confirmation email sent to <strong>{email}</strong>. Check your inbox and
                      click the link from the same browser.
                    </span>
                  </div>
                )}

                {/* URL-level error (OAuth failures, expired sessions, etc.) */}
                {errorMessage && !formError && !hashError && (
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

                {/* Form-level error (bad credentials, email already taken, etc.) */}
                {formError && (
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
                    <span>{formError}</span>
                  </div>
                )}

                {/* Google sign in button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading || formLoading}
                  aria-label={mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
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
                    background: '#16A34A',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(22,163,74,0.28)',
                    cursor: loading || formLoading ? 'not-allowed' : 'pointer',
                    opacity: loading || formLoading ? 0.7 : 1,
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                  {loading
                    ? 'Redirecting...'
                    : mode === 'signin'
                      ? 'Sign in with Google'
                      : 'Sign up with Google'}
                  {!loading && <ArrowRight size={16} style={{ opacity: 0.6 }} />}
                </button>

                {/* Divider */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '1.25rem 0',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--border-color, #E2E8F0)' }} />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                    }}
                  >
                    or
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-color, #E2E8F0)' }} />
                </div>

                {/* Email / password form */}
                <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #475569)',
                      }}
                    >
                      Work email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      disabled={formLoading || loading}
                      style={{
                        padding: '11px 14px',
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: 10,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary, #475569)',
                      }}
                    >
                      Password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={mode === 'signup' ? 8 : undefined}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                      disabled={formLoading || loading}
                      style={{
                        padding: '11px 14px',
                        fontSize: '0.88rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-card, #FFFFFF)',
                        border: '1px solid var(--border-color, #E2E8F0)',
                        borderRadius: 10,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={formLoading || loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      background: 'var(--bg-card, #FFFFFF)',
                      border: '1px solid var(--border-color, #CBD5E1)',
                      borderRadius: 12,
                      cursor: formLoading || loading ? 'not-allowed' : 'pointer',
                      opacity: formLoading || loading ? 0.7 : 1,
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                      </>
                    ) : mode === 'signin' ? (
                      <>
                        Sign in with email
                        <ArrowRight size={14} style={{ opacity: 0.6 }} />
                      </>
                    ) : (
                      <>
                        Create account
                        <CheckCircle size={14} style={{ opacity: 0.6 }} />
                      </>
                    )}
                  </button>
                </form>

                {/* Forgot password link (sign-in only) */}
                {mode === 'signin' && (
                  <p style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setFormError(null);
                        setOtpError(null);
                        setPassword('');
                      }}
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                        padding: 0,
                        fontFamily: 'inherit',
                      }}
                    >
                      Forgot your password?
                    </button>
                  </p>
                )}

                {/* Mode toggle */}
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: '1rem',
                  }}
                >
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    style={{
                      color: 'var(--accent-primary, #16A34A)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 'inherit',
                      padding: 0,
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px',
                    }}
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </>
            )}

            {!signupSuccess && (
              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginTop: '1rem',
                  lineHeight: 1.5,
                }}
              >
                By signing in, you agree to our{' '}
                <Link
                  href="/terms"
                  style={{
                    color: 'var(--accent-primary, #16A34A)',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  terms of service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  style={{
                    color: 'var(--accent-primary, #16A34A)',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  privacy policy
                </Link>
                .
              </p>
            )}
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
        @media (max-width: 767px) {
          .login-root {
            flex-direction: column !important;
            min-height: 100vh !important;
          }
          .login-left-panel {
            flex: 0 0 auto !important;
            padding: 2rem 1.5rem 1.5rem !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border-color, #E2E8F0) !important;
            justify-content: flex-start !important;
          }
          .login-right-panel {
            flex: 0 0 auto !important;
            padding: 1.5rem 1.25rem 2.5rem !important;
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
