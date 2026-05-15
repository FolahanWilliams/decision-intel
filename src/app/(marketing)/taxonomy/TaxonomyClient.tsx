'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  Hash,
  BookOpen,
  Lightbulb,
  Landmark,
  AlertTriangle,
  ChevronDown,
  X,
} from 'lucide-react';
import { BIAS_EDUCATION, type BiasEducationContent } from '@/lib/constants/bias-education';
import type { BiasCategory } from '@/types';

const C = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate900: '#0F172A',
  green: '#16A34A',
  greenLight: '#DCFCE7',
  greenSoft: 'rgba(22, 163, 74, 0.08)',
  greenBorder: 'rgba(22, 163, 74, 0.25)',
  amber: '#D97706',
  amberSoft: 'rgba(217, 119, 6, 0.08)',
  amberBorder: 'rgba(217, 119, 6, 0.25)',
  red: '#DC2626',
  redSoft: 'rgba(220, 38, 38, 0.08)',
  redBorder: 'rgba(220, 38, 38, 0.25)',
  violet: '#7C3AED',
  violetSoft: 'rgba(124, 58, 237, 0.08)',
};

type Difficulty = 'easy' | 'moderate' | 'hard';
type FilterDifficulty = 'all' | Difficulty;

const DIFFICULTY_TOKENS: Record<
  Difficulty,
  { label: string; dot: string; bg: string; border: string; fg: string }
> = {
  easy: {
    label: 'Easy to spot',
    dot: C.green,
    bg: C.greenSoft,
    border: C.greenBorder,
    fg: C.green,
  },
  moderate: {
    label: 'Moderate',
    dot: C.amber,
    bg: C.amberSoft,
    border: C.amberBorder,
    fg: C.amber,
  },
  hard: { label: 'Hard to spot', dot: C.red, bg: C.redSoft, border: C.redBorder, fg: C.red },
};

type BiasEntry = [BiasCategory, BiasEducationContent];

function formatName(key: string): string {
  return key
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function shortDescription(bias: BiasEducationContent): string {
  // Prefer quickTip — it's consistently 1-2 sentences that fit the card format.
  return bias.quickTip;
}

export function TaxonomyClient() {
  const entries = useMemo(
    () =>
      (Object.entries(BIAS_EDUCATION) as BiasEntry[]).sort((a, b) =>
        a[1].taxonomyId.localeCompare(b[1].taxonomyId)
      ),
    []
  );
  // Derived from the sorted taxonomy — never hardcode the ID range. The
  // published-contract page that shows a stale "DI-B-001 → DI-B-020"
  // range is the worst possible drift; this reads the actual max ID.
  const biasIdMin = entries[0]?.[1].taxonomyId ?? 'DI-B-001';
  const biasIdMax = entries[entries.length - 1]?.[1].taxonomyId ?? biasIdMin;

  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<FilterDifficulty>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Deep-link support: open the bias matching #DI-B-NNN on mount/hash change.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const apply = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && /^DI-B-\d{3}$/.test(hash)) {
        setExpandedId(hash);
        // Let the expand animation start, then bring the row into view.
        requestAnimationFrame(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(([key, bias]) => {
      if (difficulty !== 'all' && bias.difficulty !== difficulty) return false;
      if (!q) return true;
      const haystack = [
        formatName(key),
        bias.taxonomyId,
        bias.realWorldExample.title,
        bias.realWorldExample.company ?? '',
        bias.quickTip,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, query, difficulty]);

  const counts: Record<Difficulty, number> = { easy: 0, moderate: 0, hard: 0 };
  entries.forEach(([, b]) => {
    counts[b.difficulty] = (counts[b.difficulty] ?? 0) + 1;
  });

  const handleCardToggle = (taxonomyId: string) => {
    setExpandedId(prev => (prev === taxonomyId ? null : taxonomyId));
    // Update URL hash without jumping
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.hash = expandedId === taxonomyId ? '' : taxonomyId;
      window.history.replaceState(null, '', url);
    }
  };

  return (
    <div style={{ background: C.slate50, color: C.slate900 }}>
      {/* HERO */}
      <section
        style={{
          padding: '72px 24px 56px',
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.slate50} 100%)`,
          borderBottom: `1px solid ${C.slate200}`,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
              gap: 48,
              alignItems: 'center',
            }}
            className="taxonomy-hero"
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: C.green,
                  marginBottom: 18,
                }}
              >
                The full taxonomy
              </div>
              <h1
                style={{
                  fontSize: 'clamp(34px, 5.5vw, 58px)',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  marginBottom: 20,
                }}
              >
                Twenty biases.
                <br />
                Twenty research anchors
                <span style={{ color: C.green }}>.</span>
              </h1>
              <p
                style={{
                  fontSize: 'clamp(16px, 1.8vw, 19px)',
                  lineHeight: 1.55,
                  color: C.slate600,
                  margin: 0,
                  marginBottom: 14,
                  maxWidth: 620,
                }}
              >
                Every bias the Decision Intel pipeline detects has a stable, permanent ID ({biasIdMin}{' '}
                through {biasIdMax}), a named historical failure, and a primary academic citation. Cite
                these IDs in research, audits, and regulatory filings.
              </p>
              <p style={{ fontSize: 14, color: C.slate500, margin: 0, maxWidth: 620 }}>
                Once assigned, an ID never changes. This is the published contract.
              </p>

              <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    background: C.green,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Run these on your memo <ArrowRight size={14} />
                </Link>
                <Link
                  href="/how-it-works"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 22px',
                    borderRadius: 10,
                    background: C.white,
                    color: C.slate900,
                    border: `1px solid ${C.slate200}`,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <BookOpen size={14} /> See the pipeline
                </Link>
              </div>
            </div>

            <div>
              <BiasConstellation entries={entries} />
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section style={{ padding: '40px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <StatCard
              icon={Hash}
              label="Stable IDs"
              value={`${biasIdMin} → ${biasIdMax}`}
              sub="Published contract; IDs never change."
            />
            <StatCard
              icon={Landmark}
              label="Research traditions"
              value="5 primary sources"
              sub="Kahneman, Klein, Tetlock, Duke, Sibony."
            />
            <StatCard
              icon={AlertTriangle}
              label="Named failures"
              value="20 case studies"
              sub="Kodak, Enron, Boeing, WeWork and more."
            />
            <StatCard
              icon={Lightbulb}
              label="Debiasing techniques"
              value={`${entries.reduce((n, [, b]) => n + b.debiasingTechniques.length, 0)} total`}
              sub="Actionable, bias-specific mitigations."
            />
          </div>
        </div>
      </section>

      {/* COMPOUND PATTERNS — locked 2026-05-09 (M&A cascade depth ship).
          The 22 individual biases above amplify when they co-occur. The
          named patterns below are the 13 first-class compound failure
          modes our toxic-combination engine fires on, including the 3
          M&A-specific patterns shipped in the 2026-05-09 P1 cascade.
          Each pattern surfaces here as a procurement-grade reference so
          a Head of Corp Dev / PE Deal Partner reading the public
          taxonomy can see the M&A vocabulary without leaving the
          /taxonomy page. */}
      <section style={{ padding: '64px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 12,
            }}
          >
            Compound patterns · 13 named
          </div>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: 12,
              color: C.slate900,
            }}
          >
            How biases combine into named failure modes.
          </h2>
          <p
            style={{
              fontSize: 14.5,
              color: C.slate500,
              margin: 0,
              marginBottom: 28,
              maxWidth: 820,
              lineHeight: 1.6,
            }}
          >
            Detection in live memos is 8× harder for compound patterns than for individual biases.
            Three of these are M&A workflow-native (Synergy Mirage / Conglomerate Fallacy /
            Winner&rsquo;s Curse) — the failure modes McKinsey + KPMG track on 70-90% of
            acquisitions that miss synergies. Click through to{' '}
            <Link href="/bias-genome" style={{ color: C.green, fontWeight: 600 }}>
              /bias-genome
            </Link>{' '}
            for the full case-anchor coverage.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            {COMPOUND_PATTERNS.map(p => (
              <CompoundPatternCard key={p.label} pattern={p} />
            ))}
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <section
        id="browse"
        style={{
          padding: '56px 24px 0',
          position: 'sticky',
          top: 56,
          zIndex: 5,
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.slate200}`,
              borderRadius: 16,
              padding: '16px 18px',
              display: 'grid',
              gridTemplateColumns: 'minmax(220px, 1fr) auto',
              gap: 16,
              alignItems: 'center',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)',
            }}
            className="taxonomy-filter-bar"
          >
            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                border: `1px solid ${C.slate200}`,
                borderRadius: 10,
                background: C.slate50,
              }}
            >
              <Search size={16} color={C.slate400} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search biases, IDs, or case studies…"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: 14,
                  color: C.slate900,
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: C.slate400,
                    padding: 0,
                    display: 'flex',
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Difficulty chips */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
              }}
              className="taxonomy-filter-chips"
            >
              <FilterChip
                active={difficulty === 'all'}
                onClick={() => setDifficulty('all')}
                label={`All · ${entries.length}`}
                dot={C.slate400}
              />
              <FilterChip
                active={difficulty === 'easy'}
                onClick={() => setDifficulty('easy')}
                label={`Easy · ${counts.easy}`}
                dot={C.green}
              />
              <FilterChip
                active={difficulty === 'moderate'}
                onClick={() => setDifficulty('moderate')}
                label={`Moderate · ${counts.moderate}`}
                dot={C.amber}
              />
              <FilterChip
                active={difficulty === 'hard'}
                onClick={() => setDifficulty('hard')}
                label={`Hard · ${counts.hard}`}
                dot={C.red}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: 12.5,
              color: C.slate500,
              marginTop: 10,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.04em',
            }}
          >
            Showing {filtered.length} of {entries.length}
            {query ? ` · "${query}"` : ''}
            {difficulty !== 'all' ? ` · ${difficulty}` : ''}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section style={{ padding: '20px 24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {filtered.length === 0 && (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: C.white,
                border: `1px solid ${C.slate200}`,
                borderRadius: 16,
                color: C.slate500,
                fontSize: 14,
              }}
            >
              No biases match that filter. Try clearing your search.
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map(([key, bias]) => (
              <BiasCard
                key={key}
                biasKey={key}
                bias={bias}
                expanded={expandedId === bias.taxonomyId}
                onToggle={() => handleCardToggle(bias.taxonomyId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              background: C.navy,
              color: C.white,
              borderRadius: 20,
              padding: 'clamp(32px, 6vw, 56px)',
              textAlign: 'center',
              border: `1px solid ${C.slate700}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: C.green,
                marginBottom: 14,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              Put the taxonomy to work
            </div>
            <h2
              style={{
                fontSize: 'clamp(26px, 4vw, 38px)',
                fontWeight: 800,
                margin: 0,
                marginBottom: 14,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Run these twenty biases on your next strategic memo.
            </h2>
            <p
              style={{
                fontSize: 15.5,
                color: C.slate300,
                margin: 0,
                marginBottom: 28,
                maxWidth: 600,
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: 1.55,
              }}
            >
              Sixty seconds per document. Every detection cites the taxonomy ID and the primary
              academic source.
            </p>
            <div
              style={{
                display: 'inline-flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: C.green,
                  color: C.white,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Audit a memo <ArrowRight size={14} />
              </Link>
              <Link
                href="/proof"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 10,
                  background: 'transparent',
                  color: C.white,
                  border: `1px solid ${C.slate600}`,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Browse the proof
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 12,
              color: C.slate500,
              textAlign: 'center',
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.04em',
            }}
          >
            Cite as: Decision Intel Bias Taxonomy, {new Date().getFullYear()}. [DI-B-XXX].
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .taxonomy-hero {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .taxonomy-filter-bar {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .taxonomy-filter-chips {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Hero constellation ────────────────────────────────────────────── */

function BiasConstellation({ entries }: { entries: BiasEntry[] }) {
  // Simple 5×4 grid of bias ID pills colored by difficulty. Animates
  // a subtle shimmer across the grid so the hero has motion without noise.
  // Counts derived from BIAS_EDUCATION (count-discipline rule) so when a
  // new bias lands the constellation header updates automatically.
  const difficultyCounts = entries.reduce(
    (acc, [, b]) => {
      acc[b.difficulty] = (acc[b.difficulty] ?? 0) + 1;
      return acc;
    },
    { easy: 0, moderate: 0, hard: 0 } as Record<Difficulty, number>
  );
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 20,
        padding: 22,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.03)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: C.green,
              marginBottom: 4,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {entries.length} biases · {difficultyCounts.easy}E / {difficultyCounts.moderate}M /{' '}
            {difficultyCounts.hard}H
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.slate900 }}>
            Every dot is a stable ID.
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
        }}
      >
        {entries.map(([key, bias], i) => {
          const tok = DIFFICULTY_TOKENS[bias.difficulty];
          return (
            <motion.a
              key={key}
              href={`#${bias.taxonomyId}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.02 * i }}
              title={`${bias.taxonomyId} · ${formatName(key)}`}
              style={{
                padding: '10px 6px',
                borderRadius: 10,
                background: tok.bg,
                border: `1px solid ${tok.border}`,
                color: tok.fg,
                fontSize: 10.5,
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.04em',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {bias.taxonomyId.replace('DI-B-', '')}
            </motion.a>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px dashed ${C.slate200}`,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: 11,
          color: C.slate500,
        }}
      >
        <LegendDot color={C.green} label="Easy to spot" />
        <LegendDot color={C.amber} label="Moderate" />
        <LegendDot color={C.red} label="Hard to spot" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: color,
          display: 'inline-block',
        }}
        aria-hidden
      />
      {label}
    </span>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderRadius: 14,
        padding: '18px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: C.greenSoft,
            border: `1px solid ${C.greenBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.green,
          }}
        >
          <Icon size={15} strokeWidth={2.2} />
        </div>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: C.slate400,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {label}
        </div>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: C.slate900,
          letterSpacing: '-0.01em',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: C.slate600, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

/* ─── Filter chip ───────────────────────────────────────────────────── */

function FilterChip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? C.slate900 : C.slate200}`,
        background: active ? C.slate900 : C.white,
        color: active ? C.white : C.slate700,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          background: dot,
          display: 'inline-block',
        }}
        aria-hidden
      />
      {label}
    </button>
  );
}

/* ─── Bias card ─────────────────────────────────────────────────────── */

function BiasCard({
  biasKey,
  bias,
  expanded,
  onToggle,
}: {
  biasKey: string;
  bias: BiasEducationContent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tok = DIFFICULTY_TOKENS[bias.difficulty];
  const doiHref = bias.academicReference.doi
    ? `https://doi.org/${bias.academicReference.doi}`
    : bias.academicReference.url;

  return (
    <div
      id={bias.taxonomyId}
      style={{
        background: C.white,
        border: `1px solid ${expanded ? C.greenBorder : C.slate200}`,
        borderRadius: 16,
        overflow: 'hidden',
        scrollMarginTop: 140,
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
        boxShadow: expanded
          ? '0 4px 12px rgba(15,23,42,0.06), 0 16px 32px rgba(15,23,42,0.05)'
          : '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: '100%',
          padding: '20px 20px 18px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontFamily: 'inherit',
          color: C.slate900,
        }}
      >
        {/* Top row: ID + difficulty */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
              color: C.green,
              background: C.greenSoft,
              border: `1px solid ${C.greenBorder}`,
              padding: '3px 8px',
              borderRadius: 6,
              letterSpacing: '0.04em',
            }}
          >
            {bias.taxonomyId}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 999,
              background: tok.bg,
              color: tok.fg,
              border: `1px solid ${tok.border}`,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: tok.dot,
                display: 'inline-block',
              }}
              aria-hidden
            />
            {tok.label}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {formatName(biasKey)}
        </div>

        {/* Short description */}
        <div style={{ fontSize: 13.5, color: C.slate600, lineHeight: 1.55 }}>
          {shortDescription(bias)}
        </div>

        {/* Case study chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: C.slate50,
            border: `1px solid ${C.slate200}`,
            borderRadius: 10,
            fontSize: 12,
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              color: C.slate400,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Case
          </span>
          <span style={{ color: C.slate900, fontWeight: 600 }}>
            {bias.realWorldExample.company || bias.realWorldExample.title}
          </span>
          {bias.realWorldExample.year && (
            <span
              style={{
                color: C.slate500,
                fontSize: 11,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {bias.realWorldExample.year}
            </span>
          )}
        </div>

        {/* Toggle affordance */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 4,
            borderTop: `1px dashed ${C.slate200}`,
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: C.green,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.04em',
            }}
          >
            {expanded ? 'Hide detail' : 'Read detail'}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              border: `1px solid ${C.slate200}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.slate500,
            }}
          >
            <ChevronDown size={13} strokeWidth={2.4} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Case detail */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: C.slate50,
                  border: `1px solid ${C.slate200}`,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: C.slate400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Case &middot; {bias.realWorldExample.title}
                </div>
                <div style={{ fontSize: 13.5, color: C.slate700, lineHeight: 1.6 }}>
                  {bias.realWorldExample.description}
                </div>
              </div>

              {/* Debiasing techniques */}
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: C.green,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 10,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Debiasing techniques
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {bias.debiasingTechniques.map(t => (
                    <li
                      key={t}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 13,
                        color: C.slate700,
                        lineHeight: 1.55,
                      }}
                    >
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          background: C.greenSoft,
                          border: `1px solid ${C.greenBorder}`,
                          color: C.green,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                        aria-hidden
                      >
                        <Lightbulb size={10} strokeWidth={2.4} />
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related biases */}
              {bias.relatedBiases.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: C.slate500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      marginBottom: 10,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    Related biases
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bias.relatedBiases.map(r => (
                      <a
                        key={r.key}
                        href={`#${BIAS_EDUCATION[r.key]?.taxonomyId ?? ''}`}
                        title={r.reason}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '5px 10px',
                          borderRadius: 999,
                          background: C.white,
                          border: `1px solid ${C.slate200}`,
                          color: C.slate700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        {formatName(r.key)}
                        <ArrowUpRight size={11} color={C.slate400} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Academic citation */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1px dashed ${C.slate200}`,
                  background: C.white,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: C.slate500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 6,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  Primary source
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: C.slate700,
                    lineHeight: 1.55,
                    fontStyle: 'italic',
                  }}
                >
                  {bias.academicReference.citation}
                </div>
                {doiHref && (
                  <a
                    href={doiHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 8,
                      fontSize: 12,
                      color: C.green,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    {bias.academicReference.doi ? 'View on DOI' : 'View source'}{' '}
                    <ArrowUpRight size={11} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Compound patterns surface (locked 2026-05-09, M&A cascade depth ship) ───
//
// The 13 first-class compound failure modes the toxic-combination engine
// fires on. Three of these are M&A workflow-native (locked 2026-05-09 P1)
// and surface alongside the original 10 cross-domain patterns.
// Mirrors NAMED_PATTERNS in src/lib/learning/toxic-combinations.ts.

interface CompoundPattern {
  label: string;
  category: 'cross-domain' | 'mna';
  primaryBiases: string;
  description: string;
  anchorCases?: string;
}

const COMPOUND_PATTERNS: CompoundPattern[] = [
  // M&A-specific patterns first — load-bearing for procurement readers
  {
    label: 'The Synergy Mirage',
    category: 'mna',
    primaryBiases: 'Overconfidence × Planning Fallacy',
    description:
      'Synergy claims without a NAMED operational mechanism, accountable executive, or 90-day milestone. The canonical M&A failure mode (70-90% of acquisitions miss projected synergies per McKinsey + KPMG).',
    anchorCases: 'AOL-Time Warner · HP-Autonomy · Microsoft-Nokia · GE-Alstom · WorldCom',
  },
  {
    label: 'The Conglomerate Fallacy',
    category: 'mna',
    primaryBiases: 'Illusion of Validity × Halo Effect',
    description:
      'Far-adjacency acquisition justified by target growth and brand halo, with no answer to Porter’s "why us as the best parent" thesis.',
    anchorCases:
      'AOL-Time Warner · Bed Bath & Beyond · Sears Holdings · Daimler-Chrysler · Microsoft-Nokia · Steinhoff · Carillion · GE financial-conglomerate · WorldCom',
  },
  {
    label: "The Winner's Curse",
    category: 'mna',
    primaryBiases: 'Anchoring × Overconfidence',
    description:
      'Auction-dynamic anchoring drives bids above intrinsic value; "strategic necessity" and "competitive process" language flag the deal-fever pattern.',
    anchorCases: 'WeWork S-1 · Quibi · HP-Autonomy · Yahoo-Tumblr · GE-Alstom',
  },
  // Cross-domain patterns
  {
    label: 'The Echo Chamber',
    category: 'cross-domain',
    primaryBiases: 'Confirmation × Groupthink',
    description:
      'Confirmation bias amplified by unchallenged consensus. Teams hear what they already believe.',
  },
  {
    label: 'The Sunk Ship',
    category: 'cross-domain',
    primaryBiases: 'Sunk Cost × Confirmation',
    description:
      'Past investment justifies continued commitment — the "we’re too deep to stop" pattern.',
  },
  {
    label: 'The Blind Sprint',
    category: 'cross-domain',
    primaryBiases: 'Overconfidence × Planning Fallacy',
    description: 'Overconfidence meets systematic underestimation of time and complexity.',
  },
  {
    label: 'The Yes Committee',
    category: 'cross-domain',
    primaryBiases: 'Groupthink × Authority',
    description:
      'Deference to authority suppresses dissent; decisions ratified rather than debated.',
  },
  {
    label: 'The Optimism Trap',
    category: 'cross-domain',
    primaryBiases: 'Anchoring × Overconfidence',
    description:
      'Favorable initial estimates become reference points; downside scenarios are discounted.',
  },
  {
    label: 'The Status Quo Lock',
    category: 'cross-domain',
    primaryBiases: 'Status Quo × Loss Aversion',
    description: 'The fear of loss from any change outweighs the documented cost of inaction.',
  },
  {
    label: 'The Recency Spiral',
    category: 'cross-domain',
    primaryBiases: 'Recency × Availability',
    description:
      'Vivid recent events distort base rates; the most-recent quarter dominates the model.',
  },
  {
    label: 'The Golden Child',
    category: 'cross-domain',
    primaryBiases: 'Halo × Confirmation',
    description:
      'A favored initiative receives uncritical support; scrutiny reserved for alternatives.',
  },
  {
    label: 'The Doubling Down',
    category: 'cross-domain',
    primaryBiases: 'Sunk Cost × Loss Aversion',
    description: 'Escalating commitment to a losing course to avoid realizing the loss.',
  },
  {
    label: 'The Deadline Panic',
    category: 'cross-domain',
    primaryBiases: 'Zeigarnik × Cognitive Misering',
    description: 'Time pressure collapses option-set search; closure is favoured over correctness.',
  },
];

function CompoundPatternCard({ pattern }: { pattern: CompoundPattern }) {
  const isMna = pattern.category === 'mna';
  const accent = isMna ? '#8B5CF6' : C.slate400;
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.slate200}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 12,
        padding: '18px 18px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: C.slate900,
            margin: 0,
            letterSpacing: '-0.01em',
            flex: 1,
          }}
        >
          {pattern.label}
        </h3>
        {isMna && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: accent,
              background: `${accent}15`,
              padding: '2px 7px',
              borderRadius: 999,
            }}
          >
            M&A
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.slate400,
          marginBottom: 10,
        }}
      >
        {pattern.primaryBiases}
      </div>
      <p
        style={{
          fontSize: 13,
          color: C.slate600,
          margin: 0,
          marginBottom: pattern.anchorCases ? 10 : 0,
          lineHeight: 1.55,
        }}
      >
        {pattern.description}
      </p>
      {pattern.anchorCases && (
        <div
          style={{
            fontSize: 11.5,
            color: C.slate500,
            paddingTop: 10,
            borderTop: `1px solid ${C.slate100}`,
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              fontWeight: 700,
              color: C.slate700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: 10,
            }}
          >
            Anchor cases ·{' '}
          </span>
          {pattern.anchorCases}
        </div>
      )}
    </div>
  );
}
