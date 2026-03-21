'use client';

import { useState, useMemo } from 'react';
import { SwotAnalysisResult } from '@/types';
import { Grid3X3, X, Shield, Zap } from 'lucide-react';

interface CrossImpactMatrixProps {
  data: SwotAnalysisResult;
}

type CellKey = `${number}-${number}`;

/**
 * Cross-Impact Matrix: shows how strengths can counter threats (S-T),
 * and how weaknesses amplify threats (W-T). Click cells to see details.
 */
export function CrossImpactMatrix({ data }: CrossImpactMatrixProps) {
  const [mode, setMode] = useState<'st' | 'wt'>('st');
  const [selectedCell, setSelectedCell] = useState<CellKey | null>(null);

  const rows = mode === 'st' ? data.strengths : data.weaknesses;
  const cols = data.threats;

  // Generate impact scores based on keyword overlap (heuristic)
  const impactMatrix = useMemo(() => {
    const matrix: Record<CellKey, { score: number; analysis: string }> = {};

    rows.forEach((row, ri) => {
      cols.forEach((col, ci) => {
        const key: CellKey = `${ri}-${ci}`;
        // Simple keyword overlap heuristic for impact scoring
        const rowWords = new Set(
          row.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3)
        );
        const colWords = col.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        const overlap = colWords.filter(w => rowWords.has(w)).length;
        const maxOverlap = Math.max(colWords.length, 1);
        const rawScore = Math.min((overlap / maxOverlap) * 5, 5);
        // Add baseline score so even unrelated items have some impact
        const score = Math.round(Math.max(rawScore, 1) * 10) / 10;

        const verb = mode === 'st' ? 'counter' : 'amplify';
        const analysis =
          score >= 3
            ? `High ${mode === 'st' ? 'defensive' : 'risk'} relevance: This ${mode === 'st' ? 'strength can directly ' + verb : 'weakness may ' + verb} this threat due to thematic overlap.`
            : score >= 2
              ? `Moderate relevance: There is an indirect relationship between this ${mode === 'st' ? 'strength' : 'weakness'} and threat.`
              : `Low direct relevance: These items address different strategic dimensions, but systemic effects may exist.`;

        matrix[key] = { score, analysis };
      });
    });

    return matrix;
  }, [rows, cols, mode]);

  const getCellColor = (score: number) => {
    if (mode === 'st') {
      // Green = strong counter
      if (score >= 3) return 'bg-emerald-500/30 hover:bg-emerald-500/40';
      if (score >= 2) return 'bg-emerald-500/15 hover:bg-emerald-500/25';
      return 'bg-emerald-500/5 hover:bg-emerald-500/10';
    } else {
      // Red = strong amplification
      if (score >= 3) return 'bg-rose-500/30 hover:bg-rose-500/40';
      if (score >= 2) return 'bg-rose-500/15 hover:bg-rose-500/25';
      return 'bg-rose-500/5 hover:bg-rose-500/10';
    }
  };

  if (rows.length === 0 || cols.length === 0) {
    return (
      <div className="text-center p-6 text-muted text-sm">
        Not enough SWOT data for cross-impact analysis.
      </div>
    );
  }

  const selectedData = selectedCell ? impactMatrix[selectedCell] : null;
  const [selRow, selCol] = selectedCell
    ? selectedCell.split('-').map(Number)
    : [null, null];

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Grid3X3 size={16} className="text-accent-primary" />
          <span className="text-sm font-semibold">Cross-Impact Matrix</span>
        </div>
        <div className="flex border border-border overflow-hidden text-xs">
          <button
            onClick={() => { setMode('st'); setSelectedCell(null); }}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
              mode === 'st' ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted hover:text-foreground'
            }`}
          >
            <Shield size={12} /> Strengths vs Threats
          </button>
          <button
            onClick={() => { setMode('wt'); setSelectedCell(null); }}
            className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-border transition-colors ${
              mode === 'wt' ? 'bg-rose-500/20 text-rose-400' : 'text-muted hover:text-foreground'
            }`}
          >
            <Zap size={12} /> Weaknesses vs Threats
          </button>
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-muted font-normal border border-border bg-secondary/30 min-w-[120px]">
                {mode === 'st' ? 'Strength' : 'Weakness'} ↓ / Threat →
              </th>
              {cols.map((col, ci) => (
                <th
                  key={ci}
                  className={`p-2 text-left font-normal border border-border bg-amber-500/5 min-w-[100px] max-w-[150px] ${
                    selCol === ci ? 'ring-1 ring-amber-400/50' : ''
                  }`}
                  title={col}
                >
                  <span className="line-clamp-2">{col}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td
                  className={`p-2 border border-border font-medium min-w-[120px] max-w-[180px] ${
                    mode === 'st' ? 'bg-emerald-500/5' : 'bg-rose-500/5'
                  } ${selRow === ri ? 'ring-1 ring-accent-primary/50' : ''}`}
                  title={row}
                >
                  <span className="line-clamp-2">{row}</span>
                </td>
                {cols.map((_, ci) => {
                  const key: CellKey = `${ri}-${ci}`;
                  const cell = impactMatrix[key];
                  const isSelected = selectedCell === key;

                  return (
                    <td
                      key={ci}
                      className={`p-2 border border-border text-center cursor-pointer transition-all duration-150 ${getCellColor(cell.score)} ${
                        isSelected ? 'ring-2 ring-accent-primary ring-offset-1 ring-offset-transparent' : ''
                      }`}
                      onClick={() => setSelectedCell(isSelected ? null : key)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Impact score ${cell.score} — click for details`}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCell(isSelected ? null : key);
                        }
                      }}
                    >
                      <span className="font-bold tabular-nums">{cell.score}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected cell detail panel */}
      {selectedData && selRow !== null && selCol !== null && (
        <div className="p-4 border border-accent-primary/30 bg-accent-primary/5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-accent-primary uppercase">
              Impact Analysis
            </span>
            <button
              onClick={() => setSelectedCell(null)}
              className="p-0.5 text-muted hover:text-foreground"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="p-2 bg-muted/20 text-xs">
              <span className={`font-semibold ${mode === 'st' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mode === 'st' ? 'Strength' : 'Weakness'}:
              </span>
              <p className="text-foreground/80 mt-1">{rows[selRow]}</p>
            </div>
            <div className="p-2 bg-muted/20 text-xs">
              <span className="font-semibold text-amber-400">Threat:</span>
              <p className="text-foreground/80 mt-1">{cols[selCol]}</p>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed">{selectedData.analysis}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-muted">Impact Score:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <div
                  key={n}
                  className={`w-4 h-1.5 ${
                    n <= selectedData.score
                      ? mode === 'st'
                        ? 'bg-emerald-400'
                        : 'bg-rose-400'
                      : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted">
        <span>Impact: </span>
        <span className="flex items-center gap-1">
          <span className={`w-3 h-2 ${mode === 'st' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`} /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-3 h-2 ${mode === 'st' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} /> Medium
        </span>
        <span className="flex items-center gap-1">
          <span className={`w-3 h-2 ${mode === 'st' ? 'bg-emerald-500/40' : 'bg-rose-500/40'}`} /> High
        </span>
        <span className="ml-auto">Click any cell for details</span>
      </div>
    </div>
  );
}
