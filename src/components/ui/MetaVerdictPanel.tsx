'use client';

import { useState } from 'react';
import { Swords, ChevronDown, ChevronUp } from 'lucide-react';

interface MetaVerdictPanelProps {
  verdict: string;
}

export function MetaVerdictPanel({ verdict }: MetaVerdictPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!verdict || verdict === 'No significant adversarial points detected; proposal cleared baseline checks.') {
    return null;
  }

  const preview = verdict.slice(0, 200);
  const needsTruncation = verdict.length > 200;

  return (
    <div
      className="card"
      style={{
        borderLeft: '3px solid #f59e0b',
        background: 'rgba(245, 158, 11, 0.03)',
      }}
    >
      <div
        className="card-header"
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Swords size={16} style={{ color: '#f59e0b' }} />
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
            }}
          >
            Adversarial Analysis
          </h3>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          >
            META-JUDGE
          </span>
        </div>
        {needsTruncation && (
          expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      <div className="card-body" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
        <p
          style={{
            fontSize: '13px',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {expanded || !needsTruncation ? verdict : `${preview}...`}
        </p>
        {needsTruncation && !expanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            style={{
              marginTop: '8px',
              fontSize: '12px',
              color: '#f59e0b',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Read full analysis
          </button>
        )}
      </div>
    </div>
  );
}
