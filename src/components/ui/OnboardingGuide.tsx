'use client';

import { useState } from 'react';
import { Upload, BarChart3, Shield, X, ArrowRight } from 'lucide-react';

const STEPS = [
    {
        icon: Upload,
        title: 'Upload a Document',
        description: 'Start by uploading a PDF, TXT, MD, DOC, or DOCX file for analysis.',
        action: 'Use the upload zone above',
    },
    {
        icon: BarChart3,
        title: 'Review AI Analysis',
        description: 'Our AI scans for cognitive biases, noise, logical fallacies, and compliance risks.',
        action: 'Click on a document to view results',
    },
    {
        icon: Shield,
        title: 'Improve Decisions',
        description: 'Use the What-If Simulator to test edits and track improvements over time.',
        action: 'Explore trends and risk audits',
    },
];

const STORAGE_KEY = 'decision-intel-onboarding-dismissed';

function getInitialDismissed() {
    if (typeof window === 'undefined') return true;
    return !!localStorage.getItem(STORAGE_KEY);
}

export function OnboardingGuide() {
    const [dismissed, setDismissed] = useState(getInitialDismissed);
    const [currentStep, setCurrentStep] = useState(0);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    if (dismissed) return null;

    return (
        <div
            className="card mb-xl card-glow animate-fade-in"
            style={{ borderColor: 'var(--accent-primary)', borderWidth: '1px' }}
            role="region"
            aria-label="Getting started guide"
        >
            <div className="card-header" style={{ background: 'rgba(255, 159, 10, 0.05)' }}>
                <h3 style={{ color: 'var(--accent-primary)', fontSize: '12px' }}>
                    GETTING_STARTED
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
                <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                    {STEPS.map((step, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                padding: 'var(--spacing-md)',
                                background: index === currentStep ? 'rgba(255, 159, 10, 0.1)' : 'transparent',
                                border: index === currentStep ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                cursor: 'pointer',
                                color: 'inherit',
                                transition: 'all 0.2s',
                            }}
                            aria-current={index === currentStep ? 'step' : undefined}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: index <= currentStep ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: index <= currentStep ? '#000' : 'var(--text-muted)',
                                fontSize: '12px',
                                fontWeight: 700,
                            }}>
                                {index + 1}
                            </div>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: index === currentStep ? 'var(--text-highlight)' : 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                {step.title}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Current step detail */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                    {(() => { const Icon = STEPS[currentStep].icon; return <Icon size={40} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />; })()}
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>
                            {STEPS[currentStep].description}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                            {STEPS[currentStep].action}
                        </p>
                    </div>
                    {currentStep < STEPS.length - 1 && (
                        <button
                            onClick={() => setCurrentStep(prev => prev + 1)}
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
