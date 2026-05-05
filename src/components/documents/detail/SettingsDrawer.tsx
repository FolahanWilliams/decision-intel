/**
 * SettingsDrawer — corner gear, low-key.
 *
 * Slides in from the right when the user clicks the gear icon in the
 * top-right of the audit pane. Contains the methodology / lineage /
 * share / danger items that procurement reviewers occasionally need but
 * the daily user does not.
 *
 * Sections:
 *   - Methodology — DQI weights, version, judge variance summary
 *   - Reproducibility — model lineage, prompt fingerprint, audit hash
 *   - Sharing & Export — beyond-DPR exports (board PDF, JSON)
 *   - Danger zone — delete document
 *
 * Architecture: drawer is presentation-only. Parent owns open/close
 * state and supplies child slots so the existing components (ShareModal,
 * delete handler, etc.) keep their wiring without re-implementation.
 */

'use client';

import { type ReactNode, useEffect } from 'react';
import { X, BarChart3, Cpu, Share2, Trash2 } from 'lucide-react';

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Methodology slot — DQI weights, version, judge variance summary. */
  methodologySlot?: ReactNode;
  /** Reproducibility slot — model lineage, prompt fingerprint. */
  reproducibilitySlot?: ReactNode;
  /** Sharing slot — share button / link generator. */
  sharingSlot?: ReactNode;
  /** Danger zone slot — delete document. */
  dangerSlot?: ReactNode;
}

export function SettingsDrawer(props: SettingsDrawerProps) {
  const { open, onClose, methodologySlot, reproducibilitySlot, sharingSlot, dangerSlot } =
    props;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.32)',
          zIndex: 90,
          backdropFilter: 'blur(2px)',
          animation: 'dpr-drawer-fade 0.18s ease',
        }}
      />
      <aside
        role="dialog"
        aria-label="Document settings"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(440px, 92vw)',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.08)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          animation: 'dpr-drawer-slide 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.005em',
              fontFamily: '"Source Serif 4", "Source Serif Pro", Georgia, serif',
            }}
          >
            Document settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              borderRadius: 4,
              transition: 'color 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={16} />
          </button>
        </header>

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px 24px',
            display: 'grid',
            gap: 22,
          }}
        >
          {methodologySlot && (
            <DrawerSection
              icon={<BarChart3 size={14} />}
              title="Methodology"
              hint="DQI weights, version, judge variance — the procurement-grade lineage data that backs the score."
            >
              {methodologySlot}
            </DrawerSection>
          )}
          {reproducibilitySlot && (
            <DrawerSection
              icon={<Cpu size={14} />}
              title="Reproducibility"
              hint="Model lineage and prompt fingerprint at audit time. Exposes the same data the DPR carries — useful for vendor-risk reviewers."
            >
              {reproducibilitySlot}
            </DrawerSection>
          )}
          {sharingSlot && (
            <DrawerSection
              icon={<Share2 size={14} />}
              title="Sharing & export"
              hint="Beyond-DPR exports: board-ready PDF, JSON, audit-log hash, share-link generator."
            >
              {sharingSlot}
            </DrawerSection>
          )}
          {dangerSlot && (
            <DrawerSection
              icon={<Trash2 size={14} />}
              title="Danger zone"
              hint="Irreversible actions. Deleting a document wipes the analysis but preserves the audit-log trail."
              tone="critical"
            >
              {dangerSlot}
            </DrawerSection>
          )}
        </div>
      </aside>
      <style jsx global>{`
        @keyframes dpr-drawer-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes dpr-drawer-slide {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

interface DrawerSectionProps {
  icon: ReactNode;
  title: string;
  hint?: string;
  tone?: 'default' | 'critical';
  children: ReactNode;
}

function DrawerSection({ icon, title, hint, tone = 'default', children }: DrawerSectionProps) {
  const accent = tone === 'critical' ? 'var(--severity-critical)' : 'var(--text-muted)';
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: accent, display: 'inline-flex' }}>{icon}</span>
        <h3
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          {title}
        </h3>
        <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
      </header>
      {hint && (
        <p
          style={{
            margin: 0,
            fontSize: 11.5,
            lineHeight: 1.55,
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}
        >
          {hint}
        </p>
      )}
      <div>{children}</div>
    </section>
  );
}
