'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ExternalLink, ChevronRight } from 'lucide-react';
import {
  RESEARCH_LIBRARY,
  LIBRARY_CATEGORY_META,
  type LibraryEntry,
} from '@/lib/data/research-foundations';

type LibraryCategory = LibraryEntry['category'] | 'all';

export function ResearchLibrary() {
  const [activeCategory, setActiveCategory] = useState<LibraryCategory>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    activeCategory === 'all'
      ? RESEARCH_LIBRARY
      : RESEARCH_LIBRARY.filter(e => e.category === activeCategory);

  return (
    <section
      style={{
        padding: 18,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(139, 92, 246, 0.18)',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BookOpen size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Research-to-action library
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {RESEARCH_LIBRARY.length} podcasts and long-form essays mapped to product + startup
            actions.
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '5px 12px',
            fontSize: 11,
            fontWeight: 600,
            color: activeCategory === 'all' ? '#fff' : 'var(--text-primary)',
            background: activeCategory === 'all' ? '#8B5CF6' : 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full, 9999px)',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {(Object.keys(LIBRARY_CATEGORY_META) as LibraryEntry['category'][]).map(cat => {
          const meta = LIBRARY_CATEGORY_META[cat];
          const isActive = activeCategory === cat;
          const count = RESEARCH_LIBRARY.filter(e => e.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? '#fff' : 'var(--text-primary)',
                background: isActive ? meta.color : 'var(--bg-card)',
                border: `1px solid ${isActive ? meta.color : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-full, 9999px)',
                cursor: 'pointer',
              }}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Library cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(entry => {
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              style={{
                padding: 14,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderLeft: `3px solid ${entry.color}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {entry.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {entry.source} · {entry.type}
                  </div>
                </div>
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: entry.color,
                    background: 'transparent',
                    border: `1px solid ${entry.color}33`,
                    borderRadius: 'var(--radius-sm, 4px)',
                    textDecoration: 'none',
                    flexShrink: 0,
                  }}
                >
                  Open <ExternalLink size={10} />
                </a>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  lineHeight: 1.55,
                  margin: '0 0 10px',
                }}
              >
                {entry.insight}
              </p>

              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: entry.color,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight
                  size={12}
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s',
                  }}
                />
                {isExpanded ? 'Hide details' : 'Product · startup · actions'}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ paddingTop: 10 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <SubCard label="For the product" color="#16A34A" body={entry.product} />
                        <SubCard label="For the startup" color="#22C55E" body={entry.startup} />
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: entry.color,
                          marginBottom: 4,
                        }}
                      >
                        Actions
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          padding: 0,
                          listStyle: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        {entry.actions.map(a => (
                          <li
                            key={a}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 6,
                              fontSize: 11,
                              color: 'var(--text-primary)',
                              lineHeight: 1.5,
                            }}
                          >
                            <ChevronRight
                              size={10}
                              style={{ color: entry.color, flexShrink: 0, marginTop: 3 }}
                            />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SubCard({ label, color, body }: { label: string; color: string; body: string }) {
  return (
    <div
      style={{
        padding: 8,
        background: 'var(--bg-elevated, var(--bg-secondary))',
        border: `1px solid ${color}33`,
        borderRadius: 'var(--radius-sm, 4px)',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}
