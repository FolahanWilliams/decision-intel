'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, Brain } from 'lucide-react';
import { BIAS_CATEGORIES, type BiasCategory } from '@/types';
import { BiasEducationCard } from '@/components/ui/BiasEducationCard';
import { useDocuments } from '@/hooks/useDocuments';

const ALL_CATEGORIES = [
  'All',
  'Judgment',
  'Group Dynamics',
  'Overconfidence',
  'Risk Assessment',
  'Information',
] as const;
const BIAS_KEYS = Object.keys(BIAS_CATEGORIES) as BiasCategory[];

export default function BiasLibraryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  // Use detailed mode to get analyses with biases
  const { documents } = useDocuments(true, 1, 100);

  // Aggregate bias counts from all analysed documents
  const biasDetectionCounts = useMemo(() => {
    if (!documents?.length) return {};
    const counts: Record<string, number> = {};
    for (const doc of documents) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analyses = (doc as any).analyses;
      if (!Array.isArray(analyses) || !analyses.length) continue;
      for (const analysis of analyses) {
        if (!Array.isArray(analysis.biases) || !analysis.biases.length) continue;
        for (const bias of analysis.biases) {
          if (!bias.biasType || typeof bias.biasType !== 'string') continue;
          const key = bias.biasType
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z_]/g, '');
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    return counts;
  }, [documents]);

  const filtered = useMemo(() => {
    return BIAS_KEYS.filter(key => {
      const meta = BIAS_CATEGORIES[key];
      if (activeCategory !== 'All' && meta.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          meta.name.toLowerCase().includes(q) ||
          meta.description.toLowerCase().includes(q) ||
          meta.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, activeCategory]);

  const detectedBiasKeys = useMemo(() => {
    return BIAS_KEYS.filter(key => (biasDetectionCounts[key] || 0) > 0);
  }, [biasDetectionCounts]);

  const handleBiasClick = (key: BiasCategory) => {
    // Scroll to the card element
    const el = document.getElementById(`bias-card-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash highlight
      el.style.boxShadow = '0 0 0 2px var(--text-highlight)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 1500);
    }
  };

  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: 'var(--spacing-xl) var(--spacing-lg)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="flex items-center gap-md" style={{ marginBottom: '8px' }}>
          <BookOpen size={24} style={{ color: 'var(--text-secondary)' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Bias Library</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '600px' }}>
          Learn about the 16 cognitive biases our AI detects, with real-world examples and proven
          debiasing techniques.
        </p>
      </div>

      {/* Your detected biases banner */}
      {detectedBiasKeys.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--spacing-lg)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
            <div className="flex items-center gap-sm" style={{ marginBottom: '8px' }}>
              <Brain size={16} style={{ color: 'var(--text-highlight)' }} />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-highlight)',
                }}
              >
                Your Detected Biases
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                — Found across {documents?.length || 0} documents
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {detectedBiasKeys.map(key => {
                const meta = BIAS_CATEGORIES[key];
                return (
                  <button
                    key={key}
                    onClick={() => handleBiasClick(key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    {meta.name}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--error)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        padding: '0 6px',
                        borderRadius: '8px',
                      }}
                    >
                      {biasDetectionCounts[key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Search and filter bar */}
      <div
        className="flex items-center gap-md"
        style={{ marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            flex: '1 1 240px',
            maxWidth: '360px',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search biases..."
            aria-label="Search biases"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '13px',
              width: '100%',
            }}
          />
        </div>
        <div className="flex items-center gap-sm" style={{ flexWrap: 'wrap' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                borderRadius: '16px',
                border:
                  activeCategory === cat
                    ? '1px solid rgba(255, 255, 255, 0.15)'
                    : '1px solid var(--border-color)',
                background:
                  activeCategory === cat ? 'rgba(255, 255, 255, 0.06)' : 'var(--bg-secondary)',
                color: activeCategory === cat ? 'var(--text-highlight)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: activeCategory === cat ? 600 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bias grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
              color: 'var(--text-muted)',
            }}
          >
            No biases match your search. Try a different query.
          </div>
        )}
        {filtered.map(key => (
          <div key={key} id={`bias-card-${key}`} style={{ transition: 'box-shadow 0.3s ease' }}>
            <BiasEducationCard
              biasType={key}
              variant="compact"
              detected={(biasDetectionCounts[key] || 0) > 0}
              detectedCount={biasDetectionCounts[key]}
              onBiasClick={handleBiasClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
