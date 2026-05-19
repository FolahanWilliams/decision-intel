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
 *   other              → Users      (generic / catch-all — FULL access, not gated)
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
    eyebrow: 'The reasoning audit platform',
    headline: 'Audit any strategic decision in 60 seconds. Full access, every feature.',
    bullets: [
      '22-bias R²F detection on any memo, board deck, or strategy doc, with the exact passages flagged',
      'A hashed, tamper-evident Decision Provenance Record on every audit',
      'Your Decision Knowledge Graph compounds across every decision your team makes',
    ],
  },
};

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Phase1PersonaId | null>(null);
  const [otherRoleDetail, setOtherRoleDetail] = useState('');
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
      <DialogContent
        className="sm:max-w-[950px] p-0 overflow-hidden bg-[var(--bg-primary)] shadow-2xl rounded-2xl"
        showCloseButton
      >
        <div className="flex flex-col md:grid md:grid-cols-2 min-h-[600px] animate-in fade-in duration-300">
            {/* LEFT COLUMN: Header & Personas */}
            <div className="p-6 sm:p-10 flex flex-col overflow-y-auto">
              <DialogHeader className="mb-6 text-left">
                {headerIcon}
                <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  Welcome to Decision Intel
                </DialogTitle>
                <DialogDescription className="text-[var(--fs-md)] text-[var(--text-secondary)] mt-3 leading-relaxed">
                  Which of these best describes your work? We&apos;re currently optimised for four
                  specific roles — picking one tunes the audit, the case studies we surface, and the
                  network we point you at.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-3 mt-auto p-1 -m-1">
                {PHASE_1_PERSONAS.map((persona, idx) => {
                  const PersonaIcon = PERSONA_ICON[persona.id];
                  const isSelected = selectedPersona === persona.id;

                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`
                        flex items-start gap-4 p-4 rounded-2xl text-left transition-all duration-300
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
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--fs-md)] font-semibold text-[var(--text-primary)] tracking-tight truncate">
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
            </div>

            {/* RIGHT COLUMN: Value Prop, CTAs & Privacy */}
            <div className="bg-[var(--bg-secondary)] border-t md:border-t-0 md:border-l border-[var(--border-color)] relative flex flex-col overflow-hidden">
              {/* Premium colored top strip */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--accent-primary)] opacity-90 shadow-[0_2px_10px_rgba(22,163,74,0.4)] z-20"></div>

              <div className="p-6 sm:p-10 sm:pt-14 sm:pr-14 flex flex-col h-full justify-center relative z-10">
                {!selectedPersona && (
                  <div className="text-center text-[var(--text-muted)] animate-in fade-in flex flex-col items-center justify-center h-full gap-4">
                    <Compass size={48} className="opacity-20" />
                    <p className="text-[var(--fs-md)] font-medium max-w-[280px]">
                      Select your role to see how Decision Intel is tuned for your workflow.
                    </p>
                  </div>
                )}

                {valueProp && (
                  <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-8 mt-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-3">
                        {valueProp.eyebrow}
                      </div>
                      <div className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] leading-tight mb-5">
                        {valueProp.headline}
                      </div>
                      <ul className="m-0 pl-5 text-[var(--fs-sm)] sm:text-[var(--fs-md)] text-[var(--text-secondary)] leading-relaxed space-y-3 list-outside list-disc marker:text-[var(--accent-primary)]">
                        {valueProp.bullets.map(b => (
                          <li key={b} className="pl-1">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {isOther && (
                      <label className="flex flex-col gap-2 mb-6">
                        <span className="text-[var(--fs-sm)] font-medium text-[var(--text-secondary)]">
                          Optional — your role, so we can sharpen the experience for people like
                          you:
                        </span>
                        <input
                          type="text"
                          value={otherRoleDetail}
                          onChange={e => setOtherRoleDetail(e.target.value.slice(0, 200))}
                          placeholder="e.g. Risk officer at a Tier-1 bank"
                          className="w-full p-4 border border-[var(--border-color)] rounded-xl bg-[var(--bg-card)] text-[var(--text-primary)] text-[var(--fs-md)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all shadow-inner"
                        />
                      </label>
                    )}

                    <div className="mt-auto pt-8 border-t border-[var(--border-color)]">
                      <div className="flex flex-col gap-3">
                        {sampleError && (
                          <div
                            className="w-full p-3 rounded-xl text-[var(--fs-xs)] font-medium"
                            style={{
                              background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                              border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)',
                              color: 'var(--error)',
                            }}
                          >
                            {sampleError}
                          </div>
                        )}

                        <button
                          onClick={() => completeOnboarding({ launchTour: true })}
                          className="w-full flex items-center gap-4 p-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] transition-all duration-300 border border-[var(--accent-primary)] rounded-2xl text-white text-left hover:-translate-y-[2px] shadow-sm hover:shadow-[0_8px_20px_rgba(22,163,74,0.25)] active:scale-[0.98]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Compass size={18} color="#fff" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[var(--fs-sm)] font-semibold truncate">
                              Take the 60-second tour
                            </div>
                            <div className="text-[11px] opacity-90 mt-0.5 leading-snug truncate">
                              Spotlight the upload zone, audit tabs, Knowledge Graph.
                            </div>
                          </div>
                        </button>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => completeOnboarding()}
                            className="flex-1 flex sm:flex-col items-center sm:items-start gap-3 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-all duration-300 border border-[var(--border-color)] rounded-2xl text-left hover:-translate-y-[2px] shadow-sm hover:shadow-md group active:scale-[0.98]"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--border-color)] transition-colors">
                              <Upload
                                size={18}
                                className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[var(--fs-sm)] font-semibold text-[var(--text-primary)] truncate">
                                Upload a memo
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={handleTrySample}
                            disabled={loadingSample}
                            className="flex-1 flex sm:flex-col items-center sm:items-start gap-3 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-all duration-300 border border-[var(--border-color)] rounded-2xl text-left hover:-translate-y-[2px] shadow-sm hover:shadow-md group disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:cursor-wait active:scale-[0.98] disabled:active:scale-100"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--border-color)] transition-colors">
                              {loadingSample ? (
                                <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FileText
                                  size={18}
                                  className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[var(--fs-sm)] font-semibold text-[var(--text-primary)] truncate">
                                {loadingSample ? 'Loading...' : 'Try sample'}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Art 13 privacy notice */}
                      <div className="mt-6 text-[11px] text-[var(--text-muted)] leading-relaxed">
                        <strong className="text-[var(--text-secondary)] font-medium">
                          Before you upload:
                        </strong>{' '}
                        documents are encrypted with AES-256-GCM at rest, transit-encrypted with TLS
                        1.2+, and a GDPR / NDPR anonymizer strips PII before analysis — no LLM ever
                        sees raw personal data.{' '}
                        <a
                          href="/privacy"
                          className="text-[var(--accent-primary)] font-medium hover:underline"
                        >
                          See /privacy
                        </a>
                        .
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  );
}
