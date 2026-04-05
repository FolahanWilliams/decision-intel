'use client';

import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Lightbulb,
  Link2,
  Shield,
} from 'lucide-react';
import { BIAS_CATEGORIES, type BiasCategory } from '@/types';
import { BIAS_EDUCATION, DIFFICULTY_COLORS } from '@/lib/constants/bias-education';

interface BiasEducationCardProps {
  biasType: BiasCategory;
  variant: 'compact' | 'full';
  detected?: boolean;
  detectedCount?: number;
  onBiasClick?: (key: BiasCategory) => void;
}

export function BiasEducationCard({
  biasType,
  variant,
  detected,
  detectedCount,
  onBiasClick,
}: BiasEducationCardProps) {
  const [expanded, setExpanded] = useState(variant === 'full');
  const meta = BIAS_CATEGORIES[biasType];
  const education = BIAS_EDUCATION[biasType];

  if (!meta || !education) return null;

  const difficultyColor = DIFFICULTY_COLORS[education.difficulty] || 'var(--text-muted)';

  return (
    <div
      className="card"
      style={{
        border: detected ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-color)',
        background: detected ? 'rgba(255, 255, 255, 0.04)' : 'var(--bg-secondary)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: 'var(--spacing-md) var(--spacing-lg)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
        }}
        aria-expanded={expanded}
        aria-label={`${meta.name} — click to ${expanded ? 'collapse' : 'expand'}`}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-sm" style={{ marginBottom: '4px' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>{meta.name}</span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                borderRadius: '12px',
                fontWeight: 500,
              }}
            >
              {meta.category}
            </span>
            {detected && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--error)',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                DETECTED{detectedCount && detectedCount > 1 ? ` ×${detectedCount}` : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            {meta.description}
          </p>
          {/* Quick tip — always visible */}
          <div
            className="flex items-center gap-sm"
            style={{
              marginTop: '8px',
              padding: '6px 10px',
              background: 'rgba(48, 209, 88, 0.06)',
              borderLeft: '3px solid var(--success)',
              borderRadius: '0 6px 6px 0',
            }}
          >
            <Lightbulb size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {education.quickTip}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: '12px', flexShrink: 0, color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          style={{
            padding: '0 var(--spacing-lg) var(--spacing-lg)',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {/* Real-world example */}
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
              <BookOpen size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}
              >
                Real-World Example
              </span>
            </div>
            <div
              style={{
                padding: 'var(--spacing-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                {education.realWorldExample.title}
                {education.realWorldExample.year && (
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                      marginLeft: '8px',
                      fontSize: '11px',
                    }}
                  >
                    {education.realWorldExample.company} · {education.realWorldExample.year}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {education.realWorldExample.description}
              </p>
            </div>
          </div>

          {/* Debiasing techniques */}
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
              <Shield size={14} style={{ color: 'var(--success)' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}
              >
                Debiasing Techniques
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {education.debiasingTechniques.map((technique, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--bg-primary)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(48, 209, 88, 0.1)',
                      color: 'var(--success)',
                      borderRadius: '50%',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </span>
                  {technique}
                </div>
              ))}
            </div>
          </div>

          {/* Related biases */}
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
              <Link2 size={14} style={{ color: 'var(--text-secondary)' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                }}
              >
                Related Biases
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {education.relatedBiases.map(({ key, reason }) => {
                const related = BIAS_CATEGORIES[key];
                if (!related) return null;
                return (
                  <button
                    key={key}
                    onClick={e => {
                      e.stopPropagation();
                      onBiasClick?.(key);
                    }}
                    title={reason}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '16px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      cursor: onBiasClick ? 'pointer' : 'default',
                    }}
                  >
                    {related.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer: difficulty + academic reference */}
          <div
            className="flex items-center justify-between"
            style={{
              marginTop: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center gap-sm">
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Difficulty to counteract:
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: difficultyColor,
                  padding: '1px 8px',
                  background: `${difficultyColor}15`,
                  borderRadius: '10px',
                }}
              >
                {education.difficulty.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-sm" title={education.academicReference.citation}>
              <GraduationCap size={12} style={{ color: 'var(--text-muted)' }} />
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  maxWidth: '260px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {education.academicReference.citation}
              </span>
              {education.academicReference.doi && (
                <a
                  href={`https://doi.org/${education.academicReference.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  title={`DOI: ${education.academicReference.doi}`}
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Link2 size={10} />
                  DOI
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
