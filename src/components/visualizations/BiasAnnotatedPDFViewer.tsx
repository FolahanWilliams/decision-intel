'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { BiasInstance } from '@/types';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, AlertTriangle } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#84CC16',
};

function formatBiasName(type: string): string {
  return type
    .replace(/_bias$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

interface BiasAnnotatedPDFViewerProps {
  documentId: string;
  biases: BiasInstance[];
  onBiasSelect?: (bias: BiasInstance) => void;
  /** Controlled-mode active bias id. When provided, the parent owns
   *  highlight state — useful for the v2 doc-detail layout where the
   *  audit pane and the PDF share a single source of truth. When
   *  undefined, the viewer uses its internal state (legacy mode). */
  controlledActiveBiasId?: string | null;
  /** Hide the built-in bias sidebar — used when the parent renders its
   *  own audit pane next to this viewer (v2 layout). */
  hideSidebar?: boolean;
}

export function BiasAnnotatedPDFViewer({
  documentId,
  biases,
  onBiasSelect,
  controlledActiveBiasId,
  hideSidebar = false,
}: BiasAnnotatedPDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalActiveBias, setInternalActiveBias] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Resolve active bias from controlled prop OR internal state.
  const activeBias =
    controlledActiveBiasId !== undefined ? controlledActiveBiasId : internalActiveBias;

  useEffect(() => {
    async function fetchPdfUrl() {
      try {
        const res = await fetch(`/api/documents/${documentId}/pdf`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Failed to load PDF');
          return;
        }
        const data = await res.json();
        setPdfUrl(data.url || data.data?.url);
      } catch {
        setError('Failed to fetch PDF URL');
      } finally {
        setLoading(false);
      }
    }
    fetchPdfUrl();
  }, [documentId]);

  const highlightExcerpts = useCallback(() => {
    if (!pageRef.current) return;
    const textLayer = pageRef.current.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;

    textLayer.querySelectorAll('[data-bias-highlight]').forEach(el => {
      (el as HTMLElement).style.backgroundColor = '';
      (el as HTMLElement).style.borderBottom = '';
      delete (el as HTMLElement).dataset.biasHighlight;
    });

    const spans = Array.from(textLayer.querySelectorAll('span'));
    const textParts = spans.map(s => s.textContent || '');
    const fullText = textParts.join('');

    for (const bias of biases) {
      const excerpt = bias.excerpt.trim().slice(0, 120);
      if (!excerpt) continue;

      const idx = fullText.toLowerCase().indexOf(excerpt.toLowerCase());
      if (idx === -1) continue;

      const endIdx = idx + excerpt.length;
      let charCount = 0;
      const color = SEVERITY_COLORS[bias.severity] ?? '#EAB308';
      const isActive = activeBias === bias.id;
      const opacity = isActive ? '50' : '25';

      for (const span of spans) {
        const text = span.textContent || '';
        const spanStart = charCount;
        const spanEnd = charCount + text.length;

        if (spanEnd > idx && spanStart < endIdx) {
          (span as HTMLElement).style.backgroundColor = color + opacity;
          (span as HTMLElement).style.borderBottom = `2px solid ${color}`;
          (span as HTMLElement).dataset.biasHighlight = bias.id;
          if (isActive) {
            (span as HTMLElement).style.outline = `1px solid ${color}`;
          }
        }
        charCount = spanEnd;
      }
    }
  }, [biases, activeBias]);

  useEffect(() => {
    const timer = setTimeout(highlightExcerpts, 200);
    return () => clearTimeout(timer);
  }, [pageNumber, highlightExcerpts]);

  const handleBiasClick = useCallback(
    (bias: BiasInstance) => {
      // In controlled mode, parent owns state — only fire onBiasSelect.
      if (controlledActiveBiasId === undefined) {
        setInternalActiveBias(prev => (prev === bias.id ? null : bias.id));
      }
      onBiasSelect?.(bias);
    },
    [onBiasSelect, controlledActiveBiasId]
  );

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          color: 'var(--text-muted)',
          fontSize: 13,
          gap: 8,
        }}
      >
        <FileText size={16} />
        Loading PDF...
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: 'var(--text-muted)',
          fontSize: 13,
          gap: 8,
        }}
      >
        <AlertTriangle size={16} />
        {error || 'PDF not available'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%', minHeight: 600 }}>
      {/* PDF Viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            fontSize: 12,
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              style={{
                background: 'none',
                border: 'none',
                cursor: pageNumber <= 1 ? 'default' : 'pointer',
                color: pageNumber <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                padding: 4,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              style={{
                background: 'none',
                border: 'none',
                cursor: pageNumber >= numPages ? 'default' : 'pointer',
                color: pageNumber >= numPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                padding: 4,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setScale(s => Math.max(0.5, s - 0.15))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 4,
              }}
            >
              <ZoomOut size={14} />
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(s => Math.min(2.5, s + 0.15))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: 4,
              }}
            >
              <ZoomIn size={14} />
            </button>
            {/* Escape hatch — long documents on mobile cap at 60-70vh
               of the device viewport. The "open in new tab" link lets
               users hand the PDF off to the device's native PDF viewer
               for full-screen + native gestures. */}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full PDF in new tab"
              style={{
                marginLeft: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                padding: '2px 6px',
                borderRadius: 3,
                letterSpacing: '0.04em',
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-tertiary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ↗ tab
            </a>
          </div>
        </div>

        {/* PDF Page */}
        <div
          ref={pageRef}
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            padding: 16,
            background: 'var(--bg-tertiary)',
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setError('Failed to load PDF')}
            loading={
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 40 }}>
                Rendering...
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer
              renderAnnotationLayer={false}
              onRenderSuccess={highlightExcerpts}
            />
          </Document>
        </div>
      </div>

      {/* Bias Sidebar — hidden in v2 layout where audit pane lives next door */}
      {!hideSidebar && (
        <div
          style={{
            width: 260,
            flexShrink: 0,
            borderLeft: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            overflowY: 'auto',
            fontSize: 12,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-color)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          >
            Detected Biases ({biases.length})
          </div>
          {biases.map(bias => {
            const color = SEVERITY_COLORS[bias.severity] ?? '#EAB308';
            const isActive = activeBias === bias.id;
            return (
              <button
                key={bias.id}
                onClick={() => handleBiasClick(bias)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border-color)',
                  background: isActive ? color + '12' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isActive ? color : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      color,
                      background: color + '18',
                      padding: '1px 5px',
                      borderRadius: 3,
                    }}
                  >
                    {bias.severity}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>
                    {formatBiasName(bias.biasType)}
                  </span>
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {bias.excerpt.slice(0, 120)}
                  {bias.excerpt.length > 120 ? '...' : ''}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
