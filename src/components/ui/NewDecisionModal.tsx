'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Bot, BrainCircuit, Layers } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const OPTIONS = [
  {
    key: 'frame',
    icon: Layers,
    title: 'Frame a new decision',
    description: 'Investment, acquisition, or strategic — start the container.',
    href: '/dashboard/decisions/new',
  },
  {
    key: 'analyze',
    icon: Upload,
    title: 'Analyze a document',
    description: 'Upload a strategic memo for a full reasoning audit.',
    href: '/dashboard',
  },
  {
    key: 'copilot',
    icon: Bot,
    title: 'Think through a decision',
    description: 'Open the AI Copilot to pressure-test reasoning before commit.',
    href: '/dashboard/ask',
  },
  {
    key: 'audit',
    icon: BrainCircuit,
    title: 'Audit a past decision',
    description: 'Submit a human decision for cognitive auditing.',
    href: '/dashboard/cognitive-audits/submit',
  },
];

/**
 * NewDecisionModal — routes the user to one of four create surfaces.
 * Migrated to the shadcn Dialog primitive 2026-05-11 so focus trap,
 * ESC handling, click-outside dismiss, and mobile Safari behavior come
 * for free.
 */
export function NewDecisionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleOpen = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    window.addEventListener('open-new-decision-modal', handleOpen);
    return () => window.removeEventListener('open-new-decision-modal', handleOpen);
  }, [handleOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="!max-w-[520px]"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 0,
          gap: 0,
          color: 'var(--text-primary)',
        }}
      >
        <DialogDescription className="sr-only">
          Pick what you want to do next: frame a decision, analyze a document, talk to the AI
          Copilot, or audit a past decision.
        </DialogDescription>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <DialogTitle
            className="!font-sans"
            style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}
          >
            What would you like to do?
          </DialogTitle>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            padding: 20,
          }}
        >
          {OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(opt.href);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '20px 16px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
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
                    borderRadius: 12,
                    background: 'rgba(22, 163, 74, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
