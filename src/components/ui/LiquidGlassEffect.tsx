'use client';

import { useEffect, useRef, useCallback } from 'react';
import { generatePremiumLensMap } from './LiquidGlassPremium';

/**
 * LiquidGlassEffect — Apple-style liquid glass with real lens refraction.
 *
 * Key difference from basic glassmorphism: uses a canvas-generated convex lens
 * displacement map applied via SVG feDisplacementMap + backdrop-filter.
 * This actually warps what's BEHIND the glass element (real refraction),
 * not the element itself.
 *
 * The displacement map encodes a convex lens shape:
 * - Red channel = X displacement (128 = neutral, <128 = shift left, >128 = shift right)
 * - Green channel = Y displacement (same encoding)
 * - Creates outward radial distortion like looking through curved glass
 *
 * Layers:
 * 1. backdrop-filter refraction (SVG displacement map)
 * 2. Per-element specular highlight (CSS radial gradient tracking cursor)
 * 3. Edge rim light (inset box-shadow)
 * 4. Global ambient light bloom (radial gradient following cursor)
 */

// Generate a convex lens displacement map as a data URL
function generateLensMap(size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const dx = (x - cx) / maxRadius;
      const dy = (y - cy) / maxRadius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.0) {
        // Convex lens profile: displacement increases then falls at edges
        // Using a smooth bell curve for natural glass refraction
        const strength = Math.pow(1 - dist * dist, 1.5);
        const angle = Math.atan2(dy, dx);

        // Outward radial displacement (light bends outward through convex glass)
        const displacementX = Math.cos(angle) * strength;
        const displacementY = Math.sin(angle) * strength;

        // Encode as RGB: 128 = no displacement, 0-127 = negative, 129-255 = positive
        data[idx] = Math.round(128 + displacementX * 80);     // R = X offset
        data[idx + 1] = Math.round(128 + displacementY * 80); // G = Y offset
        data[idx + 2] = 128;                                   // B = unused
        data[idx + 3] = 255;                                   // A = fully opaque
      } else {
        // Outside lens: neutral (no displacement)
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export function LiquidGlassEffect() {
  const lightRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const lensMapRef = useRef<string>('');

  // Generate lens displacement map on mount
  useEffect(() => {
    const mapUrl = generateLensMap(256);
    lensMapRef.current = mapUrl;

    // Inject the displacement map into the SVG filter
    const feImage = document.getElementById('liquid-glass-lens-image');
    if (feImage) {
      feImage.setAttribute('href', mapUrl);
    }

    // Also generate a rectangular version for cards
    const rectMap = generateRectLensMap(512, 256);
    const feImageRect = document.getElementById('liquid-glass-card-lens-image');
    if (feImageRect) {
      feImageRect.setAttribute('href', rectMap);
    }

    // Generate premium lens with variable thickness for enhanced refraction
    const premiumMap = generatePremiumLensMap(512);
    const feImagePremium = document.getElementById('liquid-glass-premium-lens-image');
    if (feImagePremium) {
      feImagePremium.setAttribute('href', premiumMap);
    }
  }, []);

  const updateGlassElements = useCallback(() => {
    const { x, y } = mouseRef.current;

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
          backdrop-filter: url(#...) applies these to what's BEHIND the element.
          This is the key difference — it refracts the background, not the element. */}
      <svg
        ref={svgRef}
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          {/* ── Convex Lens Refraction ──
              Uses a canvas-generated displacement map encoding a convex lens shape.
              feDisplacementMap warps backdrop pixels through the lens pattern.
              This creates real optical distortion like looking through curved glass. */}
          <filter id="liquid-glass-refraction" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feImage
              id="liquid-glass-lens-image"
              href=""
              x="0" y="0"
              width="100%" height="100%"
              preserveAspectRatio="none"
              result="lens_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="lens_map"
              scale="18"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* ── Card-optimized lens (wider aspect ratio) ── */}
          <filter id="liquid-glass-card" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feImage
              id="liquid-glass-card-lens-image"
              href=""
              x="0" y="0"
              width="100%" height="100%"
              preserveAspectRatio="none"
              result="card_lens_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="card_lens_map"
              scale="12"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* ── Subtle Glass Noise Texture ── */}
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

          {/* ── Chromatic Aberration (Color Fringing) ── */}
          <filter id="chromatic-aberration" x="-10%" y="-10%" width="120%" height="120%">
            <feOffset in="SourceGraphic" dx="-0.5" dy="0" result="redShift"/>
            <feComponentTransfer in="redShift" result="red">
              <feFuncR type="identity"/>
              <feFuncG type="discrete" tableValues="0"/>
              <feFuncB type="discrete" tableValues="0"/>
              <feFuncA type="identity"/>
            </feComponentTransfer>

            <feOffset in="SourceGraphic" dx="0.5" dy="0" result="blueShift"/>
            <feComponentTransfer in="blueShift" result="blue">
              <feFuncR type="discrete" tableValues="0"/>
              <feFuncG type="discrete" tableValues="0"/>
              <feFuncB type="identity"/>
              <feFuncA type="identity"/>
            </feComponentTransfer>

            <feComposite in="red" in2="SourceGraphic" operator="arithmetic" k1="0" k2="0.5" k3="0.5" k4="0" result="redGreen"/>
            <feComposite in="redGreen" in2="blue" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0"/>
          </filter>

          {/* ── Enhanced Refraction with Chromatic Shift ── */}
          <filter id="liquid-glass-premium" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feImage
              id="liquid-glass-premium-lens-image"
              href=""
              x="0" y="0"
              width="100%" height="100%"
              preserveAspectRatio="none"
              result="premium_lens_map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="premium_lens_map"
              scale="22"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="0.3" result="blurred"/>
            <feComposite in="blurred" in2="displaced" operator="over"/>
          </filter>
        </defs>
      </svg>

      {/* Smooth radial light bloom following cursor */}
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

/**
 * Generate a rectangular lens displacement map for card-shaped elements.
 * Uses a squircle profile (rounded rectangle) instead of a circle.
 */
function generateRectLensMap(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Normalize to -1..1 range
      const nx = (x - cx) / cx;
      const ny = (y - cy) / cy;

      // Squircle distance (p=4 for smooth rounded rect)
      const dist = Math.pow(Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4), 0.25);

      if (dist < 1.0) {
        // Smooth convex lens profile
        const strength = Math.pow(1 - dist * dist, 1.8);
        const angle = Math.atan2(ny, nx);

        const displacementX = Math.cos(angle) * strength;
        const displacementY = Math.sin(angle) * strength;

        data[idx] = Math.round(128 + displacementX * 60);
        data[idx + 1] = Math.round(128 + displacementY * 60);
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      } else {
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
