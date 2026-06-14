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

function renderTree(p: number) {
  const els: React.ReactNode[] = [];
  const baseX = 150;
  const baseY = 250;
  els.push(<ellipse key="soil" cx={baseX} cy={baseY + 7} rx={48} ry={12} fill={SOIL} />);
  els.push(<ellipse key="soil2" cx={baseX} cy={baseY + 4} rx={30} ry={7} fill={SOIL_LIGHT} />);

  if (p <= 0) {
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
  if (p < 0.1) {
    const h = 10 + (p / 0.1) * 18;
    els.push(
      <path
        key="stem"
        d={`M${baseX} ${baseY} C ${baseX - 2} ${baseY - h * 0.5}, ${baseX + 1} ${baseY - h * 0.8}, ${baseX} ${baseY - h}`}
        stroke={LEAF}
        strokeWidth={3.2}
        fill="none"
        strokeLinecap="round"
      />
    );
    els.push(
      <ellipse
        key="lf1"
        cx={baseX - 7}
        cy={baseY - h + 2}
        rx={8}
        ry={4}
        fill={LEAF_LIGHT}
        transform={`rotate(-32 ${baseX - 7} ${baseY - h + 2})`}
      />
    );
    els.push(
      <ellipse
        key="lf2"
        cx={baseX + 7}
        cy={baseY - h + 1}
        rx={8}
        ry={4}
        fill={LEAF}
        transform={`rotate(32 ${baseX + 7} ${baseY - h + 1})`}
      />
    );
    return els;
  }

  const t = (p - 0.1) / 0.9;
  const trunkH = 58 + t * 120;
  const trunkW = 11 + t * 19;
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

  if (t > 0.2) {
    const bl = 16 + t * 26;
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

  const canopyR = 34 + t * 56;
  const cyTop = topY - canopyR * 0.32;
  els.push(
    <circle key="cfill" cx={baseX} cy={cyTop - canopyR * 0.1} r={canopyR * 0.66} fill={LEAF} />
  );

  const layers = [
    { col: LEAF_DARK, scale: 1.0, off: 6 },
    { col: LEAF, scale: 0.86, off: 0 },
    { col: LEAF_LIGHT, scale: 0.62, off: -7 },
  ];
  layers.forEach((L, li) => {
    const n = Math.round(5 + t * 7);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + li * 0.55;
      const rad = canopyR * L.scale * (0.45 + 0.5 * pseudo(i * 7 + li * 13));
      const bx = baseX + Math.cos(ang) * rad * 0.95;
      const by = cyTop + L.off - Math.sin(ang) * rad * 0.6 - canopyR * 0.1;
      const br = canopyR * L.scale * (0.3 + 0.22 * pseudo(i * 5 + li * 3));
      els.push(<circle key={`c${li}-${i}`} cx={bx} cy={by} r={br} fill={L.col} />);
    }
  });

  if (p > 0.8) {
    const bt = (p - 0.8) / 0.2;
    const nb = Math.round(6 + bt * 16);
    for (let i = 0; i < nb; i++) {
      const ang = pseudo(i * 11) * Math.PI * 2;
      const rad = canopyR * (0.2 + 0.72 * pseudo(i * 17));
      const bx = baseX + Math.cos(ang) * rad * 0.9;
      const by = cyTop - Math.sin(ang) * rad * 0.6 - canopyR * 0.1;
      els.push(
        <circle
          key={`bl${i}`}
          cx={bx}
          cy={by}
          r={2 + bt * 1.6}
          fill={i % 3 === 0 ? BLOOM_LIGHT : BLOOM}
          opacity={0.7 + 0.3 * bt}
        />
      );
    }
  }
  return els;
}

export interface RealityTreeProps {
  /** 0-1 tree fill. */
  progress: number;
  sky: SkyInfo;
  /** Day N (engaged days, capped at 66). */
  dayNumber: number;
  /** Cosmetic stage label. */
  stageLabel: string;
  /** Brief scale-pulse on a fresh check-in. */
  pulse?: boolean;
}

export function RealityTree({ progress, sky, dayNumber, stageLabel, pulse }: RealityTreeProps) {
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
        {renderTree(progress)}
      </svg>
    </div>
  );
}

export { GOLD as REALITY_GOLD, BLOOM as REALITY_BLOOM };
