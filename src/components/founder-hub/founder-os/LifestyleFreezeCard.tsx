'use client';

/**
 * LifestyleFreezeCard — Sharran's "freeze your lifestyle for 14 years
 * while net worth grows 50×" principle, mapped onto Folahan's
 * structurally-pre-frozen 16-yo state.
 *
 * Item locked 2026-05-07 from the Q2 master KB synthesis. The KB
 * confirmed APPLICABLE-NOW status — but the framing the KB generated
 * was INVESTOR-NARRATIVE WEAPONIZATION, not personal-budget tracking.
 * Folahan is already structurally frozen (lives with parents, no
 * personal burn); the discipline is keeping it frozen post-seed +
 * post-Series-A + post-strategic-acquisition.
 *
 * Card structure:
 *   1. The 4 beats from sharran-principles.ts LIFESTYLE_FREEZE_BEATS:
 *      where Folahan starts → the commitment → the investor-narrative
 *      anchor → what this preserves.
 *   2. A copy-to-clipboard "investor talking point" template — the
 *      paragraph Folahan can paste into every pre-seed term-sheet
 *      conversation.
 *
 * Mounted in FounderOSTab between InteractiveSfcMatrix and
 * BuildInPublicSection — both adjacent surfaces are personal-OS
 * artifacts, not strategy artifacts.
 */

import { useState } from 'react';
import { Snowflake, Copy, Check, type LucideIcon } from 'lucide-react';
import { LIFESTYLE_FREEZE_BEATS } from '../path-to-100m/data/sharran-principles';

const BEAT_ICONS: Record<string, LucideIcon> = {
  current_state: Snowflake,
  commitment: Snowflake,
  investor_anchor: Snowflake,
  optionality: Snowflake,
};

const INVESTOR_TALKING_POINT = `I have committed to a frozen lifestyle through Series A. My monthly personal burn today is approximately £0 (16-year-old, lives with parents). My commitment: monthly burn stays within 1.2× pre-seed levels through the Series A round, even as net worth grows. Sharran Srivatsaa kept his family budget flat for 14 years through 50× net worth growth. I am applying the same discipline — burn-rate risk is structurally low because there is no pressure to take a market salary, and the optionality compounds at every income tier through the strategic acquisition target.`;

export function LifestyleFreezeCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INVESTOR_TALKING_POINT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API blocked — silent fallback (the talking point
      // stays visible in the textarea for manual copy).
    }
  };

  return (
    <section
      aria-labelledby="lifestyle-freeze-heading"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderLeft: '3px solid var(--info)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '18px 20px',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
          color: 'var(--info)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        <Snowflake size={12} strokeWidth={2.5} aria-hidden />
        Sharran principle 5 · lifestyle freeze
      </div>
      <h3
        id="lifestyle-freeze-heading"
        style={{
          margin: 0,
          fontSize: 'var(--fs-md, 18px)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
          marginBottom: 6,
        }}
      >
        Frozen at 16. Stay frozen through Series A.
      </h3>
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          maxWidth: 760,
        }}
      >
        Sharran kept his family budget flat for 14 years while net worth grew 50×. Folahan is
        already structurally frozen (no personal burn). The discipline isn&apos;t budgeting —
        it&apos;s keeping the freeze in place as personal income grows post-seed → post-Series-A →
        post-exit, AND weaponizing the commitment in pre-seed conversations.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {LIFESTYLE_FREEZE_BEATS.map(beat => {
          const Icon = BEAT_ICONS[beat.id] ?? Snowflake;
          return (
            <div
              key={beat.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--info)',
                }}
              >
                <Icon size={11} strokeWidth={2.5} aria-hidden />
                {beat.label}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: 'var(--text-primary)',
                }}
              >
                {beat.body}
              </div>
            </div>
          );
        })}
      </div>

      {/* Investor talking-point — copy-paste paragraph */}
      <div
        style={{
          background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
          borderRadius: 'var(--radius-sm, 6px)',
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            Pre-seed talking point · paste into every term-sheet conversation
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy talking point"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: copied ? 'var(--success)' : 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm, 6px)',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {copied ? (
              <>
                <Check size={12} strokeWidth={2.5} /> Copied
              </>
            ) : (
              <>
                <Copy size={12} strokeWidth={2.25} /> Copy
              </>
            )}
          </button>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            fontStyle: 'italic',
          }}
        >
          &ldquo;{INVESTOR_TALKING_POINT}&rdquo;
        </p>
      </div>
    </section>
  );
}
