'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * LiquidGlassEffect — Apple-style liquid glass with SVG filter-based refraction.
 *
 * Uses SVG filters for physically accurate effects:
 * - feTurbulence: Generates organic noise for irregular refraction distortion
 * - feDisplacementMap: Warps pixels through the noise map (actual light bending)
 * - feSpecularLighting + fePointLight: Smooth specular highlight following cursor
 * - feGaussianBlur: Softens specular for natural glass caustics
 *
 * The specular light's fePointLight position tracks the mouse cursor via
 * requestAnimationFrame for 60fps interactive refraction.
 */
export function LiquidGlassEffect() {
  const lightRef = useRef<HTMLDivElement>(null);
  const pointLightRef = useRef<SVGFEPointLightElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const updateGlassElements = useCallback(() => {
    const { x, y } = mouseRef.current;

    // Update the SVG fePointLight position for specular tracking
    if (pointLightRef.current) {
      pointLightRef.current.setAttribute('x', String(x));
      pointLightRef.current.setAttribute('y', String(y));
    }

    // Update the CSS light bloom position
    if (lightRef.current) {
      lightRef.current.style.setProperty('--mouse-x', `${x}px`);
      lightRef.current.style.setProperty('--mouse-y', `${y}px`);
    }

    // Update per-element specular highlights on glass surfaces
    const glassElements = document.querySelectorAll<HTMLElement>(
      '.card, .glass, .glass-strong, .liquid-glass, .liquid-glass-float, .stat-card, .upload-zone'
    );

    for (const el of glassElements) {
      const rect = el.getBoundingClientRect();
      const elCenterX = rect.left + rect.width / 2;
      const elCenterY = rect.top + rect.height / 2;

      const dx = x - elCenterX;
      const dy = y - elCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 600;

      if (distance < maxDist) {
        const intensity = 1 - distance / maxDist;
        const relX = x - rect.left;
        const relY = y - rect.top;

        el.style.setProperty('--glass-light-x', `${relX}px`);
        el.style.setProperty('--glass-light-y', `${relY}px`);
        el.style.setProperty('--glass-light-intensity', `${intensity}`);
      } else {
        el.style.setProperty('--glass-light-intensity', '0');
      }
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateGlassElements);
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateGlassElements);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateGlassElements]);

  return (
    <>
      {/* ═══ SVG Filter Definitions ═══
          These are referenced by CSS filter: url(#...) on glass elements.
          They never render visually themselves — they're processing pipelines. */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          {/* ── Liquid Glass Refraction Filter ──
              Creates organic distortion like light bending through thick glass */}
          <filter id="liquid-glass-refraction" x="-10%" y="-10%" width="120%" height="120%">
            {/* Step 1: Generate organic noise pattern */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="3"
              seed="1"
              result="noise"
            />
            {/* Step 2: Use noise to displace pixels — actual refraction */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            {/* Step 3: Slight blur to smooth the displacement edges */}
            <feGaussianBlur in="displaced" stdDeviation="0.5" result="smoothed" />
            {/* Step 4: Composite back with original for subtlety */}
            <feBlend in="smoothed" in2="SourceGraphic" mode="normal" />
          </filter>

          {/* ── Specular Light Filter ──
              Creates a smooth, physically-based specular highlight.
              fePointLight position is updated dynamically by JS. */}
          <filter id="liquid-glass-specular" x="-50%" y="-50%" width="200%" height="200%">
            <feSpecularLighting
              in="SourceAlpha"
              specularExponent="80"
              specularConstant="0.6"
              surfaceScale="3"
              lightingColor="rgba(255,255,255,1)"
              result="specular"
            >
              <fePointLight ref={pointLightRef} x={-1000} y={-1000} z={200} />
            </feSpecularLighting>
            {/* Soften the specular highlight for glass caustic feel */}
            <feGaussianBlur in="specular" stdDeviation="8" result="blurredSpec" />
            {/* Only keep the bright parts */}
            <feComposite
              in="blurredSpec"
              in2="SourceAlpha"
              operator="in"
              result="maskedSpec"
            />
            {/* Merge specular on top of original */}
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="maskedSpec" />
            </feMerge>
          </filter>

          {/* ── Combined Glass Filter ──
              Applies both refraction + specular in one pass for elements
              that want the full liquid glass treatment */}
          <filter id="liquid-glass-full" x="-10%" y="-10%" width="120%" height="120%">
            {/* Refraction distortion */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012"
              numOctaves="3"
              seed="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="0.3" result="smoothDisp" />
            {/* Specular highlight */}
            <feSpecularLighting
              in="SourceAlpha"
              specularExponent="60"
              specularConstant="0.4"
              surfaceScale="2"
              lightingColor="rgba(255,255,255,1)"
              result="spec"
            >
              <fePointLight x={500} y={200} z={300} />
            </feSpecularLighting>
            <feGaussianBlur in="spec" stdDeviation="6" result="softSpec" />
            <feComposite in="softSpec" in2="SourceAlpha" operator="in" result="clippedSpec" />
            {/* Combine */}
            <feMerge>
              <feMergeNode in="smoothDisp" />
              <feMergeNode in="clippedSpec" />
            </feMerge>
          </filter>

          {/* ── Subtle Glass Noise Texture ──
              For elements that just need grain without refraction */}
          <filter id="glass-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="4"
              stitchTiles="stitch"
              result="grain"
            />
            <feColorMatrix
              in="grain"
              type="saturate"
              values="0"
              result="grayGrain"
            />
            <feBlend in="SourceGraphic" in2="grayGrain" mode="overlay" />
          </filter>
        </defs>
      </svg>

      {/* Smooth radial light bloom following cursor — uses CSS for buttery performance */}
      <div
        ref={lightRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          background: `radial-gradient(
            700px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
            rgba(255, 255, 255, 0.045) 0%,
            rgba(255, 255, 255, 0.02) 20%,
            rgba(255, 255, 255, 0.005) 45%,
            transparent 65%
          )`,
          mixBlendMode: 'screen',
          transition: 'none',
        }}
      />

      {/* Noise grain texture overlay */}
      <div className="noise-grain" aria-hidden="true" />
    </>
  );
}
