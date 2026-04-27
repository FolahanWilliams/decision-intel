'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Download,
  Copy,
  FileText,
  Check,
  Loader2,
  Linkedin,
  Clipboard,
} from 'lucide-react';
import type { CaseStudy } from '@/lib/data/case-studies/types';
import { getSlugForCase } from '@/lib/data/case-studies/slugs';
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
  founderPass?: string;
}

export function CaseStudyAnalyzer({ caseStudy, onBack, onUseInPost, founderPass }: Props) {
  const [tab, setTab] = useState<Tab>('bias_web');
  const [format, setFormat] = useState<FormatId>('linkedin');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const biasRef = useRef<SVGSVGElement>(null);
  const knowledgeRef = useRef<SVGSVGElement>(null);

  // LinkedIn post generator state
  const [linkedinPost, setLinkedinPost] = useState('');
  const [generatingPost, setGeneratingPost] = useState(false);
  const [postCopied, setPostCopied] = useState(false);

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

  const caseSlug = getSlugForCase(caseStudy);
  const caseUrl = `https://www.decision-intel.com/case-studies/${caseSlug}`;

  const handleGenerateLinkedinPost = useCallback(async () => {
    if (!founderPass) return;
    setGeneratingPost(true);
    setLinkedinPost('');

    const topic = `Write a LinkedIn post about the ${caseStudy.company} (${caseStudy.year}) case study. Key facts: ${caseStudy.title}. Biases detected: ${caseStudy.biasesPresent.map(formatBias).join(', ')}. Primary bias: ${formatBias(caseStudy.primaryBias)}. ${caseStudy.toxicCombinations.length > 0 ? `Toxic combinations: ${caseStudy.toxicCombinations.join(', ')}.` : ''} Outcome: ${caseStudy.estimatedImpact}. Summary: ${caseStudy.summary}. End the post with: "Read the full case study: ${caseUrl}" and relevant hashtags.`;

    try {
      const res = await fetch('/api/founder-hub/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-founder-pass': founderPass,
        },
        body: JSON.stringify({
          action: 'generate',
          contentType: 'linkedin_post',
          topic,
          tone: 'authoritative',
        }),
      });

      if (!res.ok) {
        setLinkedinPost('Error: Failed to generate post.');
        setGeneratingPost(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setGeneratingPost(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk' && data.text) {
                accumulated += data.text;
                setLinkedinPost(accumulated);
              }
            } catch {
              // Malformed SSE line — skip silently per CLAUDE.md fire-and-forget exceptions (JSON.parse fallback).
            }
          }
        }
      } finally {
        reader.cancel();
      }
    } catch {
      setLinkedinPost('Error: Network error during generation.');
    } finally {
      setGeneratingPost(false);
    }
  }, [caseStudy, founderPass, caseUrl]);

  const handleCopyPost = useCallback(() => {
    if (!linkedinPost) return;
    navigator.clipboard.writeText(linkedinPost).then(() => {
      setPostCopied(true);
      setTimeout(() => setPostCopied(false), 2000);
    });
  }, [linkedinPost]);

  const handleDownloadAndCopyPost = useCallback(async () => {
    // Download the graph image
    const svg = activeSvgRef.current;
    if (svg) {
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
    }
    // Copy the post text
    if (linkedinPost) {
      await navigator.clipboard.writeText(linkedinPost);
      setPostCopied(true);
      setTimeout(() => setPostCopied(false), 2000);
    }
  }, [activeSvgRef, caseStudy.company, tab, format, currentFormat, linkedinPost]);

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

      {/* ── LinkedIn Post Generator ────────────────────────────────── */}
      {founderPass && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: 'var(--bg-tertiary, #0a0a0a)',
            border: '1px solid var(--border-primary, #222)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Linkedin size={16} style={{ color: '#0A66C2' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #fff)' }}>
                LinkedIn Post
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {!linkedinPost && (
                <button
                  onClick={handleGenerateLinkedinPost}
                  disabled={generatingPost}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#0A66C2',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: generatingPost ? 'wait' : 'pointer',
                    opacity: generatingPost ? 0.7 : 1,
                  }}
                >
                  {generatingPost ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Linkedin size={12} />
                  )}
                  {generatingPost ? 'Generating...' : 'Generate Post'}
                </button>
              )}
              {linkedinPost && (
                <>
                  <button
                    onClick={handleCopyPost}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-primary, #222)',
                      background: 'transparent',
                      color: postCopied ? '#22C55E' : 'var(--text-secondary, #a1a1aa)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {postCopied ? <Check size={12} /> : <Clipboard size={12} />}
                    {postCopied ? 'Copied!' : 'Copy Post'}
                  </button>
                  <button
                    onClick={handleDownloadAndCopyPost}
                    disabled={downloading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#16A34A',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: downloading ? 'wait' : 'pointer',
                    }}
                  >
                    <Download size={12} />
                    Graph + Post
                  </button>
                  <button
                    onClick={handleGenerateLinkedinPost}
                    disabled={generatingPost}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-primary, #222)',
                      background: 'transparent',
                      color: 'var(--text-muted, #71717a)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {generatingPost ? <Loader2 size={12} className="animate-spin" /> : null}
                    Regenerate
                  </button>
                </>
              )}
            </div>
          </div>

          {linkedinPost && (
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'var(--bg-secondary, #111)',
                border: '1px solid var(--border-primary, #222)',
                fontSize: 13,
                color: 'var(--text-secondary, #a1a1aa)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                maxHeight: 300,
                overflowY: 'auto',
              }}
            >
              {linkedinPost}
            </div>
          )}

          {!linkedinPost && !generatingPost && (
            <p style={{ fontSize: 11, color: 'var(--text-muted, #71717a)', margin: 0 }}>
              Generate a LinkedIn post about this case study. Includes summary, key biases, and a
              link to the full analysis on your website.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
