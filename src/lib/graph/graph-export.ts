/**
 * Graph export utilities — PNG, SVG, DOT format.
 */

interface ExportNode {
  id: string;
  type: string;
  label: string;
  score: number;
}

interface ExportEdge {
  source: string | { id: string };
  target: string | { id: string };
  edgeType: string;
  strength: number;
}

function eid(e: ExportEdge, side: 'source' | 'target'): string {
  const v = e[side];
  return typeof v === 'string' ? v : v.id;
}

/**
 * Export SVG element as a PNG Blob.
 */
export async function exportToPng(svgElement: SVGSVGElement): Promise<Blob> {
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load timeout'));
    }, 10000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      canvas.width = svgElement.clientWidth * 2;
      canvas.height = svgElement.clientHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas context unavailable')); return; }
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob'));
      }, 'image/png');
    };
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    img.src = url;
  });
}

/**
 * Export SVG element as an SVG string.
 */
export function exportToSvg(svgElement: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgElement);
}

/**
 * Export graph data as Graphviz DOT format.
 */
export function exportToDot(nodes: ExportNode[], edges: ExportEdge[]): string {
  const lines: string[] = ['digraph DecisionGraph {'];
  lines.push('  rankdir=LR;');
  lines.push('  bgcolor="#09090b";');
  lines.push('  node [style=filled, fontname="JetBrains Mono", fontsize=10, fontcolor=white];');
  lines.push('  edge [fontname="JetBrains Mono", fontsize=8, fontcolor="#71717a"];');
  lines.push('');

  const shapeMap: Record<string, string> = {
    analysis: 'ellipse',
    human_decision: 'box',
    person: 'diamond',
    bias_pattern: 'triangle',
    outcome: 'star',
  };

  const colorMap: Record<string, string> = {
    analysis: '#3b82f6',
    human_decision: '#a855f7',
    person: '#14b8a6',
    bias_pattern: '#f59e0b',
    outcome: '#6366f1',
  };

  for (const node of nodes) {
    const shape = shapeMap[node.type] || 'ellipse';
    const color = colorMap[node.type] || '#71717a';
    const label = node.label.replace(/"/g, '\\"').slice(0, 40);
    lines.push(`  "${node.id}" [label="${label}", shape=${shape}, fillcolor="${color}"];`);
  }

  lines.push('');

  for (const edge of edges) {
    const src = eid(edge, 'source');
    const tgt = eid(edge, 'target');
    const label = edge.edgeType.replace(/_/g, ' ');
    const penwidth = (1 + edge.strength * 2).toFixed(1);
    lines.push(`  "${src}" -> "${tgt}" [label="${label}", penwidth=${penwidth}];`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Trigger a download of a blob or string content.
 */
export function downloadFile(content: Blob | string, filename: string, mimeType?: string) {
  const blob = typeof content === 'string'
    ? new Blob([content], { type: mimeType || 'text/plain' })
    : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
