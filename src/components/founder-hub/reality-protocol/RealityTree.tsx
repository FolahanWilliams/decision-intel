'use client';

/**
 * RealityTree — the immersive sky + tree hero for the 66-Day Protocol.
 *
 * intentional-dark — this is a self-contained illustrative panel (a calm
 * sky scene that shifts with the time of day), NOT platform chrome. Like the
 * DPR renderers and the marketing/viz surfaces, it carries its own rich
 * palette by design; the surrounding tab uses platform tokens. The hex below
 * is the illustration's palette, deliberately not CSS-var-driven.
 *
 * The tree grows purely from `progress` (0-1) — the pure math in
 * tree-growth.ts owns the value; this file only draws it. Reduced-motion
 * readers get the static scene (only the bloom petals animate, gated behind
 * prefers-reduced-motion).
 */

import type { CSSProperties } from 'react';
import { CHECKINS_TO_BLOOM } from './content';

// ---------- palette (illustration-local, intentional-dark) ----------
const LINE = '#2E3447';
const BONE = '#ECE7DC';
const GOLD = '#D9A45B';
const LEAF_DARK = '#3C6349';
const LEAF = '#54855F';
const LEAF_LIGHT = '#7CAE83';
const BARK = '#6B4F3A';
const BLOOM = '#E7A6B8';
const BLOOM_LIGHT = '#F4D7E0';
const SOIL = '#352A22';
const SOIL_LIGHT = '#473730';

export type SkyKey = 'night' | 'dawn' | 'day' | 'dusk';

export interface SkyInfo {
  key: SkyKey;
  label: string;
  grad: string;
}

/** Time-of-day sky. Pure given the hour, so the hero feels different morning
 *  vs night — reinforcing the two-check-ins-a-day rhythm. */
export function skyInfoFor(hour: number): SkyInfo {
  if (hour >= 20 || hour < 5)
    return {
      key: 'night',
      label: 'Night',
      grad: 'linear-gradient(to bottom,#0A0C16 0%,#12162A 42%,#1F2640 74%,#2B3050 100%)',
    };
  if (hour < 9)
    return {
      key: 'dawn',
      label: 'Dawn',
      grad: 'linear-gradient(to bottom,#26223C 0%,#5E4A6B 34%,#C9748B 62%,#E8B07A 86%,#F0C896 100%)',
    };
  if (hour < 17)
    return {
      key: 'day',
      label: 'Day',
      grad: 'linear-gradient(to bottom,#3E6B97 0%,#6E97BC 46%,#A9C6DC 80%,#D7E6F0 100%)',
    };
  return {
    key: 'dusk',
    label: 'Dusk',
    grad: 'linear-gradient(to bottom,#10131F 0%,#2E2647 32%,#6B3B57 60%,#B5683E 86%,#D98E55 100%)',
  };
}

const pseudo = (n: number): number => {
  const x = Math.sin(n * 99.13) * 43758.5453;
  return x - Math.floor(x);
};

function renderSky(key: SkyKey) {
  const els: React.ReactNode[] = [];
  if (key === 'night') {
    els.push(<circle key="moon" cx={234} cy={50} r={15} fill="#E9E6D8" />);
    els.push(<circle key="moonsh" cx={240} cy={45} r={13} fill="#141A30" opacity={0.6} />);
    (
      [
        [40, 28],
        [72, 54],
        [110, 26],
        [150, 44],
        [198, 32],
        [60, 88],
        [256, 78],
        [30, 66],
        [178, 70],
        [248, 38],
        [128, 64],
      ] as Array<[number, number]>
    ).forEach((s, i) =>
      els.push(
        <circle
          key={'st' + i}
          cx={s[0]}
          cy={s[1]}
          r={i % 3 === 0 ? 1.3 : 0.8}
          fill="#FFFFFF"
          opacity={0.85}
        />
      )
    );
  } else if (key === 'dawn') {
    els.push(<circle key="glow" cx={68} cy={72} r={30} fill="#F3C98B" opacity={0.22} />);
    els.push(<circle key="sun" cx={68} cy={72} r={19} fill="#F5CE91" />);
  } else if (key === 'dusk') {
    els.push(<circle key="glow" cx={234} cy={86} r={32} fill="#F0A86A" opacity={0.22} />);
    els.push(<circle key="sun" cx={234} cy={86} r={19} fill="#F1AB6E" />);
  } else {
    els.push(<circle key="glow" cx={238} cy={46} r={28} fill="#FBE8B0" opacity={0.28} />);
    els.push(<circle key="sun" cx={238} cy={46} r={17} fill="#FCEBB6" />);
  }
  return els;
}

/**
 * Draw the tree for a given check-in count `c` (0..CHECKINS_TO_BLOOM) and the
 * continuous fill `p` (= c / CHECKINS_TO_BLOOM).
 *
 * The growth is driven so that EVERY single check-in adds one new, identifiable
 * element — this is the founder ask (2026-06-14): the tree must visibly change
 * every morning AND every night, the graduality is the point. The schedule
 * tiles all CHECKINS_TO_BLOOM check-ins exactly:
 *
 *   c = 0            seed in the soil
 *   c = 1..SPROUT    a sprout — taller each tap, a tiny leaf on the first few
 *   then, on the canopy, one new element per check-in, persistent by index
 *   (so each tap APPENDS growth rather than reshuffling):
 *     · outer leaves   — leafing out
 *     · inner foliage  — filling in lush
 *     · blossoms       — the "suddenly" finale, full bloom at the last check-in
 *
 * On top of that, trunk height + canopy radius scale continuously with `p`, so
 * even a tap that lands inside a saturated band still enlarges the tree a touch.
 * Element positions key off the element INDEX (via `pseudo`), never the current
 * count, so existing leaves/blossoms stay put and only the newest one appears.
 *
 * Phase sizes derive from CHECKINS_TO_BLOOM (the SSOT) so they can't drift if
 * the protocol length ever changes, and the final blossom always lands exactly
 * at full bloom.
 */
const SPROUT_CHECKINS = 8;
const REMAINING = CHECKINS_TO_BLOOM - SPROUT_CHECKINS;
const OUTER_MAX = Math.round(REMAINING * 0.4);
const INNER_MAX = Math.round(REMAINING * 0.37);
const BLOSSOM_START = SPROUT_CHECKINS + OUTER_MAX + INNER_MAX;
const BLOSSOM_MAX = CHECKINS_TO_BLOOM - BLOSSOM_START; // the rest → last lands at bloom

const clampInt = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export type TreePhase = 'seed' | 'sprout' | 'canopy';

export interface TreeSignature {
  phase: TreePhase;
  /** The perceptible per-check-in change: count of discrete growth elements
   *  drawn (sprout leaves in the sprout phase; outer + inner + blossom in the
   *  canopy). One more appears with every single check-in until full bloom. */
  growthCount: number;
  sproutLeaves: number;
  sproutHeight: number;
  outer: number;
  inner: number;
  blossom: number;
  branches: boolean;
  trunkH: number;
  trunkW: number;
  canopyR: number;
}

/**
 * PURE growth schedule for a check-in count — the single source for both the
 * drawing (renderTree below) and the test that locks the founder invariant:
 * EVERY check-in must visibly change the tree. (2026-06-14 founder ask.)
 *
 * The schedule tiles all CHECKINS_TO_BLOOM check-ins exactly so each tap adds
 * one new identifiable element — a sprout leaf, then an outer leaf (leafing
 * out), then inner foliage (filling in lush), then a blossom (the "suddenly"
 * finale) — with the final blossom landing precisely at full bloom. Phase sizes
 * derive from CHECKINS_TO_BLOOM (the SSOT) so they can't drift if the protocol
 * length ever changes. Trunk + canopy also scale continuously so the size grows
 * a touch even inside a saturated band.
 */
export function treeRenderSignature(checkins: number): TreeSignature {
  // Guard against NaN / non-finite (Math.max(0, NaN) is NaN, not 0).
  const c = Number.isFinite(checkins) ? Math.max(0, Math.round(checkins)) : 0;
  if (c <= 0) {
    return {
      phase: 'seed',
      growthCount: 0,
      sproutLeaves: 0,
      sproutHeight: 0,
      outer: 0,
      inner: 0,
      blossom: 0,
      branches: false,
      trunkH: 0,
      trunkW: 0,
      canopyR: 0,
    };
  }
  if (c <= SPROUT_CHECKINS) {
    // A sprout: taller every tap, and a fresh little leaf on every tap too.
    const sproutLeaves = Math.min(c, SPROUT_CHECKINS);
    return {
      phase: 'sprout',
      growthCount: sproutLeaves,
      sproutLeaves,
      sproutHeight: 9 + c * 4.4,
      outer: 0,
      inner: 0,
      blossom: 0,
      branches: false,
      trunkH: 0,
      trunkW: 0,
      canopyR: 0,
    };
  }
  const t = Math.min(1, (c - SPROUT_CHECKINS) / Math.max(1, CHECKINS_TO_BLOOM - SPROUT_CHECKINS));
  const outer = clampInt(c - SPROUT_CHECKINS, 0, OUTER_MAX);
  const inner = clampInt(c - (SPROUT_CHECKINS + OUTER_MAX), 0, INNER_MAX);
  const blossom = clampInt(c - BLOSSOM_START, 0, BLOSSOM_MAX);
  return {
    phase: 'canopy',
    growthCount: outer + inner + blossom,
    sproutLeaves: 0,
    sproutHeight: 0,
    outer,
    inner,
    blossom,
    branches: t > 0.18,
    trunkH: 46 + t * 140,
    trunkW: 10 + t * 20,
    canopyR: 32 + t * 60,
  };
}

function renderTree(checkins: number) {
  const els: React.ReactNode[] = [];
  const baseX = 150;
  const baseY = 250;
  const sig = treeRenderSignature(checkins);
  els.push(<ellipse key="soil" cx={baseX} cy={baseY + 7} rx={48} ry={12} fill={SOIL} />);
  els.push(<ellipse key="soil2" cx={baseX} cy={baseY + 4} rx={30} ry={7} fill={SOIL_LIGHT} />);

  // c === 0 → a seed resting in the soil.
  if (sig.phase === 'seed') {
    els.push(
      <ellipse
        key="seed"
        cx={baseX}
        cy={baseY - 1}
        rx={5}
        ry={7}
        fill={BARK}
        transform={`rotate(14 ${baseX} ${baseY})`}
      />
    );
    return els;
  }

  // Sprout — taller every tap, a fresh little leaf on every tap.
  if (sig.phase === 'sprout') {
    const h = sig.sproutHeight;
    const topY = baseY - h;
    els.push(
      <path
        key="stem"
        d={`M${baseX} ${baseY} C ${baseX - 2} ${baseY - h * 0.5}, ${baseX + 1} ${baseY - h * 0.8}, ${baseX} ${topY}`}
        stroke={LEAF}
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
      />
    );
    const denom = Math.max(1, sig.sproutLeaves - 1);
    for (let i = 0; i < sig.sproutLeaves; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const ly = baseY - h * (0.38 + 0.54 * (i / denom));
      const lx = baseX + side * 7;
      els.push(
        <ellipse
          key={`sl${i}`}
          cx={lx}
          cy={ly}
          rx={7.5}
          ry={3.8}
          fill={i % 2 ? LEAF : LEAF_LIGHT}
          transform={`rotate(${side * 32} ${lx} ${ly})`}
        />
      );
    }
    return els;
  }

  // Canopy — trunk + branches + leaves + blossoms, all from the signature.
  const { trunkH, trunkW, canopyR, branches, outer, inner, blossom } = sig;
  const topY = baseY - trunkH;

  els.push(
    <path
      key="trunk"
      d={`M${baseX - trunkW / 2} ${baseY}
        C ${baseX - trunkW / 2.4} ${baseY - trunkH * 0.5}, ${baseX - trunkW / 5} ${baseY - trunkH * 0.82}, ${baseX - trunkW / 8} ${topY}
        L ${baseX + trunkW / 8} ${topY}
        C ${baseX + trunkW / 5} ${baseY - trunkH * 0.82}, ${baseX + trunkW / 2.4} ${baseY - trunkH * 0.5}, ${baseX + trunkW / 2} ${baseY} Z`}
      fill={BARK}
    />
  );

  if (branches) {
    const bl = 16 + (trunkH / 186) * 26;
    els.push(
      <path
        key="br1"
        d={`M${baseX - trunkW / 6} ${topY + trunkH * 0.3} q ${-bl * 0.6} ${-bl * 0.2} ${-bl} ${-bl * 0.7}`}
        stroke={BARK}
        strokeWidth={Math.max(3, trunkW * 0.26)}
        fill="none"
        strokeLinecap="round"
      />
    );
    els.push(
      <path
        key="br2"
        d={`M${baseX + trunkW / 6} ${topY + trunkH * 0.44} q ${bl * 0.6} ${-bl * 0.2} ${bl} ${-bl * 0.7}`}
        stroke={BARK}
        strokeWidth={Math.max(3, trunkW * 0.22)}
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  const cyTop = topY - canopyR * 0.32;
  els.push(
    <circle key="cfill" cx={baseX} cy={cyTop - canopyR * 0.1} r={canopyR * 0.66} fill={LEAF} />
  );

  // One new OUTER leaf per check-in (leafing out). Positioned by index, so each
  // tap APPENDS a leaf; existing ones stay put.
  for (let i = 0; i < outer; i++) {
    const ang = pseudo(i * 2.3 + 1) * Math.PI * 2;
    const rad = canopyR * (0.5 + 0.5 * pseudo(i * 7 + 2));
    const bx = baseX + Math.cos(ang) * rad * 0.96;
    const by = cyTop - Math.sin(ang) * rad * 0.62 - canopyR * 0.08;
    const br = 6 + 4 * pseudo(i * 5 + 3);
    const col = i % 3 === 0 ? LEAF_DARK : i % 3 === 1 ? LEAF : LEAF_LIGHT;
    els.push(<circle key={`ol${i}`} cx={bx} cy={by} r={br} fill={col} />);
  }

  // One new INNER cluster per check-in — filling the canopy in, deeper + smaller.
  for (let i = 0; i < inner; i++) {
    const ang = pseudo(i * 3.7 + 11) * Math.PI * 2;
    const rad = canopyR * (0.15 + 0.55 * pseudo(i * 9 + 5));
    const bx = baseX + Math.cos(ang) * rad * 0.9;
    const by = cyTop - Math.sin(ang) * rad * 0.55 - canopyR * 0.06;
    const br = 4 + 3 * pseudo(i * 4 + 2);
    els.push(<circle key={`il${i}`} cx={bx} cy={by} r={br} fill={i % 2 ? LEAF_DARK : LEAF} />);
  }

  // One new BLOSSOM per check-in — the "suddenly" finale; the last lands at bloom.
  for (let i = 0; i < blossom; i++) {
    const ang = pseudo(i * 5.1 + 21) * Math.PI * 2;
    const rad = canopyR * (0.2 + 0.7 * pseudo(i * 13 + 7));
    const bx = baseX + Math.cos(ang) * rad * 0.92;
    const by = cyTop - Math.sin(ang) * rad * 0.6 - canopyR * 0.08;
    els.push(
      <circle
        key={`bl${i}`}
        cx={bx}
        cy={by}
        r={3.3}
        fill={i % 3 === 0 ? BLOOM_LIGHT : BLOOM}
        opacity={0.92}
      />
    );
  }

  return els;
}

export interface RealityTreeProps {
  /** 0-1 tree fill (continuous size driver). */
  progress: number;
  /** Total check-ins logged — the per-check-in growth driver (one new element
   *  per tap). Falls back to a count derived from `progress` if omitted. */
  totalCheckins?: number;
  sky: SkyInfo;
  /** Day N (engaged days, capped at 66). */
  dayNumber: number;
  /** Cosmetic stage label. */
  stageLabel: string;
  /** Brief scale-pulse on a fresh check-in. */
  pulse?: boolean;
}

export function RealityTree({
  progress,
  totalCheckins,
  sky,
  dayNumber,
  stageLabel,
  pulse,
}: RealityTreeProps) {
  // The tree grows one element per check-in. Prefer the exact count; fall back
  // to deriving it from progress (progress = checkins / CHECKINS_TO_BLOOM) for
  // any caller that hasn't passed it yet.
  const checkins =
    typeof totalCheckins === 'number' ? totalCheckins : Math.round(progress * CHECKINS_TO_BLOOM);
  const bloom = progress >= 1;
  const heroStyle: CSSProperties = {
    position: 'relative',
    borderRadius: 'var(--radius-xl, 16px)',
    overflow: 'hidden',
    background: sky.grad,
    height: 312,
    boxShadow: '0 18px 40px rgba(0,0,0,0.30)',
    border: `1px solid ${LINE}`,
  };

  return (
    <div style={heroStyle}>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .reality-petal{ animation: reality-fall linear infinite; }
          @keyframes reality-fall{
            0%{ transform: translateY(-6px) rotate(0deg); opacity:0 }
            12%{ opacity:.9 }
            100%{ transform: translateY(150px) rotate(220deg); opacity:0 }
          }
        }
        .reality-scene{ transition: transform .45s ease; }
      `}</style>

      {/* day count overlay */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 18,
          zIndex: 2,
          textShadow: '0 1px 8px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 40, lineHeight: 1, color: BONE }}>
          {dayNumber}
          <span style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)' }}> / 66</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>
          {stageLabel}
        </div>
      </div>

      {bloom &&
        [12, 38, 64, 86].map((l, i) => (
          <div
            key={i}
            className="reality-petal"
            style={{
              position: 'absolute',
              top: 60,
              left: `${l}%`,
              width: 7,
              height: 5,
              borderRadius: '60% 0 60% 0',
              background: i % 2 ? BLOOM_LIGHT : BLOOM,
              zIndex: 2,
              animationDuration: `${5 + i}s`,
              animationDelay: `${i * 1.1}s`,
            }}
          />
        ))}

      <svg
        className="reality-scene"
        viewBox="0 0 300 270"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: pulse ? 'scale(1.035)' : 'scale(1)',
          transformOrigin: 'center bottom',
        }}
      >
        {renderSky(sky.key)}
        {renderTree(checkins)}
      </svg>
    </div>
  );
}

export { GOLD as REALITY_GOLD, BLOOM as REALITY_BLOOM };
