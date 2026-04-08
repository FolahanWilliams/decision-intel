'use client';

import { useState, useEffect } from 'react';

interface Section {
  id: string;
  label: string;
}

interface SectionMiniNavProps {
  sections: Section[];
}

export function SectionMiniNav({ sections }: SectionMiniNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Page sections"
      style={{
        position: 'fixed',
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
      className="hidden lg:flex"
    >
      {sections.map(section => {
        const isActive = activeId === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={e => {
              e.preventDefault();
              document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            title={section.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 'var(--radius-full, 9999px)',
              fontSize: 11,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent-primary, #16a34a)' : 'var(--text-muted, #94a3b8)',
              background: isActive ? 'rgba(22,163,74,0.08)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isActive
                  ? 'var(--accent-primary, #16a34a)'
                  : 'var(--border-color, rgba(0,0,0,0.2))',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            />
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
