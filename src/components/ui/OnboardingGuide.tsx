'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, BarChart3, Shield, X, ArrowRight, CheckCircle, FileText } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload a Document',
    description: 'Start by uploading a PDF, TXT, MD, or DOCX file for analysis.',
    action: 'Use the upload zone above',
    hasSampleAction: true,
  },
  {
    icon: BarChart3,
    title: 'Review AI Analysis',
    description:
      'Our AI scans for cognitive biases, noise, logical fallacies, and compliance risks.',
    action: 'Click on a document to view results',
    hasSampleAction: false,
  },
  {
    icon: Shield,
    title: 'Improve Decisions',
    description: 'Use the What-If Simulator to test edits and track improvements over time.',
    action: 'Explore trends and risk audits',
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
      .then((res) => res.json())
      .then((data) => {
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
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed) return null;

  return (
    <div
      className="card mb-xl animate-fade-in"
      style={{ borderColor: 'rgba(255, 255, 255, 0.12)', borderWidth: '1px' }}
      role="region"
      aria-label="Getting started guide"
    >
      <div className="card-header" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
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
                background: index === currentStep ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                border:
                  index === currentStep
                    ? '1px solid rgba(255, 255, 255, 0.2)'
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
                    ? '#22c55e'
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
