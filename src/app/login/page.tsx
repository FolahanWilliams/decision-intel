'use client'

import { createClient } from '@/utils/supabase/client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Brain, BarChart3, Search, Loader2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')

  const handleGoogleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/api/auth/callback`
      }
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-primary)',
        backgroundImage: `
          radial-gradient(ellipse 70% 55% at 15% 10%, rgba(99, 102, 241, 0.14) 0%, transparent 65%),
          radial-gradient(ellipse 55% 60% at 85% 80%, rgba(168, 85, 247, 0.10) 0%, transparent 65%)
        `,
      }}
    >
      {/* Left panel — branding & features */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem',
          borderRight: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(8, 11, 20, 0.60)',
          backdropFilter: 'blur(40px) saturate(170%)',
          WebkitBackdropFilter: 'blur(40px) saturate(170%)',
          boxShadow: '1px 0 0 rgba(255,255,255,0.06)',
        }}
        className="hidden md:flex"
      >
        <div style={{ maxWidth: 480 }}>
          {/* Brand */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              <span style={{ color: 'var(--text-highlight)' }}>Decision</span>
              <span style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>Intel</span>
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Intelligence Platform
            </div>
          </div>

          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--text-highlight)',
            marginBottom: '0.75rem',
            lineHeight: 1.4,
          }}>
            Audit decisions for cognitive bias and noise
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}>
            Upload documents, detect hidden biases, and get actionable insights powered by AI analysis and semantic search.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Feature
              icon={<Brain size={18} />}
              title="Bias Detection"
              description="Identify confirmation bias, anchoring, sunk cost fallacy, and more"
            />
            <Feature
              icon={<BarChart3 size={18} />}
              title="Decision Quality Scoring"
              description="Quantified scores across multiple analysis dimensions"
            />
            <Feature
              icon={<Search size={18} />}
              title="Semantic Search & Chat"
              description="Ask questions about your documents with RAG-powered Q&A"
            />
            <Feature
              icon={<ShieldCheck size={18} />}
              title="Risk & Compliance Audits"
              description="GDPR, privacy, and regulatory compliance checks"
            />
          </div>
        </div>
      </div>

      {/* Right panel — sign in */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Mobile brand (hidden on desktop) */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              <span style={{ color: 'var(--text-highlight)' }}>Decision</span>
              <span style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>Intel</span>
            </div>
          </div>

          <div
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
              <h1 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--text-highlight)',
                marginBottom: '6px',
              }}>
                Welcome back
              </h1>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}>
                Sign in to continue to your dashboard
              </p>
            </div>

            {authError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: '1rem',
                fontSize: '13px',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
              }}>
                Sign-in failed. Please try again.
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '9999px',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35), 0 1px 0 rgba(255,255,255,0.12) inset',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? 'Redirecting...' : 'Sign in with Google'}
            </button>

            <p style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '1rem',
              lineHeight: 1.5,
            }}>
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>

          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '1.5rem',
          }}>
            Secured with Supabase Auth &middot; Enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{
        flexShrink: 0,
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '10px',
        backdropFilter: 'blur(8px)',
        color: 'var(--accent-primary)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '2px' }}>
          {title}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
