'use client';

import { useRef, useEffect } from 'react';

interface MinimapNode {
  x: number;
  y: number;
  type: string;
}

interface GraphMinimapProps {
  nodes: MinimapNode[];
  viewportX: number;
  viewportY: number;
  viewportScale: number;
  graphWidth: number;
  graphHeight: number;
  onViewportClick: (x: number, y: number) => void;
}

const NODE_COLORS: Record<string, string> = {
  analysis: '#3b82f6',
  human_decision: '#a855f7',
  person: '#14b8a6',
  bias_pattern: '#f59e0b',
  outcome: '#16A34A',
};

const MINIMAP_WIDTH = 140;
const MINIMAP_HEIGHT = 90;

export function GraphMinimap({
  nodes,
  viewportX,
  viewportY,
  viewportScale,
  graphWidth,
  graphHeight,
  onViewportClick,
}: GraphMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_WIDTH * dpr;
    canvas.height = MINIMAP_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    if (nodes.length === 0) return;

    // Compute bounds
    const xs = nodes.map(n => n.x).filter(x => isFinite(x));
    const ys = nodes.map(n => n.y).filter(y => isFinite(y));
    if (!xs.length) return;

    const minX = Math.min(...xs) - 50;
    const maxX = Math.max(...xs) + 50;
    const minY = Math.min(...ys) - 50;
    const maxY = Math.max(...ys) + 50;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    const scaleX = MINIMAP_WIDTH / rangeX;
    const scaleY = MINIMAP_HEIGHT / rangeY;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (MINIMAP_WIDTH - rangeX * scale) / 2;
    const offsetY = (MINIMAP_HEIGHT - rangeY * scale) / 2;

    // Draw nodes
    for (const node of nodes) {
      if (!isFinite(node.x) || !isFinite(node.y)) continue;
      const x = (node.x - minX) * scale + offsetX;
      const y = (node.y - minY) * scale + offsetY;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = NODE_COLORS[node.type] || '#71717a';
      ctx.fill();
    }

    // Draw viewport rectangle
    const vpW = graphWidth / viewportScale;
    const vpH = graphHeight / viewportScale;
    const vpX = (-viewportX / viewportScale - minX) * scale + offsetX;
    const vpY = (-viewportY / viewportScale - minY) * scale + offsetY;
    const vpRW = vpW * scale;
    const vpRH = vpH * scale;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(vpX, vpY, vpRW, vpRH);
  }, [nodes, viewportX, viewportY, viewportScale, graphWidth, graphHeight]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onViewportClick(x / MINIMAP_WIDTH, y / MINIMAP_HEIGHT);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: MINIMAP_WIDTH,
        height: MINIMAP_HEIGHT,
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        zIndex: 10,
      }}
    />
  );
}
