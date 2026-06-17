'use client';

/**
 * "What can I upload — and what does each catch?" panel (locked 2026-06-17).
 *
 * The always-available answer to the two questions that stall a confused
 * user on the upload zone: "is my document welcome here?" and "why would
 * I give it to this?" Unlike FirstRunInlineWalkthrough (session-gated +
 * dismissible-and-lost), this is a persistent collapsible the user can
 * re-open any time; the open/closed choice persists in localStorage so
 * it is never gone for good.
 *
 * Default collapsed so the clean upload zone stays clean for users who
 * already know what they are doing — the trigger copy does the work of
 * pulling in the confused. All copy reads from the upload-guidance SSOT.
 */

import { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle, FileText, Gauge, CheckCircle2 } from 'lucide-react';
import type { SampleRole } from '@/lib/data/sample-bundles';
import { ROLE_LABEL } from '@/lib/data/sample-bundles';
import { UPLOAD_GUIDANCE_BY_ROLE, UPLOAD_UNIVERSAL } from '@/lib/data/upload-guidance';

const STORAGE_KEY = 'di-upload-guidance-open-v1';

interface Props {
  /** Drives the role-matched "documents you usually bring" list. */
  role: SampleRole | null;
  /**
   * Initial open state when the user has no stored preference yet — pass
   * true for the true first-run (zero-doc) case so a confused new user
   * sees the guidance without having to find the toggle. An explicit
   * user toggle (stored in localStorage) always wins over this.
   */
  defaultOpen?: boolean;
  /**
   * Optional CTA to surface the role-matched sample library — when set,
   * a "Browse role-matched samples" link renders at the bottom.
   */
  onTrySample?: () => void;
}

export function UploadGuidancePanel({ role, defaultOpen = false, onTrySample }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Defer the localStorage read out of the effect's synchronous body so
    // react-hooks/set-state-in-effect doesn't flag a cascading-render risk
    // (same idiom as FirstRunInlineWalkthrough). An explicit stored
    // preference wins over defaultOpen; absence keeps the defaultOpen
    // initial.
    const t = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'true') setOpen(true);
        else if (stored === 'false') setOpen(false);
      } catch {
        // localStorage unavailable (private mode) — keep the defaultOpen initial.
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Non-fatal — the toggle still works for this session.
      }
      return next;
    });
  };

  const effectiveRole: SampleRole = role ?? 'other';
  const guidance = UPLOAD_GUIDANCE_BY_ROLE[effectiveRole];
  const roleLabel = ROLE_LABEL[effectiveRole];

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '18px auto 0',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--text-primary)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
          }}
        >
          <HelpCircle size={16} />
        </span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>
          Not sure what to upload, or why it matters?
        </span>
        <span
          style={{
            display: 'inline-flex',
            transition: 'transform 0.18s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)',
          }}
        >
          <ChevronDown size={16} />
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: '4px 16px 18px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* What counts — resolves "is my document welcome?" */}
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
            }}
          >
            {UPLOAD_UNIVERSAL.whatCounts}
          </p>

          {/* Role-matched "documents you usually bring". */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: 4,
              }}
            >
              <FileText size={12} /> What a {roleLabel} usually brings
            </div>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 12.5,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              {guidance.intro}
            </p>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {guidance.brings.map(doc => (
                <li
                  key={doc.label}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {doc.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginTop: 2,
                    }}
                  >
                    {doc.catch}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* What makes a strong upload. */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-primary)',
                marginBottom: 8,
              }}
            >
              <CheckCircle2 size={12} /> What makes a strong upload
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              {UPLOAD_UNIVERSAL.strongUpload.map(tip => (
                <li
                  key={tip}
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}>
                    <CheckCircle2 size={13} />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* DQI calibration — stops a first 52 reading as "F". */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              background: 'rgba(22, 163, 74, 0.06)',
              border: '1px solid rgba(22, 163, 74, 0.18)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 1 }}>
              <Gauge size={15} />
            </span>
            <p
              style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}
            >
              {UPLOAD_UNIVERSAL.calibration}
            </p>
          </div>

          {onTrySample && (
            <button
              type="button"
              onClick={onTrySample}
              style={{
                alignSelf: 'flex-start',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--accent-primary)',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              Prefer to see one first? Load a role-matched sample →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
