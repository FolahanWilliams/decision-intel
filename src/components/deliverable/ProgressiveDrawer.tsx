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
 * Single-click open; ESC + click-outside close. This is a hand-rolled
 * right-edge slide-in (the shadcn Dialog is a centered modal — the wrong
 * shape here) that carries its own modal a11y: focus moves into the drawer
 * on open, returns to the trigger on close, Tab is trapped inside, and body
 * scroll is locked. intentional-modal-pattern
 */

'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

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

  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Modal focus management: move focus into the drawer on open + restore it to
  // the trigger on close — keyboard/screen-reader users otherwise stay stranded
  // behind the backdrop. Deferred a tick so the panel is mounted before focus.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => closeRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Trap Tab within the drawer while open.
  const onTrapKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={onTrapKeyDown}
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
            ref={closeRef}
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
