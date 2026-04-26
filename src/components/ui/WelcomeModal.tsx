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
  FileText,
  Upload,
  Compass,
  Briefcase,
  TrendingUp,
  Landmark,
  Users,
} from 'lucide-react';

/**
 * First-login gate. Captures role (CSO / M&A / BizOps / PE-Venture-Fund /
 * Other) and kicks off the Onborda spotlight tour. Role + dismissal
 * persisted via PATCH /api/onboarding so the modal never re-shows and
 * downstream UI can personalize copy by role.
 *
 * The pe_vc track was added 2026-04-25 for the fund/investor persona
 * identified in design-partner research — junior/senior analysts and
 * partners at PE / venture / fund shops with IC workflows that look
 * different from a Fortune 500 CSO's. Per CLAUDE.md positioning we
 * don't market to PE/VC publicly, but once a fund signs up we honor
 * the workflow.
 *
 * Compressed 2026-04-25 from a 3-step modal (role / value props /
 * CTAs) to a single screen — the value-props middle step was redundant
 * with the marketing site the user just came from. The one-screen
 * layout shows role pills first, then reveals three primary actions
 * inline once a role is picked. Whole modal closes in two clicks (role
 * + CTA) instead of four (role + Continue + Next + CTA).
 */
const STORAGE_KEY = 'decision-intel-onboarding-completed';
const TOUR_TRIGGER_KEY = 'decision-intel-launch-tour';

type Role = 'cso' | 'ma' | 'bizops' | 'pe_vc' | 'other';

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
    id: 'pe_vc',
    label: 'PE / Venture / Fund',
    description: 'GP, partner, principal, or investment analyst at a fund',
    icon: Landmark,
  },
  {
    id: 'other',
    label: 'Something else',
    description: 'Founder, consultant, or exploring the product',
    icon: Users,
  },
];

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
      <Compass size={22} style={{ color: 'var(--accent-primary)' }} />
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
        <DialogHeader>
          {headerIcon}
          <DialogTitle style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
            Welcome to Decision Intel
          </DialogTitle>
          <DialogDescription>
            Quick: what describes your work? We&apos;ll tailor the first audit to it.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0 4px' }}>
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
                  padding: '10px 12px',
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
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <RoleIcon size={14} color={isSelected ? '#FFFFFF' : 'var(--text-secondary)'} />
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

        {/* CTAs reveal once a role is picked. Three primary actions on the
            same screen — no second step. Adaeze's audit catch on the
            three-step flow. */}
        {selectedRole && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {sampleError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(248, 113, 113, 0.08)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#f87171',
                }}
              >
                {sampleError}
              </div>
            )}
            <button
              onClick={() => completeOnboarding({ launchTour: true })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'var(--accent-primary)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 10,
                cursor: 'pointer',
                color: '#FFFFFF',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Compass size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Take the 60-second tour</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>
                  Spotlight the upload zone, audit tabs, Knowledge Graph.
                </div>
              </div>
            </button>
            <button
              onClick={() => completeOnboarding()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
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
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Upload size={16} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Upload a strategic memo now
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  PDF, DOCX, PPTX, XLSX — up to 5MB.
                </div>
              </div>
            </button>
            <button
              onClick={handleTrySample}
              disabled={loadingSample}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
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
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {loadingSample ? 'Loading sample...' : 'Try with a sample memo'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  See the platform in action with a pre-loaded example.
                </div>
              </div>
            </button>
          </div>
        )}

        {!selectedRole && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            Pick a role above to see the next step.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

