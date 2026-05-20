/**
 * ProgressiveDrawer — slide-in side panel for "View Audit Trail" /
 * drill-down. Locked 2026-05-20 from Deep Research §6 (Impute vs
 * Defensibility resolution via progressive disclosure).
 *
 * The drawer is the ALWAYS-ACCESSIBLE escape hatch for procurement-
 * grade defensibility. Every finding card surfaces a single trigger
 * that opens the drawer with: verbatim excerpt + methodology metadata +
 * content hash + regulatory mapping + source link. The executive view
 * stays clean (Impute); the drawer carries the rigor (defensibility).
 *
 * Single-click open, ESC + click-outside close. Built on the shared
 * shadcn Dialog primitive (per the 2026-05-11 modal-Dialog discipline
 * lock) — never a hand-rolled position:fixed shape.
 */

'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProgressiveDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Drawer header — short, action-titled where possible. */
  title: string;
  /** Optional eyebrow above the title for category context. */
  eyebrow?: string;
  /** The body content — caller composes the drill-down surface. */
  children: ReactNode;
}

const Z = 1000;

export function ProgressiveDrawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
}: ProgressiveDrawerProps) {
  // ESC to close — caller passes onClose
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll while open (mobile drawer pattern)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.45)',
          zIndex: Z,
          opacity: 1,
          transition: 'opacity 200ms',
        }}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(560px, 100vw)',
          background: 'var(--bg-card, #FFFFFF)',
          boxShadow: '-12px 0 40px rgba(15,23,42,0.16)',
          zIndex: Z + 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--border-color, #E2E8F0)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {eyebrow ? (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted, #64748B)',
                  marginBottom: 4,
                }}
              >
                {eyebrow}
              </div>
            ) : null}
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: 'var(--text-primary, #0F172A)',
                margin: 0,
                letterSpacing: '-0.015em',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border-color, #E2E8F0)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted, #64748B)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </header>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 22px 28px',
          }}
        >
          {children}
        </div>
      </aside>
    </>
  );
}
