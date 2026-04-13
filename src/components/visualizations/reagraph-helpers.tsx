'use client';

/**
 * Shared helpers for all reagraph 3D canvases:
 *   - <SlowOrbit />      : gentle auto-rotation that pauses during user interaction.
 *   - <ResetViewButton/> : tiny icon button that refits camera to frame all nodes.
 *
 * SlowOrbit MUST be rendered inside a <GraphCanvas> (it uses useFrame from
 * @react-three/fiber). ResetViewButton is plain DOM and should sit in the
 * wrapper that hosts the canvas (position: relative required).
 */

import { useEffect, useRef, useCallback, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { GraphCanvasRef } from 'reagraph';
import { Maximize2 } from 'lucide-react';

// ─── SlowOrbit ───────────────────────────────────────────────────────────────

interface SlowOrbitProps {
  graphRef: MutableRefObject<GraphCanvasRef | null>;
  degreesPerSecond?: number;
  /** Pause duration after any user interaction (ms). */
  pauseMs?: number;
  /** Delay before orbit starts, so initial fitNodesInView retries can land. */
  startDelayMs?: number;
}

export function SlowOrbit({
  graphRef,
  degreesPerSecond = 5,
  pauseMs = 3500,
  startDelayMs = 1500,
}: SlowOrbitProps) {
  const pausedUntilRef = useRef(0);
  useEffect(() => {
    pausedUntilRef.current = performance.now() + startDelayMs;
  }, [startDelayMs]);

  useEffect(() => {
    const pause = () => {
      pausedUntilRef.current = performance.now() + pauseMs;
    };
    window.addEventListener('pointerdown', pause);
    window.addEventListener('wheel', pause, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', pause);
      window.removeEventListener('wheel', pause);
    };
  }, [pauseMs]);

  useFrame((_, delta) => {
    if (performance.now() < pausedUntilRef.current) return;
    const ref = graphRef.current;
    if (!ref) return;
    const controls = ref.getControls();
    if (!controls) return;
    controls.azimuthAngle += degreesPerSecond * delta * (Math.PI / 180);
  });
  return null;
}

// ─── ResetViewButton ─────────────────────────────────────────────────────────

interface ResetViewButtonProps {
  graphRef: MutableRefObject<GraphCanvasRef | null>;
  /** Visual variant: "light" for white-bg graphs, "dark" for navy-bg. */
  variant?: 'light' | 'dark';
  /** Optional override of default top/right absolute positioning. */
  style?: React.CSSProperties;
}

export function ResetViewButton({ graphRef, variant = 'light', style }: ResetViewButtonProps) {
  const reset = useCallback(() => {
    graphRef.current?.fitNodesInView(undefined, { animated: true });
  }, [graphRef]);

  const isDark = variant === 'dark';
  return (
    <button
      type="button"
      onClick={reset}
      aria-label="Reset graph view"
      title="Reset view"
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : '#E2E8F0'}`,
        background: isDark ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        color: isDark ? '#E2E8F0' : '#475569',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        zIndex: 5,
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = isDark ? 'rgba(15,23,42,0.85)' : '#FFFFFF';
        e.currentTarget.style.color = isDark ? '#FFFFFF' : '#0F172A';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isDark ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.85)';
        e.currentTarget.style.color = isDark ? '#E2E8F0' : '#475569';
      }}
    >
      <Maximize2 size={14} />
    </button>
  );
}
