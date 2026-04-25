'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { HeroPanel } from '@/components/founder-hub/sankore/HeroPanel';
import { HoleClosureMatrix } from '@/components/founder-hub/sankore/HoleClosureMatrix';
import { DalioConstellation } from '@/components/founder-hub/sankore/DalioConstellation';
import { RegulatoryBridge } from '@/components/founder-hub/sankore/RegulatoryBridge';
import { CaseLibraryGeography } from '@/components/founder-hub/sankore/CaseLibraryGeography';
import { FivePillarsMap } from '@/components/founder-hub/sankore/FivePillarsMap';
import { CapabilitySurfaces } from '@/components/founder-hub/sankore/CapabilitySurfaces';
import { WalkthroughScript } from '@/components/founder-hub/sankore/WalkthroughScript';
import { HonestGaps } from '@/components/founder-hub/sankore/HonestGaps';

const FOUNDER_PASS = process.env.NEXT_PUBLIC_FOUNDER_HUB_PASS || '';
const SESSION_UNLOCK_KEY = 'di-founder-hub-unlocked';

// Lazy initial-state reader — runs once on first client render, avoids the
// react-hooks/set-state-in-effect anti-pattern. SSR returns false; the
// initial client paint reads sessionStorage and unlocks if previously set.
function readInitialUnlock(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_UNLOCK_KEY) === 'true';
}

export function SankoreBriefClient() {
  const [unlocked, setUnlocked] = useState<boolean>(readInitialUnlock);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState(false);

  const handleUnlock = () => {
    if (!FOUNDER_PASS) {
      setPassError(true);
      return;
    }
    if (passInput === FOUNDER_PASS) {
      setUnlocked(true);
      sessionStorage.setItem(SESSION_UNLOCK_KEY, 'true');
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  if (!unlocked) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-lg)',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            textAlign: 'center',
          }}
        >
          <Lock size={28} style={{ color: 'var(--accent-primary)', margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>
            Sankore capability brief
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
            Founder-only reference page. Same passcode as the Founder Hub.
          </p>
          <input
            type="password"
            value={passInput}
            onChange={e => setPassInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleUnlock();
            }}
            placeholder="Founder hub passcode"
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 14,
              marginBottom: 12,
            }}
          />
          {passError && (
            <div style={{ fontSize: 12, color: 'var(--severity-high)', marginBottom: 12 }}>
              {!FOUNDER_PASS
                ? 'NEXT_PUBLIC_FOUNDER_HUB_PASS not set — the brief cannot unlock until the env is configured.'
                : 'Incorrect passcode.'}
            </div>
          )}
          <button
            onClick={handleUnlock}
            disabled={!passInput}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 700,
              cursor: passInput ? 'pointer' : 'not-allowed',
              opacity: passInput ? 1 : 0.5,
            }}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1180,
        margin: '0 auto',
        padding: 'var(--spacing-lg)',
      }}
    >
      <Link
        href="/dashboard/founder-hub?tab=design-partners"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--text-muted)',
          textDecoration: 'none',
          marginBottom: 16,
        }}
      >
        <ArrowLeft size={12} /> Back to design partners
      </Link>

      <HeroPanel />
      <HoleClosureMatrix />
      <DalioConstellation />
      <RegulatoryBridge />
      <CaseLibraryGeography />
      <FivePillarsMap />
      <CapabilitySurfaces />
      <WalkthroughScript />
      <HonestGaps />

      {/* Footer note */}
      <div
        style={{
          marginTop: 20,
          padding: '14px 16px',
          background: 'var(--bg-elevated)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>How this brief stays accurate: </strong>
        Every panel reads from{' '}
        <code style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          src/components/founder-hub/sankore/sankore-brief-data.ts
        </code>
        . When a capability ships (or scope changes), update the matching entry in that file — every
        visualisation reflects it on the next deploy. Status enums:{' '}
        <span style={{ color: '#16A34A' }}>shipped</span> ·{' '}
        <span style={{ color: '#2563EB' }}>scaffolded</span> ·{' '}
        <span style={{ color: '#D97706' }}>scheduled</span> ·{' '}
        <span style={{ color: '#64748B' }}>deferred</span>.
      </div>
    </div>
  );
}
