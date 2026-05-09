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
import { FileText, Upload, Compass, Briefcase, TrendingUp, Landmark, Users } from 'lucide-react';

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

/**
 * Per-role value-prop card content (locked 2026-05-09, Ship B.2). Lands
 * the buyer-fit signal at the welcome moment: the chosen role surfaces
 * the moat-relevant capabilities by name, so the M&A user sees the
 * three toxic combinations the audit catches BEFORE they upload, not
 * after. The card renders inline between role-pick and the CTAs (only
 * after a role is selected). Each entry:
 *   eyebrow: short tag (procurement-grade language)
 *   headline: 1-line value summary
 *   bullets: 3 named capabilities relevant to the role
 *
 * Forward-looking rule: when a new role lands in ROLES, add a matching
 * VALUE_PROPS_BY_ROLE entry in the same commit; the type system
 * enforces this at compile time via the Record<Role, ...> shape.
 */
const VALUE_PROPS_BY_ROLE: Record<
  Role,
  { eyebrow: string; headline: string; bullets: string[] }
> = {
  cso: {
    eyebrow: 'For corporate strategy',
    headline: "We audit the reasoning behind your committee's strategic memos.",
    bullets: [
      'Bias detection on board recommendations + market-entry memos in 60 seconds',
      'Hashed, tamper-evident Decision Provenance Record for every audit',
      'Predicted CEO + audit-committee questions before the room asks them',
    ],
  },
  ma: {
    eyebrow: 'For M&A and corp dev',
    headline: 'Built for the M&A workflow — 9 document types, 5 toxic combinations.',
    bullets: [
      'Synergy Mirage detector (synergies without mechanism, owner, or 90-day milestone)',
      "Conglomerate Fallacy + Winner's Curse on far-adjacency and auction-process deals",
      'IC Readiness Gate scores 5 gates per deal so committee shows up green',
    ],
  },
  bizops: {
    eyebrow: 'For BizOps and FP&A',
    headline: 'Audits the planning memos that drive quarterly forecasts.',
    bullets: [
      'Anchoring + overconfidence detection on forecasts and buy-vs-build memos',
      'Outcome Flywheel surfaces calibration once realised quarterly outcomes accumulate',
      'Decision Packages bundle related decisions for cross-document review',
    ],
  },
  pe_vc: {
    eyebrow: 'For PE / venture / fund',
    headline: 'Audits IC memos against a 143-case M&A failure library.',
    bullets: [
      'Pre-IC blind-prior voting in Decision Rooms surfaces disagreement before the meeting',
      'Cross-fund DQI calibration once realised IRR / MOIC outcomes accumulate',
      'LP-grade DPR mapped to NDPR / WAEMU / CMA Kenya for African-LP procurement',
    ],
  },
  other: {
    eyebrow: 'Get oriented',
    headline: 'The reasoning audit platform — a 60-second take on any strategic memo.',
    bullets: [
      '22-bias taxonomy with academic citations',
      'Decision Quality Index from A to F, with traceable component scores',
      'Decision Knowledge Graph compounds quarter over quarter as outcomes accumulate',
    ],
  },
};

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

        {/* Value-prop card reveals once a role is picked. Lands the
            buyer-fit signal at the welcome moment: the M&A user sees
            the three toxic combinations the audit catches BEFORE
            uploading. (Locked 2026-05-09, Ship B.2.) */}
        {selectedRole && (
          <div
            style={{
              marginTop: 10,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(22, 163, 74, 0.05)',
              border: '1px solid rgba(22, 163, 74, 0.20)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent-primary)',
                marginBottom: 6,
              }}
            >
              {VALUE_PROPS_BY_ROLE[selectedRole].eyebrow}
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                marginBottom: 8,
              }}
            >
              {VALUE_PROPS_BY_ROLE[selectedRole].headline}
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 16,
                fontSize: 11.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
              }}
            >
              {VALUE_PROPS_BY_ROLE[selectedRole].bullets.map(b => (
                <li key={b} style={{ marginBottom: 2 }}>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

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

        {/* Art 13 privacy notice — always visible before any upload-triggering
            CTA. Mandatory disclosure under GDPR Art 13 (and equivalent NDPR /
            PoPIA / UK GDPR provisions): the data subject must be informed at
            the time personal data is collected, which for this product is the
            moment they upload a document. The notice replaces the prior
            "Pick a role above" hint (Adaeze persona caught it as
            condescending). */}
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
            border: '1px solid var(--border-color)',
            fontSize: 11.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Before you upload:</strong> documents are
          encrypted with AES-256-GCM at rest, transit-encrypted with TLS 1.2+, and a GDPR / NDPR
          anonymizer strips PII as the literal first step of the analysis pipeline — no LLM ever
          sees raw personal data.{' '}
          <a href="/privacy" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            See /privacy
          </a>{' '}
          for the full Art 13 disclosure (lawful basis, retention, your rights).
        </div>
      </DialogContent>
    </Dialog>
  );
}
