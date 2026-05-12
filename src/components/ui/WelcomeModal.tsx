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
    <div className="w-12 h-12 rounded-2xl bg-[rgba(22,163,74,0.12)] flex items-center justify-center mb-3">
      <Compass size={24} className="text-[var(--accent-primary)]" />
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
      <DialogContent className="sm:max-w-2xl p-6 sm:p-10" showCloseButton>
        {step === 'pick' ? (
          <div className="flex flex-col animate-in fade-in duration-300">
            <DialogHeader className="mb-4">
              {headerIcon}
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Welcome to Decision Intel
              </DialogTitle>
              <DialogDescription className="text-[var(--fs-sm)] text-[var(--text-secondary)] mt-3 leading-relaxed">
                Which of these best describes your work? We&apos;re currently optimised for four
                specific roles — picking one tunes the audit, the case studies we surface, and the
                network we point you at.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {PHASE_1_PERSONAS.map((persona, idx) => {
                const PersonaIcon = PERSONA_ICON[persona.id];
                const isSelected = selectedPersona === persona.id;
                const isOtherChoice = persona.id === 'other';

                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelectedPersona(persona.id)}
                    className={`
                      ${isOtherChoice ? 'sm:col-span-2' : 'col-span-1'}
                      flex items-start gap-4 p-5 rounded-2xl text-left transition-all duration-300
                      border active:scale-[0.98] animate-in fade-in slide-in-from-bottom-2 fill-mode-both
                      ${
                        isSelected 
                          ? 'bg-[rgba(22,163,74,0.04)] border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)] shadow-[0_0_15px_rgba(22,163,74,0.12)] z-10' 
                          : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:-translate-y-[2px] hover:shadow-md hover:border-[rgba(22,163,74,0.3)] shadow-sm'
                      }
                    `}
                    style={{ animationDelay: `${idx * 75}ms` }}
                  >
                    <div
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200
                        ${isSelected ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}
                      `}
                    >
                      <PersonaIcon
                        size={18}
                        color={isSelected ? '#FFFFFF' : 'var(--text-secondary)'}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-[var(--fs-md)] font-semibold text-[var(--text-primary)] tracking-tight">
                        {persona.label}
                      </div>
                      <div className="text-[var(--fs-xs)] text-[var(--text-secondary)] mt-1 leading-snug">
                        {persona.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Value-prop card reveals once a persona is picked. */}
            {valueProp && !isOther && (
              <div className="mt-4 p-6 rounded-2xl bg-[rgba(22,163,74,0.05)] border border-[rgba(22,163,74,0.20)] shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-2">
                  {valueProp.eyebrow}
                </div>
                <div className="text-[var(--fs-md)] font-semibold text-[var(--text-primary)] leading-snug mb-3">
                  {valueProp.headline}
                </div>
                <ul className="m-0 pl-5 text-[var(--fs-sm)] text-[var(--text-secondary)] leading-relaxed space-y-1 list-disc marker:text-[var(--accent-primary)]">
                  {valueProp.bullets.map(b => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* "Other" path: inline waitlist capture */}
            {isOther && (
              <div className="mt-4 p-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  {VALUE_PROPS_BY_PERSONA.other.eyebrow}
                </div>
                <div className="text-[var(--fs-sm)] text-[var(--text-secondary)] leading-relaxed mb-4">
                  {VALUE_PROPS_BY_PERSONA.other.headline}
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-[11.5px] font-medium text-[var(--text-muted)]">
                    Your role (we&apos;ll keep you posted as the platform extends):
                  </span>
                  <input
                    type="text"
                    value={otherRoleDetail}
                    onChange={e => setOtherRoleDetail(e.target.value.slice(0, 200))}
                    placeholder="e.g. Risk officer at a Tier-1 bank"
                    className="w-full p-3 border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] text-[var(--fs-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all shadow-inner"
                  />
                </label>
                <button
                  onClick={handleOtherSubmit}
                  className="mt-4 w-full py-3 bg-[var(--accent-primary)] hover:bg-[#15803d] transition-all duration-300 border border-[var(--accent-primary)] rounded-xl text-white text-[var(--fs-sm)] font-semibold active:scale-[0.98] hover:shadow-lg"
                >
                  Add me to the waitlist
                </button>
              </div>
            )}

            {/* CTAs reveal once an HXC persona is picked. */}
            {selectedPersona && !isOther && (
              <div className="flex flex-col gap-3 mt-5 animate-in fade-in slide-in-from-top-4 duration-400">
                {sampleError && (
                  <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[var(--fs-xs)] text-red-600 font-medium">
                    {sampleError}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => completeOnboarding({ launchTour: true })}
                    className="flex-1 flex flex-col items-start gap-4 p-5 bg-[var(--accent-primary)] hover:bg-[#15803d] transition-all duration-300 border border-[var(--accent-primary)] rounded-2xl text-white text-left hover:-translate-y-[2px] shadow-sm hover:shadow-[0_8px_20px_rgba(22,163,74,0.25)] active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <Compass size={20} color="#fff" />
                    </div>
                    <div>
                      <div className="text-[var(--fs-sm)] font-semibold">Take the 60-second tour</div>
                      <div className="text-[11px] opacity-90 mt-1 leading-snug">
                        Spotlight the upload zone, audit tabs, Knowledge Graph.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => completeOnboarding()}
                    className="flex-1 flex flex-col items-start gap-4 p-5 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-all duration-300 border border-[var(--border-color)] rounded-2xl text-left hover:-translate-y-[2px] shadow-sm hover:shadow-md group active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--border-color)] transition-colors">
                      <Upload size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                    </div>
                    <div>
                      <div className="text-[var(--fs-sm)] font-semibold text-[var(--text-primary)]">
                        Upload a memo now
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                        PDF, DOCX, PPTX, XLSX — up to 5MB.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleTrySample}
                    disabled={loadingSample}
                    className="flex-1 flex flex-col items-start gap-4 p-5 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-all duration-300 border border-[var(--border-color)] rounded-2xl text-left hover:-translate-y-[2px] shadow-sm hover:shadow-md group disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-wait active:scale-[0.98] disabled:active:scale-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--border-color)] transition-colors">
                      {loadingSample ? (
                        <div className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileText size={20} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                      )}
                    </div>
                    <div>
                      <div className="text-[var(--fs-sm)] font-semibold text-[var(--text-primary)]">
                        {loadingSample ? 'Loading...' : 'Try sample memo'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                        Pre-loaded specimen tuned to your role.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Art 13 privacy notice */}
            <div className="mt-8 p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11.5px] text-[var(--text-secondary)] leading-relaxed">
              <strong className="text-[var(--text-primary)] font-medium">Before you upload:</strong> documents
              are encrypted with AES-256-GCM at rest, transit-encrypted with TLS 1.2+, and a GDPR /
              NDPR anonymizer strips PII as the literal first step of the analysis pipeline — no LLM
              ever sees raw personal data.{' '}
              <a href="/privacy" className="text-[var(--accent-primary)] font-medium hover:underline">
                See /privacy
              </a>{' '}
              for the full Art 13 disclosure (lawful basis, retention, your rights).
            </div>
          </div>
        ) : (
          <div className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DialogHeader className="mb-2">
              {headerIcon}
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Thanks — we&apos;ll keep you posted.
              </DialogTitle>
              <DialogDescription className="text-[var(--fs-sm)] text-[var(--text-secondary)] leading-relaxed mt-2">
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
              className="mt-6 w-full py-3 bg-[var(--accent-primary)] hover:bg-[#15803d] transition-all duration-300 border border-[var(--accent-primary)] rounded-xl text-white text-[var(--fs-sm)] font-semibold hover:shadow-lg active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
