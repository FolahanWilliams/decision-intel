'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * LiquidGlassEffect — Interactive light refraction that follows the mouse cursor.
 *
 * Renders a full-viewport overlay (pointer-events: none) with a radial light bloom
 * that tracks the mouse. Glass panels (.card, .glass, .liquid-glass, .stat-card)
 * receive per-element specular highlights based on cursor proximity.
 */
export function LiquidGlassEffect() {
  const lightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const updateGlassElements = useCallback(() => {
    const { x, y } = mouseRef.current;

    // Update the global light bloom position
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
      const maxDist = 500;

      if (distance < maxDist) {
        const intensity = 1 - distance / maxDist;
        // Position relative to element
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
    <div
      ref={lightRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        /* Radial light bloom following cursor */
        background: `radial-gradient(
          600px circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px),
          rgba(255, 255, 255, 0.035) 0%,
          rgba(255, 255, 255, 0.015) 25%,
          transparent 60%
        )`,
        mixBlendMode: 'screen',
        transition: 'none',
      }}
    />
  );
}
