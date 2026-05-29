'use client';

/**
 * BiasLibraryContent — searchable in-platform reference for the
 * 22-bias R²F taxonomy.
 *
 * Reads from canonical BIAS_EDUCATION + BIAS_CATEGORIES SSOTs. Every
 * bias card derives its label, taxonomy ID, category, quick tip,
 * debiasing techniques, academic citation, and difficulty from the
 * SSOT — zero duplication. When BIAS_EDUCATION extends (DI-B-023+),
 * this page picks the new entries up automatically.
 *
 * UX:
 *   - Top search bar (filters by name OR taxonomy ID OR category)
 *   - Category filter chips (multi-select toggle)
 *   - Difficulty filter chips (easy / moderate / hard)
 *   - Grid of bias cards: name + taxonomy ID + category badge +
 *     difficulty chip + quick tip + "Read more →"
 *   - Click → slide-in drawer with full academic citation + DOI link
 *     + all debiasing techniques + real-world example + related
 *     biases (clickable in-drawer navigation)
 *
 * Reuses canonical formatBiasName + DIFFICULTY_COLORS from the SSOT.
 *
 * intentional-modal-pattern — DO NOT migrate to <Dialog> without
 * review. The bias detail surface is a right-side slide-in drawer
 * (600px wide, full-height, sticky header), not a centered modal.
 * Mirrors the QuickScanModal pattern. The drawer's own focus
 * management + ESC handler + click-outside dismiss is implemented at
 * the file's bottom (DetailDrawer component). Same marker shape as
 * QuickScanModal — audit-platform.mjs recognises it via this header
 * comment.
 */

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  BookOpen,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { BIAS_EDUCATION, DIFFICULTY_COLORS } from '@/lib/constants/bias-education';
import { BIAS_CATEGORIES, type BiasCategory } from '@/types';
import { formatBiasName } from '@/lib/utils/labels';

type Difficulty = 'easy' | 'moderate' | 'hard';

interface BiasEntry {
  key: BiasCategory;
  displayName: string;
  taxonomyId: string;
  meta: (typeof BIAS_CATEGORIES)[BiasCategory];
  education: (typeof BIAS_EDUCATION)[BiasCategory];
  category: string;
  difficulty: Difficulty;
}

function buildEntries(): BiasEntry[] {
  return (Object.keys(BIAS_EDUCATION) as BiasCategory[]).map(key => {
    const education = BIAS_EDUCATION[key];
    const meta = BIAS_CATEGORIES[key];
    return {
      key,
      displayName: formatBiasName(key) || meta.name,
      taxonomyId: education.taxonomyId,
      meta,
      education,
      category: meta.category,
      difficulty: education.difficulty,
    };
  });
}

// Computed once at module load — BIAS_EDUCATION is a frozen SSOT, so
// these derivations are stable across renders.
const ALL_ENTRIES = buildEntries();
const ALL_CATEGORIES = Array.from(new Set(ALL_ENTRIES.map(e => e.category))).sort();

export function BiasLibraryContent() {
  const allEntries = ALL_ENTRIES;
  const allCategories = ALL_CATEGORIES;

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<Set<Difficulty>>(new Set());
  const [activeBias, setActiveBias] = useState<BiasEntry | null>(null);

  // Filtered entries
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allEntries.filter(e => {
      if (categoryFilter.size > 0 && !categoryFilter.has(e.category)) return false;
      if (difficultyFilter.size > 0 && !difficultyFilter.has(e.difficulty)) return false;
      if (q.length === 0) return true;
      const haystack =
        `${e.displayName} ${e.taxonomyId} ${e.category} ${e.meta.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allEntries, query, categoryFilter, difficultyFilter]);

  // Group by category for display
  const grouped = useMemo(() => {
    const map = new Map<string, BiasEntry[]>();
    for (const e of filtered) {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!activeBias) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeBias]);

  const toggleCategory = (cat: string) =>
    setCategoryFilter(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  const toggleDifficulty = (diff: Difficulty) =>
    setDifficultyFilter(prev => {
      const next = new Set(prev);
      if (next.has(diff)) next.delete(diff);
      else next.add(diff);
      return next;
    });

  const clearAllFilters = () => {
    setQuery('');
    setCategoryFilter(new Set());
    setDifficultyFilter(new Set());
  };

  const hasFilters = query.length > 0 || categoryFilter.size > 0 || difficultyFilter.size > 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)',
            color: 'var(--accent-primary)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            borderRadius: 999,
            marginBottom: 14,
          }}
        >
          <BookOpen size={12} />
          R²F Bias Taxonomy
        </div>
        <h1>Bias Library</h1>
        <p
          style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: 720,
            marginTop: 8,
          }}
        >
          {allEntries.length} canonical cognitive biases — every one used in DI&apos;s audit
          pipeline, with academic citations and debiasing techniques. Search or filter while you
          review an audit; click any bias for the full reference panel.
        </p>
      </header>

      {/* Search + Filters */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            position: 'relative',
            marginBottom: 14,
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, taxonomy ID, or category..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              fontSize: 14,
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Category
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allCategories.map(cat => (
              <FilterChip
                key={cat}
                label={cat}
                active={categoryFilter.has(cat)}
                onClick={() => toggleCategory(cat)}
              />
            ))}
          </div>
        </div>

        {/* Difficulty filters */}
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Difficulty
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['easy', 'moderate', 'hard'] as const).map(d => (
              <FilterChip
                key={d}
                label={d[0]!.toUpperCase() + d.slice(1)}
                accent={DIFFICULTY_COLORS[d]}
                active={difficultyFilter.has(d)}
                onClick={() => toggleDifficulty(d)}
              />
            ))}
          </div>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              marginTop: 12,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Clear all filters · showing {filtered.length} of {allEntries.length}
          </button>
        )}
      </div>

      {/* Grouped bias cards */}
      {grouped.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>
            No biases match your filters.
          </div>
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        grouped.map(([category, entries]) => (
          <section key={category} style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 12,
                paddingBottom: 6,
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              {category} <span style={{ color: 'var(--text-muted)' }}>· {entries.length}</span>
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 12,
              }}
            >
              {entries.map(entry => (
                <BiasCard key={entry.key} entry={entry} onOpen={() => setActiveBias(entry)} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Drawer */}
      {activeBias && (
        <BiasDrawer
          entry={activeBias}
          onClose={() => setActiveBias(null)}
          onNavigate={key => {
            const next = allEntries.find(e => e.key === key);
            if (next) setActiveBias(next);
          }}
        />
      )}
    </div>
  );
}

// ─── BiasCard ─────────────────────────────────────────────────────────

function BiasCard({ entry, onOpen }: { entry: BiasEntry; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.15s, transform 0.1s',
        color: 'var(--text-primary)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)',
              marginBottom: 4,
              letterSpacing: '0.04em',
            }}
          >
            {entry.taxonomyId}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            {entry.displayName}
          </div>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            background: `color-mix(in srgb, ${DIFFICULTY_COLORS[entry.difficulty]} 12%, transparent)`,
            color: DIFFICULTY_COLORS[entry.difficulty],
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.difficulty}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {entry.meta.description}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          lineHeight: 1.5,
          paddingTop: 6,
          borderTop: '1px solid var(--border-color)',
        }}
      >
        &ldquo;{entry.education.quickTip}&rdquo;
      </div>
    </button>
  );
}

// ─── BiasDrawer ───────────────────────────────────────────────────────

function BiasDrawer({
  entry,
  onClose,
  onNavigate,
}: {
  entry: BiasEntry;
  onClose: () => void;
  onNavigate: (key: BiasCategory) => void;
}) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const ref = entry.education.academicReference;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          zIndex: 100,
        }}
        aria-hidden
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-labelledby="bias-drawer-title"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(600px, 100vw)',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-8px 0 24px rgba(15, 23, 42, 0.08)',
          zIndex: 101,
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--bg-card)',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            zIndex: 1,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono, monospace)',
                marginBottom: 4,
                letterSpacing: '0.04em',
              }}
            >
              {entry.taxonomyId} · {entry.category}
            </div>
            <h2
              id="bias-drawer-title"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {entry.displayName}
            </h2>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {entry.meta.description}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: 6,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 80px' }}>
          {/* Quick tip */}
          <Section
            icon={<ShieldCheck size={14} />}
            title="Quick tip"
            accent="var(--accent-primary)"
          >
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', margin: 0 }}>
              &ldquo;{entry.education.quickTip}&rdquo;
            </p>
          </Section>

          {/* Real-world example */}
          <Section icon={<BookOpen size={14} />} title="Real-world example">
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>
                {entry.education.realWorldExample.title}
              </strong>
              {entry.education.realWorldExample.company && (
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 12,
                    marginLeft: 8,
                  }}
                >
                  · {entry.education.realWorldExample.company}
                  {entry.education.realWorldExample.year &&
                    ` · ${entry.education.realWorldExample.year}`}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {entry.education.realWorldExample.description}
            </p>
          </Section>

          {/* Debiasing techniques */}
          <Section icon={<ShieldCheck size={14} />} title="Debiasing techniques">
            <ol
              style={{
                paddingLeft: 18,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {entry.education.debiasingTechniques.map((t, i) => (
                <li
                  key={i}
                  style={{ color: 'var(--text-secondary)', lineHeight: 1.55, fontSize: 14 }}
                >
                  {t}
                </li>
              ))}
            </ol>
          </Section>

          {/* Related biases */}
          {entry.education.relatedBiases.length > 0 && (
            <Section icon={<ArrowRight size={14} />} title="Related biases">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entry.education.relatedBiases.map(rel => (
                  <button
                    key={rel.key}
                    type="button"
                    onClick={() => onNavigate(rel.key)}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                        {formatBiasName(rel.key)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {rel.reason}
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Academic citation */}
          <Section icon={<GraduationCap size={14} />} title="Academic anchor">
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: 12,
                fontSize: 13,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              {ref.citation}
            </div>
            {ref.doi && (
              <a
                href={`https://doi.org/${ref.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                doi: {ref.doi}
                <ExternalLink size={12} />
              </a>
            )}
            {!ref.doi && ref.url && (
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 10,
                  fontSize: 13,
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Source
                <ExternalLink size={12} />
              </a>
            )}
          </Section>

          {/* Cross-links */}
          <Section title="More">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Link
                href={`/taxonomy#${entry.key}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Public taxonomy page
                <ExternalLink size={12} />
              </Link>
              <Link
                href={`/case-studies?primaryBias=${entry.key}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Historical cases
                <ArrowRight size={12} />
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  accent,
  onClick,
}: {
  label: string;
  active: boolean;
  accent?: string;
  onClick: () => void;
}) {
  const color = accent ?? 'var(--accent-primary)';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
        background: active ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--bg-elevated)',
        color: active ? color : 'var(--text-secondary)',
        border: `1px solid ${active ? color : 'var(--border-color)'}`,
        borderRadius: 999,
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function Section({
  icon,
  title,
  accent,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: accent ?? 'var(--text-muted)',
          marginBottom: 8,
        }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}
