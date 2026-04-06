/**
 * SVG-to-PNG export utility.
 *
 * Converts an in-page SVG element to a rasterized PNG using the Canvas API.
 * No external dependencies — works in all modern browsers.
 */

function inlineStyles(svg: SVGElement): SVGElement {
  const clone = svg.cloneNode(true) as SVGElement;
  const elements = clone.querySelectorAll('*');
  const originalElements = svg.querySelectorAll('*');

  elements.forEach((el, i) => {
    const orig = originalElements[i];
    if (!orig) return;
    const computed = getComputedStyle(orig);
    const important = [
      'fill',
      'stroke',
      'stroke-width',
      'stroke-dasharray',
      'font-family',
      'font-size',
      'font-weight',
      'opacity',
      'color',
      'text-anchor',
      'dominant-baseline',
      'letter-spacing',
    ];
    for (const prop of important) {
      const val = computed.getPropertyValue(prop);
      if (val) {
        (el as HTMLElement).style.setProperty(prop, val);
      }
    }
  });

  return clone;
}

function svgToBlob(svgEl: SVGElement): Blob {
  const clone = inlineStyles(svgEl);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const xml = new XMLSerializer().serializeToString(clone);
  return new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
}

function rasterize(svgEl: SVGElement, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = svgToBlob(svgEl);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // 2x for retina
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        pngBlob => {
          if (pngBlob) resolve(pngBlob);
          else reject(new Error('toBlob returned null'));
        },
        'image/png',
        1.0
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG as image'));
    };
    img.src = url;
  });
}

export async function downloadSvgAsPng(
  svgEl: SVGElement,
  filename: string,
  width: number,
  height: number
): Promise<void> {
  const blob = await rasterize(svgEl, width, height);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copySvgToClipboard(
  svgEl: SVGElement,
  width: number,
  height: number
): Promise<void> {
  const blob = await rasterize(svgEl, width, height);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
