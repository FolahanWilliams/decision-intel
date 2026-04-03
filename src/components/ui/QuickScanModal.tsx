'use client';

import { useState, useRef } from 'react';
import { X, Zap, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { DQIBadge } from '@/components/ui/DQIBadge';
import { trackEvent } from '@/lib/analytics/track';
import Link from 'next/link';

interface QuickScanBias {
  type: string;
  severity: string;
  excerpt: string;
}

interface QuickScanResult {
  score: number;
  grade: string;
  biases: QuickScanBias[];
  processedAt: string;
}

interface QuickScanModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_CHARS = 50_000;

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  low: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
};

export function QuickScanModal({ open, onClose }: QuickScanModalProps) {
  const [content, setContent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<QuickScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!open) return null;

  const handleScan = async () => {
    if (!content.trim() || scanning) return;

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze/quick-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Scan failed (${res.status})`);
      }

      const data: QuickScanResult = await res.json();
      setResult(data);
      trackEvent('quick_scan_completed', { score: data.score, grade: data.grade });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="card liquid-glass-premium"
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '85vh',
          overflow: 'auto',
          padding: '24px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Quick Bias Check
            </h2>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Paste any text — memo, article, report — to scan for cognitive biases in ~5 seconds..."
              style={{
                width: '100%',
                minHeight: 180,
                padding: 12,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'rgba(0, 0, 0, 0.2)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            {/* Char count + scan button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {content.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
              </span>
              <button
                onClick={handleScan}
                disabled={!content.trim() || scanning}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  opacity: !content.trim() || scanning ? 0.5 : 1,
                }}
              >
                {scanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Scanning (~5s)
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Scan
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <DQIBadge score={result.score} size="lg" showGrade animate />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {result.score}/100
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Decision Quality Score
                </div>
              </div>
            </div>

            {/* Biases */}
            {result.biases.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: 4,
                  }}
                >
                  Detected Biases ({result.biases.length})
                </div>
                {result.biases.map((bias, i) => {
                  const colors = SEVERITY_COLORS[bias.severity] || SEVERITY_COLORS.medium;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--bg-elevated)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{bias.type}</span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: colors.bg,
                            color: colors.text,
                          }}
                        >
                          {bias.severity}
                        </span>
                      </div>
                      {bias.excerpt && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                          }}
                        >
                          &ldquo;{bias.excerpt}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#22c55e',
                  marginBottom: 20,
                }}
              >
                No significant biases detected — nice!
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button
                onClick={() => {
                  setResult(null);
                  setContent('');
                }}
                className="btn btn-ghost"
                style={{ fontSize: '0.8125rem' }}
              >
                Scan Another
              </button>
              <Link
                href="/dashboard?view=upload"
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.8125rem',
                  textDecoration: 'none',
                }}
              >
                Run Full Analysis <ArrowRight size={14} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
