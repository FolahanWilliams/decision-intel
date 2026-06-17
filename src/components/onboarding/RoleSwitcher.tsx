'use client';

/**
 * Always-visible role indicator + switcher (locked 2026-06-17).
 *
 * The onboarding role drives every persona-aware surface (dashboard
 * headline/subtitle, the upload-guidance panel, sample bundles, empty
 * states) — yet it was invisible and uneditable, so a mis-tagged user
 * (a CSO captured as M&A) saw the wrong headline + "Synergy Mirage"
 * jargon and bailed, with no way to correct it. This surfaces the role
 * and lets the user switch tracks in one click; the change persists
 * (PATCH /api/onboarding) and re-targets the whole dashboard in the same
 * tick via the useOnboardingRole store.
 *
 * Deliberately low-clutter: a single muted line under the page subtitle.
 */

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useOnboardingRole, setOnboardingRole } from '@/hooks/useOnboardingRole';
import { ROLE_LABEL } from '@/lib/data/sample-bundles';
import type { EmptyStateRole } from '@/lib/onboarding/role-empty-states';

const ROLES: EmptyStateRole[] = ['cso', 'ma', 'bizops', 'pe_vc', 'other'];

export function RoleSwitcher() {
  const role = useOnboardingRole();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', marginTop: 8, fontSize: 'var(--fs-2xs)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--text-muted)',
        }}
      >
        {role ? (
          <span>
            Set up as <strong style={{ color: 'var(--text-secondary)' }}>{ROLE_LABEL[role]}</strong>
          </span>
        ) : (
          <span>Pick your track for tailored guidance</span>
        )}
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
          {role ? 'switch' : 'choose'}
        </span>
        <ChevronDown
          size={12}
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <>
          {/* click-away */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            aria-hidden
          />
          <div
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 41,
              minWidth: 200,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {ROLES.map(r => {
              const active = r === role;
              return (
                <button
                  key={r}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    if (!active) setOnboardingRole(r);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    width: '100%',
                    padding: '8px 10px',
                    background: active ? 'rgba(22,163,74,0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 'var(--fs-xs)',
                    color: active ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontWeight: active ? 700 : 500,
                  }}
                  onMouseEnter={e => {
                    if (!active) e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {ROLE_LABEL[r]}
                  {active && <Check size={13} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
