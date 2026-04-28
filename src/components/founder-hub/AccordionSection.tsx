'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  /**
   * URL-friendly slug. When `window.location.hash === '#${sectionId}'`, the
   * section auto-opens and scrolls into view with a brief flash. Used by the
   * Founder Hub global search to deep-link straight into the matching
   * accordion section instead of dumping the user at the top of a tab with
   * three collapsed panels. (B1 lock 2026-04-28.)
   */
  sectionId?: string;
  children: React.ReactNode;
}

export function AccordionSection({
  title,
  subtitle,
  defaultOpen = true,
  sectionId,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [flashing, setFlashing] = useState(false);
  const wrapRef = useRef<HTMLElement>(null);

  // Hash deep-link: open + scroll + flash when the URL hash matches.
  useEffect(() => {
    if (!sectionId || typeof window === 'undefined') return;

    const checkHash = () => {
      if (window.location.hash === `#${sectionId}`) {
        setOpen(true);
        // Defer scroll to next tick so the body has rendered when we measure.
        requestAnimationFrame(() => {
          wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setFlashing(true);
          window.setTimeout(() => setFlashing(false), 1400);
        });
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [sectionId]);

  return (
    <section
      ref={wrapRef}
      id={sectionId}
      style={{
        ...wrap,
        ...(flashing
          ? {
              boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent-primary) 40%, transparent)',
              transition: 'box-shadow 0.6s ease',
            }
          : { transition: 'box-shadow 0.6s ease' }),
      }}
    >
      <button type="button" onClick={() => setOpen(v => !v)} style={header} aria-expanded={open}>
        <div>
          <div style={titleStyle}>{title}</div>
          {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
        </div>
        <ChevronDown
          size={18}
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>
      {open && <div style={body}>{children}</div>}
    </section>
  );
}

const wrap: React.CSSProperties = {
  marginBottom: 20,
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-card)',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  background: 'var(--bg-elevated)',
  border: 'none',
  borderBottom: '1px solid var(--border-color)',
  cursor: 'pointer',
  textAlign: 'left',
};

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  marginTop: 2,
};

const body: React.CSSProperties = {
  padding: 20,
};
