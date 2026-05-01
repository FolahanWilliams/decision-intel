'use client';

/**
 * NotFoundContent — shared 404 surface for both /not-found.tsx routes
 * (root + platform). Replaces the generic "Page not found" placeholder
 * with an on-brand "decision dead-end" frame: the SVG viz shows five
 * decision branches from a center point — four lead to real
 * destinations (Dashboard, Decision Graph, Documents, Founder Hub),
 * the fifth fades into nothing with a pulsing dot representing the
 * page that doesn't exist.
 *
 * Locked 2026-05-01. The metaphor is intentional: Decision Intel is
 * about reasoning paths and outcomes; a 404 is the canonical "this
 * decision didn't lead anywhere" moment, and the page leans into that
 * rather than apologizing for the URL break. Confident copy, calm
 * tone, branded green accent. Respects prefers-reduced-motion.
 *
 * The SVG renders 280×280 viewBox-locked so it scales cleanly. Each
 * live branch ends in a clickable label that's a real navigation
 * link (the SVG IS the navigation, not just decoration). The dead-end
 * branch animates a soft pulse on its terminal dot — the "you are
 * here" mark.
 */

import Link from 'next/link';
import { useReducedMotion, motion } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, Network, FileText, Compass } from 'lucide-react';

interface DecisionBranch {
  id: string;
  href: string;
  label: string;
  /** Angle in degrees from the center point. 0 = right, 90 = down, 180 = left, 270 = up. */
  angle: number;
  /** lucide-react icon component. */
  Icon: typeof LayoutDashboard;
}

const LIVE_BRANCHES: DecisionBranch[] = [
  {
    id: 'dashboard',
    href: '/dashboard',
    label: 'Dashboard',
    angle: 220,
    Icon: LayoutDashboard,
  },
  {
    id: 'decision-graph',
    href: '/dashboard/decision-graph',
    label: 'Decision Graph',
    angle: 270,
    Icon: Network,
  },
  {
    id: 'documents',
    href: '/dashboard',
    label: 'Documents',
    angle: 320,
    Icon: FileText,
  },
  {
    id: 'founder-hub',
    href: '/dashboard/founder-hub',
    label: 'Founder Hub',
    angle: 90,
    Icon: Compass,
  },
];

const DEAD_END_ANGLE = 30; // up-and-to-the-right; the path the user took

const CENTER = { x: 140, y: 140 };
const BRANCH_LENGTH = 95;
const TERMINAL_R = 9;

function polarToXY(angleDeg: number, length: number): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER.x + Math.cos(angleRad) * length,
    y: CENTER.y + Math.sin(angleRad) * length,
  };
}

interface NotFoundContentProps {
  /** When `true`, wraps in fixed full-screen overlay (root not-found). When `false`,
   *  sits inside the platform shell as a flex-1 region (platform not-found). */
  fullPage?: boolean;
}

export function NotFoundContent({ fullPage = false }: NotFoundContentProps) {
  const reduceMotion = useReducedMotion();
  const deadEnd = polarToXY(DEAD_END_ANGLE, BRANCH_LENGTH);

  const containerStyle: React.CSSProperties = fullPage
    ? {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        padding: '24px',
        overflowY: 'auto',
      }
    : {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '24px',
      };

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 760, width: '100%' }}>
        {/* SVG decision-branches viz */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          <svg
            viewBox="0 0 280 280"
            width="280"
            height="280"
            style={{ maxWidth: '100%', height: 'auto' }}
            aria-label="Decision branches: four live paths and one dead-end"
            role="img"
          >
            <defs>
              <radialGradient id="not-found-core" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Soft halo behind the center node */}
            <circle cx={CENTER.x} cy={CENTER.y} r="42" fill="url(#not-found-core)" />

            {/* Live branches — four green lines + terminal labels (clickable as Link below) */}
            {LIVE_BRANCHES.map((branch, i) => {
              const end = polarToXY(branch.angle, BRANCH_LENGTH);
              return (
                <motion.g
                  key={branch.id}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: reduceMotion ? 0 : 0.1 + i * 0.08,
                  }}
                >
                  <line
                    x1={CENTER.x}
                    y1={CENTER.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                  <circle
                    cx={end.x}
                    cy={end.y}
                    r={TERMINAL_R}
                    fill="var(--bg-primary)"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                  />
                </motion.g>
              );
            })}

            {/* Dead-end branch — dotted slate line, fades to transparent at the tip */}
            <motion.g
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.5 }}
            >
              <line
                x1={CENTER.x}
                y1={CENTER.y}
                x2={deadEnd.x}
                y2={deadEnd.y}
                stroke="var(--text-muted)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                opacity="0.5"
              />
              <motion.circle
                cx={deadEnd.x}
                cy={deadEnd.y}
                r="6"
                fill="var(--text-muted)"
                opacity="0.4"
                animate={
                  reduceMotion
                    ? undefined
                    : { r: [6, 9, 6], opacity: [0.4, 0.7, 0.4] }
                }
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <text
                x={deadEnd.x + 12}
                y={deadEnd.y - 4}
                fontSize="10"
                fontWeight="600"
                fill="var(--text-muted)"
                fontFamily="ui-sans-serif, system-ui"
                letterSpacing="1.0"
                style={{ textTransform: 'uppercase' }}
              >
                you are here
              </text>
              <text
                x={deadEnd.x + 12}
                y={deadEnd.y + 9}
                fontSize="9"
                fill="var(--text-muted)"
                fontFamily="ui-sans-serif, system-ui"
                opacity="0.7"
              >
                404 · path not found
              </text>
            </motion.g>

            {/* Center node — Decision Intel "core" green circle */}
            <circle
              cx={CENTER.x}
              cy={CENTER.y}
              r="14"
              fill="var(--bg-primary)"
              stroke="var(--accent-primary)"
              strokeWidth="2.5"
            />
            <circle cx={CENTER.x} cy={CENTER.y} r="6" fill="var(--accent-primary)" />
          </svg>
        </div>

        {/* Copy block */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--text-muted)',
              marginBottom: 10,
            }}
          >
            404 &middot; decision dead-end
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 3.4vw, 34px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: '0 0 10px 0',
              lineHeight: 1.15,
            }}
          >
            This path doesn&rsquo;t lead anywhere.
          </h1>
          <p
            style={{
              fontSize: 14.5,
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.55,
              maxWidth: 540,
              marginInline: 'auto',
            }}
          >
            The URL is broken, the resource was moved, or the audit you opened
            wasn&rsquo;t scoped to your account. Pick a path below that actually exists.
          </p>
        </div>

        {/* Live navigation cards (mirrors the four green branches in the viz) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {LIVE_BRANCHES.map(({ id, href, label, Icon }) => (
            <Link
              key={id}
              href={href}
              className="not-found-branch-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontSize: 13.5,
                fontWeight: 600,
                transition:
                  'border-color 0.15s ease, background 0.15s ease, transform 0.15s ease',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(22, 163, 74, 0.08)',
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
              </span>
              {label}
            </Link>
          ))}
        </div>

        {/* Quiet back link */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--text-muted)',
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
            }}
            className="not-found-back-link"
          >
            <ArrowLeft size={13} />
            Back to dashboard
          </Link>
        </div>

        <style>{`
          .not-found-branch-card:hover {
            border-color: var(--accent-primary) !important;
            background: rgba(22, 163, 74, 0.04) !important;
            transform: translateY(-1px);
          }
          .not-found-back-link:hover {
            color: var(--text-primary) !important;
            background: var(--bg-secondary) !important;
          }
        `}</style>
      </div>
    </div>
  );
}
