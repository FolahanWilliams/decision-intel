'use client';

/**
 * Premium lens generation function for enhanced refraction.
 * This is a helper module for LiquidGlassEffect.tsx
 */

export function generatePremiumLensMap(size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2.2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const dx = (x - cx) / maxRadius;
      const dy = (y - cy) / maxRadius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.0) {
        // Multi-zone lens profile for variable thickness
        // Creates concentric zones of different curvatures
        const zone1 = Math.pow(1 - dist * dist, 2.0) * 0.6;
        const zone2 = Math.pow(1 - dist * dist * dist, 1.5) * 0.3;
        const zone3 = Math.sin(dist * Math.PI) * 0.1;

        const strength = zone1 + zone2 + zone3;
        const angle = Math.atan2(dy, dx);

        // Add subtle asymmetry for more realistic glass
        const asymmetry = Math.sin(angle * 3) * 0.1 * (1 - dist);

        const displacementX = Math.cos(angle) * strength * (1 + asymmetry);
        const displacementY = Math.sin(angle) * strength * (1 - asymmetry);

        // Higher displacement values for stronger effect
        data[idx] = Math.round(128 + displacementX * 100);
        data[idx + 1] = Math.round(128 + displacementY * 100);
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