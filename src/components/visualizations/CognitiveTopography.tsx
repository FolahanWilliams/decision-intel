'use client';

import { Brain, Zap, Maximize2, Info, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface CognitiveTopographyProps {
  biasWebImageUrl?: string | null;
  preMortemImageUrl?: string | null;
  onGenerated?: (urls: { biasWebImageUrl?: string; preMortemImageUrl?: string }) => void;
}

export function CognitiveTopography({
  biasWebImageUrl,
  preMortemImageUrl,
  onGenerated,
}: CognitiveTopographyProps) {
  const [activeView, setActiveView] = useState<'bias' | 'premortem'>(
    biasWebImageUrl ? 'bias' : 'premortem'
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localBiasUrl, setLocalBiasUrl] = useState<string | null>(null);
  const [localPreMortemUrl, setLocalPreMortemUrl] = useState<string | null>(null);

  const effectiveBiasUrl = biasWebImageUrl || localBiasUrl;
  const effectivePreMortemUrl = preMortemImageUrl || localPreMortemUrl;
  const hasImages = effectiveBiasUrl || effectivePreMortemUrl;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/insights/generate-topographies', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Generation failed');
        return;
      }
      if (data.biasWebImageUrl) {
        setLocalBiasUrl(data.biasWebImageUrl);
        setActiveView('bias');
      }
      if (data.preMortemImageUrl) {
        setLocalPreMortemUrl(data.preMortemImageUrl);
        if (!data.biasWebImageUrl) setActiveView('premortem');
      }
      onGenerated?.({
        biasWebImageUrl: data.biasWebImageUrl,
        preMortemImageUrl: data.preMortemImageUrl,
      });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="card overflow-hidden h-full">
      <div className="card-header flex items-center justify-between border-b border-border/50 bg-secondary/5">
        <div className="flex items-center gap-sm">
          <Brain size={18} className="text-accent-primary" />
          <h3 className="text-sm font-semibold tracking-tight">Cognitive Topographies</h3>
        </div>
        <div className="flex items-center gap-2">
          {hasImages && (
            <div className="flex bg-secondary/20 p-1 rounded-sm">
              {effectiveBiasUrl && (
                <button
                  onClick={() => setActiveView('bias')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                    activeView === 'bias'
                      ? 'bg-accent-primary text-white shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Bias Web
                </button>
              )}
              {effectivePreMortemUrl && (
                <button
                  onClick={() => setActiveView('premortem')}
                  className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider transition-all ${
                    activeView === 'premortem'
                      ? 'bg-accent-secondary text-white shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Pre-Mortem
                </button>
              )}
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            title={hasImages ? 'Regenerate topographies' : 'Generate topographies'}
            className="p-1.5 rounded-sm border border-accent-primary/30 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          </button>
        </div>
      </div>

      {hasImages ? (
        <>
          <div className="relative aspect-video bg-black/40 flex items-center justify-center group">
            {activeView === 'bias' && effectiveBiasUrl && (
              <div className="w-full h-full relative animate-fade-in">
                {/* eslint-disable-next-line @next/next/no-img-element -- external storage URLs; next/image requires allowlisted domains */}
                <img
                  src={effectiveBiasUrl}
                  alt="Decision Bias Web"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-xs text-white/90 leading-relaxed max-w-lg">
                    <span className="font-bold text-accent-primary">Bias Web:</span> A
                    multi-dimensional mapping of cognitive distortions detected in the decision
                    path. Dimensions represent the 15 core neurocognitive biases.
                  </p>
                </div>
              </div>
            )}

            {activeView === 'premortem' && effectivePreMortemUrl && (
              <div className="w-full h-full relative animate-fade-in">
                {/* eslint-disable-next-line @next/next/no-img-element -- external storage URLs; next/image requires allowlisted domains */}
                <img
                  src={effectivePreMortemUrl}
                  alt="Pre-Mortem Failure Topography"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-xs text-white/90 leading-relaxed max-w-lg">
                    <span className="font-bold text-accent-secondary">Pre-Mortem Topography:</span>{' '}
                    A simulated landscape of failure modes. Peaks represent high-probability failure
                    points identified through red-team simulation.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 bg-black/60 border border-white/10 rounded-sm hover:bg-black/80 text-white transition-colors">
                <Maximize2 size={14} />
              </button>
              <button className="p-1.5 bg-black/60 border border-white/10 rounded-sm hover:bg-black/80 text-white transition-colors">
                <Info size={14} />
              </button>
            </div>
          </div>

          <div className="px-4 py-3 bg-secondary/5 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={12} className="text-warning" />
              <span className="text-[10px] text-muted font-medium italic">
                Visualizations generated by Nano Banana 2 Decision Engine
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-accent-primary" />
                <span className="text-[10px] text-muted">Density = Severity</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-accent-secondary" />
                <span className="text-[10px] text-muted">Distance = Correlation</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card-body flex flex-col items-center justify-center flex-1 py-12 text-center">
          {generating ? (
            <>
              <Loader2 size={32} className="text-accent-primary animate-spin mb-4" />
              <p className="text-sm font-medium text-muted mb-1">Generating topographies...</p>
              <p className="text-xs text-muted/70 max-w-[220px]">
                Creating Bias Web and Pre-Mortem visualizations. This may take a moment.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center mb-4">
                <Brain size={28} className="text-accent-primary/60" />
              </div>
              <p className="text-sm font-medium text-muted mb-1">No topographies generated yet</p>
              <p className="text-xs text-muted/70 max-w-[220px] mb-4">
                Bias Web and Pre-Mortem visualizations will appear here after generation.
              </p>
              {error && <p className="text-xs text-error mb-3 max-w-[240px]">{error}</p>}
              <button
                onClick={handleGenerate}
                className="px-4 py-2 text-xs font-semibold bg-accent-primary/20 border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/30 transition-colors flex items-center gap-2"
              >
                <Sparkles size={14} />
                Generate Topographies
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
