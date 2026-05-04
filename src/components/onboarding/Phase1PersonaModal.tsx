'use client';

/**
 * GTM v3.5 Phase 1 buyer-class-continuous persona gate.
 *
 * Fires after the WelcomeModal flow completes if phase1Persona is still null.
 * Captures one of the four HXC personas (fractional CSO / mid-market Corp Dev /
 * smaller-fund GP / PE-backed founder) OR "other" for waitlist routing.
 *
 * Why this gate exists: the Vohra "very disappointed" PMF metric is meaningful
 * ONLY on the HXC cohort. Without persona gating, the score gets diluted by
 * non-buyer-class users (e.g., junior analysts trialing on a personal card)
 * and the Phase 1 graduation gate becomes noise. Strict ICP gating in Phase 1
 * is mitigation #1 for the Continuity Chasm risk surfaced in the cross-source
 * synthesis.
 *
 * The "other" path captures the role free-text and surfaces a friendly waitlist
 * card — DI is currently optimised for the four roles above; we'll reach out
 * when the platform extends to the user's use case.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PHASE_1_PERSONAS, type Phase1PersonaId } from '@/lib/constants/icp';

const STORAGE_KEY = 'di-phase1-persona-asked';

export function Phase1PersonaModal() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Phase1PersonaId | null>(null);
  const [otherRoleDetail, setOtherRoleDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'pick' | 'other_thanks'>('pick');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;

    fetch('/api/onboarding')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { onboardingCompleted?: boolean; phase1Persona?: string | null } | null) => {
        if (!data) return;
        // Only fire after the broad WelcomeModal flow completes.
        // Don't interrupt new users who haven't picked a role yet.
        if (!data.onboardingCompleted) return;
        if (data.phase1Persona) {
          localStorage.setItem(STORAGE_KEY, 'true');
          return;
        }
        setOpen(true);
      })
      .catch(() => {
        // Silent — onboarding endpoint failures fall through; no modal shown.
      });
  }, []);

  const persist = useCallback(
    async (personaId: Phase1PersonaId, roleDetail?: string) => {
      setSubmitting(true);
      try {
        await fetch('/api/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase1Persona: personaId,
            ...(roleDetail ? { phase1PersonaRoleDetail: roleDetail.slice(0, 200) } : {}),
          }),
        });
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (err) {
        // Silent — UI flow continues even if persistence fails (it'll re-prompt next session)
        console.warn('[Phase1PersonaModal] persist failed:', err);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const handleConfirm = async () => {
    if (!selected) return;
    if (selected === 'other') {
      await persist('other', otherRoleDetail.trim());
      setStep('other_thanks');
      return;
    }
    await persist(selected);
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!open) return null;

  const otherPicked = selected === 'other';

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) handleClose();
        else setOpen(value);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {step === 'pick' ? (
          <>
            <DialogHeader>
              <DialogTitle>Which of these best describes your work?</DialogTitle>
              <DialogDescription>
                We&apos;re currently optimised for four specific roles — picking one
                tunes the audit, the case studies we surface, and the network we
                point you at.
              </DialogDescription>
            </DialogHeader>

            <div
              className="phase1-persona-grid"
              style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}
            >
              {PHASE_1_PERSONAS.map(persona => {
                const isSelected = selected === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelected(persona.id)}
                    className={`phase1-persona-card ${isSelected ? 'is-selected' : ''}`}
                  >
                    {/* Top accent strip — full green when selected, soft hint
                        when not. Lives inside overflow:hidden so it respects
                        the rounded corners cleanly. */}
                    <span aria-hidden className="phase1-persona-card__accent" />
                    <span className="phase1-persona-card__label">{persona.label}</span>
                    <span className="phase1-persona-card__desc">{persona.description}</span>
                  </button>
                );
              })}
            </div>

            <style jsx>{`
              .phase1-persona-card {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 18px 18px 16px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                cursor: pointer;
                text-align: left;
                overflow: hidden;
                box-shadow:
                  0 1px 2px rgba(15, 23, 42, 0.04),
                  0 0 0 1px rgba(15, 23, 42, 0.01) inset;
                transition:
                  border-color 0.18s ease,
                  background 0.18s ease,
                  box-shadow 0.18s ease,
                  transform 0.18s ease;
                appearance: none;
                font: inherit;
                color: inherit;
                width: 100%;
                box-sizing: border-box;
              }

              .phase1-persona-card:hover {
                border-color: color-mix(in srgb, var(--accent-primary) 35%, var(--border-color));
                box-shadow:
                  0 4px 12px rgba(15, 23, 42, 0.06),
                  0 0 0 1px color-mix(in srgb, var(--accent-primary) 10%, transparent) inset;
                transform: translateY(-1px);
              }

              .phase1-persona-card:hover .phase1-persona-card__accent {
                background: color-mix(in srgb, var(--accent-primary) 55%, transparent);
              }

              .phase1-persona-card:focus-visible {
                outline: 2px solid var(--accent-primary);
                outline-offset: 2px;
              }

              .phase1-persona-card.is-selected {
                background: color-mix(in srgb, var(--accent-primary) 6%, var(--bg-card));
                border-color: var(--accent-primary);
                box-shadow:
                  0 6px 18px color-mix(in srgb, var(--accent-primary) 18%, transparent),
                  0 0 0 1px var(--accent-primary) inset;
              }

              .phase1-persona-card__accent {
                position: absolute;
                inset: 0 0 auto 0;
                height: 3px;
                background: color-mix(in srgb, var(--accent-primary) 22%, transparent);
                transition: background 0.18s ease;
              }

              .phase1-persona-card.is-selected .phase1-persona-card__accent {
                background: var(--accent-primary);
                height: 4px;
              }

              .phase1-persona-card__label {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-primary);
                line-height: 1.35;
                letter-spacing: -0.005em;
              }

              .phase1-persona-card__desc {
                font-size: 12.5px;
                color: var(--text-muted);
                line-height: 1.5;
              }
            `}</style>

            {otherPicked && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Tell us your role so we can let you know when DI extends to it:
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
                    fontSize: 14,
                  }}
                />
              </label>
            )}

            <DialogFooter>
              <Button
                onClick={handleConfirm}
                disabled={!selected || submitting}
                style={{
                  background: 'var(--accent-primary)',
                  color: '#FFFFFF',
                }}
              >
                {submitting ? 'Saving…' : 'Continue'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Thanks — we&apos;ll keep you posted.</DialogTitle>
              <DialogDescription>
                Decision Intel is currently optimised for fractional CSOs, mid-market
                Heads of Corp Dev, GPs at smaller funds, and PE-backed founders.
                You&apos;ll still be able to use the platform, but the Phase 1
                experience may not be tuned for your use case yet. We&apos;ll reach
                out when the platform extends.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setOpen(false)}
                style={{
                  background: 'var(--accent-primary)',
                  color: '#FFFFFF',
                }}
              >
                Got it
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
