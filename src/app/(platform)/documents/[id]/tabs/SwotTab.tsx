'use client';

import { useState } from 'react';
import { SwotMatrix } from '../SwotMatrix';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WeightedSwot } from '@/components/visualizations/WeightedSwot';
import { CrossImpactMatrix } from '@/components/visualizations/CrossImpactMatrix';
import { StrategicActionCards } from '@/components/visualizations/StrategicActionCards';
import { SwotAnalysisResult } from '@/types';
import { LayoutGrid, Scale, Grid3X3, Sparkles } from 'lucide-react';

interface SwotTabProps {
  swotAnalysis?: SwotAnalysisResult;
}

type SwotView = 'matrix' | 'weighted' | 'cross-impact' | 'actions';

const VIEWS: { id: SwotView; label: string; icon: typeof LayoutGrid; description: string }[] = [
  { id: 'matrix', label: 'Matrix', icon: LayoutGrid, description: 'Classic 2×2 SWOT grid' },
  { id: 'weighted', label: 'Weighted', icon: Scale, description: 'Assign importance weights & balance score' },
  { id: 'cross-impact', label: 'Cross-Impact', icon: Grid3X3, description: 'How strengths/weaknesses interact with threats' },
  { id: 'actions', label: 'Actions', icon: Sparkles, description: 'Strategic action cards from S×O pairs' },
];

export function SwotTab({ swotAnalysis }: SwotTabProps) {
  const [activeView, setActiveView] = useState<SwotView>('matrix');

  if (!swotAnalysis) {
    return (
      <ErrorBoundary sectionName="SWOT Analysis">
        <div className="card">
          <div className="card-body">
            <div className="text-center p-8 text-muted">No SWOT analysis data available.</div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary sectionName="SWOT Analysis">
      <div className="flex flex-col gap-lg">
        {/* View switcher */}
        <div className="card">
          <div className="card-body p-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {VIEWS.map(view => {
                const Icon = view.icon;
                const isActive = activeView === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all duration-150 whitespace-nowrap ${
                      isActive
                        ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30'
                        : 'text-muted hover:text-foreground hover:bg-muted/10 border border-transparent'
                    }`}
                    title={view.description}
                    aria-pressed={isActive}
                  >
                    <Icon size={14} />
                    {view.label}
                  </button>
                );
              })}
              <span className="ml-auto text-[10px] text-muted hidden sm:inline">
                {VIEWS.find(v => v.id === activeView)?.description}
              </span>
            </div>
          </div>
        </div>

        {/* Active view */}
        <div className="card">
          <div className="card-body">
            {activeView === 'matrix' && <SwotMatrix data={swotAnalysis} />}
            {activeView === 'weighted' && (
              <ErrorBoundary sectionName="Weighted SWOT">
                <WeightedSwot data={swotAnalysis} />
              </ErrorBoundary>
            )}
            {activeView === 'cross-impact' && (
              <ErrorBoundary sectionName="Cross-Impact Matrix">
                <CrossImpactMatrix data={swotAnalysis} />
              </ErrorBoundary>
            )}
            {activeView === 'actions' && (
              <ErrorBoundary sectionName="Strategic Action Cards">
                <StrategicActionCards data={swotAnalysis} />
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* Strategic Advice (always visible) */}
        {swotAnalysis.strategicAdvice && activeView !== 'matrix' && (
          <div
            className="card p-4"
            style={{
              background: 'linear-gradient(to right, #0f172a, #1e293b)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <h4
              className="font-semibold mb-2 flex items-center gap-2"
              style={{ color: '#FBBF24' }}
            >
              <Sparkles className="w-4 h-4" /> Strategic Advice
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {swotAnalysis.strategicAdvice}
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
