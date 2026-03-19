'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  FileText,
  Info,
  Terminal,
  Lightbulb,
  BookOpen,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { BiasInstance } from '@/types';
import { createClientLogger } from '@/lib/utils/logger';
import { getBiasEducation, DIFFICULTY_COLORS } from '@/lib/constants/bias-education';

const log = createClientLogger('BiasDetailModal');

const SEVERITY_COLORS: Record<string, string> = {
  low: 'var(--severity-low)',
  medium: 'var(--severity-medium)',
  high: 'var(--severity-high)',
  critical: 'var(--severity-critical)',
};

function getBiasDefinition(biasType: string): string {
  const definitions: Record<string, string> = {
    'Confirmation Bias':
      'A cognitive bias where individuals favor information that confirms their pre-existing beliefs while ignoring contradictory evidence. The AI detected linguistic patterns suggesting the author is selectively presenting evidence that supports a predetermined conclusion.',
    'Anchoring Bias':
      'The tendency to rely too heavily on the first piece of information encountered (the "anchor") when making decisions. The AI identified initial figures or statements that appear to disproportionately influence subsequent reasoning.',
    'Sunk Cost Fallacy':
      'The tendency to continue investing in something because of previously invested resources, rather than future value. The AI detected language justifying continued investment based on past spending rather than prospective returns.',
    'Overconfidence Bias':
      "Excessive confidence in one's own answers, beliefs, or abilities without adequate evidence. The AI identified absolute language, certainty claims, or dismissal of risks without supporting data.",
    Groupthink:
      'A psychological phenomenon where the desire for harmony leads to irrational decision-making. The AI detected patterns of unanimous agreement, suppression of dissenting views, or pressure to conform.',
    'Authority Bias':
      'The tendency to attribute greater accuracy to opinions of an authority figure. The AI identified deference to titles, positions, or status over evidence and logical reasoning.',
    'Bandwagon Effect':
      'The tendency to follow trends or adopt beliefs because others do. The AI detected reasoning based on popularity or peer behavior rather than independent analysis.',
    'Loss Aversion':
      'The tendency to prefer avoiding losses over acquiring equivalent gains. The AI identified disproportionate focus on potential losses compared to potential gains.',
    'Availability Heuristic':
      'Overweighting easily recalled or recent events when making decisions. The AI detected references to memorable or recent events without proportional consideration of base rates.',
    'Hindsight Bias':
      'The tendency to believe, after an event occurs, that one would have predicted or expected it. The AI identified post-hoc rationalization or claims of foreknowledge about past outcomes.',
    'Planning Fallacy':
      'The tendency to underestimate time, costs, or complexity of future tasks. The AI detected optimistic projections without adequate consideration of potential obstacles.',
    'Status Quo Bias':
      'A preference for the current state of affairs and resistance to change. The AI identified language favoring existing conditions without objective comparison to alternatives.',
    'Framing Effect':
      "Drawing different conclusions from the same information depending on how it's presented. The AI detected selective presentation of information that may influence perception.",
    'Selective Perception':
      'Filtering information based on expectations or desires. The AI identified patterns of interpreting data in ways that align with predetermined expectations.',
    'Recency Bias':
      'Overweighting recent events over historical patterns. The AI detected disproportionate emphasis on recent data while ignoring longer-term trends.',
    'Cognitive Misering':
      'The tendency to default to low-effort, superficial thinking rather than thoroughly analyzing available evidence. The AI detected shallow reasoning disproportionate to the decision stakes — accepting the first plausible conclusion without verification or due diligence.',
  };
  return (
    definitions[biasType] ||
    `${biasType} is a cognitive distortion that can lead to flawed decision-making. The AI detected patterns in the text that match this bias profile.`
  );
}

function getDetectionMethodology(biasType: string, excerpt: string): string {
  const methods: Record<string, string> = {
    'Confirmation Bias':
      'Analyzed text for one-sided evidence presentation, absence of counterarguments, and selective data citation patterns.',
    'Anchoring Bias':
      'Identified initial numeric values or statements that subsequent analysis appears tethered to, with insufficient adjustment.',
    'Sunk Cost Fallacy':
      'Scanned for references to past investments (time, money, effort) used to justify future decisions rather than forward-looking analysis.',
    'Overconfidence Bias':
      'Detected absolute language ("certainly", "definitely", "will"), dismissal of uncertainty, and lack of hedging or risk acknowledgment.',
    Groupthink:
      'Identified consensus language without documented debate, unanimous approval patterns, and absence of dissenting viewpoints.',
    'Authority Bias':
      'Found citations of authority figures, titles, or credentials as primary justification rather than evidence-based reasoning.',
    'Bandwagon Effect':
      'Detected reasoning based on market trends, competitor actions, or "everyone is doing it" justifications.',
    'Loss Aversion':
      'Analyzed risk language asymmetry—identifying disproportionate focus on potential losses vs. equivalent gains.',
    'Availability Heuristic':
      'Identified references to recent, memorable, or emotionally salient events without base rate consideration.',
    'Hindsight Bias':
      'Detected post-event language claiming predictability ("we knew", "it was obvious", "as expected").',
    'Planning Fallacy':
      'Analyzed projections for optimistic bias, absence of contingency buffers, and historical accuracy of similar estimates.',
    'Status Quo Bias':
      'Identified resistance language, risk framing of change, and insufficient comparative analysis of alternatives.',
    'Framing Effect':
      'Detected selective presentation of statistics, emphasis patterns, and language that could influence perception.',
    'Selective Perception':
      'Analyzed interpretation patterns for consistency with stated expectations or desired outcomes.',
    'Recency Bias':
      'Compared temporal weighting of evidence—identifying overemphasis on recent vs. historical data.',
    'Cognitive Misering':
      'Measured depth of reasoning relative to decision stakes—identifying superficial analysis, absence of verification steps, and acceptance of first plausible conclusions without scrutiny.',
  };
  const wordCount = excerpt.split(' ').length;
  return `${methods[biasType] || 'Applied psycholinguistic pattern matching to identify cognitive distortion markers.'} The flagged excerpt (${wordCount} words) triggered this detection with high confidence.`;
}

function getImpactAssessment(biasType: string, severity: string): string {
  const severityImpacts: Record<string, string> = {
    low: 'Minor impact on decision quality. May slightly skew perception but unlikely to cause significant harm if addressed.',
    medium:
      'Moderate impact on decision quality. Could lead to suboptimal outcomes if not corrected. Warrants attention in review process.',
    high: 'Significant impact on decision quality. High probability of leading to flawed conclusions. Requires immediate attention and correction.',
    critical:
      'Severe impact on decision quality. This bias pattern could fundamentally undermine the validity of the analysis and lead to catastrophic outcomes.',
  };
  const biasRisks: Record<string, string> = {
    'Confirmation Bias': 'May cause rejection of valid counterevidence and missed opportunities.',
    'Overconfidence Bias': 'Can lead to inadequate risk preparation and unexpected failures.',
    'Sunk Cost Fallacy': 'May perpetuate losing investments and delay necessary pivots.',
    Groupthink: 'Suppresses innovation and can lead to catastrophic blind spots.',
    'Hindsight Bias': 'Prevents learning from experience and distorts future planning.',
    'Planning Fallacy': 'Leads to budget overruns, missed deadlines, and resource misallocation.',
    'Cognitive Misering':
      'Leads to rubber-stamped decisions, missed red flags, and unverified assumptions propagating through critical processes.',
  };
  return `${severityImpacts[severity] || severityImpacts['medium']} ${biasRisks[biasType] || 'This bias type can distort judgment and lead to flawed decision-making.'}`;
}

interface BiasDetailModalProps {
  bias: BiasInstance;
  biases: BiasInstance[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (bias: BiasInstance) => void;
}

export function BiasDetailModal({
  bias,
  biases,
  currentIndex,
  onClose,
  onNavigate,
}: BiasDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (bias as any).userRating as number | null
  );

  // Reset rating when navigating to a different bias
  useEffect(() => {
    // @ts-expect-error - bias.userRating might exist if added to schema
    setUserRating((bias as Record<string, unknown>).userRating as number | null);
  }, [bias]);

  const handleFeedback = async (rating: number) => {
    try {
      setIsSubmittingFeedback(true);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bias', id: bias.id, rating }),
      });
      if (res.ok) {
        setUserRating(rating);
      }
    } catch (error) {
      log.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Focus trap + Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const color = SEVERITY_COLORS[bias.severity] || 'var(--warning)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Bias detail: ${bias.biasType}`}
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="card w-full max-w-3xl modal-content"
        style={{
          border: `1px solid ${color}30`,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="card-header flex items-center justify-between"
          style={{
            borderBottom: `1px solid ${color}30`,
            position: 'sticky',
            top: 0,
            background: 'var(--bg-secondary)',
            zIndex: 10,
          }}
        >
          <div className="flex items-center gap-md">
            <AlertTriangle size={20} style={{ color }} />
            <h3>{bias.biasType}</h3>
            <span
              className={`badge badge-${bias.severity}`}
              style={{ marginLeft: 'var(--spacing-sm)' }}
            >
              {bias.severity.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => onNavigate(biases[currentIndex - 1])}
              disabled={currentIndex <= 0}
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              aria-label="Previous bias"
            >
              ← Prev
            </button>
            <span className="text-xs text-muted" style={{ minWidth: '3rem', textAlign: 'center' }}>
              {currentIndex + 1} of {biases.length}
            </span>
            <button
              onClick={() => onNavigate(biases[currentIndex + 1])}
              disabled={currentIndex >= biases.length - 1}
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              aria-label="Next bias"
            >
              Next →
            </button>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: '2px 8px', fontSize: '13px', marginLeft: '4px' }}
              aria-label="Close bias detail"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {/* Definition */}
          <div
            style={{
              padding: 'var(--spacing-lg)',
              background: 'rgba(99, 102, 241, 0.05)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center gap-sm mb-sm">
              <Info size={14} style={{ color: 'var(--accent-primary)' }} />
              <h4 className="text-xs text-muted uppercase">What is {bias.biasType}?</h4>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {getBiasDefinition(bias.biasType)}
            </p>
          </div>

          <div className="grid grid-2">
            {/* Evidence */}
            <div
              style={{ padding: 'var(--spacing-lg)', borderRight: '1px solid var(--border-color)' }}
            >
              <h4 className="text-xs text-muted mb-md uppercase flex items-center gap-sm">
                <FileText size={14} /> Evidence Detected
              </h4>
              <blockquote
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'var(--bg-primary)',
                  borderLeft: `4px solid ${color}`,
                  fontSize: '13px',
                  fontStyle: 'italic',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                &quot;{bias.excerpt}&quot;
              </blockquote>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'rgba(255, 159, 10, 0.05)',
                  border: '1px solid rgba(255, 159, 10, 0.2)',
                }}
              >
                <div className="flex items-center gap-sm mb-sm">
                  <Terminal size={12} style={{ color: 'var(--warning)' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: 'var(--warning)' }}>
                    AI Detection Method
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {getDetectionMethodology(bias.biasType, bias.excerpt)}
                </p>
              </div>
            </div>

            {/* Analysis */}
            <div style={{ padding: 'var(--spacing-lg)' }}>
              <h4 className="text-xs text-muted mb-md uppercase flex items-center gap-sm">
                <AlertTriangle size={14} /> AI Analysis
              </h4>
              <p className="mb-lg" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                {bias.explanation}
              </p>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  marginBottom: 'var(--spacing-md)',
                }}
              >
                <div className="flex items-center gap-sm mb-sm">
                  <AlertTriangle size={12} style={{ color: 'var(--error)' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: 'var(--error)' }}>
                    Impact Assessment
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {getImpactAssessment(bias.biasType, bias.severity)}
                </p>
              </div>
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  background: 'rgba(48, 209, 88, 0.05)',
                  border: '1px solid var(--success)',
                }}
              >
                <div className="flex items-center gap-sm mb-sm">
                  <Lightbulb size={14} style={{ color: 'var(--success)' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: 'var(--success)' }}>
                    Recommended Correction
                  </span>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.5 }}>{bias.suggestion}</p>
              </div>
            </div>
          </div>

          {/* Education Section */}
          {(() => {
            const edu = getBiasEducation(bias.biasType);
            if (!edu) return null;
            const diffColor = DIFFICULTY_COLORS[edu.difficulty] || 'var(--text-muted)';
            return (
              <div style={{ borderTop: '1px solid var(--border-color)' }}>
                <div
                  style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    background: 'rgba(99, 102, 241, 0.03)',
                  }}
                >
                  <div
                    className="flex items-center gap-sm"
                    style={{ marginBottom: 'var(--spacing-md)' }}
                  >
                    <GraduationCap size={14} style={{ color: 'var(--accent-primary)' }} />
                    <h4
                      className="text-xs text-muted uppercase"
                      style={{ letterSpacing: '0.05em' }}
                    >
                      Learn &amp; Debias
                    </h4>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: diffColor,
                        padding: '1px 8px',
                        background: `${diffColor}15`,
                        borderRadius: '10px',
                        marginLeft: 'auto',
                      }}
                    >
                      {edu.difficulty.toUpperCase()} TO COUNTER
                    </span>
                  </div>
                  {/* Real-world example */}
                  <div
                    style={{
                      padding: 'var(--spacing-md)',
                      background: 'rgba(99, 102, 241, 0.04)',
                      border: '1px solid rgba(99, 102, 241, 0.12)',
                      borderRadius: '8px',
                      marginBottom: 'var(--spacing-md)',
                    }}
                  >
                    <div className="flex items-center gap-sm" style={{ marginBottom: '6px' }}>
                      <BookOpen size={12} style={{ color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>
                        {edu.realWorldExample.title}
                      </span>
                      {edu.realWorldExample.year && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {edu.realWorldExample.company} · {edu.realWorldExample.year}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {edu.realWorldExample.description}
                    </p>
                  </div>
                  {/* Debiasing techniques */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {edu.debiasingTechniques.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-sm"
                        style={{
                          padding: '6px 10px',
                          background: 'var(--bg-primary)',
                          borderRadius: '6px',
                        }}
                      >
                        <Shield
                          size={12}
                          style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }}
                        />
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                          }}
                        >
                          {t}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    📚 {edu.academicReference}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Feedback */}
          <div
            style={{
              padding: '12px var(--spacing-lg)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(99, 102, 241, 0.02)',
            }}
          >
            <span className="text-sm font-medium">Was this AI detection helpful?</span>
            <div className="flex gap-sm">
              <button
                className={`btn btn-ghost`}
                disabled={isSubmittingFeedback}
                onClick={() => handleFeedback(userRating === 1 ? 0 : 1)}
                style={{
                  color: userRating === 1 ? 'var(--success)' : 'inherit',
                  background: userRating === 1 ? 'rgba(48, 209, 88, 0.1)' : 'transparent',
                  border:
                    userRating === 1 ? '1px solid rgba(48, 209, 88, 0.3)' : '1px solid transparent',
                }}
              >
                👍 Yes
              </button>
              <button
                className={`btn btn-ghost`}
                disabled={isSubmittingFeedback}
                onClick={() => handleFeedback(userRating === -1 ? 0 : -1)}
                style={{
                  color: userRating === -1 ? 'var(--error)' : 'inherit',
                  background: userRating === -1 ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  border:
                    userRating === -1
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : '1px solid transparent',
                }}
              >
                👎 No
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 'var(--spacing-md) var(--spacing-lg)',
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div className="flex items-center gap-lg">
              <div>
                <span className="text-xs text-muted">Detection Model: </span>
                <span className="text-xs" style={{ color: 'var(--accent-primary)' }}>
                  Gemini 3 Pro
                </span>
              </div>
              <div>
                <span className="text-xs text-muted">Analysis Type: </span>
                <span className="text-xs">Psycholinguistic Pattern Matching</span>
              </div>
            </div>
            <span className="text-xs text-muted">
              Severity assessed based on language intensity and decision impact potential
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
