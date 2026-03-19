'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, Loader2, CheckCircle, AlertTriangle, LogIn } from 'lucide-react';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'accepting' | 'success' | 'error' | 'auth_required'>('accepting');
  const [orgName, setOrgName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;

    const acceptInvite = async () => {
      try {
        const res = await fetch('/api/team/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.status === 401) {
          setStatus('auth_required');
          return;
        }

        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to accept invitation');
          setStatus('error');
          return;
        }

        setOrgName(data.orgName);
        setStatus('success');

        // Redirect to team page after a short delay
        setTimeout(() => router.push('/dashboard/team'), 2500);
      } catch {
        setErrorMsg('Network error. Please try again.');
        setStatus('error');
      }
    };

    acceptInvite();
  }, [token, router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f23',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 420, width: '90%', textAlign: 'center' }}>
        {/* Accepting */}
        {status === 'accepting' && (
          <>
            <Loader2
              size={40}
              className="animate-spin"
              style={{ color: '#6366f1', marginBottom: 16 }}
            />
            <h2 style={{ marginBottom: 8 }}>Accepting Invitation...</h2>
            <p style={{ color: '#94a3b8' }}>Please wait while we add you to the team.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: 16 }} />
            <h2 style={{ marginBottom: 8 }}>Welcome to {orgName}!</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>
              You&apos;ve been added to the team. Redirecting to your team dashboard...
            </p>
            <div
              style={{
                width: '100%',
                height: 4,
                background: '#1a1a2e',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#22c55e',
                  animation: 'shrink 2.5s linear forwards',
                }}
              />
            </div>
            <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
          </>
        )}

        {/* Auth Required */}
        {status === 'auth_required' && (
          <>
            <Users size={40} style={{ color: '#6366f1', marginBottom: 16 }} />
            <h2 style={{ marginBottom: 8 }}>Sign In Required</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>
              You need to sign in or create an account before you can join the team.
            </p>
            <a
              href={`/login?redirect=/invite/${token}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: '#6366f1',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              <LogIn size={16} />
              Sign In to Continue
            </a>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <AlertTriangle size={40} style={{ color: '#ef4444', marginBottom: 16 }} />
            <h2 style={{ marginBottom: 8 }}>Invitation Error</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>{errorMsg}</p>
            <a
              href="/dashboard"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#6366f1',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              Go to Dashboard
            </a>
          </>
        )}
      </div>
    </div>
  );
}
