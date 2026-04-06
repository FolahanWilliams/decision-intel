'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, Sparkles, BrainCircuit, Video } from 'lucide-react';

const OPTIONS = [
  {
    key: 'analyze',
    icon: Upload,
    title: 'Analyze a Document',
    description: 'Upload a document for AI-powered analysis',
    href: '/dashboard',
  },
  {
    key: 'copilot',
    icon: Sparkles,
    title: 'Think Through a Decision',
    description: 'Get help from your AI advisory team',
    href: '/dashboard/ask',
  },
  {
    key: 'audit',
    icon: BrainCircuit,
    title: 'Audit a Decision',
    description: 'Submit a human decision for cognitive auditing',
    href: '/dashboard/cognitive-audits/submit',
  },
  {
    key: 'meeting',
    icon: Video,
    title: 'Upload a Meeting',
    description: 'Analyze a meeting recording or transcript',
    href: '/dashboard/meetings',
  },
];

export function NewDecisionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    window.addEventListener('open-new-decision-modal', handleOpen);
    return () => window.removeEventListener('open-new-decision-modal', handleOpen);
  }, [handleOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--overlay-backdrop)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="New Decision"
        onClick={e => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 520,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
            What would you like to do?
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Options Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            padding: '20px',
          }}
        >
          {OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  handleClose();
                  router.push(opt.href);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '20px 16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: 'rgba(249, 115, 22, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{opt.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
