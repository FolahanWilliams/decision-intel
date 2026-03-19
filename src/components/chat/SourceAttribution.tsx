'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { ChatSource } from '@/hooks/useChatStream';

interface SourceAttributionProps {
  sources: ChatSource[];
}

export function SourceAttribution({ sources }: SourceAttributionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const sorted = [...sources].sort((a, b) => b.similarity - a.similarity);

  return (
    <div style={{ marginTop: '8px', paddingLeft: '48px' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 0',
        }}
      >
        <FileText size={11} />
        {sorted.length} source{sorted.length !== 1 ? 's' : ''} referenced
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '6px',
          }}
        >
          {sorted.map((source, i) => (
            <Link
              key={`${source.documentId}-${i}`}
              href={`/documents/${source.documentId}`}
              target="_blank"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'rgba(99, 102, 241, 0.04)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'border-color 0.15s',
              }}
            >
              <FileText size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {source.filename}
                </div>
                <div className="flex items-center gap-sm" style={{ marginTop: '2px' }}>
                  {/* Relevance bar */}
                  <div
                    style={{
                      width: '60px',
                      height: '4px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round(source.similarity * 100)}%`,
                        height: '100%',
                        background:
                          source.similarity >= 0.8
                            ? 'var(--success)'
                            : source.similarity >= 0.5
                              ? 'var(--warning)'
                              : 'var(--text-muted)',
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {Math.round(source.similarity * 100)}% match
                  </span>
                  {source.score > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '0 5px',
                        background:
                          source.score >= 70
                            ? 'rgba(48, 209, 88, 0.12)'
                            : 'rgba(255, 159, 10, 0.12)',
                        color: source.score >= 70 ? 'var(--success)' : 'var(--warning)',
                        borderRadius: '6px',
                        fontWeight: 600,
                      }}
                    >
                      {Math.round(source.score)}/100
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
