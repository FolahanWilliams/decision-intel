'use client';

import { useMemo, useState } from 'react';

interface RiskHeatMapProps {
  risks: Array<{
    category: string;
    impact: number;
    probability: number;
    description?: string;
  }>;
}

export function RiskHeatMap({ risks = [] }: RiskHeatMapProps) {
  const gridSize = 5;
  const [selectedCell, setSelectedCell] = useState<{ impact: number; probability: number } | null>(
    null
  );

  const heatMapData = useMemo(() => {
    const grid: ((typeof risks)[0] & { count: number; risks: typeof risks })[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    risks.forEach(risk => {
      const impactIndex = Math.min(gridSize - 1, Math.floor((risk.impact / 100) * gridSize));
      const probIndex = Math.min(gridSize - 1, Math.floor((risk.probability / 100) * gridSize));

      if (!grid[impactIndex][probIndex]) {
        grid[impactIndex][probIndex] = { ...risk, count: 1, risks: [risk] };
      } else {
        grid[impactIndex][probIndex].count++;
        grid[impactIndex][probIndex].risks.push(risk);
      }
    });

    return grid;
  }, [risks]);

  const getCellColor = (impact: number, probability: number) => {
    const riskScore = (impact * probability) / 100;
    if (riskScore >= 70) return { bg: 'bg-error', label: 'Critical' };
    if (riskScore >= 50) return { bg: 'bg-accent-primary', label: 'High' };
    if (riskScore >= 30) return { bg: 'bg-warning', label: 'Medium' };
    if (riskScore >= 15) return { bg: 'bg-success', label: 'Low' };
    return { bg: 'bg-success/70', label: 'Low' };
  };

  const getOpacity = (count: number) => {
    return Math.min(1, 0.4 + count * 0.15); // Adjusted opacity range
  };

  const handleCellClick = (impactIndex: number, probIndex: number) => {
    if (selectedCell?.impact === impactIndex && selectedCell?.probability === probIndex) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ impact: impactIndex, probability: probIndex });
    }
  };

  const filteredRisks = useMemo(() => {
    if (!selectedCell) return risks;
    const cell = heatMapData[selectedCell.impact][selectedCell.probability];
    return cell ? cell.risks : [];
  }, [selectedCell, risks, heatMapData]);

  return (
    <div className="p-4">
      <div className="flex items-end gap-8">
        {/* Y-axis label */}
        <div className="flex flex-col items-center">
          <span
            className="text-xs text-muted mb-2"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Impact
          </span>
        </div>

        <div>
          {/* Grid */}
          <div
            className="grid gap-1 relative"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
              aspectRatio: '1',
              maxWidth: '480px',
              width: '100%',
            }}
          >
            {/* Gradient Background for "Zones" */}
            <div className="absolute inset-0 bg-gradient-to-tr from-success/10 via-warning/5 to-error/10 pointer-events-none " />

            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const row = Math.floor(idx / gridSize);
              const col = idx % gridSize;
              const cell = heatMapData[row][col];
              const impact = ((gridSize - row) / gridSize) * 100;
              const probability = ((col + 1) / gridSize) * 100;

              const isSelected = selectedCell?.impact === row && selectedCell?.probability === col;
              const cellStyle = getCellColor(impact, probability);

              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    cell
                      ? `${cellStyle.label} risk zone: ${cell.count} risks, Impact ${Math.round(impact)}%, Probability ${Math.round(probability)}%`
                      : 'Empty zone'
                  }
                  aria-pressed={isSelected}
                  onClick={() => handleCellClick(row, col)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCellClick(row, col);
                    }
                  }}
                  className={`
                    relative  flex items-center justify-center cursor-pointer
                    transition-all duration-200 border border-transparent
                    ${cell ? cellStyle.bg : 'hover:bg-white/5'}
                    ${isSelected ? 'ring-2 ring-accent-primary scale-105 z-10 ' : 'hover:scale-105 hover:z-10'}
                  `}
                  style={{
                    opacity: cell ? getOpacity(cell.count) : 0.1,
                  }}
                  title={
                    cell
                      ? `${cell.count} Risks (Impact ${Math.round(impact)}%, Prob ${Math.round(probability)}%)`
                      : 'No risks'
                  }
                >
                  {cell && (
                    <div className="flex flex-col items-center">
                      <span className="text-white font-bold text-lg drop-shadow-md">
                        {cell.count}
                      </span>
                      <span className="text-white/80 text-[9px] leading-tight drop-shadow-md">
                        {cellStyle.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis label */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted">Probability</span>
          </div>

          {/* Axis values */}
          <div className="flex justify-between mt-1 px-0">
            {[0, 25, 50, 75, 100].map((val, idx) => (
              <span key={idx} className="text-[10px] text-muted">
                {val}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-6" role="list" aria-label="Risk severity legend">
        <div className="flex items-center gap-2" role="listitem" aria-label="Low severity - green">
          <div className="w-4 h-4 bg-success/70 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white leading-none" aria-hidden="true">{'\u2713'}</span>
          </div>
          <span className="text-xs text-muted">Low</span>
        </div>
        <div className="flex items-center gap-2" role="listitem" aria-label="Medium severity - amber">
          <div className="w-4 h-4 bg-warning flex items-center justify-center">
            <span className="text-[8px] font-bold text-white leading-none" aria-hidden="true">{'\u2014'}</span>
          </div>
          <span className="text-xs text-muted">Medium</span>
        </div>
        <div className="flex items-center gap-2" role="listitem" aria-label="High severity - blue">
          <div className="w-4 h-4 bg-accent-primary flex items-center justify-center">
            <span className="text-[8px] font-bold text-white leading-none" aria-hidden="true">!</span>
          </div>
          <span className="text-xs text-muted">High</span>
        </div>
        <div className="flex items-center gap-2" role="listitem" aria-label="Critical severity - red">
          <div className="w-4 h-4 bg-error flex items-center justify-center">
            <span className="text-[8px] font-bold text-white leading-none" aria-hidden="true">{'\u2716'}</span>
          </div>
          <span className="text-xs text-muted">Critical</span>
        </div>
      </div>

      {/* Risk list */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium">
            {selectedCell ? 'Risks in Selected Zone' : 'All Identified Risks'}
          </h5>
          {selectedCell && (
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs text-accent-primary hover:underline"
            >
              Show All
            </button>
          )}
        </div>

        {filteredRisks.length > 0 ? (
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {filteredRisks.map((risk, idx) => (
              <div
                key={idx}
                className="p-3  bg-secondary/30 border border-white/5 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="font-medium text-sm text-foreground/90">{risk.category}</span>
                  <div className="flex gap-1">
                    <span className={`text-[10px] px-1.5 py-0.5  bg-white/10 text-muted`}>
                      I: {Math.round(risk.impact)}%
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5  bg-white/10 text-muted`}>
                      P: {Math.round(risk.probability)}%
                    </span>
                  </div>
                </div>
                {risk.description && (
                  <p className="text-xs text-muted line-clamp-2">{risk.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted text-sm border border-dashed border-white/10 ">
            No risks found in this zone.
          </div>
        )}
      </div>
    </div>
  );
}
