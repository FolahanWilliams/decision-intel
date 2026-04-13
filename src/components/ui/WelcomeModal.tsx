'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Upload, BarChart3, Users, Sparkles, ArrowRight, FileText } from 'lucide-react';

/**
 * First-login gate. Shown once per user; dismissing it marks onboarding complete
 * both in localStorage and via PATCH /api/onboarding. After dismissal, the inline
 * OnboardingGuide takes over for ongoing progress tracking. Both components share
 * this same localStorage key so a user never sees both at once.
 */
const STORAGE_KEY = 'decision-intel-onboarding-completed';

interface WelcomeModalProps {
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    icon: Sparkles,
    title: 'Audit the strategic memo before the board sees it',
    description:
      'Upload strategic memos, board decks, or market-entry recommendations. Our 12-node pipeline surfaces 30+ cognitive biases \u2014 anchoring, confirmation, groupthink \u2014 with excerpts and recommendations, in under 60 seconds.',
  },
  {
    icon: BarChart3,
    title: 'Decision Quality Index, quarter after quarter',
    description:
      'Every memo gets a DQI score. Track which biases repeat, which assumptions predict outcomes, and which calls compound your edge \u2014 all against 146 historical decisions.',
  },
  {
    icon: Users,
    title: 'Predict the room. Close the loop.',
    description:
      'Predict the CEO, board, or parent-company questions before the room does \u2014 and close the outcome loop with the Decision Quality Index. Every decision joins your Decision Knowledge Graph.',
  },
];

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0); // 0 = welcome, 1 = tour, 2 = get started
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage first for instant decision (avoid flicker)
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      onClose();
      return;
    }

    // Verify with API
    fetch('/api/onboarding')
      .then(res => {
        if (!res.ok) throw new Error(`Onboarding API returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.onboardingCompleted) {
          localStorage.setItem(STORAGE_KEY, 'true');
          onClose();
        } else {
          setOpen(true);
        }
      })
      .catch(() => {
        // On API failure, show the modal (better to show than to skip)
        setOpen(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboardingCompleted: true }),
    }).catch(() => {}); // fire-and-forget
    setOpen(false);
    onClose();
  }, [onClose]);

  const handleTrySample = useCallback(async () => {
    setLoadingSample(true);
    setSampleError(null);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      if (!res.ok) {
        setSampleError('Failed to create sample document. Please try uploading your own.');
        return;
      }
      const data = await res.json();
      if (!data.documentId) {
        setSampleError('Sample created but no document returned. Please try uploading your own.');
        return;
      }
      completeOnboarding();
      router.push(`/documents/${data.documentId}`);
    } catch {
      setSampleError('Network error. Please try again or upload your own document.');
    } finally {
      setLoadingSample(false);
    }
  }, [completeOnboarding, router]);

  const handleUploadOwn = useCallback(() => {
    completeOnboarding();
    // Dashboard upload zone will be visible
  }, [completeOnboarding]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) completeOnboarding();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        {/* Step 0: Welcome */}
        {step === 0 && (
          <>
            <DialogHeader>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Sparkles size={24} color="#080808" />
              </div>
              <DialogTitle className="text-lg">Welcome to Decision Intel</DialogTitle>
              <DialogDescription>
                Make better decisions with AI-powered analysis. Here&apos;s what you can do:
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0' }}>
              {[
                'Detect 30+ cognitive biases across any strategic memo or board deck',
                'Predict the CEO, board, or parent-company questions before the room does',
                'Track Decision Quality Index across every call, quarter after quarter',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(22, 163, 74, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {i + 1}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="btn btn-primary flex items-center justify-center gap-sm"
              style={{ width: '100%', marginTop: 8, padding: '10px 16px' }}
            >
              Take a Quick Tour <ArrowRight size={14} />
            </button>
            <button
              onClick={completeOnboarding}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 13,
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              Skip — I&apos;ll explore on my own
            </button>
          </>
        )}

        {/* Step 1: Tour */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>How it works</DialogTitle>
            </DialogHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '4px 0' }}>
              {TOUR_STEPS.map((tourStep, i) => {
                const Icon = tourStep.icon;
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}
                      >
                        {tourStep.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {tourStep.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn btn-primary flex items-center justify-center gap-sm"
              style={{ width: '100%', marginTop: 8, padding: '10px 16px' }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          </>
        )}

        {/* Step 2: Get Started */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Ready to go</DialogTitle>
              <DialogDescription>Choose how you&apos;d like to start:</DialogDescription>
            </DialogHeader>

            {sampleError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(248, 113, 113, 0.08)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#f87171',
                  margin: '0 0 4px',
                }}
              >
                {sampleError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0' }}>
              <button
                onClick={handleUploadOwn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: 'inherit',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Upload size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Upload your own document
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    PDF, TXT, MD, or DOCX — up to 5MB
                  </div>
                </div>
              </button>

              <button
                onClick={handleTrySample}
                disabled={loadingSample}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  cursor: loadingSample ? 'wait' : 'pointer',
                  color: 'inherit',
                  textAlign: 'left',
                  transition: 'border-color 0.15s',
                  opacity: loadingSample ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--bg-card-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={20} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {loadingSample ? 'Creating sample...' : 'Try with a sample document'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    See the platform in action with a pre-loaded example
                  </div>
                </div>
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
