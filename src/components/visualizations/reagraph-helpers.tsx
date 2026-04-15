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
  pauseMs = 2000,
  startDelayMs = 1500,
}: SlowOrbitProps) {
  const pausedUntilRef = useRef(0);
  useEffect(() => {
    pausedUntilRef.current = performance.now() + startDelayMs;
  }, [startDelayMs]);

  useEffect(() => {
    // Only pause orbit when the user actually drags or zooms — not on a
    // simple click. We track pointerdown + distance: if the pointer moves
    // more than a threshold before lifting, treat it as a drag and pause.
    // Clicks (select a node, release in place) keep the graph in motion.
    let downX = 0;
    let downY = 0;
    let dragging = false;
    const DRAG_THRESHOLD_PX = 6;

    const pause = () => {
      pausedUntilRef.current = performance.now() + pauseMs;
    };

    const onDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      dragging = false;
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) return;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        dragging = true;
        pause();
      }
    };
    const onUp = () => {
      dragging = false;
    };

    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('wheel', pause, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDone(true);
      return;
    }
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

// ─── SelectedGlow ────────────────────────────────────────────────────────────
// Three coordinated layers around a selected node:
//
//   1. Inner glass core (static): a fresnel-shaded shell that mirrors the
//      node's geometry (dodecahedron, octahedron, cylinder, etc.) at a
//      slight outset, with a light tint of the node color.
//   2. Two radiating waves: copies of the same geometry that continuously
//      grow outward from the node and fade out, with offset phases so a
//      new wave is always emerging. Reads as energy radiating, not a
//      static glow.
//
// Custom fresnel shader brightens silhouette edges, NormalBlending so the
// tint is preserved on a white background (additive saturates to white).

import type { Mesh } from 'three';
import { Color, DoubleSide, NormalBlending, ShaderMaterial } from 'three';

export type GlowShape =
  | 'sphere'
  | 'dodecahedron'
  | 'octahedron'
  | 'icosahedron'
  | 'tetrahedron'
  | 'box'
  | 'cylinder';

interface CylinderArgs {
  radiusFactor?: number;
  heightFactor?: number;
  segments?: number;
}

function ShellGeometry({
  shape,
  size,
  cylinder = {},
}: {
  shape: GlowShape;
  size: number;
  cylinder?: CylinderArgs;
}) {
  switch (shape) {
    case 'dodecahedron':
      return <dodecahedronGeometry args={[size, 0]} />;
    case 'octahedron':
      return <octahedronGeometry args={[size, 0]} />;
    case 'icosahedron':
      return <icosahedronGeometry args={[size, 1]} />;
    case 'tetrahedron':
      return <tetrahedronGeometry args={[size, 0]} />;
    case 'box':
      return <boxGeometry args={[size, size, size]} />;
    case 'cylinder': {
      const r = (cylinder.radiusFactor ?? 0.85) * size;
      const h = (cylinder.heightFactor ?? 2) * size;
      const seg = cylinder.segments ?? 16;
      return <cylinderGeometry args={[r, r, h, seg]} />;
    }
    case 'sphere':
    default:
      return <sphereGeometry args={[size, 32, 24]} />;
  }
}

const FRESNEL_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRESNEL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uBaseTint;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    // Bright rim from fresnel + uniform base tint so the whole shell
    // carries the node color (not just the silhouette).
    float a = pow(rim, uPower) * uIntensity + uBaseTint;
    gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));
  }
`;

function makeFresnelMaterial(color: string, intensity: number, power: number, baseTint: number) {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
      uBaseTint: { value: baseTint },
    },
    vertexShader: FRESNEL_VERTEX,
    fragmentShader: FRESNEL_FRAGMENT,
    transparent: true,
    // NormalBlending (not Additive): canvas background is white, and
    // additive math (dest + source) saturates to white on a white
    // surface, eating any tint. Normal alpha blending preserves color.
    blending: NormalBlending,
    depthWrite: false,
    side: DoubleSide,
  });
}

// Static breathing shell: holds at a fixed scale, gently pulses intensity.
function FresnelShell({
  size,
  color,
  power,
  intensity,
  baseTint = 0,
  shape,
  cylinder,
  pulseSpeed = 1.8,
  pulseDepth = 0.18,
  phase = 0,
}: {
  size: number;
  color: string;
  power: number;
  intensity: number;
  baseTint?: number;
  shape: GlowShape;
  cylinder?: CylinderArgs;
  pulseSpeed?: number;
  pulseDepth?: number;
  phase?: number;
}) {
  const material = useMemo(
    () => makeFresnelMaterial(color, intensity, power, baseTint),
    [color, intensity, power, baseTint],
  );
  const matRef = useRef<ShaderMaterial | null>(null);
  useFrame(({ clock }) => {
    const m = matRef.current;
    if (!m) return;
    const t = clock.elapsedTime + phase;
    m.uniforms.uIntensity.value =
      intensity * (1 - pulseDepth + Math.sin(t * pulseSpeed) * pulseDepth);
  });
  return (
    <mesh>
      <ShellGeometry shape={shape} size={size} cylinder={cylinder} />
      <primitive ref={matRef} object={material} attach="material" />
    </mesh>
  );
}

// Radiating shell: continuously grows outward from `startScale` to `endScale`
// over `cycleSeconds`, fading opacity to 0 as it expands. Loops forever.
// Use 2-3 of these with offset phases so a new wave is always emerging.
function RadiatingShell({
  baseSize,
  color,
  power,
  peakIntensity,
  peakBaseTint,
  shape,
  cylinder,
  startScale = 1,
  endScale = 2.4,
  cycleSeconds = 2.6,
  phase = 0,
}: {
  baseSize: number;
  color: string;
  power: number;
  peakIntensity: number;
  peakBaseTint: number;
  shape: GlowShape;
  cylinder?: CylinderArgs;
  startScale?: number;
  endScale?: number;
  cycleSeconds?: number;
  phase?: number;
}) {
  const material = useMemo(
    () => makeFresnelMaterial(color, peakIntensity, power, peakBaseTint),
    [color, peakIntensity, power, peakBaseTint],
  );
  const meshRef = useRef<Mesh | null>(null);
  const matRef = useRef<ShaderMaterial | null>(null);
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    // t in [0, 1) walking forward over the cycle, with optional phase offset.
    const t = (((clock.elapsedTime + phase) % cycleSeconds) + cycleSeconds) % cycleSeconds;
    const u = t / cycleSeconds; // 0 → 1
    const scale = startScale + (endScale - startScale) * u;
    mesh.scale.setScalar(scale);
    // Ease-out fade: bright on emergence, decays to zero by cycle end.
    const fade = Math.pow(1 - u, 1.4);
    mat.uniforms.uIntensity.value = peakIntensity * fade;
    mat.uniforms.uBaseTint.value = peakBaseTint * fade;
  });
  return (
    <mesh ref={meshRef}>
      <ShellGeometry shape={shape} size={baseSize} cylinder={cylinder} />
      <primitive ref={matRef} object={material} attach="material" />
    </mesh>
  );
}

export function SelectedGlow({
  size,
  color,
  shape = 'sphere',
  cylinder,
}: {
  size: number;
  color: string;
  shape?: GlowShape;
  cylinder?: CylinderArgs;
}) {
  return (
    <group>
      {/* Inner glass core — fixed size, light tint of node color. The
         halo's "body" — visible at rest, but never solid. */}
      <FresnelShell
        size={size * 1.15}
        color={color}
        shape={shape}
        cylinder={cylinder}
        power={2.4}
        intensity={0.45}
        baseTint={0.11}
        pulseSpeed={1.0}
        pulseDepth={0.18}
      />
      {/* Two radiating waves, half a cycle apart, so a new wave is always
         emerging while the previous one fades into the background. */}
      <RadiatingShell
        baseSize={size * 1.15}
        color={color}
        shape={shape}
        cylinder={cylinder}
        power={2.0}
        peakIntensity={0.5}
        peakBaseTint={0.1}
        startScale={1}
        endScale={1.65}
        cycleSeconds={4.3}
        phase={0}
      />
      <RadiatingShell
        baseSize={size * 1.15}
        color={color}
        shape={shape}
        cylinder={cylinder}
        power={2.0}
        peakIntensity={0.5}
        peakBaseTint={0.1}
        startScale={1}
        endScale={1.65}
        cycleSeconds={4.3}
        phase={2.15}
      />
    </group>
  );
}

// ─── NodeHoverTooltip ────────────────────────────────────────────────────────
// Lightweight floating tooltip that follows the pointer. Intended for hover
// preview — complementary to click-to-select. Each canvas owns its hover
// state (so it can map its NodeData shape to `title`/`subtitle`/`body`) and
// renders this inside the relative-positioned canvas wrapper.

export interface NodeHoverTooltipProps {
  title: string;
  subtitle?: string;
  body?: string;
  /** Pointer position in CSS pixels relative to the wrapping container. */
  x: number;
  y: number;
  /** Accent color for the subtitle/label row (severity color, etc.). */
  accent?: string;
  variant?: 'light' | 'dark';
}

export function NodeHoverTooltip({
  title,
  subtitle,
  body,
  x,
  y,
  accent,
  variant = 'light',
}: NodeHoverTooltipProps) {
  const isDark = variant === 'dark';
  // Offset slightly so the tooltip doesn't sit under the cursor / block clicks.
  const left = x + 14;
  const top = y + 14;
  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute',
        left,
        top,
        maxWidth: 280,
        padding: '10px 12px',
        borderRadius: 10,
        pointerEvents: 'none',
        zIndex: 4,
        background: isDark ? 'rgba(15,23,42,0.94)' : 'rgba(255,255,255,0.96)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : '#E2E8F0'}`,
        boxShadow: isDark
          ? '0 6px 20px rgba(0,0,0,0.45)'
          : '0 6px 20px rgba(15,23,42,0.12)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        color: isDark ? '#F1F5F9' : '#0F172A',
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: subtitle || body ? 3 : 0,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: accent ?? (isDark ? '#94A3B8' : '#64748B'),
            marginBottom: body ? 4 : 0,
          }}
        >
          {subtitle}
        </div>
      )}
      {body && (
        <div style={{ color: isDark ? '#CBD5E1' : '#475569' }}>
          {body.length > 160 ? body.slice(0, 157) + '…' : body}
        </div>
      )}
    </div>
  );
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
