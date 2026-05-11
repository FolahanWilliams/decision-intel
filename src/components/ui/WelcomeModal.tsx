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
import { FileText, Upload, Compass, Briefcase, Landmark, Building2, Users } from 'lucide-react';
import { PHASE_1_PERSONAS, type Phase1PersonaId } from '@/lib/constants/icp';

/**
 * First-login gate (v3.5 HXC-first, merged 2026-05-11).
 *
 * Previously a two-step flow: WelcomeModal asked broad role (cso / ma /
 * bizops / pe_vc / other), then Phase1PersonaModal asked the v3.5 HXC
 * narrowing (fractional_cso / midmarket_corp_dev / smaller_fund_gp /
 * pe_backed_founder / other → waitlist). Two modals back-to-back asking
 * variations of the same question = bad UX.
 *
 * Now: single modal asks the v3.5 HXC question directly using
 * PHASE_1_PERSONAS as the canonical taxonomy. The API auto-derives
 * onboardingRole from phase1Persona via phase1PersonaToOnboardingRole,
 * so the downstream cascade (OnboardingTour, sample bundles,
 * role-empty-states, FirstRunInlineWalkthrough) keeps reading
 * onboardingRole unchanged.
 *
 * Phase1PersonaModal stays as the legacy backfill component — it fires
 * only when onboardingCompleted=true AND phase1Persona=null (users who
 * completed the old WelcomeModal flow before 2026-05-11).
 *
 * "Other" path captures free-text role detail and routes to a friendly
 * waitlist confirmation — DI is currently optimised for the four HXC
 * personas only, and the explicit waitlist captures non-buyer-class
 * sign-ups without distorting the Vohra HXC PMF metric.
 */
const STORAGE_KEY = 'decision-intel-onboarding-completed';
const TOUR_TRIGGER_KEY = 'decision-intel-launch-tour';

interface WelcomeModalProps {
  onClose: () => void;
}

/**
 * Icon map by HXC persona. Lucide icons chosen to read at 14px:
 *   fractional_cso     → Compass    (strategist navigating multiple engagements)
 *   midmarket_corp_dev → Briefcase  (deal-flow operator)
 *   smaller_fund_gp    → Landmark   (institutional capital allocator)
 *   pe_backed_founder  → Building2  (operating CEO inside a portfolio company)
 *   other              → Users      (waitlist / catch-all)
 */
const PERSONA_ICON: Record<Phase1PersonaId, typeof Compass> = {
  fractional_cso: Compass,
  midmarket_corp_dev: Briefcase,
  smaller_fund_gp: Landmark,
  pe_backed_founder: Building2,
  other: Users,
};

/**
 * Per-HXC-persona value-prop card. Sharpened from generic "Corporate Strategy /
 * M&A / BizOps" content to the v3.5 narrowing. Each entry lands the buyer-fit
 * signal at the welcome moment by naming the specific DI capability that
 * matches THIS persona's primary memo workflow.
 *
 * Forward-looking rule: when PHASE_1_PERSONAS changes (new persona, label
 * tweak, hxcEligible flip), edit PHASE_1_PERSONAS in icp.ts first, then this
 * map in the same commit. The TypeScript Record<Phase1PersonaId, ...> shape
 * enforces this at compile time.
 */
const VALUE_PROPS_BY_PERSONA: Record<
  Phase1PersonaId,
  { eyebrow: string; headline: string; bullets: string[] }
> = {
  fractional_cso: {
    eyebrow: 'For fractional CSOs',
    headline: 'Audits the strategic memos behind every client engagement, in 60 seconds each.',
    bullets: [
      '22-bias R²F detection on board recommendations + market-entry memos',
      "Decision Provenance Record per engagement — defensible artefact your client's audit committee can pull up",
      'Portfolio Bias Heatmap across all 3-5 client engagements compounds quarter over quarter',
    ],
  },
  midmarket_corp_dev: {
    eyebrow: 'For mid-market corp dev',
    headline: 'The audit that survives the diligence-integration handoff.',
    bullets: [
      'Synergy Mirage detector — flags claims missing mechanism, owner, or 90-day milestone',
      'Cross-doc conflict scan across CIM + QofE + IC memo + integration plan',
      'PMI Tracker: every IC memo claim auto-tracked as a Brier-scored prediction post-close',
    ],
  },
  smaller_fund_gp: {
    eyebrow: 'For smaller-fund GPs',
    headline: 'Pre-IC audit on every memo, against a 143-case M&A and venture failure library.',
    bullets: [
      'Reference-class forecast — outside view to counter inside-view optimism',
      'Pre-IC blind-prior voting in Decision Rooms surfaces disagreement before the meeting',
      'LP-grade DPR — hashed, tamper-evident, mapped to NDPR / WAEMU / CMA Kenya for cross-border governance',
    ],
  },
  pe_backed_founder: {
    eyebrow: 'For PE-backed founders',
    headline: 'Audits the strategic memo before the operating partner reads it.',
    bullets: [
      '22-bias detection on board recommendations + acquisition memos',
      'Predicted operating-partner questions before the meeting (pre-board pre-mortem)',
      'Decision Knowledge Graph survives team transitions, sponsor turnover, and LP audits',
    ],
  },
  other: {
    eyebrow: 'Decision Intel is currently optimised for four roles',
    headline: "Tell us your role — we'll reach out when the platform extends to it.",
    bullets: [],
  },
};

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Phase1PersonaId | null>(null);
  const [otherRoleDetail, setOtherRoleDetail] = useState('');
  const [step, setStep] = useState<'pick' | 'other_thanks'>('pick');
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
          // Restore selection if user dismissed mid-flow last session.
          if (data.phase1Persona && PHASE_1_PERSONAS.some(p => p.id === data.phase1Persona)) {
            setSelectedPersona(data.phase1Persona as Phase1PersonaId);
          }
          setOpen(true);
        }
      })
      .catch(() => setOpen(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistState = useCallback(
    (data: {
      onboardingCompleted?: boolean;
      phase1Persona?: Phase1PersonaId;
      phase1PersonaRoleDetail?: string;
      onboardingStep?: number;
    }) => {
      // canonical-exception — fire-and-forget persistence; UI flow continues
      // even if the request fails (it'll re-prompt next session). The
      // onboardingRole field is derived server-side from phase1Persona via
      // phase1PersonaToOnboardingRole in /api/onboarding so the downstream
      // cascade keeps working.
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
      if (!selectedPersona) return;
      localStorage.setItem(STORAGE_KEY, 'true');
      persistState({
        onboardingCompleted: true,
        phase1Persona: selectedPersona,
        ...(selectedPersona === 'other' && otherRoleDetail.trim()
          ? { phase1PersonaRoleDetail: otherRoleDetail.trim().slice(0, 200) }
          : {}),
      });
      if (options?.launchTour) {
        localStorage.setItem(TOUR_TRIGGER_KEY, 'pending');
        window.dispatchEvent(new CustomEvent('di:launch-tour'));
      }
      setOpen(false);
      onClose();
    },
    [onClose, otherRoleDetail, persistState, selectedPersona]
  );

  const handleOtherSubmit = useCallback(() => {
    if (selectedPersona !== 'other') return;
    // Persist with phase1Persona='other' + the free-text role detail, then
    // surface the friendly waitlist confirmation. We mark onboardingCompleted
    // here so the modal never re-fires for this user, even though they didn't
    // pick a HXC persona — the waitlist IS their onboarding completion.
    localStorage.setItem(STORAGE_KEY, 'true');
    persistState({
      onboardingCompleted: true,
      phase1Persona: 'other',
      phase1PersonaRoleDetail: otherRoleDetail.trim().slice(0, 200),
    });
    setStep('other_thanks');
  }, [otherRoleDetail, persistState, selectedPersona]);

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

  const isOther = selectedPersona === 'other';
  const valueProp = selectedPersona ? VALUE_PROPS_BY_PERSONA[selectedPersona] : null;

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          // If the user closes without picking a persona, do NOT mark
          // onboardingCompleted — let the modal re-fire next session so we
          // capture the HXC signal eventually.
          setOpen(false);
          if (selectedPersona) {
            completeOnboarding();
          } else {
            onClose();
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        {step === 'pick' ? (
          <>
            <DialogHeader>
              {headerIcon}
              <DialogTitle style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
                Welcome to Decision Intel
              </DialogTitle>
              <DialogDescription>
                Which of these best describes your work? We&apos;re currently optimised for four
                specific roles — picking one tunes the audit, the case studies we surface, and the
                network we point you at.
              </DialogDescription>
            </DialogHeader>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                margin: '8px 0 4px',
              }}
            >
              {PHASE_1_PERSONAS.map(persona => {
                const PersonaIcon = PERSONA_ICON[persona.id];
                const isSelected = selectedPersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelectedPersona(persona.id)}
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
                      <PersonaIcon
                        size={14}
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
                        {persona.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          marginTop: 1,
                        }}
                      >
                        {persona.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Value-prop card reveals once a persona is picked. Sharpened
                per HXC persona — the mid-market corp dev user sees Synergy
                Mirage + PMI Tracker by name BEFORE uploading. */}
            {valueProp && !isOther && (
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
                  {valueProp.eyebrow}
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
                  {valueProp.headline}
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
                  {valueProp.bullets.map(b => (
                    <li key={b} style={{ marginBottom: 2 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* "Other" path: inline waitlist capture + free-text role detail.
                Replaces the HXC CTAs (tour / upload / sample). Submit routes
                to step='other_thanks'. */}
            {isOther && (
              <div
                style={{
                  marginTop: 10,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  {VALUE_PROPS_BY_PERSONA.other.eyebrow}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  {VALUE_PROPS_BY_PERSONA.other.headline}
                </div>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Your role (we&apos;ll keep you posted as the platform extends):
                  </span>
                  <input
                    type="text"
                    value={otherRoleDetail}
                    onChange={e => setOtherRoleDetail(e.target.value.slice(0, 200))}
                    placeholder="e.g. Risk officer at a Tier-1 bank"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                </label>
                <button
                  onClick={handleOtherSubmit}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    padding: '11px 14px',
                    background: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Add me to the waitlist
                </button>
              </div>
            )}

            {/* CTAs reveal once an HXC persona is picked. Three primary
                actions on the same screen — no second step. Suppressed for
                'other' because that path uses the inline waitlist submit. */}
            {selectedPersona && !isOther && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 10,
                }}
              >
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
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
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
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {loadingSample ? 'Loading sample...' : 'Try with a sample memo'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      Pre-loaded specimen tuned to your role.
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Art 13 privacy notice — always visible before any upload-
                triggering CTA. Mandatory disclosure under GDPR Art 13 (and
                equivalent NDPR / PoPIA / UK GDPR provisions): the data subject
                must be informed at the time personal data is collected. */}
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
              <strong style={{ color: 'var(--text-primary)' }}>Before you upload:</strong> documents
              are encrypted with AES-256-GCM at rest, transit-encrypted with TLS 1.2+, and a GDPR /
              NDPR anonymizer strips PII as the literal first step of the analysis pipeline — no LLM
              ever sees raw personal data.{' '}
              <a href="/privacy" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                See /privacy
              </a>{' '}
              for the full Art 13 disclosure (lawful basis, retention, your rights).
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              {headerIcon}
              <DialogTitle style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
                Thanks — we&apos;ll keep you posted.
              </DialogTitle>
              <DialogDescription>
                Decision Intel is currently optimised for fractional CSOs, mid-market Heads of Corp
                Dev, GPs at smaller funds, and PE-backed founders. You&apos;ll still be able to use
                the platform, but the Phase 1 experience may not be tuned for your use case yet.
                We&apos;ll reach out when the platform extends.
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => {
                setOpen(false);
                onClose();
              }}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '11px 14px',
                background: 'var(--accent-primary)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 10,
                cursor: 'pointer',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Got it
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
