'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccordionSection({ title, subtitle, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section style={wrap}>
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
