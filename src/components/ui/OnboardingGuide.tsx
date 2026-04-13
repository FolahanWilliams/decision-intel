'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, BarChart3, Shield, X, ArrowRight, CheckCircle, FileText } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your strategic memo',
    description:
      'Before your next steering committee or board review, drop in the strategic memo, board deck, or market-entry recommendation. We surface the questions it never asks, and whether your team has seen this pattern before.',
    action: 'Use the upload zone above, or try a sample strategic memo',
    hasSampleAction: true,
  },
  {
    icon: BarChart3,
    title: 'Review your bias audit',
    description:
      'Decision Intel scores 30+ cognitive biases with confidence, excerpts, and recommendations, converting narrative judgment into measurable risk signal so you walk into the board with analytical confidence in the strategy.',
    action: 'Click on a memo to view results',
    hasSampleAction: false,
  },
  {
    icon: Shield,
    title: 'Close the loop most teams never close',
    description:
      'Report what happened. Every outcome feeds your Decision Quality Index and your Knowledge Graph, so today\u2019s decision always inherits yesterday\u2019s lessons. Quarter after quarter, your judgment compounds.',
    action: 'Go to any analyzed memo and report the outcome',
    hasSampleAction: false,
  },
];

const STORAGE_KEY = 'decision-intel-onboarding-dismissed';

/** Fire-and-forget PATCH to persist onboarding state to the API. */
function persistOnboardingState(data: { onboardingCompleted?: boolean; onboardingStep?: number }) {
  fetch('/api/onboarding', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {}); // best-effort
}

export function OnboardingGuide({ documentCount = 0 }: { documentCount?: number }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    // Check localStorage first for instant decision
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Then verify with API (fall back to showing guide if API fails)
    fetch('/api/onboarding')
      .then(res => {
        if (!res.ok) throw new Error(`Onboarding API returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.onboardingCompleted) {
          localStorage.setItem(STORAGE_KEY, 'true');
        } else {
          startTransition(() => setDismissed(false));
          if (data.onboardingStep > 0) {
            setCurrentStep(data.onboardingStep);
          }
        }
      })
      .catch(() => {
        startTransition(() => setDismissed(false));
      });
  }, []);
  const hasDocuments = documentCount > 0;
  const [currentStep, setCurrentStep] = useState(hasDocuments ? 1 : 0);

  const isStepCompleted = (index: number): boolean => {
    if (index === 0) return hasDocuments;
    if (index === 1) return documentCount >= 1 && currentStep > 1;
    return false;
  };

  const handleStepChange = useCallback((newStep: number) => {
    setCurrentStep(newStep);
    persistOnboardingState({ onboardingStep: newStep });
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    persistOnboardingState({ onboardingCompleted: true });
  };

  const handleTrySample = useCallback(async () => {
    setLoadingSample(true);
    try {
      const res = await fetch('/api/onboarding/sample', { method: 'POST' });
      const data = await res.json();
      if (data.documentId) {
        handleDismiss();
        router.push(`/documents/${data.documentId}`);
      }
    } catch {
      // Silently fail — user can still upload manually
    } finally {
      setLoadingSample(false);
    }
  }, [router]);

  if (dismissed) return null;

  return (
    <div
      className="card mb-xl animate-fade-in"
      style={{ borderColor: 'var(--border-color)', borderWidth: '1px' }}
      role="region"
      aria-label="Getting started guide"
    >
      <div className="card-header" style={{ background: 'var(--bg-card)' }}>
        <h3
          style={{
            color: 'var(--text-secondary)',
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Getting Started
        </h3>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss getting started guide"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div className="card-body" style={{ padding: 'var(--spacing-lg)' }}>
        {/* Step indicators */}
        <div
          style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}
        >
          {STEPS.map((step, index) => (
            <button
              key={index}
              onClick={() => handleStepChange(index)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: 'var(--spacing-md)',
                background: index === currentStep ? 'var(--bg-card-hover)' : 'transparent',
                border:
                  index === currentStep
                    ? '1px solid var(--border-color)'
                    : '1px solid var(--border-color)',
                cursor: 'pointer',
                color: 'inherit',
                transition: 'all 0.2s',
              }}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isStepCompleted(index)
                    ? 'var(--accent-primary)'
                    : index <= currentStep
                      ? '#FFFFFF'
                      : 'var(--bg-tertiary)',
                  color: isStepCompleted(index)
                    ? '#FFFFFF'
                    : index <= currentStep
                      ? '#080808'
                      : 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '50%',
                }}
              >
                {isStepCompleted(index) ? <CheckCircle size={18} /> : index + 1}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: index === currentStep ? 'var(--text-highlight)' : 'var(--text-muted)',
                }}
              >
                {step.title}
              </span>
            </button>
          ))}
        </div>

        {/* Current step detail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
          {(() => {
            const Icon = STEPS[currentStep].icon;
            return <Icon size={40} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />;
          })()}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>
              {STEPS[currentStep].description}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {STEPS[currentStep].action}
            </p>
          </div>
          {STEPS[currentStep].hasSampleAction && !hasDocuments && (
            <button
              onClick={handleTrySample}
              disabled={loadingSample}
              className="btn btn-secondary flex items-center gap-sm"
              style={{ flexShrink: 0, opacity: loadingSample ? 0.7 : 1 }}
            >
              <FileText size={14} /> {loadingSample ? 'Loading...' : 'Try Sample'}
            </button>
          )}
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              className="btn btn-secondary flex items-center gap-sm"
              style={{ flexShrink: 0 }}
            >
              Next <ArrowRight size={14} />
            </button>
          )}
          {currentStep === STEPS.length - 1 && (
            <button
              onClick={handleDismiss}
              className="btn btn-primary flex items-center gap-sm"
              style={{ flexShrink: 0 }}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
