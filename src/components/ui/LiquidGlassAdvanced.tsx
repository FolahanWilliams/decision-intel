'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Advanced Liquid Glass Effects System
 *
 * Builds on the existing liquid glass with:
 * - Holographic glass variants with iridescent shimmer
 * - Depth-based progressive blur
 * - Glass morphing between states
 * - Performance-aware rendering tiers
 * - Enhanced micro-interactions
 */

// Performance tier detection
export type PerformanceTier = 'ultra' | 'high' | 'medium' | 'low' | 'accessibility';

function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'medium';

  // Check for reduced motion preference first
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'accessibility';
  }

  // Simple GPU detection based on device memory and core count
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  if (memory >= 8 && cores >= 8) return 'ultra';
  if (memory >= 4 && cores >= 4) return 'high';
  if (memory >= 2 && cores >= 2) return 'medium';
  return 'low';
}

// Generate holographic interference pattern
function generateHolographicMap(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Create interference pattern
      const wave1 = Math.sin(x * 0.02) * Math.cos(y * 0.02);
      const wave2 = Math.sin((x + y) * 0.015);
      const wave3 = Math.cos(x * 0.01) * Math.sin(y * 0.025);

      const interference = (wave1 + wave2 + wave3) / 3;

      // Map to displacement with color-coded channels
      data[idx] = Math.round(128 + interference * 30); // R
      data[idx + 1] = Math.round(128 - interference * 20); // G
      data[idx + 2] = Math.round(128 + interference * 25); // B
      data[idx + 3] = 255; // A
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

// Generate depth-aware blur map
function generateDepthMap(layers: number = 3): string {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Create gradient layers for depth
  for (let i = 0; i < layers; i++) {
    const opacity = 1 - i / layers;
    const blur = i * 2;

    ctx.globalAlpha = opacity;
    ctx.filter = `blur(${blur}px)`;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

    gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  return canvas.toDataURL('image/png');
}

export function useGlassPerformance() {
  const reducedMotion = useReducedMotion();

  // Calculate tier directly from reducedMotion state
  const tier = reducedMotion ? 'accessibility' : detectPerformanceTier();

  return tier;
}

export function LiquidGlassAdvanced() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tier = useGlassPerformance();
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize advanced filters
  useEffect(() => {
    if (tier === 'low' || tier === 'accessibility') return;

    // Generate holographic map for ultra/high tiers
    if (tier === 'ultra' || tier === 'high') {
      const holoMap = generateHolographicMap(512, 512);
      const feImageHolo = document.getElementById('liquid-glass-holographic-image');
      if (feImageHolo) {
        feImageHolo.setAttribute('href', holoMap);
      }
    }

    // Generate depth map for ultra tier
    if (tier === 'ultra') {
      const depthMap = generateDepthMap(5);
      const feImageDepth = document.getElementById('liquid-glass-depth-image');
      if (feImageDepth) {
        feImageDepth.setAttribute('href', depthMap);
      }
    }
  }, [tier]);

  // Smart rendering with Intersection Observer
  useEffect(() => {
    if (tier === 'accessibility') return;

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            // Enable glass effects when visible
            target.classList.add('liquid-glass-active');
          } else {
            // Keep glass visible but remove active state for performance
            target.classList.remove('liquid-glass-active');
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    // Observe all glass elements
    const glassElements = document.querySelectorAll(
      '.liquid-glass-advanced, .liquid-glass-holographic, .liquid-glass-morph'
    );

    glassElements.forEach(el => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [tier]);

  return (
    <>
      <svg
        ref={svgRef}
        aria-hidden="true"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          {/* Holographic Interference Pattern */}
          <filter id="liquid-glass-holographic" x="-20%" y="-20%" width="140%" height="140%">
            <feImage
              id="liquid-glass-holographic-image"
              href=""
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="holo_map"
            />

            {/* Color channel separation for iridescent effect */}
            <feComponentTransfer in="holo_map" result="red_channel">
              <feFuncR type="identity" />
              <feFuncG type="discrete" tableValues="0" />
              <feFuncB type="discrete" tableValues="0" />
            </feComponentTransfer>

            <feComponentTransfer in="holo_map" result="green_channel">
              <feFuncR type="discrete" tableValues="0" />
              <feFuncG type="identity" />
              <feFuncB type="discrete" tableValues="0" />
            </feComponentTransfer>

            <feComponentTransfer in="holo_map" result="blue_channel">
              <feFuncR type="discrete" tableValues="0" />
              <feFuncG type="discrete" tableValues="0" />
              <feFuncB type="identity" />
            </feComponentTransfer>

            {/* Combine with displacement */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="red_channel"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="R"
              result="displaced_r"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="green_channel"
              scale="6"
              xChannelSelector="G"
              yChannelSelector="G"
              result="displaced_g"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="blue_channel"
              scale="10"
              xChannelSelector="B"
              yChannelSelector="B"
              result="displaced_b"
            />

            {/* Blend displaced channels */}
            <feBlend in="displaced_r" in2="displaced_g" mode="screen" result="rg" />
            <feBlend in="rg" in2="displaced_b" mode="screen" />
          </filter>

          {/* Progressive Depth Blur */}
          <filter id="liquid-glass-depth" x="-50%" y="-50%" width="200%" height="200%">
            <feImage
              id="liquid-glass-depth-image"
              href=""
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="depth_map"
            />

            {/* Multi-layer blur based on depth */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur3" />

            {/* Composite based on depth map */}
            <feComposite
              in="blur1"
              in2="depth_map"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="0"
              k4="0"
              result="layer1"
            />
            <feComposite
              in="blur2"
              in2="depth_map"
              operator="arithmetic"
              k1="0"
              k2="0.5"
              k3="0.5"
              k4="0"
              result="layer2"
            />
            <feComposite
              in="blur3"
              in2="depth_map"
              operator="arithmetic"
              k1="0"
              k2="0.3"
              k3="0.7"
              k4="0"
              result="layer3"
            />

            <feComposite in="layer1" in2="layer2" operator="over" result="comp1" />
            <feComposite in="comp1" in2="layer3" operator="over" />
          </filter>

          {/* Glass Morphing Animation Filter */}
          <filter id="liquid-glass-morph">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.01 0.02"
              numOctaves="2"
              seed="2"
              result="turbulence"
            >
              <animate
                attributeName="baseFrequency"
                dur="20s"
                values="0.01 0.02;0.02 0.04;0.01 0.02"
                repeatCount="indefinite"
              />
            </feTurbulence>

            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Performance indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 px-2 py-1 text-xs font-mono bg-black/80 text-white rounded">
          Glass: {tier}
        </div>
      )}
    </>
  );
}
