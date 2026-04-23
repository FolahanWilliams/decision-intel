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
import {
  Sparkles,
  ArrowRight,
  FileText,
  Upload,
  Compass,
  Briefcase,
  TrendingUp,
  Users,
} from 'lucide-react';

/**
 * First-login gate. Captures role (CSO / M&A / BizOps / Other) and kicks off the
 * Onborda spotlight tour. Role + dismissal persisted via PATCH /api/onboarding
 * so the modal never re-shows and downstream UI can personalize copy by role.
 */
const STORAGE_KEY = 'decision-intel-onboarding-completed';
const TOUR_TRIGGER_KEY = 'decision-intel-launch-tour';

type Role = 'cso' | 'ma' | 'bizops' | 'other';

interface WelcomeModalProps {
  onClose: () => void;
}

const ROLES: Array<{
  id: Role;
  label: string;
  description: string;
  icon: typeof Compass;
}> = [
  {
    id: 'cso',
    label: 'Corporate Strategy',
    description: 'CSO, VP Strategy, or strategy team lead',
    icon: Compass,
  },
  {
    id: 'ma',
    label: 'M&A / Corp Dev',
    description: 'Evaluating acquisitions, investments, or market entry',
    icon: Briefcase,
  },
  {
    id: 'bizops',
    label: 'BizOps / FP&A',
    description: 'Forecasts, planning, and cross-functional decisions',
    icon: TrendingUp,
  },
  {
    id: 'other',
    label: 'Something else',
    description: 'Founder, consultant, or exploring the product',
    icon: Users,
  },
];

const VALUE_PROPS_BY_ROLE: Record<Role, string[]> = {
  cso: [
    'Audit strategic memos and board decks in 60 seconds — surface 30+ cognitive biases with excerpts.',
    'Predict the CEO, board, or parent-company questions before the room does.',
    'Track Decision Quality Index quarter after quarter, against 135 historical decisions.',
  ],
  ma: [
    'Pressure-test the deal memo — flag anchoring, sunk-cost, and overconfidence before IC.',
    'Predict the questions the steering committee will ask before they sink the deal.',
    'Close the outcome loop — every decision joins your Decision Knowledge Graph.',
  ],
  bizops: [
    'Audit strategic recommendations and planning memos for the biases that ship bad forecasts.',
    'Surface the assumptions your team treats as facts — with excerpts and recommendations.',
    'Track decision quality across quarters, so patterns become visible instead of anecdotal.',
  ],
  other: [
    'Upload any strategic memo, board deck, or market-entry recommendation.',
    'Surface 30+ cognitive biases, anchoring assumptions, and predicted objections in 60 seconds.',
    'Every audited decision joins your Decision Knowledge Graph — context compounds over time.',
  ],
};

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      onClose();
      return;
    }

    fetch('/api/onboarding')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))))
      .then(data => {
        if (data.onboardingCompleted) {
          localStorage.setItem(STORAGE_KEY, 'true');
          onClose();
        } else {
          if (data.onboardingRole && ROLES.some(r => r.id === data.onboardingRole)) {
            setSelectedRole(data.onboardingRole as Role);
          }
          setOpen(true);
        }
      })
      .catch(() => setOpen(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistState = useCallback(
    (data: { onboardingCompleted?: boolean; onboardingRole?: Role; onboardingStep?: number }) => {
      fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => console.warn('[WelcomeModal] persist onboarding failed:', err));
    },
    []
  );

  const completeOnboarding = useCallback(
    (options?: { launchTour?: boolean }) => {
      localStorage.setItem(STORAGE_KEY, 'true');
      persistState({
        onboardingCompleted: true,
        onboardingRole: selectedRole ?? 'other',
      });
      if (options?.launchTour) {
        localStorage.setItem(TOUR_TRIGGER_KEY, 'pending');
        window.dispatchEvent(new CustomEvent('di:launch-tour'));
      }
      setOpen(false);
      onClose();
    },
    [onClose, persistState, selectedRole]
  );

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

  if (!open) return null;

  const headerIcon = (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'rgba(22, 163, 74, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
      }}
    >
      <Sparkles size={22} style={{ color: 'var(--accent-primary)' }} />
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) completeOnboarding();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        {/* Step 0: role picker */}
        {step === 0 && (
          <>
            <DialogHeader>
              {headerIcon}
              <DialogTitle style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
                Welcome to Decision Intel
              </DialogTitle>
              <DialogDescription>
                One quick question so we tailor the next 60 seconds — what best describes your work?
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0 4px' }}>
              {ROLES.map(role => {
                const RoleIcon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      background: isSelected ? 'rgba(22, 163, 74, 0.06)' : 'var(--bg-card)',
                      border: `1px solid ${
                        isSelected ? 'var(--accent-primary)' : 'var(--border-color)'
                      }`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <RoleIcon
                        size={16}
                        color={isSelected ? '#FFFFFF' : 'var(--text-secondary)'}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {role.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 1,
                        }}
                      >
                        {role.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => selectedRole && setStep(1)}
              disabled={!selectedRole}
              className="btn btn-primary flex items-center justify-center gap-sm"
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px 16px',
                opacity: selectedRole ? 1 : 0.45,
                cursor: selectedRole ? 'pointer' : 'not-allowed',
              }}
            >
              Continue <ArrowRight size={14} />
            </button>
          </>
        )}

        {/* Step 1: value props tailored to role */}
        {step === 1 && selectedRole && (
          <>
            <DialogHeader>
              <DialogTitle style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
                Here&apos;s what you can do
              </DialogTitle>
              <DialogDescription>
                Decision Intel audits the strategic memo before the board sees it.
              </DialogDescription>
            </DialogHeader>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '8px 0 4px' }}>
              {VALUE_PROPS_BY_ROLE[selectedRole].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(22, 163, 74, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--accent-primary)',
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn btn-primary flex items-center justify-center gap-sm"
              style={{ width: '100%', marginTop: 12, padding: '10px 16px' }}
            >
              Next <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setStep(0)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
                padding: '6px 0',
              }}
            >
              Back
            </button>
          </>
        )}

        {/* Step 2: get started */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
                Ready to go
              </DialogTitle>
              <DialogDescription>Take the 60-second tour, or jump straight in.</DialogDescription>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '8px 0 4px' }}>
              <button
                onClick={() => completeOnboarding({ launchTour: true })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  background: 'var(--accent-primary)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  textAlign: 'left',
                  transition: 'filter 0.15s',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Compass size={20} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Take the 60-second tour</div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                    We&apos;ll spotlight the upload zone, audit tabs, and Knowledge Graph.
                  </div>
                </div>
              </button>

              <button
                onClick={() => completeOnboarding()}
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
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Upload size={20} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Upload a strategic memo now
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    PDF, DOCX, PPTX, XLSX — up to 5MB
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
                  opacity: loadingSample ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={20} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {loadingSample ? 'Loading sample...' : 'Try with a sample memo'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    See the platform in action with a pre-loaded example.
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
                padding: '6px 0',
                marginTop: 4,
              }}
            >
              Back
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
