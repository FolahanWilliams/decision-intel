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

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type MutableRefObject,
} from 'react';
import { useFrame } from '@react-three/fiber';
import type { GraphCanvasRef, Theme } from 'reagraph';
import { RotateCcw } from 'lucide-react';

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

// ─── useEdgeNarrativeReveal ──────────────────────────────────────────────────
// First-view narrative: reveal edges one at a time over ~4 seconds so the
// graph feels like reasoning unfolding, not just a snapshot dropped in.
//
// Mechanic: feed reagraph's `actives` prop progressively. All node IDs are
// always included (nodes stay bright); edges are added one-by-one. Edges
// not yet revealed fall through to the theme's `inactiveOpacity` (≈0.18),
// so the reveal reads as dim-to-bright without needing custom edge renderers.
//
// Gated by sessionStorage per graph so repeat visits in the same session
// skip straight to the final state.

interface UseEdgeNarrativeRevealOpts {
  nodeIds: string[];
  edgeIds: string[];
  storageKey: string;
  durationMs?: number;
  /** If true, skip the narrative entirely (e.g., reduced-motion). */
  disabled?: boolean;
  /**
   * Optional semantic grouping of edges. Each inner array reveals together
   * with a pause between groups — turns the reveal into a narrative beat
   * (e.g., decisions appear, pause, toxic combos flash red, pause, outcomes
   * cascade). Edges not listed in any group are appended as a final group.
   */
  edgeGroups?: string[][];
  /** Pause between groups, in ms. Only applies when edgeGroups is provided. */
  groupPauseMs?: number;
  /** Current phase (0-indexed group) — useful for gating UI beats (labels). */
}

export function useEdgeNarrativeReveal({
  nodeIds,
  edgeIds,
  storageKey,
  durationMs = 6000,
  disabled = false,
  edgeGroups,
  groupPauseMs = 500,
}: UseEdgeNarrativeRevealOpts) {
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [currentGroup, setCurrentGroup] = useState<number>(-1);
  const [done, setDone] = useState<boolean>(() => {
    if (disabled) return true;
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  // Compute the ordered reveal schedule (group-aware if edgeGroups given).
  const schedule = useMemo<Array<{ id: string; group: number }>>(() => {
    if (!edgeGroups || edgeGroups.length === 0) {
      return edgeIds.map(id => ({ id, group: 0 }));
    }
    const seen = new Set<string>();
    const out: Array<{ id: string; group: number }> = [];
    edgeGroups.forEach((grp, gi) => {
      grp.forEach(id => {
        if (!seen.has(id) && edgeIds.includes(id)) {
          seen.add(id);
          out.push({ id, group: gi });
        }
      });
    });
    // Any edges not listed in any group get appended as a final group.
    const leftover = edgeIds.filter(id => !seen.has(id));
    if (leftover.length > 0) {
      const gi = edgeGroups.length;
      leftover.forEach(id => out.push({ id, group: gi }));
    }
    return out;
  }, [edgeIds, edgeGroups]);

  useEffect(() => {
    if (done || disabled) return;
    if (schedule.length === 0) {
      setDone(true);
      return;
    }
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDone(true);
      return;
    }

    // Budget: subtract pause slots from total duration, split remaining
    // time across edge count. Each edge fires at its cumulative offset;
    // the first edge of a new group lands after a groupPauseMs gap.
    const groupCount = edgeGroups ? edgeGroups.length : 1;
    const totalPauseMs = edgeGroups ? Math.max(0, groupCount - 1) * groupPauseMs : 0;
    const perEdge = Math.max(60, (durationMs - totalPauseMs) / schedule.length);

    const timers: number[] = [];
    let cursor = 0;
    let prevGroup = schedule[0].group;
    setCurrentGroup(prevGroup);
    schedule.forEach((item, i) => {
      if (item.group !== prevGroup) {
        cursor += groupPauseMs;
        prevGroup = item.group;
      }
      cursor += perEdge;
      const at = cursor;
      timers.push(
        window.setTimeout(() => {
          setRevealedIds(prev => (prev.includes(item.id) ? prev : [...prev, item.id]));
          setCurrentGroup(item.group);
        }, at),
      );
      // dependency unused — keep lint quiet on `i`
      void i;
    });

    timers.push(
      window.setTimeout(
        () => {
          setDone(true);
          try {
            window.sessionStorage.setItem(storageKey, '1');
          } catch {
            /* storage blocked — ignore */
          }
        },
        cursor + 150,
      ),
    );
    return () => timers.forEach(t => window.clearTimeout(t));
  }, [done, disabled, schedule, edgeGroups, durationMs, groupPauseMs, storageKey]);

  const narrativeActives = useMemo<string[] | null>(() => {
    if (done) return null;
    return [...nodeIds, ...revealedIds];
  }, [done, nodeIds, revealedIds]);

  return { narrativeActives, isRevealing: !done, currentGroup };
}

// ─── withNarrativeTheme ──────────────────────────────────────────────────────
// Clone a reagraph theme with aggressively dimmed `inactiveOpacity` so edges
// and nodes not yet revealed are nearly invisible during the narrative reveal.
// After the reveal ends, callers switch back to the base theme, so normal
// hover behavior (inactive ≈ 0.18–0.35) is preserved.

export function withNarrativeTheme(base: Theme): Theme {
  return {
    ...base,
    node: base.node
      ? {
          ...base.node,
          inactiveOpacity: 0.22,
        }
      : base.node,
    edge: base.edge
      ? {
          ...base.edge,
          inactiveOpacity: 0.03,
        }
      : base.edge,
    arrow: base.arrow,
  };
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
      <RotateCcw size={14} />
    </button>
  );
}
