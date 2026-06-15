'use client';

/**
 * MilestoneReveal — the moment that waits at a threshold (day 14, day 66).
 *
 * Surfaced by the tab ONLY when `milestoneToReveal(...)` returns one — i.e. the
 * first time the tree's day count crosses the ground, never before (no
 * countdown, nothing to count toward — the founder's two constraints, held
 * together). It is a celebration, not friction: shown once, then dismissed for
 * good. The day-66 `threshold` reveal frames the close as a sending and offers
 * the capstone synthesis ("read your whole arc"); the day-14 `ground` reveal
 * marks new ground without ever framing it as a streak to protect.
 *
 * Reduced-motion-safe; platform tokens + the tab's REALITY_GOLD accent.
 */

import { X, Telescope } from 'lucide-react';
import type { ProtocolMilestone } from './content';
import { REALITY_GOLD } from './RealityTree';

export function MilestoneReveal({
  milestone,
  onDismiss,
  onCapstone,
}: {
  milestone: ProtocolMilestone;
  onDismiss: () => void;
  onCapstone?: () => void;
}) {
  const isThreshold = milestone.kind === 'threshold';

  return (
    <div
      className="reality-milestone-reveal"
      role="status"
      style={{
        position: 'relative',
        marginBottom: 18,
        padding: isThreshold ? '26px 22px' : '22px',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid color-mix(in srgb, ${REALITY_GOLD} 55%, var(--border-color))`,
        background: isThreshold
          ? `radial-gradient(120% 140% at 50% 0%, color-mix(in srgb, ${REALITY_GOLD} 16%, var(--bg-card)) 0%, var(--bg-card) 70%)`
          : `color-mix(in srgb, ${REALITY_GOLD} 7%, var(--bg-card))`,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${REALITY_GOLD} 18%, transparent), 0 10px 30px -16px color-mix(in srgb, ${REALITY_GOLD} 45%, transparent)`,
        textAlign: 'center',
      }}
    >
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 4,
          lineHeight: 0,
        }}
      >
        <X size={16} />
      </button>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: REALITY_GOLD,
        }}
      >
        {milestone.eyebrow}
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: isThreshold ? 24 : 21,
          lineHeight: 1.3,
          color: 'var(--text-primary)',
          marginTop: 10,
        }}
      >
        {milestone.title}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 560,
          margin: '14px auto 0',
        }}
      >
        {milestone.lines.map((line, i) => (
          <p
            key={i}
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
            }}
          >
            {line}
          </p>
        ))}
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--text-primary)',
          maxWidth: 560,
          margin: '18px auto 0',
        }}
      >
        &ldquo;{milestone.verse.text}&rdquo;
        <span
          style={{
            display: 'block',
            fontStyle: 'normal',
            fontSize: 12.5,
            color: REALITY_GOLD,
            letterSpacing: 0.4,
            marginTop: 8,
          }}
        >
          {milestone.verse.ref}
        </span>
      </div>

      {isThreshold && onCapstone && (
        <button
          onClick={onCapstone}
          style={{
            marginTop: 20,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '11px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            background: 'var(--accent-primary)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Telescope size={15} />
          Read your 66-day arc
        </button>
      )}

      <style>{`
        .reality-milestone-reveal {
          animation: reality-milestone-rise 600ms ease-out both;
        }
        @keyframes reality-milestone-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reality-milestone-reveal { animation: none; }
        }
      `}</style>
    </div>
  );
}
