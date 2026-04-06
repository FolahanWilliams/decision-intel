'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft, Download, Copy, FileText, Check } from 'lucide-react';
import type { CaseStudy } from '@/lib/data/case-studies/types';
import { CaseStudyBiasGraphExport } from './CaseStudyBiasGraphExport';
import { CaseStudyKnowledgeGraphExport } from './CaseStudyKnowledgeGraphExport';
import { downloadSvgAsPng, copySvgToClipboard } from '@/lib/utils/svg-to-image';
import {
  card,
  sectionTitle,
  badge,
  formatBias,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
} from '../shared-styles';

const FORMATS = [
  { id: 'linkedin', label: 'LinkedIn (1200×628)', w: 1200, h: 628 },
  { id: 'square', label: 'Square (1080×1080)', w: 1080, h: 1080 },
] as const;

type FormatId = (typeof FORMATS)[number]['id'];
type Tab = 'bias_web' | 'knowledge_graph';

interface Props {
  caseStudy: CaseStudy;
  onBack: () => void;
  onUseInPost: (topic: string) => void;
}

export function CaseStudyAnalyzer({ caseStudy, onBack, onUseInPost }: Props) {
  const [tab, setTab] = useState<Tab>('bias_web');
  const [format, setFormat] = useState<FormatId>('linkedin');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const biasRef = useRef<SVGSVGElement>(null);
  const knowledgeRef = useRef<SVGSVGElement>(null);

  const currentFormat = FORMATS.find(f => f.id === format)!;
  const activeSvgRef = tab === 'bias_web' ? biasRef : knowledgeRef;
  const outcomeColor = OUTCOME_COLORS[caseStudy.outcome] ?? '#94A3B8';

  const handleDownload = useCallback(async () => {
    const svg = activeSvgRef.current;
    if (!svg) return;
    setDownloading(true);
    try {
      const slug = caseStudy.company.toLowerCase().replace(/\s+/g, '-');
      const name = `${slug}-${tab === 'bias_web' ? 'bias-web' : 'knowledge-graph'}-${format}`;
      await downloadSvgAsPng(svg, name, currentFormat.w, currentFormat.h);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  }, [activeSvgRef, caseStudy.company, tab, format, currentFormat]);

  const handleCopy = useCallback(async () => {
    const svg = activeSvgRef.current;
    if (!svg) return;
    try {
      await copySvgToClipboard(svg, currentFormat.w, currentFormat.h);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [activeSvgRef, currentFormat]);

  const handleUseInPost = useCallback(() => {
    const topic = `${caseStudy.company} (${caseStudy.year}): ${caseStudy.title}. Biases detected: ${caseStudy.biasesPresent.map(formatBias).join(', ')}. ${caseStudy.toxicCombinations.length > 0 ? `Toxic combinations: ${caseStudy.toxicCombinations.join(', ')}.` : ''} Outcome: ${caseStudy.estimatedImpact}.`;
    onUseInPost(topic);
  }, [caseStudy, onUseInPost]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px',
    borderRadius: 6,
    border: 'none',
    background: active ? 'var(--bg-card-hover, #1a1a1a)' : 'transparent',
    color: active ? 'var(--text-primary, #fff)' : 'var(--text-muted, #71717a)',
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  // Scale the preview so it fits in the UI
  const previewScale = Math.min(1, 600 / currentFormat.w);

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border-primary, #222)',
            background: 'transparent',
            color: 'var(--text-secondary, #a1a1aa)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={sectionTitle}>
            {caseStudy.company}{' '}
            <span style={{ color: 'var(--text-muted, #71717a)', fontWeight: 400, fontSize: 14 }}>
              ({caseStudy.year})
            </span>
          </div>
        </div>
        <span style={badge(outcomeColor)}>
          {OUTCOME_LABELS[caseStudy.outcome] ?? caseStudy.outcome}
        </span>
      </div>

      {/* Case study summary */}
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary, #a1a1aa)',
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        {caseStudy.summary}
      </p>

      {/* Top biases */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {caseStudy.biasesPresent.slice(0, 6).map(b => (
          <span
            key={b}
            style={{
              ...badge(b === caseStudy.primaryBias ? '#DC2626' : '#F97316'),
              fontSize: 10,
            }}
          >
            {formatBias(b)}
          </span>
        ))}
        {caseStudy.biasesPresent.length > 6 && (
          <span style={{ ...badge('#94A3B8'), fontSize: 10 }}>
            +{caseStudy.biasesPresent.length - 6} more
          </span>
        )}
      </div>

      {/* Tabs + Format selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 3,
            borderRadius: 8,
            background: 'var(--bg-primary, #0a0a0a)',
            border: '1px solid var(--border-primary, #222)',
          }}
        >
          <button style={tabStyle(tab === 'bias_web')} onClick={() => setTab('bias_web')}>
            Bias Web
          </button>
          <button
            style={tabStyle(tab === 'knowledge_graph')}
            onClick={() => setTab('knowledge_graph')}
          >
            Knowledge Graph
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={format}
            onChange={e => setFormat(e.target.value as FormatId)}
            style={{
              padding: '5px 8px',
              borderRadius: 6,
              border: '1px solid var(--border-primary, #222)',
              background: 'var(--bg-primary, #0a0a0a)',
              color: 'var(--text-primary, #fff)',
              fontSize: 11,
              outline: 'none',
            }}
          >
            {FORMATS.map(f => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SVG Preview */}
      <div
        style={{
          overflow: 'auto',
          borderRadius: 12,
          border: '1px solid var(--border-primary, #222)',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
            width: currentFormat.w,
            height: currentFormat.h,
          }}
        >
          {tab === 'bias_web' ? (
            <CaseStudyBiasGraphExport
              ref={biasRef}
              caseStudy={caseStudy}
              width={currentFormat.w}
              height={currentFormat.h}
            />
          ) : (
            <CaseStudyKnowledgeGraphExport
              ref={knowledgeRef}
              caseStudy={caseStudy}
              width={currentFormat.w}
              height={currentFormat.h}
            />
          )}
        </div>
      </div>

      {/* Export controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #F9731940',
            background: '#F9731915',
            color: '#F97316',
            fontSize: 12,
            fontWeight: 600,
            cursor: downloading ? 'wait' : 'pointer',
            opacity: downloading ? 0.6 : 1,
          }}
        >
          <Download size={14} />
          {downloading ? 'Saving...' : 'Download PNG'}
        </button>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-primary, #222)',
            background: 'transparent',
            color: copied ? '#22C55E' : 'var(--text-secondary, #a1a1aa)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={handleUseInPost}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #3B82F640',
            background: '#3B82F615',
            color: '#3B82F6',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          <FileText size={14} />
          Use in Post
        </button>
      </div>
    </div>
  );
}
